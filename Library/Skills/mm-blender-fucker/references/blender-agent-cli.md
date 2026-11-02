# Blender 常驻 CLI

使用全局安装的 blender-agent-sdk CLI 命令 运行位置以 [blender-runtime.json](blender-runtime.json) 为准 不依赖仓库 `.venv` 不注册 MCP 不在每条命令后重新启动 Blender。脚本入口要求 PowerShell 7 保留 JSON 参数 依赖缺失直接报告 不自动下载 Blender 或切换连接器。

源码保存在配置指定的 repository 全局安装采用 uv tool editable 模式 保留该源码目录 更新后按需运行 `uv tool install --force --editable '<源码目录>'` 重新验证 不在制作任务中自动升级。

本机 Windows x64 与 Blender 5.2.1 LTS 已验证后台常驻调用 中文与引号参数 Python 文件执行 蒙皮动作采样 渲染预览 保存和隔离 FBX 导出复读。配置的本地提交补齐 CLI 远端错误的类型与 traceback 透传 Windows GUI 模式仍未验证 Unity 导入验收按主 Skill 另外执行。

## 会话与操作

由 CLI 启动并管理独立 Blender 进程 用户手动打开窗口中的未保存内容不会进入该会话。读取 `.blend` 副本使用 `--file` 读取 FBX 则在新会话用 Blender 导入 API。

```powershell
$SkillRoot = 'C:\Users\fmz\Desktop\AiWrok\Skill\mm-blender-fucker'
$Agent = Join-Path $SkillRoot 'scripts\Invoke-BlenderAgent.ps1'
$SessionName = 'character-task-unique'
$PreviewPath = '<工程外任务临时目录的绝对路径>'
$SourceCopy = '<角色 blend 副本的绝对路径>'

& $Agent -AgentArgs @('start', '--name', $SessionName, '--file', $SourceCopy, '--out', $PreviewPath, '--allow-exec')
& $Agent -AgentArgs @('call', '--name', $SessionName, 'scene_graph')
& $Agent -AgentArgs @('tools')
```

任务名须唯一 继续既有任务先用 `list` 和 `status --name` 确认归属 再复用已有会话 不复用其他任务或默认会话。`--allow-exec` 用于本任务制作脚本 不带此参数时仍能调用普通工具 但不能执行任意 Python。

按 `tools` 列出的工具签名选择参数 `call` 接受 JSON 复杂参数可用 `-JsonFile '<参数 JSON 文件>'`。错误返回保留原始类型和 traceback 入口返回失败 不自动重发写操作。

```powershell
& $Agent -AgentArgs @('call', '--name', $SessionName, 'checkpoint', '{"label":"before-animation"}')
& $Agent -AgentArgs @('call', '--name', $SessionName, 'exec_python') -PythonFile '<本次制作脚本的绝对路径>'
& $Agent -AgentArgs @('show', '--name', $SessionName, '--width', '640', '--height', '480', '--label', 'animation-check', '--no-preview')
& $Agent -AgentArgs @('call', '--name', $SessionName, 'save', '{"filepath":"C:/absolute/staging/character.blend"}')
```

`-PythonFile` 在 Blender 内执行 UTF-8 脚本 设置真实 `__file__` 和 `__name__='__main__'` 可将摘要写入 `result`。场景数据跨命令保留 但每次 `exec_python` 的 Python 全局变量重新建立 从 `bpy.data` 按名称获取对象。此入口不提供命令行脚本参数 不执行带 `sys.exit` 或专用进程生命周期的后台助手。

`show` 返回 JSON 其中 `shot.file` 相对预览目录 读取实际 PNG 检查画面 不能只看返回成功。后台模式从场景相机或临时相机渲染 不是交互视口 需要材质验证时按任务选择实际渲染引擎。只有需要用户观看交互窗口时在 `start` 添加 `--gui` Windows GUI 模式须单独验证。

## 保存与结束

后台会话不提供常规 Undo 使用 checkpoint/restore 或明确保存的副本恢复。checkpoint 放在会话临时目录 随会话结束清除 不能代替 `.blend` 交付文件 `stop` 前显式保存需要保留的结果。

上游 Studio 在进程丢失后可能在下一次请求自动新建 Blender 不能把新进程当作原场景继续写入。遇到 session lost 先停止本任务会话 从已保存副本显式重建并核对数据 不依赖自动重启恢复未保存内容。

```powershell
& $Agent -AgentArgs @('status', '--name', $SessionName)
& $Agent -AgentArgs @('stop', '--name', $SessionName)
```

只结束自己创建的会话 不使用 `stop --all` 不关闭用户已有 Blender。独立 FBX 导出继续使用 [blender-tools.md](blender-tools.md) 的后台助手 不能在常驻制作会话运行会移除其他 Action 的导出逻辑。原生助手失败时保留首错 不自动切换工具链。
