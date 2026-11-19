/** Capture console errors + exceptions from the preview build. */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const PORT = 4502
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=D:/ai项目（自用）/.tmp/cdp-diag',
  '--window-size=1440,900',
  '--no-first-run',
  '--disable-extensions',
  'about:blank',
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
  if (!target) throw new Error('no CDP target')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id
    pending.set(n, resolve)
    ws.send(JSON.stringify({ id: n, method, params }))
  })

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      console.log('EXCEPTION:', (d.exception?.description || d.text || '').slice(0, 900))
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      console.log('CONSOLE ERROR:', msg.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 600))
    }
  })

  await new Promise((resolve) => ws.on('open', resolve))
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:4400/?diag=1' })
  await sleep(3000)
  const state = await send('Runtime.evaluate', {
    expression: 'document.querySelector(".hero__stage") ? "HAS_STAGE" : "NO_STAGE"; document.body.innerHTML.length',
    returnByValue: true,
  })
  console.log('BODY LEN:', state.result?.result?.value)
  ws.close()
} catch (err) {
  console.log('DIAG ERROR:', err.message)
} finally {
  chrome.kill()
}
