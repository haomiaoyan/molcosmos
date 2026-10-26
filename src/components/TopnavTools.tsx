import { useEffect, useRef, useState } from 'react'
import { GITHUB } from '../config'
import { useI18n } from '../lib/i18n'
import { THEMES, type ThemeId } from '../lib/theme'

interface Props {
  themeId: ThemeId
  onTheme: (id: ThemeId) => void
}

/**
 * Top-bar controls: background palette, language, and the GitHub link.
 *
 * The palette lives in a popover rather than five inline dots so the nav keeps
 * one row on a laptop and collapses cleanly on a phone.
 */
export function TopnavTools({ themeId, onTheme }: Props) {
  const { t, lang, toggleLang } = useI18n()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!paletteOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setPaletteOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [paletteOpen])

  const current = THEMES.find((theme) => theme.id === themeId) ?? THEMES[0]

  return (
    <div className="topnav__tools" ref={wrapRef}>
      <div className="palette">
        <button
          type="button"
          className={`palette__toggle ${paletteOpen ? 'palette__toggle--open' : ''}`}
          onClick={() => setPaletteOpen((v) => !v)}
          aria-expanded={paletteOpen}
          aria-label={t('nav.theme')}
          title={t('nav.theme')}
        >
          <span className="palette__swatch" aria-hidden="true">
            {current.swatch.map((color) => (
              <i key={color} style={{ background: color }} />
            ))}
          </span>
          <span className="palette__name">{t(current.labelKey)}</span>
        </button>

        {paletteOpen && (
          <div className="palette__menu" role="menu" aria-label={t('nav.theme')}>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme.id === themeId}
                className={`palette__option ${theme.id === themeId ? 'palette__option--active' : ''}`}
                onClick={() => {
                  onTheme(theme.id)
                  setPaletteOpen(false)
                }}
              >
                <span className="palette__swatch" aria-hidden="true">
                  {theme.swatch.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <span className="palette__option-label">{t(theme.labelKey)}</span>
                <span className="palette__check" aria-hidden="true">
                  {theme.id === themeId ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="lang-toggle"
        onClick={toggleLang}
        aria-label={t('nav.lang')}
        title={t('nav.lang')}
      >
        <span className={lang === 'zh' ? 'lang-toggle__on' : ''}>中</span>
        <span className="lang-toggle__sep" aria-hidden="true">
          /
        </span>
        <span className={lang === 'en' ? 'lang-toggle__on' : ''}>EN</span>
      </button>

      <a
        className="topnav__github"
        href={GITHUB.repo}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={t('nav.github')}
        title={t('nav.github')}
      >
        <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.96 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.28.82 2.15 0 3.08-1.87 3.75-3.66 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.14.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
      </a>
    </div>
  )
}
