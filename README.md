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

- 可药化学空间约有 **10⁶⁰** 个候选分子（Boháček et al., 1996 的经典估计）——宇宙里的星星，就是这个空间的一个采样
- 每颗星的位置由分子的**亲脂性 / 分子量 / 极性表面积**决定，颜色由 **Lipinski 类药五规则**的打分决定
- 星系中央的金色光环是**"宜居带"**——口服药最可能活下来的性质区间
- 点开任意一颗星，能看到它的 3D 球棍结构、五维性质雷达图、以及逐条对照的 Lipinski 规则

**核心主张**：AI 制药不是"算出正确的分子"，而是在一个天文数字级的空间里做**有偏好的采样**——偏好来自打分函数，而打分函数来自我们目前对"什么是好药"的理解。

---

## 🎮 交互功能

| 功能 | 说明 |
|---|---|
| **3D 星系漫游** | 鼠标拖拽旋转、滚轮缩放，双击空白处返回全景；星辰持续闪烁脉动 |
| **点击星辰** | 镜头平滑飞行聚焦，右侧滑出分子详情面板 |
| **分子详情** | 自转 3D 球棍模型（C/N/O/S 按元素配色）、五维雷达图、类药潜力进度条、Lipinski 徽章（违规项红色高亮） |
| **触发生成式探索** | 在"宜居带"附近批量点亮紫色新星，模拟生成模型只探索有希望的区域（最多保留最近两批 26 颗作为尾迹） |
| **深链分享** | `?star=MCX-000123` 直接定位到某个分子，便于课堂演示或作业展示 |
| **滚动叙事** | 吸顶导航 + 滚动进度条；AI 制药流水线五关卡（标注 AI 参与度）、研发漏斗、宇宙人口普查 |

---

## 🧬 数据从哪来（重要声明）

**本项目不包含任何真实药物数据。**

- 全部 600 个分子由**确定性伪随机算法**在浏览器本地生成（固定种子，可复现）
- 分子量、logP、HBD/HBA 由原子组成按简化模型推导，**不是**真实化合物的实测值
- Lipinski 五规则是真实的教学规则（Lipinski et al., *Adv Drug Deliv Rev* 1997, 23(1):3–25）
- 10⁶⁰ 化学空间估计来自 Boháček et al., 1996
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
| 测试 | Vitest 2（28 个单元测试） |
| 样式 | 纯 CSS（深空主题、玻璃拟态、霓虹光晕、无 UI 框架） |

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
npm run test       # 28 个单元测试
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
│   ├── galaxy.ts         # 三臂螺旋星系布局 / 探索批次生成
│   └── galaxy.test.ts    # 8 个单元测试
├── components/
│   ├── CosmosScene.tsx   # 3D 主场景：星点着色器、宜居带光环、尘埃层
│   ├── MoleculePanel.tsx # 分子详情面板 + 图例
│   ├── Hero.tsx          # 深空首屏
│   ├── Sections.tsx      # 流水线五关卡 / 研发漏斗 / 宇宙普查
│   └── Sections2.tsx     # 方法说明 / 边界声明 / 页脚 / 吸顶导航
├── config.ts             # 引用与文案配置
├── App.tsx               # 状态编排 + 深链
└── styles.css            # 深空主题全套样式
```

---

## ✅ 质量指标

- **28 / 28** 单元测试通过
- TypeScript 严格模式零错误
- 生产构建 993 KB（gzip ≈ 278 KB）
- 全部数据本地确定性生成，无网络请求

---

## 📚 参考

- Boháček, R. S., et al. (1996). *The art and practice of structure-based drug design: a molecular modeling perspective.* Med Res Rev.
- Lipinski, C. A., et al. (1997). *Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings.* Adv Drug Deliv Rev, 23(1), 3–25.

---

## 📄 License

MIT
