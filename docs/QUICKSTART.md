# QUICKSTART · 新会话从这里读起

> 目标：**30 秒内知道怎么跑起来，5 分钟内知道哪些坑不能踩。**
> 不含历史，不含决策过程。那些在 `HANDOFF.md`。
> 最后核对：2026-11-07，HEAD `655539`，工作区干净

---

## 🛑 动手之前先读这一段

**这个项目的代码改动必须走「计划 → 审核 → 确认 → 实施」四步。没有例外。**

```
1. 出计划      ← 需求不明确时，先用 grilling 把不懂的问清楚，不许猜着写
2. 用户审核    ← 用户逐条看，可能否决、可能改
3. 用户确认    ← 必须听到「确认 / 可以 / 就按这个」才往下走
4. 才能改代码
```

**默认是不确认。** 用户没回、或回得含糊（「看着办」「你决定」），
就停在那里等——**不要自己往下推**。

违反这条的后果比写错代码更严重：用户失去对仓库的控制权。
完整规则见 **§五 5.0**。

---

## 一、项目是什么

MolCosmos：一个 AI 制药主题的单页站。600 个分子排成星系（Three.js），
下面是六个章节。纯 CSS，无 UI 框架。

```
React 18 + TypeScript 5.6 + Vite 6
Three.js 0.169 + @react-three/fiber（星系、分子 3D）
GSAP 3.15.1（ScrollTrigger / ScrollToPlugin / SplitText）
Vitest（168 条单测）
```

---

## 二、怎么跑起来

### 2.1 位置

```
D:\ai项目（自用）\molcosmos
```

### 2.2 ⚠️ 第一步：必须先设 TEMP

```bash
export TEMP="$(pwd)/.tmp-build" TMP="$(pwd)/.tmp-build"
mkdir -p .tmp-build
```

**不设会随机失败**，报 `[vite:esbuild-transpile] remove ...: Access is denied`。
这是本机临时目录权限问题，**不是代码问题**，干净基线上同样复现。
Linux CI 不受影响。

### 2.3 三条命令

```bash
npx tsc --noEmit      # 类型检查，必须 0 error
npx vitest run        # 168 tests / 17 files
npm run build         # 含 tsc，唯一能拦住类型错误的门禁
```

### 2.4 看效果

```bash
npm run dev                              # 开发服务器，改代码热更新
# 或
npx vite preview --port 4415 --strictPort --host 0.0.0.0
```

**`--host 0.0.0.0` 必须加**：不加时 `vite preview` 只监听 IPv6 的 `localhost`，
`127.0.0.1` 连不上，curl 会超时。

### 2.5 验收脚本（三套，都要跑）

```bash
# 需要先有一个 preview 在跑
node scripts/verify.mjs       --url http://127.0.0.1:4415/   # 16 条
node scripts/verify-glow.mjs  --url http://127.0.0.1:4415/   # 12 条
node scripts/verify-stage.mjs --url http://127.0.0.1:4415/   # 23 条
```

**只跑 `verify.mjs` 会漏掉后两批的回归。** 三套各管一块：

| 脚本 | 管什么 |
|---|---|
| `verify.mjs` | 首屏几何、全宽舞台铺满、无横向溢出 |
| `verify-glow.mjs` | 光标光晕的尺寸与死区 |
| `verify-stage.mjs` | 长舞台、光谱带、时间轴、GitHub 按钮、渐变环 |

脚本直连 **CDP（Chrome DevTools Protocol）**，不需要 puppeteer。
Chrome/Edge 找不到时设 `CHROME_PATH`。

### 2.6 验收基线（当前应全过）

```
tsc              0 error
vitest           168/168
build            成功
verify.mjs       16/16
verify-glow.mjs  12/12
verify-stage.mjs 23/23
```

---

## 三、坑（按踩到概率排序）

### 🔴 1. `vitest` 全绿 ≠ 能构建

**esbuild 剥类型，`vitest` 看不见类型错误。** 改主题、改接口、删导出之后
`vitest` 可能 168/168 全过，而 `npm run build` 报 14 个错。

**验收永远以 `npm run build` 为准。**

### 🔴 2. `scrollWidth` 不含尾部 padding

元素溢出时 Chrome 只计**前导** padding。实测：

```
卡片 5×380 + gap 4×56 + padding 48 = 2172   ← 真实宽度
track.scrollWidth                  = 2148   ← 少 24px
```

**长舞台的宽度必须自己合成**：`Σ card.offsetWidth + gap×(n−1) + paddingLeft + paddingRight`。
用 `scrollWidth` 会让最后一张卡差 24px 到不了位。
（`StationStage.tsx` 的 `measure()` 已按此实现，别改成 `scrollWidth`。）

### 🔴 3. 裸 `100vw` 会溢出 8px

`100vw` 含滚动条宽度。全宽层一律：

```css
width: calc(100vw - var(--sbw));
left: 50%;
transform: translateX(-50%);
```

`--sbw` 由 `lib/scrollbar.ts` 的 `ResizeObserver` 写入。
**不能用 `resize` 监听，也不能用 `useLayoutEffect`**：滚动条出现时不触发 `resize`。

### 🔴 4. `pin` 起点必须让出导航高度

```js
start: 'top 64px'   // 不是 'top top'
```

导航固定高 56px + 3px top。`'top top'` 会让导航压住舞台顶部 **59px**。

### 🟠 5. CDP 的 `setTouchEmulationEnabled` 开了关不掉

同一会话里开了触摸模拟再关，`(hover: hover)` **不会恢复**，后续所有视口
都被当成触屏。后果是**假通过**：隐藏元素尺寸为 0，`0 <= 阈值` 恒成立。

`verify-glow.mjs` 的触摸断言单独起一个浏览器进程，**别改回同一会话**。

### 🟠 6. React 受控 `<input>` 不能直接赋 `.value`

```js
input.value = '100'                    // ❌ onChange 不触发
Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'100')
input.dispatchEvent(new Event('input',{bubbles:true}))   // ✅
```

直接用 `.value` 测滑块会误判"交互断了"。

### 🟠 7. CSS 优先级陷阱

`.topnav a` 是 `(0,1,1)`，`.topnav__github` 只有 `(0,1,0)`——**前者会压过后者的
`display` 和 `padding`**，曾让 GitHub 图标偏右 7.5px。

给导航里的按钮写样式用 `.topnav .topnav__xxx`，不要用裸类名。

### 🟠 8. `mix-blend-mode: screen` 在浅色背景上等于不可见

光晕靠 `screen` 只加光。**若将来做浅色主题**，必须换 `multiply` 或降低透明度。
（米白主题已作废，但这条留着。）

### 🟡 9. `end: 'max'` 缓存文档高度

`ScrollTrigger.create({end:'max'})` 在**创建时**取文档高度并缓存。字体加载后
页面会长，进度条系统性偏高 ~3.5%。

已用 `lib/gsap.ts` 的 `refreshTriggersWhenSettled()`（`fonts.ready` + `load`
各 `refresh()` 一次）解决。新建的 pin 若挂在动态高度容器里，同样要 refresh。

### 🟡 10. 渐变环：三种写法两种渲染错

| 写法 | 结果 |
|---|---|
| `mask-composite: exclude` | **整张卡纯黑**（实测 380×227 的 `#05060f`） |
| `background-clip: padding-box` | **实心色块**，文字被盖 |
| `border-image` | 能用，但**按规范忽略 `border-radius`**，变直角 |
| **两层伪元素叠加** | ✅ 现用方案 |

`styles.css` 的 `.station::before/::after` 有完整注释，改之前先读。

---

## 四、不能动的东西

| 文件 / 位置 | 原因 |
|---|---|
| `lib/galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts` | 数据正确性核心，107 条测试保护 |
| `CLASS_COLORS` 的色值 | 那是**数据编码色**，不是主题色 |
| `Sections2.tsx` 的 probe-line 高亮（`const probe = ...` 那段循环） | 修过"短章节提前让出高亮"的 bug，删了会复现 |
| 每批结束的 `npm run build` | CI 会拒 |

---

## 五、改代码前的约定（第一条最重要）

### 5.0 改动流程：先计划，后审核，再实施

**这是本项目的第一约定，优先于其它所有约定。**

#### 四步

```
① 出计划  →  ② 用户审核  →  ③ 用户确认  →  ④ 实施
```

**没有第 ③ 步的明确确认，不许动代码。** 包括「顺手改一下」「反正很小」。

#### 什么算「非平凡改动」（需要走完整流程）

满足**任意一条**即算：

- 涉及 **2 个及以上文件**
- 新增组件、新增文件、新增依赖
- 改动布局、动效、交互逻辑
- 改数据结构、改接口签名、改导出
- 修 bug（**修 bug 也要走流程**——根因可能和你以为的不一样）

**不算**（一句话说明即可，不用走流程）：

- 改注释、改文档、改错别字
- 改文案（i18n 里的字符串）
- 调一个**已经确认过的**数值（比如把 `blur(2px)` 调成 `blur(1px)`）
- 格式化、lint 自动修复

> 判定口径：**改 1 个文件，且不改变运行时行为** → 不用走流程。
> 其余全部走。

#### 计划写成什么

| 改动规模 | 形态 |
|---|---|
| **大**（多文件 / 新组件 / 重构 / 跨章节） | 写成 `docs/plan-*.md` 文件，提交入库 |
| **小**（单文件、逻辑简单） | 聊天里给方案，用户点头即可 |

> 文件的价值在于「能被后来者读到」。一次性小修写文件反而是噪音。

#### 需求不明确时：先用 grilling 问清楚

**只要发现自己需要「猜」任何一件事，就必须问，不许带着猜测往下写。**

用 `/grill-me`（底层 skill 是 `grilling`）向用户提问。它要求：

- 把待定的决策画成**设计树**，每轮只问「前置条件已确定」的那些
- 每个问题给出**我的推荐答案**，让用户能直接说「yes」
- 用户回答后重算边界，再问下一轮
- **事实由我自己查**（读文件、跑命令、派子 agent），不拿能查到的事去问用户
- 边界清空之前，不动手

**什么时候用**：需求有分叉、有多种实现路径、或我意识到自己在假设。
**什么时候不用**：需求已经明确到没有分叉——硬问是浪费用户时间。

> 两者的边界：**「我觉得清楚了」不算理由**。
> 判据是「这条路径上还有没有我未经验证的假设」。有，就问。

#### 什么算「用户确认了」

| 回复 | 算确认吗 |
|---|---|
| 「确认」「可以」「就按这个」「通过」 | ✅ |
| 用户自己动手改了计划文件 | ✅ |
| 「嗯」「好」「行」 | ⚠️ 视为含糊，再确认一次 |
| 「看着办」「你决定」 | ❌ 不确认，停下 |
| 没有回复 | ❌ 不确认，停下 |

#### 计划被否决怎么办

**改计划，重新提交。不要「先做一部分看看」。**
如果用户否决的是方案 A 而你确信 A 更好，可以说明理由，但**最终由用户决定**。

#### 实施之后

改完要**自己先验收**，再报告。见 **§二 2.3–2.6**。
验收红了，**先判断是代码错还是测量方法错**，别急着改（见 §九）。

---

### 5.1 动效可以停，信息不能少

**`prefers-reduced-motion` 下**：所有位移、缩放、模糊、过渡都要去掉，
但**文字、数字、结构一个不能少**。

新增动效时同步写这条降级，否则不合并。

### 5.2 gsap 只从 `lib/gsap.ts` 导入

```ts
import { gsap, ScrollTrigger } from '../lib/gsap'   // ✅
import { gsap } from 'gsap'                          // ❌
```

`registerPlugin` 只能调一次。重复注册会让 ScrollTrigger 的 refresh 顺序不可预测。

### 5.3 用 `transform` / `opacity`，不用改尺寸

改 `height` / `width` / `top` 会触发**重排**，滚动时掉帧。
轴用 `scaleY`、光晕用 `translate3d`、入场用 `opacity` + `translate3d`。

---

## 六、关键数字（实测，不要重新估）

| 项 | 值 |
|---|---|
| `.app` 最大宽 | `1180px`（含 `padding: 0 24px`）→ 内容区 **1132px** |
| 长舞台 travel | **1040px**（1440/1920/2560 三档一致） |
| 长舞台 span | `max(travel × 3.5, vh × 1.5)` |
| 五关卡卡片宽 | **380px**（用户明确否决放大） |
| 导航高 | **56px**（窄屏 85px） |
| 光晕尺寸 | `min(52vmin, 620px)`，居中偏移 `min(26vmin, 310px)` |
| 光谱带最小段 | `0.33%`（抬升后必须归一化回 100） |
| 时间轴触发器 | `start: 'top 78%'`, `end: 'bottom 62%'`, `scrub: 0.5` |

---

## 七、目录速查

```
src/
├─ App.tsx                  装配所有章节、滚动、快捷键
├─ lib/
│  ├─ galaxy.ts             600 分子生成与分类（勿动）
│  ├─ molecule.ts           分子数据结构（勿动）
│  ├─ weights.ts            沙盒权重（勿动）
│  ├─ search.ts             筛选逻辑（勿动）
│  ├─ gsap.ts               ⭐ 唯一注册插件的地方
│  ├─ useStageTravel.ts     ⭐ 长舞台纯函数（travel/span/frame）+ 12 测试
│  ├─ useReveal.ts          章节入场 hook + 纯函数
│  ├─ pointer.ts            ⭐ 鼠标跟随（双坐标系，19 测试）
│  ├─ scrollbar.ts          --sbw 的 ResizeObserver
│  ├─ motion.ts             prefers-reduced-motion 的唯一答案
│  ├─ theme.ts              5 套配色
│  └─ i18n.tsx              中英双语
├─ components/
│  ├─ StationStage.tsx      ⭐ 五关卡横向长舞台（pin + 横向位移）
│  ├─ SpectrumStrip.tsx     ⭐ 光谱带（按真实比例分段）
│  ├─ TimelineAxis.tsx      ⭐ 时间轴单轴（scrub + smoothstep）
│  ├─ HeroStage.tsx         首屏全宽装饰层
│  ├─ Sections.tsx          流水线 / 漏斗 / 普查
│  └─ Sections2.tsx         方法 / 边界 / 页脚 / 导航（含 probe-line，勿动）
└─ styles.css               单文件，约 3400 行

scripts/
├─ verify.mjs               16 条：首屏几何、舞台铺满
├─ verify-glow.mjs          12 条：光晕尺寸与死区
└─ verify-stage.mjs         23 条：批次 3 + 按钮 + 渐变环
```

---

## 八、文档地图

| 文档 | 什么时候读 |
|---|---|
| **本文件** | 第一次进项目。**§5.0 是改动流程，必须读** |
| `docs/HANDOFF.md` | 想知道每批做了什么、踩过什么 |
| `docs/sds-motion-and-hero.md` | 要改首屏或动效，先看设计规格 |
| `docs/ui-effects-source.md` | 要用用户给的 uiverse 效果，**原文逐字在这里** |
| `docs/plan-batch4-themes.md` | ⚠️ **已作废**，背景色不改。仅作坑位记录 |
| `docs/plan-batch3-restructure.md` | 批次 3 的决策依据 |

> 本文件里凡是 `docs/plan-*.md` 的命名约定：**计划的文件名即 `plan-<主题>.md`**，
> 作废的在文件头第一行标注「已作废」，不要删——它记录的坑还有用。

---

## 九、如果验收红了

1. **先看是不是环境问题**：没设 `TEMP`？没加 `--host 0.0.0.0`？
2. **再确认端口没被占**：`netstat -ano | grep LISTENING | grep :4415`
3. **脚本自己起浏览器**，用完要杀干净，否则下次端口冲突
4. **别急着改代码**——先确认是代码错了还是测量方法错了。
   本项目有两次「以为是 bug，其实是测量方法错」的记录（见 HANDOFF §九之二）
