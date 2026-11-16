using CodexInstanceManager;

internal static class LibraryUiTests
{
    public static int Run()
    {
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.ThrowException);
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "MmLibraryUi-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(Root, "skills", "example"));
        File.WriteAllText(Path.Combine(Root, "skills", "example", "SKILL.md"), "---\nname: example\ndescription: 可滚动的技能说明\n---\n");
        File.WriteAllText(Path.Combine(Root, "global.md"), "UI rule source");
        int Count = 0;
        try
        {
            foreach (bool Dark in new[] { true, false })
            foreach (int Width in new[] { 980, 1280 })
            foreach (int Height in new[] { 700, 900 })
            {
                var Settings = new ManagerSettings { DarkMode = Dark, SelectedId = "preview", InstanceList = new() { new() { Id = "preview", IsPrimary = true, Name = "预览主实例", HomePath = Root } }, Library = new() { SkillSource = Path.Combine(Root, "skills"), RuleSource = Path.Combine(Root, "global.md") } };
                using var Form = new MainForm(Settings, true);
                Form.Show();
                Form.ClientSize = new Size(Width * Form.DeviceDpi / 96, Height * Form.DeviceDpi / 96);
                Form.ShowLibraryPage();
                Application.DoEvents();
                var Page = Descendants(Form).OfType<LibraryPage>().Single();
                foreach (var Control in Descendants(Page).Where(Item => Item is Button or ComboBox or TextBox))
                {
                    if (!Control.Parent!.ClientRectangle.Contains(Control.Bounds)) throw new Exception($"Library control clipped width={Width} dark={Dark} text={Control.Text} bounds={Control.Bounds} parent={Control.Parent.ClientRectangle}");
                    Count++;
                }
                var Grid = Descendants(Page).OfType<DataGridView>().Single(Item => Item.Columns.Contains("name"));
                if (Grid.Columns.Count != 2 || Grid.Columns[1].Name != "des" || Grid.RowCount != 1) throw new Exception("Skill table must show name and des");
                Count++;
                if (Grid.CellBorderStyle != DataGridViewCellBorderStyle.Single || Grid.GridColor == new AppTheme(Dark).Palette.Border) throw new Exception("Skill columns must have visible contrasting separators");
                Count++;
                var RuleGrid = Descendants(Page).OfType<DataGridView>().Single(Item => Item.Columns.Contains("agent"));
                if (Grid.Height < 220 * Form.DeviceDpi / 96 || RuleGrid.Height < 180 * Form.DeviceDpi / 96)
                    throw new Exception($"Library reading areas collapsed width={Width} height={Height} skill={Grid.Height} rule={RuleGrid.Height}");
                var Split = Descendants(Page).OfType<SplitContainer>().Single();
                Console.WriteLine($"Library size={Width}x{Height} dpi={Page.DeviceDpi} grids={Grid.Height}/{RuleGrid.Height} split={Split.Height} minimum={Split.Panel1MinSize}/{Split.Panel2MinSize} content={Split.Parent!.Height}");
                int BeforeSkill = Grid.Height;
                int BeforeRule = RuleGrid.Height;
                Split.SplitterDistance += 20 * Form.DeviceDpi / 96;
                Application.DoEvents();
                if (Grid.Height <= BeforeSkill || RuleGrid.Height >= BeforeRule) throw new Exception("Dragging library divider must resize both reading areas");
                Count += 2;
                var Scroll = Descendants(Page).OfType<WheelScrollPanel>().Single();
                Scroll.ScrollControlIntoView(RuleGrid);
                Application.DoEvents();
                if (!Scroll.RectangleToScreen(Scroll.ClientRectangle).Contains(RuleGrid.RectangleToScreen(RuleGrid.ClientRectangle))) throw new Exception("Rule table must be fully reachable by page scrolling");
                Scroll.AutoScrollPosition = Point.Empty;
                if (Width == 1280 && Height == 900)
                {
                    using var Preview = new Bitmap(Form.Width, Form.Height);
                    Form.DrawToBitmap(Preview, new Rectangle(Point.Empty, Form.Size));
                    Preview.Save(Path.Combine(AppContext.BaseDirectory, "library-reading-" + (Dark ? "dark" : "light") + ".png"));
                }
                if (RuleGrid.Rows.Cast<DataGridViewRow>().Any(Row => ((RuleTarget)Row.Tag!).Format == "manual" && !Row.Cells[0].ReadOnly)) throw new Exception("Manual targets must not be writable sync choices");
                Count++;
                var ButtonTextList = Descendants(Page).OfType<Button>().Select(Item => Item.Text).ToList();
                if (ButtonTextList.Any(Text => Text.Contains("Git", StringComparison.OrdinalIgnoreCase) || Text.Contains("拉取") || Text.Contains("发布") || Text.Contains("仓库"))) throw new Exception("Library board must not expose Git pull publish or repository entries " + string.Join(",", ButtonTextList));
                Count++;
                var SyncAll = Descendants(Page).OfType<Button>().Single(Item => Item.Text == LibraryPage.SyncAllText);
                if (!SyncAll.Enabled || !SyncAll.Parent!.ClientRectangle.Contains(SyncAll.Bounds)) throw new Exception("Sync to all instances must be visible on the board");
                Count++;
                var PathLabels = Descendants(Page).OfType<Label>().Select(Item => Item.Text).ToList();
                if (!PathLabels.Contains(Settings.Library.SkillSource) || !PathLabels.Contains(Settings.Library.RuleSource) || !PathLabels.Contains(Path.Combine(Root, "skills"))) throw new Exception("Skill source primary root and rule file must be displayed");
                Count++;
                foreach (string ActionName in new[] { "打开维护源", "打开主实例目录", "打开文件", "打开所在目录", "查看内容", "查看 SKILL.md", "导入 Skill", "安装到主实例" })
                {
                    if (!ButtonTextList.Contains(ActionName)) throw new Exception("Library board lost action " + ActionName);
                    Count++;
                }
                var Search = Descendants(Page).OfType<TextBox>().Single(Item => Item.PlaceholderText == "搜索名称或描述");
                Search.Text = "不存在的关键字";
                if (Grid.RowCount != 0) throw new Exception("Skill search must filter rows");
                Search.Text = "滚动";
                if (Grid.RowCount != 1) throw new Exception("Skill search must match descriptions");
                Search.Text = "";
                Count++;
            }
            foreach (bool Dark in new[] { true, false })
            {
                var Plan = GlobalRules.Preview(Path.Combine(Root, "global.md"), new[] { new RuleTarget("Preview", Path.Combine(Root, "target.md"), true, "md", "test") });
                using var Dialog = new RulePreviewDialog(Plan);
                new AppTheme(Dark).Apply(Dialog);
                Dialog.Show();
                Application.DoEvents();
                var TextList = Descendants(Dialog).OfType<TextBox>().ToList();
                if (TextList.Count != 2 || TextList.Any(Item => !Item.ReadOnly) || !TextList.Any(Item => Item.Text == "UI rule source")) throw new Exception("Rule preview must expose original and incoming read-only content");
                Count++;
                foreach (var Control in Descendants(Dialog).Where(Item => Item is Button or ComboBox or TextBox))
                {
                    if (!Control.Parent!.ClientRectangle.Contains(Control.Bounds)) throw new Exception("Rule preview control clipped " + Control.Text);
                    Count++;
                }
            }
            foreach (bool Dark in new[] { true, false })
            {
                var Result = new LibrarySyncResult(Path.Combine(Root, "skills"), Path.Combine(Root, "global.md"), "all", new[]
                {
                    new LibrarySyncTargetResult("Codex · 主实例", "skill", Path.Combine(Root, "a"), "applied", Path.Combine(Root, "backup", "0")),
                    new LibrarySyncTargetResult("cursor", "skill", Path.Combine(Root, "b"), "unavailable", null, "未发现目标配置目录"),
                    new LibrarySyncTargetResult("Claude Code", "rule", Path.Combine(Root, "c"), "failed", null, "写入失败原因"),
                    new LibrarySyncTargetResult("dsh", "skill", Path.Combine(Root, "d"), "blocked", null, "前序目标写入失败 剩余目标未执行")
                });
                using var Dialog = new LibrarySyncResultDialog(Result, new AppTheme(Dark));
                new AppTheme(Dark).Apply(Dialog);
                Dialog.Show();
                Application.DoEvents();
                var Grid = Descendants(Dialog).OfType<DataGridView>().Single();
                var StatusList = Grid.Rows.Cast<DataGridViewRow>().Select(Row => Row.Cells[2].Value?.ToString()).ToList();
                if (Result.Succeeded || Grid.RowCount != 4 || !StatusList.SequenceEqual(new[] { "已写入", "跳过 · 未发现目录", "失败", "未执行 · 已阻塞" })) throw new Exception("Sync result must list each target status without folding skips or failures into success");
                if (Grid.Rows[2].Cells[5].Value?.ToString() != "写入失败原因" || Grid.Rows[0].Cells[4].Value?.ToString() != Path.Combine(Root, "backup", "0")) throw new Exception("Sync result must keep failure detail and backup path");
                if (!Descendants(Dialog).OfType<Label>().Any(Item => Item.Text == "存在失败或阻塞")) throw new Exception("Sync result must flag failures");
                Count++;
            }
            Console.WriteLine($"PASS library UI {Count} assertions");
            return 0;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("UI 测试清理越界");
            Directory.Delete(Root, true);
        }
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
