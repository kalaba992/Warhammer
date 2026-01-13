// scripts/generate-sbom.ts
/**
 * SBOM Generator - CycloneDX Format
 * Generates Software Bill of Materials for compliance + dependency tracking
 */

import * as fs from 'fs';
import * as path from 'path';

interface BOMComponent {
  type: 'library' | 'framework' | 'application';
  name: string;
  version: string;
  purl: string;
  scope?: 'required' | 'optional';
  licenses?: Array<{ license: { name: string } }>;
  hashes?: Array<{ alg: string; content: string }>;
}

interface BOM {
  bomFormat: 'CycloneDX';
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools: Array<{ vendor: string; name: string; version: string }>;
    component: {
      type: 'application';
      name: string;
      version: string;
    };
  };
  components: BOMComponent[];
}

class SBOMGenerator {
  private workspaceRoot: string;
  private timestamp: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Parse package.json and extract dependencies
   */
  parsePackageJson(pkgPath: string): BOMComponent[] {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const components: BOMComponent[] = [];

    // Process dependencies
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies,
    };

    for (const [name, version] of Object.entries(allDeps)) {
      const versionString = (version as string).replace(/^[\^~]/, '');
      components.push({
        type: 'library',
        name,
        version: versionString,
        purl: `pkg:npm/${name}@${versionString}`,
        scope: pkg.devDependencies?.[name] ? 'optional' : 'required',
      });
    }

    return components;
  }

  /**
   * Generate unique serial number
   */
  generateSerialNumber(): string {
    const uuid = `urn:uuid:${this.generateUUID()}`;
    return uuid;
  }

  /**
   * Simple UUID v4 generator
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create BOM for single package
   */
  createBOM(pkgPath: string, appName: string, appVersion: string): BOM {
    const components = this.parsePackageJson(pkgPath);

    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: this.generateSerialNumber(),
      version: 1,
      metadata: {
        timestamp: this.timestamp,
        tools: [
          {
            vendor: 'all-for-customs',
            name: 'sbom-generator',
            version: '1.0.0',
          },
        ],
        component: {
          type: 'application',
          name: appName,
          version: appVersion,
        },
      },
      components,
    };
  }

  /**
   * Merge multiple BOMs
   */
  mergeBOMs(boms: BOM[]): BOM {
    const merged: BOM = {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: this.generateSerialNumber(),
      version: 1,
      metadata: {
        timestamp: this.timestamp,
        tools: [
          {
            vendor: 'all-for-customs',
            name: 'sbom-generator',
            version: '1.0.0',
          },
        ],
        component: {
          type: 'application',
          name: 'all-for-customs-platform',
          version: '1.0.0',
        },
      },
      components: [],
    };

    // Merge all components, removing duplicates
    const seen = new Set<string>();
    for (const bom of boms) {
      for (const comp of bom.components) {
        const key = `${comp.name}@${comp.version}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.components.push(comp);
        }
      }
    }

    // Sort components alphabetically
    merged.components.sort((a, b) => a.name.localeCompare(b.name));

    return merged;
  }

  /**
   * Generate SPDX format SBOM
   */
  generateSPDX(bom: BOM): string {
    const lines: string[] = [
      'SPDXVersion: SPDX-2.2',
      'DataLicense: CC0-1.0',
      `SPDXID: SPDXRef-DOCUMENT`,
      `DocumentName: ${bom.metadata.component.name}`,
      `DocumentNamespace: https://all-for-customs.customs.local/sbom/${this.generateUUID()}`,
      `Creator: Tool: sbom-generator`,
      `Created: ${bom.metadata.timestamp}`,
      '',
      '# Package Information',
      `PackageName: ${bom.metadata.component.name}`,
      `SPDXID: SPDXRef-Package`,
      `PackageVersion: ${bom.metadata.component.version}`,
      'PackageDownloadLocation: NOASSERTION',
      'FilesAnalyzed: false',
      'PackageVerificationCode: 0000000000000000000000000000000000000000 ()',
      '',
      '# Package Dependencies',
    ];

    bom.components.forEach((comp) => {
      lines.push(`ExternalRef: DocumentRef-${comp.name} npm-package-${comp.name}`);
    });

    return lines.join('\n');
  }

  /**
   * Generate JSON SBOM
   */
  generateJSON(bom: BOM): string {
    return JSON.stringify(bom, null, 2);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(boms: Map<string, BOM>): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>SBOM Report - all-for-customs</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #007bff; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .timestamp { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Software Bill of Materials (SBOM) Report</h1>
  <p class="timestamp">Generated: ${new Date().toISOString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Project:</strong> all-for-customs-platform</p>
    <p><strong>Format:</strong> CycloneDX 1.4</p>
    <p><strong>Total Packages:</strong> ${Array.from(boms.values()).reduce((sum, b) => sum + b.components.length, 0)}</p>
  </div>
`;

    for (const [appName, bom] of boms.entries()) {
      html += `
  <h2>${appName}</h2>
  <p>Version: ${bom.metadata.component.version}</p>
  <table>
    <thead>
      <tr>
        <th>Package Name</th>
        <th>Version</th>
        <th>Scope</th>
        <th>PURL</th>
      </tr>
    </thead>
    <tbody>
`;
      for (const comp of bom.components) {
        html += `
      <tr>
        <td>${comp.name}</td>
        <td>${comp.version}</td>
        <td>${comp.scope || 'required'}</td>
        <td><code>${comp.purl}</code></td>
      </tr>
`;
      }
      html += `
    </tbody>
  </table>
`;
    }

    html += `
</body>
</html>
`;
    return html;
  }

  /**
   * Execute full SBOM generation
   */
  async generate(): Promise<void> {
    console.log('🔍 Starting SBOM generation...');

    const boms = new Map<string, BOM>();

    // Frontend
    const frontendPkgPath = path.join(this.workspaceRoot, 'apps/frontend/package.json');
    if (fs.existsSync(frontendPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf-8'));
      const frontendBom = this.createBOM(frontendPkgPath, 'frontend', pkg.version || '1.0.0');
      boms.set('frontend', frontendBom);
      console.log(`✅ Frontend SBOM: ${frontendBom.components.length} dependencies`);
    }

    // Backend
    const backendPkgPath = path.join(this.workspaceRoot, 'apps/backend/package.json');
    if (fs.existsSync(backendPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
      const backendBom = this.createBOM(backendPkgPath, 'backend', pkg.version || '1.0.0');
      boms.set('backend', backendBom);
      console.log(`✅ Backend SBOM: ${backendBom.components.length} dependencies`);
    }

    // Merge all
    const allBoms = Array.from(boms.values());
    const merged = this.mergeBOMs(allBoms);

    // Write outputs
    const outputDir = path.join(this.workspaceRoot, 'sbom-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // CycloneDX JSON
    fs.writeFileSync(
      path.join(outputDir, 'sbom-cyclonedx.json'),
      this.generateJSON(merged)
    );
    console.log('✅ CycloneDX JSON: sbom-reports/sbom-cyclonedx.json');

    // SPDX
    fs.writeFileSync(
      path.join(outputDir, 'sbom-spdx.spdx'),
      this.generateSPDX(merged)
    );
    console.log('✅ SPDX format: sbom-reports/sbom-spdx.spdx');

    // HTML Report
    fs.writeFileSync(
      path.join(outputDir, 'sbom-report.html'),
      this.generateHTMLReport(boms)
    );
    console.log('✅ HTML Report: sbom-reports/sbom-report.html');

    // Summary
    console.log('\n📊 SBOM Generation Summary:');
    console.log(`  Total Components: ${merged.components.length}`);
    console.log(`  Timestamp: ${merged.metadata.timestamp}`);
    console.log(`  Serial Number: ${merged.serialNumber}`);
  }
}

// Main execution
const generator = new SBOMGenerator();
generator.generate().catch(console.error);
