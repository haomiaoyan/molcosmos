import { useEffect, useMemo, useRef, useState } from 'react'
import { CLASS_COLORS, rescoreUniverse, statsFor } from '../lib/galaxy'
import { useI18n } from '../lib/i18n'
import type { MoleculeClass } from '../lib/molecule'
import {
  DEFAULT_WEIGHTS,
  WEIGHT_KEYS,
  WEIGHT_PRESETS,
  WEIGHT_TERMS,
  isDefaultWeights,
  normalizeWeights,
  sliderValue,
  weightSum,
  withSlider,
  type WeightKey,
  type WeightPresetId,
  type Weights,
} from '../lib/weights'

const CLASS_ORDER: readonly MoleculeClass[] = ['goldilocks', 'candidate', 'lead', 'far'] as const

const TERM_LABEL: Record<WeightKey, 'lab.term.mw' | 'lab.term.logP' | 'lab.term.hbd' | 'lab.term.hba' | 'lab.term.rings'> =
  {
    mw: 'lab.term.mw',
    logP: 'lab.term.logP',
    hbd: 'lab.term.hbd',
    hba: 'lab.term.hba',
    rings: 'lab.term.rings',
  }

interface Props {
  weights: Weights
  onChange: (weights: Weights) => void
}

/**
 * Weight sandbox: five sliders over the teaching score, with a miniature
 * galaxy and a class histogram that respond live.
 */
export function LabSection({ weights, onChange }: Props) {
  const { t } = useI18n()

  const molecules = useMemo(() => rescoreUniverse(weights), [weights])
  const stats = useMemo(() => statsFor(molecules), [molecules])
  const baseline = useMemo(() => statsFor(rescoreUniverse(DEFAULT_WEIGHTS)), [])

  const sum = Math.round(weightSum(weights) * 100)
  const custom = !isDefaultWeights(weights)

  return (
    <section className="section" id="lab" aria-labelledby="lab-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('lab.eyebrow')}</p>
        <h2 id="lab-title" className="section__title">
          {t('lab.title.pre')}
          <span className="accent-text">{t('lab.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('lab.lead')}</p>
      </header>

      <div className="lab">
        <div className="lab__controls" role="group" aria-label={t('lab.aria')}>
          <div className="lab__presets">
            <span className="lab__presets-label mono">{t('lab.preset')}</span>
            {(Object.keys(WEIGHT_PRESETS) as WeightPresetId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`lab__preset${sameWeights(weights, WEIGHT_PRESETS[id]) ? ' lab__preset--active' : ''}`}
                onClick={() => onChange({ ...WEIGHT_PRESETS[id] })}
              >
                {t(`lab.preset.${id}` as const)}
              </button>
            ))}
          </div>

          <ul className="lab__sliders">
            {WEIGHT_KEYS.map((key) => (
              <li key={key} className="lab__slider">
                <label htmlFor={`w-${key}`}>
                  <span className="lab__slider-name">{t(TERM_LABEL[key])}</span>
                  <span className="lab__slider-ideal mono">
                    {t('lab.ideal', {
                      ideal: WEIGHT_TERMS[key].ideal,
                      width: WEIGHT_TERMS[key].width,
                    })}
                  </span>
                  <output className="lab__slider-value mono" htmlFor={`w-${key}`}>
                    {sliderValue(weights, key)}%
                  </output>
                </label>
                <input
                  id={`w-${key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue(weights, key)}
                  onChange={(event) => onChange(withSlider(weights, key, Number(event.target.value)))}
                />
              </li>
            ))}
          </ul>

          <div className="lab__foot">
            <span className={`lab__sum mono${sum === 100 ? ' lab__sum--ok' : ''}`}>
              {sum === 100 ? t('lab.normalized') : t('lab.sum', { sum })}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onChange({ ...DEFAULT_WEIGHTS })}
              disabled={!custom}
            >
              {t('lab.reset')}
            </button>
          </div>
        </div>

        <div className="lab__view">
          <MiniGalaxy molecules={molecules} />
          <ul className="lab__histogram">
            {CLASS_ORDER.map((cls) => {
              const count = stats.byClass[cls]
              const before = baseline.byClass[cls]
              const pct = stats.total === 0 ? 0 : (count / stats.total) * 100
              const delta = count - before
              return (
                <li key={cls} className="lab__bar">
                  <span className="lab__bar-label" style={{ color: CLASS_COLORS[cls] }}>
                    {t(`class.${cls}` as const)}
                  </span>
                  <span className="lab__bar-track">
                    <span
                      className="lab__bar-fill"
                      style={{ width: `${pct}%`, background: CLASS_COLORS[cls] }}
                    />
                  </span>
                  <span className="lab__bar-count mono">
                    {count}
                    <em className={delta > 0 ? 'lab__delta--up' : delta < 0 ? 'lab__delta--down' : ''}>
                      {delta === 0 ? '±0' : delta > 0 ? `+${delta}` : `${delta}`}
                    </em>
                  </span>
                </li>
              )
            })}
          </ul>
          <dl className="lab__summary">
            <div>
              <dt>{t('lab.best')}</dt>
              <dd className="mono">{stats.best.score.toFixed(3)}</dd>
            </div>
            <div>
              <dt>{t('lab.mean')}</dt>
              <dd className="mono">
                {stats.meanScore.toFixed(3)}
                <em className="lab__mean-delta">
                  {stats.meanScore - baseline.meanScore === 0
                    ? t('lab.deltaNone')
                    : t('lab.delta', { delta: (stats.meanScore - baseline.meanScore).toFixed(3) })}
                </em>
              </dd>
            </div>
          </dl>
          <p className="lab__note muted">{t('lab.note')}</p>
        </div>
      </div>
    </section>
  )
}

/**
 * The whole catalogue on a 2D canvas, seen from above.
 *
 * A separate, cheap projection rather than a third WebGL context: the sandbox
 * only needs to show the class mix changing, and redrawing 600 dots at 60 fps
 * costs nothing.
 */
function MiniGalaxy({ molecules }: { molecules: ReturnType<typeof rescoreUniverse> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = Math.min(canvas.clientWidth || 320, 460)
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const radius = 72
    const center = size / 2
    const scale = (center - 14) / radius

    for (const m of molecules) {
      const x = center + m.x * scale
      const y = center + m.z * scale
      const color = CLASS_COLORS[m.drugClass]
      const r = 1.1 + m.score * 2.4
      ctx.globalAlpha = 0.35 + m.score * 0.65
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }, [molecules])

  return (
    <div
      className={`lab__galaxy${hover ? ' lab__galaxy--hover' : ''}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}

function sameWeights(a: Weights, b: Weights): boolean {
  const na = normalizeWeights(a)
  const nb = normalizeWeights(b)
  return WEIGHT_KEYS.every((key) => Math.abs(na[key] - nb[key]) < 1e-6)
}
