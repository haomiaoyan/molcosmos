# 计划 · 修 768 档导航溢出

> 状态：**待用户审核**。未收到「确认」不动代码（QUICKSTART §5.0）。
> 写于 2026-11-08，HEAD `15a4408`，tag `v2.0-p8`，工作区干净。

---

## 0. 一句话

导航在 **641–799px** 区间横向溢出（768 只是其中一段，最窄的 641 处溢出 **147px**）。
按「该区间有没有 pin」分两段处理：641–767 换两行，768–799 单行挤压。

---

## 1. 实测：问题比「768 差 20px」大得多

### 1.1 溢出全貌

| 宽度 | 溢出 | 导航高 | 布局 |
|---|---|---|---|
| 390 | 0 | 85.3 | 两行 |
| 640 | 0 | 85.3 | 两行 |
| **641** | **147** | 56.1 | 单行 ← 断崖 |
| 660 | 128 | 56.1 | 单行 |
| 680 | 108 | 56.1 | 单行 |
| 700 | 88 | 56.1 | 单行 |
| 720 | 68 | 56.1 | 单行 |
| 740 | 48 | 56.1 | 单行 |
| **767** | **21** | 56.1 | 单行 |
| **768** | **20** | 56.1 | 单行 |
| 780 | 8 | 56.1 | 单行 |
| 799 | 0 | 56.1 | 单行 |
| 800+ | 0 | 56.1 | 单行 |

**两个结论**：

1. **溢出区间是 641–799px**，不是只有 768。只修 768 会把问题推到 641–767（那里更严重）。
2. **641 处是断崖**：640 及以下走两行布局（`max-width: 640px` 块），641 起退回单行，而单行要 799px 才装得下。

### 1.2 缺口在哪

768 档的构成（实测）：

```
nav 内宽          697px   （753 − 28 − 28 padding）
brand              88.2
tools             195.6   （palette 88.3 + lang 63.4 + github 32）
ul 可用           413.2
ul 实际需要       433.0   ← 差 20
```

8 个链接宽度：`47.2, 60.8, 47.2, 47.2, 47.2, 60.8, 47.2, 47.2`（4px gap，`padding: 6px 10px`，13.6px 字号）。

### 1.3 一个约束：768 以上有 pin

```
StationStage.tsx:41   STAGE_BREAKPOINT_PX = 768
StationStage.tsx:32   STAGE_TOP_PX = 64
styles.css:1562       .stage-pin { height: calc(100vh - 64px) }
```

**`min-width: 768px` 才建 pin，起点 `top 64px`。导航高 56.1 + top 3 = 59.1，余量 4.9px。**

所以 768 及以上**不能把导航变高**——会压进 pin 区域。

而 641–767 **没有 pin**（`matchMedia` 要求 `min-width: 768px`），导航变高无害。

---

## 2. 改法：分两段

### 2.1 641–767px → 换成两行（与 ≤640 一致）

```css
/* Between a phone and a tablet the bar has three things to hold — brand, eight
   links, three tools — and only ~630px to do it in. The ≤640 block already
   solves this by wrapping the links onto their own row; 641–767 has the same
   problem and was simply never included. Nothing pins at these widths
   (StationStage needs min-width: 768), so the taller bar costs nothing. */
@media (max-width: 767px) {
  .topnav {
    flex-wrap: wrap;
    row-gap: 6px;
  }

  .topnav ul {
    order: 3;
    flex-basis: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .topnav ul::-webkit-scrollbar {
    display: none;
  }
}
```

导航高从 56.1 → **94.1**（实测），该区间无 pin。

### 2.2 768–799px → 单行挤压

```css
/* 768 is where the stage starts pinning, so the bar has to stay 56px there.
   It misses by 20px; the gap comes off the horizontal padding and the link
   padding rather than the type size, which keeps the labels readable. */
@media (min-width: 768px) and (max-width: 799px) {
  .topnav {
    padding-left: 16px;
    padding-right: 16px;
  }

  .topnav a {
    padding: 6px 8px;
  }
}
```

**为什么不用别的改法**（都实测过）：

| 改法 | 768 结果 | 700 结果 | 评价 |
|---|---|---|---|
| 只缩链接 padding（10→8） | 0 ✅ | 56 ❌ | 不够 |
| 只缩 nav padding（28→16） | 0 ✅ | 64 ❌ | 不够 |
| 两者相加 | 0 ✅ | 32 ❌ | 仍不够 |
| 隐藏配色名 | 0 ✅ | 55 ❌ | 不够 |
| **两段式（本方案）** | **0 ✅** | **0 ✅** | ✅ |

单独任何一种都修不好 641–767，所以必须分两段。

---

## 3. 验收（实测过，但要在真实改动后复测）

### 3.1 断点表（17 档，组合方案注入后实测）

| 宽度 | 溢出 | 导航高 | 换行 |
|---|---|---|---|
| 390 / 640 | 0 | 85.3 | wrap |
| 641 / 660 / 680 / 700 / 720 / 740 / 767 | **0** | 94.1 | wrap |
| 768 / 780 / 799 | **0** | **56.1** | nowrap |
| 800 / 900 / 1000 / 1024 / 1440 | 0 | 56.1–57.5 | nowrap |

全部 `pageOverflowX = 0`（无横向滚动）。

### 3.2 必须复核的既有断言

| 断言 | 风险 |
|---|---|
| `verify-stage.mjs` T6a（390 不 pin） | 390 不变，**预期不受影响** |
| `verify-stage.mjs` T7（390 无横向溢出） | 同上 |
| `verify.mjs` 9a/9b/9c（三档 stage 几何） | 390 不变；768 导航 padding 变，**要复核 stage 是否仍铺满** |
| `verify-stage.mjs` T1c（window 1132） | 1440 不变，**不受影响** |

**新增要测的**：768 档导航高必须仍是 56px（不能压进 pin 的 64px 线）。

### 3.3 手工验收

- 641 / 700 / 767：导航两行，链接不换行成单字
- 768 / 780：导航单行，8 项全可见，高度 56
- 768 档滚到流水线，确认 pin 起点没被导航压住（`navBottom ≤ 64`）
- 锚点跳转（点导航项）后标题不被导航遮住
- 中英文都测（英文标签更长）

---

## 4. 不做的事

| 项 | 理由 |
|---|---|
| 不改链接字号 | 13.6px 已偏小，再缩可读性受损 |
| 不隐藏配色名（`palette__name`） | 那是当前主题的唯一文字标识，640 以下已经隐藏了，767 再隐藏会让「平板」看起来像「手机」 |
| 不动 `max-width: 1000px` 的滚动块 | 那是 800–1000 的兜底，本方案不改变它的行为 |
| 不改 `STAGE_BREAKPOINT_PX` / `STAGE_TOP_PX` | 动 pin 几何是另一个议题 |
| 不修 800–1000 的 `overflow-x: auto` | 那里已经装得下，滚动条不出现 |

---

## 5. 影响面

| 文件 | 改动 |
|---|---|
| `src/styles.css` | **新增 2 个媒体查询块，约 22 行** |

**代码零改动**，不动组件、不动 i18n、不动 JS。

---

## 6. 我需要你确认的

1. **641–767 换两行**（导航变 94px 高）—— 接受吗？另一条路是把两行阈值从 640 提到 767，但那会连带改 `.app` padding、面板位置等一整套手机样式，**风险大得多**。
2. **768–799 缩 padding**（链接左右 10→8px，导航左右 28→16px）—— 会让该区间的链接间距略紧，接受吗？
3. 要不要顺手把 **800–1000** 的 `overflow-x: auto` 也一起收掉？（那里其实装得下，滚动条从不出现，留着是无害的兜底）
