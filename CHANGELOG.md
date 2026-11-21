# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布] — 光斑跟随修复 + 返回顶部（B5）

### B5a · 光斑跟随（`7d42566`）

- 首屏光斑的 transform 改在 `pointermove` 里直接写元素，`setField` + rAF 只负责视差与显隐。
- 实测（Edge / GPU / 144Hz，扫过视口 70% 宽度）：空档从 700px 窗口 **3px**、1280px **5px**、1920px **8px**、2560px **10px** 全部降到 **0px**；落后帧数 1.0 → 0。原因不是渲染变慢，而是固定 1 帧延迟在更宽的窗口里对应更多 CSS px。

### B5b · 返回顶部

- 新增 `BackToTop`：Uiverse `afraid-falcon-17`（vinodjangid07）的圆形按钮皮肤，改成主题变量 + 中英双语 + 具名 class；点击沿用 `App` 已有的 gsap `scrollTo`。未引入新依赖。
- 滚过 0.85 屏后出现，`aria-hidden` / `tabIndex` 同步切换；reduced-motion 下去掉位移与过渡但仍可点击。

## [未发布] — React Bits 视觉层（B1–B4）

一批一批接入，每批一个提交、可独立回滚。仅改展示层：`CosmosScene.tsx`、算法 `lib/*.ts` 与测试文件均未改动。

### B1 · 首屏（`44a0433`）

- 落地 5 个 React Bits 免费 `JS-CSS` 组件到 `src/components/rb/`：`FadeContent`、`StarBorder`、`Magnet`、`ClickSpark`、`SpotlightCard`。
- 标题逐行入场、主 CTA 流光描边、按钮磁吸、点击火花；保留原有金色渐变胶囊按钮与深空背景。
- 新增 `scripts/land-rb.mjs`，从 registry 拉取源码并自动完成本地适配。

### B2 · 叙事区块与时间轴（`dbb0b41`）

- 7 个 `section__head` 统一走 `SectionHead`（`FadeContent` 滚动入场，仍渲染为 `<header>`）。
- 时间轴 5 个真实卡片接入 `SpotlightCard` 鼠标跟随聚光，CSS 覆盖保持原有几何与 hover。
- 修复：`main.tsx` 在 bootstrap 调用 `registerGsap()`——滚动触发跑在 layout effect，早于 `App` 的 `useEffect`。
- 修复：`FadeContent` 的 `autoAlpha` 改为纯 `opacity`，避免 `visibility:hidden` 把屏外标题移出无障碍树。
- 计划偏差：全站只有时间轴 5 个卡片，其余叙事区块为舞台 / 梯形 / 编号行，未硬造卡片网格。

### B3 · 交互区块

- 方法说明、边界声明两个列表做逐条 stagger 入场；短名单对比的子标题入场。
- 复用同一套 `FadeContent`，仍是 `<ol>` / `<ul>` / `<header>` 语义标签，不改布局。

### B4 · 文档

- README 更正过时数值：单测 107 → **168**、测试文件 10 → 17、构建体积实测、补充 `verify` 与 `experiment` 命令。
- 新增「关于 React Bits 组件」章节，说明为何保持 React 18、主题取色、reduced-motion 与 gsap 注册时机。
- 补记 `scripts/` 与 `src/components/rb/` 的项目结构。

### 适配约定

- 上游 JSX 为 `@ts-nocheck`，对外类型集中在 `src/components/rb/index.ts`；`land-rb.mjs` 不会覆盖该文件。
- 色值一律经 `resolveColor()` 在渲染时读取 CSS 变量，跟随 5 套主题。
- 组件 CSS 的 BEM 块统一改名为 `rb-*`，不污染全局 `styles.css`。

### 验证

168 / 168 单测、`tsc --noEmit` 零错误、`npm run build` 成功、`verify.mjs` **16 / 16**；另测滚动逐章可见、reduced-motion 下 0 隐藏 / 0 淡出、控制台零报错。
