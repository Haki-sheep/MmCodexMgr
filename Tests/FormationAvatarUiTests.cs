using System.Runtime.ExceptionServices;
using System.Runtime.InteropServices;
using CodexInstanceManager;

internal static class FormationAvatarUiTests
{
    private const uint ChangeUiState = 0x0127;
    private const uint MouseMove = 0x0200;
    private const uint MouseLeave = 0x02A3;
    private static int Count;

    public static int Run()
    {
        ApplicationConfiguration.Initialize();
        string root = Path.Combine(Path.GetTempPath(), "MmFormationAvatarUi-" + Guid.NewGuid().ToString("N"));
        try
        {
            string primary = Directory.CreateDirectory(Path.Combine(root, "primary")).FullName;
            string secondary = Directory.CreateDirectory(Path.Combine(root, "secondary")).FullName;
            File.WriteAllText(Path.Combine(primary, "config.toml"), """model = "fixture-default" """);
            File.WriteAllText(Path.Combine(primary, "models_cache.json"), """{"models":[{"slug":"fixture-main"},{"slug":"fixture-hidden","visibility":"hide"}]}""");
            File.WriteAllText(Path.Combine(secondary, "config.toml"), """model_catalog_json = "custom-catalog.json" """);
            File.WriteAllText(Path.Combine(secondary, "custom-catalog.json"), """{"models":[{"slug":"fixture-secondary"}]}""");
            File.WriteAllText(Path.Combine(secondary, "models_cache.json"), """{"models":[{"slug":"fixture-stale"}]}""");
            foreach (bool Dark in new[] { true, false }) Verify(Dark, primary, secondary);
        }
        finally
        {
            if (!ManagerPaths.IsUnder(root, Path.GetTempPath())) throw new IOException("头像 UI 测试清理越界");
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
        Console.WriteLine($"PASS formation avatar UI {Count} assertions");
        return 0;
    }

    private static void Verify(bool Dark, string Primary, string Secondary)
    {
        var Settings = new ManagerSettings
        {
            InstanceList =
            {
                new() { Id = "primary", Name = "主实例", IsPrimary = true, Badge = "1", ColorHex = "#159C86", HomePath = Primary },
                new() { Id = "second", Name = "执行实例", Badge = "2", HomePath = Secondary }
            }
        };
        var Theme = new AppTheme(Dark);
        string Variant = Dark ? "dark" : "light";
        Task<IReadOnlyList<AgentProject>> LoadProjects(string AgentId, CancellationToken Cancellation) =>
            Task.FromResult<IReadOnlyList<AgentProject>>(new[] { new AgentProject(AgentId + "-workspace", AgentId + " 试验工作区", Secondary, false) });
        using var Form = new FormationCreateDialog(Settings, Theme, Array.Empty<FormationTemplate>(), new() { "model-a", "model-b" },
            _ => throw new InvalidOperationException("测试未发送模板保存请求"),
            _ => throw new InvalidOperationException("测试未发送模板删除请求"), LoadProjects)
        {
            StartPosition = FormStartPosition.CenterScreen,
            TopMost = true
        };
        Theme.Apply(Form);
        Form.Show();
        Application.DoEvents();

        var Seats = AllControls(Form).OfType<Button>().Where(Item => Item.Name.StartsWith("FormationSeat", StringComparison.Ordinal)).ToList();
        var Create = Find<Button>(Form, "FormationSetupCreate");
        Require(Seats.Count == 10 && Seats.Count(Item => Item.Name.StartsWith("FormationSeatExecutor", StringComparison.Ordinal)) == 4,
            "seat controls include two candidates each for reviewers and outsiders");
        Require(Seats.All(Item => Item.AccessibleName?.StartsWith("选择", StringComparison.Ordinal) == true) && !Create.Enabled,
            "every seat begins empty and creation requires a coordinator and an executor");
        var ProblemInput = Find<TextBox>(Form, "FormationProblem");
        Require(AllControls(Form).OfType<TextBox>().Single() == ProblemInput && ProblemInput.Text.Length == 0,
            "setup dialog exposes one empty problem field");
        Require(AllControls(Form).OfType<ComboBox>().Count() == 10 &&
            AllControls(Form).OfType<ComboBox>().Where(Item => Item.Name.StartsWith("FormationEffort")).All(Item => Item.Items.Cast<object>().Select(Option => Option.ToString()).SequenceEqual(new[] { "低", "中", "高", "极高", "ultra" })),
            "all five roles expose a proposed effort and an independent budget selector");
        Require(AllControls(Form).OfType<ComboBox>().Where(Item => Item.Name.StartsWith("FormationBudget"))
            .All(Item => Item.Items.Cast<int>().SequenceEqual(new[] { 1, 2, 3, 4 })), "every role offers the same four budget values");
        Require(new[] { "Coordinator", "Executor", "Learner" }.Select(Role => (int)Find<ComboBox>(Form, "FormationBudget" + Role).SelectedItem!).SequenceEqual(new[] { 3, 2, 1 }), "native budgets default to 3, 2, 1");
        Require(AllControls(Find<Panel>(Form, "FormationCoordinatorGroup")).Count(Item => Item.Name is "FormationRoleCoordinator" or "FormationRoleReviewer" or "FormationRoleOutsider") == 3, "coordinator review and outsider share one group");
        SaveImage(Form, $"formation-avatar-empty-{Variant}.png");
        VerifyNativeRepaint(Form, Seats, Theme, Variant);

        Edit(Form, "Reviewer1", Picker =>
        {
            var Model = Find<ComboBox>(Picker, "FormationSeatModel");
            Require(!Model.Enabled && Find<Label>(Picker, "FormationFixedModel").Text == "待选统筹", "reviewer defaults to following an unset coordinator");
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Edit(Form, "Coordinator1", Picker =>
        {
            var Model = Find<ComboBox>(Picker, "FormationSeatModel");
            Require(Model.Text == "沿用默认 · fixture-default" &&
                Model.Items.Cast<string>().SequenceEqual(new[] { "沿用默认 · fixture-default", "fixture-main" }),
                "picker shows the current Codex model and visible cached models");
            Find<Button>(Picker, "FormationAgentsecond").PerformClick();
            Require(Model.Items.Cast<string>().SequenceEqual(new[] { "沿用 Agent 默认模型", "fixture-secondary" }),
                "custom catalog overrides a stale cache and other instances' models");
            Find<Button>(Picker, "FormationAgentprimary").PerformClick();
            Model.Text = "model-a";
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Require(!Create.Enabled, "a coordinator and optional role still require an executor");
        Edit(Form, "Outsider1", Picker =>
        {
            Require(Find<Label>(Picker, "FormationFixedModel").Text == "model-a", "outsider follows coordinator by default");
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });

        for (int index = 1; index <= 4; index++)
        {
            Select(Form, $"Executor{index}", index % 2 == 0 ? "second" : "primary", $"exec-model-{index}");
        }
        Require(!Create.Enabled && Find<Label>(Form, "FormationCountExecutor").Text == "×4", "configured seats still require a problem before creation");
        ProblemInput.Text = "  排查侧栏切页空白  ";
        Require(Create.Enabled, "entering a problem enables creation");
        Edit(Form, "Executor2", Picker =>
        {
            Find<ComboBox>(Picker, "FormationSeatModel").Text = "exec-model-1";
            var Count = Find<Label>(Picker, "FormationModelCount");
            Require(Count.Visible && Count.Text == "×1", "picker shows how many seats already use the currently selected model");
            if (Dark) SaveImage(Picker, "formation-avatar-model-dark.png");
            ((Button)Picker.CancelButton!).PerformClick();
        });
        Edit(Form, "Executor3", Picker => Find<Button>(Picker, "FormationSeatRemove").PerformClick());
        Require(Find<Label>(Form, "FormationCountExecutor").Text == "×3" && Find<Button>(Form, "FormationSeatExecutor3").AccessibleName?.StartsWith("选择") == true,
            "removing an executor empties that position and updates the count");
        Select(Form, "Executor3", "primary", "exec-model-3");
        Edit(Form, "Learner1", Picker =>
        {
            Find<Button>(Picker, "FormationAgent" + ClaudeRelayRunner.InstanceId).PerformClick();
            Require(Find<TextBox>(Picker, "FormationSeatFolder").Visible && !Find<ComboBox>(Picker, "FormationSeatWorkspace").Visible,
                "Claude configures a folder instead of a registered project");
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
            Require(Picker.Visible && Find<Label>(Picker, "FormationWorkspaceStatus").Text.Contains("需要工作目录"),
                "a required folder is checked before the seat dialog closes");
            Find<TextBox>(Picker, "FormationSeatFolder").Text = Secondary;
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Edit(Form, "Learner1", Picker =>
        {
            Require(Find<TextBox>(Picker, "FormationSeatFolder").Text == Secondary, "folder persists when reopening the same seat");
            Find<Button>(Picker, "FormationAgent" + DshRelayRunner.InstanceId).PerformClick();
            Require(!Find<ComboBox>(Picker, "FormationSeatModel").Enabled &&
                AllControls(Picker).OfType<Label>().Any(Item => Item.Text.Contains("模型和推理强度沿用 Agent 自身配置")),
                "unsupported model and reasoning settings are explained in the picker");
            SelectWorkspace(Picker, DshRelayRunner.InstanceId);
            var Agent = Find<Button>(Picker, "FormationAgent" + AntigravityRelayRunner.InstanceId);
            Require(Picker.ClientRectangle.Contains(Picker.RectangleToClient(Agent.RectangleToScreen(Agent.ClientRectangle))) &&
                Agent.Parent!.Parent!.ClientRectangle.Contains(Agent.Parent.Bounds), "external Agent choices fit in the first row at current DPI");
            if (Dark) SaveImage(Picker, "formation-avatar-picker-dark.png");
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Require(Find<ComboBox>(Form, "FormationEffortLearner").Enabled && Find<ComboBox>(Form, "FormationBudgetLearner").Enabled,
            "external seats retain independently selectable preferences");

        Find<ComboBox>(Form, "FormationEffortCoordinator").SelectedIndex = 2;
        Find<ComboBox>(Form, "FormationEffortExecutor").SelectedIndex = 3;
        Require(!Find<ComboBox>(Form, "FormationEffortReviewer").Enabled && !Find<ComboBox>(Form, "FormationEffortOutsider").Enabled,
            "native followers inherit coordinator reasoning by default");
        var CoordinatorBudget = Find<ComboBox>(Form, "FormationBudgetCoordinator");
        (int Budget, int Reviewers, int Outsiders)[] Allocations = [(1, 1, 0), (2, 1, 1), (3, 2, 1), (4, 2, 2)];
        foreach (var Expected in Allocations)
        {
            CoordinatorBudget.SelectedItem = Expected.Budget;
            Require(Find<Label>(Form, "FormationCountReviewer").Text == "×" + Expected.Reviewers &&
                Find<Label>(Form, "FormationCountOutsider").Text == "×" + Expected.Outsiders,
                "coordinator budget allocates the expected number of review and outsider seats");
        }
        Find<ComboBox>(Form, "FormationBudgetExecutor").SelectedItem = 1;
        Find<ComboBox>(Form, "FormationBudgetReviewer").SelectedItem = 2;
        Find<ComboBox>(Form, "FormationBudgetOutsider").SelectedItem = 3;
        Select(Form, "Coordinator1", "second", "model-b");
        Edit(Form, "Coordinator1", Picker =>
        {
            SelectWorkspace(Picker, "second");
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Require(Find<Button>(Form, "FormationSeatReviewer1").AccessibleName?.Contains("model-b") == true &&
            Find<Button>(Form, "FormationSeatOutsider1").AccessibleName?.Contains("model-b") == true, "changing the coordinator updates both followers before submission");
        Edit(Form, "Reviewer1", Picker =>
        {
            Require(Find<Label>(Picker, "FormationInheritedWorkspace").Text == "沿用统筹工作区" &&
                !Find<ComboBox>(Picker, "FormationSeatWorkspace").Visible, "native seats follow the coordinator workspace");
            Require(Find<ComboBox>(Picker, "FormationDispatchMode").SelectedIndex == 0 && !Find<Button>(Picker, "FormationAgentprimary").Enabled,
                "native mode stays on the actual coordinator host");
            Find<Button>(Picker, "FormationAgentsecond").PerformClick();
            Find<ComboBox>(Picker, "FormationSeatModel").Text = "review-override";
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        Find<ComboBox>(Form, "FormationEffortReviewer").SelectedIndex = 4;
        Edit(Form, "Outsider1", Picker =>
        {
            Find<ComboBox>(Picker, "FormationDispatchMode").SelectedIndex = 1;
            Require(Find<Button>(Picker, "FormationAgent" + DshRelayRunner.InstanceId).Enabled, "explicit session mode allows other Agents");
            Find<ComboBox>(Picker, "FormationDispatchMode").SelectedIndex = 0;
            Find<Button>(Picker, "FormationAgentFollow").PerformClick();
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });
        SaveImage(Form, $"formation-avatar-selected-{Variant}.png");
        Create.PerformClick();

        var Request = Form.Request;
        var Members = Request.MemberList;
        Require(Form.DialogResult == DialogResult.OK && !Request.SetupOnly && Form.ActivateAfterCreate && Request.Theme == "排查侧栏切页空白" &&
            Request.Requirement == Request.Theme && Request.Context == "" && Request.MaxParallel == 4,
            "the same trimmed problem names the formation and starts the coordinator with a requirement");
        var Controller = Members.Single(Item => Item.Role == eFormationRole.Coordinator);
        var Review = Members.First(Item => Item.Role == eFormationRole.Reviewer);
        var Outsider = Members.First(Item => Item.Role == eFormationRole.Outsider);
        Require(Review.InstanceId == Controller.InstanceId && Outsider.InstanceId == Controller.InstanceId &&
            Review.Model == "review-override" && Outsider.Model == Controller.Model && Controller.InstanceId == "second" && Controller.Model == "model-b",
            "native override and inherited model preserve coordinator host");
        Require(Controller.Effort == "high" && Review.Effort == "ultra" && Outsider.Effort == "high", "native override effort and follower effort are distinct");
        Require(Controller.Project == "second-workspace" && Review.Project.Length == 0 && Outsider.Project.Length == 0 &&
            Members.Single(Item => Item.Role == eFormationRole.Learner) is { Project: "dsh-workspace", Cwd.Length: 0 },
            "workspace selection persists the IDs for the respective desktop agents");
        Require(Review.DispatchMode == eFormationDispatchMode.Native && !Review.FollowCoordinator && Outsider.DispatchMode == eFormationDispatchMode.Native &&
            Outsider.FollowCoordinator && Controller.SubagentMax == 4 && Review.SubagentMax == 2 && Outsider.SubagentMax == 3 &&
            Members.Count(Item => Item.Role == eFormationRole.Reviewer) == 2 && Members.Count(Item => Item.Role == eFormationRole.Outsider) == 2,
            "both native roles persist their configured independent limits and two members each");
        var ExecutorList = Members.Where(Item => Item.Role == eFormationRole.Executor).ToList();
        Require(ExecutorList.Count == 4 && ExecutorList.All(Item => Item.Effort == "xhigh" && Item.SubagentMax == 1) && ExecutorList.Select(Item => Item.Model).Distinct().Count() == 4,
            "executors use independent models and the same role effort");
        Require(Members.Single(Item => Item.Role == eFormationRole.Learner) is { Effort: "medium", SubagentMax: 1 },
            "external learner preferences persist for the coordinator plan");
    }

    private static void SelectWorkspace(Form Picker, string AgentId)
    {
        var Input = Find<ComboBox>(Picker, "FormationSeatWorkspace");
        var Deadline = DateTime.UtcNow.AddSeconds(3);
        while (Input.Items.Count < 2 && DateTime.UtcNow < Deadline)
        {
            Application.DoEvents();
            Thread.Sleep(10);
        }
        string Label = AgentId + " 试验工作区 · ";
        Input.SelectedItem = Input.Items.Cast<object>().Single(Item => Item.ToString()?.StartsWith(Label, StringComparison.Ordinal) == true);
    }

    private static void Select(FormationCreateDialog Owner, string Seat, string Target, string Model)
        => Edit(Owner, Seat, Picker =>
        {
            Find<Button>(Picker, "FormationAgent" + Target).PerformClick();
            Find<ComboBox>(Picker, "FormationSeatModel").Text = Model;
            Find<Button>(Picker, "FormationSeatConfirm").PerformClick();
        });

    private static void Edit(FormationCreateDialog Owner, string Seat, Action<Form> Choose)
    {
        ExceptionDispatchInfo? Error = null;
        Owner.BeginInvoke((MethodInvoker)(() =>
        {
            var Picker = Application.OpenForms.Cast<Form>().Single(Item => Item != Owner);
            try { Choose(Picker); }
            catch (Exception Failure)
            {
                Error = ExceptionDispatchInfo.Capture(Failure);
                Picker.DialogResult = DialogResult.Cancel;
            }
        }));
        Find<Button>(Owner, "FormationSeat" + Seat).PerformClick();
        Error?.Throw();
    }

    private static void SaveImage(Form Form, string Name)
    {
        Application.DoEvents();
        using var Image = new Bitmap(Form.Width, Form.Height);
        Form.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
        Image.Save(Path.Combine(AppContext.BaseDirectory, Name));
    }

    private static void VerifyNativeRepaint(FormationCreateDialog Form, List<Button> Seats, AppTheme Theme, string Variant)
    {
        Edit(Form, "Coordinator1", Picker => ((Button)Picker.CancelButton!).PerformClick());
        Form.Activate();
        Theme.SetDark(!Theme.IsDark);
        Theme.Apply(Form);
        Application.DoEvents();
        RepaintSeats(Form, Seats);
        Theme.SetDark(!Theme.IsDark);
        Theme.Apply(Form);
        Application.DoEvents();
        RepaintSeats(Form, Seats);
        Application.DoEvents();
        using var Image = CaptureClient(Form);
        Image.Save(Path.Combine(AppContext.BaseDirectory, $"formation-avatar-native-{Variant}.png"));
        int violations = 0;
        foreach (var Seat in Seats)
        {
            var origin = Form.PointToClient(Seat.PointToScreen(Point.Empty));
            float radius = Seat.Width / 2f;
            for (int y = 1; y < Seat.Height - 1; y++)
            for (int x = 1; x < Seat.Width - 1; x++)
            {
                float dx = x - radius + .5f;
                float dy = y - radius + .5f;
                if (dx * dx + dy * dy > radius * radius && Image.GetPixel(origin.X + x, origin.Y + y).ToArgb() != Theme.Palette.Background.ToArgb())
                    violations++;
            }
        }
        Require(violations == 0, $"local repaint keeps pixels beyond each avatar circle clean at {Form.DeviceDpi} DPI ({violations} foreign pixels)");
    }

    private static Bitmap CaptureClient(Form Form)
    {
        Marshal.ThrowExceptionForHR(DwmFlush());
        var Corners = new[] { new Point(12, 12), new Point(Form.ClientSize.Width - 12, 12),
            new Point(12, Form.ClientSize.Height - 12), new Point(Form.ClientSize.Width - 12, Form.ClientSize.Height - 12) };
        if (Corners.Any(Point => GetAncestor(WindowFromPoint(Form.PointToScreen(Point)), 2) != Form.Handle))
            throw new InvalidOperationException("重绘测试窗口被遮挡 无法截取测试客户端");
        var Image = new Bitmap(Form.ClientSize.Width, Form.ClientSize.Height);
        try
        {
            using var Canvas = Graphics.FromImage(Image);
            Canvas.CopyFromScreen(Form.PointToScreen(Point.Empty), Point.Empty, Image.Size);
            return Image;
        }
        catch
        {
            Image.Dispose();
            throw;
        }
    }

    private static void RepaintSeats(Form Form, List<Button> Seats)
    {
        SendMessage(Form.Handle, ChangeUiState, new IntPtr(0x00010002), IntPtr.Zero);
        foreach (var Seat in Seats)
        {
            Require(Seat.Focus(), "avatar can receive actual keyboard focus");
            SendMessage(Seat.Handle, MouseMove, IntPtr.Zero, new IntPtr(Seat.Height / 2 << 16 | Seat.Width / 2));
            Seat.Update();
            Seat.Invalidate(new Rectangle(0, 0, Seat.Width, Seat.Height / 2));
            Require(GetUpdateRect(Seat.Handle, out var Update, false) && Update.Bottom == Seat.Height / 2, "avatar receives a partial native damage rectangle");
            Seat.Update();
            SendMessage(Seat.Handle, MouseLeave, IntPtr.Zero, IntPtr.Zero);
            Seat.Update();
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    private readonly struct NativeRect
    {
        public readonly int Left, Top, Right, Bottom;
    }

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr Handle, uint Message, IntPtr WParam, IntPtr LParam);

    [DllImport("user32.dll")]
    private static extern bool GetUpdateRect(IntPtr Handle, out NativeRect Rect, bool Erase);

    [DllImport("dwmapi.dll")]
    private static extern int DwmFlush();

    [DllImport("user32.dll")]
    private static extern IntPtr WindowFromPoint(Point Point);

    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr Handle, uint Flags);

    private static T Find<T>(Control Parent, string Name) where T : Control
        => AllControls(Parent).OfType<T>().Single(Item => Item.Name == Name);

    private static IEnumerable<Control> AllControls(Control Parent)
    {
        foreach (Control Child in Parent.Controls)
        {
            yield return Child;
            foreach (var Nested in AllControls(Child)) yield return Nested;
        }
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException("FAILED formation avatar UI: " + Message);
        Count++;
    }
}
