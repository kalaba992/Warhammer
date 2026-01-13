import * as XLSXDynamic from 'xlsx'

type CellValue = string | number | boolean | Date
export type ColumnInfo = { wch: number }

export interface CellObject {
  v?: CellValue
  t?: string
  s?: Record<string, unknown>
}

interface XLSXType {
  utils: {
    sheet_to_json: (worksheet: WorkSheet, options?: ParseOptions) => unknown[]
    json_to_sheet: (data: unknown[]) => WorkSheet
    aoa_to_sheet: (data: unknown[][]) => WorkSheet
    book_new: () => WorkBook
    book_append_sheet: (workbook: WorkBook, worksheet: WorkSheet, name: string) => void
    decode_range: (range: string) => Range
    encode_range: (range: Range) => string
    encode_cell: (cell: CellAddress) => string
  }
  read: (data: Uint8Array | ArrayBuffer, options?: ReadOptions) => WorkBook
  write: (workbook: WorkBook, options?: WriteOptions) => string | Uint8Array
  writeFile: (workbook: WorkBook, filename: string, options?: WriteOptions) => void
}

const XLSX = XLSXDynamic as XLSXType

export interface WorkSheet {
  [cell: string]: CellValue | CellObject | string | ColumnInfo[] | { ref: string } | undefined
  '!ref'?: string
  '!cols'?: Array<{ wch: number }>
  '!autofilter'?: { ref: string }
}

export interface WorkBook {
  SheetNames: string[]
  Sheets: { [sheet: string]: WorkSheet }
  Workbook?: {
    Views?: Array<{ RTL: boolean }>
  }
}

interface CellAddress {
  r: number
  c: number
}

interface Range {
  s: CellAddress
  e: CellAddress
}

interface ParseOptions {
  defval?: string | number
  header?: number | string
  raw?: boolean
}

interface ReadOptions {
  type?: 'buffer' | 'binary' | 'string' | 'base64' | 'array'
}

interface WriteOptions {
  bookType?: 'xlsx' | 'csv' | 'txt'
  type?: 'buffer' | 'binary' | 'string' | 'base64' | 'array'
}

export const utils = {
  sheet_to_json: (worksheet: WorkSheet, options?: ParseOptions): unknown[] => {
    return XLSX.utils.sheet_to_json(worksheet, options)
  },
  
  json_to_sheet: (data: unknown[]): WorkSheet => {
    return XLSX.utils.json_to_sheet(data)
  },
  
  aoa_to_sheet: (data: unknown[][]): WorkSheet => {
    return XLSX.utils.aoa_to_sheet(data)
  },
  
  book_new: (): WorkBook => {
    return XLSX.utils.book_new()
  },
  
  book_append_sheet: (workbook: WorkBook, worksheet: WorkSheet, name: string): void => {
    return XLSX.utils.book_append_sheet(workbook, worksheet, name)
  },
  
  decode_range: (range: string): Range => {
    return XLSX.utils.decode_range(range)
  },
  
  encode_range: (range: Range): string => {
    return XLSX.utils.encode_range(range)
  },
  
  encode_cell: (cell: CellAddress): string => {
    return XLSX.utils.encode_cell(cell)
  }
}

export function read(data: Uint8Array | ArrayBuffer, options?: ReadOptions): WorkBook {
  return XLSX.read(data, options)
}

export function write(workbook: WorkBook, options?: WriteOptions): string | Uint8Array {
  return XLSX.write(workbook, options)
}

export function writeFile(workbook: WorkBook, filename: string, options?: WriteOptions): void {
  return XLSX.writeFile(workbook, filename, options)
}
