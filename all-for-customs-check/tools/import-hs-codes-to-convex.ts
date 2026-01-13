import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

interface HSCode {
  code: string;
  description: string;
  [key: string]: string;
}

async function importHSCodesToConvex() {
  const csvFilePath = process.argv[2] || './tools/hs-codes-bih-2026.csv';
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    console.error('❌ Error: VITE_CONVEX_URL environment variable is not set');
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  try {
    console.log(`📖 Reading CSV file from: ${csvFilePath}`);
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as HSCode[];

    console.log(`✅ Parsed ${records.length} HS codes from CSV`);

    if (records.length === 0) {
      console.warn('⚠️  Warning: No records found in CSV file');
      process.exit(0);
    }

    // Initialize Convex client
    const client = new ConvexClient(convexUrl);

    // Transform records for Convex
    const hsCodeRecords = records.map((record) => ({
      code: record.code || record.HS_Code || '',
      description: record.description || record.Description || record.English || '',
      bosnianName: record.bosnianName || record.Bosnian || '',
      category: record.category || record.Category || '',
      unit: record.unit || record.Unit || '',
      importedAt: new Date().toISOString(),
    }));

    console.log(`🚀 Preparing to import ${hsCodeRecords.length} records to Convex...`);
    console.log(`📡 Convex URL: ${convexUrl}`);

    // Batch import (Convex has limits, so we do it in chunks)
    const batchSize = 100;
    let totalImported = 0;
    let totalFailed = 0;

    for (let i = 0; i < hsCodeRecords.length; i += batchSize) {
      const batch = hsCodeRecords.slice(i, i + batchSize);
      
      try {
        const result = await client.mutation(api.hs_codes.importHSCodes, {
          records: batch,
        });

        totalImported += result.successful;
        totalFailed += result.failed;
        
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1}: ${result.successful}/${batch.length} imported`
        );
      } catch (error) {
        console.error(
          `⚠️  Error importing batch ${Math.floor(i / batchSize) + 1}:`,
          error instanceof Error ? error.message : error
        );
        totalFailed += batch.length;
      }
    }

    console.log(`\n✨ Import complete!`);
    console.log(`   ✅ Imported: ${totalImported}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📊 Total: ${totalImported + totalFailed}`);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

// Run the import
importHSCodesToConvex().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
