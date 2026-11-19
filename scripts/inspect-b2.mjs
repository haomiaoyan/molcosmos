/** Inspect B2 DOM state: section heads and timeline cards. */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import WebSocket from 'ws'

const PORT = 4503
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=D:/ai项目（自用）/.tmp/cdp-inspect',
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
  await send('Page.navigate', { url: 'http://127.0.0.1:4400/?inspect=1' })
  await sleep(2500)

  const expr = `(() => {
    const heads = [...document.querySelectorAll('.section__head')];
    const cards = [...document.querySelectorAll('.timeline__card')];
    const cs = cards[0] ? getComputedStyle(cards[0]) : null;
    return {
      headCount: heads.length,
      headTags: heads.map(h => h.tagName).join(','),
      headVisible: heads.map(h => getComputedStyle(h).visibility).join(','),
      cardCount: cards.length,
      cardClasses: cards[0] ? cards[0].className : 'none',
      cardPadding: cs ? cs.padding : 'none',
      cardBg: cs ? cs.backgroundColor : 'none',
      cardText: cards[0] ? cards[0].textContent.slice(0, 40) : 'none',
      bodyHeight: document.body.scrollHeight
    };
  })()`
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
  console.log(JSON.stringify(r.result?.result?.value, null, 2))
  ws.close()
} catch (e) {
  console.log('ERR', e.message)
} finally {
  chrome.kill()
}
