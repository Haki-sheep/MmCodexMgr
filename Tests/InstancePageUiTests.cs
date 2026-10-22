using System.Runtime.InteropServices;
using CodexInstanceManager;

internal static class InstancePageUiTests
{
    private const int MouseWheel = 0x020A;
    private static int Count;

    public static int Run()
    {
        ApplicationConfiguration.Initialize();
        foreach (bool DarkMode in new[] { true, false })
        foreach (var Size in new[] { new Size(980, 700), new Size(1080, 860), new Size(1280, 960) })
            Verify(DarkMode, Size);
        Console.WriteLine($"PASS instance UI {Count} assertions");
        return 0;
    }

    private static void Verify(bool DarkMode, Size Size)
    {
        var Profile = new InstanceProfile { Id = "preview", Name = "界面测试实例", HomePath = Path.GetTempPath(), Badge = "1" };
        var Settings = new ManagerSettings { InstanceList = new() { Profile }, SelectedId = Profile.Id, DarkMode = DarkMode };
        using var Form = new MainForm(Settings, true) { Size = Size };
        Form.Show();
        Form.Activate();
        Application.DoEvents();
        var Hint = Descendants(Form).OfType<Label>().Single(Label => Label.Text.StartsWith("显示后可", StringComparison.Ordinal));
        var Body = Hint.Parent!;
        var Card = Body.Parent!;
        var Scroll = (ScrollableControl)Card.Parent!.Parent!;
        Console.WriteLine($"instance UI dark={DarkMode} size={Size} dpi={Form.DeviceDpi} hint={Hint.Bounds} body={Body.ClientRectangle} card={Card.ClientRectangle}");
        Require(Body.ClientRectangle.Contains(Hint.Bounds), "launch hint fits inside its content area");
        Require(Card.ClientRectangle.Contains(Body.Bounds), "launch content fits inside its card");
        Require(Hint.Height >= Hint.GetPreferredSize(new Size(Hint.Width, 0)).Height, "launch hint displays all wrapped lines");
        foreach (var Button in Descendants(Body).OfType<Button>())
            Require(Button.Parent!.ClientRectangle.Contains(Button.Bounds), "launch button is fully visible: " + Button.Text);
        var ProjectButton = Descendants(Form).OfType<Button>().Single(Button => Button.Text == "一键同步工程");
        Require(ProjectButton.Parent!.ClientRectangle.Contains(ProjectButton.Bounds), "project sync action fits beside conversation import");
        Require(ProjectButton.Parent.Parent!.ClientRectangle.Contains(ProjectButton.Parent.Bounds), "project actions fit inside the import card content");
        Require(ProjectButton.Parent.Parent.Parent!.ClientRectangle.Contains(ProjectButton.Parent.Parent.Bounds), "import card content is fully visible");
        Require(ProjectButton.Enabled, "secondary instance exposes project synchronization");

        var FocusTarget = Descendants(Form).OfType<ListBox>().Single();
        FocusTarget.Focus();
        Require(Scroll.VerticalScroll.Visible, "instance page has scrollable content");
        var ViewportPoint = Scroll.PointToScreen(new Point(Scroll.ClientSize.Width / 2, 20));
        int Before = Scroll.AutoScrollPosition.Y;
        Wheel(FocusTarget, ViewportPoint, -120);
        Require(Scroll.AutoScrollPosition.Y < Before, $"wheel over nested card scrolls when the instance list has focus before={Before} after={Scroll.AutoScrollPosition.Y}");
        Require(FocusTarget.Focused, "scrolling keeps keyboard focus on the selected instance");
        var Input = Descendants(Card.Parent!).OfType<TextBox>().First();
        Input.Focus();
        Before = Scroll.AutoScrollPosition.Y;
        Wheel(Input, ViewportPoint, -120);
        Require(Scroll.AutoScrollPosition.Y < Before && Input.Focused, "wheel over the page scrolls while an input retains focus");
        using (var OtherForm = new Form())
        {
            Before = Scroll.AutoScrollPosition.Y;
            Wheel(OtherForm, ViewportPoint, -120);
            Require(Scroll.AutoScrollPosition.Y == Before, "wheel messages belonging to another form leave the page unchanged");
        }
        FocusTarget.Focus();

        Scroll.AutoScrollPosition = Point.Empty;
        Scroll.ScrollControlIntoView(Hint);
        Application.DoEvents();
        Before = Scroll.AutoScrollPosition.Y;
        Wheel(FocusTarget, Hint.PointToScreen(new Point(4, Hint.Height / 2)), -120);
        Require(Scroll.AutoScrollPosition.Y < Before, "wheel over helper text scrolls the outer page");

        Scroll.AutoScrollPosition = Point.Empty;
        Application.DoEvents();
        var BarPoint = Scroll.PointToScreen(new Point(Scroll.ClientSize.Width + SystemInformation.VerticalScrollBarWidth / 2, Scroll.ClientSize.Height / 2));
        Before = Scroll.AutoScrollPosition.Y;
        Wheel(FocusTarget, BarPoint, -120);
        Require(Scroll.AutoScrollPosition.Y < Before, "wheel over the scrollbar scrolls the page");
        Before = Scroll.AutoScrollPosition.Y;
        Wheel(FocusTarget, ViewportPoint, 120);
        Require(Scroll.AutoScrollPosition.Y > Before, "wheel scrolls upward");
        Before = Scroll.AutoScrollPosition.Y;
        Wheel(FocusTarget, FocusTarget.PointToScreen(new Point(8, 8)), -120);
        Require(Scroll.AutoScrollPosition.Y == Before, "wheel outside the instance page leaves its position unchanged");

        for (int Index = 0; Index < 100; Index++) Wheel(FocusTarget, BarPoint, -120);
        int Bottom = Scroll.VerticalScroll.Maximum - Scroll.VerticalScroll.LargeChange + 1;
        Require(-Scroll.AutoScrollPosition.Y == Bottom, "wheel reaches the bottom of the page");
        for (int Index = 0; Index < 100; Index++) Wheel(FocusTarget, BarPoint, 120);
        Require(Scroll.AutoScrollPosition.Y == 0, "wheel reaches the top of the page");
        if (Size.Width == 1080)
        {
            Scroll.ScrollControlIntoView(Hint);
            Application.DoEvents();
            using var Image = new Bitmap(Form.Width, Form.Height);
            Form.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
            string PathValue = Path.Combine(AppContext.BaseDirectory, DarkMode ? "instance-ui-dark.png" : "instance-ui-light.png");
            Image.Save(PathValue);
            Console.WriteLine("instance UI render=" + PathValue);
            Scroll.ScrollControlIntoView(ProjectButton);
            Application.DoEvents();
            using var ProjectImage = new Bitmap(Form.Width, Form.Height);
            Form.DrawToBitmap(ProjectImage, new Rectangle(Point.Empty, ProjectImage.Size));
            ProjectImage.Save(Path.Combine(AppContext.BaseDirectory, DarkMode ? "project-sync-entry-dark.png" : "project-sync-entry-light.png"));
        }
        VerifyProjectDialog(Profile, DarkMode);
    }

    private static void VerifyProjectDialog(InstanceProfile Target, bool DarkMode)
    {
        var Source = new InstanceProfile { Id = "primary", Name = "主实例", IsPrimary = true };
        using var Dialog = new ProjectSyncDialog(new() { Target, Source }, Target);
        new AppTheme(DarkMode).Apply(Dialog);
        Dialog.Show();
        Application.DoEvents();
        var Input = Descendants(Dialog).OfType<ComboBox>().Single();
        Require(Input.Items.Count == 1 && ReferenceEquals(Input.SelectedItem, Source), "project sync selects the primary source and excludes its destination");
        var Hint = Descendants(Dialog).OfType<Label>().Single(Label => Label.Text.StartsWith("将来源实例", StringComparison.Ordinal));
        Require(Hint.Height >= Hint.GetPreferredSize(new Size(Hint.Width, 0)).Height, "project-only explanation displays all lines");
        foreach (var Control in Descendants(Dialog).Where(Control => Control is Button or ComboBox or Label))
            Require(Control.Parent!.ClientRectangle.Contains(Control.Bounds), "project sync control fits: " + Control.GetType().Name);
        using var Image = new Bitmap(Dialog.Width, Dialog.Height);
        Dialog.DrawToBitmap(Image, new Rectangle(Point.Empty, Image.Size));
        Image.Save(Path.Combine(AppContext.BaseDirectory, DarkMode ? "project-sync-dark.png" : "project-sync-light.png"));
    }

    private static void Wheel(Control FocusTarget, Point ScreenPoint, int Delta)
    {
        int Position = (ScreenPoint.Y & 0xffff) << 16 | ScreenPoint.X & 0xffff;
        if (!PostMessage(FocusTarget.Handle, MouseWheel, new IntPtr(Delta << 16), new IntPtr(Position)))
            throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        Application.DoEvents();
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
        if (!Condition) throw new InvalidOperationException("FAILED: " + Message);
        Count++;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool PostMessage(IntPtr Window, int Message, IntPtr WParam, IntPtr LParam);
}
