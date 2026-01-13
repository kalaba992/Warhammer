import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertCitation = mutation({
  args: {
    tenant_id: v.string(),
    citation: v.object({
      citation_id: v.string(),
      document_id: v.string(),
      chunk_id: v.string(),
      corpus_version: v.string(),
      snapshot_pointer: v.string(),
      locator: v.object({
        page_from: v.optional(v.number()),
        page_to: v.optional(v.number()),
        char_from: v.optional(v.number()),
        char_to: v.optional(v.number()),
        selector: v.optional(v.string()),
      }),
      snapshot_hash_sha256: v.string(),
      created_at: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("citations")
      .withIndex("by_tenant_citation_id", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("citation_id", args.citation.citation_id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.citation,
        tenant_id: args.tenant_id,
      });
      return { ok: true, operation: "updated" as const };
    }

    await ctx.db.insert("citations", {
      tenant_id: args.tenant_id,
      ...args.citation,
    });

    return { ok: true, operation: "inserted" as const };
  },
});
