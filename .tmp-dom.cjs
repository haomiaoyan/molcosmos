const { spawn } = require('child_process')
const http = require('http')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const PORT = 9338
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome6', 'about:blank'], { stdio: 'ignore' })
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

  // Count WebGL draw calls via renderer info exposed on canvas? Use performance proxy instead:
  // Simply count <points> objects isn't possible from DOM. Instead read the React fiber tree.
  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const cv = document.querySelector('.cosmos-canvas canvas')
      const keys = Object.keys(cv)
      const state = cv.__r3f?.root?.getState?.() || null
      return JSON.stringify({ keys, hasState: !!state, samples: keys.slice(0,10) })
    })()`,
    returnByValue: true })
  console.log(info.result.value)
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
