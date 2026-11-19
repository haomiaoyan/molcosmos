/**
 * B2 mechanical rewrite: wrap every section head in the shared SectionHead
 * entrance wrapper. Idempotent-safe: only touches exact open/close pairs.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'src', 'components')
const FILES = ['Sections.tsx', 'Sections2.tsx', 'TimelineSection.tsx', 'LabSection.tsx']

const OPEN = '<header className="section__head">'
const CLOSE = '</header>'

for (const name of FILES) {
  const file = path.join(ROOT, name)
  // Some files are CRLF, some LF. Normalise so the import anchor matches.
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const opens = src.split(OPEN).length - 1
  const closes = src.split(CLOSE).length - 1
  if (opens === 0) continue
  if (opens !== closes) {
    throw new Error(`${name}: ${opens} opens but ${closes} closes; refusing partial edit`)
  }

  src = src.split(OPEN).join('<SectionHead>')
  src = src.split(CLOSE).join('</SectionHead>')

  // One import per file, inserted after the react/i18n imports.
  if (!src.includes("from './rb/SectionHead'")) {
    const i18n = "import { useI18n } from '../lib/i18n'\n"
    if (!src.includes(i18n)) throw new Error(`${name}: i18n import anchor missing`)
    src = src.replace(i18n, i18n + "import { SectionHead } from './rb/SectionHead'\n")
  }

  fs.writeFileSync(file, src)
  console.log(`${name}: ${opens} head(s) wrapped`)
}
