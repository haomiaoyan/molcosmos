/**
 * One-time landing script for React Bits components used by MolCosmos B1.
 *
 * Reads the registry payloads cached in ../../.tmp/rb-*-JS-CSS.json and writes
 * adapted TSX/CSS into src/components/rb/. Kept as a script (not inline shell)
 * so the transformation is reproducible and reviewable.
 *
 * Run from the molcosmos dir: node scripts/land-rb.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE = path.resolve(ROOT, '..', '.tmp')
const OUT = path.join(ROOT, 'src', 'components', 'rb')

const NAMES = ['StarBorder', 'SpotlightCard', 'ClickSpark', 'Magnet', 'FadeContent']

const HEADER = (name, src) => `// @ts-nocheck -- vendored upstream JSX; typed at the index.ts boundary.
/**
 * Adapted from React Bits (${src}), free JS-CSS variant.
 * Landed ${new Date().toISOString().slice(0, 10)} for MolCosmos B1.
 * Local changes: removed 'use client', colours routed through project theme
 * tokens via resolveColor(), gsap imported from the app's single registration
 * point, and reduced-motion is respected. Upstream upgrades need a manual re-landing.
 */
`

/** Resolve a CSS custom property to a concrete colour for canvas drawing. */
const RESOLVER = `
/** Canvas effects need concrete colours; read them from the active theme. */
export function resolveColor(token: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  return value || fallback
}
`

const out = []
fs.mkdirSync(path.join(OUT, 'styles'), { recursive: true })

async function loadPayload(name) {
  const file = path.join(CACHE, `rb-${name}-JS-CSS.json`)
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  // Reproducible without the scratch cache: fetch from the public registry.
  const url = `https://reactbits.dev/r/${name}-JS-CSS`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name}: registry ${res.status}`)
  return res.json()
}

for (const name of NAMES) {
  const payload = await loadPayload(name)
  const dir = path.join(OUT, name)
  fs.mkdirSync(dir, { recursive: true })

  for (const f of payload.files) {
    const base = path.basename(f.path)
    let content = f.content

    if (base.endsWith('.jsx')) {
      content = content.replace(/^'use client';\n\n?/, '')
      content = content.replace(/\bexport default (\w+);?\s*$/, 'export default $1\n')

      if (name === 'FadeContent') {
        content = content
          .replace("import { gsap } from 'gsap';\n", '')
          .replace("import { ScrollTrigger } from 'gsap/ScrollTrigger';\n\n", '')
          .replace(/gsap\.registerPlugin\(ScrollTrigger\);\n/, '')
        // Both symbols come from the app's one registration point. Removing
        // the ScrollTrigger import would break the (unused) scroll branch.
        // Depth: src/components/rb/FadeContent/ -> src/lib/.
        content = "import { gsap, ScrollTrigger } from '../../../lib/gsap'\n" + content
        // Render as any element so the hero heading stays an <h1>.
        content = content.replace(
          'const FadeContent = ({\n  children,',
          'const FadeContent = ({\n  as: Tag = \'div\',\n  children,',
        )
        // Fail-visible: a JS error must never leave the headline invisible.
        content = content.replace(
          '<div ref={ref} className={className} style={{ visibility: \'hidden\', ...style }} {...props}>',
          '<Tag ref={ref} className={className} style={{ visibility: \'visible\', ...style }} {...props}>',
        )
        content = content.replace(
          /(<Tag ref=\{ref\}[\s\S]*?\{children\}\n)\s*<\/div>/,
          '$1    </Tag>',
        )
      }

      // Palette must be read at render time: applyTheme() runs in an effect.
      content = content.replace(
        /const palette = THEMES\[theme\] \?\? THEMES\.dark;/,
        'const palette = getTheme();',
      )

      // Mirror the CSS block rename for components that ship their own CSS.
      // Custom properties carry a -- prefix and must not be renamed.
      if ((payload.files || []).some((f) => f.path.endsWith('.css'))) {
        const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        content = content.replace(new RegExp(`(?<!--)${kebab}`, 'g'), `rb-${kebab}`)
      }

      if (name === 'StarBorder') {
        // Route the canvas light and CSS surfaces through theme tokens.
        content = content
          .replace(/const THEMES = \{[\s\S]*?\n\};\n/, `const getTheme = () => ({
  surface: resolveColor('--panel-solid', '#10142a'),
  text: resolveColor('--text', '#e6ecff'),
  track: resolveColor('--line-strong', 'rgba(122, 143, 205, 0.38)'),
  light: resolveColor('--accent', '#ffd47e')
});
`)
        content = content.replace(
          "'--star-border-surface': backgroundColor ?? palette.surface,",
          "'--star-border-surface': backgroundColor ?? resolveColor('--panel-solid', '#10142a'),",
        )
        content = content.replace(
          "'--star-border-text': textColor ?? palette.text,",
          "'--star-border-text': textColor ?? resolveColor('--text', '#e6ecff'),",
        )
        content = content.replace(
          "'--star-border-track': borderColor ?? palette.track,",
          "'--star-border-track': borderColor ?? 'rgb(var(--line-rgb) / 0.38)',",
        )
      }

      if (name === 'SpotlightCard') {
        content = content.replace(
          /const THEMES = \{[\s\S]*?\n\};\n/,
          `const getTheme = () => ({
  surface: resolveColor('--panel-solid', '#10142a'),
  border: resolveColor('--line', 'rgba(122, 143, 205, 0.18)'),
  shadow: 'var(--shadow)',
  light: resolveColor('--accent', '#ffd47e'),
  fill: 1,
  edge: 1
});
`,
        )
      }

      if (name === 'ClickSpark') {
        content = content.replace("sparkColor = '#fff'", "sparkColor = resolveColor('--accent', '#ffd47e')")
      }

      // Canvas colours must be concrete; resolveColor() reads the active theme.
      if (/resolveColor\(/.test(content)) {
        content = "import { resolveColor } from '../themeColor'\n" + content
      }

      content = HEADER(name, `https://reactbits.dev/r/${name}-JS-CSS`) + content

      const tsx = base.replace(/\.jsx$/, '.tsx')
      fs.writeFileSync(path.join(dir, tsx), content)
      out.push(`${name}/${tsx}`)
    } else if (base.endsWith('.css')) {
      // Rename the BEM block in CSS only; JSX is renamed separately below.
      const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      // Skip custom properties (--star-border-*) so injection still works.
      const rename = new RegExp(`(?<!--)${kebab}`, 'g')
      content = content.replace(rename, `rb-${kebab}`)
      fs.writeFileSync(path.join(dir, base), `/* React Bits ${name}: block renamed to .rb-${kebab} */\n${content}`)
      out.push(`${name}/${base}`)
    }
  }
}

fs.writeFileSync(path.join(OUT, 'themeColor.ts'), RESOLVER.trimStart())
// index.ts is a hand-written typed boundary and must not be overwritten here.
if (!fs.existsSync(path.join(OUT, 'index.ts'))) {
  throw new Error('src/components/rb/index.ts is missing; restore the typed boundary before re-landing')
}
fs.writeFileSync(
  path.join(OUT, 'styles', 'rb.css'),
  `@import '../StarBorder/StarBorder.css';\n@import '../SpotlightCard/SpotlightCard.css';\n`,
)

console.log(out.join('\n'))
console.log('landed', out.length, 'files + 3 helpers into', OUT)
