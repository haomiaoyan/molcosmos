import { useEffect, useMemo, useState } from 'react'
import { CLASS_COLORS, CLASS_LABELS, universeStats } from '../lib/galaxy'
import {
  ELEMENT_COLORS,
  estimateHydrogens,
  molecularFormula,
  type Molecule,
  type MoleculeProps,
} from '../lib/molecule'
import { MolecularStructureCanvas } from './CosmosScene'
import { SceneBoundary } from './SceneBoundary'

interface Props {
  molecule: Molecule | null
  onClose: () => void
}

/** Radar-chart axes for the property panel. */
const AXES = [
  { key: 'mw', label: '分子量', ideal: 350, scale: 700 },
  { key: 'logP', label: 'logP', ideal: 2.5, scale: 9 },
  { key: 'hbd', label: '供体', ideal: 2, scale: 6 },
  { key: 'hba', label: '受体', ideal: 5, scale: 12 },
  { key: 'rings', label: '环数', ideal: 3, scale: 5 },
] as const

function radarPoints(props: MoleculeProps): string {
  return AXES.map((axis, i) => {
    const value = props[axis.key]
    const closeness = Math.exp(-((value - axis.ideal) ** 2) / (2 * (axis.scale / 4) ** 2))
    const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
    const r = 6 + closeness * 50
    return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`
  }).join(' ')
}

export function MoleculePanel({ molecule, onClose }: Props) {
  const hydrogens = useMemo(
    () => (molecule ? estimateHydrogens(molecule.props.counts, molecule.props.rings) : 0),
    [molecule],
  )
  const [panelClosing, setPanelClosing] = useState(false)

  useEffect(() => {
    setPanelClosing(false)
  }, [molecule])

  if (!molecule) return null

  const close = () => {
    setPanelClosing(true)
    setTimeout(onClose, 180)
  }

  const cls = molecule.drugClass
  const formula = molecularFormula(molecule.props.counts, hydrogens)

  return (
    <aside
      className={`mol-panel ${panelClosing ? 'mol-panel--closing' : ''}`}
      aria-label={`分子 ${molecule.id} 详情`}
    >
      <header className="mol-panel__head">
        <div>
          <p className="mol-panel__eyebrow mono">{molecule.id}</p>
          <h3 className="mol-panel__title">{formula}</h3>
        </div>
        <button type="button" className="mol-panel__close" onClick={close} aria-label="关闭详情">
          ✕
        </button>
      </header>

      <div className="mol-panel__structure">
        <div className="mol-panel__structure-canvas">
          <SceneBoundary
            fallback={
              <div className="mol-panel__structure-fallback">
                <span className="mono">{formula}</span>
                <p className="muted">当前设备无法渲染 3D 结构，性质数据不受影响</p>
              </div>
            }
          >
            <MolecularStructureCanvas molecule={molecule} />
          </SceneBoundary>
        </div>
        <p className="mol-panel__hint muted">
          合成示例分子 · 球棍模型为示意布局，非真实构象
        </p>
      </div>

      <div className="mol-panel__score">
        <span className="mol-panel__score-label">类药潜力</span>
        <div className="score-bar" role="img" aria-label={`类药潜力 ${(molecule.score * 100).toFixed(0)}%`}>
          <span
            className="score-bar__fill"
            style={{ width: `${molecule.score * 100}%`, background: CLASS_COLORS[cls] }}
          />
        </div>
        <span className="mol-panel__score-value mono" style={{ color: CLASS_COLORS[cls] }}>
          {(molecule.score * 100).toFixed(0)}
        </span>
      </div>

      <div className="mol-panel__badges">
        <span className={`badge badge--${cls}`}>{CLASS_LABELS[cls]}</span>
        {molecule.lipinskiViolations.length === 0 ? (
          <span className="badge badge--clean">Lipinski 全通过 ✓</span>
        ) : (
          molecule.lipinskiViolations.map((v) => (
            <span key={v} className="badge badge--violation">
              {v}
            </span>
          ))
        )}
      </div>

      <div className="mol-panel__radar">
        <svg viewBox="0 0 160 150" role="img" aria-label="性质雷达图">
          <g transform="translate(80, 78)">
            {[0.33, 0.66, 1].map((ring) => (
              <polygon
                key={ring}
                className="radar__ring"
                points={AXES.map((_, i) => {
                  const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
                  const r = ring * 56
                  return `${Math.cos(angle) * r},${Math.sin(angle) * r}`
                }).join(' ')}
              />
            ))}
            {AXES.map((axis, i) => {
              const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
              return (
                <line
                  key={axis.key}
                  className="radar__spoke"
                  x1={0}
                  y1={0}
                  x2={Math.cos(angle) * 56}
                  y2={Math.sin(angle) * 56}
                />
              )
            })}
            <polygon className="radar__value" points={radarPoints(molecule.props)} />
            {AXES.map((axis, i) => {
              const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
              return (
                <text
                  key={axis.key}
                  className="radar__label"
                  x={Math.cos(angle) * 68}
                  y={Math.sin(angle) * 68}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {axis.label}
                </text>
              )
            })}
          </g>
        </svg>
      </div>

      <dl className="mol-panel__props">
        <div>
          <dt>分子量</dt>
          <dd className="mono">{molecule.props.mw.toFixed(1)} Da</dd>
        </div>
        <div>
          <dt>logP（估计）</dt>
          <dd className="mono">{molecule.props.logP.toFixed(1)}</dd>
        </div>
        <div>
          <dt>氢键供体/受体</dt>
          <dd className="mono">
            {molecule.props.hbd} / {molecule.props.hba}
          </dd>
        </div>
        <div>
          <dt>环系</dt>
          <dd className="mono">{molecule.props.rings}</dd>
        </div>
      </dl>

      <ul className="mol-panel__atoms">
        {(['C', 'N', 'O', 'S'] as const).map((el) => (
          <li key={el}>
            <span className="swatch" style={{ background: ELEMENT_COLORS[el] }} aria-hidden="true" />
            <span className="mono">{el}</span>
            <span className="mono muted">{molecule.props.counts[el]}</span>
          </li>
        ))}
      </ul>

      <p className="mol-panel__disclaimer muted">
        本分子由固定种子确定性生成，性质为教学近似估计，不代表任何真实化合物。
      </p>
    </aside>
  )
}

export function UniverseLegend({ activeClass }: { activeClass?: string | null }) {
  const stats = useMemo(() => universeStats(), [])
  return (
    <div className="legend" aria-label="星等图例">
      {(['goldilocks', 'candidate', 'lead', 'far'] as const).map((cls) => (
        <button
          key={cls}
          type="button"
          className={`legend__item ${activeClass === cls ? 'legend__item--active' : ''}`}
        >
          <span className="legend__dot" style={{ background: CLASS_COLORS[cls] }} />
          <span className="legend__label">{CLASS_LABELS[cls]}</span>
          <span className="mono legend__count">{stats.byClass[cls]}</span>
        </button>
      ))}
      <p className="legend__hint muted">双击空白处返回全景 · 点击星辰查看分子</p>
    </div>
  )
}
