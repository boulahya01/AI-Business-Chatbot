// Note: PDF parsing (pdf-parse) only works on Node.js
// CSV parsing uses PapaParse which works both server/client
let pdfParse: any = null

// Dynamic import - only loads on server
if (typeof window === 'undefined') {
  pdfParse = require('pdf-parse')
}

export interface ParsedFile {
  text: string
  filename: string
  type: 'pdf' | 'csv' | 'text'
}

/**
 * Parse uploaded files (PDF, CSV, TXT)
 * Server-side only - call from API route
 */
export async function parseUploadedFile(file: File): Promise<ParsedFile> {
  const filename = file.name
  const type = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.csv') ? 'csv' : 'text'

  if (type === 'pdf') {
    if (!pdfParse) {
      throw new Error('PDF parsing only available on server')
    }
    const buffer = await file.arrayBuffer()
    const data = await pdfParse(Buffer.from(buffer))
    return {
      text: data.text,
      filename,
      type: 'pdf',
    }
  }

  if (type === 'csv') {
    // CSV parsing - simpler approach without external lib
    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    const content = lines.join('\n')
    return {
      text: content,
      filename,
      type: 'csv',
    }
  }

  // Text file
  const text = await file.text()
  return {
    text,
    filename,
    type: 'text',
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): string | null {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['application/pdf', 'text/csv', 'text/plain', 'application/vnd.ms-excel']

  if (file.size > maxSize) {
    return `File too large. Max 10MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`
  }

  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return 'Only PDF, CSV, and TXT files supported'
  }

  return null
}
