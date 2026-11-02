using CodexInstanceManager;

internal static class HarnessUiTests
{
    public static int Run()
    {
        ApplicationConfiguration.Initialize();
        int Count = 0;
        foreach (bool Dark in new[] { true, false })
        foreach (var Size in new[] { new Size(980, 700), new Size(1080, 860) })
        {
            var Settings = new ManagerSettings { SelectedId = "preview", DarkMode = Dark, InstanceList = new() { new() { Id = "preview", Name = "预览", HomePath = Path.GetTempPath() } } };
            string Root = Path.Combine(Path.GetTempPath(), "HarnessUi-" + Guid.NewGuid().ToString("N"));
            try
            {
                var Store = new RelayStore(Root);
                using var Cursor = new CursorRelayRunner(Path.Combine(Root, "cursor"));
                using var Coordinator = new RelayCoordinator(Store, new DesktopRelayBridge(), Cursor);
                using var Form = new MainForm(Settings, true, Store, Coordinator) { Size = Size };
                Form.Show();
                Form.ShowHarnessPage();
                Application.DoEvents();
                foreach (var Button in Descendants(Form).OfType<HarnessPage>().SelectMany(Descendants).OfType<Button>())
                {
                    if (!Button.Parent!.ClientRectangle.Contains(Button.Bounds)) throw new Exception($"Harness action clipped dark={Dark} size={Size} button={Button.Text} bounds={Button.Bounds} parent={Button.Parent.ClientRectangle}");
                    Count++;
                }
                Form.ShowRelayPage();
                Application.DoEvents();
                var Cleanup = Descendants(Form).OfType<Button>().Single(Item => Item.Text == "检查并清空无效任务");
                if (!Cleanup.Parent!.ClientRectangle.Contains(Cleanup.Bounds)) throw new Exception("Activity cleanup button clipped " + Size);
                Count++;
            }
            finally
            {
                if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("Harness 测试清理路径越界");
                if (Directory.Exists(Root)) Directory.Delete(Root, true);
            }
        }
        Console.WriteLine($"PASS harness and cleanup UI {Count} layout assertions");
        return 0;
    }

    private static IEnumerable<Control> Descendants(Control Parent)
    {
        foreach (Control Child in Parent.Controls)
        {
            yield return Child;
            foreach (var Nested in Descendants(Child)) yield return Nested;
        }
    }
}
