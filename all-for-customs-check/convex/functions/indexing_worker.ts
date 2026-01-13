// convex/functions/indexing_worker.ts
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

type IndexSelector = {
  eq: (field: string, value: string | boolean) => unknown;
};

// New selector: tenant + pending + corpus_version
const pendingCorpusSelector =
  (tenant_id: string, corpus_version: string) =>
  (q: IndexSelector) =>
    q.eq("tenant_id", tenant_id).eq("index_pending", true).eq("corpus_version", corpus_version);

export const indexPendingChunks = mutation({
  args: {
    tenant_id: v.string(),
    limit: v.number(),
    indexed_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = args.indexed_at ?? new Date().toISOString();

    // Enforce active corpus (single source of truth)
    const settings = await ctx.runQuery(api.functions.tenant_settings.getTenantSettings, {
      tenant_id: args.tenant_id,
    });
    const activeCorpus = settings.active_corpus_version;

    // Only pending chunks in active corpus
    const pending = await ctx.db
      .query("chunks")
      .withIndex("by_tenant_pending_corpus", pendingCorpusSelector(args.tenant_id, activeCorpus))
      .take(args.limit);

    const payload: Array<{
      chunk_id: string;
      document_id: string;
      text: string;
      language: string;
      jurisdiction: string;
      instrument_type: string;
      trust_level: string;
      corpus_version: string;
      citation: unknown;
    }> = [];

    for (const chunk of pending) {
      const citation = await ctx.db
        .query("citations")
        .withIndex("by_tenant_citation_id", (q) =>
          q.eq("tenant_id", args.tenant_id).eq("citation_id", chunk.citation_id)
        )
        .first();

      // Guardrail: citation must exist with proof + page range.
      if (
        !citation ||
        !citation.snapshot_hash_sha256 ||
        !citation.locator?.page_from ||
        !citation.locator?.page_to
      ) {
        return { ok: false, error: "missing_citation_proof" as const, chunk_id: chunk.chunk_id };
      }

      payload.push({
        chunk_id: chunk.chunk_id,
        document_id: chunk.document_id,
        text: chunk.text,
        language: chunk.language,
        jurisdiction: chunk.jurisdiction,
        instrument_type: chunk.instrument_type,
        trust_level: chunk.trust_level,
        corpus_version: chunk.corpus_version,
        citation,
      });

      await ctx.db.patch(chunk._id, { index_pending: false, indexed_at: now });
    }

    return {
      ok: true,
      indexed: payload.length,
      indexed_at: now,
      tenant_id: args.tenant_id,
      active_corpus_version: activeCorpus,
      payload,
    };
  },
});

export const pendingIndexCount = query({
  args: { tenant_id: v.string() },
  handler: async (ctx, args) => {
    // Enforce active corpus
    const settings = await ctx.runQuery(api.functions.tenant_settings.getTenantSettings, {
      tenant_id: args.tenant_id,
    });
    const activeCorpus = settings.active_corpus_version;

    // Convex has no cheap "COUNT" without reading.
    // Use a bounded read and return an accuracy flag.
    const MAX_READ = 5000;

    const pending = await ctx.db
      .query("chunks")
      .withIndex("by_tenant_pending_corpus", pendingCorpusSelector(args.tenant_id, activeCorpus))
      .take(MAX_READ);

    return {
      tenant_id: args.tenant_id,
      active_corpus_version: activeCorpus,
      count: pending.length,
      is_exact: pending.length < MAX_READ,
      note: pending.length >= MAX_READ ? `count is at least ${MAX_READ}` : "exact",
    };
  },
});
