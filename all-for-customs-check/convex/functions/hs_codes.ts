import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const importHSCodes = mutation({
  args: {
    records: v.array(
      v.object({
        code: v.string(),
        description: v.string(),
        bosnianName: v.optional(v.string()),
        category: v.optional(v.string()),
        unit: v.optional(v.string()),
        importedAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const record of args.records) {
      try {
        // Insert into database (adjust table name as needed)
        const id = await ctx.db.insert("hs_codes", {
          code: record.code,
          description: record.description,
          bosnianName: record.bosnianName || "",
          category: record.category || "",
          unit: record.unit || "",
          importedAt: record.importedAt,
          createdAt: new Date().toISOString(),
        });
        
        results.push({ success: true, code: record.code, id });
      } catch (error) {
        results.push({ 
          success: false, 
          code: record.code, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
    
    return {
      totalProcessed: args.records.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  },
});
