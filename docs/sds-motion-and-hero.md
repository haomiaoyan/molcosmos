# SDS：MolCosmos 首屏重做与动效层

> **读者**：没见过这个代码库的实施者。
> **前置**：`docs/plan-hero-rebuild.md`（v3，已通过独立审核并核实）。
> **铁律**：SDS 与代码冲突时，**以代码为准**，记录偏离并在提交信息里说明。
> **版本**：SDS v1.0 · 2026-11-04

---

## 1. 目标与范围

### 1.1 一句话目标

把 MolCosmos 的首屏从「一屏塞不下、四张卡被切」改成「一屏讲清、背景铺满」，并给全站加一层 GSAP 动效系统；后半段六个重复卡片的章节换成不同构图；配色从 5 套收到 1 深 1 浅。

### 1.2 明确不做的事

| 不做 | 原因 |
|---|---|
| 不引入 ThreeUI | iframe + CDN，配色切不动（见 §2.3） |
| 不引入 React Bits | 非 npm 包；能力已含在 gsap（见 §2.4） |
| 不用 ScrollSmoother | 会包 body wrapper，`position:fixed` 的 nav/进度条全失效 |
| 不改 `CosmosScene.tsx` 的星系算法 | 只改它读的颜色来源 |
| 不改 `galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts` 的任何计算 | 这些是数据正确性核心，有 107 条测试保护 |
| 不改 `CLASS_COLORS` 的色值 | 那是**数据编码**，不是主题色 |
| 不迁移框架 / 不换样式方案 | 纯 CSS，保持 |

### 1.3 硬约束

| 约束 | 违反后果 |
|---|---|
| 唯一新增依赖：`gsap@3.15.1`（`package.json` 写死，不带 `^`） | 引入额外包需重新过审 |
| 不改 `Sections2.tsx` L129-L140 的高亮判定 | 会把 `abfa669` 的修复弄丢 |
| 每批结束 `npx tsc --noEmit` + `npm run build` 必须通过 | CI 会拒 |
| 每批结束打 git tag | 无法回滚 |
| reduced-motion 下信息一条不少 | 无障碍硬要求 |

---

## 2. 现状分析

### 2.1 项目基线（实测）

| 项 | 值 |
|---|---|
| 框架 | React 18.3.1 + Vite 6.4.5 + TypeScript 5.6.3 |
| 3D | three 0.169 + @react-three/fiber 8.18 + drei 9.122 |
| 测试 | **107 tests / 10 files**，`npx vitest run` 全绿 |
| 构建 | `npm run build` = `tsc --noEmit && vite build` |
| 产物 | JS 1.1 MB + CSS 38 KB |
| 样式 | 单文件 `src/styles.css`，2688 行，纯 CSS 变量 |
| 主题 | 5 套（cosmos/midnight/nebula/abyss/ember） |
| 部署 | GitHub Pages，`.github/workflows/deploy.yml`，`npm run test` 是门禁 |

### 2.2 关键约束的代码依据

**首屏现状（实测，1440×900）**

```
.hero  height 1041  (1.16 vh)
  CTA 底边 598     ← 在折叠线内
  四卡片底边 961   ← 被切
```

390×844：`.hero` 1497（1.77 vh），CTA 底边 714（可见），四卡片底边 1417（被切）。

> **注意**：CTA 本来就可见。删四卡片的理由是「hero 超出一屏 + 四卡片被切」，**不是**「CTA 看不见」。

**"矩形背景"的两个裁剪源**

```
styles.css#L61-L65   .app { max-width:1180px; margin:0 auto; padding:0 24px }
styles.css#L287-L294 .hero { overflow:hidden }
```

实测：`width:100vw; margin-left:calc(50% - 50vw)` 的子元素在 `overflow:hidden` 父级内，`elementFromPoint(2,y)` 返回 `BODY`（被裁）；父级 `overflow:visible` 时返回元素自身。两者布局宽度都是 1440。

**`.hero{overflow:hidden}` 的双重职责**

它同时保护 `hero__molecule-slot` 的负 `left`（`styles.css#L346-L353` 注释：「`overflow:hidden` ate the molecule's leftmost atoms」）。放开 overflow 必须同时改这个定位。

### 2.3 ThreeUI 被排除的证据

```
npm pack @designcodeio/threeui        → 41 MB tgz
du -sh lib-dist                       → 54 MB
grep -c "iframe|srcDoc" NeuformBatchEffects.js  → 命中
grep -l "cdn.tailwindcss.com" sources/*.js | wc -l  → 45 / 53
```

### 2.4 React Bits 被排除的证据

非 npm 包（shadcn 式源码分发）。所需能力已在 `gsap@3.15.1/dist/`：`SplitText.js`、`ScrollTrigger.js`、`ScrollToPlugin.js`、`Flip.js`、`DrawSVGPlugin.js`。

导入路径（`package.json` exports `"./*": { import:"./*.js", types:"./types/*.d.ts" }`）：

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'
```

### 2.5 砍主题的真实影响（实测，在临时副本实做）

```
npx tsc --noEmit  → 14 个错误
  src/lib/theme.ts(67,101,135,169)         8 处  旧主题 id + labelKey
  src/components/TopnavTools.tsx(56,78)    2 处  TS2345（labelKey 传给 t()）
  src/lib/urlState.test.ts(58,62,78)       3 处  abyss / ember / midnight
                                           ——
                                           13 处 + 1 处 labelKey 类型

npx vitest run    → 107/107 全绿，0 失败
npm run build     → 失败（因为 build 含 tsc --noEmit）
```

> **重要**：`vitest` **不会**因为类型收窄而红（esbuild 剥类型）。验收必须用 `npm run build`。

---

## 3. 架构设计

### 3.1 文件清单

**新增**

| 路径 | 职责 |
|---|---|
| `src/lib/gsap.ts` | 单点注册插件，导出配置好的 gsap |
| `src/lib/useReveal.ts` | 章节入场 hook（context + matchMedia + reduced-motion） |
| `src/lib/useStageTravel.ts` | 长舞台位移/行程计算（纯函数 + hook） |
| `src/components/HeroStage.tsx` | 首屏全宽舞台层 |
| `src/components/StationStage.tsx` | 五关卡横向长舞台（替换 Sections.tsx 的 `.pipeline`） |
| `src/components/SpectrumStrip.tsx` | 宇宙普查光谱带（替换 `.stats-strip` 的 4 卡） |
| `src/components/TimelineAxis.tsx` | 里程碑单轴（替换 TimelineSection 的卡片串） |
| `scripts/verify.mjs` | 入库的验收脚本 |
| `src/lib/themes/paper.ts` | 浅色主题定义（从 theme.ts 拆出，见 §4.1） |

**修改**

| 路径 | 改动 |
|---|---|
| `src/components/Hero.tsx` | 删 FEATURES、eyebrow；标题结构支持 SplitText |
| `src/components/Sections.tsx` | `PipelineSection` 改用 `StationStage`；`CosmosStats` 改用 `SpectrumStrip` |
| `src/components/Sections2.tsx` | 只换 `setProgress`（L122-L123）；`MethodSection` 去卡片 |
| `src/components/TimelineSection.tsx` | 改用 `TimelineAxis` |
| `src/lib/theme.ts` | 主题 5→2；`colorScheme` 动态；拆出 paper |
| `src/lib/urlState.ts` | 旧 id → cosmos 映射 |
| `src/lib/i18n.tsx` | 删 8 条 hero.f*、删 3 条 theme.*、补 `theme.paper` |
| `src/App.tsx` | 两处 smooth scroll 改 ScrollToPlugin |
| `src/styles.css` | hero 重写、pin 相关、literal 变量化 |
| `package.json` | 加 gsap |
| `README.md` | 3 处配色说明 + 测试数 |
| `index.html` | theme-color 由 JS 接管 |

**不碰**

`src/lib/galaxy.ts`、`molecule.ts`、`search.ts`、`weights.ts`、`shortlist.ts`、`pick.ts`、`rng.ts`、`heroMolecules.ts`、`motion.ts`（只被 import）、所有 `*.test.ts`（除 urlState.test.ts）。

### 3.2 模块依赖图

```
App.tsx
 ├─ lib/gsap.ts ──────────── (注册 ScrollTrigger / ScrollToPlugin / SplitText)
 ├─ lib/theme.ts ─────────── themes/paper.ts
 ├─ lib/useReveal.ts ─────── lib/gsap.ts, lib/motion.ts
 ├─ components/HeroStage.tsx
 ├─ components/Hero.tsx ──── HeroMolecule.tsx (保持)
 ├─ components/Sections.tsx
 │   ├─ StationStage.tsx ─── lib/useStageTravel.ts, lib/gsap.ts
 │   └─ SpectrumStrip.tsx ── lib/galaxy.ts (statsFor)
 ├─ components/Sections2.tsx
 ├─ components/TimelineSection.tsx ── TimelineAxis.tsx
 └─ components/CosmosScene.tsx ───── lib/galaxy.ts (CLASS_COLORS 不变)
```

**依赖方向规则**：`lib/*` 不 import `components/*`；`useStageTravel` 是纯函数 + hook，可在 node 里单测。

---

## 4. 详细设计

### 4.1 `src/lib/theme.ts`（改）

**职责**：把配色写进 `<html>` 的 CSS 变量；提供主题元数据。

**类型变更**

```ts
// 前
export type ThemeId = 'cosmos' | 'midnight' | 'nebula' | 'abyss' | 'ember'

// 后
export type ThemeId = 'cosmos' | 'paper'

export interface Theme {
  id: ThemeId
  labelKey: 'theme.cosmos' | 'theme.paper'   // L19，必须同步收窄
  swatch: readonly [string, string, string]
  sceneBg: string
  /** 新增：浅色主题下浏览器原生控件与滚动条要走 light */
  colorScheme: 'dark' | 'light'
  vars: Record<string, string>
}
```

**行为规格**

| 项 | 值 |
|---|---|
| `THEMES` 长度 | 2 |
| `cosmos.sceneBg` | `#05060f`（不变） |
| `paper.sceneBg` | `#ece7dc` |
| `applyTheme(id)` | 写 vars；`root.dataset.theme = id`；`root.style.colorScheme = theme.colorScheme`；更新 `<meta name="theme-color">` 为 `theme.sceneBg` |
| `loadTheme()` | 读 localStorage；命中已删 id 时返回 `'cosmos'` |
| `themeById(id)` | 未找到回退 `THEMES[0]` |

**`colorScheme` 必须来自主题数据，不能写死**：现状 `theme.ts#L237` 是 `root.style.colorScheme = 'dark'`。

**paper 主题的 vars（完整清单）**

```ts
const paperVars = {
  '--accent-rgb': '194 65 12',        // 朱砂 #c2410c
  '--accent-2-rgb': '176 92 40',
  '--accent-3-rgb': '140 96 58',
  '--accent-4-rgb': '150 120 80',
  '--line-rgb': '150 138 118',
  '--text': '#1d1a16',
  '--text-dim': '#4a4438',
  '--text-mute': '#6b6355',
  '--bg': '#ece7dc',
  '--bg-2': '#f4f1ea',
  '--panel': 'rgba(255, 252, 245, 0.78)',
  '--panel-solid': '#f7f4ec',
  '--line': 'rgba(150, 138, 118, 0.28)',
  '--line-strong': 'rgba(150, 138, 118, 0.52)',
  '--scrim': 'rgba(236, 231, 220, 0.82)',
  '--scrim-soft': 'rgba(236, 231, 220, 0.62)',
  '--scrim-solid': 'rgba(247, 244, 236, 0.94)',
  '--scrim-panel': 'rgba(252, 250, 244, 0.97)',
  '--accent': '#c2410c',
  '--on-accent': '#fff8f3',
  '--accent-2': '#b05c28',
  '--accent-3': '#8c603a',
  '--accent-4': '#967850',
  '--shadow': '0 18px 60px rgba(74, 68, 56, 0.16)',
  '--glow': '0 0 42px rgba(194, 65, 12, 0.16)',
  // ---- 新增：把现有 literal 变成变量（见 §4.13）----
  '--scrim-deep': 'rgba(244, 241, 234, 0.86)',
  '--scrim-deep-2': 'rgba(250, 247, 240, 0.9)',
  '--sheen-text': '#8c603a',
  '--star-rgb': '29 26 22',
  // ---- 新增：舞台层（v1.1）----
  '--stage-bg': '#ece7dc',
  '--stage-glow-1': 'rgba(194, 65, 12, 0.10)',
  '--stage-glow-2': 'rgba(140, 96, 58, 0.08)',
  '--stage-dot': 'rgba(150, 138, 118, 0.34)',
  '--stage-card': 'rgba(255, 252, 245, 0.78)',
  '--stage-card-active': 'rgba(255, 254, 250, 0.94)',
}
```

**新增变量对照表（两套主题都必须给值）**

| 变量 | 用途 | cosmos | paper |
|---|---|---|---|
| `--star-rgb` | 首屏星点、`.station__step` 大字 | `230 236 255` | `29 26 22` |
| `--scrim-deep` | `styles.css#L666,L932` 深色遮罩 | `rgba(12,16,36,.86)` | `rgba(244,241,234,.86)` |
| `--scrim-deep-2` | `#L671` | `rgba(20,26,54,.9)` | `rgba(250,247,240,.9)` |
| `--sheen-text` | `#L718` 的 `#e9ddff` | `#e9ddff` | `#8c603a` |
| `--stage-bg` | 长舞台底色 | `#05060f` | `#ece7dc` |
| `--stage-glow-1` | 舞台左光晕 | `rgba(179,137,255,.10)` | `rgba(194,65,12,.10)` |
| `--stage-glow-2` | 舞台右光晕 | `rgba(55,226,200,.08)` | `rgba(140,96,58,.08)` |
| `--stage-dot` | 两侧点阵纹理 | `rgba(122,143,205,.22)` | `rgba(150,138,118,.34)` |
| `--stage-card` | 卡片底色 | `rgba(14,18,38,.72)` | `rgba(255,252,245,.78)` |
| `--stage-card-active` | 卡片激活态 | `rgba(20,26,52,.84)` | `rgba(255,254,250,.94)` |

> **v1.1 补充理由**：浅色主题下舞台若沿用深空配色，会在米白页面上出现一块深色矩形。
> 上表让 `.stage-pin` 的背景、光晕、点阵、卡片底色全部由主题驱动。

**对比度要求**（实施时用 `scripts/verify.mjs` 验）：`--text` 在 `--bg` 上 ≥ 4.5:1，`--text-dim` ≥ 4.5:1，`--text-mute` ≥ 3:1（次要信息）。

> 现状 `cosmos` 的 `--text-mute #5f6c92` 在 `#05060f` 上只有 **3.89:1**，Phase 4 顺手修到 ≥ 4.5。

---

### 4.2 `src/lib/urlState.ts`（改）

**职责**：URL 里的 `star` / `theme` / `lang` 三键读写。

**新增行为：旧 id 重定向（D2）**

```ts
/** 历史上发布过的主题 id，现在都映射到 cosmos。 */
const LEGACY_THEME_IDS: ReadonlySet<string> = new Set(['midnight', 'nebula', 'abyss', 'ember'])

export function readUrlState(search: string): UrlState {
  // ... 现有逻辑
  // theme 分支改为：
  //   - 命中 THEME_IDS（cosmos/paper）→ 原样返回
  //   - 命中 LEGACY_THEME_IDS → 返回 'cosmos'
  //   - 都不是 → null
}
```

**行为规格**

| 输入 | 输出 `.theme` |
|---|---|
| `?theme=cosmos` | `'cosmos'` |
| `?theme=paper` | `'paper'` |
| `?theme=nebula` | `'cosmos'`（不回退到 null） |
| `?theme=midnight` | `'cosmos'` |
| `?theme=chartreuse` | `null` |

**为什么重定向而不是丢弃**：老链接打开后应看到同一套「深空」，而不是掉回默认再重绘一次。`null` 会让 `App.tsx` 去读 localStorage，可能得到另一个主题。

---

### 4.3 `src/lib/gsap.ts`（新）

```ts
/**
 * 单点注册。整个应用只有这里调用 registerPlugin：
 * 每个模块各自 register 会让插件被重复注册，ScrollTrigger 的
 * refresh 顺序也会变得不可预测。
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'

let registered = false
export function registerGsap(): void {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText)
  registered = true
}
export { gsap, ScrollTrigger, ScrollToPlugin, SplitText }
```

**实现要点**：`registerGsap()` 在 `App.tsx` 的 `useEffect` 里调一次。所有消费者 `import { gsap, ScrollTrigger } from '../lib/gsap'`，**不得**直接从 `'gsap'` import。

---

### 4.4 `src/lib/useReveal.ts`（新）

**职责**：章节入场。标题 → 正文 → 图，错开 60–80ms，上升 16–32px，只触发一次。

```ts
export interface RevealOptions {
  /** 依次错开的子元素选择器，按数组顺序。 */
  steps: string[]
  /** 每个 step 之间的延迟，ms。默认 70。 */
  stagger?: number
  /** 上升距离，px。默认 24。 */
  rise?: number
  /** 触发线，默认 'top 82%'。 */
  start?: string
}

/**
 * 返回一个 ref，挂到章节根元素上。
 * reduced-motion 下立即把元素设为可见并返回空 ref 行为，不注册任何 trigger。
 */
export function useReveal<T extends HTMLElement>(options: RevealOptions): React.RefObject<T>
```

**行为规格**

| 条件 | 行为 |
|---|---|
| 正常 | `gsap.from(steps, { y: rise, opacity: 0, stagger: stagger/1000, once: true })` |
| reduced-motion | 不创建 tween；元素保持自然可见 |
| 组件卸载 | `ctx.revert()` |

**实现要点**：用 `gsap.context()` 收集，`useLayoutEffect` 里建、cleanup 里 revert。**绝不能用 `opacity:0` 写进 CSS**——脚本失败时内容会永远不显示。

---

### 4.5 `src/lib/useStageTravel.ts`（新）

**职责**：长舞台的位移与行程计算。**这是 v7 方案的核心公式，必须可单测。**

```ts
export interface StageGeometry {
  /** 轨道总宽（含左右 padding）。 */
  trackWidth: number
  /** 裁剪窗口宽度（1180 或视口宽，取小）。 */
  windowWidth: number
  /** 卡片数。 */
  cardCount: number
  /** 卡片间距，px。 */
  gap: number
  /** 轨道左右 padding，px。 */
  pad: number
}

/** 需要横向移动的总距离。 */
export function stageTravel(g: StageGeometry): number

/** 滚动行程（钉住多长）。 */
export function stageSpan(g: StageGeometry, viewportHeight: number): number

/** 给定滚动进度 [0,1]，返回轨道 x 位移（负数）与当前卡片索引。 */
export function stageFrame(g: StageGeometry, progress: number): {
  x: number
  activeIndex: number
  fillPercent: number
}
```

**公式（v1.1 修正）**

```
travel = max(0, trackWidth - windowWidth)
span   = max(travel * SPAN_RATIO, viewportHeight * 1.5)

const SPAN_RATIO = 3.5

x            = -travel * progress
activeIndex  = clamp(floor(progress * cardCount), 0, cardCount - 1)
fillPercent  = progress * 100
```

> **v1.1 修正（实测）**：原文是 `trackWidth + pad - windowWidth`，**多加了一次 `pad`**。
> `trackWidth` 取自 `track.scrollWidth`，而 **`scrollWidth` 已经包含 `padding: 0 24px`**：
>
> ```
> 卡片 5×380 + gap 4×56 = 2124   （内容宽）
>              + padding 48 = 2172   （scrollWidth）
> 2172 + 48 - 1180 = 1040   ← 原文（错，重复加 pad）
> 2172      - 1180 =  992   ← v7 实际代码 track.scrollWidth - win.clientWidth
> ```

**为什么 `travel` 用 `windowWidth` 而不是 `innerWidth`**：实测 1440/1920/2560 下 `travel` 必须恒定。用 `innerWidth` 会让宽屏的 travel 变小甚至为 0（v1 的 bug）。

**`windowWidth` 取值取决于 `.stage-pin` 挂在哪**（实测，三种挂法）：

| 挂法 | windowWidth | travel |
|---|---|---|
| 挂 `.app` **外**，宽 1180 | 1180 | **992**（v7 演示值） |
| **挂 `.app` 内**（本 SDS 采用） | **1132** | **1040** |
| 全宽相对 body | 1425 | 747 |

`.app` 有 `padding: 0 24px`，`width:100%` 只填满 content box = 1180 − 48 = **1132**。
**本项目采用「挂 `.app` 内」，因此 travel = 1040。**

**单测**（新增 `src/lib/useStageTravel.test.ts`）：

| 用例 | 输入 | 期望 |
|---|---|---|
| 桌面 1440（挂 .app 内） | track 2172, win **1132**, cards 5, gap 56 | travel **1040** |
| 桌面 1920 | 同上 | travel **1040** |
| 桌面 2560 | 同上 | travel **1040** |
| 窄屏 700 | win 700 | travel 1472 |
| 轨道比窗口窄 | track 1000, win 1132 | travel 0 |
| progress 0.5 | — | x −520、activeIndex 2、fill 50 |
| progress 1 | — | x −1040、activeIndex 4、fill 100 |
| progress 1.0000001（越界） | — | 同 progress 1（clamp 生效） |

---

### 4.6 `src/components/HeroStage.tsx`（新）

**职责**：首屏全宽背景层。**只做视觉，不承载内容。**

```tsx
interface Props {
  /** 是否启用点阵纹理（浅色主题建议开）。 */
  dotted?: boolean
}

export function HeroStage({ dotted = true }: Props): JSX.Element
```

**DOM 结构**

```html
<div class="hero__stage" aria-hidden="true">
  <div class="hero__stage-glow"></div>
  <div class="hero__stage-dots"></div>
  <div class="hero__stage-stars"></div>
</div>
```

**行为规格**

| 项 | 值 |
|---|---|
| 定位 | `position:absolute; top:0; bottom:0; left:50%; transform:translateX(-50%)` |
| 宽度 | **`calc(100vw - var(--sbw))`**（见下，**不能直接用 `100vw`**） |
| 层级 | `z-index:0`；`.hero__inner` 为 `z-index:1` |
| 指针 | `pointer-events:none`（纯装饰，不拦事件） |
| 动效 | 光晕 `hero-drift` 14s 漂移；星点 `hero-twinkle` 5s；reduced-motion 下 `animation:none` |
| 无障碍 | `aria-hidden="true"`，无焦点 |

**`100vw` 的陷阱与解法（实测，四种写法只有一种成立）**

`100vw` 包含滚动条宽度（实测 15px），而内容区不含。因此任何 `width:100vw` 的居中层都会左偏 7px、右侧溢出 8px：

| 写法 | left | width | overflowX | 判定 |
|---|---|---|---|---|
| `100vw` + `margin-left:calc(50% - 50vw)` | −7 | 1440 | **8px** | ❌ |
| `100vw` + `left:50%` + `translateX(-50%)` | −7 | 1440 | **8px** | ❌ |
| `100vw` + 负 margin | −7 | 1440 | **8px** | ❌ |
| **`calc(100vw - var(--sbw))` + `translateX(-50%)`** | **0** | **1425** | **0px** | ✅ |

**CSS**

```css
:root { --sbw: 0px; }

.hero__stage {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: calc(100vw - var(--sbw));
  transform: translateX(-50%);
  pointer-events: none;
}
```

**JS：把真实滚动条宽度写进变量**（挂载时 + resize，实测三档都得到 15px）

```ts
/** 全宽层依赖这个变量；滚动条宽度在窗口缩放、经典/覆盖式滚动条切换时会变。 */
export function syncScrollbarWidth(): void {
  const root = document.documentElement
  root.style.setProperty('--sbw', `${window.innerWidth - root.clientWidth}px`)
}
```

调用位置：`App.tsx` 的 `useEffect` 里挂载时调一次，并 `window.addEventListener('resize', syncScrollbarWidth)`。

**实测结果**（1440/1920/2560 三档）：`--sbw: 15px`、`stage.left: 0`、`stage.width: clientWidth`、`overflowX: 0`。

> **注意**：`.stage-pin`（§4.8）的全宽背景层用**同一套方案**。

**`.hero` 布局契约（Phase 1 核心）**

```css
.hero {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: visible;        /* 关键改动：原为 hidden */
  padding: 120px 0 80px;
}

.hero__inner {
  position: relative;
  z-index: 1;
  max-width: 860px;
  text-align: center;
}
```

**分子槽改栅格定位**（放开 overflow 的代价）：

```css
/* 前：top:58px; left:calc(50% - 560px); 负 left 靠 overflow:hidden 兜 */
/* 后：回到栅格内，用 margin 推开，不再溢出 */
.hero__molecule-slot {
  position: absolute;
  top: 58px;
  left: max(0px, calc(50% - 560px));
  width: 240px;
  height: 240px;
}
```

> 桌面 ≥1101px 时按 `styles.css#L360-L366` 的现规则缩放到 208px；≤1100px 时回到 `position:relative` 居中（现有规则保留）。

**验收断言**

> **v1.1 修正**：原文用 `elementFromPoint` 判断「左边缘可命中」。
> **这条断言必然失败**——装饰层有 `pointer-events:none`，命中测试永远返回 `BODY`。
> 改为**几何断言**：

```js
// scripts/verify.mjs
const stage = document.querySelector('.hero__stage')
const r = stage.getBoundingClientRect()
const clientW = document.documentElement.clientWidth

// 1. 左边缘贴视口左侧（允许 1px 亚像素误差）
assert(Math.abs(r.left) <= 1, `全宽层左边缘应为 0，实测 ${r.left}`)

// 2. 宽度覆盖整个可视区
assert(r.width >= clientW - 1, `宽度应 ≥ ${clientW}，实测 ${r.width}`)

// 3. 不产生横向溢出
assert(
  document.documentElement.scrollWidth <= clientW + 1,
  `不应横向溢出：scrollW=${document.documentElement.scrollWidth}, clientW=${clientW}`
)
```

---

### 4.7 `src/components/Hero.tsx`（改）

**结构变更**

| 前 | 后 |
|---|---|
| `.hero__glow` + `.hero__stars` 两个空 div | `<HeroStage />` |
| `.hero__eyebrow`（"MolCosmos · 医学 AI 导论项目 · 纯前端"） | **删除** |
| `.hero__title`（三层 `<br>` + `<span class="hero__accent">`） | 保持结构，加 `data-split` 标记 |
| `.hero__lead` | 保持 |
| `.hero__actions` | 保持 |
| `ul.feature-grid` 四张卡 | **删除** |

**标题拆分契约**

标题必须保留三个 `.hero__accent`：
- `10⁶⁰`（上标数字）
- `一片获批的药`

SplitText 只作用于**未被 accent 包裹的文本节点**，否则高亮会被拆碎。

```tsx
<h1 className="hero__title" ref={titleRef}>
  <span className="hero-line">{t('hero.title.l1')}</span>
  <span className="hero-line">
    {t('hero.title.l2pre')}
    <span className="hero__accent" data-no-split>10<sup>60</sup></span>
    {t('hero.title.l2post')}
  </span>
  <span className="hero-line">
    {t('hero.title.l3pre')}
    <span className="hero__accent" data-no-split>{t('hero.title.l3accent')}</span>
    {t('hero.title.l3post')}
  </span>
</h1>
```

**SplitText 配置**

```ts
// 中文按字拆，英文按词拆——按当前 lang 切换
const split = new SplitText(line, {
  type: isCJK(lang) ? 'chars' : 'words',
  charsClass: 'ch',
  wordsClass: 'wd',
})
gsap.from(split.targets, {
  y: 40, opacity: 0, duration: 0.7, ease: 'power3.out',
  stagger: isCJK(lang) ? 0.02 : 0.06,
})
```

`isCJK(lang)` 判据：`lang === 'zh'`（本项目只有 zh/en 两种）。

**reduced-motion**：不建 SplitText，标题原样渲染。

---

### 4.8 `src/components/StationStage.tsx`（新）

**职责**：五关卡横向长舞台。替换 `Sections.tsx` 里的 `.pipeline`。

```tsx
interface Props {
  stations: readonly {
    step: string
    key: 's1' | 's2' | 's3' | 's4' | 's5'
    accent: string
  }[]
}

export function StationStage({ stations }: Props): JSX.Element
```

**DOM 结构**

```html
<div class="stage-pin" ref={pinRef}>
  <div class="stage-window" ref={windowRef}>
    <ol class="station-track" ref={trackRef}>
      <li class="station-card" data-active="true|false">…</li>  × 5
    </ol>
  </div>
  <div class="stage-counter" aria-live="polite">01 / 05</div>
  <div class="stage-progress" role="presentation">
    <div class="stage-progress__fill"></div>
  </div>
</div>
```

**行为规格**

| 项 | 桌面（≥768px） | 手机（<768px） |
|---|---|---|
| `.stage-pin` | `height:100vh; position:relative; overflow:hidden`；**全宽背景用 §4.6 的 `calc(100vw - var(--sbw))` 方案** | `height:auto; position:static; width:auto; margin-left:0` |
| `.stage-window` | `width:min(1180px,100%); overflow:hidden; margin:0 auto` | `width:100%; overflow:visible` |
| `.station-track` | `display:flex; gap:56px; padding:0 24px` | `flex-direction:column; gap:18px` |
| `.station-card` | `flex:0 0 380px` | `width:100%; flex:0 0 auto` |
| ScrollTrigger | `pin:true; scrub:0.6` | **不创建** |
| 计数/进度条 | 显示 | `display:none` |

**挂载位置（v1.1 明确）**

`<StationStage />` 挂在 **`Sections.tsx` 的 `<section>` 内、`.section__head` 之后**，而 `.section` 在 `.app`（`max-width:1180px; padding:0 24px`）内部。

因此：
- `.stage-window` 的 `width:min(1180px,100%)` 实际得到 **1132px**（1180 − 48 padding）
- `windowWidth` = **1132**，`travel` = **1040**（不是 v7 演示的 992）
- 全宽背景只能靠 §4.6 的 `calc(100vw - var(--sbw))` + `translateX(-50%)` 撑出 `.app`

> **为什么不用 v7 的 `margin-left:calc(50% - 50vw)`**：实测该写法会产生 8px 横向溢出（`100vw` 含滚动条宽），见 §4.6 的四方案对比表。

**pin 与 fixed nav 的解冲突（实测依据见 §4.9）**

```ts
ScrollTrigger.create({
  trigger: pin,
  start: 'top 64px',      // 关键：让出 .topnav 高度（56 + top3 + 余量）
  end: () => '+=' + span,
  pin: true,
  scrub: 0.6,
  invalidateOnRefresh: true,
  onUpdate: (self) => { /* 用 stageFrame 更新 x / 计数 / 进度 */ },
})
```

**为什么 `start: 'top 64px'` 而不是 `'top top'`**：实测 `navCoversPin: true`——`.topnav`（`top:3px`，高 56，`z-index:50`）会压在 `top:0` 开始的 pin 区顶部 59px 上。

**reduced-motion**：`gsap.matchMedia()` 的 media query 加 `and (prefers-reduced-motion: no-preference)`，不满足时不创建 ScrollTrigger，卡片改为竖排静态列表 + 一次淡入。

---

### 4.9 `src/components/SpectrumStrip.tsx`（新）

**职责**：宇宙普查。把「4 张等宽卡」换成「按真实比例分段的光谱带」。

```tsx
interface Props {
  /** 必须来自 rescoreUniverse(weights)，随沙盒权重联动。 */
  molecules: readonly Molecule[]
}

export function SpectrumStrip({ molecules }: Props): JSX.Element
```

**DOM 结构**

```html
<div class="spectrum">
  <div class="spectrum__bar" role="img" aria-label="600 颗星按类药潜力分布">
    <span class="spectrum__seg spectrum__seg--goldilocks" style="--w:8.83%"></span>
    <span class="spectrum__seg spectrum__seg--candidate"  style="--w:61.83%"></span>
    <span class="spectrum__seg spectrum__seg--lead"       style="--w:29.00%"></span>
    <span class="spectrum__seg spectrum__seg--far"        style="--w:0.33%"></span>
  </div>
  <ul class="spectrum__legend">
    <li><b style="color:#ffd166">宜居带分子</b> <span class="mono">53</span></li>
    …
  </ul>
</div>
```

**行为规格**

| 项 | 值 |
|---|---|
| 段宽 | 见下方 `segmentWidths()`，`useMemo` 依赖 `molecules` |
| 最小可见宽 | `MIN_SEGMENT = 0.33`（%），低于此值的段按比例回缩补回 |
| 颜色 | 用 `CLASS_COLORS`（`galaxy.ts#L31-L34`），**不新增色值** |
| 动效 | 挂载时 `--w` 从 0 过渡到目标值，600ms `power2.out`；reduced-motion 直接设终值 |
| 无障碍 | `role="img"` + `aria-label` 描述总数；数值另在 legend 里，屏幕阅读器可读 |

**`segmentWidths()`：最小值会破坏总和，必须归一化（v1.1 新增）**

只写 `max(0.33%, w)` 是错的：把某个段提升到 0.33% 后，四段之和会超过 100%，导致条带溢出或最后一段被挤掉。

实测当前数据**恰好不溢出**（因为 `far` 的 0.333% 正好等于阈值）：

```
53/600  =  8.833%
371/600 = 61.833%
174/600 = 29.000%
2/600   =  0.333%   ← 恰好等于 MIN
总和    = 100.000%
```

**但沙盒权重会改变各段数量**。当 `far` 降到 1 个（0.167%）时，提升到 0.33% 后总和变成 **100.163%**。

**正确实现**：

```ts
const MIN_SEGMENT = 0.33

/**
 * 把四类计数换算成百分比宽度。
 *
 * 规则：
 * 1. 计数为 0 的段宽度恒为 0（不抬最小宽——否则会出现「有颜色的空段」误导读者）
 * 2. 计数 > 0 但占比 < MIN_SEGMENT 的段，抬到 MIN_SEGMENT
 * 3. 抬升后总和可能 > 100，整体按比例压回 100
 *
 * 保证：sum === 100（浮点容差内）；计数为 0 的段恒为 0。
 */
export function segmentWidths(counts: readonly number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return counts.map(() => 0)

  const raw = counts.map((c) => (c / total) * 100)
  const lifted = counts.map((c, i) => (c === 0 ? 0 : Math.max(MIN_SEGMENT, raw[i])))
  const sum = lifted.reduce((a, b) => a + b, 0)
  return lifted.map((w) => (sum > 0 ? (w / sum) * 100 : 0))
}
```

**单测**（`src/components/spectrum.test.ts`）—— 以下 6 条已实跑验证：

| 用例 | 输入 | 期望输出 | sum |
|---|---|---|---|
| 当前分布 | `[53, 371, 174, 2]` | `[8.833, 61.833, 29.000, 0.333]` | 100 |
| far 降到 1 | `[53, 371, 174, 1]` | `[8.834, 61.836, 29.001, 0.329]` | 100 |
| 全部极小 | `[1, 1, 1, 1]` | `[25, 25, 25, 25]` | 100 |
| 单类占满 | `[600, 0, 0, 0]` | `[100, 0, 0, 0]` | 100 |
| 两类为零 | `[300, 300, 0, 0]` | `[50, 50, 0, 0]` | 100 |
| 空集 | `[0, 0, 0, 0]` | `[0, 0, 0, 0]` | 0 |

> **不变量**（断言用）：
> - `input[i] === 0` → `output[i] === 0`
> - `total > 0` → `|sum(output) − 100| < 1e-9`
> - 输出不含 `NaN` / `Infinity`

**交互契约（不可丢）**：`LabSection` 滑块 → `rescoreUniverse(weights)` → `App.tsx` 的 `catalogue` → 传给 `SpectrumStrip` → 分段重算。**禁止硬编码 53/371/174/2。**

`statsFor` 已存在于 `galaxy.ts#L145`，直接复用：

```ts
const stats = useMemo(() => statsFor(molecules), [molecules])
const widths = useMemo(
  () => segmentWidths(CLASS_ORDER.map((c) => stats.byClass[c])),
  [stats],
)
```

---

### 4.10 `src/components/TimelineAxis.tsx`（新）

**职责**：里程碑 5 节点单轴。

| 项 | 值 |
|---|---|
| 节点数 | **5**（1996 / 1997 / 2020a / 2020b / 2025，来自 `NODES`） |
| 轴 | 一条 `<line>` 或 2px div，高度 = 节点数 × 每节点最小高 |
| 生长 | ScrollTrigger `scrub`，轴 `scaleY` 0→1 |
| 节点入场 | 轴经过时节点淡入 + 左移 12px |
| 手机 | 轴移到左侧 12px，节点右对齐 |

**保留**：`foundation: true` 的两个节点（1996/1997）仍需区分样式——它们标注「站得更早的成果」。

---

### 4.11 `src/components/Sections2.tsx`（改，极小）

**只改 2 行。**

```tsx
// 前（L122-L123）
const total = document.documentElement.scrollHeight - window.innerHeight
setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)

// 后：进度条交给 ScrollTrigger，高亮判定保持原样
// 把 setProgress 移出 onScroll，改由下面的 ScrollTrigger 驱动
```

**必须保留原样（L129-L140）**：

```tsx
const probe = window.innerHeight * 0.35
let under = ''
let lastStarted = 'top'
for (const [id] of NAV_SECTIONS) {
  const el = document.getElementById(id)
  if (!el) continue
  const rect = el.getBoundingClientRect()
  if (rect.top > probe) continue
  lastStarted = id
  if (rect.bottom > probe) under = id
}
setActive(under || lastStarted)
```

> 这段是 `abfa669` 的修复（`git show --stat abfa669`：仅 `Sections2.tsx`，+14/-3）。注释在 L124-L128 解释为什么不能用「最后开始的那个」。删了它，短章节会提前把高亮让给邻居。

**新增的进度驱动**：

```tsx
useEffect(() => {
  registerGsap()
  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => setProgress(self.progress),
    })
  })
  return () => ctx.revert()
}, [])
```

---

### 4.12 `src/App.tsx`（改）

| 位置 | 前 | 后 |
|---|---|---|
| L101 | `cosmosRef.current?.scrollIntoView({behavior:'smooth'})` | `gsap.to(window, { duration: 0.8, scrollTo: cosmosRef.current })` |
| L164 | `window.scrollTo({top:0, behavior:'smooth'})` | `gsap.to(window, { duration: 0.8, scrollTo: 0 })` |
| — | — | 新增 `useEffect(() => registerGsap(), [])` |
| — | — | `catalogue` 传给 `<SpectrumStrip>`（替换 `<CosmosStats>`） |

**reduced-motion**：两条滚动 tween 的 `duration` 设为 `0`（瞬间跳转，不消失功能）。

---

### 4.13 `src/styles.css`（改）

**literal 变量化清单（实测 10 处）**

| 行 | 现值 | 改为 |
|---|---|---|
| L311,312,315,317,318 | `rgba(230,236,255,.9/.7/.6/.7/.5)` | `rgb(var(--star-rgb) / …)`，新增 `--star-rgb` |
| L1157 | `rgba(230,236,255,.16)` | `rgb(var(--star-rgb) / .16)` |
| L666 | `rgba(12,16,36,.86)` | `var(--scrim-deep)` |
| L671 | `rgba(20,26,54,.9)` | `var(--scrim-deep-2)` |
| L718 | `color:#e9ddff` | `var(--sheen-text)` |
| L932 | 渐变 `rgba(7,10,24,.92)` | `var(--scrim-deep)` |

**新增变量**（两套主题都要给值）：`--star-rgb`、`--scrim-deep`、`--scrim-deep-2`、`--sheen-text`。

**必须删的规则**：`.feature-grid`、`.feature`、`.feature:hover`、`.feature h3`、`.feature p`（L525-L560），以及 `@media (max-width:767px)` 里的对应项（L2474-L2477、L2680）。

**新增规则族**：`.hero__stage` / `.hero__stage-glow` / `.hero__stage-dots` / `.hero__stage-stars`、`.stage-pin` / `.stage-window` / `.station-track` / `.station-card` / `.stage-progress` / `.stage-counter`、`.spectrum*`、`.timeline-axis*`。

**`html { scroll-behavior: smooth }`（L45）**：**Phase 1 验收完成后再删**。先删会让首屏高度测量时的自动滚动行为改变。

---

### 4.14 `scripts/verify.mjs`（新）

**职责**：替代被 gitignore 的 `.tmp-shot.mjs`，入库，成为可执行的验收。

**用法**

```bash
npm run build && npx vite preview --port 4400 &
node scripts/verify.mjs --url http://localhost:4400/
```

**断言（每条必须打印 PASS/FAIL + 实测值）**

| # | 断言 | 阈值 |
|---|---|---|
| 1 | `Runtime.exceptionThrown` 计数 | `=== 0` |
| 2 | 1440/1920/2560 的 `stageTravel` 差值 | `<= 1px` |
| 3 | 390 宽 `ScrollTrigger` 中 `pin` 的数量 | `=== 0` |
| 4 | 390 宽 `documentElement.scrollWidth` | `=== 390` |
| 5 | reduced-motion 下 `ScrollTrigger.getAll().length` | `=== 0` |
| 6 | pin 区间内 `navRect.bottom <= pinRect.top` | 成立 |
| 7 | `documentElement.scrollWidth` | `<= clientWidth + 1` |
| 8 | 首屏 `heroHeight / vh`（1440/768/390） | `<= 1.05` |
| 9 | `.hero__stage` 的 `left` / `width` / 横向溢出 | `left≈0`、`width≥clientW`、`overflowX≤1` |
| 10 | 正文对比度 `--text` on `--bg` | `>= 4.5` |

**退出码**：任一 FAIL → `process.exit(1)`。

**依赖（v1.1 修正）**

`ws` **不在** `package.json`，实测是 extraneous：

```
npm ls ws → ws@8.22.0 extraneous
```

`npm ci` 会删除 extraneous 包，脚本就再也跑不起来。

**必须在批次 1 同时做**：

```json
// package.json devDependencies 新增（写死版本，不带 ^）
"ws": "8.22.0"
```

实现要点：复用 `.tmp-shot.mjs` 的 CDP 建连逻辑（`fetch /json/list` → `ws` → `Runtime.evaluate`），不需要 puppeteer。

---

## 5. 交付批次

每批独立可部署、可回滚，结束打 tag。

### 批次 1：`v2.0-p1` 首屏重做

**内容**

- `HeroStage.tsx` 新建
- `Hero.tsx` 删四卡 + eyebrow + **`FEATURES` 数组（L11-L14）**
- `i18n.tsx` 删 8 条 `hero.f*`
- `styles.css` hero 段重写（overflow、分子槽栅格化、删 feature 规则）
- `scripts/verify.mjs` 新建（先只做断言 1/8/9）
- `package.json` devDependencies 加 `"ws": "8.22.0"`（**verify.mjs 的依赖，见 §4.14**）

> **v1.1 硬约束**：删 `i18n.tsx` 的 8 条 key 与删 `Hero.tsx` 的 `FEATURES` 数组
> **必须是同一次提交**。实测 `Hero.tsx#L11-L14` 有 8 处字符串引用：
>
> ```
> ['hero.f1.title', 'hero.f1.body'],
> ['hero.f2.title', 'hero.f2.body'],
> ['hero.f3.title', 'hero.f3.body'],
> ['hero.f4.title', 'hero.f4.body'],
> ```
>
> 只删 key 不删数组 → `StringKey` 联合收窄 → `tsc` 报 8 个类型错误。

**验收**
```bash
npx tsc --noEmit          # 0 error
npx vitest run            # 107 pass（本批不动测试）
npm run build             # 成功
node scripts/verify.mjs   # 断言 1/8/9 PASS
grep -c "hero\.f" src/components/Hero.tsx   # 期望 0
grep -c "hero\.f" src/lib/i18n.tsx          # 期望 0
```

**回滚**：`git reset --hard v1.1-milestones`

---

### 批次 2：`v2.0-p2` GSAP 系统

**内容**
- `package.json` 加 `"gsap": "3.15.1"`
- `lib/gsap.ts`、`lib/useReveal.ts` 新建
- `App.tsx` 两处滚动改 ScrollToPlugin + 注册
- `Sections2.tsx` 只换进度条
- `styles.css#L45` 删 `scroll-behavior`

**验收**
```bash
npx tsc --noEmit && npm run build
node scripts/verify.mjs   # 断言 1-7 PASS（此时还没 pin，6 可跳过打 SKIP）
```

**额外人工检查**：点 nav 链接平滑滚动；点左上角 MolCosmos 回到顶部；导航高亮仍随滚动切换。

---

### 批次 3：`v2.0-p3` 后半段重构图

**内容**
- `useStageTravel.ts` + 单测
- `StationStage.tsx`、`SpectrumStrip.tsx`、`TimelineAxis.tsx` 新建
- `Sections.tsx` 换用前两个
- `TimelineSection.tsx` 换用第三个
- `MethodSection` 去卡片
- `styles.css` 新增规则族

**验收**
```bash
npx tsc --noEmit && npx vitest run && npm run build
node scripts/verify.mjs   # 全部 10 条 PASS
```

**额外人工检查**：拖动 LabSection 滑块，光谱带分段跟着变。

---

### 批次 4：`v2.0-p4` 双主题

**内容**
- `theme.ts` 5→2 + `colorScheme` 动态
- `themes/paper.ts` 新建
- `urlState.ts` 旧 id 映射 + 新测试
- `i18n.tsx` 删 3 条 `theme.*` 加 1 条 `theme.paper`
- `TopnavTools.tsx` 两处 `t(labelKey)` 修类型
- `styles.css` 10 处 literal 变量化 + 新增 4 个变量
- `index.html` theme-color 交给 JS
- `README.md` 3 处同步
- `urlState.test.ts` 改 3 条

**验收**
```bash
npx tsc --noEmit && npx vitest run && npm run build
node scripts/verify.mjs   # 10 条 + 对比度
```

**关键**：本批改完**必须重跑批次 1-3 的视觉验收**（主题变了，之前的截图全部失效）。

---

## 6. 验收标准

### 6.1 必须通过（脚本可验）

| 命令 | 期望 |
|---|---|
| `npx tsc --noEmit` | 0 error |
| `npx vitest run` | **0 failed**（数量允许变，基线 107/10） |
| `npm run build` | 成功 |
| `node scripts/verify.mjs` | 10 条全 PASS，exit 0 |

### 6.2 检查器目标（具体数字）

| 项 | 目标 |
|---|---|
| `stageTravel` 在 1440/1920/2560 | 差值 ≤ 1px |
| 390 宽 pin 数 | 0 |
| 390 宽 `scrollWidth` | 390 |
| reduced-motion trigger 数 | 0 |
| 首屏 `heroHeight/vh` | ≤ 1.05（三档） |
| 正文字面对比度 | ≥ 4.5:1 |
| 大字对比度 | ≥ 3:1 |

### 6.3 明确不承诺

- 不承诺零缺陷
- 不承诺 Lighthouse 分值
- 不承诺旧主题（midnight/nebula/abyss/ember）的视觉回归——它们被删除是有意的

---

## 7. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|---|---|---|---|
| 放开 `.hero{overflow}` 后分子槽溢出 | 高 | 首屏出现横向滚动条 | 同步改分子槽为栅格定位；断言 9 覆盖 |
| pin 起点未让出 nav 高度 | **已实测会发生** | nav 压住舞台顶部 59px | `start:'top 64px'`（实测 gapUnderNav −59 → +5）+ 断言 6 |
| `100vw` 含滚动条宽 | **已实测会发生** | 左偏 7px、右溢出 8px | `calc(100vw - var(--sbw))`（四方案实测只有这个成立）；断言 7/9 |
| 砍主题触发 13 处 TS 错误 | **已实测会发生** | `npm run build` 失败 | §6 清单逐项；`TopnavTools` 两处易漏；`vitest` 不会拦住它 |
| `ws` 在 `npm ci` 后缺失 | **已实测会发生** | `verify.mjs` 跑不起来 | 批次 1 就把 `ws@8.22.0` 写进 devDependencies |
| 只删 i18n key 不删 `FEATURES` | **已实测会发生** | `tsc` 报 8 个错 | 批次 1 标为原子操作；验收含 `grep -c` |
| `segmentWidths` 最小宽破坏总和 | 中（改权重后触发） | 条带溢出 | 归一化回 100% + 单测覆盖 `[53,371,174,1]` |
| SplitText 拆碎 accent 高亮 | 中 | `10⁶⁰` 金色丢失 | accent 加 `data-no-split`，SplitText 跳过 |
| 中文按 chars 拆导致字距错乱 | 中 | 标题排版坏 | zh 用 `chars` + `letter-spacing:0` 补偿；en 用 `words` |
| 首屏 + 星系双 canvas 掉帧 | 中 | 移动端卡 | 首屏优先 CSS/SVG；WebGL 仅桌面非 reduced-motion |
| 浅色下 600 颗星变灰尘 | 高 | 视觉主轴塌 | 浅色改点阵/等值线（变量表已给值），不照搬星云 |
| Phase 4 使 P1-P3 截图失效 | 高 | 验收基准丢失 | P4 后强制重跑全量 `verify.mjs` |

---

## 8. 未决事项

| # | 事项 | 影响 | 建议 |
|---|---|---|---|
| 1 | `_shots/` 是否入库 | 未跟踪，可能误提交 | 加入 `.gitignore`，改由 `verify.mjs` 现场生成 |
| 2 | 是否有对外分享的 `?theme=` 链接 | 决定 D2 重定向是否必须 | 有 → 必做；无 → 可简化 |
| 3 | 浅色星场的具体实现 | Phase 4 最大不确定 | 先做点阵版原型再定 |
| 4 | `--text-mute` 现状 3.89:1 不达标 | Phase 4 顺手修 | 提到 `#6b7a9e` 左右可达 4.5 |

---

## 9. 参考

| 文档 | 用途 |
|---|---|
| `docs/plan-hero-rebuild.md` v3 | 决策表 D1-D11、审核记录 |
| `docs/sds-measurements.md` | **实测校正记录（v1.1 的 9 条修正来源）** |
| `docs/HANDOFF.md` | 交接说明 |
| `C:\Users\lenovo\AppData\Local\Temp\synteny-pro\docs\specs\METHODOLOGY-plan-and-sds-review.md` | 本 SDS 遵循的方法论 |
| `D:\tmp\molcosmos-motion-demo\v7.html` | 长舞台已验收实现（注意：它是 `testWindow` 挂 `.app` 外的 992 版本） |
| `D:\tmp\molcosmos-motion-demo\fixture-bleed2.html` | 全宽层四方案对比的可运行证据 |
| `library/motions.json`（taste-skill） | `pinned-story` / `rolling-figures` / `ink-fill` |
| `styles.css#L287-L294`、`#L346-L353` | `.hero` overflow 与分子槽的耦合证据 |
| `git show --stat abfa669` | 高亮逻辑修复的证据 |

---

## 10. 修订记录

| 版本 | 日期 | 改动 |
|---|---|---|
| v1.0 | 2026-11-04 | 初版。基于计划 v3 撰写，含 14 处接口签名、4 个交付批次、10 条可执行断言 |
| **v1.1** | **2026-11-05** | **实测校正（9 条）**：①`stageTravel` 去掉多余的 `pad`（`scrollWidth` 已含 padding）；②明确挂载在 `.app` 内 → `windowWidth=1132`、`travel=1040`（原写 992）；③全宽层改 `calc(100vw - var(--sbw))`（四方案实测唯一不溢出）；④断言 9 从 `elementFromPoint` 改几何断言（装饰层 `pointer-events:none`，命中必为 BODY）；⑤`ws@8.22.0` 列入 devDependencies（实测 extraneous，`npm ci` 会删）；⑥`FEATURES` 删除与 i18n key 删除标为原子操作；⑦`segmentWidths()` 加归一化回缩 + 5 条单测；⑧`.stage-pin` 挂载位置写明；⑨补 paper 主题的 10 个舞台变量+对照表；风险表 4 项从「中」升级为「已实测会发生」 |
