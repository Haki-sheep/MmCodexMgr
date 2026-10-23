using System.IO.Pipes;
using System.Text;

namespace CodexInstanceManager;

public static class Program
{
    private static readonly string PipeName = "CodexInstanceManager-" + Environment.UserName;

    [STAThread]
    public static void Main(string[] ArgumentList)
    {
        if (ArgumentList.Length == 2 && ArgumentList[0] == "--relay-mcp")
        {
            try { RelayMcp.RunAsync(ArgumentList[1], Console.OpenStandardInput(), Console.OpenStandardOutput(), CancellationToken.None).GetAwaiter().GetResult(); }
            catch (Exception Error) { Console.Error.WriteLine(Error); Environment.ExitCode = 1; }
            return;
        }
        RunDesktop(ArgumentList);
    }

    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static void RunDesktop(string[] ArgumentList)
    {
        ApplicationConfiguration.Initialize();
        try
        {
            if (ArgumentList.Length == 2 && ArgumentList[0] is "--render-preview" or "--render-relay-preview")
            {
                var PreviewStore = new RelayStore(Path.Combine(Path.GetTempPath(), "CodexManagerRelayPreview-" + Guid.NewGuid().ToString("N")));
                using var PreviewCoordinator = new RelayCoordinator(PreviewStore, new DesktopRelayBridge());
                using var Preview = new MainForm(SettingsStore.Load(), true, PreviewStore, PreviewCoordinator);
                if (ArgumentList[0] == "--render-relay-preview") Preview.ShowRelayPage();
                Preview.Show();
                Application.DoEvents();
                using var Bitmap = new Bitmap(Preview.Width, Preview.Height);
                Preview.DrawToBitmap(Bitmap, new Rectangle(0, 0, Preview.Width, Preview.Height));
                Bitmap.Save(ArgumentList[1]);
                File.WriteAllText(ArgumentList[1] + ".json", System.Text.Json.JsonSerializer.Serialize(new { Preview.DeviceDpi, Preview.CurrentAutoScaleDimensions, Preview.AutoScaleDimensions, FontHeight = Preview.Font.Height, Controls = DescribeLayout(Preview) }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
                return;
            }
            string Command = ArgumentList.Length == 2 && ArgumentList[0] == "--launch" ? ArgumentList[1] : ArgumentList.Contains("--relay") ? "relay" : "show";
            using var Mutex = new Mutex(true, "Local\\" + PipeName, out bool Created);
            if (!Created)
            {
                using var Client = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
                Client.Connect(4000);
                using var Writer = new StreamWriter(Client, new UTF8Encoding(false)) { AutoFlush = true };
                Writer.WriteLine(Command);
                return;
            }
            var TaskStore = new RelayStore(RelayLimits.Root);
            string CliPath = AgentCliDeployment.LoadPath();
            var Channel = TaskStore.LoadChannel();
            if (Channel is not null && Channel.CallbackCliPath.Length != 0 && !ManagerPaths.Same(Channel.CallbackCliPath, CliPath))
            {
                Channel.CallbackCliPath = CliPath;
                TaskStore.SaveChannel(Channel);
            }
            using var DesktopBridge = new DesktopRelayBridge();
            using var CompatSupervisor = new ResponsesCompatSupervisor(SettingsStore.Load, CliPath, LogError);
            using var Coordinator = new RelayCoordinator(TaskStore, DesktopBridge);
            using var Form = new MainForm(SettingsStore.Load(), false, TaskStore, Coordinator);
            var AgentService = new AgentManagementService(TaskStore, Coordinator, new AgentCatalog(), CliPath);
            using var Relay = new RelayHost(Coordinator, AgentService: AgentService);
            Relay.Failed += Error => { if (!Form.IsDisposed && Form.IsHandleCreated) Form.BeginInvoke(() => MessageBox.Show(Form, Error.Message, "联调服务不可用")); };
            using var Cancellation = new CancellationTokenSource();
            Form.Shown += async (_, _) =>
            {
                if (Command != "show") { Form.Hide(); await Form.HandleCommandAsync(Command); }
                _ = RecoverReportsAsync(Coordinator, Form, Cancellation.Token);
            };
            _ = ListenAsync(Form, Cancellation.Token);
            Application.Run(Form);
            Cancellation.Cancel();
        }
        catch (Exception Error) { LogError(Error); MessageBox.Show(Error.Message, "Codex 实例管理器", MessageBoxButtons.OK, MessageBoxIcon.Error); Environment.ExitCode = 1; }
    }

    private static async Task ListenAsync(MainForm Form, CancellationToken Cancellation)
    {
        while (!Cancellation.IsCancellationRequested)
        {
            try
            {
                await using var Server = new NamedPipeServerStream(PipeName, PipeDirection.In, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
                await Server.WaitForConnectionAsync(Cancellation);
                using var Reader = new StreamReader(Server, Encoding.UTF8);
                string? Command = await Reader.ReadLineAsync(Cancellation);
                if (Command is not null) Form.BeginInvoke(async () => { try { await Form.HandleCommandAsync(Command); } catch (Exception Error) { LogError(Error); MessageBox.Show(Form, Error.Message, "实例操作失败"); } });
            }
            catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { return; }
            catch (Exception Error) { LogError(Error); return; }
        }
    }

    public static void LogError(Exception Error)
    {
        Directory.CreateDirectory(ManagerPaths.Root);
        File.AppendAllText(Path.Combine(ManagerPaths.Root, "errors.log"), DateTime.Now.ToString("O") + Environment.NewLine + Error + Environment.NewLine);
    }

    private static async Task RecoverReportsAsync(RelayCoordinator Coordinator, MainForm Form, CancellationToken Cancellation)
    {
        try
        {
            var Result = await RelayOutbox.ReplayOnceAsync(Coordinator, Cancellation);
            if (Result.Recovered + Result.Failed > 0 && !Form.IsDisposed)
                Form.BeginInvoke(() => MessageBox.Show(Form, "已恢复 " + Result.Recovered + " 条本地回报\n待核对 " + Result.Failed + " 条 详情保留在发件箱和错误日志中", "联调结果恢复"));
        }
        catch (OperationCanceledException) when (Cancellation.IsCancellationRequested) { }
        catch (Exception Error) { LogError(Error); if (!Form.IsDisposed) Form.BeginInvoke(() => MessageBox.Show(Form, Error.Message, "发件箱恢复失败")); }
    }

    private static object[] DescribeLayout(Control Parent) => Parent.Controls.Cast<Control>().Select(Control => new { Type = Control.GetType().Name, Control.Text, Bounds = Control.Bounds.ToString(), Control.PreferredSize, Font = Control.Font.ToString(), Control.Visible, Children = DescribeLayout(Control) }).Cast<object>().ToArray();
}
