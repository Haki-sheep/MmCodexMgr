# 数据与分析

## 报告合同

`schema_version=1` 由本包定义 CaptureReport 包含

- `job` 原 request_id job_id Editor 实例与会话 state 开始结束时间 结束原因 result_path
- `options` seconds warmup fps max_frames stall_seconds phase
- `environment` 启动时采集的 Unity 版本 场景 平台 设备 图形 分辨率 质量 管线与物理配置
- `countersList` 原生名称 单位与探测可用性
- `samplesList` 全部已观察帧 含 frame elapsed_seconds interval_ms 四种指标与四种有效性字段
- `eventsList` 外部显式阶段标记 观察时刻和帧编号

四种计数器按原生公开 ProfilerRecorderHandle 能力列表发现 不凭猜测填零

| 指标 | 原生名称 | 单位 | 有效性字段 |
|---|---|---|---|
| gc_alloc_bytes | GC Allocated In Frame | Bytes | gc_alloc_valid |
| main_thread_ns | Main Thread | TimeNanoseconds | main_thread_valid |
| draw_calls | Draw Calls Count | Count | draw_calls_valid |
| total_used_memory_bytes | Total Used Memory | Bytes | memory_valid |

可用性不等于已有样本 Recorder 必须 Valid 且 Count>0 才记录有效值
零值是有效观测 单位不匹配时分析器明确标注 unsupported_unit 不擅自解释
同一采样时刻读取最近 Recorder 数据 不承诺其严格对应相同的 Time.frameCount
上游元信息的 NaN/Infinity 缺失标记在落盘时写为标准 JSON null 字符串内相同文字保持原样
旧版本报告仍可解读 分析输出把元信息缺失规范为 null 并列出 metadata_unavailable_fields
观察帧的时间间隔和计数值必须为有限数字 不对实际观测值执行该元信息规范化

## 连续数据提取

`analyze` 使用全量 samplesList nearest-rank 分位数
分母分别为已观察帧数和各计数器有效样本数 缺口外的帧不作为虚构数据
超预算区间只合并帧编号连续且 interval_ms>1000/fps 的样本 按累计超预算毫秒排序
GC 峰值列表按单帧有效字节数排序 这些是调查入口 不是调用栈或因果关系
内存趋势计算有效样本首尾差值与速度 不做泄漏判定
采样前按 max_frames 预分配完整样本列表 计数器启动和计时之前完成该分配 采样期间列表不扩容
默认预留 300000 个样本会增加采集器内存 按已知时长和帧率调整上限 不能把工具占用当作业务内存
Recorder 和每秒状态落盘仍有采集开销 本包未测业务场景的开销预算
摘要默认显示 5 个区间与 GC 峰值 需要时 --limit 最多 50
事件摘要最多 100 条 总数单独返回 详情按异常附近的时间范围过滤

优先调查持续慢帧 再调查孤立尖峰 最后检查长期趋势
区分主线程耗时与 Editor 更新间隔 若等待或 VSync 引起间隔变大 不能直接认定 CPU 忙
Main Thread 计数器仍只是该 marker 的观测值 不能用来给任意业务方法归因

## 可比性

diff 校验完整按时长结束 不允许 sample_limit 或 interrupted 报告得出收益
校验设备 场景 Unity/适配器版本 分辨率 质量 管线 VSync 阶段和采样参数
阶段 unspecified 不用于正式对比 同一 job 不可对比 条件不同报告具体差异
输出描述性差值 不用固定百分比代替统计显著性
动作序列 输入 数据规模和后台环境相同仍需场景脚本或人工证据 多轮重复测量按实际需求补充

## 静态审计

AuditReport 包含 job snapshot 与当时 budget 副本 不在读取时用当前设置重新分析
调用上游环境 内存 资产 场景 物理和代码采集器 不读取猜列的 Marker 排行
notes 是必须读取的证据 包括跳过 截断和数据不可用 上游局部失败处理仍可能保留部分结果
静态规则建议只能称风险 不用上游 confidence 字段证明因果
