# 计划 · B2-2：compare 并入 stats（九章 → 八章）

> 状态：**待用户审核**。未收到「确认」不动代码（QUICKSTART §5.0）。
> 写于 2026-11-08，HEAD `6bf6b3c`，tag `v2.0-p6`，工作区干净。
> 上游计划：`docs/plan-visual-system.md` §B2-2（本轮唯一剩下的计划内条目）。

---

## 0. 一句话

把 `#compare` 从**独立章节**降级为 `#stats` 的**第二个子块**：删掉它自己的一套章节外壳（96px 上边距 + 完整 `section__head`），换成紧凑的小标题。导航 9 项变 8 项。

---

## 1. 实测数据（本机，preview 4415，HEAD `6bf6b3c`）

### 1.1 现状几何

| 视口 | 页面高 | `#stats` | `#compare` | `#compare` 占屏 |
|---|---|---|---|---|
| 1440×900 | 12377 | 476.5 | **372.9** | 0.41 vh |
| 768×1024 | 14866 | 604.3 | **354.7** | 0.35 vh |
| 390×844 | 10361 | 793.3 | **404.9** | 0.48 vh |

计划里写的「373px」**在 1440 档成立**（372.9），但 768 / 390 档是 355 / 405 —— 原文只记了 1440 档。

### 1.2 compare 内部构成（1440，短名单为空）

```
section__head       135.0   （eyebrow + h2 + lead）
compare__empty       77.9   （虚线框一行字）
--- 其余是 96px 上 padding + 20px 下 padding ---
```

**关键**：空态下 `#compare` 的**可操作元素 = 0**。
实测 `focusables`（`a[href], button, input, select, textarea, [tabindex]`）= **0**。
而星系舞台在文档 **1142.3px** 处，compare 在 **7728.5px** —— 距离 **6586px**（计划写的 6828px 是到 `#cosmos` 顶部，不是舞台）。

### 1.3 合并能省多少（DOM 级模拟，未改代码）

在真实页面上把 compare 的 `.section` 换成子块、`.section__head` 换成紧凑标题、并 `appendChild` 进 `#stats` 后实测：

| 视口 | 合并后 `#stats` | 合并后占屏 | 页面高变化 |
|---|---|---|---|
| 1440 | **716.3**（原 476.5） | 0.80 vh | 12377 → **12244**（−133） |
| 768 | **844.1**（原 604.3） | 0.82 vh | 14866 → **14751**（−115） |
| 390 | **1084.3**（原 793.3） | 1.28 vh | 10361 → **10247**（−114） |

### 1.4 导航（这个数字比计划里写的重要）

| 视口 | 现状 9 项 | 合并后 8 项 |
|---|---|---|
| 1440 | 1085 / 1085 不溢出 | 1085 / 1085 不溢出 |
| 768 | **484 / 413 溢出** | **433 / 413 仍溢出** |
| 390 | **400 / 362 溢出** | **362 / 362 恰好不溢出** ✅ |

**发现**：导航在 768 和 390 档**本来就溢出**（`ul` 有 `overflow-x: auto`，可横向滑动）。
合并后 390 档刚好收进 362px，**768 档仍溢出 20px**。

> ⚠️ **这条不在原计划里，需要你决定**：768 档溢出是既有问题，本计划**不负责修**（会变成两个议题混在一起）。如果你要顺手修，得单开一条。

---

## 2. 改法

### 2.1 `src/components/Sections.tsx` —— `CosmosStats` 接受第二个子块

现在：

```tsx
export function CosmosStats({ molecules }: { molecules: readonly Molecule[] }) {
  return (
    <section className="section" id="stats" aria-labelledby="stats-title">
      <header className="section__head">…</header>
      <SpectrumStrip molecules={molecules} />
    </section>
  )
}
```

改为：

```tsx
export function CosmosStats({ molecules }: { molecules: readonly Molecule[] }) {
  return (
    <section className="section" id="stats" aria-labelledby="stats-title">
      <header className="section__head">…</header>
      <SpectrumStrip molecules={molecules} />
      <CompareBlock molecules={…} />
    </section>
  )
}
```

`CosmosStats` 需要多收一个 prop：`shortlist: Molecule[]`（App 里已有 `shortlist` 变量）。

### 2.2 `src/components/CompareSection.tsx` —— 换外壳，逻辑不动

**只改渲染层的三处**，内部 400 行逻辑（`picked` / `bestByRow` / `StructuresRow` / `RadarOverlay` / `valueOf`）**一行不动**：

| 改动 | 前 | 后 |
|---|---|---|
| 根元素 | `<section className="section" id="compare" aria-labelledby="compare-title">` | `<div className="sub-block" id="compare">` |
| 头部 | `<header className="section__head">` + eyebrow + `h2` + lead | `<header className="sub-block__head">` + **`h3`** + lead，**删 eyebrow** |
| 组件名 | `CompareSection` | `CompareBlock`（跟外壳语义一致） |

`h2` → `h3` 是**必须的**：它现在在 `#stats` 的 `h2` 之下，再用 `h2` 会让大纲出现两个同级标题。`aria-labelledby` 去掉（子块不再是被导航指向的 landmark）。

**eyebrow 删掉**，理由：它是「这是第 N 章」的视觉信号；降级为子块后，紧邻的 `stats` 已有 eyebrow，连着两个 eyebrow 是噪音。

### 2.3 `src/lib/i18n.tsx` —— 改 3 个 key，删 1 个

| key | 动作 | 理由 |
|---|---|---|
| `nav.compare` | **删除**（`['对比','Compare']`） | 导航不再有这一项 |
| `compare.eyebrow` | **删除**（`['并排对比','Side by side']`） | 子块不显示 eyebrow |
| `compare.title.pre` / `.accent` | **保留，不改文案** | 标题照用，只是变成 `h3` |
| `compare.lead` | **保留** | 子块仍有引导语 |

> 其余 15 个 `compare.*` key（`empty` / `needTwo` / `pick` / `limit` / `selected` / `radarAria` / `table` / `metric` / `row.*` / `best` / `structures` / `clear`）**全部保留不动**。
> `compare.clear` 目前是**死 key**（组件里没用），本次不处理 —— 属于清理，不属于 B2-2。

### 2.4 `src/components/Sections2.tsx` —— `NAV_SECTIONS` 删一行

```diff
 const NAV_SECTIONS = [
   ['top', 'nav.home'],
   ['pipeline', 'nav.pipeline'],
   ['funnel', 'nav.funnel'],
   ['stats', 'nav.stats'],
-  ['compare', 'nav.compare'],
   ['lab', 'nav.lab'],
   …
 ] as const
```

**注释也要改**：`Sections2.tsx:145` 的注释写着「compare, stats and method all jumped ahead one item」，提到 compare 已不存在，需同步。

### 2.5 `src/App.tsx` —— 删 `CompareSection` 的独立挂载

```diff
-import { CompareSection } from './components/CompareSection'
+import { CompareBlock } from './components/CompareSection'

-<CosmosStats molecules={catalogue} />
-<CompareSection molecules={shortlist} />
+<CosmosStats molecules={catalogue} shortlist={shortlist} />
```

### 2.6 `src/styles.css` —— 新增 1 组规则，删 0 条

**新增**（约 30 行，放在 `.section__head` 附近）：

```css
/* A sub-block is a chapter's second movement: it belongs to the section above
   it, so it gives up the 96px chapter gap and the full section head, but keeps
   its own lead and its own vertical rhythm. */
.sub-block {
  margin-top: 56px;
}

.sub-block__head {
  text-align: left;
  max-width: 760px;
  margin: 0 0 18px;
}

.sub-block__title {
  font-size: 1.12rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.sub-block__lead {
  color: var(--text-dim);
  margin: 0;
  font-size: 0.92rem;
  text-wrap: pretty;
}
```

**不动**：`.compare__*` 全部 40 条规则**一条不改**（它们只管内部布局，与章节外壳无关）。

---

## 3. 不做的事

| 项 | 理由 |
|---|---|
| **不修 768 档导航溢出** | 既有问题，与 B2-2 无关。混在一起说不清回归来源 |
| **不改 compare 空态的文案** | `compare.empty` 说「回到星系…」，合并后依然成立（星系还在上方 6586px） |
| **不解决空态死路** | 原计划说它是缺陷，但修法（在空态里加「去星系」按钮）是**新功能**，不是合并的一部分 |
| **不动 `#compare` 的 id** | 外部深链、`?star=` 无关，但保留 id 让老锚点 `#compare` 仍然可用（只是不再有导航项） |
| **不清理 `compare.clear` 死 key** | 属清理，单列 |
| **不改 `COMPARE_LIMIT` / `SERIES_COLORS` / `CLASS_COLORS`** | 数据与配色，§四硬约束 |

---

## 4. 风险与验证

### 4.1 风险

| 风险 | 判断 |
|---|---|
| 导航 scroll spy 少一项后高亮错位 | **低**。`NAV_SECTIONS` 是 spy 的唯一数据源（注释明确写了「both the nav and the spy read this list」），删一行两边同步 |
| `#compare` 不再是 `section`，锚点跳转失效 | **低**。`<div id="compare">` 仍是合法锚点目标；且它已在 `#stats` 内部，`#stats` 锚点覆盖了它 |
| 子块标题从 `h2` 降 `h3` 影响无障碍大纲 | **正向**。原本 `h2` 与 `stats` 的 `h2` 平级，现在正确嵌套 |
| 短名单非空时高度变化更大 | **需实测**。有内容时 compare 是 1269px（1440），合并后 `#stats` 会是 ~1600px，占屏 1.8 —— 需要截图确认节奏 |

### 4.2 验收（每步都要跑）

```powershell
cd "D:\ai项目（自用）\molcosmos"
$env:TEMP = "$PWD\.tmp-build"; $env:TMP = $env:TEMP

npx tsc --noEmit          # 0 error
npx vitest run            # 168/168
npm run build             # 成功
```

```powershell
npx vite preview --port 4415 --strictPort --host 0.0.0.0
node scripts/verify.mjs       --url http://127.0.0.1:4415/   # 16/16
node scripts/verify-glow.mjs  --url http://127.0.0.1:4415/   # 12/12
node scripts/verify-stage.mjs --url http://127.0.0.1:4415/   # 23/23
```

**三套脚本的 T6/T7 与几何断言需要复核**（原计划点名的风险点）：
- `verify.mjs` 断言 1/8/9 —— 只测 hero 与 stage，**与 compare 无关**，应不受影响
- `verify-stage.mjs` T6/T7 —— 测的是 390 档的 `.stage-pin` 与横向溢出，**与 compare 无关**

> **我预期三套脚本零改动、零失败。** 如果有失败，说明我漏了耦合点，要停下来重新分析。

### 4.3 额外的手工验收（脚本不覆盖）

| 检查 | 方法 |
|---|---|
| 导航 8 项，无「对比」 | 截图 1440 / 768 / 390 |
| 390 档导航不再溢出 | 量 `ul.scrollWidth <= ul.clientWidth` |
| 高亮 spy 正常 | 滚到 stats 区域，确认高亮停在「普查」而不是跳到「沙盒」 |
| 短名单非空时的节奏 | 塞 3 个分子，截图 1440，看 `#stats` 会不会太长 |
| `#compare` 锚点仍可用 | 访问 `/#compare`，应滚到子块位置 |
| reduced-motion | 开系统「减少动态效果」，确认子块正常渲染（无 reveal 依赖） |

---

## 5. 提交与记录

```
一次提交：refactor(stats): fold the comparison into the census as a sub-block

- 九章 → 八章，导航 9 → 8
- compare 换子块外壳，内部逻辑零改动
- h2 → h3（正确嵌套），删 eyebrow
- 新增 .sub-block 规则，.compare__* 零改动
```

提交后同步：
- `docs/HANDOFF.md` 新增 §十六（本批记录）
- `docs/QUICKSTART.md` §六 关键数字表补一行「子块上间距 56px」
- 打 tag `v2.0-p7`

---

## 6. 我需要你确认的三件事

1. **子块上间距 56px** 是否合适？（模拟用的是 56px，理由是它 ≈ 章节内两个内容块的自然间隔；`section` 上边距是 96px）
2. **删 `compare.eyebrow` 和 `nav.compare`** 两个 i18n key —— 同意吗？还是想保留 key 只改显示？
3. **768 档导航仍溢出 20px** —— 接受现状（本计划不管），还是要我把它列进本批？
