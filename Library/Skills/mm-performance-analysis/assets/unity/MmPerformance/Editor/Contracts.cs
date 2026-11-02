using System;
using System.Collections.Generic;
using PerfAgent.Core;

namespace MmPerformance
{
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
        public string adapter_version = "0.1.0";
        /// <summary> 帧采样任务收据 </summary>
        public Job job;
        /// <summary> 采样条件 </summary>
        public CaptureOptions options;
        /// <summary> 环境信息 不含采样后重新推导的结论 </summary>
        public PerfSnapshot environment;
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
}
