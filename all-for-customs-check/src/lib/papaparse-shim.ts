export interface ParseConfig {
  delimiter?: string
  header?: boolean
  dynamicTyping?: boolean
  skipEmptyLines?: boolean | 'greedy'
  complete?: (results: ParseResult) => void
  error?: (error: Error) => void
}

export interface ParseResult {
  data: unknown[]
  errors: unknown[]
  meta: {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
  }
}

const Papa = {
  parse: (input: string | File, config?: ParseConfig): ParseResult | void => {
    if (typeof input === 'string') {
      const lines = input.split('\n')
      const delimiter = config?.delimiter || ','
      const header = config?.header !== false
      
      const data: unknown[] = []
      const headers = header && lines.length > 0 
        ? lines[0].split(delimiter).map(h => h.trim())
        : []
      
      const startIndex = header ? 1 : 0
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line && config?.skipEmptyLines) continue
        
        const values = line.split(delimiter).map(v => v.trim())
        
        if (header && headers.length > 0) {
          const row: Record<string, unknown> = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ''
          })
          data.push(row)
        } else {
          data.push(values)
        }
      }
      
      const result: ParseResult = {
        data,
        errors: [],
        meta: {
          delimiter,
          linebreak: '\n',
          aborted: false,
          truncated: false,
          cursor: input.length
        }
      }
      
      if (config?.complete) {
        config.complete(result)
        return
      }
      
      return result
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = Papa.parse(text, { ...config, complete: undefined }) as ParseResult
        if (config?.complete) {
          config.complete(result)
        }
      }
      reader.onerror = () => {
        if (config?.error) {
          config.error(new Error('Failed to read file'))
        }
      }
      reader.readAsText(input)
    }
  },
  
  unparse: (data: unknown[], config?: { header?: boolean; delimiter?: string }): string => {
    if (!data || data.length === 0) return ''
    
    const delimiter = config?.delimiter || ','
    const lines: string[] = []
    const firstItem = data[0] as Record<string, unknown> | unknown[] | null
    
    if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      const headers = Object.keys(firstItem as Record<string, unknown>)
      if (config?.header !== false) {
        lines.push(headers.join(delimiter))
      }
      
      data.forEach((row: unknown) => {
        const typedRow = row as Record<string, unknown>
        const values = headers.map(header => {
          const val = typedRow[header] || ''
          return typeof val === 'string' && val.includes(delimiter) ? `"${val}"` : val
        })
        lines.push(values.join(delimiter))
      })
    } else {
      data.forEach((row: unknown) => {
        if (Array.isArray(row)) {
          const values = row.map(val => 
            typeof val === 'string' && val.includes(delimiter) ? `"${val}"` : val
          )
          lines.push(values.join(delimiter))
        }
      })
    }
    
    return lines.join('\n')
  }
}

export default Papa
