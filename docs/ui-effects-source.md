# 用户提供的 UI 效果素材（uiverse.io）

> 用户先后发来 4 段 CSS + 6 张截图，指定要用于 MolCosmos 改版。
> **原文逐字保留在下面**，实施时按「本项目适配」一节的改法处理，不要原样粘贴。
>
> 最后更新：2026-11-05

---

## 使用状态

| # | 效果 | 来源 | 状态 | 用在哪 |
|---|---|---|---|---|
| 1 | 社交图标 hover 填充 + tooltip 上飘 | `uiverse` | ⬜ 未做 | 导航 GitHub 按钮 |
| 2 | 日/月主题切换器（云朵 + 星星） | `uiverse` by Galahhad | ⬜ 未做 | 批次 4 改造为深空↔米白 |
| 3 | **渐变边框卡片**（= 用户说的「霓虹描边」，绿→蓝） | `uiverse` | ⬜ 未做 | 五关卡（批次 3） |
| 4 | 卡片 hover 放大 + 其余模糊 | `uiverse` | ⬜ 未做 | 宇宙普查（批次 3） |
| 5 | 竖向滑块 glider | `uiverse` | ✅ **已用于导航** | 见 `styles.css` 的 `.topnav__glider` |

> **第 3 条**：早期把「霓虹描边卡片」和「渐变边框卡片」当两个效果列过，用户 2026-11-05 确认是同一段代码（`#00ff75 → #3700ff` 就是那个绿蓝光边）。已合并。
>
> **第 5 条**已实施，实际代码是**改造版**（横向、实时 DOM 测量），不是原文那份。

---

## 1. 社交图标 hover 填充

**用户截图**：GitHub / LinkedIn / Instagram / YouTube 圆形图标，hover 时从下往上填充品牌色，上方浮出 tooltip。

**原文**：

```css
ul { list-style: none; }

.example-2 {
  display: flex;
  justify-content: center;
  align-items: center;
}
.example-2 .icon-content {
  margin: 0 10px;
  position: relative;
}
.example-2 .icon-content .tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  padding: 6px 10px;
  border-radius: 5px;
  opacity: 0;
  visibility: hidden;
  font-size: 14px;
  transition: all 0.3s ease;
}
.example-2 .icon-content:hover .tooltip {
  opacity: 1;
  visibility: visible;
  top: -50px;
}
.example-2 .icon-content a {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: #4d4d4d;
  background-color: #fff;
  transition: all 0.3s ease-in-out;
}
.example-2 .icon-content a:hover {
  box-shadow: 3px 2px 45px 0px rgb(0 0 0 / 12%);
}
.example-2 .icon-content a svg {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
}
.example-2 .icon-content a:hover {
  color: white;
}
.example-2 .icon-content a .filled {
  position: absolute;
  top: auto;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  background-color: #000;
  transition: all 0.3s ease-in-out;
}
.example-2 .icon-content a:hover .filled {
  height: 100%;
}

.example-2 .icon-content a[data-social="linkedin"] .filled,
.example-2 .icon-content a[data-social="linkedin"] ~ .tooltip {
  background-color: #0274b3;
}
.example-2 .icon-content a[data-social="github"] .filled,
.example-2 .icon-content a[data-social="github"] ~ .tooltip {
  background-color: #24262a;
}
.example-2 .icon-content a[data-social="instagram"] .filled,
.example-2 .icon-content a[data-social="instagram"] ~ .tooltip {
  background: linear-gradient(
    45deg,
    #405de6,
    #5b51db,
    #b33ab4,
    #c135b4,
    #e1306c,
    #fd1f1f
  );
}
.example-2 .icon-content a[data-social="youtube"] .filled,
.example-2 .icon-content a[data-social="youtube"] ~ .tooltip {
  background-color: #ff0000;
}
```

**关键点**（描述里看不到、必须看代码才知道的）：

- 填充是 `height: 0 → 100%`，**从下往上长**，不是淡入
- `.filled` 放在 `z-index` 下层，SVG 是 `z-index: 1` 才保持可见
- tooltip 不是只淡入，还**从 `top:-30px` 移到 `top:-50px`**（往上飘）
- 颜色全部写死，且用 `[data-social]` 属性选择器

**本项目适配**：

- 项目只有 **1 个** GitHub 按钮（`.topnav__github`），不是图标组，需减化为单按钮
- `#24262a` 必须在两套主题下都能看，改用 `--accent`/`--panel-solid` 变量
- 导航栏高度只有 56px，tooltip 往上飘会超出视口 → 改为**向下**，或直接不要 tooltip（已有 `title` 属性）
- `border-radius: 50%` 与现有 `999px` 胶囊体系冲突 → 统一用胶囊

---

## 2. 日/月主题切换器

**用户截图**：胶囊形开关，左黄太阳右灰月亮，白天有云朵，夜晚有星星。

**来源**：`uiverse` by **Galahhad**

**原文**（较长，17 个 `box-shadow` 堆出云朵）：

```css
.theme-switch {
  --toggle-size: 30px;
  --container-width: 5.625em;
  --container-height: 2.5em;
  --container-radius: 6.25em;
  --container-light-bg: #3D7EAE;
  --container-night-bg: #1D1F2C;
  --circle-container-diameter: 3.375em;
  --sun-moon-diameter: 2.125em;
  --sun-bg: #ECCA2F;
  --moon-bg: #C4C9D1;
  --spot-color: #959DB1;
  --circle-container-offset: calc((var(--circle-container-diameter) - var(--container-height)) / 2 * -1);
  --stars-color: #fff;
  --clouds-color: #F3FDFF;
  --back-clouds-color: #AACADF;
  --transition: .5s cubic-bezier(0, -0.02, 0.4, 1.25);
  --circle-transition: .3s cubic-bezier(0, -0.02, 0.35, 1.17);
}

.theme-switch, .theme-switch *, .theme-switch *::before, .theme-switch *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-size: var(--toggle-size);
}

.theme-switch__container {
  width: var(--container-width);
  height: var(--container-height);
  background-color: var(--container-light-bg);
  border-radius: var(--container-radius);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0em -0.062em 0.062em rgba(0, 0, 0, 0.25), 0em 0.062em 0.125em rgba(255, 255, 255, 0.94);
  transition: var(--transition);
  position: relative;
}

.theme-switch__container::before {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  box-shadow: 0em 0.05em 0.187em rgba(0, 0, 0, 0.25) inset, 0em 0.05em 0.187em rgba(0, 0, 0, 0.25) inset;
  border-radius: var(--container-radius)
}

.theme-switch__checkbox { display: none; }

.theme-switch__circle-container {
  width: var(--circle-container-diameter);
  height: var(--circle-container-diameter);
  background-color: rgba(255, 255, 255, 0.1);
  position: absolute;
  left: var(--circle-container-offset);
  top: var(--circle-container-offset);
  border-radius: var(--container-radius);
  box-shadow: inset 0 0 0 3.375em rgba(255, 255, 255, 0.1), 0 0 0 0.625em rgba(255, 255, 255, 0.1), 0 0 0 1.25em rgba(255, 255, 255, 0.1);
  display: flex;
  transition: var(--circle-transition);
  pointer-events: none;
}

.theme-switch__sun-moon-container {
  pointer-events: auto;
  position: relative;
  z-index: 2;
  width: var(--sun-moon-diameter);
  height: var(--sun-moon-diameter);
  margin: auto;
  border-radius: var(--container-radius);
  background-color: var(--sun-bg);
  box-shadow: 0.062em 0.062em 0.062em 0em rgba(254, 255, 239, 0.61) inset, 0em -0.062em 0.062em 0em #a1872a inset;
  filter: drop-shadow(0.062em 0.125em 0.125em rgba(0, 0, 0, 0.25)) drop-shadow(0em 0.062em 0.125em rgba(0, 0, 0, 0.25));
  overflow: hidden;
  transition: var(--transition);
}

.theme-switch__moon {
  transform: translateX(100%);
  width: 100%;
  height: 100%;
  background-color: var(--moon-bg);
  border-radius: inherit;
  box-shadow: 0.062em 0.062em 0.062em 0em rgba(254, 255, 239, 0.61) inset, 0em -0.062em 0.062em 0em #969696 inset;
  transition: var(--transition);
  position: relative;
}

.theme-switch__spot {
  position: absolute;
  top: 0.75em;
  left: 0.312em;
  width: 0.75em;
  height: 0.75em;
  border-radius: var(--container-radius);
  background-color: var(--spot-color);
  box-shadow: 0em 0.0312em 0.062em rgba(0, 0, 0, 0.25) inset;
}
.theme-switch__spot:nth-of-type(2) { width: 0.375em; height: 0.375em; top: 0.937em; left: 1.375em; }
.theme-switch__spot:nth-last-of-type(3) { width: 0.25em; height: 0.25em; top: 0.312em; left: 0.812em; }

.theme-switch__clouds {
  width: 1.25em;
  height: 1.25em;
  background-color: var(--clouds-color);
  border-radius: var(--container-radius);
  position: absolute;
  bottom: -0.625em;
  left: 0.312em;
  box-shadow: 0.937em 0.312em var(--clouds-color), -0.312em -0.312em var(--back-clouds-color), 1.437em 0.375em var(--clouds-color), 0.5em -0.125em var(--back-clouds-color), 2.187em 0 var(--clouds-color), 1.25em -0.062em var(--back-clouds-color), 2.937em 0.312em var(--clouds-color), 2em -0.312em var(--back-clouds-color), 3.625em -0.062em var(--clouds-color), 2.625em 0em var(--back-clouds-color), 4.5em -0.312em var(--clouds-color), 3.375em -0.437em var(--back-clouds-color), 4.625em -1.75em 0 0.437em var(--clouds-color), 4em -0.625em var(--back-clouds-color), 4.125em -2.125em 0 0.437em var(--back-clouds-color);
  transition: 0.5s cubic-bezier(0, -0.02, 0.4, 1.25);
}

.theme-switch__stars-container {
  position: absolute;
  color: var(--stars-color);
  top: -100%;
  left: 0.312em;
  width: 2.75em;
  height: auto;
  transition: var(--transition);
}

/* actions */
.theme-switch__checkbox:checked + .theme-switch__container {
  background-color: var(--container-night-bg);
}
.theme-switch__checkbox:checked + .theme-switch__container .theme-switch__circle-container {
  left: calc(100% - var(--circle-container-offset) - var(--circle-container-diameter));
}
.theme-switch__checkbox:checked + .theme-switch__container .theme-switch__circle-container:hover {
  left: calc(100% - var(--circle-container-offset) - var(--circle-container-diameter) - 0.187em)
}
.theme-switch__circle-container:hover {
  left: calc(var(--circle-container-offset) + 0.187em);
}
.theme-switch__checkbox:checked + .theme-switch__container .theme-switch__moon {
  transform: translate(0);
}
.theme-switch__checkbox:checked + .theme-switch__container .theme-switch__clouds {
  bottom: -4.062em;
}
.theme-switch__checkbox:checked + .theme-switch__container .theme-switch__stars-container {
  top: 50%;
  transform: translateY(-50%);
}
```

**本项目适配（重要）**：

- 原版是**两态**（light/dark），本项目要**深空 `#05060f` / 米白 `#ece7dc`** —— 太阳月亮配色不对，需换成星云↔纸纹
- `--container-light-bg: #3D7EAE` 是蓝天，与本项目深空主题冲突
- 云朵 17 条 `box-shadow` 硬编码 `#F3FDFF` / `#AACADF`，浅色主题下会脏
- 尺寸用 `em` 驱动 + `font-size: var(--toggle-size)`，**中英文切换要验证不溢出**
- 导航栏只有 56px，`--container-height: 2.5em × 30px = 75px` **超出导航高度** → 需缩小到 `--toggle-size: 14px` 左右
- 保留它的核心手感：`cubic-bezier(0, -0.02, 0.4, 1.25)` 的过冲、滑块 hover 微移

---

## 3. 渐变边框卡片（= 用户说的「霓虹描边」）

> **用户 2026-11-05 补充确认**：这就是之前截图里那个「绿蓝光边」。
> 早期 HANDOFF 把它和「霓虹描边卡片」当成两个效果列了两行，**实为同一个**，已合并。

**用户截图**：卡片有绿→蓝渐变边框，鼠标移上去边框显现、外框发光。

**原文**：

```css
.card {
  width: 190px;
  height: 254px;
  background-image: linear-gradient(163deg, #00ff75 0%, #3700ff 100%);
  border-radius: 20px;
  transition: all .3s;
}

.card2 {
  width: 190px;
  height: 254px;
  background-color: #1a1a1a;
  border-radius:;        /* ← 原文就是空的，非法声明 */
  transition: all .2s;
}

.card2:hover {
  transform: scale(0.98);
  border-radius: 20px;
}

.card:hover {
  box-shadow: 0px 0px 30px 1px rgba(0, 255, 117, 0.30);
}
```

**实测渲染结果**（无头 Chrome，`D:\tmp\molcosmos-motion-demo\fixture-card.html`）：

| 状态 | 看到什么 |
|---|---|
| **默认** | **纯灰方块，完全看不到渐变** |
| hover | 绿→蓝渐变边框清晰，外框绿光 |

**这一点截图看不出来，但极重要**：`.card` 和 `.card2` 同为 `190×254`，内层**完全盖住**外层，所以静止状态没有任何边框。只有 hover 时内层 `scale(0.98)` 缩进去，才露出约 **2px** 的渐变边。

**其他实测结论**：

- `border-radius:;` 是**非法声明，浏览器直接丢弃** → `.card2` 的 `borderRadius` 实测为 `0px`
- 因此默认状态下内层是**直角**，hover 时才通过 `.card2:hover { border-radius: 20px }` 变成圆角
- 边框宽度不是算出来的，是 `scale(0.98)` 的副产物：`190 × 0.02 / 2 ≈ 1.9px`

**本项目适配**：

| 原文 | 改成 | 原因 |
|---|---|---|
| `#00ff75 → #3700ff` | `--accent-2 → --accent-3` | 跟随主题 |
| `rgba(0,255,117,.3)` 绿光 | `rgb(var(--accent-2-rgb) / .3)` | 同上 |
| `190×254` 固定 | 项目卡片宽度（380px 起） | 尺寸不符 |
| `scale(0.98)` 制造边框 | **建议改 `inset` + `padding`** | `scale` 会让文字跟着缩放模糊 |
| 默认无边框 | **建议默认就 1px 渐变边** | 静止状态看不到效果，等于没用 |

> **设计判断**：这个效果的核心是「hover 才亮出来」。但在本项目里，五关卡卡片静止时也需要可辨识，所以建议改成**常驻细边框 + hover 加粗**，而不是全有全无。

---

## 4. 卡片 hover 放大 + 其余模糊

**用户截图**：红/蓝/绿三块卡片，其中一块 hover 时放大，其余模糊缩小。

**原文**：

```css
.cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cards .red { background-color: #f43f5e; }
.cards .blue { background-color: #3b82f6; }
.cards .green { background-color: #22c55e; }

.cards .card {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 100px;
  width: 250px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: 400ms;
}

.cards .card p.tip { font-size: 1em; font-weight: 700; }
.cards .card p.second-text { font-size: .7em; }

.cards .card:hover {
  transform: scale(1.1, 1.1);
}

.cards:hover > .card:not(:hover) {
  filter: blur(10px);
  transform: scale(0.9, 0.9);
}
```

**关键点**：

- 核心是 `.cards:hover > .card:not(:hover)` —— **父级 hover 时兄弟全部处理**，不需要 JS
- `filter: blur(10px)` 在深色背景上会让文字糊成一团，建议减到 4-6px

**本项目适配**：

- 红/蓝/绿换成 `CLASS_COLORS`（`galaxy.ts#L31-L34`），**不得新增色值**
- 用在宇宙普查四类，但**批次 3 会把它改成光谱带**（见 SDS §4.9）
- 若保留卡片形态，`blur(10px)` 需降到 4px（项目卡片文字多）

---

## 5. 竖向滑块 glider（已实施）

**用户截图**：Free / Basic / Premium 三档，当前项文字金色、左侧一条竖直发光条滑动。

**原文**：

```css
.radio-container {
  --main-color: #f7e479;
  --main-color-opacity: #f7e4791c;
  --total-radio: 3;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-left: 0.5rem;
}
.radio-container input { cursor: pointer; appearance: none; }
.radio-container .glider-container {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(27,27,27,1) 50%, rgba(0,0,0,0) 100%);
  width: 1px;
}
.radio-container .glider-container .glider {
  position: relative;
  height: calc(100% / var(--total-radio));
  width: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0) 0%, var(--main-color) 50%, rgba(0,0,0,0) 100%);
  transition: transform 0.5s cubic-bezier(0.37, 1.95, 0.66, 0.56);
}
.radio-container .glider-container .glider::before {
  content: "";
  position: absolute;
  height: 60%; width: 300%;
  top: 50%; transform: translateY(-50%);
  background: var(--main-color);
  filter: blur(10px);
}
.radio-container .glider-container .glider::after {
  content: "";
  position: absolute;
  left: 0; height: 100%; width: 150px;
  background: linear-gradient(90deg, var(--main-color-opacity) 0%, rgba(0,0,0,0) 100%);
}
.radio-container label {
  cursor: pointer; padding: 1rem; position: relative;
  color: grey; transition: all 0.3s ease-in-out;
}
.radio-container input:checked + label { color: var(--main-color); }

.radio-container input:nth-of-type(1):checked ~ .glider-container .glider { transform: translateY(0); }
.radio-container input:nth-of-type(2):checked ~ .glider-container .glider { transform: translateY(100%); }
.radio-container input:nth-of-type(3):checked ~ .glider-container .glider { transform: translateY(200%); }
/* ... 一直到 nth-of-type(10) */
```

**已实施为 `.topnav__glider`**（`styles.css`），但做了 4 处必要改动：

| 原文 | 实施版 | 原因 |
|---|---|---|
| 竖向 `translateY` | 横向 `translateX` | 导航是横排 |
| 10 条 `:nth-of-type` 硬编码 | 实时 `getBoundingClientRect()` 测量 | 项数可变 |
| `--total-radio` 手算高度 | 无 | 同上 |
| 只有 `::before` 光晕 | 保留 `::before` blur + 加 `.topnav__glider` 自身渐变 | 视觉需要 |

保留了原文的核心：`cubic-bezier(0.37, 1.95, 0.66, 0.56)` 的**过冲回弹**，以及 `filter: blur(10px)` 的弥散光。

---

## 实施时的一般原则

用户给的 CSS 都是**单组件演示片段**，直接搬进项目会有 4 类问题：

| 问题 | 处理 |
|---|---|
| 硬编码颜色 | 换成项目的 CSS 变量（`--accent` / `--accent-2` / `--panel` 等） |
| 固定像素尺寸 | 改成 `clamp()` 或相对单位，中文切换后不溢出 |
| 无限循环动画 | 必须加 `prefers-reduced-motion` 兜底 |
| `:nth-of-type` 硬编码索引 | 改成 JS 实时测量（项数会变） |

另外：项目导航栏高度只有 **56px**，任何加进导航的效果都要先量这个约束。
