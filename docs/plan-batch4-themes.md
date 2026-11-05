# 计划：批次 4 —— 双主题（深空 + 米白）

> 状态：**已作废（2026-11-05）**
> 用户决定：**背景色不改**，5 套主题全部保留，批次 4 不实施。
> 本文件保留作为记录：它写明了如果将来要做会踩哪些坑（14 处 TS 报错、
> `vitest` 全绿但 `build` 失败、光晕在浅色下失效、舞台变量缺失）。
> **不要照着实施。**
>
> 依据：`docs/sds-motion-and-hero.md` §4.1–4.2 + §5 批次 4
> 前置：批次 1–3 已完成，三套验收脚本全绿

---

## 一、这一批做什么

把 5 套配色砍到 **2 套**：保留 `cosmos`（深空），新增 `paper`（暖纸米白 + 朱砂）。
删掉 `midnight` / `nebula` / `abyss` / `ember`。

**为什么不是纯清理**：`paper` 是新写的主题，涉及 30+ 个 CSS 变量；而删除 4 套主题会让
14 处 TypeScript 报错（SDS 已实测）。两件事必须一起做，否则中间状态编译不过。

---

## 二、实测现状（我核过，不是照抄 SDS）

### 2.1 对比度

| 主题 | 变量 | 实测比值 | 判定 |
|---|---|---|---|
| cosmos | `--text` `#e6ecff` | **17.13:1** | ✅ |
| cosmos | `--text-dim` `#9aa7cc` | **8.44:1** | ✅ |
| cosmos | `--text-mute` `#5f6c92` | **3.89:1** | ❌ 不达标 |
| paper | `--text` `#1d1a16` | **14.06:1** | ✅ |
| paper | `--text-dim` `#4a4438` | **7.83:1** | ✅ |
| paper | `--text-mute` `#6b6355` | **4.81:1** | ✅ |

**SDS 说对了**：`--text-mute` 只有 3.89:1，本批顺手修。
候选 `#6b7a9e` → 4.72:1（最接近原色，改动最小）。

### 2.2 需要变量化的硬编码色

| 位置 | 现值 | 用途 |
|---|---|---|
| `styles.css:881` | `rgba(12, 16, 36, 0.86)` | 深色遮罩 |
| `styles.css:886` | `rgba(20, 26, 54, 0.9)` | 深色遮罩 2 |
| `styles.css:933` | `#e9ddff` | sheen 文字 |

这三个在浅色主题下会变成突兀的深块，**必须变成变量**。

### 2.3 会报错的地方（14 处，SDS 已列，我核对了引用点）

| 文件 | 处数 | 内容 |
|---|---|---|
| `theme.ts` | 8 | 4 套主题定义 + `labelKey` 联合类型 |
| `TopnavTools.tsx` | 2 | `t(current.labelKey)` / `t(theme.labelKey)` |
| `urlState.test.ts` | 3 | 断言 `nebula` / `ember` / `midnight` 原样返回 |

> **关键陷阱（已实测）**：`npx vitest run` 在砍主题后**仍然全绿**（esbuild 剥类型），
> 只有 `npm run build`（含 `tsc`）会失败。
> **本批验收必须用 `npm run build`，不能只看 vitest。**

---

## 三、四个交付物

### D1 `theme.ts` 5→2 + `colorScheme` 动态

- `ThemeId` 联合类型缩到 `'cosmos' | 'paper'`
- `labelKey` 缩到 `'theme.cosmos' | 'theme.paper'`
- `Theme` 接口新增 `colorScheme: 'dark' | 'light'`
- `applyTheme` 里 `root.style.colorScheme = 'dark'` **写死**改成 `theme.colorScheme`
  （现状在 `theme.ts:158`，浅色主题下滚动条会是黑的）
- `paper` 的 vars 按 SDS §4.1 的完整清单（30+ 条），另加 7 个新变量

### D2 `urlState.ts` 旧 id 重定向

```
?theme=cosmos   → 'cosmos'
?theme=paper    → 'paper'
?theme=nebula   → 'cosmos'    ← 重定向，不是丢弃
?theme=midnight → 'cosmos'
?theme=chartreuse → null      ← 未知 id 仍返回 null
```

**为什么重定向**：老链接应看到「深空」，而不是掉回 localStorage 得到另一个主题。

### D3 `i18n.tsx` 删 4 条加 1 条

删 `theme.midnight` / `theme.nebula` / `theme.abyss` / `theme.ember`，
加 `theme.paper: ['米白', 'Paper']`。

### D4 舞台层变量化（**SDS 有、但本批必须补**）

批次 3 新建的 `.stage-pin` / `.station` 用的是深空配色。浅色主题下它们会变成
**米白页面里的一块深色矩形**。

SDS 给了 7 个新变量（`--stage-bg` / `--stage-glow-1/2` / `--stage-dot` /
`--stage-card` / `--stage-card-active`），**两套主题都要给值**。

> 这一条是批次 3 完成之后才成立的依赖，SDS 写它时还没有长舞台。

---

## 四、验收

### 自动

| # | 断言 | 阈值 |
|---|---|---|
| C1 | `--text` on `--bg`（两套主题） | ≥ 4.5:1 |
| C2 | `--text-dim` on `--bg` | ≥ 4.5:1 |
| C3 | `--text-mute` on `--bg` | ≥ 3:1（次要信息） |
| C4 | 切到 paper 后 `documentElement.style.colorScheme` | `light` |
| C5 | 切到 paper 后 `<meta name="theme-color">` | `#ece7dc` |
| C6 | `?theme=nebula` 打开后实际主题 | `cosmos` |
| C7 | 长舞台在 paper 下背景色 | 不是深色（与 `--bg` 差值小） |
| C8 | 现有三套脚本 | 16/16 · 12/12 · 23/23 |

外加 `npm run build` 必须过（**这是本批唯一能拦住类型错误的门禁**）。

### 人工（必须重跑批次 1–3 的视觉验收）

主题变了，**之前所有截图全部失效**。要重新看：

- 首屏（光晕在米白上是否还成立——深色用 `mix-blend-mode: screen` 加光，浅色下 `screen` 会失效）
- 五关卡长舞台（卡片底色、渐变环）
- 宇宙普查光谱带（四种数据色在米白上对比度是否够）
- 时间轴（轴与节点的可见性）

---

## 五、风险

| 风险 | 可能性 | 影响 | 缓解 |
|---|---|---|---|
| 砍主题触发 14 处 TS 错误 | **已实测会发生** | build 失败 | 逐项清单，`TopnavTools` 两处易漏 |
| vitest 全绿但 build 失败 | **已实测会发生** | 误判为通过 | 验收强制 `npm run build` |
| 光晕在浅色下失效 | **高** | 首屏视觉主轴塌 | `screen` 混合模式在白底上无效，需按主题切换混合模式 |
| 星点变灰尘 | 高 | 浅色下 600 颗白星看不见 | 用 `--star-rgb` 反转成深色点阵 |
| 数据色在米白上对比不足 | 中 | 光谱带难辨 | `CLASS_COLORS` 不改（硬约束），改用描边/底色衬托 |

---

## 六、我需要你决定的三件事

❓ **Q1 — 光晕在米白主题下怎么处理**

深空下光晕用 `mix-blend-mode: screen`（只加光）。**在白底上 `screen` 等于不可见**。

- **a)** 浅色主题改用 `multiply`（只减光，变成一层淡阴影）
- **b)** 浅色主题降低透明度、不用混合模式
- **c)** 浅色主题干脆关掉光标光晕

➡️ 我倾向 **a**。`multiply` 在浅色上是"投下一点暗"，比"加光"更符合纸面质感。

❓ **Q2 — 米白主题的星点怎么处理**

现在首屏有 600 颗白星 + 点阵纹理。浅色下白星不可见。

- **a)** 用 `--star-rgb` 反转成深色小点（SDS 方案）
- **b)** 浅色下隐藏星点，只留点阵
- **c)** 换成别的纹理（等值线之类）

➡️ 我倾向 **a**，改动最小且视觉连续。

❓ **Q3 — 砍掉的 4 套主题，要不要给用户留迁移提示**

老链接 `?theme=nebula` 会静默变成深空。

- **a)** 静默重定向（SDS 方案）
- **b)** 重定向 + 顶部一次性提示「主题已精简，已切回深空」

➡️ 我倾向 **a**。提示会打扰，而且这 4 套主题本来就要删。

---

## 七、我不确定的地方

1. **`paper` 主题的 30+ 个变量我只核对了对比度，没核对整体观感**。数值是 SDS 给的，
   我没在浏览器里渲染过——这是新主题，不是改数值，观感只能实施后看。
2. **`--stage-card` 的 7 个变量是否够用**，取决于长舞台里还有没有我漏掉的硬编码色。
   实施第一步应该先 `grep` 一遍 `.stage-*` / `.station` 规则里的字面量。
3. **浅色下 `CLASS_COLORS` 的四种数据色**（金/青/蓝/灰）在米白上的对比度我没算。
   这是硬约束不能改色值，但可能需要在图例上加描边。
