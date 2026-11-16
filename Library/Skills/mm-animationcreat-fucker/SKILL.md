---
name: mm-animationcreat-fucker
description: 用代码制作可编辑的 MG 动画和动效短片 将文案或主题拆成镜头 使用 DrawAI 独立 CLI 与 Remotion 编写场景 逐帧预览 配音配乐和渲染 MP4 适用于动态排版 科幻 HUD 数据动画 品牌片头与程序化动效
---

# mm-animationcreat-fucker

从文案或参考出发制作可编辑的动效短片。以工程的时间轴、场景和素材为源文件，交付经过实际观看和帧检的 MP4。运行使用 DrawAI 的独立视频 CLI。

## 制作

1. 沿用用户给出的内容、画幅、时长、风格和声音要求。只有实质影响交付的缺失约束需要询问，其余可以合理决定。
2. 规划镜头内容、主动作、停留和衔接。先做代表性镜头，检查主体是否突出、字号是否可读、每个动作是否有铺垫和收尾。需要参考风格或镜头卡时，读 [风格和镜头卡](references/cards-and-styles.md)，用 `style list`、`style read` 和 `card search` 查真实配方。仅在用户指定审片节点时等待确认。
3. 用 `create` 建工程。每个镜头编辑自己的 `scene-N.tsx`，时间轴以 `timeline.json` 为准。使用 `useCurrentFrame()` 按帧计算状态，随机变化用固定种子，素材路径相对 `assets/`。详见 [场景契约](references/scene-contract.md)。
4. 用 `preview` 看首尾、转场前后和动画峰值。用 `render --range` 检查节奏，再用 `render --wait` 渲成片。短片可直接出整片并复看。音轨与字幕按需要加入时间轴，检查音画起点和切点。
5. 用 `qa` 检查成片并播放或抽查关键帧。检查空白、裁切、缺字、异常闪烁、切镜和音轨。交付 MP4 与需要继续编辑的工程源文件，如实说明实际验证范围。

## 入口

```text
node <skill>/scripts/animation.mjs doctor --json
node <skill>/scripts/animation.mjs create --dir <project> --spec 1920x1080@30 --duration 12 --segments 3 --prompt "<brief>"
node <skill>/scripts/animation.mjs spec validate --dir <project>
node <skill>/scripts/animation.mjs preview --dir <project> --frames 0,24,80
node <skill>/scripts/animation.mjs render --dir <project> --range 0,90 --wait
node <skill>/scripts/animation.mjs render --dir <project> --wait
node <skill>/scripts/animation.mjs qa --dir <project>
```

中间渲染工程放在系统 TEMP，用完清理。正式工程只保留用户需要的源码、资产和成片。已有工程通过 `open` 查看，按需编辑原有场景和时间轴。查看 [独立运行和命令](references/runtime.md) 获取路径、依赖和其他参数。
