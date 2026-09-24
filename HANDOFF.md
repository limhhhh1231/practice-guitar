# 一起练琴吧：项目交接

更新：2026-09-24。用户已确认 **Studio Green 绿色版为后续主版本** 并授权发布到现有 GitHub 仓库。以下当前入口与维护规则优先于后面的历史记录。

## 当前入口与维护规则

- 工作区：`/Users/xiejialin_1/Documents/Codex/2026-09-12/logo-logo-md`。
- **唯一主源码入口：`green-ui/index.html`，模块在 `green-ui/`。**
- **根目录 `index.html` 现为发布构建产物，不再是源码。** 不要直接修改任何发布 HTML。
- 构建命令：`node scripts/build.cjs`，内部调用 `green-ui/build.cjs`；任意工作目录均可运行该脚本的绝对路径。
- 同步生成四个内容相同的入口：根 `index.html`、`outputs/fretboard-lab-green.html`、`outputs/fretboard-lab.html`、`publish/index.html`。用户当前书签仍有效。
- 构建内联 JS、CSS 和音色，复制采样许可至各入口对应的 `assets/ATTRIBUTION.md`。
- `assets/*.js`、`assets/*.css` 保留为旧版遗留，**不是当前运行/测试数据源**；以后不要只修改这些旧文件。
- 原橙色版可从 Git 提交 `b33edbb` 恢复。用户先前“不改原版”的约束已由本次“绿色版为主并发布”的明确指示更新。
- `.DS_Store` 已忽略，不提交个人缓存、凭据和无关文件。

## 当前功能与源码地图

五个菜单：和弦琶音练习、吉他律动生成器、听感练习、指板知识、常用和弦指型。

| 路径（均相对 green-ui/） | 职责 |
| --- | --- |
| `index.html` | 页面结构、琶音/动机、导航、空格播放停止 |
| `green-ui.css` / `green-ui.js` | 绿色外观、推子读数、折叠菜单图标 |
| `groove-engine.js` | 共用调式、和声、六弦位置、节奏时值、鼓组及 Swing 时间逻辑 |
| `practice-catalog.js` | 共用 10 种调式、风格、节奏名称及音级标签 |
| `groove-app.js` / `groove.css` | 律动设置、模进、日课、阶梯、循环、音频和专注 |
| `ear-engine.js` | 1–8 音生成、节奏数量约束、音域、时间线 |
| `ear-audio.js` | 听感独立音频状态、采样、定次循环、停止令牌 |
| `ear-app.js` / `ear.css` | 听感界面、调性隐藏、答案、六弦位置 |
| `fretboard-knowledge.js` / `.css` | 音程、协和标签、典型结构与手动弦组 |
| `chord-shapes.js` / `.css` | CAGED、书页式和弦图、特殊和弦 |
| `sample-bank.js` / `assets/ATTRIBUTION.md` | 内嵌真实音色及来源许可，勿丢失署名 |
| `build.cjs` | 从主源码生成全部发布入口 |

主色 `#35CE68`；根音蓝色，和弦音浅绿；品牌 B 款实心原声吉他为 `#102719`。桌面侧栏固定可收起，iPad 触控和清晰谱面是重点。三个相关工具默认 Ionian 大调，读取同一音阶数据；五声/Blues 七和弦使用引擎母调规则，并标注。

标准调弦从 1 到 6 弦为 E4 B3 G3 D3 A2 E2（MIDI 64/59/55/50/45/40），五弦一品 B♭、三品 C。保持根音、音级、弦品正确性。不要用四弦贝斯结构替代吉他。

## 检查与设备验收

在项目根目录运行：

```sh
node tests/groove-engine.test.cjs
node tests/practice-playback.test.cjs
node tests/arpeggio-board.test.cjs
node tests/chord-shapes.test.cjs
node tests/fretboard-knowledge.test.cjs
node tests/ear-training.test.cjs
node scripts/build.cjs
git diff --check
```

以上测试已改为针对 green-ui 主源码。听感测试包括 6720 组生成、960 组琶音渲染、鼓组、时值、循环和异步停止。实际桌面/iPad 渲染、触控和音频听感仍需设备验收；之前本地浏览器自动预览遭策略拦截，不能将 Node 测试等同于听音。

测试流程：听感菜单 → 默认 4 音/80 BPM/3 遍 → 检查三遍后停止 → 隐藏调性 → 重听 → 揭晓简谱/节奏/六弦位置；更改调式后生成新题。具体步骤见 `green-ui/README.md`。

## 浏览器数据与发布

- 仓库：`https://github.com/limhhhh1231/practice-guitar.git`，分支 `main`；Pages 现有入口：`https://limhhhh1231.github.io/practice-guitar/`，根目录首页。
- 绿色版收藏/预设键：`guitarGrooveGreenFavorites`、`guitarGrooveGreenProject`；旧版键保留，不自动覆盖或迁移。本地 file 与线上 HTTPS 的浏览器存储不互通；发布不会上传浏览器收藏。
- 回滚基线：本次发布前远程 `main` 为 `b33edbbbde961a5d396ae50626afbedf9afa8477`，已核实与本地一致。
- 维护流程：检查用户改动 → 修改 green-ui → 测试 → 构建 → 检查差异 → 显式暂存相关文件 → 提交推送 → 校验线上 HTML。未来发布仍需用户授权，不强推。
- 当前发布进度见文末最新条目；Pages 在线结果需以实际校验为准。

## 历史记录说明

下方“独立副本、不上传、原版不动”等内容记录当时状态，**已由 2026-09-24 用户主版切换与发布授权更新**，不要据此恢复旧构建链。

## 2026-09-22 更新记录

### 本次完成

- 空格键关联播放/停止：
  - 琶音练习支持空格播放/停止
  - 吉他律动生成器支持空格播放/停止
  - 长按空格不会重复触发
  - 输入框、选择器、按钮聚焦时不会拦截
  - 动机训练弹窗打开时不会抢占空格
- 琶音生成方式保留：
  - Modal Vamp
  - Riff Guitar
- 风格新增：
  - Bossa Nova
- 已重新构建发布产物
- 已处理本地与远程 GitHub 仓库冲突
- 已成功推送 GitHub

### GitHub

- 仓库：https://github.com/limhhhh1231/practice-guitar
- 分支：main
- 最新提交：`c6b154b`（`Bind playback controls to spacebar`）
- 推送状态：成功

### 关键命令

```bash
node --check assets/groove-app.js
node tests/groove-engine.test.cjs
node tests/practice-playback.test.cjs
node scripts/build.cjs
git pull --rebase origin main
git push -u origin main
```

### 当前本地状态

- 此次交接记录已写入，但尚未提交到 Git；下次推送前请将 `HANDOFF.md` 一并提交。

## 2026-09-22 第一阶段优化

### 本次完成

- 律动生成器增加独立“暂停/继续”控制；播放按钮继续负责播放/停止，空格键仍负责播放/停止。
- 增加“今日练习”：按当天日期生成调性、调式、Bossa Nova/Funk/Rock/R&B 风格、速度和常用和弦进行，并立即刷新谱面。
- 增加“速度阶梯练习”：可设置起始 BPM、目标 BPM、每轮增速、每速循环次数；每完成设定轮数自动升速，到达目标后停止。
- 播放状态显示当前小节和下一小节和弦，方便提前准备转换。
- 增加速度阶梯控件的 iPad/窄屏布局样式；未改变已有音色、鼓组、节拍器和音量控制。
- 已重新生成 `outputs/fretboard-lab.html` 与 `publish/index.html`；本轮未推送 GitHub。

### 本轮验证

```bash
node --check assets/groove-app.js
node tests/groove-engine.test.cjs
node tests/practice-playback.test.cjs
node scripts/build.cjs
git diff --check
```

### 用户测试路径

- `一起练琴吧 → 吉他律动生成器 → 播放控制`：点击“播放”，观察底部播放键变为“停止”；点击“暂停”后声音停止且显示“继续”；点击“继续”恢复练习；空格键在页面非输入控件焦点时切换播放/停止。
- `一起练琴吧 → 吉他律动生成器 → 今日练习`：点击“今日练习”，应看到调性、调式、风格、BPM、和弦进行和谱面一起刷新，底部状态显示“今日练习已生成”。
- `一起练琴吧 → 吉他律动生成器 → 速度阶梯练习`：展开“速度阶梯练习”，填写例如 60 / 70 / 5 / 1，点击“开始速度阶梯”；每个小节循环后自动提升 BPM，到 70 BPM 后状态显示“已达到目标”，点击“停止阶梯”可提前结束。
- `一起练琴吧 → 吉他律动生成器 → 和弦图同步`：播放四小节进行，观察生成结果中的当前小节边框、和弦图和底部状态中的“当前和弦 → 下一和弦”同步变化。
- `一起练琴吧 → 吉他律动生成器 → 鼓组/节拍器`：展开“音轨与音色设置”，分别关闭吉他、鼓组、节拍器或调整音量，确认每条音轨独立生效；预备拍在播放开始前响起。
- `一起练琴吧 → 吉他律动生成器 → 专注模式`：点击“专注练习”，导航、设置和说明区域隐藏，只保留谱面及播放、退出专注、缩放控制；点击“退出专注”恢复页面。

## 2026-09-22 第一阶段问题修复补充

- 修复“今日练习”抽到 Bossa Nova 时鼓组生成报错：鼓组引擎现在有 Bossa Nova 基础鼓组配置，并对未知风格提供 Rock 回退。
- 修复速度阶梯切速时重建播放导致后续轮次无声：切速改为在循环边界清理旧调度后复用当前 AudioContext 重新排程，不关闭音频上下文。
- 修复音频音轨切换的可见反馈：吉他、鼓组、节拍器切换后立即更新总线音量和练习状态提示；无有效采样时不会创建失效音源。
- 速度阶梯卡片改为横跨设置区全宽，四个参数和操作状态在同一张卡片内，窄屏自动两列。
- 已重新构建并通过 `node --check assets/groove-app.js`、`node --check assets/groove-engine.js`、`node tests/groove-engine.test.cjs`、`node tests/practice-playback.test.cjs`。

## 2026-09-22 循环与速度阶梯再次修复

- 速度阶梯卡片默认展开，启用后自动展开并使用蓝色边框、状态徽标和“● 进行中”提示；达到目标显示“✓ 已达到目标”。
- 循环播放增加循环轮次提示，并在每个循环边界检查 AudioContext 是否暂停；普通循环不再关闭或重建 AudioContext。
- 播放采样和节拍器增加有效缓冲、音频上下文、播放时间保护，避免第二轮排程到失效音源。
- Node 播放调度测试兼容无 DOM 环境，`groove-engine` 与 `practice-playback` 测试均通过。

## 2026-09-22 速度阶梯交互优化

- “每速循环”改名为“每个速度循环”，含义是当前 BPM 完成多少个完整循环后再升速；状态会显示 `当前 BPM · 已完成/总循环`。
- “每轮增速”改名为“每个速度增速”。
- 阶梯运行时底部 `−5/+5` 手动调速按钮禁用，BPM 显示为实时阶梯速度；停止或达到目标后恢复手动调速。
- 阶梯运行采用独立 `cyclesAtTempo` 计数，不再与普通播放轮次混用；达到设定循环次数后才增速。
- 速度阶梯、音轨设置、练习选项统一为同一列宽和间距。
- 已重新构建并通过律动引擎与播放调度测试。

## 2026-09-22 卡片间距微调

- 速度阶梯与下方音轨/音色设置之间增加垂直间距，避免两个同级卡片视觉粘连。
- 两个卡片继续保持同列、同宽，已重新构建 `outputs/fretboard-lab.html` 与 `publish/index.html`。

## 2026-09-22 Bossa 与今日练习重做

- Bossa Nova 不再只是 UI 风格选项：节奏生成会偏向八分、切分和 3-3-2，鼓组使用 Bossa 常见的轻踢、交错边鼓和持续帽镲。
- `E.drums` 对未知风格继续保留 Rock 回退，避免样式选项与鼓组 profile 不一致时报错。
- “今日练习”从日期换参数改为 7 个日课模板：稳定拍点、Bossa 和声律动、Funk 切分控制、Neo Soul 连线、Reggae 反拍、Swing 句法、旋律收束。
- 今日练习会写入明确训练目标、风格、材料、把位、速度与和声进行，并在结果 meta 与状态栏显示日课名称。
- 已用 Node 对 rock/bossa/funk 鼓组输出做抽样对比；Bossa 的 kick/snare/hat 数量和位置明显不同于 rock/funk。

## 2026-09-22 今日练习产品化补充

- 为“今日练习”增加独立日课卡片，显示训练重点、推荐流程、速度安排、验收标准，并在卡片底部列出风格、节奏材料、和声进行和把位。
- Bossa 日课的材料包含八分、十六分切分、3-3-2 和休止；选择 Bossa 时鼓组仍由 `assets/groove-engine.js` 的 Bossa profile 驱动。
- 已重新构建 `outputs/fretboard-lab.html` 与 `publish/index.html`，并通过语法、律动引擎、播放调度测试和 `git diff --check`。

## 2026-09-22 模进练习设置布局

- 模进练习专属选项不再嵌在中间“律动设定”列内。
- “模进逻辑、动机、方向、变化、和声来源、模进小节”现在位于设置面板底部的全宽扩展区。
- 宽屏按一行平铺；中等宽度自动三列；窄屏自动两列，避免面板中间出现突兀的独立大块。
- 已重新构建 `outputs/fretboard-lab.html` 与 `publish/index.html`，并通过现有测试。

## 2026-09-22 模进练习开关化

- 律动生成器设置顶部不再显示“普通模式 / 模进练习”模式切换，改为标题“律动设置”。
- “生成方式”继续只保留 `Modal Vamp` 与 `Riff Guitar`，不与模进练习开关混淆。
- 在“包含节奏型 / RHYTHM MATERIALS”下面新增“模进练习 / SEQUENCE PRACTICE”独立版块。
- 模进练习默认关闭；开启后才显示模进逻辑、动机、方向、变化、和声来源、模进小节等参数，并按模进逻辑生成。
- 今日练习会主动关闭模进练习开关，避免日课与模进配置混用。
- 已重新构建并通过 `groove-engine` 与播放调度测试。

## 2026-09-22 律动设置收起行为

- 修复“收起律动设置”后按钮跑到底部播放控制区的问题。
- 收起后设置面板仍保留在原位置，只显示一条顶部栏，包含“律动设置”和“展开设置”按钮。
- 展开/收起按钮始终留在 `.settings-header` 内，不再移动到播放按钮前。
- 已重新构建 `outputs/fretboard-lab.html` 与 `publish/index.html`，并通过现有测试。

## 2026-09-24 Studio Green 独立视觉副本

- 用户要求参考深炭灰音频插件图片，采用绿色主色、精致小圆角与细线；本次在 `green-ui/` 建立独立副本。
- 预览入口：`outputs/fretboard-lab-green.html`；开发入口：`green-ui/index.html`。
- 主色 `#35CE68`、和弦音 `#85DFA1`，根音保留蓝色 `#65B8ED`。
- 四菜单视觉统一；连续数值滑杆采用带刻度的金属推子外观，保留原生输入与触控/键盘功能；三路音量增加百分比读数。
- 左侧品牌标识和页面标题标识改为简洁吉他图形，保留绿色圆角徽章。
- 后续视觉修正：两处吉他 SVG 改为白色；所有原生 select 的 option/optgroup 显式设为深色背景、浅色文字，选中项用深绿色，修复展开后白底浅字的问题。
- 最终 logo 配色调整：按用户最新要求，两处吉他图形由白色改为偏绿近黑色 `#102719`，绿色底座及下拉菜单样式不变。
- 用户选定 `green-ui/logo-options.svg` 中 B 款：两处品牌 logo 已替换为竖向实心原声吉他，保留绿黑色图形、音孔与琴弦细节，底座尺寸不变。
- 音轨与音色设置的 summary 原有最小高度使文字顶部对齐，造成收起状态上下留白不均；已改为 flex 垂直居中，统一箭头位置。展开后标题与内容间距 12px，末尾 mixer 去掉多余下边距，保留卡片上下 14px 内边距。
- 收起侧栏的四个菜单改为统一线性 SVG 图标：琶音用阶梯音符，律动用节奏脉冲，指板知识用横向指板网格，常用和弦指型用竖向和弦图。图标仅在收起状态显示，按钮保留完整 title 与 aria-label。
- 专属样式/辅助脚本为 `green-ui/green-ui.css`、`green-ui/green-ui.js`；生成、理论和音频逻辑沿用复制的原版。
- 副本预设/收藏使用独立存储键 `guitarGrooveGreenProject` / `guitarGrooveGreenFavorites`。
- 独立构建命令：`node green-ui/build.cjs`，只输出绿色 HTML。原版源码、原版输出与发布目录未修改；未提交或推送 GitHub。
- 副本为源码快照，后续功能更新需主动同步；详见 `green-ui/README.md` 的文件边界与验收流程。
- 已通过副本五组现有音乐理论/调度测试与语法检查。浏览器安全策略拦截了本地文件预览，实际渲染、iPad 触控和听感仍需手动验收，不能视为已视觉验证。

## 2026-09-24 听感练习与调式统一（绿色版）

- 新菜单「听感练习」位于律动生成器之后，折叠侧栏用耳朵图标；仅更新 `green-ui/` 与独立绿色输出，原版和线上未修改。
- `practice-catalog.js` 统一调式 / 风格 / 节奏名称及音级标签。三工具默认 `major`（Ionian 大调）；全部 10 种调式直接使用 GrooveEngine.scales，和声使用 GrooveEngine.harmony。
- 琶音支持 Phrygian、Lydian、Locrian、大调五声、小调五声与 Blues。五声 / Blues 的七和弦沿用引擎母调规则，并明确标注；选和弦时补充显示母调和弦内音，根音来自真实和声根音，保留背景调式音。
- 听感生成支持 1–8 个发声音符、固定或随机主音 / 调式、随机调式范围、多选全部原节奏材料、四种拍号、七种风格、三级难度。音域一八度，推荐标准六弦 0–12 品位置。分组保持完整，无法匹配数量时明确报错。
- 默认随机主音、Ionian、4 音、80 BPM、3 遍、间隔 1 小节、预备 1 小节。可选择 1–99 遍或无限循环，独立调节鼓组 / 节拍器及三路音量，支持主和弦提示。
- 音频独立 AudioContext，复用真实干吉他和鼓采样；鼓点用现有 E.drums，Swing 与 6/8 用 E.time。短窗口排程、停止令牌取消异步启动，最终一遍结束后不多排下一轮；间隔小节完全静音。
- 生成后展示当前调，支持播放自动隐藏、新题默认隐藏、手动展示；旋律答案默认不写入 DOM。揭晓后有首调 / 固定调、音名八度、节奏时间线、精确节奏表、六弦位置与单音试听。
- 生成参数更改后须点击生成，重听不换题；速度 / 播放 / 伴奏设置更改后重听沿用原旋律。切菜单或隐藏页面停止声音；支持专注与空格播放停止。
- 新代码：`ear-engine.js`（纯生成与时间线）、`ear-audio.js`（音频）、`ear-app.js`（界面）、`ear.css`。`build.cjs` 内联以上模块和共用目录。
- 测试：`node tests/ear-training.test.cjs` 覆盖 6720 组生成、全部时值 / 分组、随机范围、鼓组复用、960 组琶音渲染、有限 / 无限循环、留白、停止及异步取消。入口与步骤见 `green-ui/README.md`。
- 浏览器本地预览受策略限制，未声称完成实际渲染或设备音频验收；需用户手动打开绿色 HTML 核验听感和触控。

## 2026-09-24 绿色版正式主版发布

- 用户明确确认后续以绿色版为主，并要求推送到 GitHub。本次将 `green-ui/` 提升为唯一主源码，根 `index.html` 改为生成的自包含首页。
- 统一构建 `node scripts/build.cjs`，同时更新现有绿色本地入口、旧本地入口、根首页和 publish 首页。四份页面已校验字节一致。
- 六组测试全部通过，测试数据源均指向当前绿色版；全部内联脚本通过语法检查。`.DS_Store` 已忽略。
- 根 README、本文件顶部与 green-ui README 已更新维护规则，历史记录不再决定当前构建入口。
- 发布基线 `b33edbb`；本条随主版发布提交保存。推送/线上核验结果将在后续记录补充。
