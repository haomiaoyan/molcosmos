/**
 * Bilingual copy for MolCosmos.
 *
 * Every user-visible string lives here as a [zh, en] pair. Components never
 * hardcode copy: they call `t('some.key')`, so adding a third language later
 * means adding one more column, not hunting through JSX.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'zh' | 'en'

type Pair = readonly [zh: string, en: string]

const S = {
  /* ---------- app shell ---------- */
  'app.tagline': ['分子宇宙', 'Molecular Universe'],
  'app.subtitle': [
    '一粒药里的 AI：从 10⁶⁰ 个可能分子，到一片获批的药',
    'The AI inside a pill: from 10⁶⁰ possible molecules to one approved drug',
  ],
  'app.course': ['医学人工智能导论项目', 'Introduction to Medical AI · course project'],
  'app.description': [
    'MolCosmos 把 AI 制药要搜索的化学空间变成一片可以漫游的星系：每一颗星都是一个分子，亮度是它的类药潜力。缩放宇宙、点开星辰、亲手触发一次「生成式探索」。',
    'MolCosmos turns the chemical space that AI drug design searches into a galaxy you can roam: every star is a molecule, and its brightness is its drug-likeness. Zoom the universe, open a star, and run a generative exploration yourself.',
  ],

  /* ---------- navigation + tools ---------- */
  'nav.home': ['首页', 'Home'],
  'nav.pipeline': ['流水线', 'Pipeline'],
  'nav.funnel': ['漏斗', 'Funnel'],
  'nav.stats': ['普查', 'Census'],
  'nav.compare': ['对比', 'Compare'],
  'nav.lab': ['沙盒', 'Sandbox'],
  'nav.timeline': ['时间轴', 'Timeline'],
  'nav.method': ['方法', 'Method'],
  'nav.limits': ['边界', 'Limits'],
  'nav.label': ['页面导航', 'Page navigation'],
  'nav.github': ['GitHub 仓库', 'GitHub repository'],
  'nav.githubProfile': ['作者的 GitHub', "Author's GitHub"],
  'nav.theme': ['背景配色', 'Background theme'],
  'nav.lang': ['切换语言', 'Switch language'],

  /* ---------- themes ---------- */
  'theme.cosmos': ['深空', 'Deep space'],
  'theme.midnight': ['极夜', 'Polar night'],
  'theme.nebula': ['星云', 'Nebula'],
  'theme.abyss': ['深海', 'Abyss'],
  'theme.ember': ['余烬', 'Ember'],

  /* ---------- hero ---------- */
  'hero.eyebrow': ['纯前端 · 无真实数据', 'Front-end only · no real data'],
  'hero.title.l1': ['一粒药里的 AI：', 'The AI inside a pill:'],
  'hero.title.l2pre': ['从 ', 'from '],
  'hero.title.l2post': [' 个可能分子，', ' possible molecules,'],
  'hero.title.l3pre': ['到', 'to '],
  'hero.title.l3accent': ['一片获批的药', 'one approved drug'],
  'hero.title.l3post': ['。', '.'],
  'hero.lead': [
    '药物设计要搜索的化学空间大得没有物理意义。这个页面把其中 600 个合成分子排成一片星系，让你亲眼看到 AI 生成式模型「只探索宜居带」的直觉从何而来。',
    'Drug design has to search a chemical space so large that it stops being physically meaningful. This page arranges 600 synthetic molecules into a galaxy, so you can see for yourself where the intuition that a generative model “only explores the Goldilocks zone” comes from.',
  ],
  'hero.cta': ['进入分子宇宙', 'Enter the molecular universe'],
  'hero.cta2': ['触发一次生成式探索', 'Run a generative exploration'],
  'hero.f1.title': ['一片星系，一次讲清', 'One galaxy, one explanation'],
  'hero.f1.body': [
    '约 10⁶⁰ 个可能的小分子（含 ≤30 个 C/N/O/S 原子）构成的化学空间，画成一片三臂旋涡星系。每颗星都由固定种子确定性生成。',
    'The chemical space of roughly 10⁶⁰ possible small molecules (up to 30 C/N/O/S atoms), drawn as a three-armed spiral galaxy. Every star is generated deterministically from a fixed seed.',
  ],
  'hero.f2.title': ['亮度即类药潜力', 'Brightness is drug-likeness'],
  'hero.f2.body': [
    'AI 打分高的星更亮更大：分子量、logP、氢键、环系离口服药理想区越近，星光越盛。',
    'Stars the AI scores higher shine brighter and larger: the closer a molecule sits to the oral-drug sweet spot in weight, logP, hydrogen bonding and rings, the stronger its light.',
  ],
  'hero.f3.title': ['点开任何一颗星', 'Open any star'],
  'hero.f3.body': [
    '3D 球棍模型、性质雷达图、Lipinski 徽章——每个数字都来自你眼前这份代码，可以手算复核。',
    'A 3D ball-and-stick model, a property radar and Lipinski badges — every number comes from the code in front of you and can be recomputed by hand.',
  ],
  'hero.f4.title': ['五关卡，一条流水线', 'Five stages, one pipeline'],
  'hero.f4.body': [
    '靶点确认、虚拟筛选、分子生成、性质预测、临床试验——每一关都标出 AI 到底参与了多少，以及哪一关它还插不上手。',
    'Target ID, virtual screening, generation, property prediction, trials — each stage marks how much AI actually does, and where it still cannot help.',
  ],

  /* ---------- cosmos stage ---------- */
  'cosmos.eyebrow': ['主展览', 'Main exhibit'],
  'cosmos.title': ['分子宇宙', 'The molecular universe'],
  'cosmos.hint': [
    '点击任意星辰查看分子 · ← → 键逐个漫游 · 双击空白返回全景 · 紫色新星是「生成式探索」刚采样的候选',
    'Click any star to inspect it · ← → to walk the catalogue · double-click empty space to reset · violet stars are fresh generative samples',
  ],
  'cosmos.explore': ['触发生成式探索', 'Run a generative exploration'],

  /* ---------- search ---------- */
  'search.placeholder': ['搜索编号 / 分子式 / 类别', 'Search id / formula / class'],
  'search.aria': ['搜索分子', 'Search molecules'],
  'search.diceTitle': ['随机漫游到一个分子', 'Jump to a random molecule'],
  'search.diceAria': ['随机漫游', 'Random molecule'],
  'search.results': ['搜索结果', 'Search results'],
  'search.why.id': ['编号', 'id'],
  'search.why.formula': ['分子式', 'formula'],
  'search.why.class': ['类别', 'class'],

  /* ---------- molecule panel ---------- */
  'panel.aria': ['分子 {id} 详情', 'Details for molecule {id}'],
  'panel.close': ['关闭详情', 'Close details'],
  'panel.save': ['☆ 收藏', '☆ Save'],
  'panel.saved': ['★ 已收藏', '★ Saved'],
  'panel.saveTitle': ['加入短名单', 'Add to shortlist'],
  'panel.unsaveTitle': ['移出短名单', 'Remove from shortlist'],
  'panel.share': ['⧉ 复制链接', '⧉ Copy link'],
  'panel.shareTitle': ['复制这个分子的链接', 'Copy a link to this molecule'],
  'panel.fallback': [
    '当前设备无法渲染 3D 结构，性质数据不受影响',
    'This device cannot render the 3D structure; the property data is unaffected',
  ],
  'panel.hint': [
    '合成示例分子 · 球棍模型为示意布局，非真实构象',
    'Synthetic sample · illustrative layout only',
  ],
  'panel.score': ['类药潜力', 'Drug-likeness'],
  'panel.scoreAria': ['类药潜力 {pct}%', 'Drug-likeness {pct}%'],
  'panel.generated': ['生成式采样', 'Generative sample'],
  'panel.lipinskiClean': ['Lipinski 全通过 ✓', 'Passes all of Lipinski ✓'],
  'panel.radarAria': ['性质雷达图', 'Property radar chart'],
  'panel.axis.mw': ['分子量', 'MW'],
  'panel.axis.logP': ['logP', 'logP'],
  'panel.axis.hbd': ['供体', 'HBD'],
  'panel.axis.hba': ['受体', 'HBA'],
  'panel.axis.rings': ['环数', 'Rings'],
  'panel.prop.mw': ['分子量', 'Molecular weight'],
  'panel.prop.logP': ['logP（估计）', 'logP (est.)'],
  'panel.prop.hb': ['氢键供体/受体', 'H-bond donors / acceptors'],
  'panel.prop.rings': ['环系', 'Ring systems'],
  'panel.disclaimer': [
    '本分子由固定种子确定性生成，性质为教学近似估计，不代表任何真实化合物。',
    'This molecule is generated deterministically from a fixed seed; its properties are teaching-grade approximations and do not represent any real compound.',
  ],

  /* ---------- legend ---------- */
  'legend.aria': ['星等图例', 'Star legend'],
  'legend.hint': [
    '双击空白处返回全景 · 所有星辰都可点击查看分子',
    'Double-click empty space to reset · every star is clickable',
  ],
  'legend.generated': ['紫色 = 生成式探索采样的候选', 'Violet = candidates sampled by the generative exploration'],
  'legend.only': ['只高亮{label}', 'Highlight only {label}'],
  'legend.clear': ['取消高亮', 'Clear highlight'],

  /* ---------- molecule classes ---------- */
  'class.goldilocks': ['宜居带分子', 'Goldilocks'],
  'class.candidate': ['候选分子', 'Candidate'],
  'class.lead': ['先导分子', 'Lead'],
  'class.far': ['偏远分子', 'Outlier'],

  /* ---------- shortlist ---------- */
  'short.title': ['我收藏的分子', 'My saved molecules'],
  'short.label': ['短名单', 'Shortlist'],
  'short.empty': [
    '在分子详情里点 ☆ 收藏，方便回头对比。收藏保存在本机，刷新不会丢。',
    'Hit ☆ Save in a molecule panel to keep it for comparison. Saved on this device, so it survives a reload.',
  ],
  'short.view': ['查看 {id}', 'View {id}'],
  'short.remove': ['从短名单移除 {id}', 'Remove {id} from the shortlist'],
  'short.removeTitle': ['移出短名单', 'Remove from shortlist'],
  'short.clear': ['清空短名单', 'Clear shortlist'],

  /* ---------- toast ---------- */
  'toast.copied': ['已复制 {id} 的链接', 'Copied the link for {id}'],

  /* ---------- pipeline ---------- */
  'pipeline.eyebrow': ['AI 制药流水线', 'The AI drug-design pipeline'],
  'pipeline.title.pre': ['一粒药要经过的', 'Every pill passes '],
  'pipeline.title.accent': ['五道关卡', 'five gates'],
  'pipeline.lead': [
    '「AI 制药」不是一个岗位，而是流水线上的五份工作。每一站，AI 的参与度不同——有的站它只是助手，有的站它就是主角。',
    '“AI drug design” is not one job but five on an assembly line. AI plays a different role at each station — sometimes an assistant, sometimes the lead.',
  ],
  'pipeline.s1.title': ['靶点确认', 'Target validation'],
  'pipeline.s1.body': [
    '疾病相关的蛋白被确定为靶点。AI 在这里的作用有限——靶点是否「成药」仍取决于生物学证据。',
    'A protein implicated in a disease is nominated as a target. AI can only help so much here: whether a target is druggable is still a question for biology.',
  ],
  'pipeline.s1.ai': ['辅助', 'Assistant'],
  'pipeline.s2.title': ['虚拟筛选', 'Virtual screening'],
  'pipeline.s2.body': [
    '在数百万个化合物库里搜索能结合靶点的分子。这是暴力枚举：化学空间有约 10⁶⁰ 个可能的小分子，能筛的不到一亿分之一。',
    'Search libraries of millions of compounds for molecules that bind the target. This is brute force: the space holds about 10⁶⁰ possible small molecules, and even a huge screen touches less than one part in a hundred million.',
  ],
  'pipeline.s2.ai': ['主力', 'Workhorse'],
  'pipeline.s3.title': ['分子生成', 'Molecule generation'],
  'pipeline.s3.body': [
    '生成式模型不再等人类合成分子，而是直接「画」出新结构——在化学空间里，它只探索宜居带附近，而不是整个宇宙。',
    'Generative models stop waiting for humans to synthesise molecules and draw new structures directly — inside the chemical space they explore near the Goldilocks zone, not the whole universe.',
  ],
  'pipeline.s3.ai': ['主角登场', 'Star of the show'],
  'pipeline.s4.title': ['性质预测', 'Property prediction'],
  'pipeline.s4.body': [
    '预测吸收、代谢、毒性（ADMET）。上方的类药打分就是这一站的极简版：分子量、logP、氢键、环系离理想区多远。',
    'Predict absorption, metabolism and toxicity (ADMET). The drug-likeness score above is a minimal version of this station: how far weight, logP, hydrogen bonding and ring count sit from the ideal.',
  ],
  'pipeline.s4.ai': ['主力', 'Workhorse'],
  'pipeline.s5.title': ['合成与临床', 'Synthesis & trials'],
  'pipeline.s5.body': [
    'AI 认为好的分子还要真的造得出来、过得临床试验。漏斗在这里最陡：数以千计的候选，最终获批的常常只有一个。',
    'A molecule the AI likes still has to be makeable and survive clinical trials. The funnel is steepest here: thousands of candidates, usually exactly one approval.',
  ],
  'pipeline.s5.ai': ['人的战场', 'Human territory'],

  /* ---------- funnel ---------- */
  'funnel.eyebrow': ['研发漏斗', 'The discovery funnel'],
  'funnel.title.pre': ['一万个候选，', 'Ten thousand candidates, '],
  'funnel.title.accent': ['一个赢家', 'one winner'],
  'funnel.lead': [
    '从筛选到获批，每一步都在淘汰。AI 制药的全部 promise，就是把这条漏斗的每一层「收窄得慢一点」。',
    'Every step from screen to approval eliminates more. The whole promise of AI drug design is to make each layer of this funnel narrow a little more slowly.',
  ],
  'funnel.t1.label': ['筛选化合物', 'Screened compounds'],
  'funnel.t1.note': ['虚拟筛选 + 高通量筛选', 'Virtual + high-throughput screening'],
  'funnel.t2.label': ['进入临床前', 'Enter pre-clinical'],
  'funnel.t2.note': ['ADMET 预测 + 结构优化', 'ADMET prediction + optimisation'],
  'funnel.t3.label': ['进入临床试验', 'Enter clinical trials'],
  'funnel.t3.note': ['IND 申报后的人体试验', 'Human trials after an IND filing'],
  'funnel.t4.label': ['获批上市', 'Approved'],
  'funnel.t4.note': ['10,000 : 1 的终点', 'the end of a 10,000 : 1 road'],
  'funnel.caption': [
    '数字为行业常引示意口径（PhRMA 经典图表），演示用途，非任何单一项目真实数据。',
    'Figures follow the usual illustrative industry convention (PhRMA’s classic chart), for demonstration only — not real data from any single programme.',
  ],

  /* ---------- census ---------- */
  'stats.eyebrow': ['宇宙普查', 'Universe census'],
  'stats.title.pre': ['这片宇宙的', 'A census of '],
  'stats.title.accent': ['人口普查', 'this universe'],
  'stats.lead': [
    '600 颗星，四类分子。宜居带分子只占极少数——这就是为什么 AI 不会「随机抽一个分子试试」，而是要学着往亮的地方走。',
    '600 stars, four classes. Goldilocks molecules are a small minority — which is exactly why AI does not “pick a molecule at random and try it”, but learns to walk towards the light.',
  ],
  'stats.goldilocks.body': [
    '性质贴近口服药理想区：分子量适中、logP 温和、氢键不多不少。',
    'Close to the oral-drug sweet spot: moderate weight, gentle logP, neither too many nor too few hydrogen bonds.',
  ],
  'stats.candidate.body': [
    '有希望的结构：大体合规，个别性质需要优化。',
    'A promising structure: broadly compliant, with one or two properties still to optimise.',
  ],
  'stats.lead.body': [
    '离理想区较远，但骨架值得继续改造。',
    'Further from the ideal zone, but the scaffold is worth developing.',
  ],
  'stats.far.body': [
    '偏远地带：太大、太油或太极端，几乎不可能成药。',
    'The outer reaches: too large, too greasy or too extreme — very unlikely to become a drug.',
  ],

  /* ---------- method ---------- */
  'method.eyebrow': ['方法说明', 'How it works'],
  'method.title.pre': ['这片宇宙是', 'How this universe '],
  'method.title.accent': ['怎么算出来的', 'is computed'],
  'method.lead': [
    '页面上每一个数字都可以复核。这里列出全部计算口径——课程演示用，不是任何真实药物研发的复现。',
    'Every number on this page can be recomputed. Here are all the conventions — for a course demo, not a reproduction of any real drug programme.',
  ],
  'method.m1.title': ['分子从哪来', 'Where the molecules come from'],
  'method.m1.body': [
    '600 个分子全部由固定种子的伪随机数生成器（LCG）确定性生成。同一种子永远得到同一片宇宙——这既是为了测试可复现，也是为了让每个访客看到同一片星空。',
    'All 600 molecules are generated deterministically by a fixed-seed linear congruential generator. The same seed always yields the same universe — that keeps the tests reproducible and lets every visitor see the same sky.',
  ],
  'method.m2.title': ['性质怎么算', 'How properties are computed'],
  'method.m2.body': [
    '分子量 = 重原子数 × 原子量 + 氢；logP 用「碳增油、杂原子减油」的线性近似；氢键供受体由 N/O/S 计数导出。全部是教学级近似，不是力场或量子化学。',
    'Molecular weight = heavy atoms × atomic mass + hydrogens; logP uses a linear “carbons are greasy, heteroatoms are not” approximation; hydrogen-bond donors and acceptors are derived from N/O/S counts. All teaching-grade approximations, not a force field or quantum chemistry.',
  ],
  'method.m3.title': ['「类药潜力」是什么', 'What “drug-likeness” means'],
  'method.m3.body': [
    '五个高斯项的加权和：分子量 ≈ 350、logP ≈ 2.5、HBD ≈ 2、HBA ≈ 5、环数 ≈ 3 的分子得 1 分，离得越远衰减越快。它衡量的是「离理想区多近」，不是「有没有药效」。',
    'A weighted sum of five Gaussian terms: a molecule at weight ≈ 350, logP ≈ 2.5, HBD ≈ 2, HBA ≈ 5 and rings ≈ 3 scores 1, decaying quickly with distance. It measures how close a molecule sits to the ideal zone, not whether it works as a drug.',
  ],
  'method.m4.title': ['3D 结构是什么', 'What the 3D structure is'],
  'method.m4.body': [
    '球棍模型由「随机生成树 + 环闭合 + 24 轮弹簧松弛」的示意布局算法产生，视觉上像有机分子，但不是任何真实构象搜索的结果。',
    'The ball-and-stick model comes from an illustrative “random tree + ring closure + 24 rounds of spring relaxation” layout. It looks like an organic molecule, but it is not the result of any real conformational search.',
  ],

  /* ---------- limits ---------- */
  'limits.eyebrow': ['边界声明', 'Limits'],
  'limits.title.pre': ['这个工具', 'What this tool '],
  'limits.title.accent': ['不能', 'cannot'],
  'limits.title.post': ['告诉你什么', ' tell you'],
  'limits.l1.strong': ['合成数据。', 'Synthetic data.'],
  'limits.l1.body': [
    '所有分子、性质、结构均为教学近似，不对应任何真实化合物或实验测量。',
    'Every molecule, property and structure is a teaching approximation; none corresponds to a real compound or a measured value.',
  ],
  'limits.l2.strong': ['非临床证据。', 'Not clinical evidence.'],
  'limits.l2.body': [
    '「类药潜力」不预测药效、毒性或任何临床结局；Lipinski 规则也只是经验启发式，例外比比皆是。',
    '“Drug-likeness” predicts no efficacy, toxicity or clinical outcome; Lipinski’s rules are rules of thumb with plenty of exceptions.',
  ],
  'limits.l3.strong': ['布局是隐喻。', 'The layout is a metaphor.'],
  'limits.l3.body': [
    '星系位置由索引决定而非分子性质——化学空间的真实「距离」要用分子指纹或结构相似度衡量，这里没有做。',
    'A star’s position comes from its index, not its properties — real distance in chemical space needs molecular fingerprints or structural similarity, which this page does not compute.',
  ],
  'limits.l4.strong': ['生成式探索是动画。', 'The generative exploration is an animation.'],
  'limits.l4.body': [
    '「触发探索」展示的是生成式模型采样行为的示意，没有真实模型在本页运行。',
    '“Run exploration” illustrates how a generative model samples; no real model runs on this page.',
  ],

  /* ---------- weight sandbox (#lab) ---------- */
  'lab.eyebrow': ['调参沙盒', 'Weight sandbox'],
  'lab.title.pre': ['换个权重，', 'Change the weights, '],
  'lab.title.accent': ['整片星系重排', 'and the galaxy re-sorts'],
  'lab.lead': [
    '分数是五个高斯的加权和。拖动滑块，看同一批分子在不同「什么算好药」的定义下如何升降——上面的星系会实时跟着变。',
    'The score is a weighted sum of five Gaussians. Drag a slider and watch the same molecules rise or fall under a different definition of “a good drug” — the galaxy above follows in real time.',
  ],
  'lab.weights': ['权重', 'Weights'],
  'lab.sum': ['原始和 {sum}% → 已归一化到 100%', 'Raw sum {sum}% → normalised to 100%'],
  'lab.normalized': ['已归一化', 'Normalised'],
  'lab.reset': ['恢复默认', 'Reset to default'],
  'lab.preset': ['预设', 'Presets'],
  'lab.preset.default': ['默认', 'Default'],
  'lab.preset.weightOnly': ['只看分子量', 'Weight only'],
  'lab.preset.lipophilicityOnly': ['只看亲脂性', 'Lipophilicity only'],
  'lab.custom': ['自定义权重', 'Custom weights'],
  'lab.term.mw': ['分子量', 'Molecular weight'],
  'lab.term.logP': ['亲脂性 logP', 'Lipophilicity (logP)'],
  'lab.term.hbd': ['氢键供体', 'H-bond donors'],
  'lab.term.hba': ['氢键受体', 'H-bond acceptors'],
  'lab.term.rings': ['环系数', 'Ring count'],
  'lab.ideal': ['理想 {ideal} ± {width}', 'Ideal {ideal} ± {width}'],
  'lab.distribution': ['当前权重下的四类人口', 'Class population under these weights'],
  'lab.best': ['当前最高分', 'Current top score'],
  'lab.mean': ['平均分', 'Mean score'],
  'lab.delta': ['相对默认：{delta}', 'vs. default: {delta}'],
  'lab.deltaNone': ['与默认一致', 'Identical to default'],
  'lab.note': [
    '注意：权重变了，分子的物理性质一点没变——变的只是「我们认为什么重要」。这正是打分函数里的价值判断。',
    'Note: the molecules’ physical properties do not change at all — only what we decide to value. That value judgement is the whole point of a scoring function.',
  ],
  'lab.aria': ['调整打分权重', 'Adjust scoring weights'],

  /* ---------- compare (#compare) ---------- */
  'compare.eyebrow': ['并排对比', 'Side by side'],
  'compare.title.pre': ['把候选分子', 'Put the candidates '],
  'compare.title.accent': ['摆在一起看', 'next to each other'],
  'compare.lead': [
    '从短名单里勾选最多三颗分子，叠加它们的性质雷达图，逐行对比每一项指标。',
    'Tick up to three molecules from your shortlist to overlay their property radar and compare every metric row by row.',
  ],
  'compare.empty': [
    '短名单还是空的。回到星系点开任意一颗星，用「收藏」把它加进来。',
    'Your shortlist is empty. Open any star in the galaxy and add it with “Save”.',
  ],
  'compare.needTwo': [
    '再选一颗就能开始对比。',
    'Pick one more to start comparing.',
  ],
  'compare.pick': ['选择分子', 'Choose molecules'],
  'compare.limit': ['最多同时对比 3 颗', 'Up to 3 at a time'],
  'compare.selected': ['已选 {count}/3', 'Selected {count}/3'],
  'compare.radarAria': ['所选分子的性质雷达图叠加', 'Overlaid property radar for the selected molecules'],
  'compare.table': ['性质对比', 'Property comparison'],
  'compare.metric': ['指标', 'Metric'],
  'compare.row.mw': ['分子量', 'Molecular weight'],
  'compare.row.logP': ['logP', 'logP'],
  'compare.row.hbd': ['氢键供体', 'H-bond donors'],
  'compare.row.hba': ['氢键受体', 'H-bond acceptors'],
  'compare.row.rings': ['环数', 'Rings'],
  'compare.row.score': ['类药潜力', 'Drug-likeness'],
  'compare.row.class': ['分类', 'Class'],
  'compare.best': ['本行最优', 'Best in row'],
  'compare.structures': ['结构并排', 'Structures side by side'],
  'compare.clear': ['清空选择', 'Clear selection'],

  /* ---------- timeline (#timeline) ---------- */
  'timeline.eyebrow': ['里程碑', 'Milestones'],
  'timeline.title.pre': ['三十年，', 'Thirty years, '],
  'timeline.title.accent': ['从数得清到算得动', 'from countable to computable'],
  'timeline.lead': [
    'AI 制药不是突然出现的。它站在两个更早的成果上：先有人算清了化学空间有多大，再有人定下了「什么样的分子像药」。',
    'AI drug discovery did not appear from nowhere. It stands on two earlier results: someone worked out how big the chemical space is, and someone defined what makes a molecule drug-like.',
  ],
  'timeline.1996.year': ['1996', '1996'],
  'timeline.1996.title': ['化学空间有多大', 'How large is chemical space'],
  'timeline.1996.body': [
    'Boháček、McMartin 与 Guida 估计：由不超过 30 个 C/N/O/S 原子构成的可能分子超过 10⁶⁰ 个。这个数字后来被反复引用，也常被转述成「类药分子」。',
    'Boháček, McMartin and Guida estimated that more than 10⁶⁰ possible molecules can be built from at most 30 C/N/O/S atoms. The number is quoted constantly — and often misquoted as “drug-like molecules”.',
  ],
  'timeline.1997.year': ['1997', '1997'],
  'timeline.1997.title': ['类药五规则', 'The Rule of Five'],
  'timeline.1997.body': [
    'Lipinski 提出四条经验规则，用来在计算阶段就筛掉大概率不能口服吸收的分子。至今仍是每个化学信息学工具的默认起手式。',
    'Lipinski set out four rules of thumb for filtering out molecules unlikely to be orally absorbed, before any assay is run. They are still the default first move in every cheminformatics toolkit.',
  ],
  'timeline.2020a.year': ['2020.01', 'Jan 2020'],
  'timeline.2020a.title': ['第一颗 AI 设计的分子进临床', 'The first AI-designed molecule enters trials'],
  'timeline.2020a.body': [
    '住友大日本制药与 Exscientia 宣布 DSP-1181 在日本进入 I 期。12 个月从立项到临床前候选是当时的速度纪录。需要说明：「首个」是公司宣称，且该分子在 I 期后停止了开发。',
    'Sumitomo Dainippon Pharma and Exscientia announced that DSP-1181 had entered Phase I in Japan — 12 months from project start to preclinical candidate. Two caveats: “first” is a company claim, and the compound was discontinued after Phase I.',
  ],
  'timeline.2020b.year': ['2020.11', 'Nov 2020'],
  'timeline.2020b.title': ['AlphaFold2 改写结构预测', 'AlphaFold2 rewrites structure prediction'],
  'timeline.2020b.body': [
    'CASP14 结果于 2020 年 11 月 30 日公布，AlphaFold2 的预测精度接近实验方法。方法论文 2021 年发表于 Nature（596 卷，583–589 页）。',
    'CASP14 results were released on 30 November 2020: AlphaFold2 came close to experimental accuracy. The method paper appeared in Nature in 2021 (vol. 596, pp. 583–589).',
  ],
  'timeline.2025.year': ['2025', '2025'],
  'timeline.2025.title': ['AI 设计的药走到临床 II 期', 'An AI-designed drug reaches Phase II'],
  'timeline.2025.body': [
    'Insilico Medicine 的 rentosertib 用于特发性肺纤维化，随机 2a 期结果 2025 年发表于 Nature Medicine。这是目前走得最远的 AI 原研分子之一——但仍不是获批药物。',
    'Insilico Medicine’s rentosertib, for idiopathic pulmonary fibrosis, reported randomised Phase 2a results in Nature Medicine in 2025 — one of the furthest-advanced AI-originated molecules, though still not an approved drug.',
  ],
  'timeline.disclaimer.title': ['关于这些说法', 'On these claims'],
  'timeline.disclaimer.body': [
    '「首个」是公司宣称而非公认；DSP-1181 的试验在日本开展，未在 ClinicalTrials.gov 注册。rentosertib 的 2a 期由 Insilico 申办，论文 11 位作者为该公司雇员。时间轴只陈述公开记录，不推断 AI 与成败之间的因果。',
    '“First” is a company claim, not a consensus; DSP-1181’s trial ran in Japan and is not registered on ClinicalTrials.gov. Insilico sponsored the rentosertib Phase 2a, and 11 of the paper’s authors are company employees. The timeline states the public record only and infers no causal link between AI and either success or failure.',
  ],

  /* ---------- footer ---------- */
  'footer.line1': [
    'MolCosmos · 分子宇宙 —— 医学人工智能导论课程项目。纯前端、无追踪、无真实医药数据。',
    'MolCosmos · Molecular Universe — Introduction to Medical AI course project. Front-end only, no tracking, no real pharmaceutical data.',
  ],
  'footer.line2': [
    '参考文献：Boháček et al. 1996（≤30 个 C/N/O/S 原子的分子数估计）；Lipinski et al. 1997（Rule of Five）；PhRMA 药物研发漏斗示意口径。',
    'References: Boháček et al. 1996 (the estimate for molecules with up to 30 C/N/O/S atoms); Lipinski et al. 1997 (Rule of Five); PhRMA’s classic drug-discovery funnel for the illustrative figures.',
  ],
  'footer.source': ['源码', 'Source'],
  'footer.author': ['作者 GitHub', 'GitHub'],

  /* ---------- citations ---------- */
  'cite.chemicalSpace': [
    'Boháček R. S., McMartin C., Guida W. C., “The art and practice of structure-based drug design: a molecular modeling perspective”, Med. Res. Rev., 1996, 16(1): 3–50（估计含 ≤30 个 C/N/O/S 原子的可能分子超过 10⁶⁰ 个）',
    'Boháček R. S., McMartin C., Guida W. C., “The art and practice of structure-based drug design: a molecular modeling perspective”, Med. Res. Rev., 1996, 16(1): 3–50 (estimates more than 10⁶⁰ possible molecules with up to 30 C/N/O/S atoms)',
  ],
  'cite.lipinski': [
    'Lipinski C. A. et al., “Experimental and computational approaches to estimate solubility and permeability in drug discovery”, Adv. Drug Deliv. Rev., 1997, 23(1–3): 3–25',
    'Lipinski C. A. et al., “Experimental and computational approaches to estimate solubility and permeability in drug discovery”, Adv. Drug Deliv. Rev., 1997, 23(1–3): 3–25',
  ],
  'cite.funnel': [
    '药物研发漏斗各层数字为行业常引示意口径（如 PhRMA 绘制的经典图表：约 5,000–10,000 个筛选化合物 → 约 250 个进入临床前 → 约 5 个进入临床试验 → 1 个获批），课程演示用途，非任何单一企业的真实数据',
    'Funnel figures are illustrative industry conventions (as in PhRMA’s classic chart: roughly 5,000–10,000 screened compounds → about 250 entering pre-clinical → about 5 entering clinical trials → 1 approval), for course demonstration only — not any single company’s real data.',
  ],
} as const satisfies Record<string, Pair>

export type StringKey = keyof typeof S

export const LANG_KEY = 'molcosmos.lang.v1'

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

export function translate(
  key: StringKey,
  lang: Lang,
  vars?: Record<string, string | number>,
): string {
  const pair = S[key]
  return interpolate(pair[lang === 'en' ? 1 : 0], vars)
}

export function loadLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY)
    if (stored === 'zh' || stored === 'en') return stored
  } catch {
    /* private mode or blocked storage: fall through to the browser hint */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')
    ? 'en'
    : 'zh'
}

export function saveLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* saving is a convenience; never let it break the page */
  }
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: StringKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue>({
  lang: 'zh',
  setLang: () => {},
  toggleLang: () => {},
  t: (key, vars) => translate(key, 'zh', vars),
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang())

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === 'zh' ? 'en' : 'zh'
      saveLang(next)
      return next
    })
  }, [])

  // Keep the document itself in the chosen language: screen readers, hyphenation
  // and the browser's own translate prompt all key off these.
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    document.title =
      lang === 'en'
        ? 'MolCosmos · Molecular Universe — roaming the chemical space of AI drug design'
        : 'MolCosmos · 分子宇宙 —— AI 制药的化学空间漫游'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', translate('app.description', lang))
  }, [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: (key, vars) => translate(key, lang, vars),
    }),
    [lang, setLang, toggleLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}
