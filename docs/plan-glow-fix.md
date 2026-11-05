# 计划：光晕尺寸与指针死区修复

> 状态：**已批准**（2026-11-05，用户确认「都用你的推荐」）
> 触发：用户反馈「光晕有点大了」「鼠标移到页面两边光晕就飞走，直接不见」
> 约束：经用户审核后实施；实施后需实测验收

---

## 〇、先纠正一个前提

首屏代码里有**两层**光，但实测证明用户说的"光晕"只有**一层**：

| 层 | 元素 | 实测尺寸 @1930 | 表现 |
|---|---|---|---|
| A `.hero__stage-glow` | `inset:-20%` | 2704×1525 | 常亮紫青薄雾，不跟鼠标 |
| B `.hero__stage-viewport-light` | `60vmax` | **1158px** | **跟着鼠标走的金色光珠** |

隔离截图对照（临时目录，未入库）：

- **只留 B** → 金色光珠清晰可见，与用户截图一致 ✅
- **只留 A** → 金色光珠**消失**，只剩淡紫青雾
- **两层都关** → 近乎全黑

**结论：只改 B 层，A 层一行不动。** 早期把问题描述成"两层都在捣乱"是我的错。

---

## 一、问题复现（实测）

测量环境：`vite preview` + Chrome `--headless=new`，CDP
`Emulation.setDeviceMetricsOverride` + `Input.dispatchMouseEvent`。

### 问题 1：光晕过大

`60vmax` 随最长边增长：

| 视口 | 元素边长 | 占屏宽 | 亮核直径 |
|---|---|---|---|
| 1440×900 | 864px | 60% | ~501px |
| 1920×1080 | 1152px | 60% | ~668px |
| 1930×1080（用户截图） | 1158px | 60% | ~671px |
| 390×844 | 506px | **130%** | ~294px |

390 档比屏幕还宽，属失控。

### 问题 2：指针死区

`--m-on` 来自 `usePointerField`，监听器挂在 **`.hero`**（`pointer.ts:94`），
而光晕所在 `.hero__stage` 是**全宽层**：

```
.hero        130..1310    （.app { max-width: 1180px }）
.hero__stage    0..1440   （calc(100vw - var(--sbw))）
```

实测（1440×900，鼠标 y=400）：

| clientX | --m-on | --px | opacity |
|---|---|---|---|
| 720 | 1 | 720px | 1 |
| 200 | 1 | 200px | 1 |
| **100** | **0** | 0px | **0** |
| **1420** | **0** | 0px | **0** |

死区随视口放大：1440 → 18% 屏宽，1920 → 39%，**2560 → 54%**。

---

## 二、已批准的四项决策

| # | 决策 | 取值 |
|---|---|---|
| **Q1** | 两侧行为 | **a) 光跟到屏幕边缘**（全视口跟随，不消失） |
| **Q2** | 尺寸 | **A** `min(52vmin, 620px)` |
| **Q3** | 滚走行为 | **仅 hero 内可见**，滚过即收 |
| **Q4** | 触摸设备 | **关掉**（`@media (hover: none)`） |

### 尺寸换算（`min(52vmin, 620px)`）

| 视口 | 现在 | 改后 | 占屏宽 |
|---|---|---|---|
| 1440×900 | 864 | **468** | 33% |
| 1920×1080 | 1152 | **562** | 29% |
| 1930×1080 | 1158 | **562** | 29% |
| 2560×1440 | 1536 | **620**（封顶） | 24% |
| 390×844 | 506 | **203** | 52% |

`vmin` 修掉竖屏取高度的问题；`620px` 封顶让大屏不再无限放大。
亮核（alpha≥0.22）直径随之从 ~501px 降到 ~271px。

> `transform` 里的 `- 30vmax` 必须同步改成 `- min(26vmin, 310px)`（元素半宽），
> 否则光晕会偏离光标。

---

## 三、实施方案

### D1 光晕尺寸与居中偏移 —— `src/styles.css`

```css
.hero__stage-viewport-light {
  width: min(52vmin, 620px);
  height: min(52vmin, 620px);
  /* 元素半宽。与 width 的表达式必须同源，否则光晕偏离光标。 */
  transform: translate3d(
    calc(var(--px, 0px) - min(26vmin, 310px)),
    calc(var(--py, 0px) - min(26vmin, 310px)),
    0
  );
}
```

> 用 `min(26vmin,310px)` 而不是 `calc(min(52vmin,620px)/2)`：后者在部分
> 浏览器对自定义属性求值时机不一致，前者是常数，无歧义。**已由断言 G5b 覆盖。**

### D2 死区 —— `src/lib/pointer.ts` 两段坐标

`usePointerField` 增加可选第二 ref（`surface`，指向 `.hero__stage`）：

| 变量 | 数据源 | 作用对象 |
|---|---|---|
| `--px` / `--py` / `--m-on` | **surface**（全宽 stage） | 光晕 |
| `--mx` / `--my` | 仍为 `.hero` | 背景视差 + 标题 drop-shadow |

`surface` 未提供时退回旧行为（单一 ref），保证向后兼容且可单测。

**`--m-on` 的判据变为两个条件同时成立**：

1. 指针在 surface 包围盒内（Q1 全宽）
2. hero 仍与视口相交（Q3 滚走收起）

条件 2 用 `IntersectionObserver` 观察 `.hero`，`isIntersecting && ratio > 0.05`
时为真。选 IntersectionObserver 而非滚动监听：零滚动回调，不与批次 2 的
`ScrollTrigger` 抢主线程。

### D3 触摸设备 —— `src/styles.css`

```css
@media (hover: none), (pointer: coarse) {
  .hero__stage-viewport-light { display: none; }
}
```

纯触摸屏没有 hover，光会随机闪；直接不显示。

### D4 `HeroStage.tsx` 接 ref

`Props` 增 `stageRef?: React.RefObject<HTMLDivElement>`，挂到根 `div`。
`Hero.tsx` 创建该 ref 并传给 `usePointerField` 的第二参数。

---

## 四、影响面

| 文件 | 改动 | 风险 |
|---|---|---|
| `src/styles.css` | B 层尺寸/偏移 + 触摸媒体查询 | 低，纯装饰层 `aria-hidden` |
| `src/lib/pointer.ts` | 增加 surface ref、双条件 `--m-on` | 中，Hero 唯一消费者 |
| `src/components/Hero.tsx` | 建 stage ref 并传入 | 低 |
| `src/components/HeroStage.tsx` | 增加 `stageRef` prop | 低 |
| `src/lib/pointer.test.ts` | **新建**（当前 0 条测试） | — |

**不碰**：`.hero__stage-glow`（A 层）、`galaxy.ts` / `molecule.ts` /
`search.ts` / `weights.ts`、`Sections2.tsx` 的 probe-line、批次 2 的 gsap 注册。

---

## 五、验收（全部脚本化）

| # | 断言 | 阈值 |
|---|---|---|
| G1 | 光晕边长 @1440 | ≤ 500px |
| G2 | 光晕边长 @390 | ≤ 0.8 × 视口宽 |
| G3 | 光晕边长 @2560 | ≤ 620px（封顶生效） |
| G4 | `--m-on` @clientX = 20 / 720 / 1420（1440 视口） | 均为 `1` |
| G5 | `--px` 与 clientX 误差 | ≤ 1px |
| G5b | 光晕视觉中心与光标偏差 | ≤ 8px |
| G6 | 滚过 hero 后 `--m-on` | `0` |
| G7 | reduced-motion 下光晕 | `display:none` |
| G8 | 触摸模拟（`Emulation.setTouchEmulationEnabled`） | 光晕不显示 |
| G9 | 现有 `verify.mjs` | 16/16 PASS |

外加 `tsc` 0 error、`vitest` 全绿、`npm run build` 成功。

---

## 六、实施顺序（TDD）

1. **先写** `src/lib/pointer.test.ts`（`--m-on` 双条件、两段坐标、无 surface 回退）→ 红
2. 改 `pointer.ts` → 绿
3. `HeroStage.tsx` 接 ref，`Hero.tsx` 传入
4. 改 CSS（D1 + D3）
5. 浏览器实测 G1–G9
6. 更新 `docs/sds-measurements.md` + `docs/HANDOFF.md`
7. 提交 + tag

---

## 七、回滚

`git revert <commit>`。改动集中在 4 个文件，无数据/依赖变化。

---

## 八、我不确定的地方

1. **"合适"仍带主观**。`min(52vmin,620px)` 让 1930 档从 1158 降到 562（−51%）。
   如果偏小/偏大，改一个 `clamp` 数字即可，无需重做。
2. **G8 触摸断言是模拟**。CDP `setTouchEmulationEnabled` 不等于真机；
   真机上仍建议人工看一眼。
3. **A 层未动**，但它在 1930 下是 2704×1525 的薄雾。若你之后觉得"整体还是发灰"，
   那是 A 层的问题，另开一单。
4. **IntersectionObserver 阈值 0.05 是我选的**，没有实测依据。先取一个保守值，
   若滚动手感不佳再调。
