using System;
using System.Collections.Generic;
using UnityEditor.Profiling;
using UnityEditorInternal;
using UnityEngine.Profiling;

namespace MmPerformance
{
    public static class ProfilerEvidence
    {
        /// <summary> 当前是否持有需要恢复的 Profiler 状态 </summary>
        private static bool active;
        /// <summary> 采样前 Profiler 录制状态 </summary>
        private static bool previousEnabled;
        /// <summary> 采样前分配栈录制状态 </summary>
        private static bool previousStacks;
        /// <summary> 本次深采样开始后的首个原生帧索引 </summary>
        private static int firstFrame;
        /// <summary> 本次原始帧导出数量上限 </summary>
        private static int frameLimit;

        public static void Begin(CaptureOptions options)
        {
            if (options.profile_frames == 0) return;
            previousEnabled = ProfilerDriver.enabled;
            previousStacks = Profiler.enableAllocationCallstacks;
            frameLimit = options.profile_frames;
            firstFrame = ProfilerDriver.lastFrameIndex + 1;
            active = true;
            try
            {
                Profiler.enableAllocationCallstacks = options.allocation_stacks;
                ProfilerDriver.enabled = true;
            }
            catch { Restore(); throw; }
        }

        public static string Finish(string jobId)
        {
            if (!active) return "";
            try
            {
                int Last = ProfilerDriver.lastFrameIndex;
                int FirstAvailable = ProfilerDriver.firstFrameIndex;
                int First = Math.Max(Math.Max(firstFrame, FirstAvailable), Last - frameLimit + 1);
                var Report = new RawEvidence
                {
                    job_id = jobId, requested_first_frame = firstFrame, available_first_frame = FirstAvailable,
                    first_frame = First, last_frame = Last, truncated = First > firstFrame,
                    allocation_stacks_requested = Profiler.enableAllocationCallstacks
                };
                var AddressList = new List<ulong>();
                for (int Frame = First; Frame <= Last; Frame++)
                {
                    for (int Thread = 0; Thread < 128; Thread++)
                    {
                        using (var View = ProfilerDriver.GetRawFrameDataView(Frame, Thread))
                        {
                            if (!View.valid) break;
                            var ThreadData = new RawThread { frame = Frame, thread_index = Thread, thread_name = View.threadName,
                                thread_group = View.threadGroupName, frame_start_ms = View.frameStartTimeMs, frame_ms = View.frameTimeMs };
                            Report.threadsList.Add(ThreadData);
                            for (int Index = 0; Index < View.sampleCount; Index++)
                            {
                                if (Report.sample_count >= 250000) { Report.truncated = true; break; }
                                var Item = new RawMarker { index = Index, name = View.GetSampleName(Index),
                                    children = View.GetSampleChildrenCount(Index), start_ms = View.GetSampleStartTimeMs(Index),
                                    duration_ms = View.GetSampleTimeMs(Index) };
                                if (Item.name == "GC.Alloc")
                                {
                                    AddressList.Clear();
                                    View.GetSampleCallstack(Index, AddressList);
                                    if (AddressList.Count > 256) Item.stack_truncated = true;
                                    for (int Address = 0; Address < Math.Min(AddressList.Count, 256); Address++)
                                    {
                                        ulong Pointer = AddressList[Address];
                                        Item.callstackList.Add("0x" + Pointer.ToString("x"));
                                        var Method = View.ResolveMethodInfo(Pointer);
                                        Item.resolvedStackList.Add(new StackMethod { address = "0x" + Pointer.ToString("x"),
                                            method = Method.methodName, file = Method.sourceFileName, line = Method.sourceFileLine });
                                    }
                                    Report.allocation_stack_count += Item.callstackList.Count > 0 ? 1 : 0;
                                    if (View.GetSampleMetadataCount(Index) > 0) Item.allocation_bytes = View.GetSampleMetadataAsLong(Index, 0);
                                }
                                ThreadData.samplesList.Add(Item);
                                Report.sample_count++;
                            }
                            if (Thread == 127) Report.truncated = true;
                        }
                        if (Report.sample_count >= 250000) break;
                    }
                    if (Report.sample_count >= 250000) break;
                }
                Report.availability = Report.sample_count > 0 ? "available" : "no_raw_frames";
                string Path = ReportStore.PathFor(jobId, ".profiler");
                ReportStore.Save(Path, Report, false);
                return Path;
            }
            finally { Restore(); }
        }

        private static void Restore()
        {
            try { ProfilerDriver.enabled = previousEnabled; }
            finally { Profiler.enableAllocationCallstacks = previousStacks; active = false; }
        }
    }

    [Serializable]
    public sealed class RawEvidence
    {
        /// <summary> 随包证据格式版本 </summary>
        public int schema_version = 1;
        /// <summary> 证据数据类型 </summary>
        public string kind = "unity_raw_profiler_frames";
        /// <summary> 所属稳定采样任务标识 </summary>
        public string job_id;
        /// <summary> 原始帧证据可用性 </summary>
        public string availability;
        /// <summary> 请求开始后的原始帧索引 </summary>
        public int requested_first_frame;
        /// <summary> 导出时环形缓冲可用的最早帧 </summary>
        public int available_first_frame;
        /// <summary> 此次实际导出的首帧索引 </summary>
        public int first_frame;
        /// <summary> 导出时最后完整原始帧索引 </summary>
        public int last_frame;
        /// <summary> 实际导出的 Marker 数量 </summary>
        public int sample_count;
        /// <summary> 是否遇到环形覆盖或导出上限 </summary>
        public bool truncated;
        /// <summary> 本次是否请求录制分配栈 </summary>
        public bool allocation_stacks_requested;
        /// <summary> 含非空调用栈的分配样本数 </summary>
        public int allocation_stack_count;
        /// <summary> GPU 数据能力边界 </summary>
        public string gpu_scope = "GPU Frame Time counter when available No GPU draw-call attribution";
        /// <summary> 原始帧索引与 Unity 帧编号的映射边界 </summary>
        public string mapping = "Profiler frame index and native monotonic timestamps Unity frameCount is a separate observed index";
        /// <summary> 保留原始帧与线程身份的 Marker 数据 </summary>
        public List<RawThread> threadsList = new List<RawThread>();
    }

    [Serializable]
    public sealed class RawThread
    {
        /// <summary> Unity 帧编号 或原始 Profiler 帧索引 由所属结构定义 </summary>
        public int frame;
        /// <summary> 原始帧中的线程索引 </summary>
        public int thread_index;
        /// <summary> Unity 原生线程名称 </summary>
        public string thread_name;
        /// <summary> Unity 原生线程组名称 </summary>
        public string thread_group;
        /// <summary> 原始帧单调时钟起点 毫秒 </summary>
        public double frame_start_ms;
        /// <summary> 原始 CPU 帧时长 毫秒 </summary>
        public float frame_ms;
        /// <summary> 原始顺序的 Marker 样本 </summary>
        public List<RawMarker> samplesList = new List<RawMarker>();
    }

    [Serializable]
    public sealed class RawMarker
    {
        /// <summary> 原始线程视图中的样本索引 </summary>
        public int index;
        /// <summary> 公开属性或原生 Marker 名称 </summary>
        public string name;
        /// <summary> Unity 返回的样本子节点数 </summary>
        public int children;
        /// <summary> 原生单调时钟样本起点 毫秒 </summary>
        public double start_ms;
        /// <summary> 包含子节点的耗时 毫秒 </summary>
        public float duration_ms;
        /// <summary> GC Alloc 样本的原始字节数 </summary>
        public long allocation_bytes;
        /// <summary> 调用栈是否超过层数上限 </summary>
        public bool stack_truncated;
        /// <summary> 原生调用栈指令地址 </summary>
        public List<string> callstackList = new List<string>();
        /// <summary> Unity 可解析的方法符号与位置 </summary>
        public List<StackMethod> resolvedStackList = new List<StackMethod>();
    }

    [Serializable]
    public sealed class StackMethod
    {
        /// <summary> 原生指令地址 十六进制 </summary>
        public string address;
        /// <summary> 可用的方法符号 无符号时为空 </summary>
        public string method;
        /// <summary> 可用的源码路径 </summary>
        public string file;
        /// <summary> 符号对应源码行号 </summary>
        public uint line;
    }
}
