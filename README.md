# yoinks+

> **yoinks+ is a fork of [yoinks](https://github.com/pablostanley/yoinks)**
> that brings over some of the features from
> [yt-dlp](https://github.com/yt-dlp/yt-dlp) that the original keeps
> hidden behind its UI — downloading from a batch file (`-a`), choosing
> the format up front (`-f`), and a no-UI mode that just downloads.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <img src="assets/logo-light.svg" alt="yoinks" width="288">
</picture>

yoink any video. paste. yoink. done.

Download videos from YouTube, X/Twitter, Instagram, Threads, TikTok and
1,800+ other sites — right from your terminal. Paste a url, pick a
resolution (or audio-only mp3), done. Or skip the UI: `yoinks <url>` grabs
the best quality, and `yoinks -a urls.txt` grabs a whole list. No popups, no fake download buttons,
no sketchy redirects.

<img src="assets/home.png" alt="yoinks home screen — paste a link and hit yoink" width="100%">

## Install

yoinks+ isn't on npm — build it from source and link it (see
[Development](#development)), which installs it as the `yoinks` command.
The commands below install the original yoinks, without the + features:

```sh
npm install -g yoinks
```

Or try it without installing anything:

```sh
npx yoinks
```

Requires Node 18+. Everything else (yt-dlp, ffmpeg) is fetched or bundled
automatically.

## Usage

```sh
$ yoinks                                 # opens the ui: paste a url, pick a format
$ yoinks https://youtu.be/dQw4w9WgXcQ    # no ui: downloads the best quality
$ yoinks --theme light                   # force the light palette
```

### No-UI mode (yoinks+)

Give yoinks+ a url (or a file of them with `-a`) and it skips the UI
entirely and just downloads — best quality unless you pick a format with
`-f`. Run bare `yoinks` to get the UI and the format picker:

```sh
$ yoinks https://youtu.be/dQw4w9WgXcQ                # best quality
$ yoinks -f 720p https://youtu.be/dQw4w9WgXcQ        # pick the format up front
$ yoinks -f mp3 https://youtu.be/a https://youtu.be/b # several urls at once
$ yoinks -a urls.txt                                 # every url in a file
$ yoinks -a urls.txt -f 1080p                        # …at a given format
$ cat urls.txt | yoinks -a -                         # urls from stdin
```

`-f, --format` accepts:

| value            | downloads                                              |
| ---------------- | ------------------------------------------------------ |
| `best` (default) | best video + audio, merged to mp4                      |
| `720p`, `1080p`… | that resolution (or the closest below it), mp4         |
| `mp3` / `audio`  | audio only, converted to mp3                           |
| anything else    | passed straight to yt-dlp's `-f` — e.g. `"bv*+ba"`, `140`, `"bv*[height<=480]+ba/b"` |

`-a, --batch-file` reads one url per line, following yt-dlp's rules: blank
lines and lines starting with `#`, `;` or `]` are ignored, and ` # …` after
a url is a comment. Use `-` to read from stdin.

Progress is shown on stderr; each finished file is printed to stdout as
`✓ yoinked → <path>`. If any url fails the rest still download, and the
exit code is 1.

### The UI

Run bare `yoinks` and it takes over the terminal (full-screen, centered — and restores your
scrollback on exit). Pick a format with ↑/↓ (or j/k, or number keys) and
hit enter. `esc` goes back, `^c` quits. Or just use the mouse — the yoink
button, the format list and the footer hints are all clickable, and
clicking the logo takes you back home. Files are saved to `~/Downloads`,
and the file path is printed to your terminal when you're done.

The default `auto` theme uses your terminal's own foreground and background,
so it follows light and dark terminal themes without guessing. Press `^t` or
click the theme control in the footer to cycle through `auto`, `light`, and
`dark` for the current session. Use `--theme auto`, `--theme light`, or
`--theme dark` to choose the starting theme for one launch.

<img src="assets/download-options.png" alt="yoinks format picker — resolutions with estimated file sizes, plus audio-only mp3" width="100%">

## How it works

- Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp). On first run,
  yoinks downloads the standalone yt-dlp binary to `~/.yoinks/bin` —
  no Python required. If you already have yt-dlp installed, it uses yours.
- ffmpeg (needed for merging high-res streams and mp3 extraction) is found
  on your PATH, with `ffmpeg-static` as a bundled fallback.
- The UI is [Ink](https://github.com/vadimdemedes/ink) — React for the
  terminal.

## Development

```sh
npm install
npm run build        # bundle to dist/ with tsup
npm run dev          # rebuild on change
node dist/cli.js <url>
npm run typecheck
```

To try it as a global command without publishing: `npm link`, then run
`yoinks` anywhere.

## Roadmap

- [x] Skip the picker (scriptable mode) — `yoinks <url>`, `-f mp3` / `-f 720p` (yoinks+)
- [x] Batch downloads from a file — `-a urls.txt` (yoinks+)
- [ ] `-o <dir>` to choose the output folder
- [ ] Playlist / thread-with-multiple-videos support
- [ ] Clipboard detection: launch bare and auto-suggest the url you copied
- [ ] Self-update for the bundled yt-dlp binary (`yt-dlp -U`)
- [x] Publish to npm (`npm i -g yoinks` / `npx yoinks`)
- [ ] `curl yoinks.sh | sh` installer

## A note on fair use

yoinks is a personal-archiving tool. Downloading content may violate a
platform's terms of service — only download what you have the right to
keep, and be excellent to creators.

## License

[MIT](LICENSE)
