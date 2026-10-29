using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed record AgentCliInvocation(string Command, Dictionary<string, string> OptionDict, JsonElement Arguments);

public static class AgentCli
{
    public const string Help = """
        MmCodexMgr CLI
        instances
        projects --instance <实例编号|ID|名称>
        sessions --instance <实例> --project <项目ID|名称|绝对路径> [--session <对话ID|完整名称>] [--offset 0]
        start --json-file <UTF-8 JSON文件>
          必需 request_id instance project title instructions acceptance workspace
          目标 session 或 create_title 二选一
          可选 subagent_max=0 session_max=1 cross_agent_max=1 timeout_minutes=60
          session_max 与 cross_agent_max 按本次请求校验 不锁定为已有任务的值 下级仍受上级预算约束
          timeout_minutes 范围 0 至 1440 分钟 0 表示无限等待
          worker_limits 可分别指定下级三种协作上限 默认继承本层
          tree_session_max=8 max_depth=3 控制整棵树的联调槽位与层数 不含初始主会话
          workspace={access:read_only|write,write_paths:[绝对路径]} 声明写入范围
        report --json-file <UTF-8 JSON文件>
          必需 task_id outcome(completed|needs_decision|failed) summary artifacts(绝对路径数组)
        status --task-id <任务ID>
        open --instance <实例> --session-id <会话ID>  自动启动实例并打开原会话 不发送执行消息
        resume --task-id <任务ID>  主会话恢复实例退出后的原任务 不创建新会话
        cleanup --state <interrupted|blocked|finished>
          清理当前主会话名下的联调记录 不删除 Codex 对话或项目文件
          interrupted=实例退出后阻塞 blocked=所有阻塞 finished=已验收或已撤销
          清理未结束记录会中断其下级联调 不停止模型或脚本
        cancel --task-id <任务ID>  仅中断联调 不停止模型或脚本
        accept --task-id <任务ID>
        progress --json-file <UTF-8 JSON文件>  task_id stage(started|progress|blocked) message
        tree --task-id <任务ID> [--offset 0]
        retry-return --task-id <任务ID> --confirmed true
        reconcile --task-id <任务ID> --session-id <已核对的会话ID> --confirmed true
        doctor [--instance <实例>]  无需会话身份 不启动模型
        install --instance <实例> [--skill <Skill目录>]
          CLI 与实例管理器放在同一目录 目录迁移后重新运行 install 更新 Skill 与 MCP 路径
        compat-install --instance <实例>  安装 OpenCode Go 联调输入适配 保留模型与密钥 重新加载目标实例后生效
        compat-remove --instance <实例>  恢复原服务商地址 保留其余配置 重新加载目标实例后生效
        mcp --instance <实例ID>
        调用方默认取 CODEX_HOME 与 CODEX_THREAD_ID
        在 Codex 外使用时显式提供 --caller-instance <实例> --caller-thread <会话ID>
        stdout 返回 JSON 失败退出码 1 详情写 stderr
        """;

    #region Execution
    public static async Task<int> RunAsync(string[] ArgumentList, Stream Input, Stream Output, TextWriter Error, string ExecutablePath, CancellationToken Cancellation, string? PipeName = null, Func<ManagerSettings>? LoadSettings = null, string? OutboxRoot = null)
    {
        using var Writer = new StreamWriter(Output, new UTF8Encoding(false), 4096, true) { AutoFlush = true };
        try
        {
            if (ArgumentList.Length == 3 && ArgumentList[0] == "compat-server" && ArgumentList[1] == "--profile")
            {
                await ResponsesCompatServer.RunProfileAsync(ArgumentList[2], Cancellation);
                return 0;
            }
            var Call = Parse(ArgumentList);
            if (Call.Command == "help") { await Writer.WriteLineAsync(Help); return 0; }
            var Settings = (LoadSettings ?? SettingsStore.Load)();
            if (Call.Command is "compat-install" or "compat-remove")
            {
                var Instance = AgentManagementService.ResolveInstance(Settings, Required(Call, "instance"));
                if (Call.Command == "compat-install")
                {
                    var Profile = ResponsesCompatProfile.Install(Instance, ExecutablePath);
                    await Writer.WriteLineAsync(JsonSerializer.Serialize(new { installed = true, instance_id = Instance.Id, provider = Profile.Provider, local_url = Profile.LocalUrl, upstream_url = Profile.UpstreamUrl, backup = Profile.BackupPath, reload = "重新加载目标实例后生效 不修改会话历史" }));
                }
                else
                {
                    ResponsesCompatProfile.Remove(Instance);
                    await Writer.WriteLineAsync(JsonSerializer.Serialize(new { removed = true, instance_id = Instance.Id, reload = "重新加载目标实例后生效" }));
                }
                return 0;
            }
            if (Call.Command == "mcp")
            {
                var Instance = AgentManagementService.ResolveInstance(Settings, Required(Call, "instance"));
                ResponsesCompatProfile.EnsureRunning(Instance, ExecutablePath);
                await RelayMcp.RunAsync(Instance.Id, Input, Output, Cancellation, PipeName, OutboxRoot);
                return 0;
            }
            if (Call.Command == "install")
            {
                var Instance = AgentManagementService.ResolveInstance(Settings, Required(Call, "instance"));
                await Writer.WriteLineAsync(JsonSerializer.Serialize(AgentCliDeployment.Install(Instance, ExecutablePath, Call.OptionDict.GetValueOrDefault("skill"))));
                return 0;
            }
            if (Call.Command == "doctor")
            {
                var Report = await AgentDoctor.RunAsync(Settings, ExecutablePath, Call.OptionDict.GetValueOrDefault("instance"), Cancellation);
                try
                {
                    await RelayHost.RequestAsync(new(Report.InstanceId, "", "agent_ping", JsonSerializer.SerializeToElement(new { })), Cancellation, PipeName);
                    Report.CheckList.Add(new("管理器服务", true, "已连接"));
                }
                catch (Exception Failure) when (Failure is IOException or TimeoutException or OperationCanceledException)
                {
                    Report.CheckList.Add(new("管理器服务", false, Failure.Message));
                }
                await Writer.WriteLineAsync(JsonSerializer.Serialize(Report));
                return Report.Healthy ? 0 : 1;
            }
            string? CallerSelector = Call.OptionDict.GetValueOrDefault("caller-instance");
            InstanceProfile Caller;
            if (CallerSelector is not null) Caller = AgentManagementService.ResolveInstance(Settings, CallerSelector);
            else
            {
                string Home = Environment.GetEnvironmentVariable("CODEX_HOME") ?? ManagerPaths.DefaultHome;
                var MatchList = Settings.InstanceList.Where(Item => ManagerPaths.Same(Item.HomePath, Home)).ToList();
                if (MatchList.Count != 1) throw new InvalidOperationException("无法唯一确定调用方实例 请提供 --caller-instance");
                Caller = MatchList[0];
            }
            string ThreadId = Call.OptionDict.GetValueOrDefault("caller-thread") ?? Environment.GetEnvironmentVariable("CODEX_THREAD_ID") ?? throw new InvalidOperationException("缺少 CODEX_THREAD_ID 请提供 --caller-thread");
            string Command = Call.Command switch
            {
                "instances" => "agent_instances", "projects" => "agent_projects", "sessions" => "agent_sessions", "start" => "agent_start",
                "report" => "relay_report", "status" => "agent_task", "cancel" => "agent_cancel", "accept" => "relay_accept",
                "progress" => "relay_progress", "tree" => "agent_tree", "retry-return" => "agent_retry_return", "reconcile" => "agent_reconcile", "open" => "agent_open", "resume" => "agent_resume", "cleanup" => "agent_cleanup",
                _ => throw new InvalidOperationException("未知命令 " + Call.Command)
            };
            var Request = new RelayRequest(Caller.Id, ThreadId, Command, Call.Arguments);
            var Result = Command == "relay_report" ? await RelayOutbox.DeliverAsync(Request, Cancellation, PipeName, OutboxRoot) : await RelayHost.RequestAsync(Request, Cancellation, PipeName);
            await Writer.WriteLineAsync(Result.GetRawText());
            return 0;
        }
        catch (Exception Failure)
        {
            await Error.WriteLineAsync(JsonSerializer.Serialize(new { error = Failure.Message }));
            return 1;
        }
    }
    #endregion

    #region Arguments
    public static AgentCliInvocation Parse(string[] ArgumentList)
    {
        string Command = ArgumentList.Length == 0 ? "help" : ArgumentList[0];
        if (Command is "--help" or "-h") Command = "help";
        string[] AllowedList = Command switch
        {
            "help" or "instances" => Array.Empty<string>(),
            "projects" => new[] { "instance" },
            "sessions" => new[] { "instance", "project", "session", "offset" },
            "start" or "report" => new[] { "json-file" },
            "progress" => new[] { "json-file" },
            "doctor" => new[] { "instance" },
            "tree" => new[] { "task-id", "offset" },
            "retry-return" => new[] { "task-id", "confirmed" },
            "reconcile" => new[] { "task-id", "session-id", "confirmed" },
            "open" => new[] { "instance", "session-id" },
            "cleanup" => new[] { "state" },
            "status" or "cancel" or "accept" or "resume" => new[] { "task-id" },
            "install" => new[] { "instance", "skill" },
            "compat-install" or "compat-remove" => new[] { "instance" },
            "mcp" => new[] { "instance" },
            _ => throw new InvalidOperationException("未知命令 " + Command + " 请执行 help")
        };
        var OptionDict = new Dictionary<string, string>();
        for (int Index = 1; Index < ArgumentList.Length; Index += 2)
        {
            string Key = ArgumentList[Index];
            if (!Key.StartsWith("--", StringComparison.Ordinal) || Index + 1 >= ArgumentList.Length) throw new InvalidOperationException("参数必须使用 --名称 值 " + Key);
            Key = Key[2..];
            if (!AllowedList.Contains(Key) && Key is not ("caller-instance" or "caller-thread")) throw new InvalidOperationException("此命令不支持参数 " + Key);
            if (!OptionDict.TryAdd(Key, ArgumentList[Index + 1]) || string.IsNullOrWhiteSpace(ArgumentList[Index + 1])) throw new InvalidOperationException("参数重复或为空 " + Key);
        }
        if (Command is "start" or "report" or "progress")
        {
            if (!OptionDict.TryGetValue("json-file", out string? FilePath)) throw new InvalidOperationException("缺少 --json-file");
            if (new FileInfo(FilePath).Length > RelayLimits.MaxFrameBytes / 2) throw new InvalidDataException("请求文件过大");
            using var Document = JsonDocument.Parse(File.ReadAllBytes(FilePath));
            if (Document.RootElement.ValueKind != JsonValueKind.Object) throw new InvalidDataException("请求必须是 JSON 对象");
            string[] PropertyList = Command switch
            {
                "start" => new[] { "request_id", "instance", "project", "session", "create_title", "title", "instructions", "acceptance", "session_max", "subagent_max", "cross_agent_max", "worker_limits", "timeout_minutes", "tree_session_max", "max_depth", "workspace" },
                "progress" => new[] { "task_id", "stage", "message" },
                _ => new[] { "task_id", "outcome", "summary", "artifacts" }
            };
            var NameHashList = new HashSet<string>();
            foreach (var Property in Document.RootElement.EnumerateObject())
                if (!PropertyList.Contains(Property.Name) || !NameHashList.Add(Property.Name)) throw new InvalidDataException("请求参数未知或重复 " + Property.Name);
            return new(Command, OptionDict, Document.RootElement.Clone());
        }
        var Arguments = new Dictionary<string, object>();
        foreach (var Pair in OptionDict)
        {
            if (Pair.Key.StartsWith("caller-", StringComparison.Ordinal)) continue;
            Arguments[Pair.Key.Replace('-', '_')] = Pair.Key switch { "offset" => int.Parse(Pair.Value), "confirmed" => bool.Parse(Pair.Value), _ => Pair.Value };
        }
        return new(Command, OptionDict, JsonSerializer.SerializeToElement(Arguments));
    }

    private static string Required(AgentCliInvocation Call, string Name) => Call.OptionDict.GetValueOrDefault(Name) ?? throw new InvalidOperationException("缺少 --" + Name);
    #endregion
}
