---
name: mm-performance-fucker
description: 执行 Unity Editor 与 Player 性能采样 可选 PerfAgent 静态审计和原始 Profiler 热点导出 检查现场有效性与同条件多轮复测 配合 mm-fake-unity-fucker 执行 Editor 操作 不把静态风险当作实测根因
---

# mm-performance-fucker

本 Skill 负责采样方案 数据分析和复测 `mm-fake-unity-fucker` 负责连接身份 现场保护和执行通道
不需要 MCP 不调用 PerfAgent 内置 LLM 不要求视觉能力

## 入口与安装

- 工具入口是 `python scripts/perf.py` 用 `--fuc` 指定当前工程实际使用的 CLI 程序 不捆绑或替换 CLI
- 首次使用读 [安装与命令](references/commands.md) 随包源码在 `assets/unity` 安装脚本默认只预览 `--apply` 才部署
- 部署到用户明确指定的 Unity 工程 不修改第三方原工程 不自动安装到全局 Skills 目录
- 先按 `mm-fake-unity-fucker` 检查 Editor 身份和保护 再查询 `mmperf probe` 与 Provider 契约
- 适配器版本 0.2.0 默认 capture 轻量部署 full 才部署 PerfAgent 静态审计 上游与适配器验证范围分开见 [验证记录](references/validation.md)
- Editor 在线且适配器编译完成才能采集 已有 JSON 报告可离线分析 Unity 6 能否工作以目标工程探测与实际编译为准

## 执行流程

1. 明确目标平台 帧率 复现步骤和采样阶段 未给预算时把默认 60 FPS 明示为临时观察预算
2. 已有报告先离线分析 不为解读报告部署插件 静态审计和运行采样分开 静态规则只能报告风险
3. 动态采样要求未暂停的 Play 模式 工具不切 Play 不切场景 不保存业务资产 不调用上游自动修复
4. 保留同一启动请求 ID 与返回 job_id 先查状态 完成后对返回的本地报告路径运行 `analyze`
5. 先看 P50/P95/P99 超预算比例 GC 有效样本均值 内存趋势和采样缺口 再按 `detail` 查询异常附近帧
6. 正式复测提供条件 JSON 与代码版本 使用项目 IPerformanceContext 钩子记录玩家 阶段 后处理和画面证据 无钩子仍可探索采样 但健康或画面未验证时 diff 拒绝得出收益
   可用 `mark` 打标记 标记是观测时间 不代表精确的事件执行时刻
7. 只有采样和热点证据支持时才定位根因 否则列待验证假设和下一次采样 静态规则置信度不是因果概率
   静态命中先核对 jumpTo 与运行范围 分析游戏时不能把工具自身 Editor 界面的风险当成游戏热点
8. 修改交给 `mm-fake-unity-fucker` 和工程规范 修改后按相同目标 场景 阶段 操作 分辨率 质量 框架版本与采样参数复测

## 连续数据与证据

- `analyze` 在全部已采样帧上计算统计 零分配计入均值 不可用值不计入分母 原始明细完整落盘
- 摘要只返回前几个超预算区间 区间按时间连续合并 不是逐帧灌入提示词 `detail` 按索引查询邻近证据
- 长采样最多保存 300000 条样本 达到上限会提前完成并注明原因 暖机时间不计入样本
- 在 Recorder 启动与采样计时前预留 max_frames 个样本 避免采样中扩容产生 GC 峰 该预留会增加工具自身内存占用 可按测试时长调低上限
- 采集的是 Editor Play 中观测到的样本 帧间隔含编辑器和采集开销 不命名为 CPU 执行耗时
- Recorder 指标附带名称 单位与有效性 并记录读取时单调时钟 Unity frameCount 与最近 Profiler 索引 三者不视为严格逐帧对应 当前 GC 口径可能包含 Editor 进程分配
- 上游元信息非有限缺失标记保存为 JSON null 旧报告分析时列出规范化字段 真实采样值非有限时仍报错 不填零
- `--profile-frames` 显式开启有界原始 Profiler 帧导出 `--allocation-stacks` 额外开启分配栈 结束恢复原设置 该模式会增加开销 不混比普通采样
- `hotspots` 分析原始线程 Marker 包含耗时和可用分配栈 无数据或截断明确报告 不用上游字符串猜列解析
- RuntimeCapture 由业务显式 Begin 采集 Player LateUpdate 数据 不自动启动组件 Editor 与 Player 不混比
- `series` 汇总交错 A/B 或 B/A 多轮配对 `overhead` 测量计数器开关的增量 并保留测量段和落盘计数
- GPU 仅增加可用的 GPU Frame Time 计数器 没有绘制调用级归因 内存上涨只称增长 不直接称泄漏
- 源码格式与查询参数读 [数据与分析](references/data-and-analysis.md) 源码局限读 [上游与边界](references/upstream.md)

## 操作与恢复边界

- start/cancel/mark 通过声明为写操作的 Provider 执行 使用 `--yes` 仍遵守共享保护
- 静态审计会写诊断文件但不修改业务资产 标记为保守写操作 避免在保护现场隐式启动重任务
- 只读 probe/status/result 可在保护下查询 不通过 Roslyn 或另一传输绕过保护
- CLI 返回 outcome_unknown 或 processing_timeout 时只查 `editor result <原 request ID>` 和同一 job_id 禁止换 ID 自动重发
- 域重载 编辑器退出或暂停会终止当前采样 不自动恢复或重复执行 静态 running 收据失去活任务时报告 interrupted
- cancel 释放计数器并保存任务终态 取消的任务不作为完整采样 没有完整可撤销承诺
- 截图或录像仅按需辅助辨认阶段与画质 不替代数据 不在默认采样循环持续截图

调用示例 使用 `$mm-performance-fucker` 与 `$mm-fake-unity-fucker` 分析当前场景 先采样定位 再修改并按同条件复测
