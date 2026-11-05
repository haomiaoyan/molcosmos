#!/usr/bin/env node
/**
 * Acceptance checks that need a real layout engine.
 *
 * Needs a running preview first:
 *
 *   npm run build
 *   npx vite preview --port 4400 --strictPort &
 *   node scripts/verify.mjs --url http://localhost:4400/
 *
 * Talks CDP directly (fetch /json/list → ws → Runtime.evaluate); no puppeteer.
 * Batch 1 implements assertions 1, 8 and 9. The rest land with the batches that
 * introduce the behaviour they check.
 *
 * Exit code is 1 as soon as one assertion fails, so it can gate CI.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const DEBUG_PORT = 4495
const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440×900' },
  { width: 768, height: 1024, label: '768×1024' },
  { width: 390, height: 844, label: '390×844', mobile: true },
]
const PAGE_TIMEOUT = 3000
/** Grace period between closing the socket and killing the browser. */
const SHUTDOWN_GRACE = 300

const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')
const targetUrl = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:4400/'
if (!targetUrl) {
  console.error('usage: node scripts/verify.mjs --url http://localhost:4400/')
  process.exit(2)
}

/** Chromium, in the places it actually lives on Windows. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error('No Chrome/Edge found; set CHROME_PATH')
}

const failures = []
let assertCount = 0

function check(name, ok, detail) {
  assertCount += 1
  if (ok) {
    console.log(`PASS  ${name} — ${detail}`)
  } else {
    failures.push(name)
    console.log(`FAIL  ${name} — ${detail}`)
  }
}

const chrome = spawn(findChrome(), [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${path.resolve('.tmp-verify')}`,
  '--window-size=1440,900',
  '--no-first-run',
  '--disable-extensions',
  'about:blank',
], { stdio: 'ignore' })

async function findPage() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page
    } catch {
      /* browser not listening yet */
    }
    await sleep(300)
  }
  throw new Error(`no CDP target on port ${DEBUG_PORT}`)
}

const page = await findPage()
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 512 * 1024 * 1024 })
await new Promise((resolve, reject) => {
  ws.once('open', resolve)
  ws.once('error', reject)
})

let messageId = 0
const pending = new Map()
const exceptions = []
ws.on('message', (raw) => {
  const message = JSON.parse(raw.toString())
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const details = message.params?.exceptionDetails
    exceptions.push(details?.exception?.description ?? details?.text ?? 'unknown exception')
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = (messageId += 1)
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

async function evaluate(expression) {
  const reply = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  const details = reply.result?.exceptionDetails
  if (details) throw new Error(details.exception?.description ?? details.text ?? 'evaluate failed')
  return reply.result?.result?.value
}

async function loadAt(viewport) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: Boolean(viewport.mobile),
  })
  await send('Page.navigate', { url: targetUrl })
  // Poll for the mounted hero instead of guessing a fixed delay.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(100)
    if (await evaluate("!!document.querySelector('.hero__stage')")) return
  }
  throw new Error(`.hero__stage never appeared at ${viewport.label}`)
}

await send('Runtime.enable')
await send('Page.enable')

console.log(`verify.mjs → ${targetUrl}\n`)

/* ---------- assertion 1: no uncaught exception while loading ---------- */

for (const viewport of VIEWPORTS) {
  await loadAt(viewport)
  await sleep(400)
}
check(
  '1. no Runtime.exceptionThrown',
  exceptions.length === 0,
  `${exceptions.length} exception(s)${exceptions.length ? `: ${exceptions[0]}` : ''}`,
)

/* ---------- assertion 8: the hero fits in one screen ---------- */

const heroRatios = []
for (const viewport of VIEWPORTS) {
  await loadAt(viewport)
  await sleep(400)
  const measured = await evaluate(`(() => {
    const hero = document.querySelector('.hero')
    const rect = hero.getBoundingClientRect()
    return {
      heroHeight: Math.round(rect.height),
      vh: window.innerHeight,
      ratio: +(rect.height / window.innerHeight).toFixed(3),
    }
  })()`)
  heroRatios.push({ ...viewport, ...measured })
  check(
    `8. hero height / vh ≤ 1.05 at ${viewport.label}`,
    measured.ratio <= 1.05,
    `hero ${measured.heroHeight}px, vh ${measured.vh}px, ratio ${measured.ratio}`,
  )
}

/* ---------- assertion 9: the stage geometry covers the viewport ---------- */

for (const viewport of VIEWPORTS) {
  await loadAt(viewport)
  await sleep(400)
  const stage = await evaluate(`(() => {
    const el = document.querySelector('.hero__stage')
    const rect = el.getBoundingClientRect()
    const root = document.documentElement
    return {
      left: +rect.left.toFixed(1),
      width: +rect.width.toFixed(1),
      clientW: root.clientWidth,
      scrollW: root.scrollWidth,
      sbw: getComputedStyle(root).getPropertyValue('--sbw').trim(),
      pointerEvents: getComputedStyle(el).pointerEvents,
      ariaHidden: el.getAttribute('aria-hidden'),
    }
  })()`)

  check(
    `9a. stage left ≈ 0 at ${viewport.label}`,
    Math.abs(stage.left) <= 1,
    `left ${stage.left}, --sbw ${stage.sbw || '(unset)'}`,
  )
  check(
    `9b. stage width ≥ clientWidth at ${viewport.label}`,
    stage.width >= stage.clientW - 1,
    `width ${stage.width}, clientWidth ${stage.clientW}`,
  )
  check(
    `9c. no horizontal overflow at ${viewport.label}`,
    stage.scrollW <= stage.clientW + 1,
    `scrollWidth ${stage.scrollW}, clientWidth ${stage.clientW}`,
  )
  check(
    `9d. stage is decoration only at ${viewport.label}`,
    stage.pointerEvents === 'none' && stage.ariaHidden === 'true',
    `pointer-events ${stage.pointerEvents}, aria-hidden ${stage.ariaHidden}`,
  )
}

ws.close()
chrome.kill()
await sleep(SHUTDOWN_GRACE)

console.log('')
if (failures.length > 0) {
  console.log(`FAILED ${failures.length}/${assertCount}: ${failures.join(' | ')}`)
  process.exit(1)
}
console.log(`OK — ${assertCount}/${assertCount} checks passed`)
process.exit(0)
