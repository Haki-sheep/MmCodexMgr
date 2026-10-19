namespace CodexInstanceManager;

public static class AgentToolCatalog
{
    public static object[] Tools() => new object[]
    {
        Tool("agent_instances", "列出当前管理器登记的实例编号 ID 和名称", new { }, Array.Empty<string>()),
        Tool("agent_projects", "读取指定实例的本地项目目录 不会启动模型", new { instance = Text() }, new[] { "instance" }),
        Tool("agent_sessions", "在指定实例和项目中按会话完整名称或 ID 查找 会话按页读取 重名时需使用 ID", new { instance = Text(), project = Text(), session = Text(), offset = Number(0) }, new[] { "instance", "project" }),
        Tool("agent_start", "按用户指定的实例和项目启动联调 session 与 create_title 二选一 仅用户要求新建会话时提供 create_title 任务边界和验收必须明确 三种协作方式可组合 request_id 重试保持不变 成功后等待事件回传 不要轮询", new
        {
            request_id = Text(128), instance = Text(), project = Text(), session = Text(), create_title = Text(120), title = Text(120), instructions = Text(RelayLimits.MaxTextLength), acceptance = Text(RelayLimits.MaxTextLength),
            subagent_max = Number(0), session_max = Number(0), cross_agent_max = Number(0), timeout_minutes = new { type = "integer", minimum = 1, maximum = 1440 },
            tree_session_max = Number(1), max_depth = new { type = "integer", minimum = 1, maximum = RelayLimits.MaxTreeDepth },
            worker_limits = new { type = "object", properties = new { subagent_max = Number(0), session_max = Number(0), cross_agent_max = Number(0) }, additionalProperties = false },
            workspace = new { type = "object", properties = new { access = new { type = "string", @enum = new[] { "read_only", "write" } }, write_paths = new { type = "array", items = Text(1024), maxItems = 20 } }, required = new[] { "access" }, additionalProperties = false }
        }, new[] { "request_id", "instance", "project", "title", "instructions", "acceptance", "workspace" }),
        Tool("agent_task", "单次读取本人参与任务的状态 进度 结果和预算 仅用户询问进度或排错时查询 不要轮询", new { task_id = Text(128) }, new[] { "task_id" }),
        Tool("agent_tree", "分页读取当前任务的直接下级 摘要按需加载 不要轮询", new { task_id = Text(128), offset = Number(0) }, new[] { "task_id" }),
        Tool("agent_cancel", "仅任务主会话中断本任务和下级的联调记录 不停止模型或脚本", new { task_id = Text(128) }, new[] { "task_id" }),
        Tool("relay_progress", "执行方开始工作或完成重要阶段时主动上报进度 started progress blocked 不唤醒主会话 不能替代最终 relay_report 无需定时心跳", new { task_id = Text(128), stage = new { type = "string", @enum = new[] { "started", "progress", "blocked" } }, message = Text(RelayLimits.MaxEventLength) }, new[] { "task_id", "stage", "message" }),
        Tool("agent_retry_return", "仅在用户已核对原主会话未收到回传后重发已保存的结果 不自动调用 此操作可能重复唤醒主会话", new { task_id = Text(128), confirmed = new { type = "boolean" } }, new[] { "task_id", "confirmed" }),
        Tool("agent_reconcile", "仅在用户已核对执行任务确实开始后 恢复投递待核对记录并绑定准确执行会话 不重复创建或发送任务", new { task_id = Text(128), session_id = Text(128), confirmed = new { type = "boolean" } }, new[] { "task_id", "session_id", "confirmed" }),
        Tool("agent_doctor", "只读检查实例运行 桥接能力 CLI MCP 和 Skill 安装路径 不启动模型", new { instance = Text() }, Array.Empty<string>())
    };

    private static object Number(int Minimum) => new { type = "integer", minimum = Minimum };
    private static object Text(int Maximum = 1024) => new { type = "string", minLength = 1, maxLength = Maximum };
    private static object Tool(string Name, string Description, object Properties, string[] RequiredList) => new { name = Name, description = Description, inputSchema = new { type = "object", properties = Properties, required = RequiredList, additionalProperties = false } };
}
