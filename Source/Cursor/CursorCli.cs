using System.Diagnostics;
using System.Text;

namespace CodexInstanceManager;

public sealed record CursorCliResult(int ExitCode, string Output, string Error);

public interface ICursorCli
{
    Task<CursorCliResult> RunAsync(string CliPath, string Cwd, IReadOnlyList<string> ArgumentList, Func<string, Task>? OnLine, CancellationToken Cancellation, Func<string, Task>? OnError = null);
}

public sealed class CursorCli : ICursorCli
{
    public static string ResolvePath(string? Requested = null)
    {
        if (Requested is not null)
        {
            if (!Path.IsPathFullyQualified(Requested) || !File.Exists(Requested)) throw new FileNotFoundException("cursor_cli_path 必须是已安装 Cursor CLI 的绝对路径", Requested);
            return ManagerPaths.Normalize(Requested);
        }
        string Installed = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "cursor-agent", "cursor-agent.cmd");
        if (File.Exists(Installed)) return Installed;
        foreach (string Folder in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            foreach (string Name in new[] { "cursor-agent.exe", "cursor-agent.cmd", "cursor-agent.ps1" })
            {
                string Candidate = Path.Combine(Folder, Name);
                if (File.Exists(Candidate)) return Path.GetFullPath(Candidate);
            }
        throw new FileNotFoundException("未找到 Cursor CLI 请按 https://cursor.com/docs/cli/installation 安装并执行 cursor-agent login 不使用含义不确定的 agent 命令");
    }

    public static ProcessStartInfo StartInfo(string CliPath, string Cwd, IReadOnlyList<string> ArgumentList)
    {
        var Info = new ProcessStartInfo { WorkingDirectory = Cwd, UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8 };
        if (Path.GetExtension(CliPath).Equals(".exe", StringComparison.OrdinalIgnoreCase)) Info.FileName = CliPath;
        else
        {
            string Folder = Path.GetDirectoryName(CliPath)!;
            if (!File.Exists(Path.Combine(Folder, "node.exe")))
            {
                string Versions = Path.Combine(Folder, "versions");
                if (!Directory.Exists(Versions)) throw new InvalidOperationException("Cursor 启动脚本旁缺少 node.exe 或 versions 目录 " + CliPath);
                Folder = Directory.EnumerateDirectories(Versions).Where(Value => System.Text.RegularExpressions.Regex.IsMatch(Path.GetFileName(Value), @"^\d{4}\.\d{2}\.\d{2}(-\d{2}-\d{2}-\d{2})?-[a-f0-9]+$"))
                    .OrderByDescending(Path.GetFileName, StringComparer.Ordinal).FirstOrDefault() ?? throw new InvalidOperationException("Cursor CLI 缺少正式版本目录 " + Versions);
            }
            Info.FileName = Path.Combine(Folder, "node.exe");
            string Entry = Path.Combine(Folder, "index.js");
            if (!File.Exists(Info.FileName) || !File.Exists(Entry)) throw new FileNotFoundException("Cursor CLI 版本不完整 " + Folder);
            Info.ArgumentList.Add(Entry);
        }
        foreach (string Argument in ArgumentList) Info.ArgumentList.Add(Argument);
        Info.Environment.Remove("CODEX_THREAD_ID");
        Info.Environment.Remove("CODEX_HOME");
        return Info;
    }

    public static void OpenTerminal(string CliPath, string Cwd, IReadOnlyList<string> ArgumentList)
    {
        var CliInfo = StartInfo(CliPath, Cwd, ArgumentList);
        string Quote(string Text) => "'" + Text.Replace("'", "''") + "'";
        string Command = "& " + Quote(CliInfo.FileName) + " " + string.Join(" ", CliInfo.ArgumentList.Select(Quote));
        var Info = new ProcessStartInfo("powershell.exe") { WorkingDirectory = Cwd, UseShellExecute = true, WindowStyle = ProcessWindowStyle.Normal };
        Info.ArgumentList.Add("-NoExit");
        Info.ArgumentList.Add("-Command");
        Info.ArgumentList.Add(Command);
        using var Terminal = Process.Start(Info) ?? throw new InvalidOperationException("无法打开 Cursor 交互终端");
    }

    public async Task<CursorCliResult> RunAsync(string CliPath, string Cwd, IReadOnlyList<string> ArgumentList, Func<string, Task>? OnLine, CancellationToken Cancellation, Func<string, Task>? OnError = null)
    {
        Cancellation.ThrowIfCancellationRequested();
        using var Process = new Process { StartInfo = StartInfo(CliPath, Cwd, ArgumentList) };
        Process.Start();
        using var Job = CursorProcessJob.Attach(Process);
        using var Registration = Cancellation.Register(() => { try { if (!Process.HasExited) Process.Kill(true); } catch (InvalidOperationException) { } });
        var Output = new StringBuilder();
        var Error = new StringBuilder();
        async Task ReadErrorAsync()
        {
            var BufferList = new char[2048];
            int Length;
            while ((Length = await Process.StandardError.ReadAsync(BufferList, Cancellation)) != 0)
            {
                Error.Append(BufferList, 0, Length);
                if (Error.Length > 16000) Error.Remove(0, Error.Length - 16000);
                if (OnError is not null)
                {
                    try { await OnError(new string(BufferList, 0, Length)); }
                    catch { if (!Process.HasExited) Process.Kill(true); throw; }
                }
            }
        }
        var ErrorTask = ReadErrorAsync();
        try
        {
            while (await Process.StandardOutput.ReadLineAsync(Cancellation) is string Line)
            {
                if (Line.Length > RelayLimits.MaxDesktopFrameBytes) throw new InvalidDataException("Cursor 输出帧超过限制");
                if (OnLine is not null) await OnLine(Line);
                else
                {
                    Output.AppendLine(Line);
                    if (Output.Length > RelayLimits.MaxFrameBytes) throw new InvalidDataException("Cursor 命令输出超过限制");
                }
            }
            await Process.WaitForExitAsync(Cancellation);
            await ErrorTask;
            Cancellation.ThrowIfCancellationRequested();
            return new(Process.ExitCode, Output.ToString().Trim(), Error.ToString().Trim());
        }
        finally
        {
            if (!Process.HasExited) Process.Kill(true);
            await Process.WaitForExitAsync(CancellationToken.None);
            try { await ErrorTask; } catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
        }
    }
}
