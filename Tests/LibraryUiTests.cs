using CodexInstanceManager;

internal static class LibraryUiTests
{
    public static int Run()
    {
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
            {
                var Settings = new ManagerSettings { DarkMode = Dark, SelectedId = "preview", InstanceList = new() { new() { Id = "preview", IsPrimary = true, Name = "预览主实例", HomePath = Root } }, Library = new() { SkillSource = Path.Combine(Root, "skills"), RuleSource = Path.Combine(Root, "global.md") } };
                using var Form = new MainForm(Settings, true);
                Form.Show();
                Form.ClientSize = new Size(Width * Form.DeviceDpi / 96, 800 * Form.DeviceDpi / 96);
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
                var RuleGrid = Descendants(Page).OfType<DataGridView>().Single(Item => Item.Columns.Contains("agent"));
                if (RuleGrid.Rows.Cast<DataGridViewRow>().Any(Row => ((RuleTarget)Row.Tag!).Format == "manual" && !Row.Cells[0].ReadOnly)) throw new Exception("Manual targets must not be writable sync choices");
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
