---
name: mm-blender-fucker
description: 角色从零建模 已有模型修改 K 动画及 Unity 资源导入 从零建模先确认 Tripo 本地 Blender 或其他工具 改模使用 Blender 常驻 CLI 按目标局部处理
---

# mm-blender-fucker

按用户目标选择工作方向 按需组合 不因为使用 Blender 就默认从零手工建模 不因为存在生成流程就重新生成已有模型。

## 任务分流

| 目标与输入 | 读取内容 | 执行边界 |
| --- | --- | --- |
| 只有概念或参考图 需要新建模型 | [从零建模](references/new-model.md) | 先确认 Tripo 本地 Blender 或其他制作工具 再进入对应流程 |
| 已有 blend FBX GLB 等模型 要修改造型 拓扑 UV 材质 骨架或蒙皮 | [已有模型修改](references/model-editing.md) | 按修改目标处理 不默认重走四视图与高模生成流程 |
| 已有骨架与蒙皮 要制作或修改动作 | [动画制作](references/animation.md) | 保留其他 Action 与骨架约定 只修改本次动作 |
| 模型或动作已准备好 要导入 覆盖或打包 Unity 资源 | [Unity 交付](references/unity-delivery.md) | 按实际资源完成导入与验证 不扩展成整套角色重建 |

用户已经用 Tripo 或其他工具生成模型 后续修形属于改模 导入属于 Unity 交付 不再询问整个人物的从零建模路线。只读本次涉及的参考文件。

## 输入与修改范围

读取项目规范与相关资源。涉及 Unity 时核对版本 渲染管线和现有资源约定。按任务核对网格 UV 材质 骨架 蒙皮 Shape Key 与动画 不把无关检查扩展成资产重建。

在源文件副本上制作 保留原始源文件与来源署名。覆盖 Unity 资源前记录资产 GUID 及实际被引用的 Clip Avatar Mesh Transform Animator 和 Controller 子对象 fileID 保留现有参数 过渡 材质调参和 Prefab overrides。

是否绑骨 K 动画 导入 Unity 或打包由本次请求决定 单独改模 改材质或 Shader 不自动增加这些交付。

## 本地 Blender 执行

选择本地制作或进入 Blender 后处理时 默认使用本机 blender-agent-sdk 常驻 CLI 不安装或调用 Blender MCP。先读 [常驻 CLI](references/blender-agent-cli.md) 按任务命名会话 使用 [Invoke-BlenderAgent.ps1](scripts/Invoke-BlenderAgent.ps1) 操作。工程与可执行文件位置见 [运行配置](references/blender-runtime.json)。

需要独立读取磁盘源数据或导出明确 Action 时 先读 [Blender 助手能力边界](references/blender-tools.md) 再使用 [blender_character.py](scripts/blender_character.py)。该助手只在独立后台进程运行 不在常驻制作会话中执行 它提供检查与动作导出 不提供模型生成 自动重拓扑或从零绑骨。

## 验收与停止条件

生成参考图 高模文件或成功执行导出 都不代表三维形体或最终效果已通过。按任务查看实际模型与必要视角 比较参考 记录差距 不把单张正面效果当作完整三维还原的证据。

用户要求等验收或逐阶段确认时 交付当前结果并等待 不继续执行依赖该结论的步骤。已有明确选择和已确认阶段直接沿用 不重复提问。

不达标时如实说明具体偏差 已验证范围与限制。修正应针对可解释的问题；同一关键偏差反复无改善 或没有可验证的下一步时 停止该路线并报告 不强行循环 不降低相似度标准 不擅自换工具来制造通过结论。
