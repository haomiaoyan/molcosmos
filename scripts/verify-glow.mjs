#!/usr/bin/env node
/**
 * Acceptance checks for the cursor-light fix (docs/plan-glow-fix.md, G1-G8).
 *
 * Separate from scripts/verify.mjs on purpose: that script guards the batch 1
 * and 2 invariants and is a CI gate, while this one checks the pointer light's
 * size and its two-boundary behaviour, which need synthesised mouse movement.
 *
 *   npm run build
 *   npx vite preview --port 4419 --strictPort --host 0.0.0.0 &
 *   node scripts/verify-glow.mjs --url http://127.0.0.1:4419/
 *
 * Same CDP approach as verify.mjs (fetch /json/list -> ws -> Runtime.evaluate);
 * no puppeteer. Exits 1 on the first failed assertion so it can gate CI.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const DEBUG_PORT = 4496

const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')
const targetUrl = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:4419/'
if (!targetUrl) {
  console.error('usage: node scripts/verify-glow.mjs --url http://127.0.0.1:4419/')
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
  `--user-data-dir=${path.resolve('.tmp-verify-glow')}`,
  '--window-size=1440,900',
  '--no-first-run',
  '--disable-extensions',
  '--force-color-profile=srgb',
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

/**
 * Reloads, and waits for the light element to exist.
 *
 * `setTouchEmulationEnabled` is deliberately absent here: CDP does not undo it.
 * Switching it back to `false` leaves `(hover: hover)` at `false` for the rest
 * of the session, which made every later viewport report the light as hidden —
 * a false FAIL, and before that a false PASS because a hidden element measures
 * 0px. Touch is therefore a separate browser launch, below.
 */
async function loadAt(width, height, { reduceMotion = false } = {}) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
  })
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduceMotion ? 'reduce' : 'no-preference' }],
  })
  await send('Page.navigate', { url: targetUrl })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(100)
    if (await evaluate("!!document.querySelector('.hero__stage-viewport-light')")) return
  }
  throw new Error(`hero never appeared at ${width}x${height}`)
}

/** The light's own box, plus the numbers the CSS is derived from. */
const lightBox = `(() => {
  const el = document.querySelector('.hero__stage-viewport-light')
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return {
    w: +r.width.toFixed(1), h: +r.height.toFixed(1),
    left: +r.left.toFixed(1), top: +r.top.toFixed(1),
    cx: +(r.left + r.width / 2).toFixed(1), cy: +(r.top + r.height / 2).toFixed(1),
    display: cs.display, opacity: +cs.opacity,
  }
})()`

/** Move the real pointer via CDP, then read the custom properties. */
async function moveTo(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' })
  await sleep(350)
  return evaluate(`(() => {
    const hero = document.querySelector('.hero')
    const cs = getComputedStyle(hero)
    const el = document.querySelector('.hero__stage-viewport-light')
    return {
      mOn: cs.getPropertyValue('--m-on').trim(),
      px: cs.getPropertyValue('--px').trim(),
      py: cs.getPropertyValue('--py').trim(),
      opacity: +getComputedStyle(el).opacity,
    }
  })()`)
}

await send('Page.enable')
await send('Runtime.enable')

/* ---------- G1/G2/G3: the light is small enough at every viewport ---------- */

// 390 is a touch viewport on purpose: Q4 hides the light there, so its geometry
// is checked at a *desktop* narrow width instead. Measuring a `display: none`
// element returns a zero-sized rect, and `0 <= cap` would pass without proving
// anything — the earlier version of this script did exactly that.
for (const [w, h, label] of [
  [1440, 900, '1440x900'],
  [390, 844, '390x844 (narrow, non-touch)'],
  [2560, 1440, '2560x1440'],
]) {
  await loadAt(w, h)
  await moveTo(Math.round(w / 2), Math.round(h / 2))
  const box = await evaluate(lightBox)

  // Every geometry assertion first requires that the light is actually painted;
  // otherwise a hidden element passes every size cap by being zero.
  check(
    `G0. light is painted at ${label}`,
    box.display !== 'none' && box.w > 0,
    `display ${box.display}, width ${box.w}px`,
  )

  if (label === '1440x900') {
    check('G1. light edge <= 500px at 1440', box.w > 0 && box.w <= 500, `width ${box.w}px`)
  }
  if (label.startsWith('390x844')) {
    check('G2. light edge <= 0.8 * viewport at 390', box.w > 0 && box.w <= w * 0.8, `width ${box.w}px vs ${(w * 0.8).toFixed(0)}px cap`)
  }
  if (label === '2560x1440') {
    check('G3. light is capped at 620px on a wide viewport', box.w > 0 && box.w <= 620, `width ${box.w}px`)
  }
}

/* ---------- G4/G5/G5b: the light follows to the edges, and lands on the cursor ---------- */

await loadAt(1440, 900)
{
  const samples = []
  // 20 and 1420 are inside the old .hero dead zones (130..1310); 720 is the centre.
  for (const x of [20, 720, 1420]) {
    const field = await moveTo(x, 400)
    samples.push({ x, field })
  }

  const allOn = samples.every((s) => s.field.mOn === '1' && s.field.opacity > 0.9)
  check(
    'G4. light stays on at both screen edges',
    allOn,
    samples.map((s) => `x=${s.x} --m-on=${s.field.mOn} opacity=${s.field.opacity}`).join(', '),
  )

  const worst = Math.max(...samples.map((s) => Math.abs(parseFloat(s.field.px) - s.x)))
  check('G5. --px tracks the pointer', worst <= 1, `max error ${worst.toFixed(1)}px`)

  // The element is centred on the cursor by transform, so its own centre is the
  // honest visual check; comparing custom properties alone would miss a wrong
  // half-width in the transform.
  const centreErrors = []
  for (const x of [20, 720, 1420]) {
    await moveTo(x, 400)
    const box = await evaluate(lightBox)
    if (box.display === 'none' || box.w === 0) centreErrors.push(Number.POSITIVE_INFINITY)
    else centreErrors.push(Math.abs(box.cx - x))
  }
  const worstCentre = Math.max(...centreErrors)
  check('G5b. light centre sits on the cursor', worstCentre <= 8, `max offset ${worstCentre.toFixed(1)}px`)
}

/* ---------- G6: the light goes away once the hero leaves ---------- */

await loadAt(1440, 900)
{
  await moveTo(720, 400)
  await evaluate(`window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.55))`)
  await sleep(900)
  const scrolled = await evaluate(`(() => {
    const hero = document.querySelector('.hero')
    const cs = getComputedStyle(hero)
    return { mOn: cs.getPropertyValue('--m-on').trim(), scrollY: Math.round(window.scrollY) }
  })()`)
  await moveTo(720, 400)
  const afterMove = await evaluate(`getComputedStyle(document.querySelector('.hero')).getPropertyValue('--m-on').trim()`)
  check(
    'G6. light is off once the hero is scrolled away',
    scrolled.mOn === '0' && afterMove === '0',
    `scrollY ${scrolled.scrollY}, --m-on ${scrolled.mOn} then ${afterMove}`,
  )
}

/* ---------- G7: reduced motion hides the light ---------- */

await loadAt(1440, 900, { reduceMotion: true })
{
  await moveTo(720, 400)
  const box = await evaluate(lightBox)
  check('G7. light is hidden under reduced motion', box.display === 'none', `display ${box.display}`)
}

/* ---------- G8: touch hides the light, in its own browser ---------- */

// A separate launch, because touch emulation cannot be switched back off in a
// live session (see loadAt). Spawning costs a second and keeps the other eight
// assertions honest.
{
  const touchPort = DEBUG_PORT + 1
  const touchChrome = spawn(findChrome(), [
    '--headless=new',
    `--remote-debugging-port=${touchPort}`,
    `--user-data-dir=${path.resolve('.tmp-verify-glow-touch')}`,
    '--window-size=390,844',
    '--no-first-run',
    '--disable-extensions',
    'about:blank',
  ], { stdio: 'ignore' })

  let touchWs = null
  try {
    let page = null
    for (let attempt = 0; attempt < 60 && !page; attempt += 1) {
      await sleep(300)
      try {
        const list = await (await fetch(`http://127.0.0.1:${touchPort}/json/list`)).json()
        page = list.find((t) => t.type === 'page')
      } catch {
        /* not listening yet */
      }
    }
    if (!page) throw new Error('touch browser never came up')

    touchWs = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
    await new Promise((resolve, reject) => {
      touchWs.once('open', resolve)
      touchWs.once('error', reject)
    })

    let touchId = 0
    const touchPending = new Map()
    touchWs.on('message', (raw) => {
      const message = JSON.parse(raw.toString())
      if (message.id && touchPending.has(message.id)) {
        touchPending.get(message.id)(message)
        touchPending.delete(message.id)
      }
    })
    const touchSend = (method, params = {}) =>
      new Promise((resolve) => {
        const id = (touchId += 1)
        touchPending.set(id, resolve)
        touchWs.send(JSON.stringify({ id, method, params }))
      })

    await touchSend('Page.enable')
    await touchSend('Runtime.enable')
    await touchSend('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    })
    await touchSend('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await touchSend('Page.navigate', { url: targetUrl })
    await sleep(2600)

    const reply = await touchSend('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.hero__stage-viewport-light')
        return {
          display: el ? getComputedStyle(el).display : 'missing',
          coarse: window.matchMedia('(pointer: coarse)').matches,
          anyHover: window.matchMedia('(any-hover: hover)').matches,
        }
      })()`,
      returnByValue: true,
    })
    const touchState = reply.result?.result?.value ?? {}
    check(
      'G8. light is hidden on a touch viewport',
      touchState.display === 'none',
      `display ${touchState.display}, pointer:coarse ${touchState.coarse}, any-hover:hover ${touchState.anyHover}`,
    )
  } finally {
    touchWs?.close()
    touchChrome.kill()
  }
}

ws.close()
chrome.kill()
await sleep(400)

if (failures.length) {
  console.log(`\nFAILED — ${failures.length} check(s): ${failures.join('; ')}`)
  process.exit(1)
}
console.log('\nOK — all glow checks passed')
