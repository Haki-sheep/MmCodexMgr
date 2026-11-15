using System;
using System.Collections.Generic;

namespace MmPerformance
{
    #region 采样合同

    [Serializable]
    public sealed class CaptureOptions
    {
        /// <summary> 有效采样时长 秒 </summary>
        public double seconds = 30;
        /// <summary> 暖机时长 秒 </summary>
        public double warmup = 2;
        /// <summary> 观测目标帧率 </summary>
        public int fps = 60;
        /// <summary> 样本数量上限 </summary>
        public int max_frames = 300000;
        /// <summary> 无新帧超时 秒 </summary>
        public double stall_seconds = 10;
        /// <summary> 场景阶段名称 </summary>
        public string phase = "unspecified";
        /// <summary> 同条件场景协议 JSON </summary>
        public string conditions_json = "";
        /// <summary> 代码或构建版本 用于记录被测变更 </summary>
        public string code_revision = "";
        /// <summary> 项目健康检查钩子的程序集限定类型名 </summary>
        public string context_type = "";
        /// <summary> 关闭原生计数器用于测量其增量开销 </summary>
        public bool counters_enabled = true;
        /// <summary> 收据写入间隔 秒 零表示仅保存终态 </summary>
        public double receipt_seconds = 5;
        /// <summary> 导出最近原始 Profiler 帧上限 零表示不开启 </summary>
        public int profile_frames;
        /// <summary> 显式开启 GC 分配栈 结束后恢复设置 </summary>
        public bool allocation_stacks;
    }

    [Serializable]
    public struct Sample
    {
        /// <summary> Unity 帧编号 </summary>
        public int frame;
        /// <summary> 相对采集启动时间 秒 </summary>
        public double elapsed_seconds;
        /// <summary> Editor 更新观测间隔 毫秒 </summary>
        public double interval_ms;
        /// <summary> 当前进程帧分配 字节 </summary>
        public long gc_alloc_bytes;
        /// <summary> 分配计数器样本有效 </summary>
        public bool gc_alloc_valid;
        /// <summary> Main Thread 计数器耗时 纳秒 </summary>
        public long main_thread_ns;
        /// <summary> 主线程计数器样本有效 </summary>
        public bool main_thread_valid;
        /// <summary> 当前帧绘制调用次数 </summary>
        public long draw_calls;
        /// <summary> 绘制计数器样本有效 </summary>
        public bool draw_calls_valid;
        /// <summary> 总使用内存 字节 </summary>
        public long total_used_memory_bytes;
        /// <summary> 内存计数器样本有效 </summary>
        public bool memory_valid;
        /// <summary> Unity 原生帧时长 毫秒 </summary>
        public double unity_delta_ms;
        /// <summary> 本次读取的单调时钟 秒 </summary>
        public double observed_seconds;
        /// <summary> 读取时 Profiler 最后完整帧索引 不等同 Unity 帧编号 </summary>
        public int profiler_frame_index;
        /// <summary> GPU Frame Time 耗时 纳秒 </summary>
        public long gpu_frame_ns;
        /// <summary> GPU 计数器样本有效 </summary>
        public bool gpu_frame_valid;
        /// <summary> 当前计数器读取与样本追加耗时 微秒 </summary>
        public double capture_callback_us;
    }

    [Serializable]
    public sealed class CounterInfo
    {
        /// <summary> 稳定指标名称 </summary>
        public string key;
        /// <summary> Unity 原生计数器名称 </summary>
        public string name;
        /// <summary> Unity 原生单位 </summary>
        public string unit;
        /// <summary> 是否支持此计数器 </summary>
        public bool available;
    }

    [Serializable]
    public sealed class PhaseEvent
    {
        /// <summary> 标记文字 </summary>
        public string text;
        /// <summary> 标记时刻 秒 </summary>
        public double elapsed_seconds;
        /// <summary> 标记时 Unity 帧编号 </summary>
        public int frame;
    }

    [Serializable]
    public sealed class CaptureReport
    {
        /// <summary> 本包数据格式版本 </summary>
        public int schema_version = 1;
        /// <summary> 采样器版本 </summary>
        public string adapter_version = "0.2.0";
        /// <summary> 帧采样任务收据 </summary>
        public Job job;
        /// <summary> 采样条件 </summary>
        public CaptureOptions options;
        /// <summary> 环境信息 不含采样后重新推导的结论 </summary>
        public EnvironmentInfo environment;
        /// <summary> 观测通道及帧映射语义 </summary>
        public string observation_source = "editor_update";
        /// <summary> 启动及结束现场快照 </summary>
        public List<ContextSnapshot> contextList = new List<ContextSnapshot>();
        /// <summary> 采样期错误数 含断言和异常 </summary>
        public int error_count;
        /// <summary> 有界错误消息 </summary>
        public List<string> errorList = new List<string>();
        /// <summary> 采样器自身开销汇总 </summary>
        public CaptureOverhead overhead = new CaptureOverhead();
        /// <summary> 原生热点证据文件绝对路径 </summary>
        public string profiler_path = "";
        /// <summary> 计数器定义 </summary>
        public List<CounterInfo> countersList = new List<CounterInfo>();
        /// <summary> 完整采样帧 </summary>
        public List<Sample> samplesList = new List<Sample>();
        /// <summary> 阶段标记 </summary>
        public List<PhaseEvent> eventsList = new List<PhaseEvent>();
    }

    [Serializable]
    public sealed class Job
    {
        /// <summary> 原始 Bridge 请求编号 </summary>
        public string request_id;
        /// <summary> 稳定任务编号 </summary>
        public string job_id;
        /// <summary> 所属 Editor 实例 </summary>
        public string editor_instance_id;
        /// <summary> 所属 Editor 会话 </summary>
        public string editor_session_id;
        /// <summary> 任务状态 </summary>
        public string state;
        /// <summary> 启动时间 UTC </summary>
        public string started_utc;
        /// <summary> 结束时间 UTC </summary>
        public string finished_utc;
        /// <summary> 已采样数量 </summary>
        public int samples;
        /// <summary> 完成或中断原因 </summary>
        public string reason;
        /// <summary> 诊断输出绝对路径 </summary>
        public string result_path;
    }

    [Serializable]
    public sealed class Invocation
    {
        /// <summary> Bridge 契约版本 </summary>
        public string contract_version;
        /// <summary> Bridge 请求编号 </summary>
        public string request_id;
        /// <summary> Provider 标识 </summary>
        public string provider_id;
        /// <summary> 操作名称 </summary>
        public string operation;
        /// <summary> 操作参数 </summary>
        public Payload payload;
        /// <summary> Editor 身份 </summary>
        public EditorIdentity editor;
    }

    [Serializable]
    public sealed class Payload
    {
        /// <summary> 参数对象 JSON </summary>
        public string arguments_json;
    }

    [Serializable]
    public sealed class EditorIdentity
    {
        /// <summary> 工程绝对路径 </summary>
        public string project_path;
        /// <summary> Editor 实例标识 </summary>
        public string editor_instance_id;
        /// <summary> Editor 会话标识 </summary>
        public string editor_session_id;
    }

    [Serializable]
    public sealed class Arguments
    {
        /// <summary> 任务编号 </summary>
        public string job_id;
        /// <summary> 阶段标记文字 </summary>
        public string text;
        /// <summary> 是否深度静态检查 </summary>
        public bool deep;
    }
    #endregion

}
