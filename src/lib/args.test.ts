import assert from 'node:assert/strict'
import test from 'node:test'
import {parseArgs} from './args.js'
import {parseBatchFile} from './batch.js'
import {choiceFromFormat} from './ytdlp.js'
import {isThemeMode, nextThemeMode, themeFor} from '../theme.js'

test('parses a url and a spaced theme option without confusing the value for the url', () => {
  assert.deepEqual(parseArgs(['--theme', 'light', 'https://example.com/video']), {
    help: false,
    version: false,
    headless: false,
    themeMode: 'light',
    urls: ['https://example.com/video'],
    initialUrl: 'https://example.com/video',
  })
})

test('parses an equals-style theme option after the url', () => {
  assert.deepEqual(parseArgs(['https://example.com/video', '--theme=dark']), {
    help: false,
    version: false,
    headless: false,
    themeMode: 'dark',
    urls: ['https://example.com/video'],
    initialUrl: 'https://example.com/video',
  })
})

test('rejects missing, invalid, and unknown options', () => {
  assert.match(parseArgs(['--theme']).error ?? '', /needs a value/)
  assert.match(parseArgs(['--theme', 'sepia']).error ?? '', /unknown theme/)
  assert.match(parseArgs(['--wat']).error ?? '', /unknown option/)
  assert.match(parseArgs(['one', 'two']).error ?? '', /single url/)
})

test('--format and --batch-file switch to headless mode and allow several urls', () => {
  const formatted = parseArgs(['-f', '720p', 'https://a.com/1', 'https://a.com/2'])
  assert.equal(formatted.headless, true)
  assert.equal(formatted.format, '720p')
  assert.deepEqual(formatted.urls, ['https://a.com/1', 'https://a.com/2'])

  const batch = parseArgs(['--batch-file=urls.txt', '--format=mp3'])
  assert.equal(batch.headless, true)
  assert.equal(batch.batchFile, 'urls.txt')
  assert.equal(batch.format, 'mp3')
  assert.deepEqual(batch.urls, [])

  assert.equal(parseArgs(['-a', '-']).batchFile, '-')
  assert.equal(parseArgs(['https://a.com/1']).headless, false)
  assert.match(parseArgs(['-f', 'best']).error ?? '', /needs a url/)
  assert.match(parseArgs(['-a']).error ?? '', /needs a file path/)
  assert.match(parseArgs(['--format']).error ?? '', /needs a value/)
})

test('batch files follow yt-dlp rules for comments and blank lines', () => {
  const text = '﻿https://a.com/1\r\n\n# comment\n; also\n] too\n  https://a.com/2  # trailing\nhttps://a.com/3#frag\n'
  assert.deepEqual(parseBatchFile(text), ['https://a.com/1', 'https://a.com/2', 'https://a.com/3#frag'])
})

test('format shortcuts map to the same args as the picker; anything else passes through', () => {
  assert.deepEqual(choiceFromFormat(undefined).args, ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4'])
  assert.deepEqual(choiceFromFormat('BEST').args, choiceFromFormat(undefined).args)
  assert.equal(choiceFromFormat('mp3').kind, 'audio')
  assert.ok(choiceFromFormat('audio').args.includes('-x'))
  assert.deepEqual(choiceFromFormat('720P').args, choiceFromFormat('720p').args)
  assert.match(choiceFromFormat('1080p').args[1]!, /height=1080/)
  assert.deepEqual(choiceFromFormat('bv*[height<=480]+ba').args, ['-f', 'bv*[height<=480]+ba'])
  assert.deepEqual(choiceFromFormat('140').args, ['-f', '140'])
})

test('recognizes only supported modes and cycles through all of them', () => {
  assert.equal(isThemeMode('auto'), true)
  assert.equal(isThemeMode('light'), true)
  assert.equal(isThemeMode('dark'), true)
  assert.equal(isThemeMode('sepia'), false)
  assert.equal(nextThemeMode('auto'), 'light')
  assert.equal(nextThemeMode('light'), 'dark')
  assert.equal(nextThemeMode('dark'), 'auto')
})

test('auto delegates to terminal colors while forced modes own the full surface', () => {
  assert.deepEqual(themeFor('auto'), {
    mode: 'auto',
    primary: undefined,
    gray: undefined,
    dark: undefined,
    background: undefined,
    dimSecondary: true,
    inverseButton: true,
  })

  assert.equal(themeFor('light').background, '#ffffff')
  assert.equal(themeFor('light').primary, '#18181b')
  assert.equal(themeFor('dark').background, '#18181b')
  assert.equal(themeFor('dark').primary, '#ffffff')
})
