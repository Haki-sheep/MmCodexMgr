using CodexInstanceManager;

internal static class HarnessUiTests
{
    public static int Run(string? PreviewDirectory = null)
    {
        ApplicationConfiguration.Initialize();
        int Count = 0;
        foreach (bool Dark in new[] { true, false })
        foreach (var Size in new[] { new Size(980, 700), new Size(1240, 860) })
        {
            string Root = Path.Combine(Path.GetTempPath(), "HarnessUi-" + Guid.NewGuid().ToString("N"));
            try
            {
                var Settings = new ManagerSettings { SelectedId = "preview", DarkMode = Dark, InstanceList = new() { new() { Id = "preview", Name = "预览", IsPrimary = true, HomePath = Path.Combine(Root, "codex") }, new() { Id = "second", Name = "实例2", HomePath = Path.Combine(Root, "second") } } };
                Directory.CreateDirectory(Settings.InstanceList[0].HomePath);
                new RelayCliSessionStore(Path.Combine(Root, "cursor", "sessions")).Save(new(Guid.NewGuid().ToString(), "Cursor 资源校验", Root, "test-model", "not-executed"));
                var Store = new RelayStore(Root);
                Store.SaveChannel(new() { MainInstance = Settings.InstanceList[0], WorkerInstance = Settings.InstanceList[1], MainThreadId = "main-thread", WorkerThreadId = "worker-thread", TimeoutMinutes = 0 });
                using var Cursor = new CursorRelayRunner(Path.Combine(Root, "cursor"));
                using var Coordinator = new RelayCoordinator(Store, new DesktopRelayBridge(), Cursor);
                using var Form = new MainForm(Settings, true, Store, Coordinator) { Size = Size };
                Form.Show();
                Application.DoEvents();

                var Navigation = Form.Controls.OfType<ThemeTabControl>().Single();
                Require(Navigation.TabPages.Select(Item => Item.Text).SequenceEqual(new[] { "编队", "Agent 管理", "Rule + Skill", "设置" }), "navigation exposes exactly 编队 / Agent 管理 / Rule + Skill / 设置", ref Count);
                Require(Navigation.SelectedTab == Navigation.TabPages[0] && Descendants(Navigation.TabPages[0]).OfType<FormationPage>().Single().Visible, "home page is the formation page", ref Count);
                Require(Form.Text == MainForm.AppTitle && MainForm.AppTitle == "AIMoreMoreWork", "window shows the product name", ref Count);
                Require(!Descendants(Form).Any(Item => Item.GetType().Name is "RelayPage" or "CollaborationPage" or "CodexSessionsPage" or "RelayChannelEditor"), "task board view collaboration tabs and channel editor are not part of the shell", ref Count);
                Require(!Descendants(Form).OfType<DataGridView>().Any(), "formation and agent pages render cards rather than session or task tables", ref Count);

                Form.ShowRelayPage();
                Application.DoEvents();
                Require(Navigation.SelectedTab == Navigation.TabPages[0], "legacy board entry redirects to the formation page", ref Count);

                Form.ShowHarnessPage();
                Application.DoEvents();
                var Agents = Descendants(Form).OfType<AgentPage>().Single();
                Require(Navigation.SelectedTab == Navigation.TabPages[1] && Agents.SelectedEntry?.Id == CursorRelayRunner.InstanceId, "legacy Cursor entry selects the Cursor card in Agent management", ref Count);
                var Entries = Descendants(Agents).OfType<ListBox>().Single().Items.Cast<AgentPage.AgentEntry>().Select(Item => Item.Id).ToList();
                Require(Entries.SequenceEqual(new[] { "preview", "second", CursorRelayRunner.InstanceId, DshRelayRunner.InstanceId, ClaudeRelayRunner.InstanceId, AntigravityRelayRunner.InstanceId }), "agent cards list Codex instances followed by every external executor", ref Count);
                var CursorPage = Descendants(Agents).OfType<HarnessPage>().Single();
                Require(CursorPage.Visible && Descendants(CursorPage).OfType<TextBox>().Count() == 3 && Descendants(CursorPage).OfType<Button>().Any(Item => Item.Text == "检查连接"), "Cursor detail keeps CLI path directory model and connection actions", ref Count);
                foreach (var Button in Descendants(CursorPage).OfType<Button>().Where(Item => Item.Visible))
                    Require(Button.Parent!.ClientRectangle.Contains(Button.Bounds), $"Cursor action fits dark={Dark} size={Size} button={Button.Text} bounds={Button.Bounds} parent={Button.Parent.ClientRectangle}", ref Count);

                Agents.ShowAgent(DshRelayRunner.InstanceId);
                Application.DoEvents();
                var DshPage = Descendants(Agents).OfType<DshPage>().Single();
                Require(DshPage.Visible && !CursorPage.Visible && Descendants(DshPage).OfType<Label>().Any(Item => Item.Visible && Item.Text.StartsWith("启动 DSH")), "DSH detail exposes connection controls without pretending a connection exists", ref Count);
                foreach (var Button in Descendants(DshPage).OfType<Button>())
                    Require(Button.Parent!.ClientRectangle.Contains(Button.Bounds), "DSH action fits " + Button.Text + " " + Size, ref Count);

                Agents.ShowAgent(ClaudeRelayRunner.InstanceId);
                Application.DoEvents();
                var ClaudeDetail = Descendants(Agents).OfType<ClaudePage>().Single();
                Require(ClaudeDetail.Visible && Descendants(ClaudeDetail).OfType<Button>().Any(Item => Item.Text == "打开 Claude Desktop" && !Item.Enabled) && Descendants(ClaudeDetail).OfType<Button>().Any(Item => Item.Text == "Claude Desktop 设置"), "Claude detail keeps the desktop launcher which stays disabled in preview", ref Count);

                Agents.ShowAgent(AntigravityRelayRunner.InstanceId);
                Application.DoEvents();
                Require(Descendants(Agents).OfType<AntigravityPage>().Single().Visible, "Antigravity detail is reachable from its card", ref Count);

                Agents.ShowAgent("second");
                Application.DoEvents();
                Require(Descendants(Agents).OfType<WheelScrollPanel>().Any(Item => Item.Visible && Descendants(Item).OfType<Button>().Any(Button => Button.Text == "▶ 启动 / 显示")), "Codex card shows the instance detail with launch actions", ref Count);
                Require(!Descendants(Agents).OfType<DataGridView>().Any(), "agent management never lists agent sessions", ref Count);

                if (PreviewDirectory is not null && Size.Width == 1240)
                {
                    Directory.CreateDirectory(PreviewDirectory);
                    string Suffix = Dark ? "dark" : "light";
                    Form.ShowFormationPage(); Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "formation-" + Suffix + ".png"));
                    Form.ShowAgentPage(); Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "agents-" + Suffix + ".png"));
                    Form.ShowHarnessPage(); Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "agents-cursor-" + Suffix + ".png"));
                    Form.ShowSettingsPage(); Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "settings-" + Suffix + ".png"));
                }
            }
            finally
            {
                if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("Harness 测试清理路径越界");
                if (Directory.Exists(Root)) Directory.Delete(Root, true);
            }
        }
        Console.WriteLine($"PASS app shell and agent management UI {Count} assertions");
        return 0;
    }

    private static void Require(bool Condition, string Message, ref int Count)
    {
        if (!Condition) throw new Exception("FAILED harness UI: " + Message);
        Count++;
    }

    private static void SavePreview(Form Form, string PathValue)
    {
        using var Preview = new Bitmap(Form.Width, Form.Height);
        Form.DrawToBitmap(Preview, new Rectangle(0, 0, Form.Width, Form.Height));
        Preview.Save(PathValue);
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
