const { spawn } = require('child_process')
const http = require('http')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const PORT = 9340
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome8', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const getJson = (path) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
  }).on('error', rej)
})
async function main() {
  for (let i = 0; i < 40; i++) { try { await getJson('/json/version'); break } catch { await sleep(250) } }
  const page = (await getJson('/json/list')).find(t => t.type === 'page')
  const WebSocket = require('ws')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0; const pending = new Map()
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params }))
  })
  ws.on('message', raw => {
    const m = JSON.parse(raw)
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result) }
  })
  await new Promise(r => ws.on('open', r))
  await send('Runtime.enable'); await send('Page.enable')
  await send('Page.navigate', { url: URL })
  await sleep(6000)
  await send('Runtime.evaluate', { expression: `document.querySelector('#cosmos').scrollIntoView({block:'start'})` })
  await sleep(1500)
  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const b = document.querySelector('.explore-btn')
      const r = b.getBoundingClientRect()
      const cs = getComputedStyle(b)
      const cx = r.left + r.width/2, cy = r.top + r.height/2
      const top = document.elementFromPoint(cx, cy)
      return JSON.stringify({
        rect: {x:r.left,y:r.top,w:r.width,h:r.height},
        inViewport: r.top >= 0 && r.bottom <= innerHeight,
        vh: innerHeight,
        pointerEvents: cs.pointerEvents, zIndex: cs.zIndex, position: cs.position,
        topElement: top ? (top.tagName + '.' + top.className) : null,
        topIsButton: top === b || (top && b.contains(top)),
        scrollY: scrollY,
      })
    })()`, returnByValue: true })
  console.log(info.result.value)
  // try JS click
  await send('Runtime.evaluate', { expression: `document.querySelector('.explore-btn').click()` })
  await sleep(2500)
  const probe = `(() => {
    const cv = document.querySelector('.cosmos-canvas canvas')
    const key = Object.keys(cv).find(k => k.startsWith('__reactFiber$'))
    let fiber = cv[key]; while (fiber.return) fiber = fiber.return
    const found = []
    const walk = f => { if (!f) return; const p = f.memoizedProps; if (p && Array.isArray(p.explorationStars)) found.push(p.explorationStars.length); walk(f.child); walk(f.sibling) }
    walk(fiber); return JSON.stringify(found)
  })()`
  const after = await send('Runtime.evaluate', { expression: probe, returnByValue: true })
  console.log('after JS click, explorationStars:', after.result.value)
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
