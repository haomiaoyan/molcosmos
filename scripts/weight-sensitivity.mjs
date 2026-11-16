/**
 * MolCosmos 权重敏感性实验 E1-E4。所有数值由项目自身的纯函数实跑产出。
 * 使用 Vite 的 SSR 加载器直接读取 src/lib/*.ts，避免复制任何打分逻辑。
 *
 * 运行：npm run experiment
 * 输出：../coursework-2026fall/data/mc-*.csv
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, '..', 'coursework-2026fall', 'data');
mkdirSync(outDir, { recursive: true });

const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
});

const { generateMoleculeProps, seedForIndex, classify } = await server.ssrLoadModule('/src/lib/molecule.ts');
const { DEFAULT_WEIGHTS, WEIGHT_KEYS, WEIGHT_PRESETS, scoreWithWeights } =
  await server.ssrLoadModule('/src/lib/weights.ts');

const molecules = Array.from({ length: 600 }, (_, i) => generateMoleculeProps(seedForIndex(i)));
const cols = (rows, columns) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => r[c] ?? '').join(','))].join('\n') + '\n';
function save(name, rows, columns) {
  writeFileSync(resolve(outDir, name), cols(rows, columns), 'utf8');
  console.log(`saved ${name}: ${rows.length} rows`);
}

const scoreArray = (weights) => molecules.map((m) => scoreWithWeights(m, weights));
const rankedIndices = (scores) =>
  scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a] || a - b);
const rankOf = (order) => {
  const r = new Array(order.length);
  order.forEach((molIndex, position) => { r[molIndex] = position; });
  return r;
};
const topSet = (order, n) => new Set(order.slice(0, n));

function kendallTau(a, b) {
  let con = 0;
  let dis = 0;
  for (let i = 0; i < a.length; i += 1) {
    for (let j = i + 1; j < a.length; j += 1) {
      const d = (a[i] - a[j]) * (b[i] - b[j]);
      if (d > 0) con += 1;
      else if (d < 0) dis += 1;
    }
  }
  return (con - dis) / (con + dis);
}
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}
function kl(p, q) {
  const eps = 1e-6;
  return p.reduce((s, pi, i) => s + pi * Math.log((pi + eps) / (q[i] + eps)), 0);
}
function quantile(sorted, q) {
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}
function randomWeights(random) {
  const raw = WEIGHT_KEYS.map(() => -Math.log(Math.max(random(), 1e-12)));
  const total = raw.reduce((a, b) => a + b, 0);
  const w = {};
  WEIGHT_KEYS.forEach((k, i) => { w[k] = raw[i] / total; });
  return w;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log('E1 合成化学空间的性质分布');
const e1 = [];
for (const key of WEIGHT_KEYS) {
  const xs = molecules.map((m) => m[key]).sort((a, b) => a - b);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
  e1.push({
    property: key,
    mean: mean.toFixed(3),
    sd: sd.toFixed(3),
    p05: quantile(xs, 0.05).toFixed(3),
    p50: quantile(xs, 0.5).toFixed(3),
    p95: quantile(xs, 0.95).toFixed(3),
    min: xs[0].toFixed(3),
    max: xs[xs.length - 1].toFixed(3),
  });
}
save('mc-e1-distribution.csv', e1, ['property', 'mean', 'sd', 'p05', 'p50', 'p95', 'min', 'max']);

console.log('E2 1000 组随机权重的排序稳定性');
const classNames = ['lead', 'candidate', 'goldilocks', 'far'];
const classIndex = (score) => classNames.indexOf(classify(score));
const baseScores = scoreArray(DEFAULT_WEIGHTS);
const baseOrder = rankedIndices(baseScores);
const baseRank = rankOf(baseOrder);
const baseTop = topSet(baseOrder, 60);
const baseClass = [0, 0, 0, 0];
baseScores.forEach((s) => { baseClass[classIndex(s)] += 1; });
const random = mulberry32(20261116);
const e2 = [];
for (let k = 0; k < 1000; k += 1) {
  const w = randomWeights(random);
  const scores = scoreArray(w);
  const order = rankedIndices(scores);
  const tau = kendallTau(baseRank, rankOf(order));
  const jac = jaccard(baseTop, topSet(order, 60));
  const counts = [0, 0, 0, 0];
  scores.forEach((s) => { counts[classIndex(s)] += 1; });
  e2.push({
    sample: k + 1,
    tau: tau.toFixed(4),
    top10_jaccard: jac.toFixed(4),
    kl_class: kl(baseClass.map((x) => x / 600), counts.map((x) => x / 600)).toFixed(6),
    w_mw: w.mw.toFixed(3),
    w_logP: w.logP.toFixed(3),
    w_hbd: w.hbd.toFixed(3),
    w_hba: w.hba.toFixed(3),
    w_rings: w.rings.toFixed(3),
  });
}
save('mc-e2-rank-stability.csv', e2,
  ['sample', 'tau', 'top10_jaccard', 'kl_class', 'w_mw', 'w_logP', 'w_hbd', 'w_hba', 'w_rings']);

console.log('E3 预设权重下的短名单重叠');
const e3 = [];
for (const [name, weights] of Object.entries(WEIGHT_PRESETS)) {
  const order = rankedIndices(scoreArray(weights));
  const top = topSet(order, 60);
  let inter = 0;
  for (const i of top) if (baseTop.has(i)) inter += 1;
  e3.push({
    preset: name,
    overlap_with_default: inter,
    top10_overlap_rate: (inter / 60).toFixed(4),
    tau_with_default: name === 'default' ? '1' : kendallTau(baseRank, rankOf(order)).toFixed(4),
  });
}
save('mc-e3-preset-overlap.csv', e3,
  ['preset', 'overlap_with_default', 'top10_overlap_rate', 'tau_with_default']);

console.log('E4 类别分布随权重的偏移');
const e4 = [];
for (let k = 0; k < e2.length; k += 1) {
  if (k % 50 !== 0) continue;
  const w = {
    mw: Number(e2[k].w_mw), logP: Number(e2[k].w_logP), hbd: Number(e2[k].w_hbd),
    hba: Number(e2[k].w_hba), rings: Number(e2[k].w_rings),
  };
  const counts = [0, 0, 0, 0];
  scoreArray(w).forEach((s) => { counts[classIndex(s)] += 1; });
  e4.push({
    sample: e2[k].sample,
    lead: counts[0], candidate: counts[1], goldilocks: counts[2], far: counts[3],
    kl: e2[k].kl_class,
  });
}
save('mc-e4-class-shift.csv', e4, ['sample', 'lead', 'candidate', 'goldilocks', 'far', 'kl']);

const meanTau = e2.reduce((s, r) => s + Number(r.tau), 0) / e2.length;
const meanJac = e2.reduce((s, r) => s + Number(r.top10_jaccard), 0) / e2.length;
console.log(`\n关键结论（均由上表数据算出）:`);
console.log(`1000 组随机权重: Kendall τ 均值 ${meanTau.toFixed(4)}, Top-10% Jaccard 均值 ${meanJac.toFixed(4)}`);
console.log(`输出目录: ${outDir}`);
await server.close();
