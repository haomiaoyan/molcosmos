import { useEffect, useMemo, useRef, useState } from 'react'
import { CLASS_COLORS, CLASS_LABEL_KEYS } from '../lib/galaxy'
import { useI18n, type StringKey } from '../lib/i18n'
import {
  ELEMENT_COLORS,
  layoutStructure,
  type AtomElement,
  type Molecule,
  type MoleculeProps,
} from '../lib/molecule'

/** How many molecules the comparison accepts at once. */
export const COMPARE_LIMIT = 3

/** Distinct hues for the overlay, independent of the class colours. */
const SERIES_COLORS = ['#ffd47e', '#37e2c8', '#6ea8fe'] as const

/** Radar axes — identical geometry to the detail panel, so the shapes match. */
const AXES = [
  { key: 'mw', label: 'panel.axis.mw', ideal: 350, scale: 700 },
  { key: 'logP', label: 'panel.axis.logP', ideal: 2.5, scale: 9 },
  { key: 'hbd', label: 'panel.axis.hbd', ideal: 2, scale: 6 },
  { key: 'hba', label: 'panel.axis.hba', ideal: 5, scale: 12 },
  { key: 'rings', label: 'panel.axis.rings', ideal: 3, scale: 5 },
] as const satisfies readonly { key: keyof MoleculeProps; label: StringKey; ideal: number; scale: number }[]

type RowKey = 'mw' | 'logP' | 'hbd' | 'hba' | 'rings' | 'score'

const ROWS: readonly { key: RowKey; label: StringKey; digits: number; higherIsBetter: boolean }[] = [
  { key: 'mw', label: 'compare.row.mw', digits: 0, higherIsBetter: false },
  { key: 'logP', label: 'compare.row.logP', digits: 1, higherIsBetter: false },
  { key: 'hbd', label: 'compare.row.hbd', digits: 0, higherIsBetter: false },
  { key: 'hba', label: 'compare.row.hba', digits: 0, higherIsBetter: false },
  { key: 'rings', label: 'compare.row.rings', digits: 0, higherIsBetter: false },
  { key: 'score', label: 'compare.row.score', digits: 3, higherIsBetter: true },
] as const

interface Props {
  molecules: Molecule[]
}

/**
 * Side-by-side comparison of the shortlisted molecules.
 *
 * Lives in its own section rather than on top of the galaxy: the detail panel
 * already needs most of the stage height, and overlaying a comparison would
 * have covered the very stars the visitor is choosing between.
 */
export function CompareSection({ molecules }: Props) {
  const { t } = useI18n()
  // Seed from the shortlist so the section is useful on arrival; the visitor can
  // still deselect everything, and later additions are never auto-picked.
  const [picked, setPicked] = useState<string[]>(() =>
    molecules.slice(0, COMPARE_LIMIT).map((m) => m.id),
  )

  // Drop selections that fell out of the shortlist, and keep the order stable.
  useEffect(() => {
    setPicked((prev) => prev.filter((id) => molecules.some((m) => m.id === id)).slice(0, COMPARE_LIMIT))
  }, [molecules])

  const chosen = useMemo(
    () => picked.map((id) => molecules.find((m) => m.id === id)).filter((m): m is Molecule => Boolean(m)),
    [picked, molecules],
  )

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= COMPARE_LIMIT) return prev
      return [...prev, id]
    })
  }

  const bestByRow = useMemo(() => {
    const out = {} as Record<RowKey, number>
    for (const row of ROWS) {
      const values = chosen.map((m) => valueOf(m, row.key))
      out[row.key] = row.higherIsBetter ? Math.max(...values) : Math.min(...values)
    }
    return out
  }, [chosen])

  return (
    <section className="section" id="compare" aria-labelledby="compare-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('compare.eyebrow')}</p>
        <h2 id="compare-title" className="section__title">
          {t('compare.title.pre')}
          <span className="accent-text">{t('compare.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('compare.lead')}</p>
      </header>

      {molecules.length === 0 ? (
        <p className="compare__empty muted">{t('compare.empty')}</p>
      ) : (
        <>
          <div className="compare__picker">
            <div className="compare__picker-head">
              <span className="compare__picker-label mono">{t('compare.pick')}</span>
              <span className="compare__picker-count mono">
                {t('compare.selected', { count: picked.length })}
              </span>
            </div>
            <ul className="compare__chips">
              {molecules.map((m) => {
                const index = picked.indexOf(m.id)
                const active = index >= 0
                const disabled = !active && picked.length >= COMPARE_LIMIT
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`compare__chip${active ? ' compare__chip--active' : ''}`}
                      onClick={() => toggle(m.id)}
                      aria-pressed={active}
                      disabled={disabled}
                      style={active ? { borderColor: SERIES_COLORS[index], color: SERIES_COLORS[index] } : undefined}
                    >
                      <span className="mono">{m.id}</span>
                      <em style={{ color: CLASS_COLORS[m.drugClass] }}>{t(CLASS_LABEL_KEYS[m.drugClass])}</em>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="compare__hint muted">{t('compare.limit')}</p>
          </div>

          {chosen.length === 0 ? (
            <p className="compare__empty muted">{t('compare.needTwo')}</p>
          ) : (
            <div className="compare">
              <div className="compare__panel">
                <h3 className="compare__subtitle">{t('compare.structures')}</h3>
                <StructuresRow molecules={chosen} />
              </div>

              <div className="compare__panel">
                <h3 className="compare__subtitle">{t('compare.radarAria')}</h3>
                <RadarOverlay molecules={chosen} />
                <ul className="compare__legend">
                  {chosen.map((m, i) => (
                    <li key={m.id}>
                      <span className="compare__dot" style={{ background: SERIES_COLORS[i] }} aria-hidden="true" />
                      <span className="mono">{m.id}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="compare__panel compare__panel--wide">
                <h3 className="compare__subtitle">{t('compare.table')}</h3>
                <table className="compare__table">
                  <thead>
                    <tr>
                      <th scope="col">{t('compare.metric')}</th>
                      {chosen.map((m, i) => (
                        <th key={m.id} scope="col" style={{ color: SERIES_COLORS[i] }}>
                          <span className="mono">{m.id}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.key}>
                        <th scope="row">{t(row.label)}</th>
                        {chosen.map((m) => {
                          const value = valueOf(m, row.key)
                          const isBest = chosen.length > 1 && Math.abs(value - bestByRow[row.key]) < 1e-9
                          return (
                            <td key={m.id} className={isBest ? 'compare__best' : undefined}>
                              {row.key === 'score' ? value.toFixed(3) : value.toFixed(row.digits)}
                              {isBest && <span className="compare__best-mark" title={t('compare.best')}>★</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">{t('compare.row.class')}</th>
                      {chosen.map((m) => (
                        <td key={m.id} style={{ color: CLASS_COLORS[m.drugClass] }}>
                          {t(CLASS_LABEL_KEYS[m.drugClass])}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function valueOf(molecule: Molecule, key: RowKey): number {
  if (key === 'score') return molecule.score
  return molecule.props[key]
}

/* ------------------------------------------------------------------ */
/* structures: up to three molecules, one canvas                       */
/* ------------------------------------------------------------------ */

const CELL = 300
const ELEMENT_SCALE: Record<AtomElement, number> = { C: 1, N: 1, O: 1.05, S: 1.2 }

function StructuresRow({ molecules }: { molecules: Molecule[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => setWidth(canvas.clientWidth))
    observer.observe(canvas)
    setWidth(canvas.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // One square cell per molecule; on narrow screens the canvas shrinks with
    // the cells instead of keeping a tall empty band under the structures.
    const count = Math.max(1, molecules.length)
    const cell = Math.min(CELL, width / count)
    const height = Math.round(Math.min(CELL, Math.max(132, cell * 1.08)))
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const spacing = Math.min(cell, height)
    const offset = (width - spacing * count) / 2
    molecules.forEach((molecule, index) => {
      drawStructure(ctx, molecule, offset + index * spacing + spacing / 2, height / 2, spacing * 0.46)
    })
  }, [molecules, width])

  return <canvas ref={canvasRef} className="compare__canvas" aria-hidden="true" />
}

/** Flat, tilted projection — one static frame, no animation, no WebGL. */
function drawStructure(
  ctx: CanvasRenderingContext2D,
  molecule: Molecule,
  cx: number,
  cy: number,
  radiusPx: number,
): void {
  const layout = layoutStructure(molecule)
  if (layout.atoms.length === 0) return

  const n = layout.atoms.length
  const mx = layout.atoms.reduce((s, a) => s + a.x, 0) / n
  const my = layout.atoms.reduce((s, a) => s + a.y, 0) / n
  const mz = layout.atoms.reduce((s, a) => s + a.z, 0) / n

  const pts = layout.atoms.map((a) => {
    const x = a.x - mx
    const y = a.y - my
    const z = a.z - mz
    // Same fixed tilt as the hero molecule, so the two read as one visual family.
    const tilt = (-12 * Math.PI) / 180
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt)
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt)
    const p = 560 / (560 - z2 * 1.6)
    return { element: a.element, x: cx + x * p, y: cy + y2 * p, z: z2, p }
  })

  const maxR = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)), 1e-6)
  const scale = radiusPx / maxR
  for (const p of pts) {
    p.x = cx + (p.x - cx) * scale
    p.y = cy + (p.y - cy) * scale
  }

  const depth = (z: number) => 0.45 + 0.55 * ((z + 3) / 6)
  // Atom size follows the cell, never the layout scale — the layout is in
  // bond-length units, so multiplying by it would blow the atoms up.
  const atomPx = radiusPx * 0.085

  // bonds
  for (const [from, to] of layout.bonds) {
    const a = pts[from]
    const b = pts[to]
    ctx.save()
    ctx.globalAlpha = depth((a.z + b.z) / 2) * 0.9
    ctx.strokeStyle = '#9aa6c9'
    ctx.lineWidth = Math.max(1, atomPx * 0.34)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }

  // atoms, back to front
  const order = [...pts].sort((l, r) => l.z - r.z)
  for (const p of order) {
    const r = atomPx * ELEMENT_SCALE[p.element] * (0.82 + 0.18 * p.p)
    const base = ELEMENT_COLORS[p.element]
    ctx.save()
    ctx.globalAlpha = depth(p.z)
    ctx.fillStyle = base
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(1.8, r), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/* ------------------------------------------------------------------ */
/* radar overlay                                                       */
/* ------------------------------------------------------------------ */

function RadarOverlay({ molecules }: { molecules: Molecule[] }) {
  const size = 300
  const center = size / 2
  const maxR = 92

  const pointFor = (axisIndex: number, closeness: number) => {
    const angle = (axisIndex / AXES.length) * Math.PI * 2 - Math.PI / 2
    const r = 6 + closeness * maxR
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r] as const
  }

  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg className="compare__radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="">
      {rings.map((ring) => (
        <polygon
          key={ring}
          className="compare__radar-ring"
          points={AXES.map((_, i) => {
            const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
            const r = 6 + ring * maxR
            return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`
          }).join(' ')}
        />
      ))}
      {AXES.map((axis, i) => {
        const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
        return (
          <line
            key={axis.key}
            className="compare__radar-spoke"
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * (6 + maxR)}
            y2={center + Math.sin(angle) * (6 + maxR)}
          />
        )
      })}

      {molecules.map((molecule, index) => {
        const points = AXES.map((axis, i) => {
          const value = molecule.props[axis.key]
          const closeness = Math.exp(-((value - axis.ideal) ** 2) / (2 * (axis.scale / 4) ** 2))
          return pointFor(i, closeness)
        })
        return (
          <g key={molecule.id}>
            <polygon
              className="compare__radar-shape"
              points={points.map(([x, y]) => `${x},${y}`).join(' ')}
              style={{ stroke: SERIES_COLORS[index], fill: SERIES_COLORS[index] }}
            />
            {points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={2.4} fill={SERIES_COLORS[index]} />
            ))}
          </g>
        )
      })}

      {AXES.map((axis, i) => {
        const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
        const r = 6 + maxR + 18
        const x = center + Math.cos(angle) * r
        const y = center + Math.sin(angle) * r
        return (
          <text
            key={axis.key}
            className="compare__radar-label"
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <RadarLabel axisKey={axis.label} />
          </text>
        )
      })}
    </svg>
  )
}

function RadarLabel({ axisKey }: { axisKey: (typeof AXES)[number]['label'] }) {
  const { t } = useI18n()
  return <>{t(axisKey)}</>
}
