# QUICKSTART · 新会话从这里读起

> 目标：**30 秒内知道怎么跑起来，5 分钟内知道哪些坑不能踩。**
> 不含历史，不含决策过程。那些在 `HANDOFF.md`。
> 最后核对：2026-11-07，HEAD `6abf97b`，工作区干净

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

## 五、改代码前必知的三条约定

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
| **本文件** | 第一次进项目 |
| `docs/HANDOFF.md` | 想知道每批做了什么、踩过什么 |
| `docs/sds-motion-and-hero.md` | 要改首屏或动效，先看设计规格 |
| `docs/ui-effects-source.md` | 要用用户给的 uiverse 效果，**原文逐字在这里** |
| `docs/plan-batch4-themes.md` | ⚠️ **已作废**，背景色不改。仅作坑位记录 |
| `docs/plan-batch3-restructure.md` | 批次 3 的决策依据 |

---

## 九、如果验收红了

1. **先看是不是环境问题**：没设 `TEMP`？没加 `--host 0.0.0.0`？
2. **再确认端口没被占**：`netstat -ano | grep LISTENING | grep :4415`
3. **脚本自己起浏览器**，用完要杀干净，否则下次端口冲突
4. **别急着改代码**——先确认是代码错了还是测量方法错了。
   本项目有两次「以为是 bug，其实是测量方法错」的记录（见 HANDOFF §九之二）
