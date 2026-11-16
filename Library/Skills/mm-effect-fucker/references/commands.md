# 文件与命令

以下 `<skill>` `<input>` `<out>` 均替换为绝对路径 路径包含空格时在 shell 中引用
命令输出 JSON 进度写 stderr 失败退出非零 不覆盖既有输出
临时浏览器 profile 和帧序列使用系统 TEMP 无论成功失败都尝试清理

## 新建与参数发现

```text
node <skill>/scripts/effect.mjs init --space 3d --name "Ink Slash" --out <new.fxpreset.json>
node <skill>/scripts/effect.mjs schema --kind emitter3d
node <skill>/scripts/effect.mjs schema --kind effect3d
node <skill>/scripts/effect.mjs schema --kind generators
```

`--space 2d` 对应 2D 预览 `schema` 另有 `emitter2d` 和 `effect2d`
新建文件的父目录应已存在 后续由 Agent 修改该特效 JSON 新候选用新文件名
输入可为 `fxforge-preset` version 1 包 或带 layers 的效果对象
预设包及 FX Forge 导出的 .fx.json 均可嵌入 assets shaders 和 meshes 不依赖原应用素材库

## 预览与对照

```text
node <skill>/scripts/effect.mjs render --input <input> --out <new-output-directory> --mp4
node <skill>/scripts/effect.mjs compare --before <old> --after <new> --out <new-comparison-directory> --start 0.48 --end 1.12 --speed 0.5
node <skill>/scripts/effect.mjs validate --input <input>
```

共用参数

| 参数 | 含义 |
|---|---|
| `--width` `--height` | 每个画面的像素尺寸 render 默认 960×540 compare 默认每侧 640×360 |
| `--fps` | 源时间采样率 默认 25 |
| `--start` `--end` | 秒为单位的截取区间 包含开始 不包含结束 默认完整时长 |
| `--speed` | 回放速度 默认 1 比较时两侧使用相同速度 |
| `--times` | 关键帧表的采样秒数 逗号分隔 最多 16 个 |
| `--view-file` | 相机 JSON 见下方 |
| `--mp4` | 同时生成 H.264 MP4 |
| `--browser` `--ffmpeg` | 程序绝对路径 不持久化环境变量 |

```json
{"position":[4.6,4.8,10.3],"target":[0,1.8,0],"fov":40}
```

相机使用 Three.js 右手坐标 Y 向上 效果数据仍使用 Unity 左手坐标
Unity 采样适配器会翻转相机位置和 target 的 Z 不要提前翻转两次

render 输出 `preview.gif` `contact.png` `capture.json` 和规范化后的 `effect.fxpreset.json`
compare 输出 `comparison.gif` 两份关键帧表及 `capture.json` 左旧右新
`capture.json` 记录机位 源采样率 回放速度 首末帧是否一致及校验范围
GIF 帧延时精度为 10ms 默认 25fps 可以精确表达 其他速度可能存在量化误差
`externalRendererRequests=0` 仅描述捕获页面 不代表操作系统或浏览器后台的全部网络活动

## 程序化素材

```text
node <skill>/scripts/effect.mjs generate-texture --generator arc --id a_inkarc --name "Ink Arc" --out <new-texture-directory>
node <skill>/scripts/effect.mjs generate-texture --generator flipbook_smoke --params-file <params.json> --out <new-texture-directory>
```

先按需查询 generators 取其参数定义 输出 `texture.png` 和 `asset.json`
将 asset.json 对象放入预设 assets 对应层引用其 id
普通贴图用 `material.texture` 2D 用 `texture` 序列帧用 `sheet.asset` 并开启 `sheet.enabled`
生成器会按参数范围规范化 数值结果保存在 `source.params` 需要精确参数时核对该值

## Unity 包

```text
node <skill>/scripts/effect.mjs export-unity --input <3d-preset> --out <new-export-directory>
```

输出 `unity.zip` `package/FXForge/` 与逐文件 SHA256 的 `package.json`
导出本身不访问 Unity 工程也不证明 Unity 编译成功 后续按 [Unity 接入](unity.md) 执行

## 可重复自测

```text
node <skill>/scripts/selftest.mjs --out <new-evidence-directory>
```

另需 ffprobe 可通过 `--ffprobe` 指定 检查真实 WebGL 编译 渲染确定性 非法引用和越界拒绝
生成完整 GIF 并解码核对 包含 2D 预览 贴图生成和 Unity 导出文件检查 不写 Unity 工程
