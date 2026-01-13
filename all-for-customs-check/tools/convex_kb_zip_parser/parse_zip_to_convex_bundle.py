#!/usr/bin/env python3
"""
parse_zip_to_convex_bundle.py

Extract PDF documents from ZIP, generate deterministic JSONL for Convex SoT KB ingestion.
Outputs: documents.jsonl, citations.jsonl, chunks.jsonl, report.json

Usage:
  python parse_zip_to_convex_bundle.py \
    --zip <path/to/archive.zip> \
    --out ./out_convex_bundle \
    --tenant-id "default" \
    --corpus-version "0.1.0" \
    --trust-level "internal"
"""

import argparse
import hashlib
import json
import zipfile
from pathlib import Path
from datetime import datetime, timezone
import fitz  # PyMuPDF


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def document_id(source_url: str) -> str:
    return "doc_" + sha256_hex(source_url)[:12]


def chunk_id(document_id: str, ordinal: int, text_hash: str) -> str:
    composite = f"{document_id}:{ordinal}:{text_hash}"
    return "chk_" + sha256_hex(composite)[:16]


def citation_id(chunk_id: str, snapshot_hash: str, locator: str) -> str:
    composite = f"{chunk_id}:{snapshot_hash}:{locator}"
    return "cit_" + sha256_hex(composite)[:16]


def iter_text_from_pdf_pages(pdf_path: Path):
    """Yield (page_num_1_based, text) for non-empty pages."""
    doc = fitz.open(pdf_path)
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            cleaned = text.strip()
            if cleaned:
                yield (page_num + 1, cleaned)  # 1-based
    finally:
        doc.close()


def generate_convex_bundle(
    zip_path: Path,
    out_dir: Path,
    tenant_id: str,
    corpus_version: str,
    trust_level: str
):
    """Parse ZIP, generate JSONL bundle."""
    out_dir.mkdir(parents=True, exist_ok=True)
    
    documents_file = out_dir / "documents.jsonl"
    citations_file = out_dir / "citations.jsonl"
    chunks_file = out_dir / "chunks.jsonl"
    report_file = out_dir / "report.json"
    
    stats = {
        "documents": 0,
        "citations": 0,
        "chunks": 0
    }
    
    now = datetime.now(timezone.utc).isoformat()
    
    with zipfile.ZipFile(zip_path, "r") as zf:
        pdf_files = [name for name in zf.namelist() if name.lower().endswith(".pdf")]
        
        with open(documents_file, "w", encoding="utf-8") as doc_f, \
             open(citations_file, "w", encoding="utf-8") as cit_f, \
             open(chunks_file, "w", encoding="utf-8") as chk_f:
            
            for pdf_name in pdf_files:
                # Extract PDF to temp location
                temp_pdf = out_dir / f"temp_{pdf_name.replace('/', '_')}"
                with open(temp_pdf, "wb") as tmp:
                    tmp.write(zf.read(pdf_name))
                
                # Generate document metadata
                source_url = f"zip://{zip_path.name}/{pdf_name}"
                doc_id = document_id(source_url)
                
                with open(temp_pdf, "rb") as f:
                    content_bytes = f.read()
                    content_hash = hashlib.sha256(content_bytes).hexdigest()
                    size_bytes = len(content_bytes)
                
                # Extract and write chunks/citations streaming (one chunk per page)
                ordinal = 0
                for page_num, text in iter_text_from_pdf_pages(temp_pdf):
                    text_hash = sha256_hex(text)
                    chk_id = chunk_id(doc_id, ordinal, text_hash)

                    # Citation with page locator
                    locator_str = f"page_{page_num}"
                    cit_id = citation_id(chk_id, content_hash, locator_str)

                    citation = {
                        "citation_id": cit_id,
                        "document_id": doc_id,
                        "chunk_id": chk_id,
                        "corpus_version": corpus_version,
                        "locator": {
                            "page_from": page_num,
                            "page_to": page_num
                        },
                        "snapshot_hash_sha256": content_hash,
                        "snapshot_pointer": source_url,
                        "created_at": now
                    }
                    cit_f.write(json.dumps(citation, ensure_ascii=False) + "\n")
                    stats["citations"] += 1

                    chunk = {
                        "chunk_id": chk_id,
                        "document_id": doc_id,
                        "citation_id": cit_id,
                        "ordinal": ordinal,
                        "section_path": [f"Page {page_num}"],
                        "text": text,
                        "text_hash_sha256": text_hash,
                        "language": "bs",
                        "jurisdiction": "BIH",
                        "instrument_type": "regulation",
                        "trust_level": trust_level,
                        "source_trust_level": trust_level,
                        "doc_status": "active",
                        "effective_from": "2015-03-01T00:00:00Z",
                        "effective_to": "2099-12-31T23:59:59Z",
                        "snapshot_pointer": source_url,
                        "corpus_version": corpus_version,
                        "index_pending": True,
                        "created_at": now,
                        "updated_at": now
                    }
                    chk_f.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                    stats["chunks"] += 1

                    ordinal += 1

                temp_pdf.unlink()  # Clean up temp file
                
                # Write document
                document = {
                    "document_id": doc_id,
                    "source_name": pdf_name,
                    "source_url": source_url,
                    "source_trust_level": trust_level,
                    "jurisdiction": "BIH",
                    "instrument_type": "regulation",
                    "title": pdf_name,
                    "language": "bs",
                    "effective_from": "2015-03-01T00:00:00Z",
                    "effective_to": "2099-12-31T23:59:59Z",
                    "content_hash_sha256": content_hash,
                    "snapshot_pointer": source_url,
                    "mime": "application/pdf",
                    "size_bytes": size_bytes,
                    "corpus_version": corpus_version,
                    "status": "active",
                    "created_at": now,
                    "updated_at": now
                }
                doc_f.write(json.dumps(document, ensure_ascii=False) + "\n")
                stats["documents"] += 1
                

    
    # Write report
    with open(report_file, "w", encoding="utf-8") as rep_f:
        json.dump(stats, rep_f, indent=2)
    
    print(f"✅ Generated bundle in {out_dir}")
    print(f"   Documents: {stats['documents']}")
    print(f"   Citations: {stats['citations']}")
    print(f"   Chunks: {stats['chunks']}")


def main():
    parser = argparse.ArgumentParser(description="Parse ZIP of PDFs to Convex JSONL bundle")
    parser.add_argument("--zip", required=True, help="Path to ZIP file")
    parser.add_argument("--out", required=True, help="Output directory for JSONL files")
    parser.add_argument("--tenant-id", required=True, help="Tenant ID (e.g., 'default')")
    parser.add_argument("--corpus-version", required=True, help="Corpus version (e.g., '0.1.0')")
    parser.add_argument("--trust-level", default="internal", help="Trust level (default: internal)")
    
    args = parser.parse_args()
    
    generate_convex_bundle(
        zip_path=Path(args.zip),
        out_dir=Path(args.out),
        tenant_id=args.tenant_id,
        corpus_version=args.corpus_version,
        trust_level=args.trust_level
    )


if __name__ == "__main__":
    main()
