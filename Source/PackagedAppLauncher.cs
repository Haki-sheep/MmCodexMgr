using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;

namespace CodexInstanceManager;

internal static class PackagedAppLauncher
{
    private static string ManifestPath(string AppPath) => Path.Combine(Path.GetDirectoryName(Path.GetDirectoryName(AppPath))!, "AppxManifest.xml");

    public static bool IsPackaged(string AppPath) => File.Exists(ManifestPath(AppPath));

    private static (string Family, string AppId) GetApplication(string AppPath)
    {
        var Manifest = XDocument.Load(ManifestPath(AppPath));
        var Package = Manifest.Root ?? throw new InvalidDataException("应用包清单为空");
        var Identity = Package.Elements().Single(Item => Item.Name.LocalName == "Identity");
        string PackageRoot = Path.GetDirectoryName(ManifestPath(AppPath))!;
        string PackageFamily = Identity.Attribute("Name")!.Value + "_" + Path.GetFileName(PackageRoot).Split('_')[^1];
        var Application = Package.Descendants().Single(Item => Item.Name.LocalName == "Application" &&
            string.Equals(Path.GetFullPath(Path.Combine(PackageRoot, Item.Attribute("Executable")!.Value)), AppPath, StringComparison.OrdinalIgnoreCase));
        return (PackageFamily, Application.Attribute("Id")!.Value);
    }

    public static int ActivateDefault(string AppPath)
    {
        var (Family, AppId) = GetApplication(AppPath);
        var ActivationType = Type.GetTypeFromCLSID(new Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C"), throwOnError: true)!;
        var Activation = (IApplicationActivationManager)Activator.CreateInstance(ActivationType)!;
        try
        {
            Marshal.ThrowExceptionForHR(Activation.ActivateApplication(Family + "!" + AppId, null, 0, out int ProcessId));
            return ProcessId;
        }
        finally { Marshal.ReleaseComObject(Activation); }
    }

    public static int Launch(string AppPath, InstanceProfile Profile)
    {
        var (PackageFamily, AppId) = GetApplication(AppPath);
        string PipeName = @"LOCAL\MmCodexLaunch-" + Guid.NewGuid().ToString("N");
        using var Receipt = new NamedPipeServerStream(PipeName, PipeDirection.In, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
        if (!Profile.IsPrimary) Directory.CreateDirectory(Profile.DataPath);
        string DataSetup = Profile.IsPrimary ? "" : "$Info.EnvironmentVariables['CODEX_ELECTRON_USER_DATA_PATH']=" + Quote(Profile.DataPath) + "; $Info.Arguments=" + Quote("--user-data-dir=\"" + Profile.DataPath + "\"") + ";";
        // 在包身份内设置环境变量 避免激活代理丢弃实例目录
        string StartScript = """
            try {
                $Info=New-Object System.Diagnostics.ProcessStartInfo;
                $Info.UseShellExecute=$false;
                foreach($Key in @($Info.EnvironmentVariables.Keys)) {
                    if($Key.StartsWith('CODEX_') -or $Key -in @('OPENAI_API_KEY','ELECTRON_RUN_AS_NODE','NODE_OPTIONS','NODE_CHANNEL_FD')) { $Info.EnvironmentVariables.Remove($Key) }
                }
            """ + "$Info.FileName=" + Quote(AppPath) + "; $Info.WorkingDirectory=" + Quote(Path.GetDirectoryName(AppPath)!) + "; $Info.EnvironmentVariables['CODEX_HOME']=" + Quote(Profile.HomePath) + ";" + DataSetup + """
                $Started=[System.Diagnostics.Process]::Start($Info);
                @{processId=$Started.Id} | ConvertTo-Json -Compress
            } catch { @{error=$_.Exception.ToString()} | ConvertTo-Json -Compress }
            """;
        string InnerScript = "$Pipe=[IO.Pipes.NamedPipeClientStream]::new('.', " + Quote(PipeName) + ", [IO.Pipes.PipeDirection]::Out); " + """
            $ErrorActionPreference='Stop';
            try {
                $Pipe.Connect(5000);
                $Writer=[IO.StreamWriter]::new($Pipe, [Text.UTF8Encoding]::new($false));
                try {
                    $Result=& {
            """ + StartScript + """
                    };
                    $Writer.WriteLine($Result);
                } finally { $Writer.Dispose() }
            } finally { $Pipe.Dispose() }
            """;
        string InnerArguments = "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand " + Encode(InnerScript);
        string OuterScript = "$ErrorActionPreference='Stop'; Invoke-CommandInDesktopPackage -PackageFamilyName " + Quote(PackageFamily) + " -AppId " + Quote(AppId) + " -Command powershell.exe -Args " + Quote(InnerArguments) + " -PreventBreakaway";
        var Activation = new ProcessStartInfo("powershell.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        Activation.ArgumentList.Add("-NoProfile");
        Activation.ArgumentList.Add("-NonInteractive");
        Activation.ArgumentList.Add("-EncodedCommand");
        Activation.ArgumentList.Add(Encode(OuterScript));
        using var Activator = Process.Start(Activation) ?? throw new IOException("无法启动应用包激活器");
        var Output = Activator.StandardOutput.ReadToEndAsync();
        var ErrorOutput = Activator.StandardError.ReadToEndAsync();
        if (!Activator.WaitForExit(15000)) throw new TimeoutException("应用包激活器超时 请核对目标实例是否已经启动");
        string Details = ErrorOutput.GetAwaiter().GetResult();
        Output.GetAwaiter().GetResult();
        if (Activator.ExitCode != 0) throw new IOException("应用包激活失败 " + Details);
        using var Timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            Receipt.WaitForConnectionAsync(Timeout.Token).GetAwaiter().GetResult();
            using var Reader = new StreamReader(Receipt, Encoding.UTF8);
            string? Response = Reader.ReadLineAsync(Timeout.Token).AsTask().GetAwaiter().GetResult();
            if (Response is null) throw new IOException($"包内启动回执已断开 实例 {Profile.Name}");
            using var Result = JsonDocument.Parse(Response);
            if (Result.RootElement.TryGetProperty("error", out var Failure))
                throw new IOException("包内实例启动失败 " + Failure.GetString());
            return Result.RootElement.GetProperty("processId").GetInt32();
        }
        catch (OperationCanceledException Error) when (Timeout.IsCancellationRequested)
        {
            throw new TimeoutException($"包内启动回执超时 实例 {Profile.Name} 请刷新运行状态", Error);
        }
    }

    private static string Quote(string Text) => "'" + Text.Replace("'", "''") + "'";

    private static string Encode(string Text) => Convert.ToBase64String(Encoding.Unicode.GetBytes(Text));

    [ComImport, Guid("2E941141-7F97-4756-BA1D-9DECDE894A3D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IApplicationActivationManager
    {
        [PreserveSig]
        int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)] string AppUserModelId,
            [MarshalAs(UnmanagedType.LPWStr)] string? Arguments, uint Options, out int ProcessId);
    }
}
