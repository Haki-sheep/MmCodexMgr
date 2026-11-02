# 案例 03

这是合成评估输入 不是真实项目取证 不得把下面记录描述成实际执行结果
仅使用本页资料 不启动 Unity 不主动寻找或复现新 Bug

## 请求

基于以下已知缺陷历史梳理 UI 消息订阅相关技术债 不做功能验收 不修改代码

## 输入资料

快照 sample-c 调查范围 PoolHost.cs BagPanel.cs MailPanel.cs EventBus.cs
PoolHost.Rent 从池中取面板 然后调用面板 Bind
PoolHost.Return 只停用面板然后放回池中
BagPanel.Bind 与 MailPanel.Bind 都调用 EventBus.Subscribe 并把返回令牌保存在字段中
两个面板和 PoolHost 均未定义归还时释放该令牌的职责

已有 issue U-11 与 U-19 分别记录 BagPanel 和 MailPanel 重开后重复处理一次消息
已有修复 f11 在 BagPanel 的关闭按钮中释放令牌 f19 在 MailPanel 的关闭按钮中释放令牌
已有 issue U-23 和已有日志说明场景切换通过 PoolHost.Return 归还面板 没经过关闭按钮 因而重复处理仍然发生
现有联调记录显示团队每天在联调期间手动清空 EventBus 后重试 主流程能继续完成 这一补偿连续多个工作日发生
现有台账 TD-007 为面板租用周期缺少统一订阅释放归属 状态待处理 关联 U-11 U-19
没有修改后快照 未提供范围之外的引用和测试覆盖
