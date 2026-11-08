# 交接说明 · MolCosmos 改版

> ⚠️ **改代码前先读 `docs/QUICKSTART.md` §5.0**：本项目要求「计划 → 用户审核 → 用户确认 → 实施」，
> 需求不明确时先用 `/grill-me` 问清楚，不许猜着写。**这是硬约定。**
>
> 本文件记录「每批做了什么、踩过什么」。**怎么跑起来、哪些坑不能踩**在 `QUICKSTART.md`。
> 最后更新：2026-11-08 19:35
> 当前状态：**tag `v2.0-p7` · 批次 1 / 1.5 / 1.6 / 1.7 / 2 / 3 已实施 · 光晕修复已实施 · 4 条 uiverse 效果已用 · 批次 4 经用户决定作废 · reduced-motion 修复（§十三）· 视觉系统第一批（§十四）· 长舞台收尾（§十五）· B2-2 合并（§十六）· 标题改文案（§十七）**
>
> 🟢 **新会话先读 §十五「交接区」**，那里有当前进度、剩余待办、文件清单和全部踩过的坑。
> 注意 §15.2 的待办表已更新（B2-2 与标题都已完成），以那张表为准。

---

## 一、当前进度

```
✅ 阶段 1  grilling 需求澄清        D1-D11 决策表
✅ 阶段 2  计划初稿                  → docs/plan-hero-rebuild.md (v3)
✅ 阶段 3  独立审核 #1               4 BLOCKING / 11 MAJOR / 4 MINOR
✅ 阶段 4  逐条核实并修复             推翻审核 1 条，补审核漏 1 条
✅ 阶段 5  SDS 撰写                  → docs/sds-motion-and-hero.md (v1.1, 1185 行)
✅ 阶段 6  实测校正                  9 处 SDS 错误修正
✅ 阶段 7  交接文档                  本文件
✅ 阶段 8  实施                     批次 1-3 完成 · 批次 4 作废 · 评审后修复三轮（§十三/§十四/§十五）
```

### 已提交的批次

| 提交 | tag | 内容 |
|---|---|---|
| `49c3ad4` | `v2.0-p1` | **批次 1** 首屏重做：删四卡片、全宽舞台、`--sbw` 机制、`scripts/verify.mjs` |
| `693eb12` | — | **批次 1.5** 导航动画：滑动发光指示器 |
| `350c0e1` | — | **批次 1.6** 鼠标互动（背景视差 + 标题跟随光晕）+ 导航竖排修复 |
| `5e95936` | — | **批次 1.7** 光晕同步修复（延迟/位置/亮度） |
| `49e696a` | `v2.0-p2` | **批次 2** GSAP 系统：ScrollToPlugin 滚动、进度条 ScrollTrigger、121 测试 |
| `8348fd1` | — | 光晕修复（尺寸+死区）+ uiverse 素材文档 |
| `f25b9e2` | — | **批次 3a** 五关卡横向长舞台 + 宇宙普查光谱带 |
| `56f6696` | `v2.0-p3` | **批次 3b** 时间轴单轴 + 方法段去卡片 |
| `ac76ab8` … `e222c23` | — | 批次 4 计划 → 作废；QUICKSTART 与流程硬化 |
| `74afa8b` | `v2.0-p4` | **reduced-motion 舞台修复**（§十三）：堆叠、数据断言 T8c 逐卡 |
| `68aec71` | `v2.0-p5` | **视觉系统第一批**（§十四）：数据色解绑、金色收缩、limits 去壳、行宽、pin caption |
| `427a451` | — | 时间轴列宽按正文尺寸（§14.6b） |
| `2daf28e` | `v2.0-p6` | **长舞台收尾**（§十五）：caption 时机、计数器加强 |

### 光晕修复（独立于批次，2026-11-05）

首屏有两层光，用户说的"光晕"只有**跟鼠标的那层**（实测隔离截图确认）：

| 层 | 改动 |
|---|---|
| `.hero__stage-glow`（常亮薄雾） | **未动** |
| `.hero__stage-viewport-light`（跟鼠标的金色光珠） | 尺寸 `60vmax → min(52vmin,620px)`；监听边界从 `.hero` 改为全宽 `.hero__stage` |

| 问题 | 实测 | 修法 |
|---|---|---|
| 太大 | @1930 是 1158px（60% 屏宽），@390 是 130% 屏宽 | `vmin` + 620px 封顶 |
| 移向两侧就消失 | 指针监听在 `.hero`（130..1310），光画在全宽层；死区 @2560 占 **54% 屏宽** | 监听改挂 stage；`--m-on` 需"指针在 stage 内"且"hero 仍可见" |

验收脚本：`scripts/verify-glow.mjs`（G0–G8，12 条）。**注意它踩过的坑**：
`Emulation.setTouchEmulationEnabled` 开了就关不掉，会把后续所有视口污染成
"光晕隐藏"，导致**假通过**（隐藏元素尺寸为 0，`0 <= 阈值` 恒真）。
现在触摸用例单独起一个浏览器进程。

### 未开始的批次

| 批次 | 内容 | 状态 |
|---|---|---|
| **3** | 后半段重构图：五关卡横向长舞台、光谱带、时间轴轴、方法说明去卡片 | ✅ 已完成（§九之二） |
| **4** | 双主题（深空 + 米白）+ 旧 id 重定向 | ❌ 经用户决定**作废**（§九） |

---

## 二、必读顺序

1. **本文件**
2. `docs/sds-motion-and-hero.md` —— **SDS v1.1，实施的唯一依据**
3. `docs/plan-hero-rebuild.md` —— 计划 v3，决策表 D1-D11
4. `docs/sds-measurements.md` —— 9 处实测校正的来源
5. `docs/ui-effects-source.md` —— **用户给的 uiverse CSS 原文**，做 UI 效果前必读

---

## 三、环境与命令

### 项目位置

```
主项目：   D:\ai项目（自用）\molcosmos
动效演示： D:\tmp\molcosmos-motion-demo
  ├─ v7.html    ← 长舞台效果（用户已验收）
  ├─ nav.html   ← 导航三方案对比
  └─ serve.mjs  ← 演示服务，端口 4399
```

### 构建与验收

**PowerShell（本机是 Windows，`export` 不成立）**

```powershell
cd "D:\ai项目（自用）\molcosmos"

> ⚠️ 必须设置 TEMP，否则 esbuild 会因临时目录权限随机失败（环境问题，非代码问题）
$env:TEMP = "$PWD\.tmp-build"; $env:TMP = $env:TEMP
New-Item -ItemType Directory -Force .tmp-build | Out-Null

npx tsc --noEmit          # 类型检查
npx vitest run            # 168 tests / 17 files
npm run build             # 含 tsc，是唯一构建门禁
```

**Bash / Git Bash**

```bash
export TEMP="$(pwd)/.tmp-build" TMP="$(pwd)/.tmp-build"
mkdir -p .tmp-build
```

**三套验收脚本**（都需要先起 preview）

```powershell
npx vite preview --port 4415 --strictPort --host 0.0.0.0    # 另开一个终端

node scripts/verify.mjs       --url http://127.0.0.1:4415/
node scripts/verify-glow.mjs  --url http://127.0.0.1:4415/
node scripts/verify-stage.mjs --url http://127.0.0.1:4415/
```

**`--host 0.0.0.0` 必须加**：不加时 `vite preview` 只监听 IPv6 的 `localhost`，`127.0.0.1` 连不上。

### 验收基线（当前应全过）

```
tsc              0 error
vitest           168/168 pass   （17 个测试文件）
build            成功
verify.mjs       16/16 PASS
verify-glow.mjs  12/12 PASS
verify-stage.mjs 23/23 PASS
```

**三套脚本都要跑**，只跑 `verify.mjs` 会漏掉后两批的回归。
`verify-glow.mjs` 的触摸断言单独起一个浏览器进程——CDP 的
`setTouchEmulationEnabled` 开了关不掉，会污染后续视口（详见 §九之二）。

---

## 四、硬约束

| 约束 | 后果 |
|---|---|
| 唯一新增依赖 `gsap@3.15.1`（已在批次 2 引入，写死不写 `^`）+ `ws@8.22.0`（已在 devDeps） | 引入其他包需重新过审 |
| **不碰 `Sections2.tsx` 的 probe-line 高亮判定**（`if (rect.top > probe) continue` 那段） | 会丢 `abfa669` 的修复 |
| **不碰** `galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts` | 数据正确性核心，107 条数据测试保护 |
| **不改** `CLASS_COLORS` 色值 | 那是数据编码色，不是主题色 |
| 全宽层用 `calc(100vw - var(--sbw))`，**不用裸 `100vw`** | 会溢出 8px |
| 每批结束 `npm run build` + 打 tag | CI 会拒、无法回滚 |
| reduced-motion 下信息一条不少 | 无障碍硬要求 |
| 只用 `lib/gsap.ts` 注册插件，**消费者不得从 `'gsap'` 直接 import** | 重复注册会让 ScrollTrigger refresh 顺序不可预测 |

---

## 五、已实测的关键数据（不要重新估算）

### 首屏（批次 1 后）

| 视口 | hero 高 | 比值 | CTA 底边 | 导航高 |
|---|---|---|---|---|
| 1440×900 | 900 | 1.00 | 649 | 57 |
| 768×1024 | 1024 | 1.00 | 750 | 56 |
| 390×844 | 844 | 1.00 | 626 | 85 |

改版前：1440 档 1.16 vh、390 档 1.77 vh，导航窄屏 100px 竖排。

### `--sbw` 机制（血泪教训）

```
内联脚本执行时（~63ms）：clientW 1440, innerW 1440 → sbw=0px（当时正确，还没滚动条）
滚动条出现时（~310ms）：  clientW 1425, innerW 1440 → sbw=15px
```

**滚动条出现不触发 `resize`**，`useLayoutEffect` 也救不了。必须用 `ResizeObserver` 观察 `documentElement` 的盒模型（见 `src/lib/scrollbar.ts`）。

### 长舞台（批次 3 会用）

| 视口 | winW | cardW | trackW | travel | span | span/travel |
|---|---|---|---|---|---|---|
| 1440 | 1132 | 380 | 2172 | **1040** | 3952 | 3.8 |
| 1920 | 1132 | 380 | 2172 | **1040** | 3952 | 3.8 |
| 2560 | 1132 | 380 | 2172 | **1040** | 3952 | 3.8 |

> 挂 `.app` 内 → `windowWidth = 1132`（1180 − 48 padding）。
> **公式：`travel = trackWidth - windowWidth`，不要再加 pad**（`scrollWidth` 已含 padding）。

### pin 与 fixed nav

| start | pinTop | navBottom | navCoversPin | gapUnderNav |
|---|---|---|---|---|
| `'top top'` | 0 | 59 | **true** | −59 |
| `'top 64px'` | 64 | 59 | **false** | **+5** ✅ |

### 砍主题的真实影响（在临时副本实做）

```
npx tsc --noEmit  → 14 个错误
  theme.ts              8（L67,101,135,169 的 id + labelKey）
  TopnavTools.tsx       2（L56,78 TS2345）← 容易漏
  urlState.test.ts      3（L58 abyss / L62 ember / L78 midnight）

npx vitest run    → 107/107 全绿（esbuild 剥类型，不会红）
npm run build     → 失败（build 含 tsc）
```

**验收砍主题必须用 `npm run build`，不能用 `vitest`。**

---

## 六、批次 1-1.7 做了什么（避免重复劳动）

### 批次 1：首屏重做

- 删 `FEATURES` 数组 + `ul.feature-grid` + `.hero__eyebrow` + 8 条 i18n key
- 新增 `HeroStage.tsx`（全宽装饰层）、`scrollbar.ts`、`scripts/verify.mjs`
- `.hero` 改 `overflow: visible`（代价：分子槽保留原 `calc(50% - 560px)`，**不能用 SDS 建议的 clamp**，实测会压标题）
- `.gitignore` 加 `_shots/`

### 批次 1.5：导航动画

- `.topnav__glider` 单个发光指示器，`cubic-bezier(.37,1.95,.66,.56)` 过冲回弹
- 宽度取标签的 66%，`ResizeObserver` + `lang` 依赖保证中英文都对齐
- **没有照搬用户给的 10 条 `:nth-of-type`**，改用实时 DOM 测量

### 批次 1.6：鼠标互动

- `lib/pointer.ts`：`usePointerField` + `pointerVars`，`requestAnimationFrame` 节流
- 背景光晕视差 ±14% / ±10%
- 标题 `drop-shadow` 跟随（**注意：前两个方案都失败了**，见下）

### 批次 1.7：光晕修复

用户反馈"延迟大、位置不同步、不明显"，三个都是真问题：

| 问题 | 根因 | 修法 |
|---|---|---|
| 延迟 | CSS `transition: left 0.2s` 叠在 JS 帧节流上 | 改 `transform`，去掉 transition |
| 位置不同步（-146px） | 光晕是 `.hero__stage-glow` 的子元素，而该层 `inset:-20%` 且有视差位移 | 移到 `.hero__stage` 直接子元素，X 用视口坐标 |
| 不明显 | alpha 只有 0.1 | 提到 0.55 + `mix-blend-mode: screen` |

### 批次 2：GSAP 系统

- `lib/gsap.ts` 单点注册（`registerGsap` 幂等 + `refreshTriggersWhenSettled`）
- `lib/useReveal.ts`：`useReveal` hook + 三个纯函数 `revealPlan` / `scrollDuration` / `progressSource`
- `App.tsx` 两处滚动改 `ScrollToPlugin`，`useEffect(() => registerGsap(), [])`
- `Sections2.tsx` **只把 `setProgress` 换掉**，probe-line 高亮逐字未动
- `styles.css` `scroll-behavior: smooth → auto`

**计划外发现的三件事（都是实测才暴露的）**

| 问题 | 根因 | 修法 |
|---|---|---|
| reduced-motion 下进度条永远 0 | 进度条唯一数据源是 ScrollTrigger，而该分支不创建它 | `progressSource()` 分流：reduced 走原生 scroll 监听 |
| 进度条系统性偏高 ~3.5% | `end:'max'` 在创建时缓存文档高度，而页面在字体加载后会长 | `fonts.ready` + `load` 各 `ScrollTrigger.refresh()` 一次 |
| `scroll-behavior: smooth` 无法控制时长 | 原生属性把时长交给 UA，且 reduced 下无法关闭 | 全走 ScrollToPlugin，`duration` 由 `scrollDuration()` 给（reduced → 0） |

> 修前实测：滚动到底时进度条读到 93%（应 100%）。修后 `10.00 / 50.01 / 90.00` 对 `10 / 50.01 / 90`。
> **这个 `end:'max'` 缓存问题会同样偏移批次 3 的 pin**，所以必须放在批次 3 之前解决。

---

## 七、试过但失败的方案（不要再试）

| 方案 | 失败原因 |
|---|---|
| 标题上叠半透明径向渐变 | 整个文字框被提亮成**灰色矩形**（实测 x≈390→1200 可见） |
| 标题用 `background-clip: text` | 渐变不透明，**覆盖掉金色 accent** |
| 全宽层用裸 `100vw` | 三种写法都溢出 8px（`100vw` 含滚动条宽） |
| 用 `useLayoutEffect` 修 `--sbw` | 滚动条出现不触发它 |
| 用 `lightBox` 尺寸断言"光晕够小"而不先检查可见性 | `display:none` 时尺寸为 0，`0 <= 上限` 假通过 |
| 同一浏览器会话里开触摸模拟再关掉 | CDP 不回滚 `(hover:hover)`，后续视口全被误判为触屏 |
| 只监听 `resize` 修 `--sbw` | 同上 |
| 卡片放大到 `50vw` 制造位移 | 用户明确否决"太大" |
| `.stage-pin` 挂 `.app` 外 | 两侧全黑（v6 的问题） |
| 把进度条只接 ScrollTrigger | reduced-motion 分支不建 trigger，进度条永久停在 0 |
| 信 `end:'max'` 的首次测量 | 创建时缓存文档高度，字体加载后偏高 ~3.5% |

---

## 八、用户已确认的偏好

| 项 | 决定 |
|---|---|
| 浅色定调 | 暖纸米白 `#ece7dc` + 朱砂 `#c2410c`（Synteny 风） |
| 主题数量 | 5 → 2（深空 + 米白） |
| 卡片大小 | **保持 380px**（明确否决放大） |
| 长舞台节奏 | 位移 × 3.5 倍（用户反馈"太短像卡顿"） |
| 首屏下方留白 | **保留**（选 A） |
| 左侧分子 | **保留**（选 A） |
| 390 下分子 | **保留**（选 A） |
| 导航动画 | 滑动下划线 + 光晕（方案 B） |
| 不采用 | ThreeUI（iframe+CDN）、React Bits（非 npm 包） |
| 鼠标互动 | 背景 + 标题都要，但**文字本身不能动** |

### 待做的 UI 效果

**完整 CSS 原文在 [`docs/ui-effects-source.md`](ui-effects-source.md)** —— 用户发来的 5 段 uiverse 代码逐字保存，含每段的关键点和本项目适配改法。**做之前先读那份**，别只看这张表。

| # | 效果 | 计划用在哪 | 状态 |
|---|---|---|---|
| 1 | 社交图标 hover 填充（`height 0→100%` 从下往上）+ tooltip 上飘 | 导航 GitHub 按钮 | ⬜ |
| 2 | 日/月主题切换器（17 个 `box-shadow` 堆云朵） | 批次 4 改为深空↔米白 | ⬜ |
| 3 | **渐变边框卡片 = 用户说的「霓虹描边」**（绿→蓝，`#00ff75 → #3700ff`） | **五关卡（批次 3）** | ⬜ |
| 4 | 卡片 hover 放大 + `:not(:hover)` 模糊其余 | 宇宙普查（批次 3） | ⬜ |
| 5 | 竖向滑块 glider（过冲回弹 + `blur` 光晕） | **已用于导航** `.topnav__glider` | ✅ |

> 第 3 条早期被误列成两个效果，用户已确认是同一段代码。
> **实测：它默认状态看不到边框**，内层完全盖住外层，只有 hover 才露出 2px —— 用到项目里要改成常驻细边框。

**三条通用约束**（详见 `ui-effects-source.md` 末节）：

- 硬编码颜色 → 换项目 CSS 变量
- 固定像素 → 改 `clamp()`，中英文切换不溢出
- `:nth-of-type` 硬编码索引 → 改 JS 实时测量
- **导航栏只有 56px 高**，任何加进导航的效果先量这个

---

## 九、批次 4（双主题）：**经用户决定作废**

2026-11-05，用户明确决定：**背景色不改**，5 套主题全部保留，批次 4 不实施。

计划文件 `docs/plan-batch4-themes.md` 已标记作废，但**保留作为记录**——它写明了
将来若要做会踩的坑：

- 砍主题触发 **14 处 TS 报错**（`theme.ts` 8、`TopnavTools.tsx` 2、`urlState.test.ts` 3）
- `npx vitest run` 仍全绿（esbuild 剥类型），**只有 `npm run build` 能拦住**
- 光晕用 `mix-blend-mode: screen`，**白底上等于不可见**
- 批次 3 的 `.stage-pin` 用深空配色，浅色主题下会画出深色矩形（7 个舞台变量没有值）
- 实测对比度：深空 `--text-mute` `#5f6c92` 只有 **3.89:1**，低于 4.5
  （用户选择不改，若将来有人问起，这是已知项而非疏漏）

**不要照着实施。**

---

## 九之三、4 条 uiverse 效果已落地（2026-11-05）

用户提供的 5 条效果（`docs/ui-effects-source.md`）全部用上或已用：

| # | 效果 | 落地位置 | 备注 |
|---|---|---|---|
| 1 | 社交图标 hover 填充 + tooltip | **导航 GitHub 按钮** | 填充 `0→100%`；原文 50px 圆→本项目 32px 胶囊 |
| 2 | 日/月主题切换器 | — | 主题不做了，本批未用 |
| 3 | 渐变边框卡片 | **五关卡卡片** | 常驻 1px + hover 2px |
| 4 | 卡片 hover 放大 + 其余模糊 | **宇宙普查四张卡** | blur 从 10px 降到 2px（文字 0.84rem，x-height 6.7px） |
| 5 | 竖向滑块 glider | 导航指示器 | 批次 1.5 已用 |

**效果 3 的实现代价（重要）**：试了三种写法，前两种**在样式表里看起来都对**：

| 方案 | 实际渲染 |
|---|---|
| `mask-composite: exclude` | 整张卡纯黑（实测 380×227 的 `#05060f`） |
| `background-clip: padding-box` | 实心青紫色块，文字被盖住 |
| `border-image` | 能用，但**按规范忽略 `border-radius`**，卡片变直角 |
| **两层伪元素叠加** | ✅ 圆角保留、环可见、文字正常 |

最终：`.station::before` 画渐变，`.station::after` 用面板色内缩 1px。
`.station` 自身背景必须去掉（否则盖住环），面板色由内层承担；
又因 `--panel` 是 0.72 半透明，内层还要垫一层不透明的 `--bg`。

> **本批必须重跑批次 1-3 的全部视觉验收**：主题变了，之前的截图全部失效。

**砍主题的真实代价（已实测，不要重新估）**：在临时副本实做过，`npx tsc --noEmit`
报 **14 个错误**（`theme.ts` 8、`TopnavTools.tsx` 2、`urlState.test.ts` 3）。
`npx vitest run` 仍 107/107 全绿——**esbuild 剥类型，拦不住**。
**验收必须用 `npm run build`，不能只看 vitest。**

---

## 九之二、批次 3 已完成（留档）

| 交付物 | 文件 | 验收 |
|---|---|---|
| 长舞台位移计算 | `lib/useStageTravel.ts` + 12 测试 | travel 1040，frame clamp 正确 |
| 五关卡横向舞台 | `components/StationStage.tsx` | window 1132 / card 380 / x 走到 −1040 |
| 宇宙普查光谱带 | `components/SpectrumStrip.tsx` + 9 测试 | 8.833/61.833/29.000/0.333，归一化后 sum 100 |
| 时间轴单轴 | `components/TimelineAxis.tsx` + 7 测试 | 线 27..717.1 对 marker 27..717.1 |
| 方法段去卡片 | `Sections2.tsx` | 编号行，文案未改 |

**批次 3 的实测结论（不要再踩）**

1. **`scrollWidth` 不含尾部 padding**。溢出时 Chrome 只计前导 padding：
   `scrollWidth = 2148`，而真实宽 `2172`（5×380 + 4×56 + 48）。
   → travel 差 24px。**必须自己合成宽度**：`Σ card.offsetWidth + gap×(n−1) + padding`。
   （已写回 SDS §4.5 的 v1.2 修正）
2. **SDS §4.10 的"轴高 = 节点数 × 最小高"是错的**。节点高由正文长度决定，
   照算会让轴停在最后一张卡里。→ 取首尾 marker 中心。
3. **测 pin 的起点要用 `.pin-spacer` 的文档位置**，不是 pin 元素的当前位置——
   后者在 pin 生效后是被钉住的位置，拿它当起点会得出"行程只有 836px"的错误结论。
4. **CDP 的 `setTouchEmulationEnabled` 开了关不掉**，会污染后续所有视口。
   触摸断言必须单独起浏览器进程（`verify-glow.mjs` 已按此实现）。
5. **React 受控 input 不能直接赋 `.value`**，要走原生 setter 再派发事件，
   否则 onChange 不触发，会误判"交互断了"。

---

## 十、如果发现 SDS 有错

**以代码为准。**

- 记录偏离（提交信息里说明）
- 同步更新 `docs/sds-measurements.md`
- 若影响其他批次，先修 SDS 再继续

---

## 十一、⚠️ 环境已知问题

**esbuild 临时目录权限问题**（与代码无关，干净基线上同样复现）：

```
npm run build → [vite:esbuild-transpile] remove ...: Access is denied
```

**修法**：`export TEMP="$(pwd)/.tmp-build" TMP="$(pwd)/.tmp-build"`，CI（Linux）不受影响。

**`vite preview` 监听问题**：不加 `--host 0.0.0.0` 时只监听 IPv6，`127.0.0.1` 连不上。

---

## 十二、参考

| 文档 | 用途 |
|---|---|
| `docs/sds-motion-and-hero.md` | SDS v1.1（1185 行） |
| `docs/plan-hero-rebuild.md` | 计划 v3 + 决策表 |
| `docs/sds-measurements.md` | 9 处实测校正 |
| `docs/plan-reduced-motion-stage.md` | §十三 的计划 |
| `docs/plan-visual-system.md` | §十四 的计划（含被实测否决的色值方案） |
| `C:\Users\lenovo\AppData\Local\Temp\synteny-pro\docs\specs\METHODOLOGY-plan-and-sds-review.md` | 方法论 |
| `D:\tmp\molcosmos-motion-demo\v7.html` | 长舞台已验收实现 |
| `git show --stat abfa669` | 高亮逻辑修复的证据 |

---

## 十三、reduced-motion 舞台修复（2026-11-08）

**计划**：`docs/plan-reduced-motion-stage.md`（用户已确认）

### 问题

系统开启「减少动态效果」后，1440×900 下五关卡只有前两张完整可见：

| 卡片 | 改前 | 改后 |
|---|---|---|
| 01 靶点确认 | 380/380 100% | 560/560 100% |
| 02 虚拟筛选 | 380/380 100% | 560/560 100% |
| 03 分子生成 | **236/380 62%** | 560/560 100% |
| 04 性质预测 | **0/380 0%** | 560/560 100% |
| 05 合成与临床 | **0/380 0%** | 560/560 100% |

计数器还停在 `01 / 05`，既不滚也不会变。

### 根因：CSS 没跟上 JS 已经做出的决定

`StationStage.tsx` 的 `matchMedia` 是：

```js
`(min-width: ${STAGE_BREAKPOINT_PX}px) and (prefers-reduced-motion: no-preference)`
```

JS 本来就不在 reduced motion 下建 trigger。但 `styles.css` 的堆叠块**只写了宽度条件**：

```css
@media (max-width: 767px) { ... }
```

于是轨道不动、`.stage-window` 仍 `overflow: hidden`、2172px 的轨道被 1132px 的窗口裁掉，后三张既没有 pin 带着走，也没有滚动容器可滑。

**这是两边条件不对称，不是设计取舍。**

### 为什么验收脚本没拦住

`verify-stage.mjs` 的 T8c 断言名写着 "all five cards still present and visible"，实际代码是：

```js
firstVisible: document.querySelector('.station').getBoundingClientRect().width > 0
```

**只测了第一张卡。** 名字说五张，代码验一张。

### 改法

**`src/styles.css`** —— 两段式，不是新写一套：

```css
/* 条件扩展：宽度 OR reduced motion */
@media (max-width: 767px), (prefers-reduced-motion: reduce) { /* 原 767px 块全部内容 */ }

/* 只作用于桌面 + reduced motion */
@media (prefers-reduced-motion: reduce) and (min-width: 768px) {
  .station-track { align-items: center; }
  .station-track > .station { max-width: 560px; }
  .station-track > .station[data-active='true'] { border-color: var(--line); box-shadow: none; }
}
```

**`scripts/verify-stage.mjs`** —— T8c 改为逐卡检查，边界取 `.stage-window`（`overflow: hidden` 的那个盒子）而不是视口：

```js
visibleW = Math.max(0, Math.min(card.right, win.right) - Math.max(card.left, win.left))
allFullyVisible = every(card => card.visibleW >= card.width - 1 && card.opacity === '1')
```

### 三个实测结论（不要再踩）

1. **`max-width` 不能塞进合并块**。实测 767px 时卡片是 704px、700px 时是 637px；限宽若写进共享块会把这两个宽度悄悄改掉。必须单独放 `(min-width: 768px)` 里。改后复测 767/700/600 = **704/637/557，与改前逐值一致**。

2. **560px 是量出来的，不是拍的**。1440 下正文 14.1px：不限宽 → 1132px、45–59 字/行（CJK 舒适区 30–40）；420px → 卡 2 折成 3 行、五卡高度不齐（203/227 混排）；560 与 640 都是 2 行且高度整齐，560 不抢 `.section__head` 的 760px。

3. **堆叠后要压掉 `data-active` 的高亮**。trigger 不跑，第 1 张卡会一直带着为「静止态」标的那圈亮边框（`0.38` vs `0.18` + 阴影），在五张同款卡里会被读成「这张被选中」。

### 验证

先证明断言抓得住 bug：把 CSS 回退到改前（`git stash`），只保留新断言 ——

```
FAIL  T8c. every card is fully inside the clipping window under reduced motion
      — 5 cards, 2/5 fully visible — clipped: 03 62%, 04 0%, 05 0%
```

再恢复修复 ——

```
PASS  T8c. every card is fully inside the clipping window under reduced motion
      — 5 cards, all fully visible (5/5)
```

全量验收：

```
npx tsc --noEmit              0 error
npx vitest run                168/168
npm run build                 成功（css 44.19 → 44.44 kB，只有这两条规则的增量）
scripts/verify.mjs            16/16
scripts/verify-glow.mjs       12/12
scripts/verify-stage.mjs      23/23
```

回归确认（改前 / 改后逐值一致）：

| 场景 | 结果 |
|---|---|
| 1440 正常 | row，380px，pin 工作，mid `transform -657.715`、counter `04/05` |
| 767 / 700 / 600 正常 | 704 / 637 / 557px，`changed: false` |
| 390 正常 | 362px，`changed: false` |
| 390 reduced | 362px，`changed: false` |
| 1440 EN + reduced | 五卡全可见，卡 2/3 各 3 行，560px |

**证据**：`D:\deepseek---dsh----test\.oil-ui\visual-review\shots\32-fix-verified\`

### 没做的

评审里的其余 P0/P1 条目（分子面板 27.5% 内容不可见、首屏次按钮无反馈、徽章数据色被主题劫持、长舞台 80% 留白、时间轴 reveal 起点）**均未动**。按 §5.0，一次只做一件事。

---

## 十四、视觉系统第一批（2026-11-08）

**计划**：`docs/plan-visual-system.md`（用户确认走「路线 1」+ 金色收缩）

范围：**A2 路线 1** + **B2-1** + **B2-3** + **C2-1**。
不做：B2-2（compare 并入 stats）、C2-2（pin 高度）、C2-3（计数器加强）、改标题。

### 14.1 数据色与强调色解绑（A2 路线 1）

**问题**：`theme.ts` 里四个强调色与四个数据色在默认主题下**逐值相同**：

```
--accent   #ffd47e == CLASS_COLORS.goldilocks
--accent-2 #37e2c8 == CLASS_COLORS.candidate
--accent-3 #b389ff == EXPLORATION_COLOR
--accent-4 #6ea8fe == CLASS_COLORS.lead
```

徽章走 `--accent-*`（随主题变），图例圆点走内联 `CLASS_COLORS`（不变）。实测切到 `abyss`：

| | cosmos | abyss |
|---|---|---|
| `.badge--candidate` | `rgb(55,226,200)` | `rgb(63,214,184)` ← 变了 |
| `.legend__dot` | `rgb(55,226,200)` | `rgb(55,226,200)` ← 没变 |

**同一屏、同一类别、两种颜色**，违反 `§四` 的「不改 CLASS_COLORS」。

**改法**：新增 `DATA_COLOR_VARS`，由 `applyTheme` 无条件写入（五套主题同值）：

```ts
export const DATA_COLOR_VARS = {
  '--data-goldilocks': '#ffd47e',
  '--data-candidate': '#37e2c8',
  '--data-lead': '#6ea8fe',
  '--data-far': '#5a6788',
  '--data-generated': '#b389ff',
} as const
```

徽章的 `color` 改用 `var(--data-*)`；`border-color` / `background` **仍用 accent 三元组**——那是表面，该跟着背景色变。只有「墨」是数据。

`galaxy.ts` 的 `CLASS_COLORS` **一个字节没动**（`git diff src/lib/galaxy.ts` 为空）。

### 14.2 为什么没换强调色的值

计划里原本推荐 `--accent: #f5c451`。实测否决了它：

用 CIEDE2000 量了 20 组「强调色 vs 它对应的数据色」，**10 组 deltaE < 15**（人眼难辨），且集中在默认主题（4/4 全撞）与 nebula（3/4）：

| 令牌 | 要避开 | 达标候选（dE≥15 且对比度≥4.5） |
|---|---|---|
| `--accent` | goldilocks `#ffd47e` | `#e07b39`(25.9) / `#d2691e`(30.1) |
| `--accent-2` | candidate `#37e2c8` | `#38bdf8`(27.9) / `#0ea5e9`(32.2) |
| `--accent-3` | generated `#b389ff` | `#f472b6`(20.7) / `#ec4899`(24.4) |
| `--accent-4` | lead `#6ea8fe` | `#6366f1`(20.8) |

`#f5c451` 只有 **deltaE 5.5**——等于没解决。而四个全换会把配色从「金+青+紫+蓝」变成「橙+天蓝+粉+靛」，且 `--accent-2` 与 `--accent-4` 会挤到同一蓝区。

**结论**：「品牌金 = 宜居带金」在默认主题下**是有意的呼应**（首屏金色数字 ↔ 星系最亮的星），不是缺陷。真正的缺陷是换主题后这个呼应崩了。所以只解绑令牌，不改色值。

### 14.3 金色收缩到三种角色

保留：品牌字标 `.topnav__brand`、主 CTA `.btn--primary`、章节标题重音 `.accent-text`。

六处改掉：

| 位置 | 改前 | 改后 |
|---|---|---|
| `.funnel__value` 漏斗数值 | 金 | `--text` |
| `.timeline__year` 时间轴年份 | 金 | `--text-dim` |
| `.compare__best` 最优值 | 金 | `--accent-2` |
| `.shortlist--open` 展开态 | 金 | `--text` + `--line-strong` |
| `.footer__links a:hover` | 金 | `--text` |
| `.mol-panel__action--on` 收藏态 | 金 | `--accent-2` |

全页金色文字 **23 → 17**（剩下的 17 里，8 个是章节标题重音、2 个首屏大数字、4 个是数据色 `宜居带分子` 的显示、1 个导航激活、1 个字标、1 个 AI 标签）。

### 14.4 limits 去掉卡片外壳（B2-1）

四条否定句原本装在圆角盒子里，与上方普查的四张卡**几何完全一致**（只有边框色不同），连着两屏「四个圆角矩形」。

改为无边框 + 2px 红左竖线：

```css
.limits-list li {
  border: 0;
  border-left: 2px solid rgba(255, 107, 122, 0.5);
  border-radius: 0;
  background: none;
  padding: 14px 0 14px 18px;
}
```

「同款矩形」从 5 章降到 4 章。

### 14.5 行宽统一（B2-3）

新增 `--measure: 34em`（≈34 个全角字），只作用于时间轴与方法正文：

| 位置 | 改前 | 改后 |
|---|---|---|
| `.timeline__body` | 782px / **55 字/行** | 479px / **30 字/行** |
| `.method-row__body` | 698px / **50 字/行** | 479px / **25 字/行** |

普查卡片（17 字/行）**不动**——那是四列布局决定的，收窄只会让四列更窄。

> **副作用（已处理，见 14.6b）**：时间轴卡片宽 782px，正文收到 479px 后右侧空出一块。

### 14.6 pin 内加章节标题（C2-1）

**问题**：pin 起点时真实标题已在 `-206px`，末端 `-3846px`——3640px 行程里屏幕上没有任何章节标识。

**改法**：在 `.stage-pin` 内加一个精简 caption（`aria-hidden`，因为重复了真实标题）：

```jsx
<div className="stage-caption" aria-hidden="true">
  <span className="stage-caption__eyebrow mono">{t('pipeline.eyebrow')}</span>
  <h3 className="stage-caption__title">{t('pipeline.title.accent')}</h3>
</div>
```

实测 pin 全程：

| 进度 | 真实标题 bottom | caption | counter |
|---|---|---|---|
| 0 | −44 | 可见 @301px | 01/05 |
| 0.25 | −1163 | 可见 @301px | 02/05 |
| 0.5 | −2282 | 可见 @301px | 04/05 |
| 1 | −4520 | 随 pin 释放上移 | 05/05 |

caption **不用金色**（用 `--text-dim`）——它重复的标题在几百像素之上已经是金色，再加一处就与「收缩」自相矛盾。

堆叠模式（≤767px 或 reduced motion）下 `display: none`：那里没有横向行程，真实标题就在上方，重复即冗余。

### 14.6b 时间轴右侧空白（B2-3 的副作用，已修）

B2-3 把正文收到 479px，但卡片仍是 824px —— **每张卡右侧空 304px**，整列看起来像「没装满的盒子」。用户指出后处理。

量了三个方案：

| 方案 | 卡宽 | 卡内空白 | 问题 |
|---|---|---|---|
| 现状 | 824 | **304** | 空白 |
| A 收窄整轴 | 586 | 66 | 仍有 66 |
| B `fit-content` | 521 | 1 | 卡贴合，但左侧轴与卡之间出现大空白 |
| **A′ 收窄整轴（算对基准）** | **521** | **1** | ✅ |

**踩到的坑**：`em` 是相对**使用它的元素**字号解析的。

`--measure: 34em` 在 `:root`（16px）下是 **544px**，但用在 `.timeline__body`（`0.88rem` = 14.08px）上是 **479px**。第一次我按 544 算轴宽，于是卡内还剩 65px 空白。

**修法**：把时间轴的列宽单独做成令牌，并把 0.88 显式写进算式：

```css
:root {
  --timeline-w: calc(var(--measure) * 0.88 + 40px + 2px + 14px + 22px);
}
.timeline-axis,
.timeline__disclaimer { max-width: var(--timeline-w); }
```

`40px` 是卡片左右 padding，`2px` 是边框，`14px` 是标记列，`22px` 是间距。

**disclaimer 也一起收**：它原本 860px，轴收窄后会比时间轴宽 238px，整章出现两个右边界。现在两者同宽。

实测（三档视口）：

| 视口 | 轴宽 | 卡宽 | 正文 | 卡内空白 | 与 disclaimer 对齐 |
|---|---|---|---|---|---|
| 1440 | 557 | 521 | 479 | **1** | ✅ |
| 768 | 557 | 521 | 479 | **1** | ✅ |
| 390 | 362 | 324 | 290 | **1** | ✅ |

### 14.6c caption 重复（C2-1 引入的缺陷，已修）

C2-1 的 caption 是**无条件渲染**的。后果：从导航点进「流水线」时，真实标题还在视口里（`headingTop 127px`），caption 同时出现 —— **同一屏两个「五道关卡」**。

修法：用 `IntersectionObserver` 观察真实标题（`#pipeline-title`），只在它完全离开视口后才渲染 caption。

选 `IntersectionObserver` 而非滚动回调，理由与 `lib/pointer.ts` 相同：它只在跨越时触发，而页面滚动已由 ScrollTrigger 驱动，再加一个滚动监听会在主线程上打架。

实测跨越点（滚到标题位置附近逐档试探）：

| `headingTop` | 标题可见 | caption 渲染 | 同屏重复 |
|---|---|---|---|
| +127（导航跳入） | 是 | **否** | 否 |
| +20 | 是 | 否 | 否 |
| −40（底边还剩 23px） | 是 | 否 | 否 |
| **−120（底边 −57）** | **否** | **是** | 否 |
| −400 | 否 | 是 | 否 |
| −2413（pin 中段） | 否 | 是 | 否 |

`duplicateOnScreen` 全程 `false`。

### 14.6d 计数器与进度条（C2-3）

| | 改前 | 改后 |
|---|---|---|
| `.stage-counter` 字号 | 0.78rem（12.5px） | **0.875rem（14px）** |
| `.stage-counter` 颜色 | `--text-mute`（3.89:1） | **`--text-dim`（8.44:1）** |
| `.stage-progress` 高度 | 2px | **3px** |
| 进度条圆角 | 无 | 999px |

理由是它是全屏唯一说明「还有四张卡在右边」的信号，却是对比度最低的一处文字。

### 14.6e C2-2（pin 高度）—— 实测不可行，已放弃

原方案写的是 `.stage-pin { height: auto; min-height: calc(100vh - 64px) }`，想把 80% 留白压掉。**实测否决**：

pin 元素如果短于视口，它覆盖不住自己占用的滚动区域。实测 `height: auto` 后 pin 从 836px 掉到 490px，**下方露出 346px 纯黑**，漏斗章节从缝里钻出来。

截图证据：`.oil-ui/visual-review/shots/37-pin-height/01-auto-height-mid-pin.png`

又试了「加高卡片」替代方案（460px 宽 + 更大字号），填充率只从 27% 到 41%，仍有 250px 空白。

**结论**：80% 留白不是「盒子太大」或「卡片太矮」，是「5 张 380px 的卡在 1440 宽的横向舞台里本来就填不满一屏」。这是结构决定的，不是 bug。用户确认接受（路线甲）。

### 14.7 验证

```
npx tsc --noEmit              0 error
npx vitest run                168/168
npm run build                 成功（css 44.19 → 44.89 kB）
scripts/verify.mjs            16/16
scripts/verify-glow.mjs       12/12
scripts/verify-stage.mjs      23/23
```

逐项实测：

- `--data-*` 五个令牌写入成功，`applyTheme` 无条件执行
- `abyss` 下 `.badge--candidate` 现在与图例圆点**同为 `rgb(55,226,200)`**（修复前是 `rgb(63,214,184)`）
- limits：`borderTopWidth 0px` / `borderLeftWidth 2px` / `borderRadius 0px` / `background 透明`
- 行宽：timeline 479px / 30 字/行，method 479px / 25 字/行
- caption：桌面 `display: block`，手机与 reduced-motion `display: none`
- `T9b` 轴高从 `27..717.1` 变为 `27..765.5`——时间轴卡片因正文变窄而变高，轴跟着变长，**属预期**

**证据**：`D:\deepseek---dsh----test\.oil-ui\visual-review\shots\33-visual-system\`、`34-caption-scroll\`

### 14.8 没做的

- **B2-2**（compare 并入 stats，九章→八章）：动导航与章节顺序，单独一轮 → **已在 §十六 完成**
- **C2-2**（pin 高度 `auto`，留白 80%→~45%）：**实测不可行，已放弃**，理由见 §14.6e
- **改标题**（stats、method 两个标题）：改文案需单独确认 → **已在 §十七 完成**

> C2-3（计数器加强）与 C2-1 的 caption 时机修复已在下一批完成，见 §十五。

---

## 十五、交接区 —— 新会话从这里开始

> 写于 2026-11-08 15:10，HEAD `2daf28e`，tag `v2.0-p6`，工作区干净（只有未跟踪的 `.oil-ui/`）

## 15.1 三十秒摘要

MolCosmos 是一个 AI 制药主题的中文单页站（课程项目），React 18 + TS + 纯 CSS + Three.js + GSAP。
600 个确定性生成的分子排成三轴旋涡星系，亮度 = 类药潜力打分，下面 10 个章节讲完整叙事。

**当前状态**：功能与视觉都已稳定，168 条单测 + 三套验收脚本全绿。最近三轮在做「评审后的修复」，
不是新功能。**没有半成品，没有已知的坏状态。**

## 15.2 现在接手该做什么（按优先级）

| # | 事项 | 为什么 | 成本 |
|---|---|---|---|
| ~~1~~ | ~~**B2-2：compare 并入 stats**~~ | ✅ **已完成**，见 §十六。九章 → 八章 | — |
| ~~2~~ | ~~改 stats / method 两个标题~~ | ✅ **已完成**，见 §十七 | — |
| **1** | **评审剩余的局部条目** | 见 15.5。分子面板 27.5% 内容不可见、首屏次按钮无反馈、时间轴 reveal 起点 | 小～中 |
| **2** | 768 档导航溢出 20px | §16.3 新发现的既有问题；390 档已顺带修好 | 小 |
| **3** | compare 空态死路 | 合并没解决它（§16.5）。要加「去星系」按钮，属新功能 | 小 |
| 4 | 不做也行 | 见 15.6 | — |

## 15.3 文件清单（最近三轮改过的）

| 文件 | 改了什么 | 提交 |
|---|---|---|
| `src/styles.css` | 堆叠条件、数据色、金色收缩、limits、`--measure`、`--timeline-w`、caption、计数器 | `74afa8b` `68aec71` `427a451` `2daf28e` |
| `src/lib/theme.ts` | 新增 `DATA_COLOR_VARS`，`applyTheme` 无条件写入 | `68aec71` |
| `src/components/StationStage.tsx` | caption + `IntersectionObserver` 门控 | `68aec71` `2daf28e` |
| `scripts/verify-stage.mjs` | T8c 改为逐卡检查 | `74afa8b` |
| `docs/plan-reduced-motion-stage.md` | §十三 的计划（已实施） | `74afa8b` |
| `docs/plan-visual-system.md` | §十四 的计划（部分实施） | `68aec71` |

**没动过的**：`lib/galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts` —— 数据核心，107 条测试保护。
`git diff src/lib/galaxy.ts` 应始终为空。

## 15.4 三条命令验证一切

```powershell
cd "D:\ai项目（自用）\molcosmos"
$env:TEMP = "$PWD\.tmp-build"; $env:TMP = $env:TEMP
New-Item -ItemType Directory -Force .tmp-build | Out-Null

npx tsc --noEmit && npx vitest run && npm run build
```

期望：`0 error` / `168/168` / `成功`。

然后另开终端起 preview，跑三套：

```powershell
npx vite preview --port 4415 --strictPort --host 0.0.0.0
```

```powershell
node scripts/verify.mjs       --url http://127.0.0.1:4415/   # 16/16
node scripts/verify-glow.mjs  --url http://127.0.0.1:4415/   # 12/12
node scripts/verify-stage.mjs --url http://127.0.0.1:4415/   # 23/23
```

## 15.5 踩过的坑（本轮新增的，老的见 §三 §七）

### 🔴 1. `em` 是相对「使用它的元素」解析的

`--measure: 34em` 在 `:root`（16px）下是 544px，在 `.timeline__body`（0.88rem）下是 479px。
按 544 算容器宽，卡里就剩 65px 空白。**算容器宽时要把目标元素的字号显式乘进去**：

```css
--timeline-w: calc(var(--measure) * 0.88 + 40px + 2px + 14px + 22px);
```

### 🔴 2. `height: auto` 会让 pin 塌掉

`ScrollTrigger` 的 pin 元素如果短于视口，它覆盖不住自己占用的滚动区域，**下方会露出后面的内容**。
实测 pin 836px → 490px，露出 346px 纯黑。**pin 元素必须撑满视口高度。**

### 🔴 3. 无条件渲染的重复标题

从导航跳进某章时，章节标题还在视口里。此时再渲染一份精简标题 = 同屏两个。
**必须用 `IntersectionObserver` 观察真实标题，滚出后才渲染。**

### 🟠 4. CDP 的 `--hide-scrollbars` 会改变布局测量

截图时开了它，`--sbw` 变 0，卡片从 704px 变 719px，误判成回归。
**测量布局时不要加 `--hide-scrollbars`。**

### 🟠 5. 断言名 ≠ 断言内容

`verify-stage.mjs` 的 T8c 叫 "all five cards still present and visible"，
实际只测了 `document.querySelector('.station')` 第一张卡。
**三张卡被裁掉它一直显示 PASS。** 改断言时先回退代码验证它真的会红。

### 🟠 6. 候选色靠「挪一档」区分不开

想把强调色与数据色拉开，试了 20 组，10 组 deltaE < 15（人眼难辨）。
`#f5c451` vs `#ffd47e` 只有 **5.5**。要达标必须跨色相家族 = 换配色。
**结论：默认主题下「品牌金 = 宜居带金」是有意呼应，不是缺陷；只解绑令牌，不改色值。**

## 15.6 明确不做的

- **C2-2 长舞台 80% 留白**：实测不可行（坑 2），且加高卡片最多到 41% 填充。
  80% 是「5 张 380px 卡在 1440px 舞台」的结构必然。用户已确认接受。
- **批次 4 双主题**：用户明确作废。
- **改 `CLASS_COLORS`**：数据编码色，107 条测试保护。
- **`--text-mute` 对比度 3.89:1**：用户知情并选择不改（已在 §十四 局部处理掉几处最要紧的）。

## 15.7 用户的工作方式（重要）

1. **§5.0 是硬约定**：计划 → 用户审核 → 用户确认 → 实施。**没听到「确认」不许动代码。**
2. 需求不明确时用 `grilling` 问，**不许猜**。
3. 用户会**否决方案里的具体推荐**（本轮 `#f5c451` 就被实测推翻了）。
   计划里要写清取舍，不要只给一个数。
4. 用户偏好：**实测数据 > 推理**。本项目几乎每个决策都带 `measured` 字样。
5. 用户会要求**版本记录**：每批必须更新 HANDOFF + 打 tag。

## 15.8 关于 prompt cache（用户特别要求记下）

> ⚠️ **先读下面的修订版**。本节原结论「缓存命中 0 是因为请求前缀变了」**已被实测推翻**，
> 保留原文只为记录当时的判断过程。真正的结论见「本节已被实测推翻」那一小节。

**原结论（已推翻，留档）**：缓存命中 0 是因为**请求前缀变了**，不是「工具调用」本身。

| 变化 | 破坏缓存 |
|---|---|
| 尾部追加工具结果 | ❌ 不破坏（这是缓存最擅长的场景） |
| 改 system prompt / runtime context 头部 | ✅ 破坏 |
| 改 cwd | ✅ 破坏 |
| 上下文压缩 / 换 provider | ✅ 破坏 |

DSH 侧的 `cacheReadTokens` 完全来自服务端 `usage` 字段，客户端不上报。

### ⚠️ 本节已被实测推翻（2026-11-08 16:00 修订）

上一版写「中途切过工作目录」「技能目录被整份替换」——**两条都不成立**，已核实：

| 上一版的说法 | 实测 |
|---|---|
| 中途切过 cwd | `session` 记录只有 1 条，`cwd` 全程 `D:\deepseek---dsh----test`，**没变过**。「切过 cwd」是**别的会话**的事 |
| 技能目录整份替换 | 表象。真正变化的是 **tools 定义 263 → 270**（seq 433，新增 7 个 `guizang_*` / `oil_ui_*`），且此后 3 条 header 哈希相同 |
| 运行时快照在头部 | `Current runtime context` 在 **`user/message`**（seq 17），是**尾部追加**。系统提示词只有 1 条，不含它 |

**真正的原因**：本会话走 **`trae`** 路由，它返回的 `usage` **完全没有缓存字段**。

| provider | 样本数 | 平均 inputTokens | 平均 cacheReadTokens | 有 cache 字段 |
|---|---|---|---|---|
| `trae` | 2026 | **450,600** | **0** | **0 / 2026** |
| `trae-global` | 220 | 351,860 | 0 | 0 / 220 |
| `workbuddy` | 8431 | 30,025 | 294,758 | 7930 / 8431 |
| `workbuddy-global` | 7930 | 2,290 | 127,342 | 7911 / 7930 |
| `deepseek-v4-1-flash` | 1213 | 11,693 | 153,184 | 1179 / 1213 |

`parseChunkUsage` 的三条 `??` 全部落空 → `cacheReadTokens = 0`。
**即使服务端真命中了，这条路由也观测不到。**

> 完整排查记录见 **`D:\deepseek---dsh----test\缓存问题说明.md`**（含复现脚本与两个坑：
> 多帧 zstd 必须按 magic 切帧；别用字符串匹配判断字段存在，会被讨论缓存的正文污染）。

**仍然成立的约定**（这些不因上面的修正而失效）：
- 工具列表变化、上下文压缩、换 provider 确实会断一次缓存链——只是**不是本次恒为 0 的原因**。
- 长任务拆成多个会话，每个会话前缀稳定。
- 少做「整份替换」类的大块注入。

---

## 十六、B2-2 compare 并入 stats（2026-11-08）

**计划**：`docs/plan-b2-2-merge-compare.md`（用户已确认）
**提交**：见 `git log`，tag `v2.0-p7`

### 16.1 做了什么

九章 → 八章。`#compare` 从独立章节降级为 `#stats` 的第二个子块。

| 文件 | 改动 |
|---|---|
| `src/components/CompareSection.tsx` | `CompareSection` → `CompareBlock`；`<section class="section">` → `<div class="sub-block">`；`h2` → `h3`；删 eyebrow；内部三个 `compare__subtitle` 由 `h3` → `h4` |
| `src/components/Sections.tsx` | `CosmosStats` 多收 `shortlist` prop，内部挂 `<CompareBlock>` |
| `src/App.tsx` | 删 `CompareSection` 独立挂载与 import |
| `src/components/Sections2.tsx` | `NAV_SECTIONS` 删 `['compare', 'nav.compare']`；同步改 spy 注释 |
| `src/lib/i18n.tsx` | 删 `nav.compare` / `compare.eyebrow` 两个 key |
| `src/styles.css` | 新增 `.sub-block` / `.sub-block__head` / `.sub-block__title` / `.sub-block__lead`（30 行） |

**没动的**：`compare__*` 全部 40 条 CSS 规则、`COMPARE_LIMIT`、`SERIES_COLORS`、`CLASS_COLORS`、`galaxy.ts`。

### 16.2 计划里写错、实测纠正的

| 计划原话 | 实测 |
|---|---|
| 「compare 只有 373px」 | 只在 1440 档成立（372.9）；768 是 354.7、390 是 404.9 |
| 「0.41 屏消失」 | 实际只省 **133 / 115 / 114px**（页面高变化），省的是章节外壳，不是整个 compare |
| 「星系在上方 6828px」 | 6828px 是到 `#cosmos` 顶部；到**星系舞台**是 **6586px** |
| 合并后 `#stats` 高度 | 1440: 716（0.80 屏）；768: 844；390: 1084（1.28 屏） |

### 16.3 计划外的发现

**① 导航本来就在溢出**

`ul` 有 `overflow-x: auto`，768 和 390 档**改动前就溢出**（484/413、400/362）。

| 视口 | 改前 | 改后 |
|---|---|---|
| 1440 | 1085/1085 不溢出 | 1085/1085 不溢出 |
| 768 | 484/413 **溢出 71** | 433/413 **仍溢出 20** |
| 390 | 400/362 **溢出 38** | 362/362 **恰好不溢出** ✅ |

**768 档仍溢出 20px，本批按计划不修**（既有问题，混进来会说不清回归来源）。

**② 标题层级要改两层，不是一层**

计划只写了「`h2` → `h3`」。实施时发现内部三个 `compare__subtitle` 也是 `h3`——子块标题降成 `h3` 后，它们就与父标题同级了。**必须同时降为 `h4`**，否则「正确嵌套」是假的。

实测大纲（短名单非空）：

```
H2  section__title      这片宇宙的人口普查
H3  sub-block__title    把候选分子摆在一起看
H4  compare__subtitle   结构并排
H4  compare__subtitle   所选分子的性质雷达图展开
H4  compare__subtitle   性质对比
```

### 16.4 验证

```
npx tsc --noEmit              0 error
npx vitest run                168/168（17 files）
npm run build                 成功（css 44.89 → 45.24 kB，正好是新增 30 行的量）
scripts/verify.mjs            16/16
scripts/verify-glow.mjs       12/12
scripts/verify-stage.mjs      23/23
```

**三套脚本零改动、零失败**——与计划预期一致（它们测的是 hero / stage / 390 几何，与 compare 无关）。

额外手工验收 23 条（脚本覆盖不到的）：

| 检查 | 结果 |
|---|---|
| 导航 8 项、无「对比」 | ✅ 三档一致 |
| compare 是 `div.sub-block#compare` 且在 `#stats` 内 | ✅ |
| 标题 `h3`、无 `h2`、无 eyebrow | ✅ |
| `margin-top: 56px` | ✅ |
| 390 档导航不溢出 | ✅ 362/362 |
| `#compare` 锚点仍可用 | ✅ 滚到 top 0.5 |
| spy 在 compare 可见时高亮「普查」 | ✅ |
| 短名单 3 个分子时渲染完整（chips + table + radar） | ✅ |
| 合并后章节 < 2 屏（有内容） | ✅ 1588px = 1.76 屏 |

**证据**：`.oil-ui/visual-review/shots/38-b22-merge/`（12 张，三档 × 空/有内容）

### 16.5 没做的

- **768 档导航溢出 20px**：既有问题，按计划不修
- **compare 空态死路**（章节内可操作元素 = 0）：合并**没有**解决它。空态下依然只有一句「回到星系…」，而星系在 6586px 上方。要修得加「去星系」按钮，属新功能
- **`compare.clear` 死 key**：i18n 里有、组件里没用，属清理
- **改 stats / method 标题文案**：§15.2 的第 2 项 → **已在 §十七 完成**

### 16.6 下一个可以做的

§15.2 剩下的（**注意：§15.2 的清单已在 §十七 之后重排，以那张表为准**）：

1. ~~改 stats / method 两个标题~~ → ✅ §十七 已完成
2. 评审剩余的局部条目（分子面板 27.5% 内容不可见、首屏次按钮无反馈、时间轴 reveal 起点）
3. 768 档导航溢出 20px（§16.3 新发现的既有问题）
4. compare 空态死路（§16.5，要加「去星系」按钮，属新功能）

---

## 十七、章节标题改文案（2026-11-08）

**只改 4 个 i18n 字符串，不碰结构。**

### 17.1 先纠正一个说法

§15.2 和 §14.8 都写「9 个章节标题里 **8 个**是同一句式」。**实测是 7 个两段式 + 1 个三段式**：

| 章节 | 标题 | 结构 |
|---|---|---|
| pipeline | 一粒药要经过的**五道关卡** | 助词悬空（的） |
| funnel | 一万个候选，**一个赢家** | 逗号型 |
| stats | 这片星空，**宜居带很窄** | 逗号型 ← 本轮改 |
| lab | 换个权重，**整片星系重排** | 逗号型 |
| compare | 把候选分子**摆在一起看** | 介词悬空（把） |
| timeline | 三十年，**从数得清到算得动** | 逗号型 |
| method | 这些数字，**凭什么可信** | 逗号型 ← 本轮改 |
| limits | 这个工具**不能**告诉你什么 | 三段式 |

两段式本身是**有意的设计语言**（金色重音落在后半句），不该拆。真正的缺陷是另外两条：

1. **stats 与 method 都以「这片宇宙」开头** —— 字面重复
2. **stats 标题与自己的 eyebrow 说同一件事** —— eyebrow「宇宙普查」+ 标题「这片宇宙的人口普查」

### 17.2 改了什么

| | 改前 | 改后 |
|---|---|---|
| **stats** | 这片宇宙的**人口普查** | 这片星空，**宜居带很窄** |
| **method** | 这片宇宙是**怎么算出来的** | 这些数字，**凭什么可信** |
| stats (en) | A census of **this universe** | In this sky, **the habitable band is narrow** |
| method (en) | How this universe **is computed** | These numbers, **and why they hold up** |

**为什么是这两句**：

- 「宜居带很窄」是**事实**且用了项目术语（`goldilocks` = 宜居带），比「人口普查」信息量大；它同时解释了 stats 的 lead 为什么说「AI 要学着往亮的地方走」——**窄，所以才要学**
- 「凭什么可信」是**挑战姿态**，直接呼应 method 的 lead 第一句「页面上每一个数字都可以复核」
- 两处都避开了「这片宇宙」，也不再与各自 eyebrow 重复

### 17.3 实测

三档 × 中英文，共 12 组：

| 视口 | 中文 | 英文 |
|---|---|---|
| 1440 | 单行 | 单行 |
| 768 | 单行 | 单行 |
| 390 | 单行 | **2 行** |

**关键断言：金色后半句不能掉到第二行**（会读成两句，破坏「中性前半句 + 金色收尾」的设计）。12 组全部 `accentNewLine = false`。

英文 390 档是两行，断在「the habitable / band is narrow」，仍是同一个句子，可接受。

### 17.4 验证

```
npx tsc --noEmit              0 error
npx vitest run                168/168
npm run build                 成功（js 1220.92 → 1220.94 kB，只有字符串增量）
scripts/verify.mjs            16/16
scripts/verify-glow.mjs       12/12
scripts/verify-stage.mjs      23/23
```

**证据**：`.oil-ui/visual-review/shots/39-titles/`（12 张，三档 × 中英文 × 两章节）

### 17.5 没做的

- 其余 6 个两段式标题**保持不动** —— 结构是设计语言，不是缺陷
- 没有改任何 `title.pre` / `title.accent` 的**分句位置** —— 仍是「前段中性 + 后段金色」
