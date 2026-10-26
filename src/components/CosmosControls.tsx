import { useEffect, useMemo, useRef, useState } from 'react'
import { CLASS_COLORS, CLASS_LABELS, type ExplorationStar } from '../lib/galaxy'
import { formulaOf, searchMolecules, type SearchHit } from '../lib/search'
import type { Molecule } from '../lib/molecule'

interface Props {
  generated: ExplorationStar[]
  onSelect: (m: Molecule) => void
  onRandom: () => void
}

/**
 * Search over the whole universe by id, formula or class label, plus a dice
 * for a random star. The result list is a real combobox: arrows move, Enter
 * opens, Escape clears, and clicking outside closes it.
 */
export function CosmosControls({ generated, onSelect, onRandom }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(() => searchMolecules(query, generated), [query, generated])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const choose = (hit: SearchHit) => {
    onSelect(hit.molecule)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (hits.length === 0) return
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setCursor((c) => (c + delta + hits.length) % hits.length)
      setOpen(true)
      return
    }
    if (event.key === 'Enter' && hits.length > 0) {
      event.preventDefault()
      choose(hits[cursor] ?? hits[0])
      return
    }
    if (event.key === 'Escape') {
      setQuery('')
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const listOpen = open && hits.length > 0

  return (
    <div className={`cosmos-search ${listOpen ? 'cosmos-search--open' : ''}`} ref={wrapRef}>
      <div className="cosmos-search__field">
        <span className="cosmos-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          className="cosmos-search__input"
          type="search"
          value={query}
          placeholder="搜索编号 / 分子式 / 类别"
          aria-label="搜索分子"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls="cosmos-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="cosmos-search__dice"
          onClick={onRandom}
          title="随机漫游到一个分子"
          aria-label="随机漫游"
        >
          ⤮
        </button>
      </div>

      {listOpen && (
        <ul className="cosmos-results" id="cosmos-search-results" role="listbox" aria-label="搜索结果">
          {hits.map((hit, i) => (
            <li key={hit.molecule.id} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                className={`cosmos-results__item ${i === cursor ? 'cosmos-results__item--active' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(hit)}
              >
                <span
                  className="cosmos-results__dot"
                  style={{ background: CLASS_COLORS[hit.molecule.drugClass] }}
                  aria-hidden="true"
                />
                <span className="cosmos-results__id mono">{hit.molecule.id}</span>
                <span className="cosmos-results__formula mono">{formulaOf(hit.molecule)}</span>
                <span className="cosmos-results__class muted">{CLASS_LABELS[hit.molecule.drugClass]}</span>
                <span className="cosmos-results__why muted">
                  {hit.reason === 'id' ? '编号' : hit.reason === 'formula' ? '分子式' : '类别'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
