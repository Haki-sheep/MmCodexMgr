using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class RelayRequestException : InvalidOperationException
{
    public string Kind { get; }
    public RelayRequestException(string Kind, string Message) : base(Message) => this.Kind = Kind;
}

public static class RelayOutbox
{
    public static string Root => Path.Combine(RelayLimits.Root, "outbox");

    public static async Task<JsonElement> DeliverAsync(RelayRequest Request, CancellationToken Cancellation, string? PipeName = null, string? DirectoryPath = null)
    {
        string PathValue = Save(Request, DirectoryPath ?? Root);
        try
        {
            var Result = await RelayHost.RequestAsync(Request, Cancellation, PipeName);
            File.Delete(PathValue);
            return Result;
        }
        catch (RelayRequestException Error) when (Error.Kind == "rejected")
        {
            string? Retained = PreserveRejected(PathValue);
            if (Retained is null) throw;
            throw new RelayRequestException(Error.Kind, Error.Message + " 原回报已保留供核对 " + Retained);
        }
        catch (Exception Error) when (Error is IOException or TimeoutException or OperationCanceledException or RelayRequestException)
        {
            throw new IOException("回报未确认 本地发件箱会自动补录 " + PathValue + " 原因 " + Error.Message, Error);
        }
    }

    public static async Task<(int Recovered, int Failed)> ReplayOnceAsync(RelayCoordinator Coordinator, CancellationToken Cancellation, string? DirectoryPath = null, bool WaitForNotification = true)
    {
        string Folder = DirectoryPath ?? Root;
        if (!Directory.Exists(Folder)) return (0, 0);
        int Recovered = 0;
        int Failed = 0;
        foreach (string PathValue in Directory.GetFiles(Folder, "*.pending.json"))
        {
            Cancellation.ThrowIfCancellationRequested();
            try
            {
                if (new FileInfo(PathValue).Length > RelayLimits.MaxFrameBytes) throw new InvalidDataException("发件箱文件超过限制 " + PathValue);
                var Request = JsonSerializer.Deserialize<RelayRequest>(File.ReadAllBytes(PathValue)) ?? throw new InvalidDataException("发件箱请求为空 " + PathValue);
                var Arguments = Request.Arguments;
                await Coordinator.ReportAsync(Request.InstanceId, Request.ThreadId, Arguments.GetProperty("task_id").GetString()!, Arguments.GetProperty("outcome").GetString()!, Arguments.GetProperty("summary").GetString()!, Arguments.GetProperty("artifacts").EnumerateArray().Select(Item => Item.GetString()!).ToList(), WaitForNotification);
                File.Delete(PathValue);
                Recovered++;
            }
            catch (FileNotFoundException) when (!File.Exists(PathValue)) { }
            catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { throw; }
            catch (Exception Error) when (Error is IOException or InvalidDataException or InvalidOperationException or JsonException or KeyNotFoundException)
            {
                Program.LogError(Error);
                if (Error is not IOException) PreserveRejected(PathValue);
                Failed++;
            }
        }
        return (Recovered, Failed);
    }

    private static string? PreserveRejected(string PathValue)
    {
        string Retained = PathValue + "." + Guid.NewGuid().ToString("N") + ".rejected";
        try { File.Move(PathValue, Retained); }
        catch (FileNotFoundException) { return null; }
        return Retained;
    }

    public static string Save(RelayRequest Request, string DirectoryPath)
    {
        var Arguments = Request.Arguments;
        string TaskId = Arguments.GetProperty("task_id").GetString()!;
        string Outcome = Arguments.GetProperty("outcome").GetString()!;
        string Summary = Arguments.GetProperty("summary").GetString()!;
        string[] ArtifactList = Arguments.GetProperty("artifacts").EnumerateArray().Select(Item => Item.GetString()!).ToArray();
        if (string.IsNullOrWhiteSpace(TaskId) || TaskId.Length > 128 || Outcome is not ("completed" or "needs_decision" or "failed") || string.IsNullOrWhiteSpace(Summary) || Summary.Length > RelayLimits.MaxTextLength || ArtifactList.Length > 20 || ArtifactList.Any(PathValue => string.IsNullOrWhiteSpace(PathValue) || PathValue.Length > 1024 || !Path.IsPathFullyQualified(PathValue))) throw new InvalidDataException("回报参数不符合联调契约");
        var Canonical = Request with { Arguments = JsonSerializer.SerializeToElement(new { task_id = TaskId, outcome = Outcome, summary = Summary, artifacts = ArtifactList }) };
        byte[] ContentList = JsonSerializer.SerializeToUtf8Bytes(Canonical);
        if (ContentList.Length > RelayLimits.MaxFrameBytes) throw new InvalidDataException("回报超过发件箱限制");
        Directory.CreateDirectory(DirectoryPath);
        string Key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Request.InstanceId + "/" + Request.ThreadId + "/" + TaskId)));
        string PathValue = Path.Combine(DirectoryPath, Key + ".pending.json");
        string Temporary = PathValue + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllBytes(Temporary, ContentList);
            try { File.Move(Temporary, PathValue); }
            catch (IOException) when (File.Exists(PathValue))
            {
                try
                {
                    using var Existing = new FileStream(PathValue, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
                    if (Existing.Length > RelayLimits.MaxFrameBytes) throw new InvalidDataException("已有回报超过发件箱限制");
                    var ExistingContentList = new byte[Existing.Length];
                    Existing.ReadExactly(ExistingContentList);
                    if (!ExistingContentList.AsSpan().SequenceEqual(ContentList)) throw new InvalidOperationException("该任务有尚未确认的回报 禁止替换已保存内容 " + PathValue);
                }
                catch (FileNotFoundException) { File.Move(Temporary, PathValue); }
            }
        }
        finally { if (File.Exists(Temporary)) File.Delete(Temporary); }
        return PathValue;
    }
}
