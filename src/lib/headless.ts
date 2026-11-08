import {choiceFromFormat, download, ensureYtDlp, findFfmpeg, type DownloadProgress} from './ytdlp.js'
import {formatBytes, formatEta, formatSpeed} from './format.js'

export type HeadlessOptions = {
  urls: string[]
  format?: string
  outDir: string
}

function progressLine(progress: DownloadProgress): string {
  const {downloadedBytes, totalBytes, speed, eta, part, totalParts} = progress
  const pieces: string[] = []
  if (totalParts > 1) pieces.push(`part ${Math.min(part + 1, totalParts)}/${totalParts}`)
  if (totalBytes) {
    pieces.push(`${Math.min(100, (downloadedBytes / totalBytes) * 100).toFixed(1)}%`)
    pieces.push(`${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`)
  } else if (downloadedBytes) {
    pieces.push(formatBytes(downloadedBytes))
  }
  if (speed) pieces.push(formatSpeed(speed))
  if (eta) pieces.push(`eta ${formatEta(eta)}`)
  return pieces.filter(Boolean).join(' · ')
}

/**
 * Download every url straight away — no UI. Status goes to stderr; each
 * finished file path is printed to stdout so the output is scriptable.
 * Resolves to the process exit code (1 if any url failed).
 */
export async function runHeadless({urls, format, outDir}: HeadlessOptions): Promise<number> {
  const err = process.stderr
  const live = Boolean(err.isTTY)
  const status = (text: string) => {
    if (live) err.write(`\r\x1b[K${text}`)
  }
  const clearStatus = () => {
    if (live) err.write('\r\x1b[K')
  }

  if (urls.length === 0) {
    err.write('yoinks: no urls to download\n')
    return 1
  }

  const ytdlp = await ensureYtDlp(message => err.write(`${message}\n`))
  const ffmpegLocation = await findFfmpeg()
  const choice = choiceFromFormat(format)

  let failed = 0
  for (const [index, url] of urls.entries()) {
    const tag = urls.length > 1 ? `[${index + 1}/${urls.length}] ` : ''
    err.write(`${tag}yoinking ${url} (${choice.label})\n`)
    try {
      const filepath = await download(
        {ytdlp, ffmpegLocation, url, choice, outDir},
        {
          onProgress: progress => status(`  ${progressLine(progress)}`),
          onProcessing: () => status(choice.kind === 'audio' ? '  converting to mp3…' : '  merging…'),
        },
      )
      clearStatus()
      process.stdout.write(`✓ yoinked → ${filepath}\n`)
    } catch (error) {
      clearStatus()
      failed++
      err.write(`✗ ${url}: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }

  if (urls.length > 1) {
    err.write(`done: ${urls.length - failed} yoinked${failed ? `, ${failed} failed` : ''}\n`)
  }
  return failed > 0 ? 1 : 0
}
