using System.Diagnostics;
using System.Text;

namespace CodexInstanceManager;

public static class LibraryGit
{
    public static string DefaultSource(string Relative)
    {
        string Repository = FindRepository();
        return Repository.Length > 0 ? Path.Combine(Repository, "Library", Relative) : Path.Combine(AppContext.BaseDirectory, "Library", Relative);
    }
    public static string FindRepository()
    {
        for (string? Current = AppContext.BaseDirectory; Current is not null; Current = Path.GetDirectoryName(Current.TrimEnd(Path.DirectorySeparatorChar)))
            if (Directory.Exists(Path.Combine(Current, ".git")) || File.Exists(Path.Combine(Current, ".git"))) return Current;
        return "";
    }

    /// <summary>
    /// 在仓库内执行 Git 捕获输出 非零退出码直接上报
    /// </summary>
    public static async Task<string> RunAsync(string Repository, params string[] ArgumentList)
    {
        if (Repository.Length == 0 || !Directory.Exists(Path.Combine(Repository, ".git")) && !File.Exists(Path.Combine(Repository, ".git"))) throw new DirectoryNotFoundException("请选择实际 Git 仓库根目录");
        var Start = new ProcessStartInfo("git") { WorkingDirectory = Repository, UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8 };
        Start.Environment["GIT_TERMINAL_PROMPT"] = "0";
        Start.ArgumentList.Add("-c");
        Start.ArgumentList.Add("core.quotepath=false");
        foreach (string Argument in ArgumentList) Start.ArgumentList.Add(Argument);
        using var Process = System.Diagnostics.Process.Start(Start) ?? throw new IOException("Git 无法启动");
        var Output = Process.StandardOutput.ReadToEndAsync();
        var Error = Process.StandardError.ReadToEndAsync();
        await Process.WaitForExitAsync();
        string Text = await Output;
        string ErrorText = await Error;
        if (Process.ExitCode != 0) throw new IOException("Git " + string.Join(" ", ArgumentList) + " 失败\n" + ErrorText + "\n" + Text);
        return Text.TrimEnd();
    }

    /// <summary>
    /// 收录所选维护源库与规则源 只提交 Library 路径并推送当前分支
    /// </summary>
    public static async Task<string> PublishAsync(ManagerSettings Settings)
    {
        string Repository = ManagerPaths.Normalize(Settings.Library.RepositoryPath);
        string Staged = await RunAsync(Repository, "diff", "--cached", "--name-only");
        if (Staged.Length > 0) throw new IOException("仓库暂存区已有内容 请先处理后发布\n" + Staged);
        string Skills = Settings.Library.SkillSource;
        string Library = Path.Combine(Repository, "Library");
        string TargetSkills = Path.Combine(Library, "Skills");
        string TargetRule = Path.Combine(Library, "Rule", "AI-global-rules.md");
        string SourceRule = ManagerPaths.Normalize(Settings.Library.RuleSource);
        GlobalRules.EnsureWritablePath(TargetRule);
        byte[] RuleContentList = File.ReadAllBytes(SourceRule);
        if (RuleContentList.Length == 0) throw new InvalidDataException("规则源文件为空");
        var Plan = await Task.Run(() => SkillMirror.Preview(Skills, TargetSkills, ExcludedNameList: Settings.Library.ExcludedNameList));
        string Backup = Path.Combine(ManagerPaths.BackupRoot, "library-publish-" + Guid.NewGuid().ToString("N"));
        await Task.Run(() => SkillMirror.Apply(Plan, Backup));
        if (!ManagerPaths.Same(SourceRule, TargetRule))
        {
            if (File.Exists(TargetRule))
            {
                Directory.CreateDirectory(Backup);
                File.Copy(TargetRule, Path.Combine(Backup, "AI-global-rules.md"));
            }
            SettingsStore.AtomicWrite(TargetRule, RuleContentList);
        }
        await RunAsync(Repository, "add", "--", "Library");
        Staged = await RunAsync(Repository, "diff", "--cached", "--name-only");
        if (Staged.Split('\n', StringSplitOptions.RemoveEmptyEntries).Any(Item => !Item.StartsWith("Library/", StringComparison.Ordinal))) throw new IOException("暂存区混入其他改动 已停止提交");
        if (Staged.Length > 0) await RunAsync(Repository, "commit", "-m", "feat: 更新统一规则与技能库", "--", "Library");
        try { await RunAsync(Repository, "push"); }
        catch (Exception Error) { throw new IOException("本地库已保存 Git 推送失败 可处理认证或远端分歧后重试\n" + Error.Message, Error); }
        return await RunAsync(Repository, "log", "-1", "--format=%h %s");
    }

    /// <summary>
    /// 仅在工作区干净时快进拉取 不覆盖本地安装与全局规则
    /// </summary>
    public static async Task<string> PullAsync(string Repository)
    {
        string Status = await RunAsync(Repository, "status", "--porcelain");
        if (Status.Length > 0) throw new IOException("仓库存在未提交改动 请先保存后拉取\n" + Status);
        return await RunAsync(Repository, "pull", "--ff-only");
    }
}
