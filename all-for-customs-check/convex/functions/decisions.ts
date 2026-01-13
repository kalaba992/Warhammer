import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { sha256Hex } from "../hash";

export const recordDecision = mutation({
  args: {
    tenant_id: v.string(),
    decision: v.object({
      request_id: v.string(),
      time: v.string(),
      status: v.union(v.literal("FINAL"), v.literal("STOP")),
      reason: v.optional(v.string()),
      engine_version: v.string(),
      corpus_version: v.string(),
      snapshot_pointer: v.string(),
      hs_candidate: v.string(),
      confidence: v.number(),
      gir_path: v.array(v.string()),
      citation_ids: v.array(v.string()),
      evidence_bundle_id: v.string(),
      created_at: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const d = args.decision;

    if (d.status === "FINAL" && d.citation_ids.length === 0) {
      return { ok: false, error: "missing_citations" as const };
    }
    if (d.status === "STOP" && !d.reason) {
      return { ok: false, error: "missing_reason" as const };
    }

    const evidenceBundle = await ctx.db
      .query("evidence_bundles")
      .withIndex("by_tenant_bundle_id", (q) => q.eq("tenant_id", args.tenant_id).eq("bundle_id", d.evidence_bundle_id))
      .first();

    if (!evidenceBundle) {
      return { ok: false, error: "missing_evidence_bundle" as const };
    }

    if (d.status === "FINAL") {
      for (const citationId of d.citation_ids) {
        const citation = await ctx.db
          .query("citations")
          .withIndex("by_tenant_citation_id", (q) => q.eq("tenant_id", args.tenant_id).eq("citation_id", citationId))
          .first();

        const hasPages = citation?.locator?.page_from !== undefined && citation?.locator?.page_to !== undefined;

        if (!citation || !citation.snapshot_pointer || !citation.snapshot_hash_sha256 || !hasPages) {
          return { ok: false, error: "missing_citation_proof" as const, citation_id: citationId };
        }
      }

      const bundleHasAllCitations = d.citation_ids.every((cid) => evidenceBundle.citation_ids.includes(cid));
      if (!bundleHasAllCitations) {
        return { ok: false, error: "evidence_bundle_mismatch" as const };
      }

      if (!d.snapshot_pointer || d.snapshot_pointer !== evidenceBundle.snapshot_pointer) {
        return { ok: false, error: "snapshot_pointer_mismatch" as const };
      }
    }

    const decision_hash_sha256 = await sha256Hex(
      JSON.stringify({
        request_id: d.request_id,
        time: d.time,
        status: d.status,
        engine_version: d.engine_version,
        corpus_version: d.corpus_version,
        snapshot_pointer: d.snapshot_pointer,
        hs_candidate: d.hs_candidate,
        confidence: d.confidence,
        gir_path: d.gir_path,
        citation_ids: [...d.citation_ids].sort(),
        evidence_bundle_id: d.evidence_bundle_id,
      })
    );

    await ctx.db.insert("decisions", {
      tenant_id: args.tenant_id,
      request_id: d.request_id,
      time: d.time,
      status: d.status,
      reason: d.reason,
      engine_version: d.engine_version,
      corpus_version: d.corpus_version,
      snapshot_pointer: d.snapshot_pointer,
      hs_candidate: d.hs_candidate,
      confidence: d.confidence,
      gir_path: d.gir_path,
      citation_ids: d.citation_ids,
      evidence_bundle_id: d.evidence_bundle_id,
      decision_hash_sha256,
      created_at: d.created_at,
    });

    return { ok: true, decision_hash_sha256 };
  },
});
