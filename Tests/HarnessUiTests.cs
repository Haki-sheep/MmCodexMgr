using CodexInstanceManager;

internal static class HarnessUiTests
{
    public static int Run(string? PreviewDirectory = null)
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
                Settings.InstanceList[0].HomePath = Path.Combine(Root, "codex");
                Settings.InstanceList.Add(new() { Id = "second", Name = "实例2", HomePath = Path.Combine(Root, "second") });
                Directory.CreateDirectory(Settings.InstanceList[0].HomePath);
                using (var Database = new Microsoft.Data.Sqlite.SqliteConnection(new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder { DataSource = Path.Combine(Settings.InstanceList[0].HomePath, "state_5.sqlite"), Pooling = false }.ToString()))
                {
                    Database.Open();
                    using var Command = Database.CreateCommand();
                    Command.CommandText = "CREATE TABLE threads(id TEXT,title TEXT,name TEXT,project_id TEXT,cwd TEXT,archived INTEGER,updated_at INTEGER)";
                    Command.ExecuteNonQuery();
                    for (int Index = 0; Index <= RelayLimits.PageSize; Index++)
                    {
                        Command.CommandText = "INSERT INTO threads VALUES($id,$title,'',NULL,$cwd,0,$time)";
                        Command.Parameters.Clear();
                        Command.Parameters.AddWithValue("$id", "session-" + Index);
                        Command.Parameters.AddWithValue("$title", "Codex 会话 " + Index);
                        Command.Parameters.AddWithValue("$cwd", Root);
                        Command.Parameters.AddWithValue("$time", Index);
                        Command.ExecuteNonQuery();
                    }
                }
                new CursorSessionStore(Path.Combine(Root, "cursor", "sessions")).Save(new(Guid.NewGuid().ToString(), "Cursor 资源校验", Root, "test-model", "not-executed"));
                var Store = new RelayStore(Root);
                Store.SaveChannel(new() { MainInstance = Settings.InstanceList[0], WorkerInstance = Settings.InstanceList[1], MainThreadId = "main-thread", WorkerThreadId = "worker-thread", TimeoutMinutes = 0 });
                using var Cursor = new CursorRelayRunner(Path.Combine(Root, "cursor"));
                using var Coordinator = new RelayCoordinator(Store, new DesktopRelayBridge(), Cursor);
                using var Form = new MainForm(Settings, true, Store, Coordinator) { Size = Size };
                Form.Show();
                Form.ShowHarnessPage();
                Application.DoEvents();
                var CursorPage = Descendants(Form).OfType<HarnessPage>().Single();
                var CursorGrid = Descendants(CursorPage).OfType<DataGridView>().Single();
                if (CursorGrid.RowCount != 1 || CursorGrid.Rows[0].Cells[2].Value?.ToString() != "Cursor" || CursorGrid.Height < 72) throw new Exception("Cursor session list missing or clipped");
                Count++;
                var Expand = Descendants(CursorPage).OfType<Button>().Single(Item => Item.Text == "连接设置");
                Expand.PerformClick(); Application.DoEvents();
                if (CursorGrid.Height < 72) throw new Exception("Expanded settings obscured Cursor sessions " + string.Join(" | ", Descendants(CursorPage).Where(Item => Item is TableLayoutPanel or WheelScrollPanel or DataGridView).Select(Item => Item.GetType().Name + " " + Item.Bounds + " rows=" + (Item is TableLayoutPanel Table ? string.Join(",", Table.GetRowHeights()) : ""))));
                Count++;
                foreach (var Button in Descendants(Form).OfType<HarnessPage>().SelectMany(Descendants).OfType<Button>())
                {
                    if (!Button.Parent!.ClientRectangle.Contains(Button.Bounds)) throw new Exception($"Harness action clipped dark={Dark} size={Size} button={Button.Text} bounds={Button.Bounds} parent={Button.Parent.ClientRectangle}");
                    Count++;
                }
                Expand.PerformClick(); Application.DoEvents();
                Form.ShowRelayPage();
                Application.DoEvents();
                var Board = Descendants(Form).OfType<RelayPage>().Single();
                var Grid = Descendants(Board).OfType<DataGridView>().Single();
                if (Grid.Columns.Count != 5 || Grid.Columns[1].HeaderText != "协调者：会话名" || Grid.Columns[2].HeaderText != "执行者：会话名") throw new Exception("Incorrect board columns");
                Count++;
                var MenuButton = Descendants(Board).OfType<Button>().Single(Item => Item.Text == "任务看板");
                if (!MenuButton.Parent!.ClientRectangle.Contains(MenuButton.Bounds)) throw new Exception("Board menu clipped " + Size);
                Count++;
                MenuButton.PerformClick();
                Application.DoEvents();
                if (!MenuButton.ContextMenuStrip!.Visible || !MenuButton.ContextMenuStrip.Items.Cast<ToolStripItem>().Select(Item => Item.Text).SequenceEqual(new[] { "检查并清空无效任务", "清空已阻塞", "清空已结束" })) throw new Exception("Board menu lost cleanup commands");
                MenuButton.ContextMenuStrip.Close();
                Count++;
                if (Descendants(Board).OfType<RelayChannelEditor>().Any()) throw new Exception("Channel editor still on task board");
                Count++;
                var Navigation = Form.Controls.OfType<ThemeTabControl>().Single();
                if (!Navigation.TabPages.Select(Item => Item.Text).SequenceEqual(new[] { "任务看板", "实例管理", "跨 Agent 协作", "规则与技能库" })) throw new Exception("Duplicate collaboration entry or incorrect navigation order");
                Count++;
                Form.ShowCollaborationPage();
                Application.DoEvents();
                var Collaboration = Descendants(Form).OfType<CollaborationPage>().Single();
                var TimeoutInput = Descendants(Collaboration).OfType<NumericUpDown>().Single(Item => Item.Maximum == 1440);
                if (TimeoutInput.Minimum != 0 || TimeoutInput.Value != 0 || !Descendants(Collaboration).OfType<Label>().Any(Item => Item.Text.Contains("0无限"))) throw new Exception("Moved channel editor lost unlimited timeout setting");
                Count++;
                var Sources = Descendants(Collaboration).OfType<ThemeTabControl>().Single();
                if (!Sources.TabPages.Select(Item => Item.Text).SequenceEqual(new[] { "Codex", "Cursor", "DSH" })) throw new Exception("Agent sources missing");
                Count++;
                Sources.SelectedTab = Sources.TabPages[0];
                Application.DoEvents();
                if (!Descendants(Collaboration).OfType<RelayChannelEditor>().Single().Visible || !Descendants(Collaboration).OfType<CodexSessionsPage>().Single().Visible) throw new Exception("Codex source missing channel or session browser");
                Count++;
                var CodexSessions = Descendants(Collaboration).OfType<CodexSessionsPage>().Single();
                var Sessions = Descendants(CodexSessions).OfType<DataGridView>().Single();
                if (Sessions.RowCount != RelayLimits.PageSize || Sessions.Rows[0].Cells[1].Value?.ToString() != "Codex 会话 40") throw new Exception("Codex session browser did not read selected instance");
                Count++;
                Descendants(CodexSessions).OfType<Button>().Single(Item => Item.Text == "下一页").PerformClick();
                if (Sessions.RowCount != 1 || Sessions.Rows[0].Cells[1].Value?.ToString() != "Codex 会话 0") throw new Exception("Codex session pagination failed");
                Count++;
                var InstanceInput = Descendants(CodexSessions).OfType<ComboBox>().Single();
                InstanceInput.SelectedIndex = 1;
                if (Sessions.RowCount != 0) throw new Exception("Codex session browser leaked rows across instances");
                Count++;
                InstanceInput.SelectedIndex = 0;
                if (Sessions.RowCount != RelayLimits.PageSize) throw new Exception("Codex instance switch did not reset page");
                Count++;
                Settings.InstanceList.Add(new() { Id = "new", Name = "新增实例", HomePath = Path.Combine(Root, "new") });
                Sources.SelectedTab = Sources.TabPages[1]; Sources.SelectedTab = Sources.TabPages[0]; Application.DoEvents();
                if (InstanceInput.Items.Count != 3) throw new Exception("New registered instance missing from existing collaboration page");
                Count++;
                foreach (var Button in Descendants(Collaboration).OfType<Button>().Where(Item => Item.Visible))
                {
                    if (!Button.Parent!.ClientRectangle.Contains(Button.Bounds)) throw new Exception($"Collaboration action clipped dark={Dark} size={Size} button={Button.Text} bounds={Button.Bounds} parent={Button.Parent.ClientRectangle}");
                    Count++;
                }
                Sources.SelectedTab = Sources.TabPages[2];
                Application.DoEvents();
                if (!Descendants(Collaboration).OfType<Label>().Any(Item => Item.Visible && Item.Text.StartsWith("尚未接入"))) throw new Exception("DSH falsely presented as connected");
                Count++;
                Store.Save(new RelayTask { RequestKey = "cursor-row", Title = "Codex 到 Cursor", Channel = new() { MainInstance = Settings.InstanceList[0], WorkerInstance = new() { Id = "cursor", Name = "grok-model" }, MainTitle = "协调会话", WorkerTitle = "执行会话" }, State = eRelayState.Accepted });
                Settings.InstanceList[0].Name = "实例1";
                Form.ShowRelayPage();
                Application.DoEvents();
                if (Grid.Rows[0].Cells[1].Value?.ToString() != "实例1：协调会话" || Grid.Rows[0].Cells[2].Value?.ToString() != "Cursor：执行会话") throw new Exception("Board must show current instance name and Cursor rather than model");
                Count++;
                Store.Save(new RelayTask { RequestKey = "dsh-row", Title = "DSH 记录", Channel = new() { MainInstance = new() { Id = "removed", Name = "历史实例" }, WorkerInstance = new() { Id = "dsh", Name = "deepseek-model" }, MainThreadId = "main-id", WorkerThreadId = "worker-id" }, State = eRelayState.Cancelled });
                Form.Hide(); Form.Show(); Application.DoEvents();
                if (Grid.Rows[0].Cells[1].Value?.ToString() != "历史实例：main-id" || Grid.Rows[0].Cells[2].Value?.ToString() != "DSH：worker-id") throw new Exception("History or empty session titles lost identity");
                Count++;
                var Parent = Store.TreePage(null).First();
                Store.Save(new RelayTask { RequestKey = "child-row", Title = "下级任务", ParentTaskId = Parent.Id, Channel = new() { MainInstance = Settings.InstanceList[0], WorkerInstance = CursorRelayRunner.Profile, MainTitle = "下级协调", WorkerTitle = "下级执行" }, State = eRelayState.Accepted });
                Form.Hide(); Form.Show(); Application.DoEvents();
                typeof(DataGridView).GetMethod("OnCellContentClick", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.Invoke(Grid, new object[] { new DataGridViewCellEventArgs(0, 0) });
                if (Grid.RowCount != 3 || Grid.Rows[1].Cells[2].Value?.ToString() != "Cursor：下级执行") throw new Exception("Task expansion lost nested source identity");
                Count++;
                if (PreviewDirectory is not null && Dark && Size.Width == 1080)
                {
                    Directory.CreateDirectory(PreviewDirectory);
                    SavePreview(Form, Path.Combine(PreviewDirectory, "task-board-preview.png"));
                    Form.ShowCollaborationPage(); Sources.SelectedTab = Sources.TabPages[0]; Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "collaboration-codex-preview.png"));
                    Form.ShowHarnessPage(); Application.DoEvents();
                    SavePreview(Form, Path.Combine(PreviewDirectory, "collaboration-cursor-preview.png"));
                }

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
