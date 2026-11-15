# 独立运行

所有子命令都从 `node <skill>/scripts/animation.mjs` 进入。上游参考示例中的 `wb` 指同一个 CLI。用 `help` 查选项，用 `--json` 获取结构化输出。路径有空格时加引号。

- 默认运行依赖在 `%LOCALAPPDATA%/MmAnimationCreat`。可用进程环境变量 `MM_ANIMATIONCREAT_RUNTIME` 指向另一份完整依赖。
- 运行需要 Node 20+、Chrome 或 Edge、FFmpeg。显式浏览器和 FFmpeg 路径使用 `DRAWAI_CHROME_PATH`、`DRAWAI_FFMPEG_PATH`。常规制作直接复用已有运行依赖。
- `doctor --json` 核对前置项。渲染和帧检会在传给 `--dir` 的工程生成标准 `.out`，并可能刷新工程的 Remotion 入口。需要清理中间文件时在 TEMP 中渲染工程副本。
- `style list`、`style read --slug <id>` 和 `style frames --slug <id>` 用来找整片风格、读技术配方和抽取上游样片帧。特定参考样片首次使用可能准备小型数据包。
- 音轨使用 `audio add --dir <project> --file <path> --role bgm|sfx|voice --at <seconds>`，成片后按需要运行 `verify`。需要剪映素材包时用 `export --dir <project> --draft`。
- `render --range <start>,<end>` 包含首尾帧 两者都从 0 开始计数。整片走 `.out/film.mp4`。使用 `render status` 查看后台任务。`render cancel --dir <project> --job <id>` 只提交取消请求 由持有渲染句柄的worker处理 以status最终状态确认 不按旧PID结束进程。

## 新机器准备

在运行目录的 `cli` 子目录放入 `scripts/workbuddy/package.json` 和 `package-lock.json`，在该子目录用本机 npm 执行 `npm ci --ignore-scripts --no-bin-links`。用技能入口运行 `setup --install` 准备素材和视频依赖，最后运行 `doctor --json`。也可搬运同平台和同 Node 主版本的完整运行目录。

来源是 [dsh-drawai 0.4.6](https://github.com/fourzkw/dsh-drawai/tree/2f3d6a80a3f4477904c74d5b1f28a68efa6051d3)，见 `scripts/workbuddy/engine/VENDOR.json` 和随附许可证。保留上游独立 CLI 和风格库，使用 0.4.6 的视频源码。
