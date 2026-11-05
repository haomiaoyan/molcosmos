# 交接说明 · MolCosmos 改版

> **写给明天（或任何新会话）的自己。**
> 最后更新：2026-11-05 12:45
> 当前阶段：**SDS v1.1 定稿，可以开始实施**

---

## 一、现在停在哪

```
1. grilling 需求澄清        ✅ 完成（D1-D11 决策表）
2. 计划初稿                 ✅ 完成
3. 独立审核 #1              ✅ 完成（4 BLOCKING / 11 MAJOR / 4 MINOR）
4. 逐条核实并修复           ✅ 完成（推翻审核 1 条，补审核漏 1 条）→ 计划 v3
5. SDS 撰写                 ✅ 完成（v1.0）
6. SDS 审核 #2 + 实测校正   ✅ 完成
6a. 独立审核 #2             ✅ 已用主会话实测替代（审核代理超时无产出）
6b. 实测校正                ✅ 完成（9 处 SDS 错误全部修入 v1.1）
7. 交接文档                 ✅ 本文件
8. 实施                     ⬜ **下一步从这里开始**
```

**代码一行未动。** `git status` 只有 5 个未跟踪项（见 §四）。

### 1.1 阶段 6 做了什么（详解）

独立审核子代理跑了 30 分钟无产出被叫停，改为**主会话自己实测**，按方法论 6b「最便宜最高产的环节」执行。共发现并修复 9 处 SDS 错误：

| # | 错误 | 实测证据 | 修正 |
|---|---|---|---|
| 1 | `travel` 公式多了 `pad` | `scrollWidth` 已含 padding，2172+48−1180=1040 ≠ v7 的 992 | 去掉 `pad` |
| 2 | travel 值 992 不适用本项目 | 挂 `.app` 内 → winW=1132 → travel=**1040** | 全文改 1040 |
| 3 | 全宽层用 `100vw` | 四方案实测，三种都溢出 8px | 改 `calc(100vw - var(--sbw))` |
| 4 | 断言 9 用 `elementFromPoint` | `pointer-events:none` → 必返回 BODY | 改几何断言 |
| 5 | `ws` 未列入依赖 | `npm ls ws` → extraneous，`npm ci` 会删 | 写进 devDependencies |
| 6 | `FEATURES` 未标原子操作 | `Hero.tsx#L11-L14` 有 8 处引用 | 批次 1 标硬约束 |
| 7 | `segmentWidths` 会溢出 | `[600,0,0,0]` 实测产生 0.327% 空段 | 加零值保护 + 6 测试用例 |
| 8 | `.stage-pin` 挂载位置未写 | 影响 windowWidth 与 travel | 明写「挂 `.app` 内」 |
| 9 | paper 主题缺舞台配色 | 浅色下会出深色矩形 | 补 10 个变量 + 对照表 |

---

## 二、必读顺序

1. **本文件**（你现在读的）
2. `docs/sds-motion-and-hero.md` —— **SDS v1.1，实施依据**
3. `docs/plan-hero-rebuild.md` —— 计划 v3，决策表 D1-D11
4. `docs/sds-measurements.md` —— 实测校正记录（SDS v1.1 的来源）
5. `docs/layout-issues.md`、`docs/spec-hero-molecule-and-tools.md` —— 项目原有文档

---

## 三、下一步：开始实施

SDS 已定稿，**不需要再改文档，直接按批次实施**。

### 3.1 实施方式

建议 **subagent-driven**：主会话调度 + 独立审核子代理。

每批次流程：
1. 主会话按 SDS §5 派子代理实施
2. 子代理完成后，主会话跑验收命令（§6.1）
3. 派独立子代理审核该批代码
4. 逐条核实审核意见（审核会错，见方法论 §四）
5. 通过 → 打 tag → 下一批

### 3.2 批次顺序（不可乱）

| 批次 | tag | 内容 | 依赖 |
|---|---|---|---|
| 1 | `v2.0-p1` | 首屏重做 + `verify.mjs` 骨架 + `ws` 依赖 | 无 |
| 2 | `v2.0-p2` | GSAP 系统 + ScrollToPlugin | 批次 1 |
| 3 | `v2.0-p3` | 后半段重构图（长舞台/光谱带/时间轴） | 批次 2 |
| 4 | `v2.0-p4` | 双主题 + 旧 id 重定向 | 批次 1-3 |

**批次 4 完成后必须重跑批次 1-3 的视觉验收**（主题变了，旧截图失效）。

### 3.3 每批必跑的验收

```bash
cd "/d/ai项目（自用）/molcosmos"
npx tsc --noEmit && npx vitest run && npm run build
# 起 preview 后
node scripts/verify.mjs --url http://localhost:4400/
```

> `vite preview` 监听 **localhost**，`127.0.0.1` 连不上。

---

## 四、环境与状态

### 4.1 项目位置

```
主项目（唯一权威）：D:\ai项目（自用）\molcosmos
动效演示（临时）：  D:\tmp\molcosmos-motion-demo
  └─ v7.html  ← 用户已验收的长舞台效果（http://127.0.0.1:4399/v7.html）
```

### 4.2 git 状态（实测）

```
分支：main
tag：v1.0-stable、v1.1-milestones
未跟踪：
  ?? _shots/                        ← 改版前基线截图
  ?? docs/plan-hero-rebuild.md
  ?? docs/sds-motion-and-hero.md
  ?? docs/sds-measurements.md
工作区：干净，无代码改动
```

### 4.3 演示服务（已停止，明天需重启）

```bash
# 演示页（v1..v7 对比）
cd /d/tmp/molcosmos-motion-demo && node serve.mjs
# → http://127.0.0.1:4399/
#   v7 = /v7.html（已验收）

# 真实项目预览
cd "/d/ai项目（自用）/molcosmos" && npx vite preview --port 4400 --strictPort
# → http://localhost:4400/   注意：监听 localhost，127.0.0.1 连不上
```

### 4.4 验收工具

```bash
cd "/d/ai项目（自用）/molcosmos"
npx tsc --noEmit        # 类型检查
npx vitest run          # 107 tests / 10 files（基线）
npm run build           # build 已含 tsc，是唯一构建门禁
```

无头 Chrome：`C:/Program Files/Google/Chrome/Application/chrome.exe`
CDP 脚本参考：`/d/tmp/molcosmos-motion-demo/verify-*.mjs`（已跑通，可复用）

---

## 五、已实测的关键数据（不要重新估算）

### 5.1 首屏现状（真实项目）

| 视口 | hero 高 | 比值 | CTA 底边 | CTA 可见 | 四卡片底边 | 卡片可见 |
|---|---|---|---|---|---|---|
| 1440×900 | 1041 | 1.16 | 598 | ✅ | 961 | ❌ 被切 |
| 390×844 | 1497 | 1.77 | 714 | ✅ | 1417 | ❌ 被切 |
| 1920×1080 | 1080 | 1.00 | 617 | ✅ | 980 | ✅ |

> **CTA 本来就可见。** 删四卡片的理由是「hero 超一屏 + 卡片被切」，不是「CTA 看不见」。

### 5.2 长舞台 v7（已验收）

| 视口 | winW | cardW | trackW | travel | span | span/travel |
|---|---|---|---|---|---|---|
| 1440 | 1180 | 380 | 2172 | 992 | 3472 | 3.5 |
| 1920 | 1180 | 380 | 2172 | 992 | 3472 | 3.5 |
| 2560 | 1180 | 380 | 2172 | 992 | 3472 | 3.5 |

> 上表 windowWidth=1180（v7 挂 `.app` 外）。
> **SDS 方案挂 `.app` 内 → windowWidth=1132 → travel=1040**（三档仍恒定）。

### 5.3 砍主题（在临时副本实做）

```
npx tsc --noEmit  → 14 个错误
  theme.ts                8（L67,101,135,169 的 id + labelKey）
  TopnavTools.tsx         2（L56,78 TS2345）← 审核漏掉的
  urlState.test.ts        3（L58 abyss / L62 ember / L78 midnight）

npx vitest run    → 107/107 全绿，0 失败  ← 审核说会红，实际不红
npm run build     → 失败（build 含 tsc）
```

### 5.4 全宽层方案对比

| 写法 | left | width | overflowX |
|---|---|---|---|
| `100vw` + `margin-left:calc(50%-50vw)` | −7 | 1440 | **8px** ❌ |
| `100vw` + `left:50%`+`translateX` | −7 | 1440 | **8px** ❌ |
| **`calc(100vw - var(--sbw))` + `translateX`** | **0** | **1425** | **0** ✅ |

`--sbw` = `innerWidth - clientWidth`（实测 15px）。

### 5.5 pin 与 nav

| start | pinTop | navBottom | navCoversPin | gapUnderNav |
|---|---|---|---|---|
| `'top top'` | 0 | 59 | **true** | −59 |
| `'top 64px'` | 64 | 59 | **false** | **+5** ✅ |

---

## 六、硬约束（违反会出问题）

| 约束 | 后果 |
|---|---|
| 唯一新增依赖 `gsap@3.15.1`（写死，不带 `^`）+ `ws@8.22.0`（devDep） | 引入其他包需重新过审 |
| **不碰 `Sections2.tsx` L129-L140** 的高亮判定 | 会丢 `abfa669` 的修复 |
| **不碰** `galaxy.ts` / `molecule.ts` / `search.ts` / `weights.ts` | 数据正确性核心，107 条测试保护 |
| **不改** `CLASS_COLORS` 色值 | 那是数据编码色，不是主题色 |
| 每批结束 `npm run build` + 打 tag | CI 会拒、无法回滚 |
| reduced-motion 下信息一条不少 | 无障碍硬要求 |

---

## 七、容易踩的坑

1. **`vitest` 不检查类型** —— 改类型不会让测试红，但会让 `build` 挂。验收必须跑 `npm run build`。
2. **`.app` 有 `padding: 0 24px`** —— `.stage-pin` 挂进去，`width:100%` 只有 1132 不是 1180。
3. **`pointer-events: none` 的层做 `elementFromPoint` 必然得到 BODY** —— 装饰层不能用命中测试验。
4. **`100vw` 含滚动条** —— 任何全宽布局都要减 `--sbw`。
5. **`Hero.tsx` L11-L14 的 `FEATURES` 引用 8 个 i18n key** —— 删 key 必须同时删数组。
6. **`.hero{overflow:hidden}` 在保护分子槽的负 left** —— 放开它必须同时改分子槽定位。
7. **`vite preview` 监听 localhost** —— `127.0.0.1` 连不上。
8. **`.tmp-*` 被 gitignore** —— 验收脚本要入库必须改名（如 `scripts/verify.mjs`）。

---

## 八、如果发现 SDS 有错怎么办

**以代码为准**，不要为了符合 SDS 写错代码。

- 记录偏离（在提交信息里说明）
- 同步更新 `docs/sds-measurements.md`
- 若偏离影响其他批次，先修 SDS 再继续

---

## 九、用户已确认的偏好

| 项 | 决定 |
|---|---|
| 浅色定调 | 暖纸米白 `#ece7dc` + 朱砂 `#c2410c`（Synteny 风） |
| 推进方式 | P1→P4，每阶段验收后再定 |
| 主题数量 | 5 → 2（深空 + 米白） |
| 卡片大小 | **保持 v1 的 380px**（用户明确否决放大） |
| 长舞台 | 横向推进，节奏要够长（已用 3.5 倍解决） |
| 动画来源 | taste-skill 18 配方 + `ui.md` 第4段 + Synteny 配色（不去 Uiverse 翻） |
| 不采用 | ThreeUI（iframe+CDN）、React Bits（非 npm 包） |
| 窗口模式 | 窗口化使用，非全屏 |

---

## 十、参考

| 文档 | 位置 |
|---|---|
| 方法论（必读） | `C:\Users\lenovo\AppData\Local\Temp\synteny-pro\docs\specs\METHODOLOGY-plan-and-sds-review.md` |
| 计划 v3 | `docs/plan-hero-rebuild.md` |
| SDS v1.0 | `docs/sds-motion-and-hero.md` |
| 实测校正 | `docs/sds-measurements.md` |
| v7 演示 | `D:\tmp\molcosmos-motion-demo\v7.html` |
| 基线截图 | `_shots/`（1440 首屏、390 手机、全页、9 章节） |
