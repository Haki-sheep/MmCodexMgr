# 上游与边界

来源 https://github.com/MothCyan/PerfAgent-Unity
作者 MothCyan 许可 MIT 完整许可位于 `assets/unity/PerfAgent/LICENSE`
本包从用户提供的本地 PerfAgent-Unity-main 主模块取材 不包含 MCP for Unity 或其桥接依赖
上游未提供本次复制的 Git 提交身份 不伪造 commit 来源 用 payload-manifest.json 的文件 SHA256 固定当前快照

上游源码原样保留 在其中新加 LICENSE 说明授权 不修改作者原工程
本包新增模块位于 `assets/unity/MmPerformance` 与上游分开
assets/payload-manifest.json 是随包文件完整性权威目录 手动维护源码后运行 scripts/rebuild_manifest.py 更新

已知上游限制

- 原帧采样 GC 平均排除零值 并在下采样后计算 部分统计与文档说明不一致
- 原 Marker 实验性字符串解析不保证跨版本列语义 默认线程和少量近帧不覆盖全采样窗口
- 原普通 MCP 抓帧域重载丢状态 本包不使用该入口
- 原秒级快照 ID 有覆盖可能 本包使用 GUID 与不可覆盖结果文件
- 静态脚本正则检查有误报和漏报 不追踪实际调用热点
- 原自动修复的静态重验不能证明运行收益 本包不暴露自动修复操作
- 原公开最低 unity=2021.3 是声明 上游 README 的验证环境为 2022.3.62f2c1 URP14.0.12

本包初版有意提供 Editor 数据采集与 AI 可检索报告 未提供真机采集 GPU 调用级分析 全线程调用树 或分配调用栈
如果需要这些证据 按目标平台设计 Runtime 采集器或导入正式 Profiler 工具结果 不把缺失数据补成零或由 AI 编造
