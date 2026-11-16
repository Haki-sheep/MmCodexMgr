using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

namespace MmPerformance
{
    public sealed class RuntimeCapture : MonoBehaviour
    {
        /// <summary> 当前实例持有的采样报告 </summary>
        private CaptureReport report;
        /// <summary> 当前实例负责释放的计数器集合 </summary>
        private CounterSet counters;
        /// <summary> 采样启动的单调时间 秒 </summary>
        private double started;
        /// <summary> 上次采样的单调时间 秒 </summary>
        private double lastTime;
        /// <summary> 当前实例结果文件的绝对路径 </summary>
        private string outputPath;

        public bool Active { get { return report != null; } }
        public string ResultPath { get { return outputPath; } }

        /// <summary>
        /// 输入采样条件与新结果绝对路径 由当前组件负责采样和原生句柄释放
        /// </summary>
        public void Begin(CaptureOptions options, string path)
        {
            if (Active) throw new InvalidOperationException("当前 RuntimeCapture 已在采样");
            if (!isActiveAndEnabled) throw new InvalidOperationException("RuntimeCapture 组件必须启用且对象处于激活状态");
            if (!Application.isPlaying) throw new InvalidOperationException("RuntimeCapture 要求 Play 或 Player");
            if (!Path.IsPathRooted(path) || File.Exists(path)) throw new ArgumentException("结果路径必须为尚不存在的绝对文件路径");
            if (double.IsNaN(options.seconds) || double.IsInfinity(options.seconds) || options.seconds <= 0 || options.seconds > 3600 ||
                double.IsNaN(options.warmup) || double.IsInfinity(options.warmup) || options.warmup < 0 || options.warmup > 60 ||
                options.max_frames < 1 || options.max_frames > 300000 || options.fps <= 0 || options.fps > 1000)
                throw new ArgumentException("Runtime 采样参数无效");
            if (options.profile_frames != 0 || options.allocation_stacks)
                throw new NotSupportedException("Runtime 汇总采样不接收 Editor 原始帧导出选项 使用 Development Player 连接 Profiler");
            var Context = SceneContext.Capture(options.context_type, "start");
            if ((Context.health_verified && !Context.healthy) || Context.visual_status == "invalid")
                throw new InvalidOperationException("Runtime 前置现场检查失败 " + Context.evidence);
            outputPath = Path.GetFullPath(path);
            var NewCounters = options.counters_enabled ? new CounterSet() : null;
            string Id = Guid.NewGuid().ToString("N");
            report = new CaptureReport
            {
                observation_source = Application.isEditor ? "runtime_late_update_in_editor" : "player_late_update",
                options = options, environment = EnvironmentInfo.Capture(), countersList = NewCounters != null ? NewCounters.Infos : new List<CounterInfo>(),
                samplesList = new List<Sample>(options.max_frames),
                job = new Job { job_id = Id, request_id = Id, started_utc = DateTime.UtcNow.ToString("o"), state = "running", result_path = outputPath }
            };
            report.contextList.Add(Context);
            counters = NewCounters;
            started = Time.realtimeSinceStartupAsDouble;
            lastTime = started;
            Application.logMessageReceived += OnLog;
        }

        /// <summary>
        /// 取消当前采样并保存已观察样本 不产生完整采样结论
        /// </summary>
        public void End()
        {
            Finish("cancelled", "调用方取消");
        }

        /// <summary>
        /// 输入文字 保存调用时刻与帧编号 不代表事件实际执行时刻
        /// </summary>
        public void Mark(string text)
        {
            if (!Active) throw new InvalidOperationException("Runtime 采样尚未启动");
            if (string.IsNullOrWhiteSpace(text) || text.Length > 256 || report.eventsList.Count >= 1000)
                throw new ArgumentException("标记文字应为 1 至 256 字符 且总数小于 1000");
            report.eventsList.Add(new PhaseEvent { text = text, frame = Time.frameCount,
                elapsed_seconds = Time.realtimeSinceStartupAsDouble - started });
        }

        private void LateUpdate()
        {
            if (!Active) return;
            try
            {
                double Now = Time.realtimeSinceStartupAsDouble;
                double Elapsed = Now - started;
                double Interval = (Now - lastTime) * 1000;
                lastTime = Now;
                if (Elapsed >= report.options.warmup + report.options.seconds) { Finish("completed", "duration_reached"); return; }
                if (Elapsed < report.options.warmup) return;
                long Started = System.Diagnostics.Stopwatch.GetTimestamp();
                var Value = new Sample { frame = Time.frameCount, elapsed_seconds = Elapsed, observed_seconds = Now,
                    interval_ms = Interval, unity_delta_ms = Time.unscaledDeltaTime * 1000, profiler_frame_index = -1 };
                if (counters != null) counters.Read(ref Value);
                report.samplesList.Add(Value);
                double Cost = (System.Diagnostics.Stopwatch.GetTimestamp() - Started) * 1000000.0 / System.Diagnostics.Stopwatch.Frequency;
                Value.capture_callback_us = Cost;
                report.samplesList[report.samplesList.Count - 1] = Value;
                report.overhead.callback_count++;
                report.overhead.callback_total_us += Cost;
                report.overhead.callback_max_us = Math.Max(report.overhead.callback_max_us, Cost);
                report.job.samples = report.samplesList.Count;
                if (report.job.samples >= report.options.max_frames) Finish("completed", "sample_limit_reached");
            }
            catch (Exception Exception)
            {
                if (Active) Finish("failed", Exception.ToString());
                throw;
            }
        }

        private void Finish(string state, string reason)
        {
            if (!Active) return;
            Application.logMessageReceived -= OnLog;
            var Finished = report;
            report = null;
            try
            {
                if (counters != null) { counters.Dispose(); counters = null; }
                Finished.contextList.Add(SceneContext.Capture(Finished.options.context_type, "end"));
            }
            catch (Exception Exception) { state = "failed"; reason = Exception.ToString(); }
            Finished.job.state = Finished.samplesList.Count == 0 && state == "completed" ? "failed" : state;
            Finished.job.reason = reason;
            Finished.job.finished_utc = DateTime.UtcNow.ToString("o");
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            using (var Stream = new FileStream(outputPath, FileMode.CreateNew, FileAccess.Write, FileShare.Read))
            using (var Writer = new StreamWriter(Stream, new UTF8Encoding(false))) Writer.Write(JsonUtility.ToJson(Finished));
        }

        private void OnLog(string message, string stack, LogType type)
        {
            if (type != LogType.Error && type != LogType.Exception && type != LogType.Assert) return;
            report.error_count++;
            if (report.errorList.Count < 20) report.errorList.Add(message.Length > 2048 ? message.Substring(0, 2048) : message);
        }

        private void OnDisable()
        {
            Finish("interrupted", "component_disabled_or_player_quit");
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) Finish("interrupted", "application_paused");
        }
    }
}
