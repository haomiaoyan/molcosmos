const { spawn } = require('child_process')
const http = require('http')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const PORT = 9335
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome3', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}
async function main() {
  for (let i = 0; i < 40; i++) { try { await getJson('/json/version'); break } catch { await sleep(250) } }
  const targets = await getJson('/json/list')
  const page = targets.find(t => t.type === 'page')
  const WebSocket = require('ws')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id)
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
    }
  })
  await new Promise(r => ws.on('open', r))
  await send('Runtime.enable'); await send('Page.enable')
  await send('Page.navigate', { url: URL })
  await sleep(6000)
  // scroll the cosmos section into view
  await send('Runtime.evaluate', { expression: `document.querySelector('#cosmos').scrollIntoView({block:'start'})` })
  await sleep(2500)

  const rectRes = await send('Runtime.evaluate', {
    expression: `(() => { const c = document.querySelector('.cosmos-canvas canvas'); const r = c.getBoundingClientRect(); return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height}) })()`,
    returnByValue: true,
  })
  const rect = JSON.parse(rectRes.result.value)
  console.log('canvas rect:', rect)

  const cursorAt = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
    await sleep(60)
    const r = await send('Runtime.evaluate', {
      expression: `document.querySelector('.cosmos-canvas canvas').style.cursor || '(unset)'`,
      returnByValue: true,
    })
    return r.result.value
  }

  let found = null
  const stepX = Math.max(40, Math.floor(rect.w / 18))
  const stepY = Math.max(40, Math.floor(rect.h / 12))
  for (let y = rect.y + 40; y < rect.y + rect.h - 40 && !found; y += stepY) {
    for (let x = rect.x + 40; x < rect.x + rect.w - 40; x += stepX) {
      if ((await cursorAt(x, y)) === 'pointer') { found = { x, y }; break }
    }
  }
  console.log('star hit at:', found)

  if (!found) { console.log('RESULT: FAIL no clickable star found'); ws.close(); child.kill(); return }

  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: found.x, y: found.y, button: 'left', buttons: 1, clickCount: 1 })
  await sleep(50)
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: found.x, y: found.y, button: 'left', buttons: 0, clickCount: 1 })
  await sleep(2200)

  const after = await send('Runtime.evaluate', {
    expression: `JSON.stringify({panel: !!document.querySelector('.mol-panel'), title: (document.querySelector('.mol-panel__title')||{}).textContent||null, canvas: document.querySelectorAll('canvas').length})`,
    returnByValue: true,
  })
  console.log('after click:', after.result.value)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  require('fs').writeFileSync('.tmp-click.png', Buffer.from(shot.data, 'base64'))
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
