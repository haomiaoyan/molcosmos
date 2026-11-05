# MolCosmos 改版计划（v3 · 已通过独立审核并逐条核实）

> 状态：阶段 4 完成（核实并修复），待 SDS 撰写
> 基线截图：`_shots/`（改版前，未跟踪）
> 动效演示：`D:\tmp\molcosmos-motion-demo\v7.html`（已验收）
>
> **v3 依据**：独立子代理审核（4 BLOCKING / 11 MAJOR / 4 MINOR）+ 主会话逐条实测核实。
> 核实中推翻了审核的 1 条判断，并补充了审核漏掉的 1 处。
> 所有数字均为无头 Chrome / tsc / vitest 实测。

---

## 〇、本轮修订摘要

| # | 审核意见 | 核实结论 | 处理 |
|---|---|---|---|
| B1 | 断言 7 条 → 实际 3 条 | ✅ 对（但我原文写"7"，实测 3 条） | 改 3 |
| B2 | `#L62` 是属性行，病因是两处 | ✅ 对 | 引 L61-L65 + L287-L294 |
| B3 | `100vw` 在 `overflow:hidden` 内被裁 | ✅ **实测证实** `elementFromPoint`→`BODY` | Phase 1 加硬约束 |
| B4 | pin 后 nav 覆盖 + 7px 偏移 | ✅ **实测证实** `navCoversPin:true` / `left:-7` | 加 padding + 验收断言 |
| M5 | 8 条 key 不是 16 | ✅ 对 | 改 8 |
| M6 | `colorScheme` 在 L237 不是 L232 | ✅ 对 | 改 L237，补 `index.html#L8` |
| M7 | 浅色 literal 6 处 + 深色 4 处 | ✅ 对（6 处浅色确认） | 全列 |
| M8 | 进度条与高亮共用闭包 | ✅ 对 | 写明保留 L129-L140 |
| M9 | 光谱带需订阅 weights | ✅ 对 | 改为 `useMemo` |
| M10 | ScrollToPlugin 未点名 | ✅ 对 | 补 |
| M11 | 107 基线会变 | ✅ 对 | 改为 0 failed |
| **推翻 1** | 「3 条测试会红」 | ❌ **错**：`vitest` 107/107 全绿 | 改为「tsc 14 个错误，build 挂」 |
| **审核漏 1** | 未发现 `TopnavTools.tsx` 2 处 TS2345 | — | 补入 Phase 4 |

---

## 一、决策表

| # | 决策 | 取值 | 依据 | 对应任务 |
|---|---|---|---|---|
| D1 | 主题数量 | 5 → 2（`cosmos` + `paper`） | README:48,101,173 三处写"5 套"，但 5 套暗色未增表达力 | Phase 4 |
| D2 | 旧主题 id | 重定向到 `cosmos` | 老 `?theme=nebula` 不 404 | **Phase 4 新增任务**（v2 落空） |
| D3 | 浅色定调 | 米白 `#ece7dc` + 朱砂 `#c2410c` | Synteny `app.css#L10`(`--paper`) + `#L16`(`--accent`) | Phase 4 |
| D4 | 推进方式 | P1→P4，每阶段验收后定 | 每批独立可回滚 | 全程 |
| D5 | 版本保留 | 每批 git tag + 依赖 pin | 不靠留死代码 | **每阶段收尾新增**（v2 落空） |
| D6 | 首屏四卡片 | 删卡片 + 8 条 i18n key | **修订**：真实问题是 hero 高 1041/1497（1.16/1.77 屏）、四卡片底边 961/1417 被切，**CTA 本来可见**（598/714） | Phase 1 |
| D7 | 首屏舞台技术 | CSS/SVG + 点阵，不新增 WebGL | 同页已有 2 canvas | Phase 1 |
| D8 | 长舞台 | 横向 pin，不用 ScrollSmoother | 见 §4 | Phase 3 |
| D9 | 动画来源 | taste-skill 18 配方 + `ui.md` 第4段 + Synteny | 见 §4.4 | Phase 2/3 |
| D10 | ThreeUI | 不采用 | 见 §2.1（证据可复现性见 §2.1 注） | 全程 |
| D11 | React Bits | 不采用，用 gsap SplitText | 见 §2.2 | Phase 2 |

---

## 二、被推翻的前提

### 2.1 ThreeUI 不可用

| 事实 | 命令 |
|---|---|
| 41 MB / 解包 54 MB | `npm pack @designcodeio/threeui` + `du -sh lib-dist` |
| 自带 three 0.128 + 0.165 | `package.json` dependencies |
| iframe + srcdoc | `grep -c "iframe\|srcDoc" lib-dist/shaders/neuform-isolated/NeuformBatchEffects.js` |
| 45/53 拉 CDN | `grep -l "cdn.tailwindcss.com" sources/*.js \| wc -l` |

> **证据可复现性注**：以上来自 `npm pack` 解包，项目 `node_modules` 内无该包。复现命令见上表。若需完整复核，重跑 `npm pack` 即可。

### 2.2 React Bits 不需要

shadcn 式源码分发，非 npm 包。能力已在 `gsap@3.15.1` 正式包：`SplitText` / `ScrollTrigger` / `ScrollToPlugin` / `Flip` / `DrawSVGPlugin`。

**导入方式**（实测 `package.json` exports 为 `"./*": { import: "./*.js", types: "./types/*.d.ts" }`）：

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'
```

### 2.3 "卡片太多→加动画" 因果错误

| 章节 | 类名 | 实例数 |
|---|---|---|
| 五关卡 | `.station` | 5 |
| 宇宙普查 | `.class-card` | 4 |
| 方法说明 | `.method-card` | 4 |
| 里程碑 | `.timeline__*` | **5**（NODES 实测 5 条：1996/1997/2020a/2020b/2025） |
| 并排对比 | `.compare__panel` | **3**（类名出现 26 次，实例 3 块） |

问题在**六章共用同一构图**，不是动效弱。

---

## 三、"矩形背景"病因（实测）

```
1440x900:
.app        left=130  width=1180   （styles.css#L61-L65）
.hero       left=154  width=1132   （#L287-L294，含 overflow:hidden）
.hero__glow left=-102 width=1598   ← inset:-20% 溢出后被裁
```

**两个裁剪源，缺一不可**：
1. `styles.css#L61-L65` — `.app { max-width:1180px; padding:0 24px }`
2. `styles.css#L287-L294` — `.hero { overflow:hidden }`

**实测证据（BLOCKING #3 核实）**：

```
子元素 width:100vw; margin-left:calc(50% - 50vw)
├─ 父级 overflow:hidden  → elementFromPoint(2, y) = "BODY"     ← 被裁
└─ 父级 overflow:visible → elementFromPoint(2, y) = 子元素自己  ← 正常
两者 rectWidth 都是 1440
```

**结论**：只做全出血但仍留在 `.hero` 内会被 `overflow:hidden` 切掉。

**新增硬冲突**：`.hero{overflow:hidden}` 同时保护 `hero__molecule-slot` 的负 `left`（`styles.css#L346-L353` 注释明写"`overflow:hidden` ate the molecule's leftmost atoms"）。两条需求直接对立。

**Phase 1 必须二选一并写明取舍**：

- **方案 A**：`.hero` 改 `overflow:visible`，同时把 `hero__molecule-slot` 改回栅格内定位（不用负 `left`）
- **方案 B**：舞台层挂在 `.hero` **之外**的兄弟节点上（`position:absolute` + 有定位的祖先）

> 采用 **A**：分子槽本来就是"贴着标题左侧"的装饰，用栅格定位比负 left + overflow 更稳。

---

## 四、长舞台方案（v7 已验收）

### 4.1 核心：舞台宽度与卡片尺寸解耦

| 尝试 | 结果 |
|---|---|
| 380px 卡片 + 不限宽舞台 | 2560 视口 5 张全可见 → **位移 0px** |
| 卡片放大到 `50vw` | 位移够了，卡片过大（用户否决） |
| 380px + 舞台 `max-width:1180` | 位移对，两侧全黑 |

**最终方案**：

```css
.stage-pin    { width:100vw; margin-left:calc(50% - 50vw); }  /* 全宽背景 */
.stage-window { width:min(1180px,100%); overflow:hidden; }     /* 唯一裁剪窗口 */
.station-card { flex:0 0 380px; }                              /* 保持 v1 尺寸 */
```

位移以 `stageWindow.clientWidth` 为基准，**与屏幕宽度无关**。

### 4.2 实测数据

| 视口 | winW | cardW | trackW | travel | span | span/travel |
|---|---|---|---|---|---|---|
| 1440×900 | 1180 | 380 | 2172 | **992** | 3472 | 3.5 |
| 1512×860 | 1180 | 380 | 2172 | **992** | 3472 | 3.5 |
| 1680×950 | 1180 | 380 | 2172 | **992** | 3472 | 3.5 |
| 1920×1080 | 1180 | 380 | 2172 | **992** | 3472 | 3.5 |
| 2560×1380 | 1180 | 380 | 2172 | **992** | 3472 | 3.5 |

`travel` 五档完全相同 = 解耦成功。

采样（2560）：`p=0→x:0`、`p=.25→x:-248`、`p=.5→x:-496`、`p=.75→x:-744`、`p=1→x:-992`，计数 `01/05→05/05`。

### 4.3 pin 与 fixed nav 的冲突（BLOCKING #4 实测）

```
1440x900 / 1920x1080 两档实测：
navCoversPin: true      ← .topnav 底部 59px 压在 pin 区顶部
pinLeftOffset: -7px     ← 100vw 在 pin-spacer 内左偏（滚动条宽度）
vw 1440 / clientW 1425 / scrollW 1433  → 横向溢出 8px
```

**修正方案**：

1. **nav 覆盖**：pin 区加 `padding-top: 64px`（nav 高 56 + top 3 + 余量），或 pin 起始设 `start: 'top 64px'`
2. **7px 偏移**：`100vw` 换成 `100%` + 父级全宽，或接受偏移并 `html{overflow-x:clip}`；**不要**用 `clientWidth`（那是 JS 读值，解决不了 CSS）

**新增验收断言**：
- `navRect.bottom <= pinRect.top` 在 pin 区间内恒成立
- `document.documentElement.scrollWidth <= clientWidth + 1`

### 4.4 降级与无障碍（实测）

| 场景 | 结果 |
|---|---|
| 390 宽 | `pinned:0`、`cardWidth:302`、`overflowX:false` |
| reduced-motion | kill 后 `ScrollTrigger.getAll().length === 0`，数字直接显示终值 |

### 4.5 已修正的三处设计错误

| 项 | 错误 | 修正 |
|---|---|---|
| 墨色填充起点 | 45% | **65%**（45% 在深底上首行不可读） |
| 卡片内容对齐 | `justify-content:center` | 顶部对齐 |
| 手机降级 | 注释声称降级但实测 `pinned:1` | `gsap.matchMedia()` 真正分离 |

---

## 五、四阶段

### Phase 1 · 首屏重做

| 文件 | 动作 |
|---|---|
| `src/components/Hero.tsx` | 删 `FEATURES`（L11-L15）+ `.feature-grid` + `.hero__eyebrow` |
| `src/styles.css#L287-L294` | `.hero` 改 `overflow:visible`；`min-height` 收到 `100vh` |
| `src/styles.css#L341-L354` | `hero__molecule-slot` 改栅格定位（去掉负 `left`） |
| `src/styles.css#L525-L560` | 删 `.feature-grid` / `.feature` 规则 |
| `src/lib/i18n.tsx#L73-L93` | 删 **8 条** key（4 组 × title/body） |
| 新增 `src/components/HeroStage.tsx` | 全宽舞台层（点阵 + 光晕 + 2D 分子画布复用） |

**首屏构成**（v2 最大空白，此处补齐）：

```
.hero (min-height:100vh, overflow:visible)
├── .hero__stage        全宽背景层（绝对定位，点阵/光晕，aria-hidden）
└── .hero__inner        栅格内容（max-width:860）
    ├── .hero__molecule 分子画布（栅格内，不再是负 left 浮动）
    ├── .hero__title    标题（SplitText 拆分，保留 .hero__accent）
    ├── .hero__lead     导语
    └── .hero__actions  两个 CTA
```

删卡后由**标题放大 + 舞台背景 + 分子画布**填满视口，不再用卡片。

**验收**
- 1440/768/390 三档：`heroHeight / vh <= 1.05`
- `elementFromPoint(2, heroMidY)` 命中的是 `.hero__stage`，**不是** `BODY`
- 8 条 key 删除后 `grep -c "hero\.f" src/lib/i18n.tsx` = 0
- `npx tsc --noEmit` 零错误

### Phase 2 · GSAP 系统

新增依赖：**`gsap@3.15.1`**（含 ScrollTrigger / ScrollToPlugin / SplitText / Flip 子路径，无额外包）

新增：`src/lib/gsap.ts`（单点注册）、`src/lib/useReveal.ts`

**冲突点**（逐个必改）：

| 位置 | 冲突 | 处理 |
|---|---|---|
| `styles.css#L45` | `scroll-behavior:smooth` | **Phase 1 验收完成后再删**（先删会干扰首屏测量） |
| `App.tsx#L101` | `scrollIntoView({behavior:'smooth'})` | 改 `gsap.to(window,{scrollTo})` |
| `App.tsx#L164` | `window.scrollTo({behavior:'smooth'})` | 同上 |
| `Sections2.tsx#L118-L145` | 进度条与高亮**共用同一 `onScroll` 闭包** | **只替换 L122-L123 的 `setProgress`**，保留 L129-L140 的 `probe` + `setActive` 原样 |

> 最后一条是硬约束。`abfa669`（`git show --stat` 已核实：仅 `Sections2.tsx`，+14/-3）修的正是 L129-L140，注释在 L124-L128 解释为何不能用"最后开始的那个"。

### Phase 3 · 后半段重构图

| 章节 | 现状 | 改为 |
|---|---|---|
| 五关卡 | 5 张卡并排 | 横向 pin 长舞台（v7 方案 + §4.3 的 nav/偏移修正） |
| 宇宙普查 | 4 张等宽卡 | 光谱带，**宽度由 `useMemo` 订阅 `weights` 实时计算**，不硬编码 53/371/174/2 |
| 里程碑 | 竖线 + 5 卡 | 单条轴纵向生长（5 个节点） |
| 方法说明 | 4 张卡 | 两栏长文（全页唯一安静区块） |

**光谱带交互契约**：拖动 LabSection 滑块 → `rescoreUniverse(weights)` → `byClass` 重算 → 光谱带宽度跟随。**这是现有功能，不能因为改构图而丢掉**。

### Phase 4 · 纹理层 + 双主题

**牵连点（实测完整清单）**：

| 位置 | 内容 | 严重度 |
|---|---|---|
| `theme.ts#L14` | `ThemeId` 联合类型 | 必改 |
| `theme.ts#L19` | `labelKey` 联合类型 | **审核补充** |
| `theme.ts#L67,101,135,169` | 4 套旧主题定义 | 必删 |
| `theme.ts#L237` | `colorScheme='dark'` 写死（**不是 L232**） | 必改 |
| `theme.ts#L238-L239` | `<meta theme-color>` 动态写入 | 保留 |
| `index.html#L8` | 静态 `theme-color="#05060f"` | **审核补充** |
| `TopnavTools.tsx#L56,L78` | `t(labelKey)` 触发 TS2345 | **审核漏，实测补充** |
| `i18n.tsx#L53-L57` | `theme.*` 5 条 key → 2 条 | 必改 |
| `styles.css#L311-L318` | 5 处浅色星点 literal | 变量化 |
| `styles.css#L1157` | `rgba(230,236,255,.16)` | 变量化 |
| `styles.css#L666,671,718,932` | 4 处深色 scrim/文字 literal | **浅色主题下会变浅底深块** |
| `CosmosScene.tsx` | `sceneBg` + 雾 + 星色跟随；`CLASS_COLORS` 是数据编码色**不可变** | 必改 |
| `README.md#L48,L101,L173` | 3 处"5 套配色" | 同步 |
| `urlState.test.ts#L58,L62,L78` | 3 条 `writeUrlState` 断言 | 改 |

**实测：砍主题后的真实影响**

```
npx tsc --noEmit  → 14 个类型错误
  theme.ts              8 处（4 套 id + 4 套 labelKey）
  TopnavTools.tsx       2 处（TS2345，审核未发现）
  urlState.test.ts      3 处（L58 abyss / L62 ember / L78 midnight）
  （+1 处合计）

npx vitest run    → 107/107 全绿，零失败
npm run build     → 失败（build 含 tsc --noEmit）
```

> **推翻审核 B1**：审核称"3 条测试会红"，实测 **`vitest` 一条都不红**（esbuild 剥类型）。真正会挂的是 `npm run build`。这直接影响验收写法。

**D2 旧 id 重定向任务**（v2 落空，此处补）：

```ts
// urlState.ts: readUrlState 内，未知 id 已于 THEME_IDS.has() 处返回 null
// 新增：把历史 id 映射到 cosmos，保留分享链接可用
const LEGACY_THEME_IDS = new Set(['midnight', 'nebula', 'abyss', 'ember'])
// theme 参数是 legacy → 返回 'cosmos'
```

验收：`readUrlState('?theme=nebula').theme === 'cosmos'`，且新增 1 条测试覆盖。

**D5 版本任务**（v2 落空，此处补）：每阶段收尾 `git tag v2.0-p1` … `v2.0-p4`；`package.json` 中 gsap 写死 `"3.15.1"`（不带 `^`）。

---

## 六、验收标准

**必须通过（脚本可验）**

| 命令 | 期望 |
|---|---|
| `npx tsc --noEmit` | 零错误 |
| `npx vitest run` | **0 failed**（基线 107/10，允许数量变化，不允许失败） |
| `npm run build` | 成功（已含 tsc，是唯一构建门禁） |
| `node scripts/verify.mjs` | 见下（**新增，替代不可执行的原条目**） |

**`scripts/verify.mjs`**（新增，入库，替代被 gitignore 的 `.tmp-shot.mjs`）：

```bash
node scripts/verify.mjs --url http://localhost:4400/
```

断言：
- `Runtime.exceptionThrown` 计数 = 0
- 1440/1920/2560 三档：`|travel_a - travel_b| <= 1`
- 390 宽：`pinned === 0 && scrollWidth === 390`
- reduced-motion：kill 后 `ScrollTrigger.getAll().length === 0`
- pin 区间内：`navRect.bottom <= pinRect.top`
- `documentElement.scrollWidth <= clientWidth + 1`
- `elementFromPoint(2, heroMidY) !== BODY`

**检查器目标（数字）**

- 首屏 `heroHeight / vh <= 1.05`（三档）
- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1
  > 现状：`--text-mute #5f6c92` 在 `#05060f` 上仅 **3.89:1**，已不达标。Phase 4 需同时修。

**明确不承诺**

- 不承诺零缺陷（方法论 §八）
- 不承诺 Lighthouse 具体分值

---

## 七、风险

| 风险 | 可能性 | 缓解 |
|---|---|---|
| `.hero{overflow:hidden}` 与全出血冲突 | **确定** | Phase 1 采用方案 A（改 visible + 分子槽栅格化），验收含 `elementFromPoint` |
| pin 后 nav 覆盖 / 7px 偏移 | **确定** | §4.3 双方案 + 两条断言 |
| 砍主题 14 个 TS 错误（含 TopnavTools） | **确定** | 清单已列全，按表逐个改 |
| `deploy.yml` 以 `npm run test` 为门禁 | 中 | Phase 4 后跑 `npm run build` 验证；CI 门禁不会被 `vitest` 拦住，但会被 build 拦 |
| SplitText 拆中文字距错乱 | 中 | 中文 `chars`、英文 `words` |
| 首屏 + 星系双 canvas 掉帧 | 中 | 首屏优先 CSS/SVG，WebGL 仅桌面且非 reduced-motion |
| 浅色下 600 颗星变灰尘 | 高 | 改用点阵/等值线，不照搬星云 |
| Phase 4 改了主题影响 Phase 1-3 截图 | 高 | **Phase 4 后必须重跑 P1-P3 视觉验收** |

---

## 八、未决事项

1. `_shots/` 是否入库（当前未跟踪）——建议加入 `.gitignore`，改为由 `scripts/verify.mjs` 现场生成
2. 是否已有对外分享的 `?theme=` 链接（影响 D2 是否必须做重定向）
3. 浅色主题星场的具体实现（点阵密度、对比度参数）
4. `scripts/verify.mjs` 的落地位置（建议 `scripts/`，从 `.tmp-shot.mjs` 改写）

---

## 九、修订记录

| 版本 | 改动 |
|---|---|
| v1 | 初稿，四阶段 |
| v2 | 加 D1-D11；长舞台改 v7；补 7 轮迭代实测 |
| v3 | **独立审核后修订**：4 BLOCKING 全修；补 D2/D5 落空任务；D6 论据改为 hero 高度（CTA 本就可见）；§3 补两处裁剪源与 overflow 冲突；§4.3 加 pin/nav 实测与修正；Phase 1 补首屏构成；Phase 4 补全 14 处牵连点；新增 `scripts/verify.mjs`；推翻审核 B1（vitest 不红，build 才挂）；补审核漏掉的 `TopnavTools.tsx` |
