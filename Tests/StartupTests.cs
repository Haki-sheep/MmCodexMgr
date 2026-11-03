using CodexInstanceManager;
using Microsoft.Win32;

internal static class StartupTests
{
    /// <summary> 已验证断言数量 </summary>
    private static int Count;

    public static int Run(string? ImagePath = null)
    {
        ApplicationConfiguration.Initialize();
        string TestRegistryPath = @"Software\CodexInstanceManager.StartupTests-" + Guid.NewGuid().ToString("N");
        string ExecutablePath = Path.Combine(Path.GetTempPath(), "Manager With Spaces", "CodexInstanceManager.exe");
        var Startup = new StartupRegistration(ExecutablePath, TestRegistryPath);
        try
        {
            Require(!Startup.IsEnabled, "startup is disabled by default");
            using (var Missing = Registry.CurrentUser.OpenSubKey(TestRegistryPath))
                Require(Missing is null, "reading startup state does not create configuration");
            Startup.SetEnabled(true);
            using (var Key = Registry.CurrentUser.OpenSubKey(TestRegistryPath, true)!)
            {
                Require(Key.GetValue("MmCodexMgr") as string == "\"" + ExecutablePath + "\" --background", "startup quotes the full executable path and requests background mode");
                Require(Key.GetValueKind("MmCodexMgr") == RegistryValueKind.String, "startup stores a Windows Run command");
                Key.SetValue("OtherApplication", "preserve-other-startup");
            }
            Require(new StartupRegistration(ExecutablePath, TestRegistryPath).IsEnabled, "startup state survives recreating the service");
            Startup.SetEnabled(false);
            Startup.SetEnabled(false);
            Require(!Startup.IsEnabled, "disabling startup is persistent and repeatable");
            using (var Key = Registry.CurrentUser.OpenSubKey(TestRegistryPath)!)
                Require(Key.GetValue("OtherApplication") as string == "preserve-other-startup", "disabling manager startup preserves unrelated applications");
            foreach (bool DarkMode in new[] { true, false }) VerifyPage(Startup, DarkMode, ImagePath);
            Startup.SetEnabled(true);
            using (var Preview = new ManagerSettingsPage(true, Startup))
            {
                var Input = Descendants(Preview).OfType<CheckBox>().Single();
                Require(!Input.Enabled, "preview mode disables changes");
                Input.Checked = true;
                Input.Checked = false;
                Require(Startup.IsEnabled, "preview does not modify startup registration");
            }
            Console.WriteLine($"PASS manager startup {Count} assertions");
            return 0;
        }
        finally
        {
            if (!TestRegistryPath.StartsWith(@"Software\CodexInstanceManager.StartupTests-", StringComparison.Ordinal)) throw new InvalidOperationException("测试注册表清理路径越界");
            Registry.CurrentUser.DeleteSubKeyTree(TestRegistryPath, false);
        }
    }

    private static void VerifyPage(StartupRegistration Startup, bool DarkMode, string? ImagePath)
    {
        Startup.SetEnabled(false);
        using var Form = new Form { ClientSize = new Size(980, 700), Font = new Font("Microsoft YaHei UI", 10), ShowInTaskbar = false, StartPosition = FormStartPosition.Manual, Location = new Point(-2000, -2000) };
        using var Page = new ManagerSettingsPage(false, Startup);
        Form.Controls.Add(Page);
        new AppTheme(DarkMode).Apply(Form);
        Form.Show();
        Application.DoEvents();
        var Input = Descendants(Page).OfType<CheckBox>().Single();
        Require(!Input.Checked, "settings page reads the actual disabled state");
        Input.Checked = true;
        Require(Startup.IsEnabled, "settings switch enables startup immediately");
        using (var Reloaded = new ManagerSettingsPage(false, Startup))
            Require(Descendants(Reloaded).OfType<CheckBox>().Single().Checked, "reopened settings page reflects the saved registration");
        Input.Checked = false;
        Require(!Startup.IsEnabled, "settings switch removes startup immediately");
        foreach (var Control in Descendants(Page).Where(Item => Item is Label or CheckBox))
            Require(Control.Parent!.ClientRectangle.Contains(Control.Bounds), "setting control fits at minimum supported width: " + Control.Text);
        if (ImagePath is not null)
        {
            using var Bitmap = new Bitmap(Form.Width, Form.Height);
            Form.DrawToBitmap(Bitmap, new Rectangle(0, 0, Bitmap.Width, Bitmap.Height));
            Bitmap.Save(DarkMode ? ImagePath : ImagePath + ".light.png");
        }
    }

    private static IEnumerable<Control> Descendants(Control Parent)
    {
        foreach (Control Child in Parent.Controls)
        {
            yield return Child;
            foreach (var Descendant in Descendants(Child)) yield return Descendant;
        }
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED startup: " + Message);
        Count++;
    }
}
