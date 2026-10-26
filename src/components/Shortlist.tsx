import { useEffect, useRef, useState } from 'react'
import { CLASS_COLORS, CLASS_LABELS } from '../lib/galaxy'
import { SHORTLIST_LIMIT } from '../lib/shortlist'
import type { Molecule } from '../lib/molecule'

interface Props {
  molecules: Molecule[]
  onSelect: (m: Molecule) => void
  onRemove: (id: string) => void
  onClear: () => void
}

/**
 * The visitor's own shelf of molecules, collapsed to a chip until opened so it
 * does not fight the detail panel for room. Persisted as ids in localStorage,
 * so it survives a reload.
 */
export function Shortlist({ molecules, onSelect, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`shortlist ${open ? 'shortlist--open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="shortlist__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="我收藏的分子"
      >
        <span aria-hidden="true">★</span>
        短名单
        <span className="mono shortlist__count">
          {molecules.length}/{SHORTLIST_LIMIT}
        </span>
      </button>

      {open && (
        <div className="shortlist__body">
          {molecules.length === 0 ? (
            <p className="shortlist__empty muted">
              在分子详情里点 ☆ 收藏，方便回头对比。收藏保存在本机，刷新不会丢。
            </p>
          ) : (
            <>
              <ul className="shortlist__list">
                {molecules.map((m) => (
                  <li key={m.id} className="shortlist__row">
                    <button
                      type="button"
                      className="shortlist__open"
                      onClick={() => {
                        onSelect(m)
                        setOpen(false)
                      }}
                      title={`查看 ${m.id}`}
                    >
                      <span
                        className="shortlist__dot"
                        style={{ background: CLASS_COLORS[m.drugClass] }}
                        aria-hidden="true"
                      />
                      <span className="shortlist__id mono">{m.id}</span>
                      <span className="shortlist__score mono" style={{ color: CLASS_COLORS[m.drugClass] }}>
                        {(m.score * 100).toFixed(0)}
                      </span>
                      <span className="shortlist__class muted">{CLASS_LABELS[m.drugClass]}</span>
                    </button>
                    <button
                      type="button"
                      className="shortlist__remove"
                      onClick={() => onRemove(m.id)}
                      aria-label={`从短名单移除 ${m.id}`}
                      title="移出短名单"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="shortlist__clear" onClick={onClear}>
                清空短名单
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
