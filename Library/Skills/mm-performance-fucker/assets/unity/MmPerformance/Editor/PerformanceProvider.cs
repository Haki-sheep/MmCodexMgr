using System;
using System.Collections.Generic;
using System.IO;
using PerfAgent.Analysis;
using PerfAgent.Collectors;
using PerfAgent.Core;
using UnityEditor;
using UnityEngine;

namespace MmPerformance
{
    public static class PerformanceProvider
    {
        /// <summary>
        /// 返回稳定 Provider 描述 不将采样控制声明为只读
        /// </summary>
        public static string Describe()
        {
            return "{\"provider_id\":\"mm-performance\",\"contract_version\":\"1.0\",\"provider_version\":\"0.1.0\",\"operations\":[" +
                Operation("probe", false, false) + "," + Operation("audit", true, false) + "," +
                Operation("start", true, true) + "," + Operation("status", false, false) + "," +
                Operation("result", false, false) + "," + Operation("cancel", true, false) + "," + Operation("mark", true, false) + "]}";
        }

        /// <summary>
        /// 输入 Bridge JSON 请求 执行对应操作 返回结构化终态或任务收据
        /// </summary>
        public static string Execute(string requestJson)
        {
            try
            {
                var Request = JsonUtility.FromJson<Invocation>(requestJson);
                if (Request.contract_version != "1.0" || Request.provider_id != "mm-performance")
                    throw new ArgumentException("Provider 身份或契约不匹配");
                if (Path.GetFullPath(Request.editor.project_path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) !=
                    Path.GetFullPath(Path.Combine(Application.dataPath, "..")).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar))
                    throw new ArgumentException("目标工程身份不一致");
                var Args = JsonUtility.FromJson<Arguments>(Request.payload.arguments_json);
                object Result;
                switch (Request.operation)
                {
                    case "probe": Result = new ProbeResult { unity_version = Application.unityVersion, playing = EditorApplication.isPlaying,
                        paused = EditorApplication.isPaused, countersList = CounterSet.Probe(), reports_root = ReportStore.Root }; break;
                    case "start":
                        var Options = new CaptureOptions();
                        JsonUtility.FromJsonOverwrite(Request.payload.arguments_json, Options);
                        Result = CaptureSession.Start(Request, Options);
                        break;
                    case "status": Result = CaptureSession.Status(Args.job_id); break;
                    case "result":
                        var Job = CaptureSession.Status(Args.job_id);
                        if (Job.state == "running") throw new InvalidOperationException("任务尚未完成 请继续查询原 job_id");
                        if (!File.Exists(Job.result_path)) throw new FileNotFoundException("任务没有已保存结果 " + Job.state, Job.result_path);
                        Result = Job;
                        break;
                    case "cancel": Result = CaptureSession.Cancel(Args.job_id); break;
                    case "mark": Result = CaptureSession.Mark(Args.job_id, Args.text); break;
                    case "audit": Result = Audit(Request, Args.deep); break;
                    default: throw new NotSupportedException("不支持的操作 " + Request.operation);
                }
                return "{\"state\":\"completed\",\"success\":true,\"data\":" + JsonUtility.ToJson(Result, false) + "}";
            }
            catch (Exception Exception)
            {
                return JsonUtility.ToJson(new Failure { error = Exception.ToString() });
            }
        }

        /// <summary>
        /// 输入稳定操作名和副作用 返回 Provider 操作契约
        /// </summary>
        private static string Operation(string id, bool mutates, bool play)
        {
            return "{\"id\":\"" + id + "\",\"mutates_project\":" + (mutates ? "true" : "false") +
                ",\"requires_play_mode\":" + (play ? "true" : "false") +
                ",\"idempotent\":false,\"default_timeout_seconds\":300,\"payload_schema_id\":\"mm-performance-args\"}";
        }

        /// <summary>
        /// 输入静态审计参数 保存预算与快照 不调用上游自动修复或聊天
        /// </summary>
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
    public sealed class ProbeResult
    {
        /// <summary> Unity 实际版本 </summary>
        public string unity_version;
        /// <summary> 是否在 Play 模式 </summary>
        public bool playing;
        /// <summary> 是否暂停 </summary>
        public bool paused;
        /// <summary> 原生计数器支持情况 </summary>
        public List<CounterInfo> countersList;
        /// <summary> 本地诊断根目录 </summary>
        public string reports_root;
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

    [Serializable]
    public sealed class Failure
    {
        /// <summary> 操作执行失败 </summary>
        public string state = "failed";
        /// <summary> 操作未成功 </summary>
        public bool success = false;
        /// <summary> 完整失败上下文 </summary>
        public string error;
    }
}
