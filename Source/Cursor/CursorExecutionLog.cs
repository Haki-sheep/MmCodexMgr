using System.Diagnostics;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class CursorExecutionLogs
{
    private readonly string Root;
    public CursorExecutionLogs(string Root) => this.Root = ManagerPaths.Normalize(Root);

    public string PathFor(string TaskId)
    {
        if (string.IsNullOrWhiteSpace(TaskId) || TaskId.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 || TaskId is "." or "..") throw new InvalidDataException("无效的 Cursor 日志任务 ID " + TaskId);
        return Path.Combine(Root, TaskId + ".log");
    }

    public CursorExecutionLog Create(RelayTask Item)
    {
        Directory.CreateDirectory(Root);
        var Log = new CursorExecutionLog(PathFor(Item.Id));
        try
        {
            Log.Note("开始", $"任务 {Item.Title}\n任务 ID {Item.Id}\n会话 {Item.Channel.WorkerThreadId}\n工作目录 {Item.Channel.WorkingDirectory}\n模型 {(Item.Channel.WorkerModel.Length == 0 ? "Cursor 默认" : Item.Channel.WorkerModel)}");
            return Log;
        }
        catch { Log.Dispose(); throw; }
    }

    public void OpenDirectory()
    {
        Directory.CreateDirectory(Root);
        var Info = new ProcessStartInfo("explorer.exe") { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Normal };
        Info.ArgumentList.Add(Root);
        using var Window = Process.Start(Info) ?? throw new InvalidOperationException("无法打开 Cursor 日志目录");
    }

    public static void OpenTerminal(string PathValue, string Title)
    {
        string Quote(string Text) => "'" + Text.Replace("'", "''") + "'";
        string Script = "$host.UI.RawUI.WindowTitle = " + Quote("Cursor 执行日志 · " + Title) + "; [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); Get-Content -LiteralPath " + Quote(PathValue) + " -Encoding UTF8 -Wait";
        var Info = new ProcessStartInfo("powershell.exe") { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Normal };
        foreach (string Argument in new[] { "-NoLogo", "-NoProfile", "-NoExit", "-EncodedCommand", Convert.ToBase64String(Encoding.Unicode.GetBytes(Script)) }) Info.ArgumentList.Add(Argument);
        using var Window = Process.Start(Info) ?? throw new InvalidOperationException("无法打开 Cursor 执行日志窗口");
    }
}

public sealed class CursorExecutionLog : IDisposable
{
    private static readonly JsonSerializerOptions DisplayOptions = new() { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
    private readonly StreamWriter TextWriter;
    private readonly StreamWriter EventWriter;
    private readonly object Gate = new();
    public string PathValue { get; }

    public CursorExecutionLog(string PathValue)
    {
        this.PathValue = PathValue;
        TextWriter = Open(PathValue);
        try { EventWriter = Open(Path.ChangeExtension(PathValue, ".jsonl")); }
        catch { TextWriter.Dispose(); throw; }
    }

    public void Dispose()
    {
        lock (Gate)
        {
            try { TextWriter.Dispose(); }
            finally { EventWriter.Dispose(); }
        }
    }

    public void Note(string Stage, string Message)
    {
        lock (Gate)
        {
            EventWriter.WriteLine(JsonSerializer.Serialize(new { type = "manager", stage = Stage, message = Message, time = DateTimeOffset.Now }));
            Write(Stage, Message);
        }
    }

    public void Append(string Line)
    {
        lock (Gate)
        {
            EventWriter.WriteLine(Line);
            using var Document = JsonDocument.Parse(Line);
            var Data = Document.RootElement;
            string Type = Data.GetProperty("type").GetString()!;
            switch (Type)
            {
                case "thinking":
                    break;
                case "assistant":
                case "user":
                    foreach (var Part in Data.GetProperty("message").GetProperty("content").EnumerateArray())
                        if (Part.GetProperty("type").GetString() == "text") Write(Type == "assistant" ? "Cursor" : "任务输入", Part.GetProperty("text").GetString()!);
                    break;
                case "tool_call":
                    Write("工具 " + (Data.GetProperty("subtype").GetString() switch { "started" => "开始", "completed" => "完成", var Other => Other }), JsonSerializer.Serialize(Data.GetProperty("tool_call"), DisplayOptions));
                    break;
                case "result":
                    Write("最终输出", Data.GetProperty("result").GetString()!);
                    break;
                default:
                    Write(Type, JsonSerializer.Serialize(Data, DisplayOptions));
                    break;
            }
        }
    }

    private void Write(string Stage, string Message) => TextWriter.WriteLine($"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss.fff}] [{Stage}]\n{Message}\n");
    private static StreamWriter Open(string PathValue) => new(new FileStream(PathValue, FileMode.Append, FileAccess.Write, FileShare.ReadWrite | FileShare.Delete), new UTF8Encoding(false)) { AutoFlush = true };
}
