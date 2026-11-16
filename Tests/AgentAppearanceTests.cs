using System.Runtime.InteropServices;
using CodexInstanceManager;

internal static class AgentAppearanceTests
{
    public static int VerifyLive()
    {
        var TargetList = new List<(string Provider, InstanceProfile Profile, IntPtr Window)>();
        var RunningList = InstanceService.ListRunning();
        foreach (var Profile in SettingsStore.Load().InstanceList)
        {
            var Running = InstanceService.Find(Profile, RunningList);
            if (Running is { Window: not 0 }) TargetList.Add(("codex", Profile, Running.Window));
        }
        foreach (var Desktop in AgentDesktopBranding.ListRunning())
        {
            if (Desktop.WindowList.Count == 0) Console.WriteLine("SKIP no desktop window " + Desktop.Provider);
            foreach (var Window in Desktop.WindowList) TargetList.Add((Desktop.Provider, Desktop.Profile, Window));
        }
        if (TargetList.Count == 0) throw new Exception("No running agent windows to verify");
        foreach (var Target in TargetList)
        {
            var Configuration = AgentIconSettings.Load();
            var Profile = Configuration.Enabled ? Configuration.Branded(Target.Profile, Target.Provider) : Target.Profile;
            using var ExpectedIcon = new Icon(BrandingService.GetIconPath(Profile, Target.Provider), new Size(64, 64));
            using var Expected = ExpectedIcon.ToBitmap();
            bool Matched = false;
            string Detail = "未收到窗口图标";
            for (int Attempt = 0; Attempt < 10; Attempt++)
            {
                SendMessageTimeout(Target.Window, 0x007F, IntPtr.Zero, IntPtr.Zero, 2, 500, out IntPtr Handle);
                if (Handle != IntPtr.Zero)
                {
                    IntPtr Copy = CopyIcon(Handle);
                    if (Copy != IntPtr.Zero)
                    {
                        try
                        {
                            using var Borrowed = Icon.FromHandle(Copy);
                            using var Actual = Borrowed.ToBitmap();
                            Matched = SamePixels(Expected, Actual);
                            Detail = "实际图标像素与当前配置不同";
                            if (Matched) Actual.Save(Path.Combine(AppContext.BaseDirectory, "live-avatar-" + Target.Profile.Id + ".png"));
                        }
                        catch (ArgumentException Error) { Detail = "图标正在替换 " + Error.Message; }
                        finally { DestroyIcon(Copy); }
                        if (Matched) break;
                    }
                    else Detail = "窗口仍引用无效 HICON " + Handle;
                }
                Thread.Sleep(300);
            }
            if (!Matched) throw new Exception("Live window avatar mismatch " + Target.Profile.Id + " HWND=" + Target.Window + " " + Detail);
            Console.WriteLine("PASS live numbered avatar " + Target.Profile.Id);
        }
        return 0;
    }

    private static bool SamePixels(Bitmap Expected, Bitmap Actual)
    {
        if (Expected.Size != Actual.Size) return false;
        for (int Y = 0; Y < Expected.Height; Y++)
        for (int X = 0; X < Expected.Width; X++)
            if (Expected.GetPixel(X, Y) != Actual.GetPixel(X, Y)) return false;
        return true;
    }

    public static int Run()
    {
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.ThrowException);
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "MmAvatarTests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        try
        {
            string[] ProviderList = { "codex", "claude", "dsh", "antigravity", "cursor" };
            using var Preview = new Bitmap(640, 188);
            using var Canvas = Graphics.FromImage(Preview);
            Canvas.Clear(Color.FromArgb(32, 38, 45));
            for (int Index = 0; Index < ProviderList.Length; Index++)
            {
                using var First = AgentAvatars.Draw(ProviderList[Index], "1", 128, Color.Teal);
                using var Second = AgentAvatars.Draw(ProviderList[Index], "2", 128, Color.Teal);
                if (First.GetPixel(0, 0).A != 0) throw new Exception("Avatar lost transparent corner " + ProviderList[Index]);
                int Changed = 0;
                for (int Y = 0; Y < 128; Y++)
                for (int X = 0; X < 128; X++)
                {
                    if (First.GetPixel(X, Y) == Second.GetPixel(X, Y)) continue;
                    if (X < 74 || Y < 74) throw new Exception("Instance number changed the avatar face");
                    Changed++;
                }
                if (Changed < 10) throw new Exception("Instance numbers are indistinguishable");
                Canvas.DrawImageUnscaled(First, Index * 128, 0);
                using var Small = AgentAvatars.Draw(ProviderList[Index], "2", 32, Color.Teal);
                Canvas.DrawImageUnscaled(Small, Index * 128 + 48, 132);
                TextRenderer.DrawText(Canvas, ProviderList[Index], SystemFonts.MessageBoxFont, new Rectangle(Index * 128, 166, 128, 20), Color.White, TextFormatFlags.HorizontalCenter);
            }
            Preview.Save(Path.Combine(AppContext.BaseDirectory, "agent-avatar-preview.png"));
            string IconFile = Path.Combine(Root, "avatar.ico");
            using (var Avatar = AgentAvatars.Draw("codex", "1", 256, Color.Teal)) BrandingService.SaveIcon(Avatar, IconFile);
            using (var Reader = new BinaryReader(File.OpenRead(IconFile)))
            {
                if (Reader.ReadUInt16() != 0 || Reader.ReadUInt16() != 1 || Reader.ReadUInt16() != 7) throw new Exception("ICO must contain all seven Windows resolutions");
                foreach (int Size in new[] { 16, 24, 32, 48, 64, 128, 256 })
                {
                    int Width = Reader.ReadByte();
                    int Height = Reader.ReadByte();
                    if ((Width == 0 ? 256 : Width) != Size || (Height == 0 ? 256 : Height) != Size) throw new Exception("ICO size entry mismatch");
                    Reader.ReadBytes(6);
                    int Length = Reader.ReadInt32();
                    int Offset = Reader.ReadInt32();
                    long Next = Reader.BaseStream.Position;
                    Reader.BaseStream.Position = Offset;
                    using var ImageData = new MemoryStream(Reader.ReadBytes(Length));
                    using var Image = System.Drawing.Image.FromStream(ImageData);
                    if (Image.Width != Size || Image.Height != Size) throw new Exception("ICO image payload mismatch");
                    Reader.BaseStream.Position = Next;
                }
            }
            VerifyWindowOwnership(IconFile);
            VerifyButtonAnimation();
            var Custom = new AgentIconSettings { CustomPathDict = new() { ["codex"] = IconFile } };
            using (var CustomImage = Custom.Draw("codex", "3", 64, Color.Purple))
                if (CustomImage.Size != new Size(64, 64) || CustomImage.GetPixel(0, 0).A != 0) throw new Exception("Custom image preview or alpha failed");
            string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            foreach (var (PathValue, Provider) in new[]
            {
                (Path.Combine(Local, "Programs", "cursor", "Cursor.exe"), "cursor"),
                (Path.Combine(Local, "Programs", "antigravity", "Antigravity.exe"), "antigravity"),
                (Path.Combine(Local, "Programs", "DeepSeek Harness", "DeepSeek Harness.exe"), "dsh"),
                (Path.Combine(Local, "AnthropicClaude", "app-5.11492.5", "claude.exe"), "claude")
            })
            {
                if (AgentDesktopBranding.Identify(PathValue, "") != Provider) throw new Exception("Desktop provider not recognized " + Provider);
                if (AgentDesktopBranding.Identify(PathValue, "--type=renderer") is not null) throw new Exception("Renderer must not be branded");
            }
            if (AgentDesktopBranding.Identify(Path.Combine(Local, "Programs", "DeepSeek Harness", "DeepSeek Harness.exe"), "/dsh-desktop-host/lib/index.js") is not null) throw new Exception("DSH background host must not be branded");
            if (AgentDesktopBranding.Identify(Path.Combine(Local, "Programs", "antigravity", "Antigravity.exe"), "Antigravity.exe --import helper.mjs") is not null) throw new Exception("Antigravity Node host must not consume a desktop instance number");
            if (AgentDesktopBranding.Identify(Path.Combine(Local, "Claude-3p", "claude-code", "claude.exe"), "") is not null) throw new Exception("Claude CLI must not be branded");
            Console.WriteLine("PASS avatar alpha numbering ICO resolutions desktop process boundaries and window restoration");
            return 0;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("头像测试清理越界");
            Directory.Delete(Root, true);
        }
    }

    private static void VerifyWindowOwnership(string IconFile)
    {
        using var Form = new Form { Text = "Avatar ownership fixture", ShowInTaskbar = false };
        Form.CreateControl();
        IntPtr Window = Form.Handle;
        IntPtr Original = SendMessage(Window, 0x007F, IntPtr.Zero, IntPtr.Zero);
        var Profile = new InstanceProfile { Id = "avatar-fixture", Badge = "1", IconPath = IconFile };
        using (var Branding = new BrandingService())
        {
            Branding.Apply(Profile, Window, "cursor", Environment.ProcessId + 1);
            if (SendMessage(Window, 0x007F, IntPtr.Zero, IntPtr.Zero) != Original) throw new Exception("Foreign process window must remain unchanged");
            Branding.Apply(Profile, Window, "cursor", Environment.ProcessId);
            IntPtr Changed = SendMessage(Window, 0x007F, IntPtr.Zero, IntPtr.Zero);
            if (Changed == IntPtr.Zero || Changed == Original) throw new Exception("Window icon was not applied");
        }
        if (SendMessage(Window, 0x007F, IntPtr.Zero, IntPtr.Zero) != Original) throw new Exception("Original window icon was not restored");
    }

    private static void VerifyButtonAnimation()
    {
        using var Host = new Form { ShowInTaskbar = false, StartPosition = FormStartPosition.Manual, Location = new Point(-2600, -2600) };
        using var Button = new StudioButton { Text = "动效测试" };
        Host.Controls.Add(Button);
        Host.Show();
        typeof(StudioButton).GetMethod("OnMouseEnter", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!.Invoke(Button, new object[] { EventArgs.Empty });
        var Deadline = DateTime.UtcNow.AddSeconds(2);
        while (Button.IsAnimating && DateTime.UtcNow < Deadline) { Application.DoEvents(); Thread.Sleep(16); }
        if (Button.IsAnimating) throw new Exception("Button animation timer did not stop after transition");
        typeof(StudioButton).GetMethod("OnMouseLeave", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!.Invoke(Button, new object[] { EventArgs.Empty });
        Button.Hide();
        if (Button.IsAnimating) throw new Exception("Hidden button retained active animation timer");
    }

    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam);
    [DllImport("user32.dll")] private static extern IntPtr CopyIcon(IntPtr Icon);
    [DllImport("user32.dll")] private static extern bool DestroyIcon(IntPtr Icon);
    [DllImport("user32.dll")] private static extern IntPtr SendMessageTimeout(IntPtr Window, uint Message, IntPtr WParam, IntPtr LParam, uint Flags, uint Timeout, out IntPtr Result);
}
