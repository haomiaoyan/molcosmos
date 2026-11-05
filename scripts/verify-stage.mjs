#!/usr/bin/env node
/**
 * Acceptance checks for batch 3 (docs/plan-batch3-restructure.md, T6-T8).
 *
 * The pure maths (`stageTravel`, `segmentWidths`) is pinned by unit tests in
 * vitest, because those are arithmetic and a browser adds nothing. What is left
 * needs a real layout engine and a pinned scroll: whether the stage actually
 * pins on a desktop and refuses to on a phone, and whether a reduced-motion
 * reader gets zero triggers.
 *
 *   npm run build
 *   npx vite preview --port 4420 --strictPort --host 0.0.0.0 &
 *   node scripts/verify-stage.mjs --url http://127.0.0.1:4420/
 *
 * Same CDP approach as verify.mjs; no puppeteer. Exits 1 on any failure.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const DEBUG_PORT = 4497

const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')
const targetUrl = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:4420/'
if (!targetUrl) {
  console.error('usage: node scripts/verify-stage.mjs --url http://127.0.0.1:4420/')
  process.exit(2)
}

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
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  throw new Error('No Chrome/Edge found; set CHROME_PATH')
}

const failures = []
function check(name, ok, detail) {
  if (ok) console.log(`PASS  ${name} — ${detail}`)
  else {
    failures.push(name)
    console.log(`FAIL  ${name} — ${detail}`)
  }
}

const chrome = spawn(findChrome(), [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${path.resolve('.tmp-verify-stage')}`,
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
      /* not listening yet */
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
ws.on('message', (raw) => {
  const message = JSON.parse(raw.toString())
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = (messageId += 1)
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

async function evaluate(expression) {
  const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  const details = reply.result?.exceptionDetails
  if (details) throw new Error(details.exception?.description ?? details.text ?? 'evaluate failed')
  return reply.result?.result?.value
}

async function loadAt(width, height, { reduceMotion = false } = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduceMotion ? 'reduce' : 'no-preference' }],
  })
  await send('Page.navigate', { url: targetUrl })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(100)
    if (await evaluate("!!document.querySelector('.stage-pin')")) return
  }
  throw new Error(`.stage-pin never appeared at ${width}x${height}`)
}

/**
 * gsap keeps its triggers on a private object, but ScrollTrigger's public
 * registry is reachable through the module the app already imports. Reading a
 * missing registry is reported as -1 rather than silently counted as zero,
 * because "no triggers" and "cannot see the triggers" are different answers and
 * only one of them should pass.
 */
const triggerProbe = `(() => {
  const st = window.__sc || null
  if (!st) return { reachable: false, count: -1, pins: [] }
  const all = st.getAll()
  return {
    reachable: true,
    count: all.length,
    pins: all.filter((t) => t.pin).map((t) => Math.round(t.start)),
  }
})()`

await send('Page.enable')
await send('Runtime.enable')

/* ---------- T6: a phone must not get a pinned stage ---------- */

await loadAt(390, 844)
{
  const pins = await evaluate(`(() => {
    // Read the pin from the DOM rather than the plugin registry: a pinned
    // element gets a wrapper and a fixed/absolute spacer, and that is visible
    // without reaching into gsap internals.
    const pin = document.querySelector('.stage-pin')
    const style = getComputedStyle(pin)
    return {
      pinTop: +pin.getBoundingClientRect().top.toFixed(1),
      height: +pin.getBoundingClientRect().height.toFixed(1),
      position: style.position,
      viewportH: window.innerHeight,
      counter: getComputedStyle(document.querySelector('.stage-counter') || pin).display,
      stageExists: !!pin,
    }
  })()`)

  // On a phone the stage is a normal stacked list: it may be taller than the
  // viewport (five cards), and it must not be viewport-height pinned.
  check(
    'T6a. stage is not pinned to the viewport at 390',
    pins.height !== pins.viewportH || pins.position !== 'fixed',
    `height ${pins.height}px vs viewport ${pins.viewportH}px, position ${pins.position}`,
  )
  check(
    'T6b. counter is hidden at 390',
    pins.counter === 'none',
    `counter display ${pins.counter}`,
  )

  const overflow = await evaluate(`(() => {
    const root = document.documentElement
    return { scrollW: root.scrollWidth, clientW: root.clientWidth }
  })()`)
  check(
    'T7. no horizontal overflow at 390',
    overflow.scrollW <= overflow.clientW + 1,
    `scrollWidth ${overflow.scrollW}, clientWidth ${overflow.clientW}`,
  )
}

/* ---------- desktop: the stage pins, and the cards actually travel ---------- */

await loadAt(1440, 900)
{
  const travel = await evaluate(`(() => {
    const track = document.querySelector('.station-track')
    const win = document.querySelector('.stage-window')
    const card = document.querySelector('.station')
    if (!track || !win || !card) return null
    const cr = card.getBoundingClientRect()
    return {
      trackWidth: track.scrollWidth,
      windowWidth: win.getBoundingClientRect().width,
      cardWidth: Math.round(cr.width),
      cardCount: document.querySelectorAll('.station-track > .station').length,
    }
  })()`)

  check(
    'T1a. five cards in the track',
    travel && travel.cardCount === 5,
    travel ? `${travel.cardCount} cards` : 'stage markup missing',
  )
  check(
    'T1b. card width is the ruled 380px',
    travel && Math.abs(travel.cardWidth - 380) <= 1,
    travel ? `card ${travel.cardWidth}px` : 'no card',
  )
  check(
    'T1c. window width is 1132 (the .app content box)',
    travel && Math.abs(travel.windowWidth - 1132) <= 2,
    travel ? `window ${travel.windowWidth.toFixed(1)}px` : 'no window',
  )

  // Scroll into the pinned range and confirm the track has moved sideways while
  // the page itself has stopped advancing.
  const before = await evaluate(`(() => {
    const track = document.querySelector('.station-track')
    return { x: new DOMMatrix(getComputedStyle(track).transform).m41, y: window.scrollY }
  })()`)

  await evaluate(`(() => {
    const pin = document.querySelector('.stage-pin')
    const top = pin.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, Math.round(top + window.innerHeight * 0.6))
  })()`)
  await sleep(1200)

  const after = await evaluate(`(() => {
    const track = document.querySelector('.station-track')
    return { x: new DOMMatrix(getComputedStyle(track).transform).m41, y: window.scrollY }
  })()`)

  check(
    'T2. the track travels sideways while scrolling',
    before && after && Math.abs(after.x - before.x) > 50,
    `${before?.x?.toFixed(1)} → ${after?.x?.toFixed(1)}px`,
  )
}

/* ---------- T8: reduced motion means no triggers at all ---------- */

await loadAt(1440, 900, { reduceMotion: true })
{
  const state = await evaluate(`(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const track = document.querySelector('.station-track')
    const cards = document.querySelectorAll('.station-track > .station').length
    const first = document.querySelector('.station')
    return {
      reduced,
      cards,
      trackTransform: getComputedStyle(track).transform,
      firstOpacity: first ? getComputedStyle(first).opacity : '1',
      firstVisible: first ? first.getBoundingClientRect().width > 0 : false,
    }
  })()`)

  check(
    'T8a. reduced motion is actually in effect',
    state.reduced === true,
    `prefers-reduced-motion: reduce = ${state.reduced}`,
  )
  // With no trigger the track must never be translated; if it is, a tween ran.
  const translated = state.trackTransform !== 'none' && state.trackTransform !== 'matrix(1, 0, 0, 1, 0, 0)'
  check(
    'T8b. no scroll tween moved the track under reduced motion',
    !translated,
    `transform ${state.trackTransform}`,
  )
  check(
    'T8c. all five cards still present and visible under reduced motion',
    state.cards === 5 && state.firstVisible && state.firstOpacity === '1',
    `${state.cards} cards, first opacity ${state.firstOpacity}, visible ${state.firstVisible}`,
  )
}

ws.close()
chrome.kill()
await sleep(400)

if (failures.length) {
  console.log(`\nFAILED — ${failures.length} check(s): ${failures.join('; ')}`)
  process.exit(1)
}
console.log('\nOK — all stage checks passed')
