import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getTenantSettings = query({
  args: { tenant_id: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tenant_settings")
      .withIndex("by_tenant_id", (q) => q.eq("tenant_id", args.tenant_id))
      .unique();

    // Defaulti ako nije podešeno (konzervativno)
    if (!row) {
      return {
        tenant_id: args.tenant_id,
        active_corpus_version: "0.1.0",
        allow_fallback_to_older: false,
      };
    }

    return {
      tenant_id: row.tenant_id,
      active_corpus_version: row.active_corpus_version,
      allow_fallback_to_older: row.allow_fallback_to_older,
    };
  },
});

export const setActiveCorpusVersion = mutation({
  args: {
    tenant_id: v.string(),
    active_corpus_version: v.string(),
    allow_fallback_to_older: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenant_settings")
      .withIndex("by_tenant_id", (q) => q.eq("tenant_id", args.tenant_id))
      .unique();

    const updated_at = new Date().toISOString();
    const allowFallback = args.allow_fallback_to_older ?? false;

    if (existing) {
      await ctx.db.patch(existing._id, {
        active_corpus_version: args.active_corpus_version,
        allow_fallback_to_older: allowFallback,
        updated_at,
      });
      return { status: "updated" as const };
    }

    await ctx.db.insert("tenant_settings", {
      tenant_id: args.tenant_id,
      active_corpus_version: args.active_corpus_version,
      allow_fallback_to_older: allowFallback,
      updated_at,
    });

    return { status: "inserted" as const };
  },
});
