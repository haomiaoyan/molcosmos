# SDS 实测校正记录

> 阶段 6b 产出。方法论文档：「实测校正是最便宜、最高产的环节」。
> 以下结论均来自无头 Chrome 实测，**不要重新估算**。

---

## 一、已推翻 SDS 的条目（必须改）

### 1. `stageTravel` 公式多了 `pad`（BLOCKING）

**SDS §4.5 现写**：

```ts
travel = max(0, trackWidth + pad - windowWidth)
```

**实测**：`trackWidth`（即 `scrollWidth`）**已包含** `padding: 0 24px` 的左右两侧。

```
卡片 5×380 + gap 4×56 = 2124     （内容宽）
             + padding 48 = 2172   （scrollWidth）
```

**v7 真实代码**（`v7.html:324`）：

```js
const travel = () => Math.max(0, track.scrollWidth - win.clientWidth);
```

**正确公式**：

```ts
travel = max(0, trackWidth - windowWidth)   // 不再 + pad
```

| 写法 | 计算 | 结果 |
|---|---|---|
| SDS 现写 | 2172 + 48 − 1180 | **1040**（与 v7 实测 992 不符） |
| v7 实际 | 2172 − 1180 | **992** ✅ |

---

### 2. 挂载位置改变 `windowWidth`，进而改变 `travel` 数值（MAJOR）

SDS §4.8 把 `.stage-pin` 放在 `.app` 内并写 `width:100%`。实测：

```
.app { max-width:1180px; padding:0 24px }
→ .stage-pin 的 width:100% 只填满 content box = 1180 − 48 = 1132
→ windowWidth = 1132（不是 1180）
→ travel = 2172 − 1132 = 1040
```

**三种挂载位置对比**：

| 挂法 | Stage 宽 | travel |
|---|---|---|
| A 挂在 `.app` 内（SDS 现写法） | 1132 | 1040 |
| B 挂在 `.app` 外，宽 1180 | 1180 | 992（v7 实测值） |
| C 全宽（相对 body） | 1425 | 747 |

**决定**：采用 **A**（在 `.app` 内），因为：
- `overflowX: 0`（实测），无横向溢出
- 与全站内容列对齐，视觉一致
- 桌面三档 travel **恒定为 1040**（见下）

但 **SDS 里的 992 必须改成 1040**，且 `useStageTravel.test.ts` 的用例值要同步。

---

### 3. `start: 'top 64px'` 有效（证实 SDS 正确）

实测两种 `start` 的差异：

| mode | pinTop | navBottom | navCoversPin | gapUnderNav |
|---|---|---|---|---|
| `'top top'` | 0 | 59 | **true** | −59 |
| `'top 64px'` | **64** | 59 | **false** | **+5** |

**结论**：SDS §4.8 的 `start: 'top 64px'` 正确，保留。

---

### 4. `width:100%` 解决 7px 偏移（证实 SDS 正确）

| 写法 | overflowX |
|---|---|
| `100vw`（v7） | **8px** |
| `100%`（SDS） | **0px** |

**结论**：SDS §4.6「不用 `100vw`」正确，且对 `.stage-pin` 同样适用。

---

### 5. `ws` 是 extraneous，`npm ci` 会删（MAJOR）

```
package.json 中无 ws
npm ls ws → ws@8.22.0 extraneous
node_modules/ws → 存在
```

**SDS §4.14 只写「先跑 `npm ls ws` 确认」不够**，必须给出动作：

```json
// package.json devDependencies 新增
"ws": "8.22.0"
```

否则 `npm ci` 后 `scripts/verify.mjs` 跑不起来，整条验收链断掉。

---

### 6. `Hero.tsx` 有 4 处 `hero.f*` 引用（BLOCKING）

```
src/components/Hero.tsx:11-14  FEATURES 数组 4 项 × 2 key = 8 处字符串引用
```

SDS §4.7 说「删 `FEATURES`」，但 §4.12 的 i18n 章节没写明**必须同时删这个数组**。

若只删 i18n key 不删 `FEATURES`，`StringKey` 联合收窄 → `tsc` 报 8 个类型错误。

**修法**：SDS 批次 1 的清单里，`Hero.tsx` 的「删 FEATURES」和「删 8 条 i18n key」**必须标为同一原子操作**。

---

### 7. `SpectrumStrip` 最小段宽会溢出（MAJOR，条件触发）

当前数据恰好不溢出：

```
53/600 = 8.833%  |  371/600 = 61.833%  |  174/600 = 29.000%  |  2/600 = 0.333%
总和 = 100.000%   （far 的 0.333% 正好等于阈值）
```

**但沙盒权重会改变各段数量**。若 `far` 降到 1 个（0.167%），套用 `max(0.33%, w)` 后总和变成 100.163%，溢出。

**SDS 必须补回缩算法**：

```ts
/** 最大值提升到 MIN 后，按总和归一化回 100%。 */
function segmentWidths(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return counts.map(() => 0)
  const MIN = 0.33
  const raw = counts.map((c) => (c / total) * 100)
  const lifted = raw.map((w) => Math.max(MIN, w))
  const sum = lifted.reduce((a, b) => a + b, 0)
  return lifted.map((w) => (w / sum) * 100)
}
```

**单测**：`[53,371,174,1]` → 总和必须 `=== 100`（浮点容差 1e-6）。

---

## 二、证实的条目（SDS 正确，保留）

| SDS 条目 | 实测证据 |
|---|---|
| `.hero{overflow:hidden}` 会裁 `100vw` 子元素 | `elementFromPoint` → `BODY` vs 命中原元素 |
| `start: 'top 64px'` 让出 nav | `gapUnderNav: +5`（原 −59） |
| `width:100%` 无横向溢出 | `overflowX: 0`（`100vw` 是 8） |
| 390 宽不 pin | `pinned: 0`, `cardWidth: 302` |
| reduced-motion 后 trigger 数 0 | kill 后实测 0 |
| 砍主题 → `npm run build` 挂 | 实测 `tsc` 14 错误，`vitest` 全绿 |
| `vitest` 不因类型收窄而红 | 实测 107/107 pass |

---

### 8. 全宽层必须用 `calc(100vw - var(--sbw))`（BLOCKING，已实测出解法）

**问题**：`100vw` 包含滚动条宽度（15px），内容区不含。导致：

| 写法 | left | width | overflowX | 结论 |
|---|---|---|---|---|
| `100vw` + `margin-left:calc(50% - 50vw)`（v7） | −7 | 1440 | **8px** | 溢出 |
| `100vw` + `left:50%` + `translateX(-50%)` | −7 | 1440 | **8px** | 溢出 |
| `100vw` + `margin-left` 负值 | −7 | 1440 | **8px** | 溢出 |
| **`calc(100vw - var(--sbw))` + `translateX(-50%)`** | **0** | **1425** | **0px** | ✅ |

**实测三档全部成立**（1440/1920/2560）：

```
sbwVar: "15px"   stage.left: 0   stage.width: 1425 (= clientWidth)   overflowX: 0
```

**CSS**：

```css
:root { --sbw: 0px; }

.hero__stage {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: calc(100vw - var(--sbw));
  transform: translateX(-50%);
  pointer-events: none;
}
```

**JS（挂载时 + resize）**：

```ts
function syncScrollbarWidth(): void {
  const root = document.documentElement
  root.style.setProperty('--sbw', `${window.innerWidth - root.clientWidth}px`)
}
```

**同理**：`.stage-pin` 的全宽背景层也用它。

---

### 9. 断言 9 的方法必须换（BLOCKING）

SDS §4.14 断言 9 写「`elementFromPoint(2, heroMidY)` 命中 `.hero__stage`」。

**这条断言必然失败**：装饰层有 `pointer-events: none`，命中测试永远返回 `BODY`。

**改为几何断言**：

```js
const r = stage.getBoundingClientRect()
assert(Math.abs(r.left) <= 1, '全宽层左边缘应贴视口左侧')
assert(r.width >= document.documentElement.clientWidth - 1, '宽度应覆盖可视区')
assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
       '不应产生横向溢出')
```

---

## 三、新增待决问题

| # | 问题 | 影响 |
|---|---|---|
| 1 | 992 还是 1040？ | 取决于 `.stage-pin` 挂载位置。**采用 A → 1040** |
| 2 | `useStageTravel` 单测的用例值 | 需按 1040 重写 |
| 3 | `verify.mjs` 断言 2「三档 travel 差 ≤1px」 | 现在三档都是 1040，仍成立；但要写明期望绝对值 |
| 4 | 浅色主题下 `.stage-pin` 的背景 | SDS 未给 paper 版的背景值与点阵色 |

---

## 四、复现命令

```bash
# 1. travel 公式
node -e "console.log(2172 + 48 - 1180, 2172 - 1180)"   # → 1040 992

# 2. 挂载位置
# 打开 D:\tmp\molcosmos-motion-demo\fixture-sds.html 看 stageW

# 3. start 语义
node verify-sds.mjs      # mode=topTop vs offset

# 4. ws
cd "/d/ai项目（自用）/molcosmos" && npm ls ws

# 5. hero.f 残留
grep -rn "hero\.f[1-4]" src/ | grep -v i18n.tsx
```
