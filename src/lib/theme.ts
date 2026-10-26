/**
 * Background palettes for MolCosmos.
 *
 * A theme is just a bag of CSS custom properties written onto <html>, plus the
 * two colours the WebGL canvas cannot read from CSS (scene background and fog).
 * Keeping the whole palette in one place means a new theme is one entry, and
 * every surface — nav, panels, popovers, the star field — follows for free.
 *
 * The molecule class colours (goldilocks gold, candidate teal, lead blue,
 * outlier grey) are deliberately NOT themed: they encode data, so they must
 * stay constant while the backdrop changes.
 */

export type ThemeId = 'cosmos' | 'midnight' | 'nebula' | 'abyss' | 'ember'

export interface Theme {
  id: ThemeId
  /** Label keys resolved through i18n. */
  labelKey: 'theme.cosmos' | 'theme.midnight' | 'theme.nebula' | 'theme.abyss' | 'theme.ember'
  /** Three dots shown in the picker, in reading order. */
  swatch: readonly [string, string, string]
  /** Colour of the WebGL scene background and fog. */
  sceneBg: string
  vars: Record<string, string>
}

/** Shared text/line colours, overridden per theme only where it matters. */
const baseText = {
  '--text': '#e6ecff',
  '--text-dim': '#9aa7cc',
  '--text-mute': '#5f6c92',
}

export const THEMES: readonly Theme[] = [
  {
    id: 'cosmos',
    labelKey: 'theme.cosmos',
    swatch: ['#05060f', '#6ea8fe', '#ffd47e'],
    sceneBg: '#05060f',
    vars: {
      '--accent-rgb': '255 212 126',
      '--accent-2-rgb': '55 226 200',
      '--accent-3-rgb': '179 137 255',
      '--accent-4-rgb': '110 168 254',
      '--line-rgb': '122 143 205',
      ...baseText,
      '--bg': '#05060f',
      '--bg-2': '#0a0d1e',
      '--panel': 'rgba(14, 18, 38, 0.72)',
      '--panel-solid': '#10142a',
      '--line': 'rgba(122, 143, 205, 0.18)',
      '--line-strong': 'rgba(122, 143, 205, 0.38)',
      '--scrim': 'rgba(5, 6, 15, 0.72)',
      '--scrim-soft': 'rgba(5, 6, 15, 0.55)',
      '--scrim-solid': 'rgba(10, 13, 30, 0.92)',
      '--scrim-panel': 'rgba(8, 10, 24, 0.96)',
      '--accent': '#ffd47e',
      '--on-accent': '#150d04',
      '--accent-2': '#37e2c8',
      '--accent-3': '#b389ff',
      '--accent-4': '#6ea8fe',
      '--shadow': '0 18px 60px rgba(0, 0, 0, 0.55)',
      '--glow': '0 0 42px rgba(255, 212, 126, 0.22)',
    },
  },
  {
    id: 'midnight',
    labelKey: 'theme.midnight',
    swatch: ['#04070d', '#8fb6ff', '#cfe3ff'],
    sceneBg: '#04070d',
    vars: {
      '--accent-rgb': '207 227 255',
      '--accent-2-rgb': '127 216 232',
      '--accent-3-rgb': '157 182 255',
      '--accent-4-rgb': '109 155 255',
      '--line-rgb': '139 168 214',
      ...baseText,
      '--bg': '#04070d',
      '--bg-2': '#080d16',
      '--panel': 'rgba(13, 20, 32, 0.74)',
      '--panel-solid': '#0d1420',
      '--line': 'rgba(139, 168, 214, 0.16)',
      '--line-strong': 'rgba(139, 168, 214, 0.36)',
      '--scrim': 'rgba(4, 7, 13, 0.76)',
      '--scrim-soft': 'rgba(4, 7, 13, 0.58)',
      '--scrim-solid': 'rgba(9, 15, 24, 0.93)',
      '--scrim-panel': 'rgba(8, 13, 21, 0.96)',
      '--text': '#e8f0ff',
      '--text-dim': '#9fb2cf',
      '--text-mute': '#66799a',
      '--accent': '#cfe3ff',
      '--on-accent': '#05080f',
      '--accent-2': '#7fd8e8',
      '--accent-3': '#9db6ff',
      '--accent-4': '#6d9bff',
      '--shadow': '0 18px 60px rgba(0, 0, 0, 0.6)',
      '--glow': '0 0 42px rgba(207, 227, 255, 0.2)',
    },
  },
  {
    id: 'nebula',
    labelKey: 'theme.nebula',
    swatch: ['#0b0618', '#c77dff', '#ff9ecb'],
    sceneBg: '#0b0618',
    vars: {
      '--accent-rgb': '255 179 217',
      '--accent-2-rgb': '126 240 208',
      '--accent-3-rgb': '199 125 255',
      '--accent-4-rgb': '143 157 255',
      '--line-rgb': '178 140 230',
      ...baseText,
      '--bg': '#0b0618',
      '--bg-2': '#140a26',
      '--panel': 'rgba(26, 14, 46, 0.72)',
      '--panel-solid': '#1a0e2e',
      '--line': 'rgba(178, 140, 230, 0.2)',
      '--line-strong': 'rgba(178, 140, 230, 0.42)',
      '--scrim': 'rgba(11, 6, 24, 0.74)',
      '--scrim-soft': 'rgba(11, 6, 24, 0.56)',
      '--scrim-solid': 'rgba(20, 10, 36, 0.93)',
      '--scrim-panel': 'rgba(18, 9, 32, 0.96)',
      '--text': '#f0e6ff',
      '--text-dim': '#b6a3d6',
      '--text-mute': '#7c6a9c',
      '--accent': '#ffb3d9',
      '--on-accent': '#2a0a1c',
      '--accent-2': '#7ef0d0',
      '--accent-3': '#c77dff',
      '--accent-4': '#8f9dff',
      '--shadow': '0 18px 60px rgba(8, 0, 20, 0.62)',
      '--glow': '0 0 42px rgba(255, 179, 217, 0.24)',
    },
  },
  {
    id: 'abyss',
    labelKey: 'theme.abyss',
    swatch: ['#03110f', '#3fd6b8', '#8ff0dc'],
    sceneBg: '#03110f',
    vars: {
      '--accent-rgb': '143 240 220',
      '--accent-2-rgb': '63 214 184',
      '--accent-3-rgb': '111 208 255',
      '--accent-4-rgb': '94 200 224',
      '--line-rgb': '94 190 178',
      ...baseText,
      '--bg': '#03110f',
      '--bg-2': '#061c1a',
      '--panel': 'rgba(9, 32, 30, 0.72)',
      '--panel-solid': '#0a2422',
      '--line': 'rgba(94, 190, 178, 0.18)',
      '--line-strong': 'rgba(94, 190, 178, 0.4)',
      '--scrim': 'rgba(3, 17, 15, 0.74)',
      '--scrim-soft': 'rgba(3, 17, 15, 0.56)',
      '--scrim-solid': 'rgba(6, 26, 24, 0.93)',
      '--scrim-panel': 'rgba(5, 22, 20, 0.96)',
      '--text': '#dffaf4',
      '--text-dim': '#93c9c1',
      '--text-mute': '#578c85',
      '--accent': '#8ff0dc',
      '--on-accent': '#03201c',
      '--accent-2': '#3fd6b8',
      '--accent-3': '#6fd0ff',
      '--accent-4': '#5ec8e0',
      '--shadow': '0 18px 60px rgba(0, 12, 10, 0.6)',
      '--glow': '0 0 42px rgba(143, 240, 220, 0.22)',
    },
  },
  {
    id: 'ember',
    labelKey: 'theme.ember',
    swatch: ['#0d0705', '#ffa65c', '#ff7a5c'],
    sceneBg: '#0d0705',
    vars: {
      '--accent-rgb': '255 192 120',
      '--accent-2-rgb': '255 159 104',
      '--accent-3-rgb': '255 122 92',
      '--accent-4-rgb': '255 166 92',
      '--line-rgb': '214 154 108',
      ...baseText,
      '--bg': '#0d0705',
      '--bg-2': '#1a0f09',
      '--panel': 'rgba(34, 20, 13, 0.74)',
      '--panel-solid': '#22140d',
      '--line': 'rgba(214, 154, 108, 0.18)',
      '--line-strong': 'rgba(214, 154, 108, 0.4)',
      '--scrim': 'rgba(13, 7, 5, 0.74)',
      '--scrim-soft': 'rgba(13, 7, 5, 0.56)',
      '--scrim-solid': 'rgba(28, 16, 10, 0.93)',
      '--scrim-panel': 'rgba(24, 13, 8, 0.96)',
      '--text': '#ffeede',
      '--text-dim': '#d3ab8c',
      '--text-mute': '#8e6a51',
      '--accent': '#ffc078',
      '--on-accent': '#2a1004',
      '--accent-2': '#ff9f68',
      '--accent-3': '#ff7a5c',
      '--accent-4': '#ffa65c',
      '--shadow': '0 18px 60px rgba(14, 3, 0, 0.62)',
      '--glow': '0 0 42px rgba(255, 166, 92, 0.26)',
    },
  },
]

export const THEME_KEY = 'molcosmos.theme.v1'

export function themeById(id: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]
}

export function loadTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored && THEMES.some((theme) => theme.id === stored)) return stored as ThemeId
  } catch {
    /* storage unavailable: keep the default palette */
  }
  return 'cosmos'
}

export function saveTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(THEME_KEY, id)
  } catch {
    /* a lost preference is not worth breaking the page over */
  }
}

/** Writes the palette onto <html> so every CSS rule picks it up at once. */
export function applyTheme(id: ThemeId): void {
  const theme = themeById(id)
  const root = document.documentElement
  for (const [name, value] of Object.entries(theme.vars)) {
    root.style.setProperty(name, value)
  }
  root.dataset.theme = theme.id
  // The scrollbar and form controls are painted by the browser, not by us.
  root.style.colorScheme = 'dark'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.sceneBg)
}
