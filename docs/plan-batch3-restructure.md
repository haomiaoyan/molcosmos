# 计划：批次 3 —— 后半段重构图

> 状态：**待审核**（未实施）
> 日期：2026-11-05
> 依据：`docs/sds-motion-and-hero.md` §4.8–4.10 + §5 批次 3
> 前置：批次 2（gsap 系统）已完成，`lib/gsap.ts` 单点注册可用

---

## 一、这一批要解决什么

首屏之后的六章，目前**共用同一种构图**：一个标题 + 一段说明 + 一列/一组等宽卡片。
这是用户最初提的问题里**最根本的一条**（原话："砍到双主题"之外，他说"减少重复卡片"）。

批次 3 把三处换成**结构不同**的表达：

| 章节 | 现在 | 改成 | 解决的问题 |
|---|---|---|---|
| 五关卡 `#pipeline` | 竖排 5 张卡 | **横向长舞台**（pin + 横向位移） | 首屏之后第一屏就换构图，给读者"这一章不一样"的信号 |
| 宇宙普查 `#stats` | 4 张等宽卡 | **按真实比例分段的光谱带** | 4 张等宽卡在说谎：实际比例是 8.8% / 61.8% / 29% / 0.33% |
| 时间轴 `#timeline` | 每节点自带竖线 | **单轴生长** | 5 条断开的短竖线视觉上不构成"轴" |
| 方法 `#method` | 4 张卡 | **去掉卡片**，改为编号行 | 又一组等宽卡 |

> **光谱带是这一批里信息价值最高的**：现在的 4 张等宽卡把 0.33%（2 个分子）展示得和 61.8%（371 个）一样大。这不是审美问题，是**图在误导读者**。

---

## 二、实施前必须先解决的三个缺口（SDS 没有写）

我读完 SDS 后发现三处它假设成立、但代码里不成立的地方。**不先解决，实施时会卡住。**

### 缺口 1：`CosmosStats` 现在没有数据

`src/components/Sections.tsx:105` 的 `CosmosStats()` **不接收任何 props**，内部也没有计数——
它只渲染 4 张卡的标题和文案，`ClassCard` 里没有任何数字。

而 SDS §4.9 要求 `<SpectrumStrip molecules={catalogue} />` 按真实比例分段。

**代价**：`App.tsx` 需要把 `catalogue` 传下去（`<CosmosStats molecules={catalogue} />`），
`CosmosStats` 改签名。**这属于 SDS 遗漏，不是实现自由。**

### 缺口 2：光谱带的图例数字，i18n 里没有

`galaxy.ts` 有 `CLASS_LABEL_KEYS`，但现有 i18n 的 `stats.*` 只有 `title/lead/body`，
**没有"宜居带分子 53"这种"标签 + 数字"的结构**。

**方案**：数字由代码算（`statsFor()`），标签复用 `CLASS_LABEL_KEYS`。
不新增 i18n key —— 数字不该进翻译文件。

### 缺口 3：`.pipeline` 的现有 CSS 会不会冲突

`styles.css` 里有 `.station` / `.station__glow` / `.station__head` 等规则，
被 `StationStage` 复用还是孤立？**没读过这些规则，我不能说"直接复用"。**

> 这一条我在写计划时**未完成核实**。正确做法是实施前先 `grep -A6 "^\.station"` 看清楚。
> 我在下面把它列为**实施第 0 步**，不假装已经知道答案。

### 缺口 3 的核实结果（2026-11-05，已查）

`.station` **已经是一个完整卡片**，`styles.css:1283-1334`：

```
border: 1px solid var(--line)     border-radius: var(--radius)
background: var(--panel)          backdrop-filter: blur(10px)
padding: 44px 20px 20px           overflow: hidden
:hover → translateY(-4px)
子元素：.station__glow / .station__head / .station__step / .station__ai-tag
        .station__title / .station__body
```

**结论：`StationStage.tsx` 直接复用 `.station` 作为卡片类名，不新建 `.station-card`。**
SDS 写的 `.station-card` 只是示意；照抄会重复约 50 行已有的卡片样式。

只需**新增**舞台层：`.stage-pin` / `.stage-window` / `.station-track` / `.stage-counter` /
`.stage-progress`，以及 `.station` 在轨道里的尺寸覆盖（`flex: 0 0 380px`）。

**同时确认可以安全替换的死代码**（每处仅单一引用点）：

| 类名 | CSS 规则数 | 引用点 | 处理 |
|---|---|---|---|
| `.stats-strip` | 1 | `Sections.tsx` | 删除 |
| `.class-card` | 6 | `Sections.tsx` | 删除（连同 `ClassCard` 组件） |
| `.method-grid` | 1 | `Sections2.tsx` | 删除 |
| `.method-card` | 3 | `Sections2.tsx` | 删除 |
| `.timeline__rail` | 3 | `TimelineSection.tsx` | 删除 |
| `.timeline__dot` | 3 | `TimelineSection.tsx` | 删除 |

> 删死代码是这一批的义务：留着会误导下个会话以为还在用。

---

## 三、四个交付物

### D1 `useStageTravel.ts`（新，**先写测试**）

纯函数，无 DOM。SDS 给了 8 条用例，我照抄为断言：

```ts
stageTravel(g)   // travel = max(0, trackWidth - windowWidth)
stageSpan(g, vh) // span = max(travel * 3.5, vh * 1.5)
stageFrame(g, p) // x = -travel * p; activeIndex = clamp(floor(p*count)); fillPercent = p*100
```

**关键数字（已实测，不要重算）**：

| 视口 | windowWidth | trackWidth | travel |
|---|---|---|---|
| 1440 / 1920 / 2560 | **1132** | 2172 | **1040** |

> `windowWidth = 1132`，因为 `.app` 是 `max-width:1180; padding:0 24px`。
> 公式**不要减 pad**：`trackWidth` 取自 `scrollWidth`，已含 padding。

### D2 `StationStage.tsx`（新）

替换 `PipelineSection` 里的 `<ol className="pipeline">`，**`.section__head` 保持不动**。

```
stage-pin      100vh，全宽背景（calc(100vw - var(--sbw))）
  stage-window width:min(1180px,100%)  → 实际 1132
    station-track  flex, gap 56px
      station-card   flex:0 0 380px × 5
  stage-counter  01 / 05
  stage-progress
```

ScrollTrigger：`start:'top 64px'`（**不是 `top top`**，否则被 fixed nav 压住 59px）、
`pin:true`、`scrub:0.6`、`end: () => '+=' + span`、`invalidateOnRefresh:true`。

**手机（<768px）**：不创建 ScrollTrigger，卡片竖排，计数与进度条 `display:none`。

### D3 `SpectrumStrip.tsx`（新）

`segmentWidths()` 是最容易写错的地方。SDS 已经指出坑并且给了正确实现：

```
只写 max(0.33%, w) 会让四段之和 > 100%
正确：先抬最小值 → 再整体归一化回 100
计数为 0 的段恒为 0（不抬，否则出现"有颜色的空段"）
```

6 条单测（含 `[53,371,174,1]` 这个会溢出的用例）。

**交互契约**：滑块 → `rescoreUniverse` → `catalogue` → `SpectrumStrip` 重算。
**禁止硬编码 53/371/174/2。**

### D4 `TimelineAxis.tsx`（新）+ `MethodSection` 去卡片

- 时间轴：5 节点单轴，`scaleY` 0→1 随滚动生长（`scrub`），节点淡入 + 左移 12px
- 方法：`.method-grid` 的 4 张卡 → 编号行（`.method-row`），**文案一字不改**

---

## 四、验收

### 自动（脚本）

| # | 断言 | 阈值 |
|---|---|---|
| T1 | `stageTravel` @1440/1920/2560 差值 | ≤ 1px（都是 1040） |
| T2 | `stageFrame(1)` | x = −1040, activeIndex = 4, fill 100 |
| T3 | `segmentWidths([53,371,174,2])` | `[8.833, 61.833, 29.000, 0.333]`，sum 100 |
| T4 | `segmentWidths([53,371,174,1])` | sum 仍 = 100（不溢出） |
| T5 | 计数为 0 → 宽度 0 | 恒成立 |
| T6 | 390 宽 `pin` 数量 | **0** |
| T7 | 390 宽 `scrollWidth` | = 390 |
| T8 | reduced-motion 下 `ScrollTrigger.getAll().length` | **0** |
| T9 | 现有 `verify.mjs` | 16/16 |
| T10 | 现有 `verify-glow.mjs` | 12/12 |

### 人工（必须在真实浏览器里看）

- 滚动经过五关卡：卡片横向走过，计数 01→05 跟随
- 拖动沙盒滑块：光谱带分段**跟着变**（这是全批最重要的一条）
- 390 宽：五关卡竖排，无横向滚动条
- reduced-motion：全部静态列出，信息不少

---

## 五、执行顺序

```
第 0 步  核实 .station / .pipeline 现有 CSS（决定复用还是新建）
第 1 步  useStageTravel.test.ts     → 红
第 2 步  useStageTravel.ts          → 绿
第 3 步  spectrum.test.ts           → 红
第 4 步  segmentWidths()            → 绿
第 5 步  StationStage + CSS         → 浏览器实测 T6/T7
第 6 步  SpectrumStrip + 接 catalogue（补缺口 1）→ 拖动实测
第 7 步  TimelineAxis + MethodSection 去卡片
第 8 步  全量验收 + 更新 HANDOFF + 提交 + tag v2.0-p3
```

---

## 六、我不确定 / 需要你决定的事

❓ **Q1 — 五关卡长舞台的代价，你接受吗**

`pin:true` 意味着滚动到这一章时，**页面会被"钉住"约 1040px 的行程**（约 1.15 屏高），
在这段时间里页面不再下移，只有卡片横走。

- 好处：视觉上很有电影感，也是 v7 演示里你验收过的效果
- 代价：**读者会觉得"滚了没反应"**，行程越长越明显

➡️ 我建议**照 SDS 做**（1040px，你已在 v7 里验收过）。但如果你想更短，改成
`travel * 2.5` 会让行程降到约 740px。**这条只有你能决定**，因为它是体感。

❓ **Q2 — 光谱带替换 4 张卡后，卡片里的文案去哪**

现在每张卡有一句说明（`stats.{cls}.body`）。光谱带只有色块 + 图例（标签 + 数字）。

- **a)** 图例下方保留 4 段短文案（推荐，信息不丢）
- **b)** 文案删掉，只留比例（更干净，但丢信息）
- **c)** 文案挪到 tooltip / hover（要在批次 3 里额外做交互）

➡️ 我选 **a**。你的硬约束是"reduced-motion 下信息一条不少"，b 会和它冲突。

❓ **Q3 — 方法段去卡片，要什么形态**

- **a)** 编号行 `01 / 标题 / 说明`，左对齐，用分隔线
- **b)** 两栏（标题左、说明右），像术语表

➡️ 我选 **a**，和光谱带、长舞台的"横向阅读"节奏一致。

---

## 七、风险

| 风险 | 可能性 | 影响 | 缓解 |
|---|---|---|---|
| pin 与 fixed nav 冲突 | **已实测会发生** | nav 压住舞台顶部 59px | `start:'top 64px'` + T6 断言 |
| 全宽背景溢出 | **已实测会发生** | 横向滚动条 | `calc(100vw - var(--sbw))`，不用裸 `100vw` |
| `segmentWidths` 总和溢出 | 中 | 条带错位 | 归一化 + T4 用例 |
| 390 下 pin 未禁用 | 中 | 手机横向滚动 | T6 断言 |
| 光谱带的交互断开 | 中 | 滑块不动条带 | 第 6 步必须人工拖一次 |
| 本章改动导致首屏回归 | 低 | — | T9/T10 回归 |

---

## 八、这一批不做的事

- 不做双主题（批次 4）
- 不引入新依赖
- 不动 `galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts`
- 不动 `Sections2.tsx` 的 probe-line 高亮
- 不做 `SplitText` 标题拆字（SDS §4.7 有，但不属于本节重构范围，留批次 4 或单开）
