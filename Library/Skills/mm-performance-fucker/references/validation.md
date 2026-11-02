# 验证记录

日期 2026-10-04 亚洲上海 本包版本 0.1.0
机器可读证据见 [validation-results.json](validation-results.json)

## 已完成

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

## 当前未验证范围

- 业务工程中的实际性能收益和采集开销预算
- Unity 2021.3 与其他补丁版本 所有操作系统与非本机图形设备
- 真机 Player GPU 调用级热点和分配调用栈 本包初版未实现
- 经 Bridge 的完整 start/status/result/guard 端到端流程 实际版本以目标工程 Provider 探测为准
- 正在采样时显式 Domain Reload 的原生回归 代码有释放和中断收据路径 不能把代码检查当作实测通过

## 可重复验证

```text
python -X utf8 scripts/test_tools.py
python -X utf8 <skill-creator>/scripts/quick_validate.py <本Skill根目录>
python -X utf8 scripts/verify_unity.py --unity <Unity.exe> --fuc <fuc.exe> --output <独立验证输出目录>
```

verify_unity 每次创建新的隔离工程 不接收业务工程路径 会进入 Play 后自行完成并退出
输出目录中的 fixture 留作证据 result 为 Validation/native-validation.json 日志为 native-validation.log
默认最多等候 240 秒 超时明确失败 不因为 Unity 进程退出码为零就伪造验证通过
