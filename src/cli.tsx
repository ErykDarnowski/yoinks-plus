import React from 'react'
import {createRequire} from 'node:module'
import {render} from 'ink'
import {App, type Outcome} from './app.js'
import {captureFrames} from './lib/click-map.js'
import {parseArgs} from './lib/args.js'
import {readClipboard} from './lib/clipboard.js'
import {isProbablyUrl} from './lib/platforms.js'
import {readBatchFile} from './lib/batch.js'
import {runHeadless} from './lib/headless.js'
import os from 'node:os'
import path from 'node:path'

// read at runtime from the shipped package.json so npm version bumps
// can't drift from a hardcoded constant
const VERSION: string = createRequire(import.meta.url)('../package.json').version

const HELP = `
  yoinks+ — yoink any video. paste. yoink. done.

  Usage
    $ yoinks [url]                       open the ui (format picker)
    $ yoinks -f <format> <url...>        download straight away, no ui
    $ yoinks -a <file> [-f <format>]     download every url in a file, no ui

  Examples
    $ yoinks https://youtu.be/dQw4w9WgXcQ
    $ yoinks -f 720p https://youtu.be/dQw4w9WgXcQ
    $ yoinks -f mp3 https://youtu.be/a https://youtu.be/b
    $ yoinks -a urls.txt
    $ cat urls.txt | yoinks -a - -f best
    $ yoinks                 (prompts for a url)

  Options
    -f, --format <fmt>    best (default), 720p / 1080p / …, mp3 / audio,
                          or any yt-dlp format spec (e.g. "bv*+ba", "140")
    -a, --batch-file <f>  file with one url per line (# ; ] start comments),
                          "-" reads from stdin
    --theme <mode>        use auto, light, or dark for this run
    -h, --help            show this help
    -v, --version         show version

  Downloads are saved to ~/Downloads.
  Powered by yt-dlp — YouTube, X, Instagram, Threads, TikTok & 1800+ sites.
`

const args = parseArgs(process.argv.slice(2))

if (args.error) {
  console.error(`yoinks: ${args.error}\nTry “yoinks --help” for usage.`)
  process.exit(1)
}

if (args.help) {
  console.log(HELP)
  process.exit(0)
}

if (args.version) {
  console.log(VERSION)
  process.exit(0)
}

// -f / -a: skip the ui entirely and just download
if (args.headless) {
  let urls = args.urls
  if (args.batchFile !== undefined) {
    try {
      urls = [...(await readBatchFile(args.batchFile)), ...urls]
    } catch (error) {
      console.error(`yoinks: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  }
  const code = await runHeadless({urls, format: args.format, outDir: path.join(os.homedir(), 'Downloads')})
  process.exit(code)
}

const initialUrl = args.initialUrl
const initialThemeMode = args.themeMode ?? 'auto'

const isTTY = Boolean(process.stdout.isTTY)

// no url given — offer the clipboard url (⇥ to paste) when it already holds one
let clipboardUrl: string | undefined
if (!initialUrl && isTTY) {
  const clipped = readClipboard().trim()
  // reject multi-line clipboard content — new URL() silently strips newlines
  if (clipped && !/\s/.test(clipped) && isProbablyUrl(clipped)) clipboardUrl = clipped
}
const enterAltScreen = () => process.stdout.write('\x1b[?1049h\x1b[H')
// also switch mouse tracking off — a crash can skip React effect cleanup
const leaveAltScreen = () => process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?1049l')

if (isTTY) {
  enterAltScreen()
  process.on('exit', leaveAltScreen)
  // restore the terminal BEFORE a crash prints, or the stack trace is
  // wiped along with the alternate screen and the app looks like it
  // silently quit
  for (const event of ['uncaughtException', 'unhandledRejection'] as const) {
    process.on(event, (error: unknown) => {
      leaveAltScreen()
      console.error(error)
      process.exit(1)
    })
  }
}

let outcome: Outcome = {}
const {waitUntilExit} = render(
  <App
    initialUrl={initialUrl}
    clipboardUrl={clipboardUrl}
    initialThemeMode={initialThemeMode}
    onOutcome={result => (outcome = result)}
  />,
  // keep a copy of every frame so clicks can be hit-tested against it
  {stdout: captureFrames(process.stdout)},
)

await waitUntilExit()

if (isTTY) leaveAltScreen()
if (outcome.filepath) {
  console.log(`✓ yoinked → ${outcome.filepath}`)
}
