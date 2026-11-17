using System.Text.Json;

namespace CodexInstanceManager;

public static class FormationCli
{
    public const string Help = """
        formation <action> [--json-file <UTF-8 JSON>] [--operator true]
        action: list create show task-show template-save templates member task activate dispatch native-bind native-report submit review reconcile takeover pause resume context complete open lifecycle-preview archive unarchive delete
        写入请求提供 operation_id 同一请求重试须保留原 ID 和内容
        人工调用使用 --operator true 自动读取当前 Windows 用户的本机凭据 可用 MMCODEX_FORMATION_OPERATOR_TOKEN 显式覆盖
        角色调用使用当前 CODEX_HOME CODEX_THREAD_ID 及 MMCODEX_FORMATION_MEMBER_TOKEN
        独立会话使用 Relay 回传 原生轮次由真实统筹用宿主工具执行并回传 reconcile 核对原轮次
        list      [offset] 返回编队摘要页
        show      run_id [offset] 返回编队和任务摘要页
                  list/show/task-show 可用 view=full 取完整记录 show/task-show 可用 section 与 offset 逐条读取历史
        create    operation_id formation={theme,requirement,preset:"basic"|"reviewed",instance_id,model,effort} 省略执行配置沿用主实例
                  也可用 template_id 或 member_list 完整配置席位 不会自动启动任务
                  setup_only:true 仅配置编队 需求留空 主题可省略 执行者最多四席 外援最多两席
                  effort 为拟推理强度 独立 Codex 派发选择模型支持的最近档位 档位未知时沿用默认
                  席位 dispatch_mode=Session|Native 审核/外援可用 Native follow_coordinator=true 时继承统筹模型与拟推理强度
                  各席位可设 subagent_max=1..4 不含本体 原生叶子与不支持委派的执行端实际为 0
        context   run_id operation_id requirement [context] 统筹或人工保存已确认需求
        task-show run_id task_id 返回任务和最近记录摘要
        task      run_id operation_id title instructions acceptance executor_id [reviewer_id] workspace={access:"read_only"} 或 {access:"write",write_paths:[绝对路径]}
        dispatch  run_id operation_id task_id [kind=execute|review]
                  原生轮次人工仅预留 同一 operation_id 由真实统筹领取一次
                  仅 can_spawn=true 时用宿主工具创建 返回 task_name prompt model preferred_effort effort
                  run_in_coordinator=true 时统筹在当前会话直接接管 通过 submit 提交给审核席
        submit    run_id operation_id task_id attempt_id submission_id summary [artifacts]
        native-bind   run_id operation_id task_id attempt_id agent_id stage=created|running 仅真实统筹
        native-report run_id operation_id task_id attempt_id outcome=completed|failed|stopped|not_started|unknown evidence [agent_id]
                      仅真实统筹 宿主明确确认本轮结束或停止后提交结果及证据 已登记 Agent 必须带原 ID
                      completed 审核带 submission_id passed [feedback] 外援执行带 summary [artifacts]
        review    run_id operation_id task_id attempt_id submission_id passed [feedback]
        complete  run_id operation_id summary
        activate  run_id operation_id  仅人工启动真实统筹会话
        open      run_id  跳转到统筹会话 不发送任务
        lifecycle-preview run_id action=archive|unarchive|delete  返回目标清单 token blocker_list 与 resume_operation_id
        archive   run_id operation_id plan_token  原生归档关联会话 已归档项跳过
        unarchive run_id operation_id plan_token  恢复本次归档的会话 原先归档状态保留 调度保持暂停
        delete    run_id operation_id plan_token confirm_delete=true  停止关联会话 使用原生删除或归档 核实后删除编队
                  失败保留逐会话进度 重试沿用 resume_operation_id 并使用最新预览 token
                  Codex 删除可能需在原应用确认 DSH 使用归档 Claude/Cursor CLI 暂无已验证的删除或归档接口
        status: InProgress=进行中 Blocked=阻塞中 Archived=已归档 state 保留调度状态 complete 不等于 archive
        """;

    public static bool IsCommand(string[] ArgumentList) => ArgumentList.Length != 0 && ArgumentList[0] == "formation";

    public static async Task<int> RunAsync(string[] ArgumentList, Stream Output, TextWriter Error, CancellationToken Cancellation,
        string? PipeName = null, Func<ManagerSettings>? LoadSettings = null)
    {
        using var Writer = new StreamWriter(Output, new System.Text.UTF8Encoding(false), 4096, true) { AutoFlush = true };
        try
        {
            if (ArgumentList.Length == 1 || ArgumentList is ["formation", "help"] or ["formation", "--help"] or ["formation", "-h"])
            {
                await Writer.WriteLineAsync(Help);
                return 0;
            }

            string Action = ArgumentList[1];
            var OptionDict = new Dictionary<string, string>();
            for (int Index = 2; Index < ArgumentList.Length; Index += 2)
            {
                string Key = ArgumentList[Index];
                if (Index + 1 >= ArgumentList.Length || Key is not ("--json-file" or "--operator") ||
                    !OptionDict.TryAdd(Key, ArgumentList[Index + 1])) throw new InvalidOperationException("编队命令参数未知或重复 " + Key);
            }
            bool Operator = OptionDict.TryGetValue("--operator", out string? Mode);
            if (Operator && Mode != "true") throw new InvalidOperationException("--operator 必须为 true");
            string InstanceId = "";
            string ThreadId = "";
            string Credential = Environment.GetEnvironmentVariable(Operator ? "MMCODEX_FORMATION_OPERATOR_TOKEN" : "MMCODEX_FORMATION_MEMBER_TOKEN")
                ?? (Operator ? FormationOperatorCredential.Load() : null)
                ?? throw new InvalidOperationException(Operator ? "缺少人工操作凭据" : "缺少当前编队角色凭据");
            if (!Operator)
            {
                var Settings = (LoadSettings ?? SettingsStore.Load)();
                string Home = Environment.GetEnvironmentVariable("CODEX_HOME") ?? throw new InvalidOperationException("编队角色需要实际 CODEX_HOME");
                InstanceId = Settings.InstanceList.SingleOrDefault(Value => ManagerPaths.Same(Value.HomePath, Home))?.Id
                    ?? throw new InvalidOperationException("编队角色的 CODEX_HOME 未匹配已登记实例");
                ThreadId = Environment.GetEnvironmentVariable("CODEX_THREAD_ID") ?? throw new InvalidOperationException("编队角色需要实际 CODEX_THREAD_ID");
            }
            var Arguments = JsonSerializer.SerializeToElement(new { });
            if (OptionDict.TryGetValue("--json-file", out string? FilePath))
            {
                if (new FileInfo(FilePath).Length > RelayLimits.MaxFrameBytes / 2) throw new InvalidDataException("编队请求文件过大");
                using var Document = JsonDocument.Parse(File.ReadAllBytes(FilePath));
                Arguments = Document.RootElement.Clone();
            }
            var Envelope = JsonSerializer.SerializeToElement(new { @operator = Operator, credential = Credential, arguments = Arguments });
            bool AcceptLarge = Action is "list" or "show" or "task-show" &&
                Arguments.ValueKind == JsonValueKind.Object && (Arguments.TryGetProperty("view", out var View) &&
                    View.ValueKind == JsonValueKind.String && View.GetString() == "full" || Arguments.TryGetProperty("section", out _));
            var Request = new RelayRequest(InstanceId, ThreadId, "formation_" + Action, Envelope) { AcceptLargeResponse = AcceptLarge };
            var Result = await RelayHost.RequestAsync(Request, Cancellation, PipeName);
            await Writer.WriteLineAsync(Result.GetRawText());
            return 0;
        }
        catch (RelayRequestException Failure)
        {
            await Error.WriteLineAsync(JsonSerializer.Serialize(Failure.ErrorPayload()));
            return 1;
        }
        catch (Exception Failure)
        {
            await Error.WriteLineAsync(JsonSerializer.Serialize(new { error = Failure.Message }));
            return 1;
        }
    }

    public static async Task<JsonElement> HandleRequestAsync(FormationService Service, RelayRequest Request, CancellationToken Cancellation)
    {
        const string Prefix = "formation_";
        if (!Request.Command.StartsWith(Prefix, StringComparison.Ordinal)) throw new InvalidOperationException("未知编队请求");
        var Envelope = Request.Arguments;
        string Credential = Envelope.GetProperty("credential").GetString() ?? "";
        FormationCaller Caller;
        if (Envelope.GetProperty("operator").GetBoolean())
        {
            if (Request.InstanceId.Length != 0 || Request.ThreadId.Length != 0 || !Service.IsOperatorCredential(Credential))
                throw new InvalidOperationException("编队人工凭据无效");
            Caller = FormationCaller.Operator();
        }
        else
        {
            if (Request.InstanceId.Length == 0 || Request.ThreadId.Length == 0) throw new InvalidOperationException("编队角色缺少真实会话身份");
            Caller = FormationCaller.Agent(Request.InstanceId, Request.ThreadId, Credential);
        }
        string Action = Request.Command[Prefix.Length..];
        var Arguments = Envelope.GetProperty("arguments");
        var Query = Action is "list" or "show" or "task-show" ? FormationQuery.Parse(Action, Arguments) : null;
        var Result = await Service.ExecuteAsync(Action, Arguments, Caller, Cancellation);
        return FormationService.Output(Query is null ? FormationService.FormatCommandResult(Action, Result) : Query.Format(Result));
    }
}
