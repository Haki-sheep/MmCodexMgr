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
          必需 request_id instance project title instructions acceptance
          目标 session 或 create_title 二选一
          可选 subagent_max=0 session_max=1 cross_agent_max=1 timeout_minutes=60
          worker_limits 可分别指定下级三种协作上限 默认继承本层
        report --json-file <UTF-8 JSON文件>
          必需 task_id outcome(completed|needs_decision|failed) summary artifacts(绝对路径数组)
        status --task-id <任务ID>
        cancel --task-id <任务ID>  仅中断联调 不停止模型或脚本
        accept --task-id <任务ID>
        install --instance <实例> [--skill <Skill目录>]
          CLI 与实例管理器放在同一目录 目录迁移后重新运行 install 更新 Skill 与 MCP 路径
        mcp --instance <实例ID>
        调用方默认取 CODEX_HOME 与 CODEX_THREAD_ID
        在 Codex 外使用时显式提供 --caller-instance <实例> --caller-thread <会话ID>
        stdout 返回 JSON 失败退出码 1 详情写 stderr
        """;

    #region Execution
    public static async Task<int> RunAsync(string[] ArgumentList, Stream Input, Stream Output, TextWriter Error, string ExecutablePath, CancellationToken Cancellation, string? PipeName = null, Func<ManagerSettings>? LoadSettings = null)
    {
        using var Writer = new StreamWriter(Output, new UTF8Encoding(false), 4096, true) { AutoFlush = true };
        try
        {
            var Call = Parse(ArgumentList);
            if (Call.Command == "help") { await Writer.WriteLineAsync(Help); return 0; }
            var Settings = (LoadSettings ?? SettingsStore.Load)();
            if (Call.Command == "mcp")
            {
                var Instance = AgentManagementService.ResolveInstance(Settings, Required(Call, "instance"));
                await RelayMcp.RunAsync(Instance.Id, Input, Output, Cancellation, PipeName);
                return 0;
            }
            if (Call.Command == "install")
            {
                var Instance = AgentManagementService.ResolveInstance(Settings, Required(Call, "instance"));
                await Writer.WriteLineAsync(JsonSerializer.Serialize(AgentCliDeployment.Install(Instance, ExecutablePath, Call.OptionDict.GetValueOrDefault("skill"))));
                return 0;
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
                _ => throw new InvalidOperationException("未知命令 " + Call.Command)
            };
            var Result = await RelayHost.RequestAsync(new(Caller.Id, ThreadId, Command, Call.Arguments), Cancellation, PipeName);
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
            "status" or "cancel" or "accept" => new[] { "task-id" },
            "install" => new[] { "instance", "skill" },
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
        if (Command is "start" or "report")
        {
            if (!OptionDict.TryGetValue("json-file", out string? FilePath)) throw new InvalidOperationException("缺少 --json-file");
            if (new FileInfo(FilePath).Length > RelayLimits.MaxFrameBytes / 2) throw new InvalidDataException("请求文件过大");
            using var Document = JsonDocument.Parse(File.ReadAllBytes(FilePath));
            if (Document.RootElement.ValueKind != JsonValueKind.Object) throw new InvalidDataException("请求必须是 JSON 对象");
            string[] PropertyList = Command == "start" ? new[] { "request_id", "instance", "project", "session", "create_title", "title", "instructions", "acceptance", "session_max", "subagent_max", "cross_agent_max", "worker_limits", "timeout_minutes" } : new[] { "task_id", "outcome", "summary", "artifacts" };
            var NameHashList = new HashSet<string>();
            foreach (var Property in Document.RootElement.EnumerateObject())
                if (!PropertyList.Contains(Property.Name) || !NameHashList.Add(Property.Name)) throw new InvalidDataException("请求参数未知或重复 " + Property.Name);
            return new(Command, OptionDict, Document.RootElement.Clone());
        }
        var Arguments = new Dictionary<string, object>();
        foreach (var Pair in OptionDict)
        {
            if (Pair.Key.StartsWith("caller-", StringComparison.Ordinal)) continue;
            Arguments[Pair.Key.Replace('-', '_')] = Pair.Key == "offset" ? int.Parse(Pair.Value) : Pair.Value;
        }
        return new(Command, OptionDict, JsonSerializer.SerializeToElement(Arguments));
    }

    private static string Required(AgentCliInvocation Call, string Name) => Call.OptionDict.GetValueOrDefault(Name) ?? throw new InvalidOperationException("缺少 --" + Name);
    #endregion
}
