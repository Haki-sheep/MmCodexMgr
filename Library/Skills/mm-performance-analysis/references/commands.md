# 安装与命令

Skill 名称为 `mm-performance-analysis` 用户指定的交付文件夹保留原拼写
此目录是交付源 可明确指定路径使用 或注册到 Codex 的 Skills 目录 本机使用目录联接保持交付源与安装入口同步

## 前置条件

- Python 3.10+ 仅使用标准库
- 目标工程已安装可用 FakeUnityCLI Editor Bridge 支持 `online_providers` SDK 1.1
- `--fuc` 指向工程实际 exe 或 DLL 复用 `$fakeunity-cli` 的入口选择 不绑定维护者机器源码路径
- 没有 Bridge 时使用 CLI Skill 的正式 bootstrap/bridge-update 流程 本包不安装 Bridge

## 部署

以下命令中 `<skill>` 是本 Skill 根目录 `<project>` 是 Unity 根目录 `<fuc>` 是实际 CLI

```text
python <skill>/scripts/install.py --project <project>
python <skill>/scripts/install.py --project <project> --fuc <fuc> --apply
```

默认只预览 写入前通过 CLI `editor operation-prepare edit-required` 检查和准备
用户已选择 free 时该命令可能按 CLI 策略停止 Play 保留现场时不得改变模式绕过拒绝
默认 auto 未满足 Edit 则延后部署 不擅自停止业务运行

部署位置

- `Assets/PerfAgent` 上游主模块 含原作者界面与 Agent 代码 本工具不调用聊天与自动修复
- `Assets/MmPerformance` 本包独立采集器与 Provider
- `Tools/FakeUnityCLI/plugins/mm-performance/manifest.json` 项目命令别名

仅创建不存在的完整目录 已部署目录必须与随包文件 hash 相同 不自动覆盖工程修改
若已通过 UPM 或另一目录安装 PerfAgent 则拒绝重复程序集 先核对已有安装再制定适配方案
Unity 自行导入生成新增源码的 meta 不手写 GUID
跨目录发布不是全工程事务 失败返回已发布范围 不自动删除或覆盖来伪装回滚

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
