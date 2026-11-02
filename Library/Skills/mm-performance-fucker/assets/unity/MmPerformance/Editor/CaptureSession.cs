using System;
using System.Collections.Generic;
using System.IO;
using PerfAgent.Collectors;
using PerfAgent.Core;
using UnityEditor;
using UnityEngine;

namespace MmPerformance
{
    [InitializeOnLoad]
    public static class CaptureSession
    {
        /// <summary> 当前活跃采样报告 </summary>
        private static CaptureReport report;
        /// <summary> 当前原生计数器 </summary>
        private static CounterSet counters;
        /// <summary> 启动时 Editor 时间 </summary>
        private static double startedTime;
        /// <summary> 最近观察到新帧的时间 </summary>
        private static double lastFrameTime;
        /// <summary> 上一次 Unity 帧编号 </summary>
        private static int lastFrame;
        /// <summary> 最近状态落盘时刻 </summary>
        private static double lastReceiptTime;

        public static bool Active { get { return report != null; } }

        #region 生命周期与操作

        /// <summary>
        /// 注册域重载和 Editor 退出清理 不自动恢复采样
        /// </summary>
        static CaptureSession()
        {
            AssemblyReloadEvents.beforeAssemblyReload += BeforeReload;
            EditorApplication.quitting += BeforeReload;
        }

        /// <summary>
        /// 输入已绑定的请求与采样参数 开始任务 返回持久收据
        /// </summary>
        public static Job Start(Invocation invocation, CaptureOptions options)
        {
            string Id = ReportStore.NormalizeId(invocation.request_id);
            string ReceiptPath = ReportStore.PathFor(Id, ".job");
            if (File.Exists(ReceiptPath)) return Status(Id);
            if (report != null || PerfSession.Capturing || FollowCapture.Armed || FollowCapture.Capturing)
                throw new InvalidOperationException("已有本包或 PerfAgent 采样任务");
            if (!EditorApplication.isPlaying || EditorApplication.isPaused || EditorApplication.isCompiling || EditorApplication.isUpdating)
                throw new InvalidOperationException("采样要求稳定且未暂停的 Play 模式");
            if (double.IsNaN(options.seconds) || double.IsInfinity(options.seconds) || double.IsNaN(options.warmup) ||
                double.IsInfinity(options.warmup) || double.IsNaN(options.stall_seconds) || double.IsInfinity(options.stall_seconds))
                throw new ArgumentException("采样时间参数必须为有限数字");
            if (options.seconds <= 0 || options.seconds > 3600 || options.warmup < 0 || options.warmup > 60 ||
                options.fps <= 0 || options.fps > 1000 || options.max_frames < 1 || options.max_frames > 300000 ||
                options.stall_seconds <= 0 || options.stall_seconds > 300)
                throw new ArgumentException("采样参数超出支持范围");

            var EnvironmentSnapshot = new PerfSnapshot();
            new EnvironmentCollector().Collect(new CollectorContext(EnvironmentSnapshot, PerfAgentSettings.Config.budget));
            var NewReport = new CaptureReport
            {
                options = options,
                environment = EnvironmentSnapshot,
                samplesList = new List<Sample>(options.max_frames),
                job = new Job
                {
                    request_id = invocation.request_id, job_id = Id, state = "running",
                    editor_instance_id = invocation.editor.editor_instance_id,
                    editor_session_id = invocation.editor.editor_session_id,
                    started_utc = DateTime.UtcNow.ToString("o"), reason = "",
                    result_path = ReportStore.PathFor(Id, ".capture")
                }
            };
            var NewCounters = new CounterSet();
            try { ReportStore.Save(ReceiptPath, NewReport.job, false); }
            catch { NewCounters.Dispose(); throw; }
            counters = NewCounters;
            report = NewReport;
            report.countersList = counters.Infos;
            startedTime = EditorApplication.timeSinceStartup;
            lastFrameTime = startedTime;
            lastReceiptTime = startedTime;
            lastFrame = Time.frameCount;
            EditorApplication.update += Tick;
            return report.job;
        }

        /// <summary>
        /// 输入任务编号 返回活状态或原收据 不将丢失任务标为成功
        /// </summary>
        public static Job Status(string id)
        {
            id = ReportStore.NormalizeId(id);
            if (report != null && report.job.job_id == id) return report.job;
            var Result = ReportStore.LoadJob(id);
            if (Result.state == "running")
            {
                Result.state = "interrupted";
                Result.reason = "持久收据尚未完成且当前域没有原活任务 不自动恢复";
            }
            return Result;
        }

        /// <summary>
        /// 输入任务编号 取消本域任务或查询既有终态
        /// </summary>
        public static Job Cancel(string id)
        {
            var Result = Status(id);
            if (report != null && report.job.job_id == Result.job_id) Finish("cancelled", "调用方取消");
            return Status(id);
        }

        /// <summary>
        /// 输入任务编号与文字 在当前采样加入阶段标记
        /// </summary>
        public static Job Mark(string id, string text)
        {
            id = ReportStore.NormalizeId(id);
            if (report == null || report.job.job_id != id) throw new InvalidOperationException("原采样任务不在运行");
            if (string.IsNullOrWhiteSpace(text) || text.Length > 256) throw new ArgumentException("标记文字长度应为 1 至 256");
            if (report.eventsList.Count >= 1000) throw new InvalidOperationException("标记数量达到上限 1000");
            report.eventsList.Add(new PhaseEvent { text = text, frame = Time.frameCount, elapsed_seconds = EditorApplication.timeSinceStartup - startedTime });
            return report.job;
        }

        #endregion

        #region 采样与终态

        /// <summary>
        /// 每次 Editor 更新观察新帧 先检查时限再采样 失败写入终态
        /// </summary>
        private static void Tick()
        {
            try
            {
                if (!EditorApplication.isPlaying || EditorApplication.isPaused) { Finish("interrupted", "Play 结束或暂停"); return; }
                double now = EditorApplication.timeSinceStartup;
                double elapsed = now - startedTime;
                if (double.IsNaN(elapsed) || double.IsInfinity(elapsed)) throw new InvalidOperationException("采样观察时刻不是有限数字");
                if (elapsed >= report.options.warmup + report.options.seconds) { Finish("completed", "duration_reached"); return; }
                if (now - lastFrameTime >= report.options.stall_seconds) { Finish("interrupted", "无新帧超时"); return; }
                int frame = Time.frameCount;
                if (frame == lastFrame) return;
                double interval = (now - lastFrameTime) * 1000;
                if (double.IsNaN(interval) || double.IsInfinity(interval) || interval < 0) throw new InvalidOperationException("采样观察间隔无效");
                lastFrame = frame;
                lastFrameTime = now;
                if (elapsed < report.options.warmup) return;
                var Value = new Sample { frame = frame, elapsed_seconds = elapsed, interval_ms = interval };
                counters.Read(ref Value);
                report.samplesList.Add(Value);
                report.job.samples = report.samplesList.Count;
                if (report.job.samples >= report.options.max_frames) { Finish("completed", "sample_limit_reached"); return; }
                if (now - lastReceiptTime >= 1)
                {
                    ReportStore.Save(ReportStore.PathFor(report.job.job_id, ".job"), report.job, true);
                    lastReceiptTime = now;
                }
            }
            catch (Exception Exception)
            {
                if (report != null) Finish("failed", Exception.ToString());
                Debug.LogException(Exception);
            }
        }

        /// <summary>
        /// 输入终态与原因 先释放采样资源再原子保存完整已采样明细
        /// </summary>
        private static void Finish(string state, string reason)
        {
            EditorApplication.update -= Tick;
            var FinishedReport = report;
            report = null;
            var FinishedCounters = counters;
            counters = null;
            FinishedCounters.Dispose();
            FinishedReport.job.state = state;
            FinishedReport.job.reason = reason;
            FinishedReport.job.finished_utc = DateTime.UtcNow.ToString("o");
            if (state == "completed" && FinishedReport.samplesList.Count == 0)
            {
                FinishedReport.job.state = "failed";
                FinishedReport.job.reason = "采样结束但没有有效观察帧";
            }
            ReportStore.Save(FinishedReport.job.result_path, FinishedReport, false);
            ReportStore.Save(ReportStore.PathFor(FinishedReport.job.job_id, ".job"), FinishedReport.job, true);
        }

        /// <summary>
        /// 域重载或 Editor 退出前保存中断结果并释放计数器
        /// </summary>
        private static void BeforeReload()
        {
            if (report != null) Finish("interrupted", "domain_reload_or_editor_quit");
        }

        #endregion
    }
}
