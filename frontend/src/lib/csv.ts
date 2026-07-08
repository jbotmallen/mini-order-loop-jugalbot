/**
 * Minimal RFC-4180 CSV generation + download using only browser standard APIs
 * (Blob + object URL) — no third-party CSV dependency. A cell is quoted only
 * when it contains a comma, double-quote or newline, and embedded quotes are
 * doubled. Values are coerced to string; null/undefined become empty.
 */

type Cell = string | number | null | undefined

function escapeCell(value: Cell): string {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Turn a header row + data rows into a CSV string (CRLF line endings). */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','))
  return lines.join('\r\n')
}

/**
 * Trigger a client-side download of `content` as `filename`. Prepends a UTF-8
 * BOM so Excel opens accented names correctly, then revokes the object URL.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['﻿', content], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
