---
name: mm-reverseproject-fucker
description: 对游戏反编译与逆向还原任务进行源码取证、逻辑转译和验收。适用于核对 DLL 或原指令、恢复对象与调用关系、验证托管参考工程，以及复盘 Unity 工程还原与多会话交接。
---

# 游戏逆向与工程还原

- 从要验证的行为或调用点倒查首个缺失生产者。固定二进制版本、来源哈希和观察范围。根据实际调用、字段读写宽度与消费者确认语义，沿控制流确认函数边界。
- 先用能区分两种解释的输入检验关键分支、对象身份和回调副作用。记录夹具提供的值、替身调用、首次错误与停止位置。保留原始证据和候选差异。
- 交付以真实入口和已观察行为为准。明确原指令回放、托管组合回归、动画数据采样、Unity 实跑、原游戏对照各自的覆盖范围。协作时固定基线、任务 ID、写入范围和唯一整合者。

## 按症状查案例

- DL1 回传顺序、接管、证据漏采和交接验收，读 [D 会话复盘](references/dl1-executor-d-lessons.md)。
- DL1 跑酷浮点、回调重读和正式工程合入，读 [DL1 会话经验](references/dl1-session-coordination-lessons.md)。传感器、raw 命中布局和返工，读 [B 会话复盘](references/dl1-executor-b-lessons.md)。
- 鸭科夫的 Unity 运行、材质与现场验收，读 [Unity 逆向还原经验](references/coordinator-and-worker-lessons.md)。
- PVZ 的 IL2CPP 候选、元数据和资源工程，读 [PVZ 复盘](references/pvz-coordinator-and-worker-lessons.md)。
- 茶屋的 Unity 编译、域重载与资源恢复，读 [茶屋复盘](references/chawu-session-coordination-lessons.md)。
