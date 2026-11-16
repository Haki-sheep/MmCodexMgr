using System.Text.Json;

namespace CodexInstanceManager;

public sealed record RelayWorkerReport(string Outcome, string Summary, List<string> Artifacts)
{
    public static RelayWorkerReport Parse(string Text, string Agent)
    {
        using var Document = JsonDocument.Parse(Text);
        var Data = Document.RootElement;
        string Outcome = Data.GetProperty("outcome").GetString()!;
        string Summary = Data.GetProperty("summary").GetString()!;
        var ArtifactList = Data.GetProperty("artifacts").EnumerateArray().Select(Value => Value.GetString()!).ToList();
        if (Outcome is not ("completed" or "failed" or "needs_decision") || string.IsNullOrWhiteSpace(Summary) || Summary.Length > RelayLimits.MaxTextLength
            || ArtifactList.Count > 20 || ArtifactList.Any(Value => string.IsNullOrWhiteSpace(Value) || Value.Length > 1024 || !Path.IsPathFullyQualified(Value)))
            throw new InvalidDataException(Agent + " 回复不符合 outcome summary artifacts 契约");
        return new(Outcome, Summary, ArtifactList);
    }

    public static string BuildPrompt(RelayTask Item, string Agent) => $"[MmCodexMgr {Agent} 联调任务]\n任务 ID {Item.Id}\n任务 {Item.Title}\n\n目的与执行要求\n{Item.Instructions}\n\n验收规范\n{Item.Acceptance}\n\n工作目录 {Item.Channel.WorkingDirectory}\n工作区 {Item.Workspace.Access}\n允许写入的绝对路径\n{string.Join("\n", Item.Workspace.WritePathList)}\n遵守工程规则 不得扩大写入范围 只读任务禁止修改文件\n本执行端直接完成范围内工作 不创建子 Agent 或其他联调会话 不调用 mmcodex report progress 或 accept 不使用任何 Codex 会话身份\n如果是恢复会话 先检查已有历史和产物 从未完成处继续 不重复已完成的操作\n最终回答必须仅为合法 JSON 不加 Markdown 围栏 格式 {{\"outcome\":\"completed|needs_decision|failed\",\"summary\":\"实际修改 检查结果与未解决项\",\"artifacts\":[\"已生成产物的绝对路径\"]}}\n不得伪造检查通过 无法继续时回报 needs_decision 或 failed 产物没有则使用空数组 管理器负责保存并回传结果 Codex 主会话负责最终验收";
}
