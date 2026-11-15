# 安装与命令

Skill 名称为 `mm-performance-fucker` 维护源与安装目录均使用统一名称
维护源与 Codex 安装目录使用独立副本 覆盖安装需明确授权 不创建目录联接

## 前置条件

- Python 3.10+ 仅使用标准库
- 目标工程已安装可用 FakeUnityCLI Editor Bridge 支持 `online_providers` SDK 1.1
- `--fuc` 指向工程实际 exe 或 DLL 复用 `$mm-fake-unity-fucker` 的入口选择 不绑定维护者机器源码路径
- 没有 Bridge 时使用 CLI Skill 的正式 bootstrap/bridge-update 流程 本包不安装 Bridge

## 部署

以下命令中 `<skill>` 是本 Skill 根目录 `<project>` 是 Unity 根目录 `<fuc>` 是实际 CLI

```text
python -X utf8 <skill>/scripts/install.py --project <project> --profile capture
python -X utf8 <skill>/scripts/install.py --project <project> --fuc <fuc> --profile capture --apply
```

默认只预览 写入前通过 CLI `editor operation-prepare edit-required` 检查和准备
用户已选择 free 时该命令可能按 CLI 策略停止 Play 保留现场时不得改变模式绕过拒绝
默认 auto 未满足 Edit 则延后部署 不擅自停止业务运行

部署位置

- capture 默认仅部署采集器与命令别名 不依赖 PerfAgent
- full 额外部署 `Assets/PerfAgent` 与 `Assets/MmPerformanceAudit` 提供静态审计 不调用聊天与自动修复
- `Assets/MmPerformance` 本包独立采集器与 Provider
- `Tools/FakeUnityCLI/plugins/mm-performance/manifest.json` 项目命令别名

仅创建不存在的完整目录 已部署目录必须与随包文件 hash 相同 不自动覆盖工程修改
full 若已通过 UPM 或另一目录安装 PerfAgent 则拒绝重复程序集 先核对已有安装再制定适配方案
Unity 自行导入生成新增源码的 meta 不手写 GUID
暂存使用系统 TEMP 创建失败直接报错 不另建工程缓存目录
从暂存复制发布 支持 TEMP 与工程位于不同盘符 跨目录发布不是全工程事务
失败返回已发布与可能部分写入的目标 暂存自动清理 不删除工程内容或伪装回滚

部署后按 CLI Skill 执行 refresh 和编译证据验证 再检查

```text
<fuc> editor provider-list --project <project> --json
<fuc> editor provider-describe mm-performance --project <project> --json
python <skill>/scripts/perf.py probe --project <project> --fuc <fuc>
```

只有文件 hash 校验通过不代表 Unity 已编译或 Provider 已发现

## 审计与采样

```text
python <skill>/scripts/perf.py audit --project <project> --fuc <fuc> --yes
python <skill>/scripts/perf.py start --project <project> --fuc <fuc> --seconds 60 --warmup 2 --fps 60 --phase combat --request-id <32位GUID> --yes
python <skill>/scripts/perf.py status --project <project> --fuc <fuc> --job-id <job-id>
python <skill>/scripts/perf.py mark --project <project> --fuc <fuc> --job-id <job-id> --text 打开背包 --yes
python <skill>/scripts/perf.py result --project <project> --fuc <fuc> --job-id <job-id>
python <skill>/scripts/perf.py cancel --project <project> --fuc <fuc> --job-id <job-id> --yes
```

CLI 动态别名为 `mmperf probe/audit/start/status/result/cancel/mark`
Skill 包装器管理 argv 与默认参数 CLI 全局参数和业务参数用 `--` 分隔
例如 `fuc mmperf start --project <project> --json --request-id <id> --yes -- --seconds 60 --phase combat`

采样不主动进入 Play 不控制玩家操作 start 要求稳定未暂停的 Play audit 要求空闲 Edit
stdout 保留 CLI 原 JSON envelope 包装器在派发前将原 request ID 写入 stderr
start/audit 的 job_id 是原请求 GUID 标准化的 32 位形式 result 返回路径和状态 不把全量帧经 Bridge 塞入上下文
诊断数据位于 `Library/MmPerformance` 该目录可能被清理 分享或长期保存时按用户要求复制报告到指定输出目录

原 CLI 请求未知时

```text
<fuc> editor result <原request-id> --project <project> --json
```

不得自动以新 request ID 重启 start/audit/cancel/mark 不伪造恢复能力
任务 state 为 completed 仅表示采集或审计流程完成 不表示性能达标

## 离线解读

```text
python <skill>/scripts/perf.py analyze <报告.json>
python <skill>/scripts/perf.py detail <采样报告.json> --index 150 --radius 10
python <skill>/scripts/perf.py diff <优化前.json> <优化后.json>
```

`analyze` 支持本包静态审计或动态采样 envelope 不直接支持上游裸 PerfSnapshot
`detail` 返回最多 201 个附近样本 `diff` 条件不匹配返回 comparable=false 和非零退出码 不给改善结论

## 正式复测与深采样

条件文件为 JSON 对象 至少记录 protocol_id 与 workload_id 其余字段按项目补充 seed 输入重放 数据规模 Shader 集合等
代码或构建版本单独用 --revision 记录 可以作为 A/B 的被测变更 不放入需要完全相同的工作负载 JSON 多轮series内A组与B组各自必须保持同一code_revision 同组版本变化拒绝汇总收益

```text
python -X utf8 <skill>/scripts/perf.py start --project <project> --fuc <fuc> --phase combat --conditions-file <条件.json> --revision <build-id> --context-type "Game.PerfContext, Assembly-CSharp" --yes
python -X utf8 <skill>/scripts/perf.py start --project <project> --fuc <fuc> --phase combat --conditions-file <条件.json> --revision <build-id> --context-type "Game.PerfContext, Assembly-CSharp" --profile-frames 120 --allocation-stacks --yes
python -X utf8 <skill>/scripts/perf.py hotspots <job.profiler.json> --limit 10
```

项目钩子实现 `MmPerformance.IPerformanceContext` 并提供无参构造函数 Capture 返回 ContextSnapshot
钩子只查询项目现状 在启动和结束调用 发生异常立即报告失败
项目负责提供 `health_verified` `healthy` `visual_status` 与 `evidence`
visual_status 只能为 valid invalid unverified 不得因为 Camera 存在就填 valid
画面证据可指向已核验截图或项目有效性检测结果 不自动持续截图 不自动改变画质或鼠标状态
`project_json` 记录玩家位置 Volume 后处理 任务阶段 Shader 集合等通用快照无法理解的条件
通用快照记录活动相机姿态 FOV 像素尺寸 常见 URP 后处理抗锯齿和管线 renderScale FSR MSAA 等公开属性
属性不存在时不推断默认值 自定义设置由项目钩子补充

原始帧最多导出最近 300 帧 128 线程 250000 Marker 栈最多 256 层
Profiler 环形缓冲覆盖早帧或命中上限时标记 truncated 不称全窗口完整覆盖
该模式显式修改 Profiler enabled 与 allocation callstack 状态 结束与中断时恢复原值 不开启 Deep Profile 或自动 GPU 模块
保留原始帧/线程/样本索引和原生时间戳 可用符号由 ResolveMethodInfo 解析 无符号保留地址

## 多轮与开销对照

```text
python -X utf8 <skill>/scripts/perf.py series <多轮清单.json>
python -X utf8 <skill>/scripts/perf.py overhead <计数器关闭.json> <计数器开启.json>
```

多轮清单格式如下 每个相邻配对各有 A 与 B 至少两个配对 路径相对清单位置解析
不自动重放业务操作 不自动剔除异常帧 不跨环境或工作负载汇总

```json
{"runs":[{"group":"A","report":"a1.json"},{"group":"B","report":"b1.json"},{"group":"B","report":"b2.json"},{"group":"A","report":"a2.json"}]}
```

计数器关闭组启动时传 `--counters-off` 两组保留同一观察器 因此只测原生计数器增量 不是整个采集器零开销基线
`--receipt-seconds 5` 为默认收据间隔 传 0 仅保存启动和终态
回调计时为读取计数器与追加样本的测量段 另记录收据落盘次数和耗时 首次终态写入耗时
计时器自身和观察调度仍有开销 测完整采集器成本需用外部独立帧时间源对照不开启采集的运行

## Player 通道

Runtime 程序集无需 Editor 或 PerfAgent 不自动加入场景 不自动采样
在指定测试构建的业务初始化入口获取 RuntimeCapture 后显式调用

```csharp
Capture.Begin(new MmPerformance.CaptureOptions
{
    seconds = 30,
    warmup = 2,
    phase = "combat",
    conditions_json = ConditionsJson,
    code_revision = BuildId,
    context_type = typeof(Game.PerfContext).AssemblyQualifiedName
}, System.IO.Path.Combine(UnityEngine.Application.persistentDataPath, "capture-unique-id.json"));
```

输出须为尚不存在的绝对路径 Mark 打标 End 取消 组件禁用或应用暂停保存 interrupted
Player LateUpdate 记录单调时钟与 frameCount Recorder 仍读最近值 不声称严格同帧
Runtime 不接受 Editor 的 profile_frames/allocation_stacks 分配栈与原始帧通过 Development Player 连接正式 Profiler 取得
真机计数器可用性和开销需按平台验证 不把 SDK 编译当作 Player 运行通过
