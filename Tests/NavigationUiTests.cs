using System.Diagnostics;
using System.Runtime.InteropServices;
using CodexInstanceManager;

internal static class NavigationUiTests
{
    public static int Run()
    {
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.ThrowException);
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "MmNavigationUi-" + Guid.NewGuid().ToString("N"));
        int Count = 0;
        try
        {
            Directory.CreateDirectory(Path.Combine(Root, "skills"));
            File.WriteAllText(Path.Combine(Root, "rules.md"), "navigation fixture");
            foreach (bool Dark in new[] { true, false })
            {
                var Settings = new ManagerSettings
                {
                    DarkMode = Dark,
                    InstanceList = new() { new() { Id = "primary", IsPrimary = true, Name = "测试主实例", HomePath = Root } },
                    Library = new() { SkillSource = Path.Combine(Root, "skills"), RuleSource = Path.Combine(Root, "rules.md") }
                };
                using var Form = new MainForm(Settings, true) { Size = new Size(1160, 800) };
                Console.WriteLine("Navigation fixture created " + Dark);
                Form.Show();
                Console.WriteLine("Navigation fixture shown");
                Application.DoEvents();
                var Navigation = Form.Controls.OfType<ThemeTabControl>().Single();
                NavigationPage Previous = Navigation.SelectedTab!;
                int Prepared = 0;
                Navigation.SelectedIndexChanged += (_, _) =>
                {
                    if (!IsWindowVisible(Navigation.Handle) || !IsWindowVisible(Previous.Handle))
                        throw new Exception("准备新页时导航和旧页的原生窗口可见性不能被重绘冻结清除");
                    if (Navigation.SelectedTab!.Visible || !Previous.Visible)
                        throw new Exception("新页准备期间必须隐藏且保留完整旧页");
                    if (Navigation.SelectedTab.Controls.Count == 0) throw new Exception("新页显示前必须完成内容创建");
                    Prepared++;
                };
                var Times = new List<double>();
                for (int Cycle = 0; Cycle < 4; Cycle++)
                foreach (var Page in Navigation.TabPages)
                {
                    if (Navigation.SelectedTab == Page) continue;
                    var Watch = Stopwatch.StartNew();

                    Navigation.SelectedTab = Page;
                    double SelectedMs = Watch.Elapsed.TotalMilliseconds;
                    Navigation.Update();
                    double UpdatedMs = Watch.Elapsed.TotalMilliseconds;
                    Application.DoEvents();
                    Watch.Stop();
                    Times.Add(Watch.Elapsed.TotalMilliseconds);
                    Console.WriteLine($"Navigation cycle={Cycle} page={Page.Text} select={SelectedMs:F1} update={UpdatedMs-SelectedMs:F1} events={Watch.Elapsed.TotalMilliseconds-UpdatedMs:F1}");
                    if (!Page.Visible || Previous.Visible || Navigation.TabPages.Count(Item => Item.Visible) != 1)
                        throw new Exception("切页后必须只显示完整目标页");
                    if (Page.Text == "Rule + Skill" && Descendants(Page).OfType<DataGridView>().Any(Grid => Grid.BackgroundColor != new AppTheme(Dark).Palette.Surface))
                        throw new Exception("列表出现默认白色首帧");
                    Previous = Page;
                    Count += 2;
                }
                if (Prepared != Times.Count || Descendants(Form).OfType<LibraryPage>().Count() != 1 || Descendants(Form).OfType<ManagerSettingsPage>().Count() != 1)
                    throw new Exception("重复切页不能反复创建页面");
                Count++;
                Navigation.SelectedTab = Navigation.TabPages[2];
                Application.DoEvents();
                using var Bitmap = new Bitmap(Form.Width, Form.Height);
                Form.DrawToBitmap(Bitmap, new Rectangle(Point.Empty, Bitmap.Size));
                Bitmap.Save(Path.Combine(AppContext.BaseDirectory, "navigation-library-" + (Dark ? "dark" : "light") + ".png"));
                Console.WriteLine($"Navigation dark={Dark} dpi={Form.DeviceDpi} switches={Times.Count} meanMs={Times.Average():F1} maxMs={Times.Max():F1}");
            }
            Console.WriteLine($"PASS navigation UI {Count} assertions");
            return 0;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("导航测试清理越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static IEnumerable<Control> Descendants(Control Root)
    {
        foreach (Control Child in Root.Controls)
        {
            yield return Child;
            foreach (var Nested in Descendants(Child)) yield return Nested;
        }
    }

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr Window);

}
