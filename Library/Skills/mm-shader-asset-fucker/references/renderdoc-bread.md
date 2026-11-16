# RenderDocBread 抓帧与移植

## 入口

- Codex 使用 `renderdoc_bread` MCP 的工具目录。先查 `get_capture_status`，再核对目标 .rdc 的完整路径和当前事件。用户提供 .rdc 时用 `open_capture`。同开多份抓帧时先确定目标窗口，报告当前捕获身份与事件编号。
- Windows 便携版入口为 `%LOCALAPPDATA%\Programs\RenderDocBread\RenderDocBread.exe`。若桥未连上，启动该程序并加载指定抓帧，再重新查询状态。只有截图时可以先提出定位线索，Shader、绑定和参数需抓帧或其他直接证据。
- 源码位于 `C:/Users/fmz/Desktop/AiWrok/GithubWork/renderdocBread`。细节按需查 `replaylab/ARCHITECTURE.md`、`replaylab/mcp_host/src/server.py` 和该仓库的 `.agents/skills/renderdoc-resource-export/`。

## 分析抓帧

1. 从 `get_frame_summary` 或 `get_draw_calls` 定位 EID。若从屏幕位置查起，结合 Render Target 历史和相应像素的事件贡献缩小范围。读取目标及所需的上下游事件。
2. 用 `get_pipeline_state`、`get_current_shader_representation`、`get_bound_textures` 和 `get_event_resource_graph` 核对 Shader 阶段、输入资源、输出 RT 和前置 Pass。需要具体常量时按事件与阶段读取对应缓冲区，记录槽位、偏移和数值来源。
3. 优先读捕获附带的调试源码。只有反汇编时保留原指令和资源绑定，标明推断的语义、名字与重建代码。需验证猜测时在回放中输出中间量、调整常量或临时替换候选 Shader，记录变更前后并恢复回放状态。
4. 结果标明抓帧、图形 API、EID、相关资源与实际验证范围。源码整理、回放编译、回放画面对比是不同的证据。

## 导出及 Unity 移植

- 资产导出用 `get_resource_export_capabilities` 和 `export_draw_resources` 查询当前构建支持的格式及导出流程。需要精确控制布局时读取导出规格并轮询状态。保留 EID、实例号、顶点语义、纹理通道、绑定与原始导出清单。
- 用户要求移植时，先确认目标项目及实际渲染管线。复用项目可用的 Unity Editor 工具。按需要生成可编辑的 Mesh、纹理、Shader、材质、Prefab 或场景。根据目标管线接好坐标与矩阵、灯光、深度、渲染目标和历史帧输入。遇到当前抓帧缺失的生产 Pass 或上下文时，记录受影响的效果。
- 对照同一相机、光照、时间和输出阶段，先比较目标 Pass 或中间 RT，再看 GameView。需验证可编辑或动态效果时实际移动相机、改光照或检查连续帧。Unity 编译、单帧结果和多角度多帧结果分别报告。
- 若用户进一步要求替换现有 Unity 资产，按 [工程替换](replacement.md) 核对备份和引用迁移。
