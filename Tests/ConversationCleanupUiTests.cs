using System.Runtime.InteropServices;
using System.Text;
using CodexInstanceManager;

internal static class ConversationCleanupUiTests
{
    public static int Run()
    {
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "CodexCleanupUiTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        string Marker = Path.Combine(Root, "session-marker.jsonl");
        File.WriteAllText(Marker, "keep original data");
        var Profile = new InstanceProfile { Id = "target", Name = "确认框测试实例", HomePath = Root };
        var Settings = new ManagerSettings { InstanceList = new() { new() { Id = "source", Name = "其他实例", HomePath = Root + "-other" }, Profile }, SelectedId = Profile.Id };
        using var Form = new MainForm(Settings, true);
        Form.Show();
        Application.DoEvents();
        foreach (string ActionName in new[] { "保留项目清空会话", "清空所有项目和会话" })
        {
            bool Found = false;
            bool CancelIsDefault = false;
            bool TargetMatches = false;
            uint ThreadId = GetWindowThreadProcessId(Form.Handle, out uint ProcessId);
            if (ProcessId != Environment.ProcessId) throw new InvalidOperationException("confirmation fixture does not belong to test process");
            using var Timer = new System.Windows.Forms.Timer { Interval = 25 };
            Timer.Tick += (_, _) => EnumThreadWindows(ThreadId, (Window, _) =>
            {
                if (GetWindow(Window, 4) != Form.Handle || WindowText(Window) != ActionName) return true;
                Found = true;
                CancelIsDefault = (SendMessage(Window, 0x0400, IntPtr.Zero, IntPtr.Zero).ToInt64() & 0xffff) == 2;
                var TextList = new List<string>();
                EnumChildWindows(Window, (Child, _) => { TextList.Add(WindowText(Child)); return true; }, IntPtr.Zero);
                string Text = string.Join('\n', TextList);
                TargetMatches = Text.Contains(Profile.Name, StringComparison.Ordinal) && Text.Contains(Profile.HomePath, StringComparison.Ordinal) && Text.Contains("磁盘工程", StringComparison.Ordinal);
                PostMessage(Window, 0x0111, new IntPtr(2), IntPtr.Zero);
                Timer.Stop();
                return false;
            }, IntPtr.Zero);
            Timer.Start();
            Descendants(Form).OfType<Button>().Single(Button => Button.Text == ActionName).PerformClick();
            Timer.Stop();
            if (!Found || !CancelIsDefault || !TargetMatches || File.ReadAllText(Marker) != "keep original data")
                throw new InvalidOperationException($"confirmation check failed action={ActionName} found={Found} defaultCancel={CancelIsDefault} targetMatches={TargetMatches}");
        }
        Console.WriteLine("PASS cleanup UI: both buttons open target-specific confirmations with Cancel selected by default; cancellation leaves fixture data unchanged");
        return 0;
    }

    private static IEnumerable<Control> Descendants(Control Parent)
    {
        foreach (Control Child in Parent.Controls)
        {
            yield return Child;
            foreach (var Descendant in Descendants(Child)) yield return Descendant;
        }
    }

    private static string WindowText(IntPtr Window)
    {
        var Text = new StringBuilder(4096);
        GetWindowText(Window, Text, Text.Capacity);
        return Text.ToString();
    }

    private delegate bool WindowCallback(IntPtr Window, IntPtr Parameter);
    [DllImport("user32.dll")]
    private static extern bool EnumThreadWindows(uint ThreadId, WindowCallback Callback, IntPtr Parameter);
    [DllImport("user32.dll")]
    private static extern bool EnumChildWindows(IntPtr Parent, WindowCallback Callback, IntPtr Parameter);
    [DllImport("user32.dll")]
    private static extern IntPtr GetWindow(IntPtr Window, uint Command);
    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr Window, out uint ProcessId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr Window, StringBuilder Text, int Capacity);
    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam);
    [DllImport("user32.dll")]
    private static extern bool PostMessage(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam);
}
