import fs from 'node:fs/promises'

/**
 * Parse a batch file the same way yt-dlp's --batch-file does: one url per
 * line, blank lines and lines starting with #, ; or ] are skipped, and a
 * " #" after the url starts a trailing comment (a bare # is kept — it can
 * be part of the url).
 */
export function parseBatchFile(text: string): string[] {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map(line => line.trimStart())
    .filter(line => line && !/^[#;\]]/.test(line))
    .map(line => line.split(/\s#/, 1)[0]!.trimEnd())
    .filter(Boolean)
}

/** Read urls from a batch file, or from stdin when the path is "-". */
export async function readBatchFile(file: string): Promise<string[]> {
  if (file === '-') {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
    return parseBatchFile(Buffer.concat(chunks).toString('utf8'))
  }
  try {
    return parseBatchFile(await fs.readFile(file, 'utf8'))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    throw new Error(code === 'ENOENT' ? `batch file not found: ${file}` : `could not read batch file ${file}: ${String(error)}`)
  }
}
