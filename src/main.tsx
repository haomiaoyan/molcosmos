import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, loadTheme } from './lib/theme'
import { registerGsap } from './lib/gsap'
import './styles.css'
import './components/rb/styles/rb.css'
import './components/rb/styles/hero-rb.css'
import './components/rb/styles/sections-rb.css'

// Paint the saved palette before the first render so a returning visitor never
// sees a flash of the default theme.
applyTheme(loadTheme())

// Register plugins before any component mounts. FadeContent's scroll trigger
// runs in a layout effect, which fires before the App's passive useEffect used
// to call registerGsap(); an unregistered ScrollTrigger throws
// "core.context is not a function" from its constructor.
registerGsap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
