namespace CodexInstanceManager;

internal sealed class FormationTemplatePickerDialog : StudioDialog
{
    private readonly AppTheme Appearance;
    private readonly Func<FormationTemplate, Task<List<FormationTemplate>>> DeleteTemplate;
    /// <summary> 模板候选 </summary>
    private readonly ThemeComboBox Templates = new() { Dock = DockStyle.Top, DropDownStyle = ComboBoxStyle.DropDownList, FormattingEnabled = true };
    private readonly Label Hint = new() { AutoSize = true, Margin = new Padding(0, 0, 0, 10), Tag = eThemeRole.Muted };
    private readonly StudioButton LoadButton;
    private readonly StudioButton DeleteButton;

    public List<FormationTemplate> TemplateList { get; private set; }
    public FormationTemplate Selection => (FormationTemplate)Templates.SelectedItem!;

    public FormationTemplatePickerDialog(List<FormationTemplate> TemplateList, AppTheme Appearance, Func<FormationTemplate, Task<List<FormationTemplate>>> DeleteTemplate)
        : base("使用模板", new Size(460, 164))
    {
        this.Appearance = Appearance;
        this.DeleteTemplate = DeleteTemplate;
        this.TemplateList = TemplateList;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Content.Controls.Add(Hint);
        Templates.AccessibleName = "编队模板";
        Templates.Format += (_, Event) =>
        {
            if (Event.ListItem is FormationTemplate Template) Event.Value = $"{Template.Name}  v{Template.Version}  ·  {Template.MemberList.Count} 席";
        };
        Content.Controls.Add(Templates);
        LoadButton = AddAction("载入", eButtonKind.Primary, (_, _) => DialogResult = DialogResult.OK);
        CancelButton = AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
        DeleteButton = AddAction("删除模板", eButtonKind.Danger, async (_, _) => await DeleteSelectedAsync());
        AcceptButton = LoadButton;
        FormClosing += (_, Event) => { if (UseWaitCursor && Event.CloseReason == CloseReason.UserClosing) Event.Cancel = true; };
        RefreshTemplates(0);
    }

    private void RefreshTemplates(int Index)
    {
        Templates.Items.Clear();
        Templates.Items.AddRange(TemplateList.Cast<object>().ToArray());
        bool HasTemplates = TemplateList.Count != 0;
        if (HasTemplates) Templates.SelectedIndex = Math.Min(Index, TemplateList.Count - 1);
        Hint.Text = HasTemplates ? "载入模板会替换当前已选席位。" : "暂无已保存的模板。";
        Templates.Enabled = HasTemplates;
        LoadButton.Enabled = HasTemplates;
        DeleteButton.Enabled = HasTemplates;
    }

    private async Task DeleteSelectedAsync()
    {
        var Template = Selection;
        using var Confirm = new DeleteConfirmationDialog(Template);
        if (Confirm.ShowThemed(this, Appearance) != DialogResult.Yes) return;
        int Index = Templates.SelectedIndex;
        UseWaitCursor = true;
        Enabled = false;
        try
        {
            TemplateList = await DeleteTemplate(Template);
            RefreshTemplates(Index);
        }
        catch (Exception Error)
        {
            Program.LogError(Error);
            MessageBox.Show(this, Error.Message, "模板未删除", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            UseWaitCursor = false;
            Enabled = true;
        }
    }

    private sealed class DeleteConfirmationDialog : StudioDialog
    {
        public DeleteConfirmationDialog(FormationTemplate Template) : base("确认删除模板", new Size(460, 180))
        {
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Content.Controls.Add(new StudioWrapLabel { Text = $"删除「{Template.Name}」v{Template.Version}？\n已创建的编队会保留其席位配置。" });
            AddAction("删除", eButtonKind.Danger, (_, _) => DialogResult = DialogResult.Yes);
            var Cancel = AddAction("取消", eButtonKind.Secondary, (_, _) => DialogResult = DialogResult.Cancel);
            CancelButton = Cancel;
            ActiveControl = Cancel;
        }
    }
}
