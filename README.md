# MolCosmos · 分子宇宙

**一粒药里的 AI：从 10⁶⁰ 个可能分子，到一片获批的药。**

把 AI 制药要搜索的化学空间，画成一片可以漫游的 3D 三臂旋涡星系——每颗星是一个分子，**亮度即 AI 打分的类药潜力**。

> 医学人工智能导论 · 课程项目

---

## 🌐 在线体验

**https://haomiaoyan.github.io/molcosmos/**

> 首次访问若显示 404，说明 Pages 还在首次部署中（约 1–2 分钟），稍后刷新即可。

---

## ✨ 它是什么

传统讲 AI 制药，容易停留在"AI 能设计药物"这句口号上。这个项目想把那个**被搜索的空间本身**画出来：

- 化学空间约有 **10⁶⁰** 个可能的小分子（Boháček et al., 1996 估计：含 ≤30 个 C/N/O/S 原子的分子）——宇宙里的星星，就是这个空间的一个采样
- 每颗星的位置由分子的**亲脂性 / 分子量 / 极性表面积**决定，颜色由 **Lipinski 类药五规则**的打分决定
- 星系中央的金色光环是**"宜居带"**——口服药最可能活下来的性质区间
- 点开任意一颗星，能看到它的 3D 球棍结构、五维性质雷达图、以及逐条对照的 Lipinski 规则

**核心主张**：AI 制药不是"算出正确的分子"，而是在一个天文数字级的空间里做**有偏好的采样**——偏好来自打分函数，而打分函数来自我们目前对"什么是好药"的理解。

---

## 🎮 交互功能

| 功能 | 说明 |
|---|---|
| **3D 星系漫游** | 鼠标拖拽旋转、滚轮缩放，双击空白处返回全景；星辰持续闪烁脉动 |
| **点击星辰** | 镜头平滑飞行聚焦，选中星亮起光环 + 编号标签，右侧滑出分子详情面板 |
| **分子详情** | 自转 3D 球棍模型（C/N/O/S 按元素配色）、五维雷达图、类药潜力进度条、Lipinski 徽章（违规项红色高亮） |
| **打分沙盒** | 5 个滑块分别调整分子量 / logP / HBD / HBA / 环数在打分里的权重，600 颗星**即时重新排序**；左侧实时直方图对比调参前后的四类分布，可一键切换「只看分子量」「只看亲脂性」等预设 |
| **短名单对比** | 收藏 2–3 个分子后，在「短名单对比」一节并排看结构、叠加五维雷达、逐行比数值；每个属性标出谁更接近理想值 |
| **里程碑时间轴** | 1996 → 2025 五个节点（化学空间估计、五规则、首个 AI 设计分子进临床、AlphaFold2、AI 药进 II 期），**每条都带自己的限定条件**，不做「AI 已经成功」的暗示 |
| **搜索** | 编号 / 分子式 / 类别三路检索（`MCX-000123`、`C24H44N2O6`、`宜居带`），键盘 ↑↓ 选择、Enter 打开 |
| **类别高亮** | 点图例的四类胶囊，只点亮该类分子、其余淡出，快速看清「宜居带」在星系里的分布 |
| **键盘漫游** | `←` / `→` 按目录顺序逐个切换分子，适合课堂投影演示 |
| **短名单** | 详情面板点「☆ 收藏」，本机 `localStorage` 保存最多 24 个分子，方便回头对比 |
| **分享链接** | 一键复制 `?star=` 深链；打开分子、切换配色或语言时地址栏都会同步（`?star=&theme=&lang=`），直接复制浏览器地址同样有效 |
| **触发生成式探索** | 在"宜居带"附近批量点亮紫色新星，模拟生成模型只探索有希望的区域（最多保留最近两批 26 颗作为尾迹）；紫色新星同样是真实分子，可点开查看 |
| **背景配色** | 顶栏调色盘切换 5 套配色（深空 / 极夜 / 星云 / 深海 / 余烬），背景、面板、强调色、3D 场景底色一起变，选择存在本机 |
| **中英双语** | 顶栏 `中 / EN` 一键切换；全部文案（含首屏、五关卡、漏斗、方法说明、面板、无障碍标签、页面标题与 meta）同步换语言，首访按浏览器语言自动选择 |
| **GitHub 链接** | 顶栏 GitHub 图标 + 页脚「源码 / 作者 GitHub」，直达仓库与个人主页 |
| **滚动叙事** | 吸顶导航 + 滚动进度条；AI 制药流水线五关卡（标注 AI 参与度）、研发漏斗、宇宙人口普查 |
| **尊重"减少动态效果"** | 系统开启 *减少动态效果* 后，星空闪烁、扩散光环、自转结构、镜头飞行全部停下或改为硬切，但**信息一项不减**：星还是那么亮，结构还是那个结构 |

---

## 🗺 页面顺序

滚动一遍就是一条论证链：

| 顺序 | 章节 | 回答的问题 |
|---|---|---|
| 1 | 首屏 | 这一页在讲什么？ |
| 2 | 星系（`#cosmos`） | 化学空间长什么样？ |
| 3 | 五关卡流水线 | 一款药要过哪几关，AI 各帮多少忙？ |
| 4 | 研发漏斗 | 一万个分子最后剩下几个？ |
| 5 | 宇宙人口普查 | 这 600 颗星分别是什么成色？ |
| 6 | 短名单对比 | 候选之间差在哪？ |
| 7 | 打分沙盒 | 换个"好药"的定义，星系会怎么变？ |
| 8 | 里程碑时间轴 | 这三十年实际发生了什么？ |
| 9 | 方法说明 | 合成数据、隐喻布局、动画性质 |
| 10 | 边界声明 | 这个站**不能**用来做什么 |

第 7 章是整页的转折点：它让"打分函数"从抽象名词变成一个可以亲手拨动的东西——拨完你会看见，所谓"AI 认为这是好药"，其实是你刚选的那套权重在说话。

---

## 🧬 数据从哪来（重要声明）

**本项目不包含任何真实药物数据。**

- 全部 600 个分子由**确定性伪随机算法**在浏览器本地生成（固定种子，可复现）
- 分子量、logP、HBD/HBA 由原子组成按简化模型推导，**不是**真实化合物的实测值
- Lipinski 五规则是真实的教学规则（Lipinski et al., *Adv Drug Deliv Rev* 1997, 23(1):3–25）
- 10⁶⁰ 化学空间估计来自 Boháček, McMartin & Guida, *Med Res Rev* 1996, 16(1):3–50 —— 注意原文口径是「**≤30 个 C/N/O/S 原子的可能分子**」，不是「类药分子（<500 Da）」
- 研发漏斗数字为行业常引的示意口径（PhRMA 图表口径），**非精确统计**
- 3D 分子结构是随机树 + 弹簧松弛生成的**视觉化布局**，不是真实的构象计算

设计目的是**教学可视化**，不是药物设计工具。详见站点内「方法说明」与「边界声明」两节。

---

## 🛠 技术栈

| 层 | 选型 |
|---|---|
| 构建 | Vite 6 + TypeScript 5.6 |
| UI | React 18 |
| 3D | Three.js 0.169 + @react-three/fiber 8 + drei 9 |
| 星点渲染 | 自写 GLSL 着色器（双层核心/光晕、加色混合、闪烁） |
| 测试 | Vitest 2（107 个单元测试） |
| 样式 | 纯 CSS（5 套配色变量主题、玻璃拟态、霓虹光晕、无 UI 框架） |
| 国际化 | 自写轻量 i18n（`[zh, en]` 字典 + Context），无第三方依赖 |

**零后端、零真实数据、零外部 API**——全部在浏览器内确定性计算。

---

## 🚀 本地运行

```bash
git clone https://github.com/haomiaoyan/molcosmos.git
cd molcosmos
npm install
npm run dev        # http://localhost:5173
```

### 测试与构建

```bash
npm run test       # 107 个单元测试
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览构建产物 http://localhost:4173
```

> **Windows 用户注意**：本机 `vite build` 可能报
> `remove C:\Users\...\Temp\esbuild-xxx: Access is denied.`
> 这是 esbuild 清理系统临时目录时被权限拦截。把临时目录指到项目内即可：
>
> **PowerShell**
> ```powershell
> New-Item -ItemType Directory -Force .tmp-esbuild | Out-Null
> $env:TMP  = "$PWD\.tmp-esbuild"
> $env:TEMP = "$PWD\.tmp-esbuild"
> npm run build
> ```
>
> **Bash / Git Bash**
> ```bash
> mkdir -p .tmp-esbuild
> TMP="$PWD/.tmp-esbuild" TEMP="$PWD/.tmp-esbuild" npm run build
> ```
>
> `npm run dev` 与 `npm run test` 不受影响。

---

## 📁 项目结构

```
src/
├── lib/
│   ├── rng.ts            # 确定性随机数（LCG）+ FNV-1a 哈希
│   ├── molecule.ts       # 分子生成 / Lipinski / 类药打分 / 3D 布局
│   ├── molecule.test.ts  # 20 个单元测试
│   ├── weights.ts        # 打分权重：归一化 / 预设 / 编解码（沙盒用）
│   ├── weights.test.ts   # 13 个单元测试（含与旧公式逐值一致）
│   ├── galaxy.ts         # 三臂螺旋星系布局 / 探索批次生成 / 重打分缓存
│   ├── galaxy.test.ts    # 10 个单元测试
│   ├── heroMolecules.ts  # 首屏动画分子的投影几何（2D，不占 WebGL）
│   ├── heroMolecules.test.ts # 10 个单元测试（含每根键的朝向）
│   ├── motion.ts         # prefers-reduced-motion 的单一判定入口
│   ├── motion.test.ts    # 6 个单元测试
│   ├── pick.ts           # 屏幕空间最近点拾取（归一化坐标）
│   ├── pick.test.ts      # 7 个单元测试
│   ├── pick.scene.test.ts# 5 个端到端投影用例（真实相机）
│   ├── search.ts         # 编号 / 分子式 / 类别检索 + 键盘步进
│   ├── search.test.ts    # 12 个单元测试
│   ├── shortlist.ts      # 短名单持久化 + 分享链接
│   ├── shortlist.test.ts # 8 个单元测试
│   ├── urlState.ts       # ?star= / ?theme= / ?lang= 的读写与降级
│   ├── urlState.test.ts  # 14 个单元测试
│   ├── i18n.tsx          # 中英双语字典 + Provider + useI18n
│   └── theme.ts          # 5 套配色变量 + 持久化 + applyTheme
├── components/
│   ├── CosmosScene.tsx   # 3D 主场景：星点着色器、宜居带光环、尘埃层、选中标记
│   ├── CosmosControls.tsx# 搜索框 + 随机漫游
│   ├── TopnavTools.tsx   # 配色选择 / 语言切换 / GitHub 入口
│   ├── MoleculePanel.tsx # 分子详情面板 + 图例（可点击筛选）
│   ├── Shortlist.tsx     # 短名单浮层
│   ├── LabSection.tsx    # 打分沙盒：滑块 + 迷你星系 + 分布直方图
│   ├── CompareSection.tsx# 短名单对比：结构并排 + 雷达叠加 + 数值表
│   ├── TimelineSection.tsx # 里程碑时间轴（每条自带限定条件）
│   ├── HeroMolecule.tsx  # 首屏标题旁的动画分子（2D canvas）
│   ├── SceneBoundary.tsx # 3D 局部错误边界（降级为分子式）
│   ├── Hero.tsx          # 深空首屏
│   ├── Sections.tsx      # 流水线五关卡 / 研发漏斗 / 宇宙普查
│   └── Sections2.tsx     # 方法说明 / 边界声明 / 页脚 / 吸顶导航
├── config.ts             # 引用与文案配置
├── App.tsx               # 状态编排 + 深链 + 键盘 + 短名单
└── styles.css            # 深空主题全套样式
```

---

## ✅ 质量指标

- **107 / 107** 单元测试通过（10 个测试文件）
- TypeScript 严格模式零错误
- 生产构建约 1,084 KB（gzip ≈ 308 KB）
- 全部数据本地确定性生成，无网络请求

---

## 📚 参考

- Boháček, R. S., McMartin, C., & Guida, W. C. (1996). *The art and practice of structure-based drug design: a molecular modeling perspective.* Med Res Rev, 16(1), 3–50. — 10⁶⁰ 的口径是「≤30 个 C/N/O/S 原子的可能分子」，见该文图表注释。
- Lipinski, C. A., et al. (1997). *Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings.* Adv Drug Deliv Rev, 23(1–3), 3–25. — 注意 PubMed 索引的是 2001 年重印版（46(1–3):3–26），不是本篇。
- Jumper, J., et al. (2021). *Highly accurate protein structure prediction with AlphaFold.* Nature, 596(7873), 583–589. — CASP14 结果于 2020 年 11 月公布，论文 2021 年才正式发表；时间轴按「结果公布」标注。
- Exscientia / 住友大日本制药（2020-01-30）。DSP-1181 进入 I 期。 — 该分子 I 期后停止开发；「首个 AI 设计药物」是公司宣称而非学界公认，且其试验在日本开展、未在 ClinicalTrials.gov 注册。
- Insilico Medicine (2025). *A generative AI-designed TNIK inhibitor for idiopathic pulmonary fibrosis.* Nat Med, 31(8), 2602–2610. — rentosertib（ISM001-055）2a 期；试验由 Insilico 申办，论文作者多为该公司雇员，站点已如实标注。
- BenevolentAI (2023-05-25)。BEN-2293 IIa 期结果。 — 达到主要终点（安全性），但未达瘙痒与 EASI 疗效终点；公司表示不再投入。注意不要简化成「IIa 期失败」。

> 时间轴上的每一条都带着它自己的限定条件。这是刻意的：AI 制药的宣传语往往省略这些前提，把它们丢掉就等于替厂商说话。

---

## 📄 License

MIT
