const { spawn } = require('child_process')
const http = require('http')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2]
const PORT = 9337
const child = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1600,1000', '--hide-scrollbars',
  '--user-data-dir=' + process.cwd() + '/.tmp-chrome5', 'about:blank'], { stdio: 'ignore' })
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
  await sleep(2000)

  const probe = `(() => {
    const cv = document.querySelector('.cosmos-canvas canvas')
    if (!cv) return 'no canvas'
    const r3f = cv.__r3f
    if (!r3f) return 'no __r3f'
    const store = r3f.root || r3f.store
    if (!store) return 'keys:' + Object.keys(r3f).join(',')
    const scene = store.getState().scene
    const out = []
    scene.traverse(o => {
      if (o.isPoints) out.push({ type: 'points', count: o.geometry.attributes.position.count, color: o.material.uniforms?.uTint?.value?.getHexString?.() })
    })
    return JSON.stringify(out)
  })()`

  const before = await send('Runtime.evaluate', { expression: probe, returnByValue: true })
  console.log('BEFORE:', before.result.value)

  const btn = JSON.parse((await send('Runtime.evaluate', {
    expression: `(() => { const b = document.querySelector('.explore-btn'); const r = b.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2}) })()`,
    returnByValue: true })).result.value)
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: btn.x, y: btn.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 })
    await sleep(80)
  }
  await sleep(2000)
  const after = await send('Runtime.evaluate', { expression: probe, returnByValue: true })
  console.log('AFTER :', after.result.value)
  ws.close(); child.kill()
}
main().catch(e => { console.error('FAIL', e.message); child.kill(); process.exit(1) })
