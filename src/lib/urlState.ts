/**
 * Shareable view state carried in the query string.
 *
 * Three keys travel in the URL: which molecule is open (`star`), which palette
 * is painted (`theme`) and which language the copy is in (`lang`). The point is
 * that a copied link reproduces what the sender is looking at — a demo you have
 * to re-configure by hand is a demo people stop sharing.
 *
 * Defaults are omitted so the common case stays a clean address: the authored
 * palette `cosmos` and `zh` never appear. Everything else does.
 *
 * Parsing is deliberately forgiving. A hand-edited or truncated link must still
 * open the page, so an unknown theme id is dropped rather than trusted, and a
 * malformed query string degrades to "no overrides".
 */

import { THEMES, type ThemeId } from './theme'
import type { Lang } from './i18n'

export interface UrlState {
  /** Molecule id such as `MCX-000123`, or null when nothing is open. */
  readonly star: string | null
  /** A palette the visitor asked for by link, or null for "use the stored one". */
  readonly theme: ThemeId | null
  /** A language the visitor asked for by link, or null for "use the stored one". */
  readonly lang: Lang | null
}

export const EMPTY_URL_STATE: UrlState = { star: null, theme: null, lang: null }

/** The palette the site paints when nobody has expressed a preference. */
export const DEFAULT_THEME: ThemeId = 'cosmos'
/** The language the copy is authored in. */
export const DEFAULT_LANG: Lang = 'zh'

const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id))

function parse(search: string): URLSearchParams {
  try {
    return new URLSearchParams(search)
  } catch {
    return new URLSearchParams()
  }
}

export function readUrlState(search: string): UrlState {
  const params = parse(search)
  const star = params.get('star')?.trim() ?? ''
  const theme = params.get('theme')
  const lang = params.get('lang')
  return {
    star: star.length > 0 ? star : null,
    theme: theme && THEME_IDS.has(theme) ? (theme as ThemeId) : null,
    lang: lang === 'zh' || lang === 'en' ? lang : null,
  }
}

export interface UrlWriting {
  readonly star: string | null
  readonly theme: ThemeId
  readonly lang: Lang
}

/**
 * Rebuilds the query string from the current view.
 *
 * Unrelated parameters (campaign tags, embed flags) are carried through rather
 * than dropped, and the three known keys are emitted first in a fixed order so
 * the address bar does not shuffle while the visitor clicks around.
 */
export function writeUrlState(search: string, state: UrlWriting): string {
  const written = new URLSearchParams()
  if (state.star) written.set('star', state.star)
  if (state.theme !== DEFAULT_THEME) written.set('theme', state.theme)
  if (state.lang !== DEFAULT_LANG) written.set('lang', state.lang)

  for (const [key, value] of parse(search)) {
    if (key === 'star' || key === 'theme' || key === 'lang') continue
    written.append(key, value)
  }

  const text = written.toString()
  return text ? `?${text}` : ''
}