using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public static class DshCli
{
    #region Queries
    public static DshWorkspace ResolveWorkspace(List<DshWorkspace> WorkspaceList, string? Selector)
    {
        var MatchList = WorkspaceList.Where(Value => Selector is null || Selector == "default" ? Value.Default : Value.Id == Selector || Value.Name == Selector || Path.IsPathFullyQualified(Selector) && ManagerPaths.Same(Value.Path, Selector)).ToList();
        if (MatchList.Count != 1) throw new InvalidOperationException(MatchList.Count == 0 ? "DSH 工作区未找到 请先执行 projects --instance dsh" : "DSH 工作区重名 请提供准确 ID");
        return MatchList[0];
    }

    public static async Task<object> QueryAsync(string Command, DshSettings Settings, JsonElement Arguments, CancellationToken Cancellation)
    {
        using var Client = await DshDesktopClient.ConnectAsync(Settings, Cancellation);
        var WorkspaceList = Client.Workspaces();
        if (Command == "projects") return WorkspaceList.Select(Value => new { id = Value.Id, name = Value.Name, path = Value.Path, is_default = Value.Default }).ToArray();
        string? Project = Optional(Arguments, "project");
        var Workspace = Project is null ? null : ResolveWorkspace(WorkspaceList, Project);
        string? Selector = Optional(Arguments, "session");
        int Offset = Arguments.TryGetProperty("offset", out var Value) ? Value.GetInt32() : 0;
        if (Offset < 0) throw new ArgumentOutOfRangeException(nameof(Offset));
        return (await Client.SessionsAsync(Cancellation)).Where(Session => !Session.Archived && (Workspace is null || Workspace.SessionIdList.Contains(Session.Id)) && (Selector is null || Selector == Session.Id || Selector == Session.Title)).Skip(Offset).Take(RelayLimits.PageSize).ToArray();
    }

    public static async Task<AgentHealthReport> DoctorAsync(DshSettings Settings, CancellationToken Cancellation)
    {
        try
        {
            using var Client = await DshDesktopClient.ConnectAsync(Settings, Cancellation);
            await Client.SessionsAsync(Cancellation);
            var WorkspaceList = Client.Workspaces();
            return new(DshRelayRunner.InstanceId, new() { new("DSH 桌面服务与认证", true, Client.Connection.Origin.AbsoluteUri), new("DSH 数据目录", true, Client.Connection.HomePath), new("DSH 工作区", WorkspaceList.Any(Value => Value.Default), "已登记 " + WorkspaceList.Count + " 个工作区") });
        }
        catch (Exception Error) when (!Cancellation.IsCancellationRequested)
        {
            return new(DshRelayRunner.InstanceId, new() { new("DSH 桌面连接", false, Error.Message) });
        }
    }
    #endregion

    #region Commands
    public static async Task<object> ExecuteAsync(AgentCliInvocation Call, ManagerSettings Settings, CancellationToken Cancellation)
    {
        if (Call.Command == "dsh-config")
        {
            string? Home = Call.OptionDict.GetValueOrDefault("home");
            string? Url = Call.OptionDict.GetValueOrDefault("server-url");
            if (Home is not null) Settings.Dsh.HomePath = Home == "auto" ? "" : ManagerPaths.Normalize(Home);
            if (Url is not null) Settings.Dsh.ServerUrl = Url == "auto" ? "" : DshDiscovery.ValidateOrigin(Url).AbsoluteUri;
            if (Home is not null || Url is not null) SettingsStore.Save(Settings);
            return new { home = Settings.Dsh.HomePath, server_url = Settings.Dsh.ServerUrl, discovery = "空值自动发现 DSH_HOME 与 DSH_SERVER_URL 可覆盖自动值 配置优先" };
        }
        using var Client = await DshDesktopClient.ConnectAsync(Settings.Dsh, Cancellation);
        string Required(string Name) => Call.OptionDict.GetValueOrDefault(Name) ?? throw new InvalidOperationException("缺少 --" + Name);
        switch (Call.Command)
        {
            case "dsh-create":
            {
                string RequestId = Required("request-id");
                string Title = Required("title");
                if (Title.Length > 120) throw new InvalidOperationException("会话标题最多 120 字符");
                var Workspace = ResolveWorkspace(Client.Workspaces(), Call.OptionDict.GetValueOrDefault("project"));
                string Id = "session-" + new Guid(SHA256.HashData(Encoding.UTF8.GetBytes("mmcodex-dsh-create/" + RequestId)).AsSpan(0, 16)).ToString("D");
                var Existing = (await Client.SessionsAsync(Cancellation)).SingleOrDefault(Value => Value.Id == Id);
                if (Existing is not null)
                {
                    if (Existing.Archived || Existing.Title != Title || !Workspace.SessionIdList.Contains(Id)) throw new InvalidOperationException("此 request-id 已用于不同内容或已归档的会话 请核对原结果");
                    return new { session_id = Id, title = Title, workspace_id = Workspace.Id, reused = true };
                }
                await Client.CreateAsync(Workspace.Id, Title, Id, Cancellation);
                return new { session_id = Id, title = Title, workspace_id = Workspace.Id, reused = false };
            }
            case "dsh-rename":
                return await Client.RenameAsync(Required("session-id"), Required("title"), Cancellation);
            case "dsh-send":
            {
                string Id = Text(Call.Arguments, "session_id");
                string RequestId = Text(Call.Arguments, "request_id");
                var Session = await Client.SessionAsync(Id, Cancellation);
                if (Session.Running) throw new InvalidOperationException("DSH 会话正在执行 请等待原轮次结束 不自动插队");
                await Client.PromptAsync(Id, RequestId, Text(Call.Arguments, "message"), Cancellation);
                return new { accepted = true, session_id = Id, request_id = RequestId, instruction = "已受理不代表完成 使用 dsh-reply 按同一 request-id 读取回复 发送结果不明时先读取原请求 不换 ID 重发" };
            }
            case "dsh-reply":
            {
                var Reply = await Client.ReplyAsync(Required("session-id"), Required("request-id"), Cancellation);
                return new { completed = Reply is not null, reply = Reply };
            }
            default: throw new InvalidOperationException("未知 DSH 命令 " + Call.Command);
        }
    }

    private static string? Optional(JsonElement Value, string Name) => Value.TryGetProperty(Name, out var Property) ? Property.GetString() : null;
    private static string Text(JsonElement Value, string Name) => !string.IsNullOrWhiteSpace(Optional(Value, Name)) ? Optional(Value, Name)! : throw new InvalidOperationException("缺少或空参数 " + Name);
    #endregion
}
