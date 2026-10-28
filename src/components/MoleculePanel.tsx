import { useEffect, useMemo, useState } from 'react'
import {
  CLASS_COLORS,
  CLASS_LABEL_KEYS,
  universeStats,
  type ExplorationStar,
  type MoleculeClass as ClassKey,
} from '../lib/galaxy'
import { useI18n, type StringKey } from '../lib/i18n'
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
  saved?: boolean
  onToggleSave?: (id: string) => void
  onShare?: (molecule: Molecule) => void
  /** True when the sandbox weights differ from the published defaults. */
  customWeights?: boolean
}

/**
 * Radar-chart axes for the property panel. Only geometry lives here; the
 * labels are i18n keys so the chart re-renders in the active language.
 */
const AXES = [
  { key: 'mw', label: 'panel.axis.mw', ideal: 350, scale: 700 },
  { key: 'logP', label: 'panel.axis.logP', ideal: 2.5, scale: 9 },
  { key: 'hbd', label: 'panel.axis.hbd', ideal: 2, scale: 6 },
  { key: 'hba', label: 'panel.axis.hba', ideal: 5, scale: 12 },
  { key: 'rings', label: 'panel.axis.rings', ideal: 3, scale: 5 },
] as const satisfies readonly { key: keyof MoleculeProps; label: StringKey; ideal: number; scale: number }[]

function radarPoints(props: MoleculeProps): string {
  return AXES.map((axis, i) => {
    const value = props[axis.key]
    const closeness = Math.exp(-((value - axis.ideal) ** 2) / (2 * (axis.scale / 4) ** 2))
    const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
    const r = 6 + closeness * 50
    return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`
  }).join(' ')
}

export function MoleculePanel({
  molecule,
  onClose,
  saved = false,
  onToggleSave,
  onShare,
  customWeights = false,
}: Props) {
  const { t } = useI18n()
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
  const isExploration = Boolean((molecule as Partial<ExplorationStar>).exploration)

  return (
    <aside
      className={`mol-panel ${panelClosing ? 'mol-panel--closing' : ''}`}
      aria-label={t('panel.aria', { id: molecule.id })}
    >
      <header className="mol-panel__head">
        <div>
          <p className="mol-panel__eyebrow mono">{molecule.id}</p>
          <h3 className="mol-panel__title">{formula}</h3>
        </div>
        <button type="button" className="mol-panel__close" onClick={close} aria-label={t('panel.close')}>
          ✕
        </button>
      </header>

      {(onToggleSave || onShare) && (
        <div className="mol-panel__actions">
          {onToggleSave && (
            <button
              type="button"
              className={`mol-panel__action ${saved ? 'mol-panel__action--on' : ''}`}
              onClick={() => onToggleSave(molecule.id)}
              aria-pressed={saved}
              title={saved ? t('panel.unsaveTitle') : t('panel.saveTitle')}
            >
              {saved ? t('panel.saved') : t('panel.save')}
            </button>
          )}
          {onShare && (
            <button
              type="button"
              className="mol-panel__action"
              onClick={() => onShare(molecule)}
              title={t('panel.shareTitle')}
            >
              {t('panel.share')}
            </button>
          )}
        </div>
      )}

      <div className="mol-panel__structure">
        <div className="mol-panel__structure-canvas">
          <SceneBoundary
            fallback={
              <div className="mol-panel__structure-fallback">
                <span className="mono">{formula}</span>
                <p className="muted">{t('panel.fallback')}</p>
              </div>
            }
          >
            <MolecularStructureCanvas molecule={molecule} />
          </SceneBoundary>
        </div>
        <p className="mol-panel__hint muted">{t('panel.hint')}</p>
      </div>

      <div className="mol-panel__score">
        <span className="mol-panel__score-label">
          {t('panel.score')}
          {customWeights && <em className="mol-panel__custom">{t('lab.custom')}</em>}
        </span>
        <div
          className="score-bar"
          role="img"
          aria-label={t('panel.scoreAria', { pct: (molecule.score * 100).toFixed(0) })}
        >
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
        {isExploration && <span className="badge badge--generated">{t('panel.generated')}</span>}
        <span className={`badge badge--${cls}`}>{t(CLASS_LABEL_KEYS[cls])}</span>
        {molecule.lipinskiViolations.length === 0 ? (
          <span className="badge badge--clean">{t('panel.lipinskiClean')}</span>
        ) : (
          molecule.lipinskiViolations.map((v) => (
            <span key={v} className="badge badge--violation">
              {v}
            </span>
          ))
        )}
      </div>

      <div className="mol-panel__radar">
        <svg viewBox="0 0 160 150" role="img" aria-label={t('panel.radarAria')}>
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
                  {t(axis.label)}
                </text>
              )
            })}
          </g>
        </svg>
      </div>

      <dl className="mol-panel__props">
        <div>
          <dt>{t('panel.prop.mw')}</dt>
          <dd className="mono">{molecule.props.mw.toFixed(1)} Da</dd>
        </div>
        <div>
          <dt>{t('panel.prop.logP')}</dt>
          <dd className="mono">{molecule.props.logP.toFixed(1)}</dd>
        </div>
        <div>
          <dt>{t('panel.prop.hb')}</dt>
          <dd className="mono">
            {molecule.props.hbd} / {molecule.props.hba}
          </dd>
        </div>
        <div>
          <dt>{t('panel.prop.rings')}</dt>
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

      <p className="mol-panel__disclaimer muted">{t('panel.disclaimer')}</p>
    </aside>
  )
}

export function UniverseLegend({
  activeClass,
  onSelectClass,
}: {
  activeClass?: string | null
  onSelectClass?: (cls: ClassKey) => void
}) {
  const { t } = useI18n()
  const stats = useMemo(() => universeStats(), [])
  return (
    <div className="legend" aria-label={t('legend.aria')}>
      {(['goldilocks', 'candidate', 'lead', 'far'] as const).map((cls) => (
        <button
          key={cls}
          type="button"
          className={`legend__item ${activeClass === cls ? 'legend__item--active' : ''}`}
          onClick={onSelectClass ? () => onSelectClass(cls) : undefined}
          aria-pressed={activeClass === cls}
          title={
            onSelectClass
              ? activeClass === cls
                ? t('legend.clear')
                : t('legend.only', { label: t(CLASS_LABEL_KEYS[cls]) })
              : undefined
          }
        >
          <span className="legend__dot" style={{ background: CLASS_COLORS[cls] }} />
          <span className="legend__label">{t(CLASS_LABEL_KEYS[cls])}</span>
          <span className="mono legend__count">{stats.byClass[cls]}</span>
        </button>
      ))}
      <p className="legend__hint muted">{t('legend.hint')}</p>
      <p className="legend__hint legend__hint--generated muted">
        <span className="legend__dot" style={{ background: '#b389ff' }} aria-hidden="true" />
        {t('legend.generated')}
      </p>
    </div>
  )
}
