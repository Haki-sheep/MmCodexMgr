using System;
using System.Collections.Generic;
using Unity.Profiling;
using Unity.Profiling.LowLevel.Unsafe;

namespace MmPerformance
{
    public sealed class CounterSet : IDisposable
    {
        /// <summary> 原生计数器句柄 </summary>
        private readonly List<ProfilerRecorder> recorderList = new List<ProfilerRecorder>();
        /// <summary> 与样本数组顺序一致的指标说明 </summary>
        private readonly List<CounterInfo> infoList;

        public List<CounterInfo> Infos { get { return infoList; } }

        /// <summary>
        /// 探测计数器名称与单位 返回明确可用性
        /// </summary>
        public static List<CounterInfo> Probe()
        {
            var ResultList = new List<CounterInfo>
            {
                new CounterInfo { key = "gc_alloc_bytes", name = "GC Allocated In Frame" },
                new CounterInfo { key = "main_thread_ns", name = "Main Thread" },
                new CounterInfo { key = "draw_calls", name = "Draw Calls Count" },
                new CounterInfo { key = "total_used_memory_bytes", name = "Total Used Memory" }
            };
            var HandleList = new List<ProfilerRecorderHandle>();
            ProfilerRecorderHandle.GetAvailable(HandleList);
            foreach (var Info in ResultList)
            {
                foreach (var Handle in HandleList)
                {
                    var Description = ProfilerRecorderHandle.GetDescription(Handle);
                    if (Description.Name != Info.name) continue;
                    Info.unit = Description.UnitType.ToString();
                    Info.available = true;
                    break;
                }
            }
            return ResultList;
        }

        /// <summary>
        /// 创建探测成功的 Recorder 初始化失败时释放已创建句柄
        /// </summary>
        public CounterSet()
        {
            infoList = Probe();
            try
            {
                var HandleList = new List<ProfilerRecorderHandle>();
                ProfilerRecorderHandle.GetAvailable(HandleList);
                foreach (var Info in infoList)
                {
                    var Recorder = default(ProfilerRecorder);
                    if (Info.available)
                    {
                        foreach (var Handle in HandleList)
                        {
                            var Description = ProfilerRecorderHandle.GetDescription(Handle);
                            if (Description.Name != Info.name) continue;
                            Recorder = ProfilerRecorder.StartNew(Description.Category, Description.Name, 1);
                            break;
                        }
                        if (!Recorder.Valid) throw new InvalidOperationException("计数器启动失败 " + Info.name);
                    }
                    recorderList.Add(Recorder);
                }
            }
            catch
            {
                Dispose();
                throw;
            }
        }

        /// <summary>
        /// 输入帧样本 读取计数器数值 零值与不可用分离
        /// </summary>
        public void Read(ref Sample value)
        {
            for (int i = 0; i < recorderList.Count; i++)
            {
                var Recorder = recorderList[i];
                bool available = Recorder.Valid && Recorder.Count > 0;
                long measurement = available ? Recorder.LastValue : 0;
                switch (infoList[i].key)
                {
                    case "gc_alloc_bytes": value.gc_alloc_bytes = measurement; value.gc_alloc_valid = available; break;
                    case "main_thread_ns": value.main_thread_ns = measurement; value.main_thread_valid = available; break;
                    case "draw_calls": value.draw_calls = measurement; value.draw_calls_valid = available; break;
                    case "total_used_memory_bytes": value.total_used_memory_bytes = measurement; value.memory_valid = available; break;
                }
            }
        }

        /// <summary>
        /// 释放全部原生计数器 失败时保留异常
        /// </summary>
        public void Dispose()
        {
            foreach (var Recorder in recorderList) if (Recorder.Valid) Recorder.Dispose();
            recorderList.Clear();
        }
    }
}
