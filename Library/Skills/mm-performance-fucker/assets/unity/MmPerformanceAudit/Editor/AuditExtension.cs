using System;
using System.IO;
using MmPerformance;
using PerfAgent.Analysis;
using PerfAgent.Collectors;
using PerfAgent.Core;
using UnityEditor;

namespace MmPerformance
{
    [InitializeOnLoad]
    public static class AuditExtension
    {
        static AuditExtension()
        {
            PerformanceProvider.StaticAudit = Audit;
            PerformanceProvider.ExternalCaptureActive = () => PerfSession.Capturing || FollowCapture.Armed || FollowCapture.Capturing;
        }
        private static Job Audit(Invocation request, bool deep)
        {
            string Id = ReportStore.NormalizeId(request.request_id);
            string ReceiptPath = ReportStore.PathFor(Id, ".job");
            if (File.Exists(ReceiptPath)) return CaptureSession.Status(Id);
            if (EditorApplication.isPlaying || EditorApplication.isCompiling || EditorApplication.isUpdating ||
                CaptureSession.Active || PerfSession.Capturing || FollowCapture.Armed)
                throw new InvalidOperationException("静态审计要求空闲 Edit 且没有采样任务");
            var Job = new Job { request_id = request.request_id, job_id = Id, state = "running", started_utc = DateTime.UtcNow.ToString("o"),
                editor_instance_id = request.editor.editor_instance_id, editor_session_id = request.editor.editor_session_id,
                result_path = ReportStore.PathFor(Id, ".audit") };
            ReportStore.Save(ReceiptPath, Job, false);
            try
            {
                var Snapshot = new PerfSnapshot { id = Id, label = "MmPerformance 静态审计", capturedUtc = Job.started_utc };
                var Budget = PerfAgentSettings.Config.budget.Clone();
                var CollectorList = new IPerfCollector[] { new EnvironmentCollector(), new MemoryCollector(), new AssetAuditCollector(),
                    new SceneAuditCollector(), new PhysicsAuditCollector(), new ScriptAntipatternCollector() };
                foreach (var Collector in CollectorList)
                {
                    Collector.Collect(new CollectorContext(Snapshot, Budget) { deep = deep });
                    Snapshot.capturedSources.Add(Collector.ToolName);
                }
                Snapshot.findings = new PerfRuleEngine().Evaluate(Snapshot, Budget);
                PerfSnapshotStore.ApplyBudget(Snapshot, Budget);
                Job.state = "completed";
                Job.reason = "静态规则风险筛查 请读取 notes 中的数据缺失或截断 不代表实测根因";
                Job.finished_utc = DateTime.UtcNow.ToString("o");
                ReportStore.Save(Job.result_path, new AuditReport { job = Job, snapshot = Snapshot, budget = Budget }, false);
            }
            catch (Exception Exception)
            {
                Job.state = "failed";
                Job.reason = Exception.ToString();
                Job.finished_utc = DateTime.UtcNow.ToString("o");
                ReportStore.Save(ReceiptPath, Job, true);
                throw;
            }
            ReportStore.Save(ReceiptPath, Job, true);
            return Job;
        }
    }
    [Serializable]
    public sealed class AuditReport
    {
        /// <summary> 格式版本 </summary>
        public int schema_version = 1;
        /// <summary> 任务收据 </summary>
        public Job job;
        /// <summary> 静态审计快照 </summary>
        public PerfSnapshot snapshot;
        /// <summary> 审计使用的预算副本 </summary>
        public PerfBudget budget;
    }

}
