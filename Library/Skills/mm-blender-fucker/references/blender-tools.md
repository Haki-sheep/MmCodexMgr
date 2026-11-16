# Blender 助手用法

脚本提供可复用的源数据检查和明确 Action 导出 具体 K 动画仍由 Agent 根据角色骨骼和要求编写本次制作脚本 不提供跨角色通用动作或从零绑骨。

实测环境为 Blender 5.2.1 LTS 已验证源检查 指定动作导出与 FBX 复读 以及误覆盖 多 Slot 不兼容曲线索引 外部父级 网格动画 NLA 隔离 打包图片等 15 项行为检查。旧版 Action 读取分支尚未在旧 Blender 实机验证 Unity 导入验收仍按主 Skill 单独执行。

## 独立后台执行环境

连续制作与预览使用 [blender-agent-cli.md](blender-agent-cli.md) 本页仅用于独立磁盘检查与隔离导出 不在常驻会话执行本助手。

使用实际安装的 Blender 可执行文件。以下 PowerShell 变量替换为本次绝对路径 `--python-exit-code 1` 必须保留 让脚本异常返回失败。

```powershell
$BlenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
$SkillRoot = '<当前 Skill 目录的绝对路径>'
$HelperScript = Join-Path $SkillRoot 'scripts\blender_character.py'
$CharacterSource = '<本次源 blend 或 fbx 的绝对路径>'
$CharacterReport = '<工程外临时目录>\character.json'
$CharacterExport = '<工程外临时目录>\character.fbx'
```

## 检查源文件

```powershell
& $BlenderExe --background --factory-startup --python-exit-code 1 --python $HelperScript -- inspect --source $CharacterSource --output $CharacterReport
```

JSON 包含实际 FPS 与 fps_base 单位 骨架与骨骼矩阵 蒙皮网格 UV 材质槽 Action 范围 Slot 曲线 关键帧与采样点数量 NLA 条带 图片路径与打包状态 材质图片节点与连接。

检查器读取 legacy 和 layered Action 数据 不把不支持的 API 错误转换成空曲线。材质连接只列出顶层节点 组内连接需 Agent 继续检查。UDIM 序列 动态生成及打包图片的外部文件完整性不能仅用 `file_exists` 判断 本助手不展开序列 不解包图片 不修改任何素材。

## 导出指定骨架和动作

按检查结果选择实际骨架名与 Action 名 下面名称只展示传参方式：

```powershell
& $BlenderExe --background --factory-startup --python-exit-code 1 --python $HelperScript -- export --source $CharacterSource --output $CharacterExport --armature '<实际骨架名>' --action '<动作一>' --action '<动作二>'
```

只选择指定骨架和其绑定网格 指定动作必须存在 有关键帧或采样点且曲线路径与索引可在该骨架解析。多 Slot Action 外部父级 网格动画 Shape Key 动画和被当前 View Layer 排除的对象暂不支持 此类数据使用本次专用导出脚本 不静默选择第一个 Slot或丢弃父节点。

本助手按 Action 单独导出 在独立后台进程内禁用源 NLA 求值并使用 Replace 混合 不导出 NLA 合成结果。需要 NLA 合成效果时使用专用脚本。

为避免 Blender all-actions 混入其他动作 助手只在独立后台进程的内存中移除未选择的 Action 不调用保存源文件。不在交互式 Blender 编辑会话运行。

默认保留 FPS 采用 -Z 前向 Y 向上 不添加叶骨 不应用网格修改器 不简化动画曲线。`--forward` `--up` 和 `--apply-modifiers` 只在需要匹配实际导出配置时使用。导出关闭嵌入纹理 贴图仍需按 Skill 规则单独导入和绑定。

已有输出默认报错 明确覆盖暂存输出时加 `--overwrite`。导出先进入工程外暂存目录 不直接写 Unity FBX 覆盖操作和 `.meta` 保留由 Agent 按 Skill 执行。

导出成功只说明文件已生成 后续仍需重新检查 FBX 的 take 范围 动作数据与蒙皮 再在 Unity 验证材质引用 动画播放和实际渲染。
