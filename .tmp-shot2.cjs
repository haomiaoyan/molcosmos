const { spawn } = require('child_process')
const fs = require('fs')
const http = require('http')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const OUT = process.argv[3]
const SCROLL = process.argv[4] || ''
const PORT = 9334
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome2', 'about:blank'], { stdio: 'ignore' })
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
  const errors = []
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id)
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push('EXC ' + msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''))
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('ERR ' + msg.params.args.map(a => a.value || a.description).join(' '))
  })
  await new Promise(r => ws.on('open', r))
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: URL })
  await sleep(5000)
  if (SCROLL) {
    await send('Runtime.evaluate', { expression: `(() => { const el = document.querySelector('${SCROLL}'); if (el) el.scrollIntoView({block:'start'}); return !!el })()` })
    await sleep(3500)
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
  const state = await send('Runtime.evaluate', {
    expression: `JSON.stringify({panel: !!document.querySelector('.mol-panel'), canvasCount: document.querySelectorAll('canvas').length, title: (document.querySelector('.mol-panel__title')||{}).textContent || null})`,
    returnByValue: true,
  })
  console.log('state:', state.result.value)
  console.log('errors:', errors.length ? JSON.stringify(errors.slice(0, 6), null, 2) : 'none')
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
