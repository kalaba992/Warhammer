import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertDocument = mutation({
  args: {
    tenant_id: v.string(),
    document: v.object({
      document_id: v.string(),
      source_name: v.string(),
      source_url: v.string(),
      source_trust_level: v.string(),
      jurisdiction: v.string(),
      instrument_type: v.string(),
      title: v.string(),
      language: v.string(),
      effective_from: v.string(),
      effective_to: v.string(),
      content_hash_sha256: v.string(),
      snapshot_pointer: v.string(),
      mime: v.string(),
      size_bytes: v.number(),
      corpus_version: v.string(),
      status: v.union(v.literal("active"), v.literal("superseded"), v.literal("revoked")),
      supersedes_document_id: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_tenant_document_id", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("document_id", args.document.document_id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.document,
        tenant_id: args.tenant_id,
        updated_at: args.document.updated_at,
      });
      return { ok: true, operation: "updated" as const };
    }

    await ctx.db.insert("documents", {
      tenant_id: args.tenant_id,
      ...args.document,
    });

    return { ok: true, operation: "inserted" as const };
  },
});
