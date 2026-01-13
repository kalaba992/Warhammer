// convex/functions/search.ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

export const hydrateChunks = query({
  args: {
    tenant_id: v.string(),
    chunk_ids: v.array(v.string()),
    include_parent: v.boolean(),
    // Default: true (audit-grade). Ako caller hoće legacy ponašanje, može eksplicitno poslati false.
    enforce_active_corpus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const enforce = args.enforce_active_corpus ?? true;

    // Jedan izvor istine za aktivni korpus (default fallback je u tenant_settings:getTenantSettings)
    const settings = await ctx.runQuery(api.functions.tenant_settings.getTenantSettings, {
      tenant_id: args.tenant_id,
    });
    const activeCorpus = settings.active_corpus_version;

    const results: Array<{
      chunk: Doc<"chunks">;
      citation: Doc<"citations"> | null;
      document: Doc<"documents"> | null;
      parent: Doc<"chunks"> | null;
    }> = [];

    for (const chunk_id of args.chunk_ids) {
      const chunk = await ctx.db
        .query("chunks")
        .withIndex("by_tenant_chunk_id", (q) =>
          q.eq("tenant_id", args.tenant_id).eq("chunk_id", chunk_id)
        )
        .first();

      if (!chunk) continue;

      // Enforce active corpus (audit-grade)
      if (enforce && chunk.corpus_version !== activeCorpus) {
        throw new Error(
          `hydrateChunks blocked: chunk_id=${chunk_id} is in corpus_version=${chunk.corpus_version}, active=${activeCorpus}`
        );
      }

      const citation = await ctx.db
        .query("citations")
        .withIndex("by_tenant_citation_id", (q) =>
          q.eq("tenant_id", args.tenant_id).eq("citation_id", chunk.citation_id)
        )
        .first();

      const document = await ctx.db
        .query("documents")
        .withIndex("by_tenant_document_id", (q) =>
          q.eq("tenant_id", args.tenant_id).eq("document_id", chunk.document_id)
        )
        .first();

      let parent: Doc<"chunks"> | null = null;
      if (args.include_parent && chunk.parent_chunk_id) {
        parent = await ctx.db
          .query("chunks")
          .withIndex("by_tenant_chunk_id", (q) =>
            q.eq("tenant_id", args.tenant_id).eq("chunk_id", chunk.parent_chunk_id)
          )
          .first();

        if (parent && enforce && parent.corpus_version !== activeCorpus) {
          throw new Error(
            `hydrateChunks blocked: parent_chunk_id=${chunk.parent_chunk_id} is in corpus_version=${parent.corpus_version}, active=${activeCorpus}`
          );
        }
      }

      results.push({
        chunk,
        citation: citation ?? null,
        document: document ?? null,
        parent,
      });
    }

    return results;
  },
});

export const countsByTenant = query({
  args: {
    tenant_id: v.string(),
    // Opcionalno: ako želiš counts za specifičan korpus (npr. za admin pregled)
    corpus_version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.functions.tenant_settings.getTenantSettings, {
      tenant_id: args.tenant_id,
    });

    const corpusVersion = args.corpus_version ?? settings.active_corpus_version;

    // Counts se ne smiju raditi skeniranjem tabela. Čitaju se iz ingestion_reports (tiny payload).
    const report = await ctx.db
      .query("ingestion_reports")
      .withIndex("by_tenant_corpus", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("corpus_version", corpusVersion)
      )
      .unique();

    return {
      tenant_id: args.tenant_id,
      active_corpus_version: settings.active_corpus_version,
      corpus_version: corpusVersion,
      counts: report?.counts ?? { documents: 0, citations: 0, chunks: 0 },
      source_zip: report?.source_zip ?? null,
      created_at: report?.created_at ?? null,
    };
  },
});
