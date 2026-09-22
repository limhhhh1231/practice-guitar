# 一起练琴吧：项目交接

更新：2026-09-18。本文记录当前本地工作区事实，供接手的开发者或 AI 从磁盘独立继续工作；账号状态、网站部署状态需重新核实。不要把本文当成任何账号操作授权。

## 项目入口与运行

- 工作区：`/Users/xiejialin_1/Documents/Codex/2026-09-12/logo-logo-md`
- 用户日常打开：`outputs/fretboard-lab.html`，可直接用浏览器打开 `file://`。这是**构建产物**，不要直接在其中编辑。
- 主源码：`index.html`，包含琶音工作台的 HTML/CSS/JS，以及其他模块的入口。
- 本地构建：在项目根目录执行 `node scripts/build.cjs`。该命令生成 `outputs/fretboard-lab.html` 和 `publish/index.html`，并复制采样许可到各自的 `assets/ATTRIBUTION.md`。构建产物把外部 CSS、JS 和音色嵌入 HTML；修改源码后必须重新构建，用户的本地文件才会更新。
- 源码 `index.html` 本身引用 `assets/` 文件，若直接以 `file://` 打开会有浏览器资源/权限差异；优先测试构建产物。需要 HTTP 时可用 `python3 -m http.server 8765 --bind 127.0.0.1`，但本环境可能因网络沙箱拒绝绑定，需要授权。
- Node 为构建和测试所需，无 `package.json`，无安装依赖步骤。当前目录不是 Git 仓库；不要假设 `git status` 或 `git push` 可用。

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
