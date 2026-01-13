import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const startIngestionRun = mutation({
  args: {
    tenant_id: v.string(),
    run: v.object({
      run_id: v.string(),
      source_id: v.string(),
      corpus_version: v.string(),
      status: v.literal("running"),
      started_at: v.string(),
      stats: v.object({
        documents_new: v.number(),
        documents_updated: v.number(),
        chunks_written: v.number(),
        citations_written: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ingestion_runs", { tenant_id: args.tenant_id, ...args.run });
    return { ok: true };
  },
});

export const finishIngestionRun = mutation({
  args: {
    tenant_id: v.string(),
    run_id: v.string(),
    finished_at: v.string(),
    stats: v.object({
      documents_new: v.number(),
      documents_updated: v.number(),
      chunks_written: v.number(),
      citations_written: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_run_id", (q) => q.eq("tenant_id", args.tenant_id).eq("run_id", args.run_id))
      .first();
    if (!existing) return { ok: false, error: "not_found" as const };

    await ctx.db.patch(existing._id, {
      status: "success",
      finished_at: args.finished_at,
      stats: args.stats,
    });
    return { ok: true };
  },
});

export const failIngestionRun = mutation({
  args: { tenant_id: v.string(), run_id: v.string(), finished_at: v.string(), error: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_run_id", (q) => q.eq("tenant_id", args.tenant_id).eq("run_id", args.run_id))
      .first();
    if (!existing) return { ok: false, error: "not_found" as const };

    await ctx.db.patch(existing._id, {
      status: "failed",
      finished_at: args.finished_at,
      error: args.error,
    });
    return { ok: true };
  },
});

export const listLatestRuns = query({
  args: { tenant_id: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    // nema "orderBy" bez indeksa; ovdje uzmi zadnjih N po statusu running/success/failed pa filtriraj
    const running = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_status", (q) => q.eq("tenant_id", args.tenant_id).eq("status", "running"))
      .take(args.limit);

    const success = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_status", (q) => q.eq("tenant_id", args.tenant_id).eq("status", "success"))
      .take(args.limit);

    const failed = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_status", (q) => q.eq("tenant_id", args.tenant_id).eq("status", "failed"))
      .take(args.limit);

    return { running, success, failed };
  },
});
