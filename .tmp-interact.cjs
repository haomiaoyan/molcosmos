const { spawn } = require('child_process')
const fs = require('fs')
const http = require('http')
const crypto = require('crypto')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const PORT = 9336
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome4', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)

async function main() {
  for (let i = 0; i < 40; i++) { try { await getJson('/json/version'); break } catch { await sleep(250) } }
  const page = (await getJson('/json/list')).find(t => t.type === 'page')
  const WebSocket = require('ws')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
  const errors = []
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id)
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text))
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('ERR ' + msg.params.args.map(a => a.value || a.description).join(' '))
  })
  await new Promise(r => ws.on('open', r))
  await send('Runtime.enable'); await send('Page.enable')
  await send('Page.navigate', { url: URL })
  await sleep(6000)
  await send('Runtime.evaluate', { expression: `document.querySelector('#cosmos').scrollIntoView({block:'start'})` })
  await sleep(2500)

  const rect = JSON.parse((await send('Runtime.evaluate', {
    expression: `(() => { const r = document.querySelector('.cosmos-canvas canvas').getBoundingClientRect(); return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height}) })()`,
    returnByValue: true })).result.value)

  const shoot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(name, Buffer.from(s.data, 'base64'))
    return hash(Buffer.from(s.data, 'base64'))
  }

  const before = await shoot('.tmp-i-before.png')

  // 1. drag to rotate
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', buttons: 1, clickCount: 1 })
  for (let i = 1; i <= 10; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx + i * 22, y: cy + i * 5, button: 'left', buttons: 1 })
    await sleep(35)
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx + 220, y: cy + 50, button: 'left', buttons: 0, clickCount: 1 })
  await sleep(1200)
  const afterDrag = await shoot('.tmp-i-drag.png')
  console.log('drag changed view:', before !== afterDrag)

  // 2. click explore button 3 times
  const btn = JSON.parse((await send('Runtime.evaluate', {
    expression: `(() => { const b = document.querySelector('.explore-btn'); const r = b.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2}) })()`,
    returnByValue: true })).result.value)
  for (let i = 0; i < 3; i++) {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: btn.x, y: btn.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 })
      await sleep(60)
    }
    await sleep(900)
  }
  await sleep(1500)
  const afterExplore = await shoot('.tmp-i-explore.png')

  // 3. zoom via wheel
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx, y: cy, deltaX: 0, deltaY: -420 })
  await sleep(1200)
  const afterZoom = await shoot('.tmp-i-zoom.png')

  // 4. double click empty -> reset
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x + 60, y: rect.y + 60, button: 'left', buttons: 1, clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x + 60, y: rect.y + 60, button: 'left', buttons: 0, clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x + 60, y: rect.y + 60, button: 'left', buttons: 1, clickCount: 2 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x + 60, y: rect.y + 60, button: 'left', buttons: 0, clickCount: 2 })
  await sleep(2200)
  const afterReset = await shoot('.tmp-i-reset.png')

  const alive = await send('Runtime.evaluate', {
    expression: `JSON.stringify({root: !!document.querySelector('.app'), canvases: document.querySelectorAll('canvas').length, bodyH: document.body.scrollHeight})`,
    returnByValue: true })
  console.log('page alive after all interactions:', alive.result.value)
  console.log('hashes:', { before, afterDrag, afterExplore, afterZoom, afterReset })
  console.log('explore changed view:', afterDrag !== afterExplore, '| zoom changed view:', afterExplore !== afterZoom)
  console.log('errors:', errors.length ? JSON.stringify(errors.slice(0, 6), null, 2) : 'none')
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
