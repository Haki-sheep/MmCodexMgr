using System.Text.Json;
using CodexInstanceManager;

internal static class FormationUiTests
{
    private static readonly JsonSerializerOptions WireOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
    private static int Count;

    public static int Run()
    {
        ApplicationConfiguration.Initialize();
        string Root = Path.Combine(Path.GetTempPath(), "MmFormationUi-" + Guid.NewGuid().ToString("N"));
        try
        {
            using var Dispatcher = new Control();
            _ = Dispatcher.Handle;
            Exception? Failure = null;
            Dispatcher.BeginInvoke(() =>
            {
                try { foreach (bool Dark in new[] { true, false }) Verify(Root, Dark); }
                catch (Exception Error) { Failure = Error; }
                finally { Application.ExitThread(); }
            });
            Application.Run();
            if (Failure is not null) System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(Failure).Throw();
            Console.WriteLine($"PASS formation UI {Count} assertions");
            return 0;
        }
        finally
        {
            if (!ManagerPaths.IsUnder(Root, Path.GetTempPath())) throw new IOException("编队 UI 测试清理越界");
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    private static void Verify(string Root, bool Dark)
    {
        string Case = Path.Combine(Root, Dark ? "dark" : "light");
        Directory.CreateDirectory(Case);
        var Settings = new ManagerSettings
        {
            SelectedId = "primary",
            DarkMode = Dark,
            InstanceList = new()
            {
                new() { Id = "primary", Name = "主实例", IsPrimary = true, HomePath = Path.Combine(Case, "primary") },
                new() { Id = "second", Name = "执行实例", HomePath = Path.Combine(Case, "second") }
            }
        };
        var Store = new FormationStore(Path.Combine(Case, "formation"));
        var Service = new FormationService(Store, Settings);
        var MemberList = new List<FormationMember>
        {
            new() { Role = eFormationRole.Coordinator, InstanceId = "primary", Model = "gpt-5.5", Effort = "high" },
            new() { Role = eFormationRole.Executor, InstanceId = "second", Model = "custom-model-id" },
            new() { Role = eFormationRole.Executor, InstanceId = CursorRelayRunner.InstanceId, Model = "cursor-model", Cwd = Case },
            new() { Role = eFormationRole.Reviewer, InstanceId = ClaudeRelayRunner.InstanceId },
            new() { Role = eFormationRole.Outsider, InstanceId = DshRelayRunner.InstanceId }
        };
        Execute(Service, "create", new { operation_id = "ui-create", formation = new FormationCreate { Theme = "界面编队", Requirement = "验证卡片绑定真实编队", MaxParallel = 2, MemberList = MemberList } });
        Execute(Service, "template-save", new { operation_id = "ui-template", template = new FormationTemplate { Name = "一统筹两执行", MaxParallel = 2, MemberList = MemberList } });
        var Run = Store.List().Single();
        VerifyCompactCard(Settings, Dark);

        using (var Form = new MainForm(Settings, true, null, null, Service, Store) { Size = new Size(1240, 860) })
        {
            Form.Show();
            Application.DoEvents();
            var Page = Descendants(Form).OfType<FormationPage>().Single();
            var Card = Page.Cards.Single();
            Application.DoEvents();
            int Layouts = 0;
            Card.Parent!.Layout += (_, _) => Layouts++;
            int Repaints = 0;
            Card.Invalidated += (_, _) => Repaints++;
            var RefreshList = Enumerable.Range(0, 50).Select(_ => Page.ReloadAsync()).ToArray();
            Wait(() => RefreshList.All(Task => Task.IsCompletedSuccessfully), "unchanged refresh burst");
            Require(ReferenceEquals(Card, Page.Cards.Single()) && !Card.IsDisposed, "unchanged refresh retains cards and their native controls");
            Require(RefreshList.All(Task => ReferenceEquals(Task, RefreshList[0])) && Layouts == 0 && Repaints == 0,
                "unchanged refresh burst coalesces and avoids card layout or paint");
            Require(Page.Visible && Card.Run.Id == Run.Id, "home page renders the persisted formation");
            Require(Card.ActionButton(FormationCard.ContextAction) is null, "business requirements are discussed in the coordinator chat");
            Require(Card.Board.Members.Select(Item => Item.Id).SequenceEqual(Run.MemberList.Select(Item => Item.Id)), "seat board binds every persisted seat");
            Require(Card.Board.Members.Count(Item => Item.Role == eFormationRole.Executor) == 2 && Card.Board.Members.Single(Item => Item.Role == eFormationRole.Outsider).InstanceId == DshRelayRunner.InstanceId, "fixed roles keep multiple executors and a standby outsider");
            Require(Page.Templates.Count == 1 && Page.Templates[0].MemberList.Count == MemberList.Count, "saved templates are read from the store");
            Require(!Page.CanWrite && Card.ActionButton(FormationCard.ActivateAction)?.Enabled == false && Card.ActionButton(FormationCard.PauseAction)?.Enabled == false && Card.ActionButton(FormationCard.DetailAction)?.Enabled == true, "preview mode keeps formations read-only");
            Require(!Descendants(Page).OfType<Button>().Single(Item => Item.Name == "FormationCreate").Enabled, "preview mode cannot create formations");
            Require(!Descendants(Form).OfType<DataGridView>().Any(), "formations render as cards without a task table");
            Require(Card.Board.Bottom <= Card.Height && Card.ClientRectangle.Contains(Card.Board.Bounds), "compact seat roster fits inside the card");
            Require(Descendants(Form).OfType<FormationHero>().Single().Height >= 150, "selected background artwork is shown as the home hero");
            using var Image = new Bitmap(Form.Width, Form.Height);
            Form.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
            Image.Save(Path.Combine(AppContext.BaseDirectory, Dark ? "formation-ui-dark.png" : "formation-ui-light.png"));
            Form.ShowSettingsPage();
            Application.DoEvents();
            Require(Descendants(Form).OfType<AgentIconSettingsCard>().Count() == 1 &&
                Descendants(Form).OfType<Button>().Any(Item => Item.Name == "ApplyAgentIcons" && !Item.Enabled), "settings contains explicit icon management and preview cannot apply it");
            using var SettingsImage = new Bitmap(Form.Width, Form.Height);
            Form.DrawToBitmap(SettingsImage, new Rectangle(Point.Empty, SettingsImage.Size));
            SettingsImage.Save(Path.Combine(AppContext.BaseDirectory, Dark ? "settings-ui-dark.png" : "settings-ui-light.png"));
        }

        using (var Host = new Form { ClientSize = new Size(1200, 820), ShowInTaskbar = false, StartPosition = FormStartPosition.Manual, Location = new Point(-2600, -2600) })
        {
            var Theme = new AppTheme(Dark);
            var Writable = new FormationPage(Settings, Service, Store, Theme, false);
            Host.Controls.Add(Writable);
            Theme.Apply(Host);
            Host.Show();
            Wait(() => Writable.Cards.Count == 1, "initial background refresh");
            Require(Writable.CanWrite && Descendants(Writable).OfType<Button>().Single(Item => Item.Name == "FormationCreate").Enabled, "connected page enables creation");
            var Original = Writable.Cards.Single();
            var Seat = Original.Board.Controls.OfType<Button>().First();
            var DetailButton = Original.ActionButton(FormationCard.DetailAction);
            VerifyRefreshDuringStoreLock(Writable, Path.Combine(Case, "formation"), Original);
            Writable.Cards.Single().ActionButton(FormationCard.PauseAction)!.PerformClick();
            Wait(() => Store.Get(Run.Id).State == eFormationState.Paused, "pause");
            Wait(() => Writable.Cards.SingleOrDefault()?.Run.State == eFormationState.Paused, "pause refresh");
            Require(ReferenceEquals(Original, Writable.Cards.Single()) && ReferenceEquals(Seat, Original.Board.Controls.OfType<Button>().First())
                && ReferenceEquals(DetailButton, Original.ActionButton(FormationCard.DetailAction)),
                "a changed formation keeps its existing card, seats and unchanged buttons");
            if (SystemInformation.IsMenuAnimationEnabled)
            {
                var Clock = System.Diagnostics.Stopwatch.StartNew();
                Wait(() => Clock.ElapsedMilliseconds >= 65, "card transition intermediate frame");
                Color Highlight = ReadHeaderPixel(Original);
                Wait(() => Clock.ElapsedMilliseconds >= 240, "card transition");
                int SettledColor = ReadHeaderPixel(Original).ToArgb();
                Require(Highlight.ToArgb() != SettledColor && SettledColor == Theme.Palette.Surface.ToArgb(),
                    "the changed card header eases to its normal background");
            }
            else Console.WriteLine("Header animation disabled by the Windows animation preference");
            Require(FormationCard.StatusText(Writable.Cards.Single().Run) == "阻塞中", "paused scheduling uses the blocked display status");
            Require(Writable.Cards.Single().Visible && Writable.Cards.Single().Height > 100 && Writable.Cards.Single().Parent!.Height >= Writable.Cards.Single().Height,
                "blocked formation retains a visible card and an allocated scroll layout");
            Require(Writable.Cards.Single().ActionButton(FormationCard.ArchiveAction)!.Parent!.Top < Writable.Cards.Single().Board.Top &&
                Writable.Cards.Single().ActionButton(FormationCard.DeleteAction)!.Parent == Writable.Cards.Single().ActionButton(FormationCard.ArchiveAction)!.Parent,
                "archive and permanent delete are grouped above the roster");
            Require(Writable.Cards.Single().ActionButton(FormationCard.ResumeAction) is not null && Writable.Cards.Single().ActionButton(FormationCard.PauseAction) is null, "pause button calls the real service and the card re-renders from the store");
            Writable.Cards.Single().ActionButton(FormationCard.ResumeAction)!.PerformClick();
            Wait(() => Store.Get(Run.Id).State == eFormationState.Active, "resume");
            Require(Store.Get(Run.Id).EventList.Select(Item => Item.Kind).Where(Kind => Kind is "pause" or "resume").SequenceEqual(new[] { "pause", "resume" }), "pause and resume are recorded by the formation service");
            var Activation = Writable.ExecuteAsync("activate", new { run_id = Run.Id, operation_id = Guid.NewGuid().ToString("N") }, "不应成功");
            Wait(() => Activation.IsCompleted, "activation");
            Require(Activation.IsFaulted && Activation.Exception!.InnerException!.Message.Contains("没有接入真实统筹启动消息") && Store.Get(Run.Id).ActivationState == eFormationDeliveryState.Pending, "activation without a real coordinator bridge fails visibly instead of faking delivery");

            using var Detail = new FormationDetailDialog(Store.Get(Run.Id), Store, Settings, Theme, false, (_, _, _) => Task.FromException<object>(new InvalidOperationException("只读详情不应执行")));
            Theme.Apply(Detail);
            Detail.Show();
            Application.DoEvents();
            Require(Descendants(Detail).OfType<SeatBoard>().Single().Members.Count == Run.MemberList.Count && !Descendants(Detail).OfType<DataGridView>().Any(), "detail shows seats and task cards without tables");
            Require(Descendants(Detail).OfType<Label>().Any(Item => Item.Text == "统筹尚未登记任务"), "detail reports the real empty task list");
            Require(!Descendants(Detail).Any(Item => Item.Text is "最近事件" or "交付总结" or "需求" or "上下文") &&
                !Descendants(Detail).OfType<TextBox>().Any(), "detail omits event logs summary and requirement context views");
            Require(Store.Get(Run.Id).RevisionList.Count > 0 && Store.Get(Run.Id).EventList.Count > 0, "view removal preserves CLI records");

            var Removable = Store.Create(new()
            {
                Theme = "归档并移出列表测试", SetupOnly = true,
                MemberList = new()
                {
                    new() { Role = eFormationRole.Coordinator, InstanceId = "primary" },
                    new() { Role = eFormationRole.Executor, InstanceId = "primary" }
                }
            });
            var Refresh = Writable.ReloadAsync();
            Wait(() => Refresh.IsCompletedSuccessfully, "refresh after creating removable formation");
            Require(Writable.Cards.Single(Item => Item.Run.Id == Removable.Id).ActionButton(FormationCard.ArchiveAction)!.Enabled,
                "archive is available on a normal card");
            const string RemoveAction = "archive-remove";
            var PlanTask = Writable.ExecuteAsync("lifecycle-preview", new { run_id = Removable.Id, action = RemoveAction }, "");
            Wait(() => PlanTask.IsCompleted, "archive-and-remove preview");
            var Plan = (FormationLifecyclePlan)PlanTask.GetAwaiter().GetResult();
            var Remove = Writable.ExecuteAsync(RemoveAction,
                new { run_id = Removable.Id, operation_id = "remove", plan_token = Plan.Token }, "");
            Wait(() => Remove.IsCompleted, "archive-and-remove");
            Remove.GetAwaiter().GetResult();
            Wait(() => Writable.Cards.Count == 1, "default view hides removed card");
            Require(Writable.Cards.Single().Run.Id == Run.Id && Store.Get(Removable.Id).RemovedFromView, "only the requested card leaves the default view");
            var Toggle = Descendants(Writable).OfType<Button>().Single(Item => Item.Name == "FormationShowRemoved");
            Toggle.PerformClick();
            Wait(() => Writable.Cards.Count == 2, "show removed formations");
            Require(Writable.Cards.Single(Item => Item.Run.Id == Removable.Id).ActionButton(FormationCard.UnarchiveAction)!.Enabled,
                "removed cards can be opened and restored from the list");
            Toggle.PerformClick();
            Wait(() => Writable.Cards.Count == 1, "hide removed formations");
            Require(Writable.Cards.Count == 1, "removed cards can be hidden again");
        }
    }

    private static void VerifyRefreshDuringStoreLock(FormationPage Page, string Root, FormationCard Card)
    {
        string StatePath = Path.Combine(Root, "formations.json").ToUpperInvariant();
        string Digest = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(StatePath)));
        using var Locked = new ManualResetEventSlim();
        using var Finish = new ManualResetEventSlim();
        var Owner = Task.Run(() =>
        {
            using var Gate = new Mutex(false, "Local\\MmCodexMgr-Formation-" + Digest);
            if (!Gate.WaitOne(TimeSpan.FromSeconds(5))) throw new TimeoutException("无法获取测试编队存储锁");
            try { Locked.Set(); Finish.Wait(TimeSpan.FromSeconds(3)); }
            finally { Gate.ReleaseMutex(); }
        });
        try
        {
            Require(Locked.Wait(TimeSpan.FromSeconds(5)), "test holds the real formation store mutex");
            var Clock = System.Diagnostics.Stopwatch.StartNew();
            Descendants(Page).OfType<Button>().Single(Button => Button.Name == "FormationRefresh").PerformClick();
            bool Responsiveness = false;
            Page.BeginInvoke(() => Responsiveness = true);
            Application.DoEvents();
            Require(Responsiveness && !Owner.IsCompleted && Clock.ElapsedMilliseconds < 1500,
                "manual refresh leaves the UI message loop responsive while the store is locked");
            Require(Card.Visible && ReferenceEquals(Card, Page.Cards.Single()), "manual refresh keeps the visible card while waiting for the store");
            Console.WriteLine($"Refresh click and UI message while store is locked: {Clock.ElapsedMilliseconds} ms");
        }
        finally
        {
            Finish.Set();
            Owner.GetAwaiter().GetResult();
        }
        var Refresh = Page.ReloadAsync();
        Wait(() => Refresh.IsCompletedSuccessfully, "refresh after unlocking the store");
    }

    private static Color ReadHeaderPixel(FormationCard Card)
    {
        using var Image = new Bitmap(Card.Width, Card.Height);
        Card.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
        return Image.GetPixel(Card.Width / 2, Card.Padding.Top + Card.LogicalToDeviceUnits(45));
    }

    private static void VerifyCompactCard(ManagerSettings Settings, bool Dark)
    {
        using var Host = new Form { ShowInTaskbar = false, StartPosition = FormStartPosition.Manual, Location = new Point(-2600, -2600) };
        var Run = new FormationRun
        {
            Theme = "四执行编队",
            CreatedAt = DateTimeOffset.Now,
            ContextVersion = 1,
            RequirementVersion = 1,
            MaxParallel = 4,
            State = eFormationState.Paused,
            ActivationState = eFormationDeliveryState.Delivered,
            MemberList =
            {
                new() { Id = "coordinator", Role = eFormationRole.Coordinator, InstanceId = "primary", SessionId = "coordinator-chat" },
                new() { Id = "exec1", Role = eFormationRole.Executor, InstanceId = "primary", Model = "model-a", Effort = "high" },
                new() { Id = "exec2", Role = eFormationRole.Executor, InstanceId = "primary", Model = "model-b", Effort = "high" },
                new() { Id = "exec3", Role = eFormationRole.Executor, InstanceId = "second", Model = "model-c", Effort = "high" },
                new() { Id = "exec4", Role = eFormationRole.Executor, InstanceId = CursorRelayRunner.InstanceId, Model = "model-d" },
                new() { Id = "reviewer", Role = eFormationRole.Reviewer, InstanceId = ClaudeRelayRunner.InstanceId },
                new() { Id = "learner", Role = eFormationRole.Learner, InstanceId = DshRelayRunner.InstanceId }
            }
        };
        var RequestList = new List<(string Action, string? MemberId)>();
        using var Card = new FormationCard(Run, Settings, true, (_, Action, Member) => RequestList.Add((Action, Member?.Id)));
        var Theme = new AppTheme(Dark);
        Host.Controls.Add(Card);
        Theme.Apply(Host);
        int wide = Host.LogicalToDeviceUnits(540);
        Card.Size = Host.ClientSize = new Size(wide, Card.MeasureHeight(wide));
        Host.Show();
        Application.DoEvents();
        var Buttons = Card.Board.Controls.OfType<Button>().ToList();
        Require(Buttons.Count == 8 && Buttons.Select(Item => Item.Top).Distinct().Count() == 1 &&
            Card.Board.Height <= Host.LogicalToDeviceUnits(60), "regular width fits all five roles and four execution seats in one compact row");
        Require(Buttons.All(Item => Item.Region is { } Shape && !Shape.IsVisible(0, 0) && Shape.IsVisible(Item.Width / 2, Item.Height / 2)),
            "roster buttons have circular native regions that leave the background visible in corners");
        var First = Buttons.Single(Item => Item.Name == "FormationRosterSeatexec1");
        var Second = Buttons.Single(Item => Item.Name == "FormationRosterSeatexec2");
        Require(First.AccessibleDescription?.Contains("模型 model-a") == true && Second.AccessibleDescription?.Contains("模型 model-b") == true &&
            First.AccessibleDescription.Contains("状态 已暂停"), "same-instance execution seats retain separate models and current status");
        First.PerformClick();
        Second.PerformClick();
        Buttons.Single(Item => Item.Name == "FormationRosterEmptyOutsider").PerformClick();
        Card.ActionButton(FormationCard.OpenAction)!.PerformClick();
        Card.ActionButton(FormationCard.ResumeAction)!.PerformClick();
        Require(RequestList.SequenceEqual(new (string, string?)[] { (FormationCard.SeatAction, "exec1"), (FormationCard.SeatAction, "exec2"),
            (FormationCard.OutsiderAction, null), (FormationCard.OpenAction, null), (FormationCard.ResumeAction, null) })
            && FormationCard.StatusText(Run) == "阻塞中", "compact card forwards seat editing, outsider addition, opening coordinator and blocked scheduling actions");

        SaveCardImage(Host, Dark, "wide");
        int narrow = Host.LogicalToDeviceUnits(310);
        Card.Size = Host.ClientSize = new Size(narrow, Card.MeasureHeight(narrow));
        Application.DoEvents();
        Require(Buttons.Select(Item => Item.Top).Distinct().Count() == 2 &&
            Buttons.All(Item => Card.Board.ClientRectangle.Contains(Item.Bounds)) &&
            Buttons.All(Item => Buttons.All(Other => Item == Other || !Item.Bounds.IntersectsWith(Other.Bounds))), "narrow width wraps without clipping or overlapping seats");
        SaveCardImage(Host, Dark, "narrow");

        Run.State = eFormationState.Completed;
        using var Completed = new FormationCard(Run, Settings, true, (_, Action, _) => RequestList.Add((Action, null)));
        Host.Controls.Add(Completed);
        Completed.BringToFront();
        Theme.Apply(Completed);
        Completed.Size = new Size(narrow, Completed.MeasureHeight(narrow));
        Completed.ActionButton(FormationCard.DeleteAction)!.PerformClick();
        Require(RequestList[^1].Action == FormationCard.DeleteAction && Completed.ActionButton(FormationCard.ResumeAction) is null &&
            !Completed.Board.Controls.OfType<Button>().Single(Item => Item.Name == "FormationRosterEmptyOutsider").Enabled, "completed card offers deletion and disallows new outsider seats");
        Run.Archived = true;
        using var Archived = new FormationCard(Run, Settings, true, (_, Action, _) => RequestList.Add((Action, null)));
        Require(FormationCard.StatusText(Run) == "已归档" && Archived.ActionButton(FormationCard.UnarchiveAction) is not null &&
            Archived.ActionButton(FormationCard.ArchiveAction) is null, "archived cards expose undo archive instead of archive");
    }

    private static void SaveCardImage(Form Form, bool Dark, string Shape)
    {
        var Card = Form.Controls.OfType<FormationCard>().Single();
        using var Image = new Bitmap(Card.Width, Card.Height);
        Card.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
        Image.Save(Path.Combine(AppContext.BaseDirectory, $"formation-card-{Shape}-{(Dark ? "dark" : "light")}.png"));
    }

    private static void Execute(FormationService Service, string Action, object Arguments)
        => Service.ExecuteAsync(Action, JsonSerializer.SerializeToElement(Arguments, WireOptions), FormationCaller.Operator(), CancellationToken.None).GetAwaiter().GetResult();

    private static void Wait(Func<bool> Condition, string Name)
    {
        var Deadline = DateTime.UtcNow.AddSeconds(15);
        while (!Condition())
        {
            if (DateTime.UtcNow > Deadline) throw new TimeoutException("FAILED formation UI: timed out waiting for " + Name);
            Application.DoEvents();
            Thread.Sleep(10);
        }
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED formation UI: " + Message);
        Count++;
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
