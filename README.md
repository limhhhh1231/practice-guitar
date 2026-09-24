# 一起练琴吧

Studio Green 正式主版本：和弦琶音、律动生成、听感练习、指板知识、常用和弦指型。

## 开发与构建

唯一主源码目录是 `green-ui/`。根目录 `index.html` 是生成的发布首页，不要直接修改。旧 `assets/*.js` / `.css` 为历史遗留，不再作为当前构建输入。

```sh
node scripts/build.cjs
```

该命令（与 `node green-ui/build.cjs` 等效）生成四份相同的自包含页面：

- `index.html`：GitHub Pages main 分支根目录首页。
- `outputs/fretboard-lab-green.html`：当前绿色版书签入口。
- `outputs/fretboard-lab.html`：兼容原本地入口。
- `publish/index.html`：可单独上传的发布目录。

## 检查

```sh
node tests/groove-engine.test.cjs
node tests/practice-playback.test.cjs
node tests/arpeggio-board.test.cjs
node tests/chord-shapes.test.cjs
node tests/fretboard-knowledge.test.cjs
node tests/ear-training.test.cjs
git diff --check
```

源码、构建产物与交接文档应一同提交。详情与设备验收步骤见 `HANDOFF.md`、`green-ui/README.md`。代码测试不代表完成设备音频和触控验收。

## 发布与数据

仓库为 `limhhhh1231/practice-guitar`，GitHub Pages 使用 `main` 分支 `/ (root)`。发布前构建、检查、同步远程，正常提交推送，不强制覆盖。

预设和收藏保存在当前浏览器的 `guitarGrooveGreenProject`、`guitarGrooveGreenFavorites`。旧版存储键保留，不自动迁移；本地文件与线上域名数据不互通。

首次播放需要点击按钮启用浏览器音频。音色许可见 [采样说明](assets/ATTRIBUTION.md)。
