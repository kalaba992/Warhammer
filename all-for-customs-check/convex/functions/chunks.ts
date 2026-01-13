import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const writeChunksBatch = mutation({
  args: {
    tenant_id: v.string(),
    chunks: v.array(
      v.object({
        chunk_id: v.string(),
        document_id: v.string(),

        parent_chunk_id: v.optional(v.string()),
        ordinal: v.number(),
        section_path: v.array(v.string()),
        article_no: v.optional(v.string()),
        paragraph_no: v.optional(v.string()),
        point_no: v.optional(v.string()),
        table_id: v.optional(v.string()),

        text: v.string(),
        text_hash_sha256: v.string(),
        language: v.string(),
        jurisdiction: v.string(),
        instrument_type: v.string(),
        trust_level: v.string(),

        // Optional (ako ih parser/ingestion puni)
        source_trust_level: v.optional(v.string()),
        doc_status: v.optional(v.string()),

        effective_from: v.string(),
        effective_to: v.string(),
        citation_id: v.string(),
        corpus_version: v.string(),

        index_pending: v.boolean(),
        indexed_at: v.optional(v.string()),
        created_at: v.string(),
        updated_at: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Upsert po (tenant_id, chunk_id)
    for (const ch of args.chunks) {
      const existing = await ctx.db
        .query("chunks")
        .withIndex("by_tenant_chunk_id", (q) =>
          q.eq("tenant_id", args.tenant_id).eq("chunk_id", ch.chunk_id)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...ch,
          tenant_id: args.tenant_id,
          updated_at: ch.updated_at,
        });
      } else {
        await ctx.db.insert("chunks", {
          tenant_id: args.tenant_id,
          ...ch,
        });
      }
    }
    return { ok: true, count: args.chunks.length };
  },
});

export const listPendingChunks = query({
  args: { tenant_id: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chunks")
      .withIndex("by_tenant_index_pending", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("index_pending", true)
      )
      .take(args.limit);
  },
});

export const markChunkIndexed = mutation({
  args: { tenant_id: v.string(), chunk_id: v.string(), indexed_at: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chunks")
      .withIndex("by_tenant_chunk_id", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("chunk_id", args.chunk_id)
      )
      .first();

    if (!existing) return { ok: false, error: "not_found" as const };

    await ctx.db.patch(existing._id, {
      index_pending: false,
      indexed_at: args.indexed_at,
      updated_at: args.indexed_at,
    });

    return { ok: true };
  },
});
