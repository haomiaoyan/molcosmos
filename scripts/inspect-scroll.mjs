/** Verify section heads become visible after scrolling into view. */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const PORT = 4504
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=D:/ai项目（自用）/.tmp/cdp-scroll',
  '--window-size=1440,900', '--no-first-run', '--disable-extensions', 'about:blank',
], { stdio: 'ignore' })

try {
  let target = null
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch {}
    await sleep(200)
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id; pending.set(n, resolve)
    ws.send(JSON.stringify({ id: n, method, params }))
  })
  ws.on('message', (raw) => {
    const m = JSON.parse(raw)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  })
  await new Promise((r) => ws.on('open', r))
  await send('Runtime.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:4400/?scrollcheck=1' })
  await sleep(2000)

  const ids = ['pipeline', 'funnel', 'stats', 'lab', 'timeline', 'method', 'limits']
  for (const id of ids) {
    await send('Runtime.evaluate', {
      expression: `document.getElementById('${id}').scrollIntoView({block:'center'})`,
    })
    await sleep(500)
    const r = await send('Runtime.evaluate', {
      expression: `(() => {const h=document.querySelector('#${id} .section__head');const c=getComputedStyle(h);return {vis:c.visibility,op:c.opacity,txt:h.textContent.slice(0,18)}})()`,
      returnByValue: true,
    })
    console.log(id, JSON.stringify(r.result?.result?.value))
  }
  ws.close()
} catch (e) {
  console.log('ERR', e.message)
} finally {
  chrome.kill()
}
