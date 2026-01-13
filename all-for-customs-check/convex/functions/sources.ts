import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const upsertSource = mutation({
  args: {
    tenant_id: v.string(),
    source: v.object({
      source_id: v.string(),
      name: v.string(),
      url: v.string(),
      enabled: v.boolean(),
      trust_level: v.string(),
      jurisdiction: v.string(),
      fetch_interval_hours: v.number(),
      last_fetched_at: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_tenant_source_id", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("source_id", args.source.source_id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args.source });
      return { ok: true, operation: "updated" as const };
    }
    await ctx.db.insert("sources", { tenant_id: args.tenant_id, ...args.source });
    return { ok: true, operation: "inserted" as const };
  },
});

export const setSourceEnabled = mutation({
  args: { tenant_id: v.string(), source_id: v.string(), enabled: v.boolean(), updated_at: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_tenant_source_id", (q) => q.eq("tenant_id", args.tenant_id).eq("source_id", args.source_id))
      .first();
    if (!existing) return { ok: false, error: "not_found" as const };

    await ctx.db.patch(existing._id, { enabled: args.enabled, updated_at: args.updated_at });
    return { ok: true };
  },
});

export const listEnabledSources = query({
  args: { tenant_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sources")
      .withIndex("by_tenant_enabled", (q) => q.eq("tenant_id", args.tenant_id).eq("enabled", true))
      .collect();
  },
});
