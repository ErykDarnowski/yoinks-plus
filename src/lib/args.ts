import {isThemeMode, type ThemeMode} from '../theme.js'

export type CliArgs = {
  help: boolean
  version: boolean
  /** Every positional url — any url means download straight away, no ui. */
  urls: string[]
  /** -a / --batch-file: path to a file of urls (one per line), or "-" for stdin. */
  batchFile?: string
  /** -f / --format: format to download (default: best). */
  format?: string
  /** True when a url or -a was given: skip the UI and download straight away. */
  headless: boolean
  themeMode?: ThemeMode
  error?: string
}

type ValueOption = 'theme' | 'batchFile' | 'format'

const VALUE_OPTIONS: Record<string, ValueOption> = {
  '--theme': 'theme',
  '-a': 'batchFile',
  '--batch-file': 'batchFile',
  '-f': 'format',
  '--format': 'format',
}

const NEEDS_VALUE: Record<ValueOption, string> = {
  theme: '--theme needs a value: auto, light, or dark',
  batchFile: '--batch-file needs a file path (or - for stdin)',
  format: '--format needs a value, e.g. best, 720p, mp3, or a yt-dlp format spec',
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {help: false, version: false, urls: [], headless: false}
  const positional: string[] = []

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === '-h' || arg === '--help') {
      result.help = true
      continue
    }
    if (arg === '-v' || arg === '--version') {
      result.version = true
      continue
    }

    let option: ValueOption | undefined
    let value: string | undefined
    const equals = arg.indexOf('=')
    if (arg.startsWith('--') && equals > 0 && VALUE_OPTIONS[arg.slice(0, equals)]) {
      option = VALUE_OPTIONS[arg.slice(0, equals)]
      value = arg.slice(equals + 1)
    } else if (VALUE_OPTIONS[arg]) {
      option = VALUE_OPTIONS[arg]
      value = args[++index]
    }

    if (option) {
      if (!value) return {...result, error: NEEDS_VALUE[option]}
      if (option === 'theme') {
        if (!isThemeMode(value)) return {...result, error: `unknown theme “${value}” — use auto, light, or dark`}
        result.themeMode = value
      } else {
        result[option] = value
      }
    } else if (arg.startsWith('-')) {
      return {...result, error: `unknown option “${arg}”`}
    } else {
      positional.push(arg)
    }
  }

  // any url or batch file means "just download it"; a bare `yoinks` opens the ui
  result.headless = positional.length > 0 || result.batchFile !== undefined
  if (!result.headless && result.format !== undefined) {
    return {...result, error: '--format needs a url (or a --batch-file) to download'}
  }

  result.urls = positional
  return result
}
