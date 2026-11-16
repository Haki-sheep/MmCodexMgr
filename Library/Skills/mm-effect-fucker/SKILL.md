---
name: mm-effect-fucker
description: 使用内置 FX Forge 核心制作和迭代粒子特效 支持参考视频拆解 2D与3D预览 程序化贴图 自定义网格与Shader GIF与前后对照及Unity原生ParticleSystem导出 Unity工程操作复用mm-fake-unity-fucker 不用于普通图片编辑或通用Unity工程维护
---

# mm-effect-fucker

以可编辑特效文档为交付主体 通过确定性渲染检查形状 方向和节奏 再交付 GIF 与需要的 Unity 资产
内置模拟器和素材生成器可以独立运行 不依赖原 FX Forge 目录 网页服务 API Key 或应用内 agent

## 入口与能力

- `<skill>` 是本 SKILL.md 所在目录 所有命令从真实路径调用 不建立链接
- 运行需要 Node 22+ Chromium 系浏览器和 FFmpeg 已打包浏览器代码 日常不运行 npm install
- 首次安装 环境变化或排障时用 `node <skill>/scripts/effect.mjs doctor` 汇总运行时 日常命令已检查实际依赖 无需重复doctor 按需通过 `--browser` 和 `--ffmpeg` 显式选择
- `render` 自带数据与 Shader 检查 无需每次先重复 `validate` 输出目录必须新建 避免覆盖旧候选
- 文件操作和导出命令见 [命令](references/commands.md) 创作与参数语义见 [制作](references/authoring.md)
- 导入目标 Unity 工程前加载 `mm-fake-unity-fucker` 并读 [Unity 接入](references/unity.md) 本 Skill 不替代其版本 现场保护和未知结果合同

## 制作流程

1. 先确定参考区间 画风 机位 时长和输出 用户已指定的内容直接沿用
   对视频按关键阶段抽帧 区分蓄势 出手 命中和消散 记录本轮要解决的可观察问题
2. 新效果从 `init` 或相关示例开始 调整层级 发射时序 运动 素材和 Shader
   使用固定种子与稳定层 ID 多个候选分别保存 保留未通过版本的失败原因
3. 用 `render` 生成完整 GIF 和关键帧表 看实际图像检查方向 轮廓 主次 高光覆盖与收尾
   对局部反馈用同机位 `compare` 并注明慢放倍速 不用换镜头或速度掩盖问题
4. 按用户预算迭代 每轮只处理明确问题 无可验证改善或缺关键素材时如实报告 不承诺自动还原视频
5. 需要游戏资产时 `export-unity` 生成原生粒子包 再通过 FakeUnityCLI 导入 编译和采样
   交付可编辑预设 GIF 需要时附 Unity 包 说明实际完成的验证层级

## 验证边界

- `validate` 与 `render` 的成功代表数据 资源引用和 WebGL Shader 可用 不代表艺术效果合格
- 既有字段被原 sanitizer 截断 修正或丢弃会拒绝 不偷偷接受默认值替换 缺失 Shader 贴图或自定义网格必须补齐
- 网页模拟与 Unity 的随机数 噪声和碰撞并不逐粒子一致 固定种子只保证各自重复
- GIF 是预览录像 3D 导出仍为实时 ParticleSystem 2D 预览不能当作原生粒子导出
- Unity 验证脚本只在独立预览场景执行 ParticleSystem.Simulate 和 Camera.Render
  不保存用户 Scene 不进入 Play 不改项目色彩空间 不证明 Player URP HDRP 或全部游戏行为
- 当前自测范围与构建来源见 [运行时](references/runtime.md) 不凭历史记录宣称目标工程已通过
