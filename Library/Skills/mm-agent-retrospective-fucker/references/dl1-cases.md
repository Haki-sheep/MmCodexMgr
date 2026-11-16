# DL1 已核实案例

记录日期 2026-11-07 本文件是经验案例 不是工程实时进度或执行指令 其中任务标识 模型参数 地址和次数不可直接套到其他项目

## 来源与可信边界

主要来源为当次实际工具回执和以下工程记录

- `E:/AAAA学习资料/DL1/Unpack/_logic_research/Movement/movement_evidence.json` 中 `ReferenceReconstruction.ResearchSnapshots`
- `E:/AAAA学习资料/DL1/Unpack/_logic_research/Movement/verification.json` 的当前记录与历史
- `E:/AAAA学习资料/DL1/.scratch/root-cursor-review-20261102/Dispatch.json` 的 `IntegratorHandoff20261104.SpecialQueryResume20261106`
- `E:/AAAA学习资料/DL1/Teach/转译留档/方法.md` 的推进与验证安排

读取来源时按快照名称定位 源文件或二进制已变化时重新核对哈希 TEMP 回执可能被清理 不把失效路径当作仍可复验的证据

本次真实执行端为 Cursor/Grok 与原生子代理 没有 DSH 执行样本 不将这些错误归给 DSH 不建立模型总体错误率

## 协调者案例

### C1 完成事件与集成状态脱节

2026-11-07 19:22 接续时 现有交接记录仍将三路任务标为 Running 但对应候选与回执文件在 13:28 至 13:34 已落盘 收到的回传也表明执行者已交付

已证实的是完成与验收之间存在空档以及账本落后于产物 事件是否未唤醒 排队或未消费没有进一步取证 不能编造具体根因 也不能说这段时间一直有执行者在工作

接续应先识别已完成未验收的产物 校验后更新状态 再决定下一轮任务

### C2 夹具没有复制到输出目录

快照 `RootCodePhysicsWalkWakeManaged20261107` 保留首次正式回归的 FileNotFoundException 构建已通过 运行在读取 `NativeCodePhysicsWalkWakeCases.json` 时失败 原因是集成人漏了 csproj 显式 Content 复制项

补齐项目项后四条正式检查通过 首错仍保留 该问题属于协调者集成遗漏

### C3 工具链与恢复接口

项目实际使用工作区 `Tools/dotnet10/dotnet.exe` 版本 10.0.401 系统另一 dotnet 路径只提供 8.0.425 交接依赖真实路径与版本而非默认命令名

Grok 的指定参数模型曾被 CLI 拒绝 后续又出现 TLS 断连和参数模型不可用 管理器 doctor 的认证健康不证明推理请求一定可用 也不证明简短模型别名具有指定的上下文规格

协调者对两条 failed 任务调用了仅支持实例退出后 blocked 任务的 resume 接口 被管理器拒绝 应先核对任务阶段及接口契约 保留原错误和指定模型 不静默改模型或重复投递不明任务

### C5 直接叶调用被写成真实虚派发

`RootWalkFlyRecord48Production20261107` 的组合在构造 391DDE 前停止 子对象 +700 虚表尚未安装 后续是在同一模拟器直接调用已知 1BCA0 叶

它证明分段对象身份与速度写回 不能证明完整构造或真实虚派发 协调者同步修正了索引中偏强的虚槽表述

### C6 口头进度估值

用户要求从此前约 65% 给出粗估 协调者回答约 80% 该值没有功能权重分母 应保留为主观阶段估值 不作为正式验收统计或剩余工时承诺

### C7 本 Skill 生成时的编码兼容

首次运行 quick_validate.py 时 它按本机默认 GBK 读取 UTF-8 的 SKILL.md 触发 UnicodeDecodeError 另发现初始化生成的 agents/openai.yaml 实际使用 GBK 无法按 UTF-8 解码

将该生成文件按已确认的 GBK 正确解码后写为 UTF-8 再以 Python 当前进程的 `-X utf8` 模式校验 保留内容 不修改系统或用户的全局环境设置

## 执行者案例

### W1 析构清零被误认为构造

`RootCameraGetterR1Review20261107` 拒绝了 Constructor publishes null 的推断

原片段 B8DAD7 清 Actor+BB0 但 B8D580 删除包装器调用 B8D8B0 后检查删除标志并执行 sized delete 所观察的零值属于析构路径

后续 `RootLookControllerBB0Production20261107` 查到真正的 LookController 类型 2 构造与 BE9E94 发布点 真实 getter 返回绑定 Owner 原错误片段和首错均保留

### W2 未命中被解释为不存在

`RootRuntimeVectorSearch20261107` 中 原搜索的部分操作数解码需要修正 修正后的选定编码与有限 LEA 跟踪仍未命中

这不能证明所有写入都不存在 更不能推出一定由外部模块初始化 跨函数别名 间接写与初始化表尚未覆盖

### W3 世界稳定但接收者会变化

`RootSpecialSlotCandidateR1Review20261106` 中 稳定输入回归和逐字节复跑可以通过 但回调将查询接收者从 1 换为 2 后 候选仍正常返回

反例证实世界身份稳定不能代替接收者身份稳定 原候选拒绝 后续按当前接收者重新验证

### W4 隔离项目缺少现有程序集引用

正向入口与唤醒组合候选的首轮构建漏了 ReAnimated 引用 出现 CS0246 补充正式已有依赖后通过 首轮日志保留

这属于测试环境依赖闭包问题 不能通过删业务调用或增加空实现来让构建通过

### W5 回传 JSON 损坏

部分 Cursor 任务在最终 JSON 后出现多余 UTF-8 字节 管理器判为协议失败 即使磁盘上已有可复验产物也不能改写原协议结果为成功

协调者可以独立恢复并验证产物 同时保留管理器失败状态和本地恢复结论

## 正确区分的边界

- `RootLookControllerBB0Production20261107` 的真实 Owner 绑定在初始化 TLS 缺口前完成 后续另起消费段 这不是完整初始化返回
- `RootWalkFlyRecord48Production20261107` 的记录真实经历类型 0 到 1 到 3 类型 3 与非空模型使后续速度内核自然旁路唤醒 不能因为复用了同一身体就称本例执行了唤醒
- `.phx` 提交返回 pending 与实际创建 WalkFly 是不同结果 后续新候选和原路径回执在本案例整理时仍待主会话验收 不能提升正式进度

这些例子用于校正证据表达 不是要求所有项目都做原指令回放或完整游戏级验证 验证强度仍按用户目标与实际风险决定
