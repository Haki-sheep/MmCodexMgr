# 验证记录

日期 2026-11-07 亚洲上海 当前适配器版本 0.2.0
机器可读证据见 [validation-results.json](validation-results.json)

## 0.2.0 当前验证

- Skill Creator quick_validate 通过
- Python 24 项行为测试通过 新增现场有效性 错误刷屏 渲染与玩家条件差异 观测通道差异 版本变更 AB/BA 多轮及重复任务拒绝
- 安装验证覆盖轻量与完整 Profile 分离 发布失败范围与系统 TEMP 清理 条件 JSON 的单 argv 传递和原请求身份
- Unity 2022.3.62f3 与 6000.3.26f1 SDK 分别编译 Runtime Editor 可选审计桥 上游及两个原生测试入口 零错误
- 新适配器无编译警告 上游保留 2022 的 6 个与 6000 的 9 个过时 API 警告
- Runtime 程序集单独编译且不引用 Editor 或 PerfAgent

原生验证未通过 两个 Editor 均在项目编译前因无有效许可证退出
2022 exit=1 与 6000.3 exit=198 首错为 No valid Unity Editor license found
另一次选择 6000.4.0f1 目录发现实际 Unity.exe 缺失 未执行 不能把目录存在视为已安装 Editor
新增 Player 构建与执行入口 未进入构建阶段 不报告 Player 或真机通过
托管编译不能代替 Unity 导入 编译代次 原始帧与调用栈运行验证

尚需在有效许可证和目标设备上验证 原始帧/符号实际可用性 计数器逐平台可用性 画面钩子 释放与恢复 完整 Bridge 保护链 采集器完整开销
GPU 目前只有可用计数器读取 没有绘制调用级归因 两端现场快照也不证明整个区间一致

## 0.1.0 历史记录

以下为 2026-10-04 的旧版验证 仅说明旧版范围 不作为 0.2.0 原生运行证据

### 已完成

- Skill Creator quick_validate 通过 Windows 上显式启用 Python UTF-8 执行 中文 SKILL.md 不使用系统 GBK 解码
- scripts/test_tools.py 14 项行为测试通过 覆盖零分配 缺失指标 4000 帧全量均值 时间连续窗口 漏采帧 单位校验 历史不可变 对比条件 部署冲突 已有 UPM 与动态/静态元信息缺失
- 2022.3.62f3 和 6000.4.10f1 官方托管程序集的源码编译检查均为零错误
- 独立 Unity 2022.3.62f3 原生 fixture 验证成功
- 独立 Unity 6000.4.10f1 原生 fixture 验证成功
- 两个原生验证覆盖 probe 静态 audit Edit 拒绝采样 Play 实际采样 同请求稳定任务编号 并行采样拒绝 阶段标记 取消 暂停中断与暂停拒绝
- 实际 Unity 生成完整帧 JSON 可被分析器读取 有效零 DrawCall 被保留
- 已导入 fixture 的安装预览核对全部随包文件 hash 为 identical
- 已安装 FakeUnityCLI 程序通过项目 manifest 发现全部 7 个 mmperf 动态命令

原生验证在任务自有隔离工程中运行 没有打开或改动用户业务工程
原生验证直接调用真实 Unity Provider 不等同经 Bridge 的完整传输与保护回归
首次验证回执放在 Unity 退出后会清理的 Temp 中 导致验证程序报告缺失 修正到 Validation 目录后完整重跑成功
首次托管检查同时引用旧根 UnityEditor.dll 与新模块造成重复类型 修正验证项目的引用后检查通过
独立评审发现上游元信息 NaN 使严格 JSON 摘要失败 已修复为元信息 null 并保留实际观测非有限值的拒绝
评审发现采样列表扩容会产生工具自身 GC 峰 已改为采样前按 max_frames 预分配 并说明其内存代价
修正后的两版本原生报告均通过严格 JSON 解析及 analyze/detail 实际链验证 最后仅调整局部变量命名 并重做两版本托管编译
独立评审复核为条件通过 此前 P1/P2/P3 疑点均已关闭 没有发现残留 P0/P1 条件来自下列未验证范围

### 旧版未验证范围

- 业务工程中的实际性能收益和采集开销预算
- Unity 2021.3 与其他补丁版本 所有操作系统与非本机图形设备
- 真机 Player GPU 调用级热点和分配调用栈 本包初版未实现
- 经 Bridge 的完整 start/status/result/guard 端到端流程 实际版本以目标工程 Provider 探测为准
- 正在采样时显式 Domain Reload 的原生回归 代码有释放和中断收据路径 不能把代码检查当作实测通过

## 可重复验证

```text
python -X utf8 scripts/test_tools.py
python -X utf8 <skill-creator>/scripts/quick_validate.py <本Skill根目录>
python -B -X utf8 scripts/verify_compile.py --editor <已安装Editor目录>
python -B -X utf8 scripts/verify_unity.py --unity <Unity.exe> --fuc <fuc.exe> --output <系统TEMP内任务目录> --profile capture --build-player
```

verify_unity 每次创建新的隔离工程 不接收业务工程路径 会进入 Play 后自行完成并退出
fixture 只在系统 TEMP 内创建 原生回执为 Validation/native-validation.json 日志为 native-validation.log
Player 需要匹配的 Windows Build Support 编译成功后执行验证 Deadline 单独计算
调用方在归档必要证据后于任务结束前清理本任务 fixture 失败也须清理 不清理其他任务目录
默认 Editor 最多 240 秒 Player 构建 300 秒 执行 60 秒 超时明确失败 不把退出码零单独当作通过
