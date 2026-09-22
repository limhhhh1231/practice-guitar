# 一起练琴吧：项目交接

更新：2026-09-18。本文记录当前本地工作区事实，供接手的开发者或 AI 从磁盘独立继续工作；账号状态、网站部署状态需重新核实。不要把本文当成任何账号操作授权。

## 项目入口与运行

- 工作区：`/Users/xiejialin_1/Documents/Codex/2026-09-12/logo-logo-md`
- 用户日常打开：`outputs/fretboard-lab.html`，可直接用浏览器打开 `file://`。这是**构建产物**，不要直接在其中编辑。
- 主源码：`index.html`，包含琶音工作台的 HTML/CSS/JS，以及其他模块的入口。
- 本地构建：在项目根目录执行 `node scripts/build.cjs`。该命令生成 `outputs/fretboard-lab.html` 和 `publish/index.html`，并复制采样许可到各自的 `assets/ATTRIBUTION.md`。构建产物把外部 CSS、JS 和音色嵌入 HTML；修改源码后必须重新构建，用户的本地文件才会更新。
- 源码 `index.html` 本身引用 `assets/` 文件，若直接以 `file://` 打开会有浏览器资源/权限差异；优先测试构建产物。需要 HTTP 时可用 `python3 -m http.server 8765 --bind 127.0.0.1`，但本环境可能因网络沙箱拒绝绑定，需要授权。
- Node 为构建和测试所需，无 `package.json`，无安装依赖步骤。当前目录已初始化为 Git 仓库，并配置远程 `origin` 指向 `https://github.com/limhhhh1231/practice-guitar.git`；推送前先同步远程分支，避免合并冲突。

## 代码地图

| 文件 | 职责 |
| --- | --- |
| `index.html` | 整体布局、菜单切换、和弦琶音、动机训练、琶音采样播放和音量。部分 CSS/JS 是长单行，修改时注意局部匹配。 |
| `assets/groove-engine.js` | 律动生成纯逻辑：调式、音程、和声、节奏、六弦指型、鼓组；可在 Node 中测试。 |
| `assets/groove-app.js` | 律动工作台 UI、状态、播放器、预备拍、区间循环、听弹交替、专注模式、浏览器收藏。 |
| `assets/groove.css` | 律动页面、设置面板和专注谱面样式。 |
| `assets/fretboard-knowledge.js` / `.css` | 指板知识菜单、音程表、协和分类、筛选、六弦空弦及交互式指型图。 |
| `assets/chord-shapes.js` / `.css` | 常用和弦指型菜单；书页式全指板/CAGED 矩阵、特殊和弦数据、和弦图与章节筛选。 |
| `assets/sample-bank.js` | 内嵌吉他与鼓 MP3 采样，体积较大；勿手工修改。 |
| `assets/ATTRIBUTION.md` | FluidR3 采样来源及 CC BY 3.0 署名；发布时必须保留。 |
| `scripts/build.cjs` | 单文件网页打包并生成 `publish/` 发布目录。 |
| `scripts/build-samples.cjs` | 采样构建脚本；一般功能修改无需运行。 |
| `tests/groove-engine.test.cjs` / `tests/practice-playback.test.cjs` | 音乐生成及区间播放/交替练习的 Node 测试。 |
| `tests/fretboard-knowledge.test.cjs` / `tests/chord-shapes.test.cjs` | 音程结构枚举、去重、错位排布，以及和弦指型音高/音程校验。 |
| `FEATURE-CHECKLIST.md` | 早期律动模块验收记录，未覆盖后续全部改动；以当前源码为准。 |

## 已有功能与重要约定

- 平台「一起练琴吧」有四个工具：和弦琶音练习、吉他律动生成器、指板知识、常用和弦指型。桌面左侧菜单可收起并固定为视口高度，页面滚动时不移动；820px 以下恢复顶部导航。页面主强调色为 `#FF6A3B`。
- 琶音：前 12 品加空弦、调式内七和弦与简谱、把位范围、动机训练；根音蓝色，和弦音橙色。标准调弦从细到粗 E4 B3 G3 D3 A2 E2。七和弦例：Cmaj7 = C E G B。
- 律动：六弦标准/Drop D、常用和声与节奏材料、六线谱/音区视图、鼓组和节拍器、干声吉他采样。设置区域位于谱面上方，可收起；播放控制固定在底部。预备拍可选 0/1/2 小节，区间或单小节循环，听弹交替时仅在自己弹的一轮静音吉他、鼓和节拍器继续。专注模式隐藏导航与设置，保留谱面和播放/退出/缩放控制；宽屏每行两小节，小屏单列。扩展音可选“无”，此时扩展和弦退回七和弦。
- 指板知识：常见音程、每个音程从 1～7 起音的音级拼写、协和类别语义色标签和表格筛选；一张六弦空弦图同时标注五组相邻空弦关系。“全部典型结构”独立于起音品位，相同弦距与相对品位的结构只显示一个代表，每组用独立颜色连接，横向跨度不超过 5 品；手动选弦模式才显示起音弦、目标弦和起音品位。相邻 3 弦 G 到 2 弦 B 是大三度（4 半音），其他相邻弦是纯四度（5 半音），不可直接套用四弦贝斯图。
- 常用和弦指型：采用上到下为品位、左到右为 6～1 弦的书页式和弦图，红色 R 标根音，蓝色圆点标其他音程。章节包括“全指板和弦终极练习”（C 大调内七个和弦按五个把位横排）、“CAGED 所有和弦指型”（五种外形对比大三/小三/大七/属七/小七/半减七）、“CAGED 挂留和弦”，以及 47 张特殊和弦图：14 个斜杠和弦、19 个挂留/七挂四、7 个加音、7 个强力和弦。基础指型 40 张，加特殊和弦共 87 张；数据需通过 `tests/chord-shapes.test.cjs` 的音高计算校验。
- 律动预设和收藏在**当前浏览器的 localStorage**（键 `guitarGrooveProject`、`guitarGrooveFavorites`），不是 GitHub 账号数据，也不会自动跨设备同步。`导出 JSON` 可备份生成结果，但现有界面不提供 JSON 导入；不要声称导出文件可一键恢复。浏览器清理网站数据、更换 `file://` 与 HTTPS 来源或换设备，可能导致收藏不可见。发布静态 HTML 不会迁移这些数据。
- 所有吉他/鼓采样已内嵌用于离线播放，但页面仍引用 Google Fonts；字体离线时会回退。浏览器音频须由用户点击启动；不能仅凭网页输出电平证明 iPad 实际扬声器可听。

## 验证步骤

在项目根目录运行：

```sh
node tests/groove-engine.test.cjs
node tests/practice-playback.test.cjs
node tests/fretboard-knowledge.test.cjs
node tests/chord-shapes.test.cjs
node tests/arpeggio-board.test.cjs
node --check assets/groove-app.js
node --check assets/fretboard-knowledge.js
node --check assets/chord-shapes.js
node scripts/build.cjs
```

接手时还应在桌面和 iPad mini 近似尺寸实际打开构建产物，操作四个菜单、设置收起、专注/退出、谱面缩放、和弦章节筛选与矩阵横向滚动、单小节循环、预备拍、听弹交替、收藏/撤销，并分别试听吉他/鼓/节拍器。音频和布局不能只靠 Node 测试断言。音程表的七组拼写与升降记号，以及跨 G/B 弦的目标品位，应单独核对。浏览器预览如果需要本地服务器，结束时停止自己启动的会话。

## GitHub Pages 状态

- 曾通过 GitHub 网页界面创建公开仓库 `limhhhh1231/practice-guitar`，启用 `main` 分支根目录 GitHub Pages；公开地址为 `https://limhhhh1231.github.io/practice-guitar/`。用户名 `lim` 已被其他组织占用，用户决定**不更改用户名**。
- 2026-09-18 17:55 已通过 GitHub 网页上传 `publish/index.html` 到 `main`，提交 `40154bd2b08f58126e2b4d7435cee23ef1a13082`（`Update practice tools and chord reference`）。Pages 设置显示该提交已部署；公网页面已实测存在“常用和弦指型”菜单，CSS 主色为 `#FF6A3B`，浏览器控制台无错误。后续接手仍应核对最新提交，避免把这条历史状态当成永久现状。
- Pages 设置存在“Custom domain”输入框，但只能填写用户拥有并可配置 DNS 的完整域名，例如 `practiceguitartogether.com` 或某个子域名；`PracticeGuitarTogether` 只是名称，不是合法域名。若仅希望改善 GitHub Pages 路径，可在用户明确授权后把仓库重命名为 `PracticeGuitarTogether`，地址会变成 `https://limhhhh1231.github.io/PracticeGuitarTogether/`，但这不属于自定义域名。
- 若用户明确要求同步线上：先构建并测试，再在 GitHub 仓库中更新根目录 `index.html`；同时确认 `assets/ATTRIBUTION.md` 与 `.nojekyll` 存在。可使用 GitHub 网页上传或建立受控 Git 工作流，但不要在此无 Git 的工作区盲目初始化/覆盖远端。上传属于对外发布，应确认具体目标仓库和待发布内容；不要上传本地个人文件、账户信息或工作区其他目录。发布后查看 Pages 部署状态并实际访问公网 URL 验证。

## 接手原则

2026-09-18 修复琶音指板弦序错误：调弦数组按 1→6 弦排列，DOM 行必须为 s+1，不能使用 6-s。空弦与按弦音均已修正；新增 arpeggio-board 测试检查 768 种渲染状态。标准调弦 5 弦 1 品为 B♭，3 品为 C。20:53 已上传修复到 main，提交 0704f8846268ee95dcca48ebc0acd0c8d23ab4bd（Fix arpeggio fretboard string order）。公网 DOM 已确认 1→6 弦空弦为 E/B/G/D/A/E，C 大调第五弦第三品显示 C/1、第一品不显示调内标记。

先检查本地文件的当前内容和时间，不要用文档覆盖用户新改动。只改源码，通过 `node scripts/build.cjs` 更新交付 HTML。用户惯用简体中文，关注 iPad mini 单手操作、清晰的大字谱面、六弦准确性、音频真实可听，以及本地与线上状态的明确区分。没有用户的新请求时，不要自行改名、发布或迁移账号数据。


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
