# 交接说明 · MolCosmos 改版

> **新会话从这里读起。**
> 最后更新：2026-11-05 15:44
> 当前状态：**SDS v1.2 · 批次 1 / 1.5 / 1.6 / 1.7 / 2 / 3 已实施 · 光晕修复已实施 · 下一步是批次 4**

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
🟡 阶段 8  实施                     批次 1-2 完成，批次 3-4 未开始
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

| 批次 | 内容 | 依赖 |
|---|---|---|
| **3** | 后半段重构图：五关卡横向长舞台、光谱带、时间轴轴、方法说明去卡片 | 批次 2 |
| **4** | 双主题（深空 + 米白 `#ece7dc`/朱砂 `#c2410c`）+ 旧 id 重定向 | 批次 1-3 |

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

```bash
cd "/d/ai项目（自用）/molcosmos"

# ⚠️ 必须设置 TEMP，否则 esbuild 会因临时目录权限随机失败（环境问题，非代码问题）
export TEMP="$(pwd)/.tmp-build" TMP="$(pwd)/.tmp-build"
mkdir -p .tmp-build

npx tsc --noEmit                       # 类型检查
npx vitest run                         # 121 tests / 13 files
npm run build                          # 含 tsc，是唯一构建门禁

# 验收脚本
npx vite preview --port 4416 --strictPort --host 0.0.0.0
node scripts/verify.mjs --url http://localhost:4416/
```

**`--host 0.0.0.0` 必须加**：不加时 `vite preview` 只监听 IPv6 的 `localhost`，`127.0.0.1` 连不上。

### 验收基线（当前应全过）

```
tsc        0 error
vitest     121/121 pass
build      成功
verify.mjs 16/16 PASS
```

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

## 九、下一步（批次 4：双主题）

按 SDS §5 批次 4。

**内容**
- `theme.ts` 5→2 + `colorScheme` 动态
- `themes/paper.ts` 新建（暖纸米白 `#ece7dc` + 朱砂 `#c2410c`）
- `urlState.ts` 旧 id 映射 + 新测试
- `i18n.tsx` 删 3 条 `theme.*`、加 1 条 `theme.paper`
- `TopnavTools.tsx` 两处 `t(labelKey)` 修类型
- `styles.css` 10 处 literal 变量化 + 新增 4 个变量
- `index.html` theme-color 交给 JS
- `README.md` 三处同步

**验收**
```bash
npx tsc --noEmit && npx vitest run && npm run build
node scripts/verify.mjs        # 16/16
node scripts/verify-glow.mjs   # 12/12
node scripts/verify-stage.mjs  # 15/15
```

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
| `C:\Users\lenovo\AppData\Local\Temp\synteny-pro\docs\specs\METHODOLOGY-plan-and-sds-review.md` | 方法论 |
| `D:\tmp\molcosmos-motion-demo\v7.html` | 长舞台已验收实现 |
| `git show --stat abfa669` | 高亮逻辑修复的证据 |
