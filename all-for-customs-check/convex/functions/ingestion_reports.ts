import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const upsertIngestionReport = mutation({
  args: {
    tenant_id: v.string(),
    corpus_version: v.string(),
    source_zip: v.string(),
    counts: v.object({
      documents: v.number(),
      citations: v.number(),
      chunks: v.number(),
    }),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ingestion_reports")
      .withIndex("by_tenant_corpus", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("corpus_version", args.corpus_version),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        source_zip: args.source_zip,
        counts: args.counts,
        created_at: args.created_at,
      });
      return { status: "updated" as const };
    }

    await ctx.db.insert("ingestion_reports", {
      tenant_id: args.tenant_id,
      corpus_version: args.corpus_version,
      source_zip: args.source_zip,
      counts: args.counts,
      created_at: args.created_at,
    });

    return { status: "inserted" as const };
  },
});

export const getIngestionReport = query({
  args: {
    tenant_id: v.string(),
    corpus_version: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ingestion_reports")
      .withIndex("by_tenant_corpus", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("corpus_version", args.corpus_version),
      )
      .unique();
  },
});

export const listIngestionReportsByTenant = query({
  args: {
    tenant_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("ingestion_reports")
      .withIndex("by_tenant_created_at", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();

    // ingestion_reports should be small (per-corpus summaries). Sort newest-first for diagnostics.
    rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const limit = Math.min(Math.max(args.limit ?? 12, 1), 50);
    return rows.slice(0, limit).map((r) => ({
      tenant_id: r.tenant_id,
      corpus_version: r.corpus_version,
      source_zip: r.source_zip,
      counts: r.counts,
      created_at: r.created_at,
    }));
  },
});
