# 计划：reduced-motion 下五关卡后三张卡不可达

> 状态：**已实施**（2026-11-08，用户确认后执行）
> 实施记录见 `docs/HANDOFF.md` §十三
> 起因：`docs/QUICKSTART.md` §5.0 流程；评审第 P0-1 条
> 影响文件：`src/styles.css`、`scripts/verify-stage.mjs`
> 判定：**大改动**（2 个文件、改变运行时行为、修 bug）

---

## 一、问题

### 现象

系统开启「减少动态效果」后，1440×900 下五关卡章节：

| 卡片 | 可见宽度 | 比例 |
|---|---|---|
| 01 靶点确认 | 380 / 380 | 100% |
| 02 虚拟筛选 | 380 / 380 | 100% |
| 03 分子生成 | 236 / 380 | **62%**（右缘被切） |
| 04 性质预测 | 0 / 380 | **0%（完全不可见）** |
| 05 合成与临床 | 0 / 380 | **0%（完全不可见）** |

计数器仍显示 `01 / 05`，但它不滚动、也不会变。

### 根因

`StationStage.tsx` 的 `matchMedia` 查询是：

```js
`(min-width: ${STAGE_BREAKPOINT_PX}px) and (prefers-reduced-motion: no-preference)`
```

也就是说 **JS 侧本来就没打算在 reduced motion 下建 trigger**——组件注释写得很清楚：

> Below this the stage is a normal vertical list with no trigger at all.

但 **CSS 侧只实现了宽度条件，没实现 motion 条件**：

```css
@media (max-width: 767px) { /* 堆叠 */ }
```

reduced motion + 桌面宽 → JS 不建 pin（轨道不动），CSS 仍是 `flex-direction: row`，而 `.stage-window` 是 `overflow: hidden`。于是 2172px 的轨道被 1132px 的窗口裁掉，后面三张卡既没有 pin 带着走，也没有滚动容器可以滑。

**这是 CSS 没跟上 JS 已经做出的决定**，不是设计取舍。

### 为什么验收脚本没拦住

`scripts/verify-stage.mjs` 的 T8c：

```js
check(
  'T8c. all five cards still present and visible under reduced motion',
  state.cards === 5 && state.firstVisible && state.firstOpacity === '1',
  `${state.cards} cards, first opacity ${state.firstOpacity}, visible ${state.firstVisible}`,
)
```

`state.firstVisible` 只测了 `document.querySelector('.station')` —— **第一张卡**。第一张卡当然可见。断言名字说的是「all five」，实际只验了一张。

---

## 二、改法

### 2.1 `src/styles.css`

把现有 `@media (max-width: 767px)` 块的条件**扩展**为两选一，让 reduced motion 也走同一套堆叠规则；再补一个只作用于「桌面 + reduced motion」的限宽块。

```css
/* 原：@media (max-width: 767px) { ... } */
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .stage-pin { height: auto; min-height: 0; display: block; gap: 0; }
  .stage-pin::before { display: none; }
  .stage-window { width: 100%; overflow: visible; }
  .station-track {
    flex-direction: column;
    gap: 18px;
    padding: 0;
    will-change: auto;
  }
  .station-track > .station { flex: 0 0 auto; width: 100%; }
  .stage-counter, .stage-progress { display: none; }
}

/* 新增：桌面宽度下的可读宽度上限 */
@media (prefers-reduced-motion: reduce) and (min-width: 768px) {
  .station-track { align-items: center; }
  .station-track > .station { max-width: 560px; }
  /* 堆叠后没有「当前卡」这个概念，第 1 张的高亮边框会被读成「这张被选中」 */
  .station-track > .station[data-active='true'] {
    border-color: var(--line);
    box-shadow: none;
  }
}
```

### 2.2 `scripts/verify-stage.mjs`

把 T8c 换成对**每一张卡**的可见性断言：

```js
// 在 evaluate 里补：
//   const win = document.querySelector('.stage-window').getBoundingClientRect()
//   每张卡算 visibleW = max(0, min(card.right, win.right) - max(card.left, win.left))
//   fullyVisible = visibleW >= card.width - 1
check(
  'T8c. every card is fully inside the clipping window under reduced motion',
  state.cards === 5 && state.allFullyVisible,
  `${state.cards} cards, fully visible ${state.fullyVisibleCount}/5, ` +
  `opacities ${state.opacities.join(',')}`,
)
```

保留原有的「5 张卡都在、opacity 都是 1」检查，作为同一断言的一部分（它们仍然必要，只是不够）。

---

## 三、为什么是 560px

实测四个上限（1440×900，reduced motion，卡片正文 14.1px）：

| 上限 | 卡片宽 | 行数 | 每行字数 | 章节高 |
|---|---|---|---|---|
| 不限宽 | 1132 | 1 | 45–59 | 1291 |
| 420 | 420 | 2–3 | 18–28 | 1458 |
| 480 | 480 | 2 | 23–30 | 1410 |
| **560** | **560** | **2** | **23–30** | **1410** |
| 640 | 640 | 2 | 23–30 | 1410 |

- **不限宽**每行 45–59 字，CJK 长文超出舒适区（30–40），且卡片被拉成 1132px 的横条，与站内其他内容列不一致。
- **420** 开始出现 3 行，卡片高度不齐（203 / 227 混排）。
- **560 / 640** 都是 2 行、高度整齐、字数落在舒适区。
- 选 **560** 而非 640：与 `.section__head` 的 `max-width: 760px` 同一量级但不抢主标题的宽度，视觉上读作「内容列」而不是「整幅横条」。

**560 比现有桌面卡的 380px 更宽**（现有 380px 是 18–23 字/行，偏窄）。所以这不是「缩小」，是换成更适合堆叠阅读的宽度。

---

## 四、验证矩阵（已在运行时注入实测，未落盘）

| 场景 | 改前 | 改后 | 是否符合预期 |
|---|---|---|---|
| 1440×900 **reduced** | row，2 张可见 | **column，5 张全可见，560px** | ✅ 修好 |
| 1440×900 正常 | row，380px，pin 工作 | **完全不变** | ✅ 无回归 |
| 768×900 **reduced** | row，2 张可见 | **column，5 张全可见** | ✅ 修好 |
| 768×900 正常 | row，pin 工作 | 完全不变 | ✅ |
| 767×900 正常 | column，704px | 完全不变 | ✅ |
| 700×900 正常 | column，637px | 完全不变 | ✅ |
| 600×900 正常 | column，557px | 完全不变 | ✅ |
| 390×844 正常 | column，362px | 完全不变 | ✅ |
| 390×844 **reduced** | column，362px | 完全不变 | ✅ |

> 关键：`max-width` 如果直接写进合并块，**会改变 700–767px 的现有表现**（实测 700 时从 637px 变成 560px、767 时从 704px 变成 560px）。所以限宽单独放在 `(prefers-reduced-motion: reduce) and (min-width: 768px)` 里，只影响桌面。

正常桌面 pin 仍然工作：实测 mid 位置 `transform: matrix(1,0,0,1,-657.715,0)`、counter `04 / 05`。

---

## 五、验收清单

实施后必须全过：

```
npx tsc --noEmit            0 error
npx vitest run              168/168
npm run build               成功
node scripts/verify.mjs      16/16
node scripts/verify-glow.mjs 12/12
node scripts/verify-stage.mjs 23/23（T8c 改强后仍全过）
```

外加手工确认：

1. reduced motion + 1440：滚到五关卡，五张卡全部完整可见、可读，计数器与进度条不出现。
2. reduced motion + 1440：第 1 张卡没有高亮边框/阴影（与其余四张一致）。
3. 正常模式 + 1440：pin 仍然横移，计数器 01→05 正常，卡片仍 380px。
4. 正常模式 + 767：堆叠宽度不变（704px）。
5. 语言切到 EN：reduced motion 下堆叠仍正常（英文更长，测换行）。

---

## 六、不做什么

- **不动** `StationStage.tsx`：JS 已经是对的，改它等于重复修同一件事。
- **不动** 卡片宽度常量 `380px`：那是正常模式横向舞台的既定值（用户明确否决过放大）。
- **不动** `useStageTravel.ts` 及其 12 条测试：pin 的 travel/span 计算与此无关。
- **不顺手**修评审里的其它条目（面板滚动提示、首屏次按钮、徽章配色等）——按 §5.0，一次只做一件事。

---

## 七、风险

| 风险 | 应对 |
|---|---|
| `@media` 逗号并集会误伤正常模式 | 已实测 8 个视口，非 reduced 场景 `changed: false` |
| 卡片 560px 在 768–900 的窄桌面显得过宽 | 560 是上限不是定值；768 视口下卡片实际 560，窗口 705，两侧留 72px |
| 堆叠后章节变高（1158→1410），影响滚动锚点 | `refreshTriggersWhenSettled()` 已覆盖；改后重跑三套 verify |
| T8c 改强后暴露其它问题 | 那正是目的；若红了先判断是代码错还是断言写错 |
