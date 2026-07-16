---
name: verify
description: Build, launch, and drive ChessPrint in a headless browser to verify UI/PDF changes end-to-end.
---

# Verifying ChessPrint changes

Surface: browser GUI (Vite dev server) + the exported PDF.

## Launch

```bash
npm run dev -- --port 5199 --strictPort   # run in background
```

## Drive (headless)

No Playwright on this machine; system Chromium is at `/usr/bin/chromium`.
Install `puppeteer-core` in the scratchpad (not the repo) and launch with:

```js
puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox'] })
```

Useful handles:
- Textarea: `#fen-input`; document title: `#doc-title`.
- Lichess panel selects: `#lichess-theme`, `#lichess-min-rating`, `#lichess-max-rating`, `#lichess-count`; find buttons by text ("Load puzzles from Lichess", "Load puzzles", "Export PDF").
- Puzzles come from the static index (`/puzzle-index/<band>.json`); block those URLs to simulate index failure. Cross-check an entry via `curl https://lichess.org/api/puzzle/<id>`.
- Validation debounce is 300ms — wait ~600ms after input before reading preview/errors.
- Wait for load completion by polling for no button labeled `Loading…`.

## Capturing the exported PDF

`Export PDF` triggers a blob download. Enable downloads via CDP:

```js
const session = await page.createCDPSession()
await session.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl })
```

Then wait a few seconds and inspect the saved PDF (readable as pages with the Read tool).

## Gotchas

- `page.emulateNetworkConditions` fails against system Chromium (CDP param mismatch); simulate network failure with `page.setRequestInterception(true)` and `req.abort('internetdisconnected')` for lichess.org URLs instead.
- Cross-check a loaded Lichess puzzle with `curl https://lichess.org/api/puzzle/<id>` (themes, rating, solution).
