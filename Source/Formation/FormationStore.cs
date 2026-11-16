using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public sealed class FormationStore
{
    public const int DefaultGlobalMaxParallel = 8;
    /// <summary> 编队状态与操作结果的原子快照文件 </summary>
    private readonly string StatePath;
    /// <summary> 同一存储路径的进程间互斥锁名称 </summary>
    private readonly string MutexName;

    public FormationStore(string Root)
    {
        StatePath = Path.Combine(ManagerPaths.Normalize(Root), "formations.json");
        MutexName = "Local\\MmCodexMgr-Formation-" + Digest(StatePath.ToUpperInvariant());
    }

    public List<FormationRun> List() => Read(Database => Database.RunList.OrderByDescending(Run => Run.CreatedAt).ToList());

    public FormationRun Get(string Id) => Read(Database => RequireRun(Database, Id));

    public List<FormationTemplate> ListTemplates() => Read(Database => Database.TemplateList.OrderBy(Template => Template.Name).ToList());
    public (List<FormationRun> Runs, List<FormationTemplate> Templates) Snapshot() => Read(Database =>
        (Database.RunList.OrderByDescending(Run => Run.CreatedAt).ToList(), Database.TemplateList.OrderBy(Template => Template.Name).ToList()));

    public FormationTemplate SaveTemplate(FormationTemplate Template) => Update(Database => SaveTemplate(Database, Template));

    public FormationRun Create(FormationCreate Request) => Update(Database => Create(Database, Request));

    internal static FormationTemplate SaveTemplate(FormationDatabase Database, FormationTemplate Template)
    {
        RequireText(Template.Name, "模板名称", 100);
        RequireCapacity(Template.MaxParallel);
        var Existing = Template.Id.Length == 0 ? null : Database.TemplateList.SingleOrDefault(Item => Item.Id == Template.Id)
            ?? throw new InvalidOperationException("编队模板不存在 " + Template.Id);
        if (Existing is not null && Template.Version != Existing.Version) throw new InvalidOperationException("编队模板版本已更新 请重新读取");
        var Saved = new FormationTemplate
        {
            Id = Existing?.Id ?? NewId(),
            Name = Template.Name,
            Version = (Existing?.Version ?? 0) + 1,
            MaxParallel = Template.MaxParallel,
            MemberList = BuildMembers(Template.MemberList, "", DateTimeOffset.Now, true)
        };
        if (Existing is not null) Database.TemplateList.Remove(Existing);
        Database.TemplateList.Add(Saved);
        return Saved;
    }

    internal static FormationRun Create(FormationDatabase Database, FormationCreate Request)
    {
        if (Request.SetupOnly && Request.Theme.Length == 0) Request.Theme = $"编队 {DateTime.Now:MM-dd HH:mm}";
        RequireText(Request.Theme, "编队主题", 80);
        if (Request.SetupOnly)
        {
            if (Request.Requirement.Length != 0) throw new InvalidOperationException("仅创建席位时需求应留空 请到统筹会话说明任务");
        }
        else RequireText(Request.Requirement, "需求", 4000);
        RequireOptionalText(Request.Context, "上下文", 4000);
        var Template = Request.TemplateId is null ? null : Database.TemplateList.SingleOrDefault(Item => Item.Id == Request.TemplateId)
            ?? throw new InvalidOperationException("编队模板不存在 " + Request.TemplateId);
        if (Template is not null && Request.MemberList.Count != 0) throw new InvalidOperationException("创建时只能指定一个模板或一组席位");
        int MaxParallel = Template?.MaxParallel ?? Request.MaxParallel;
        RequireCapacity(MaxParallel);
        var Now = DateTimeOffset.Now;
        var Run = new FormationRun
        {
            Id = NewId(),
            SetupOnly = Request.SetupOnly,
            Theme = Request.Theme,
            TemplateId = Template?.Id,
            TemplateVersion = Template?.Version,
            MaxParallel = MaxParallel,
            CreatedAt = Now,
            ContextVersion = 1,
            RequirementVersion = 1,
            MemberList = BuildMembers(Template?.MemberList ?? Request.MemberList, Request.Theme, Now, false)
        };
        Run.RevisionList.Add(new(1, 1, Request.Context, Request.Requirement, Now));
        AddEvent(Run, "operator", "created", Request.Theme);
        Database.RunList.Add(Run);
        return Run;
    }

    private static List<FormationMember> BuildMembers(List<FormationMember> MemberList, string Theme, DateTimeOffset Date, bool Template)
    {
        if (MemberList.Count is < 2 or > 64 || MemberList.Count(Item => Item.Role == eFormationRole.Coordinator) != 1 ||
            !MemberList.Any(Item => Item.Role == eFormationRole.Executor) || MemberList.Count(Item => Item.Role == eFormationRole.Outsider) > 1 ||
            MemberList.Count(Item => Item.Role == eFormationRole.Learner) > 1) throw new InvalidOperationException("编队需要一位统筹与至少一位执行 外援和学习各最多一席");
        if (MemberList.Count(Item => Item.Role == eFormationRole.Executor) > 4)
            throw new InvalidOperationException("执行者最多四席");
        if (MemberList.GroupBy(Item => Item.Role).Any(Group => Group.Where(Item => SeatProviders.For(Item.InstanceId).SupportsEffort)
            .Select(Item => Item.Effort).Distinct(StringComparer.Ordinal).Count() > 1))
            throw new InvalidOperationException("同一职业的 Codex 席位须使用相同推理强度");
        var CountDict = new Dictionary<eFormationRole, int>();
        var ResultList = new List<FormationMember>();
        var Controller = MemberList.Single(Item => Item.Role == eFormationRole.Coordinator);
        bool native = MemberList.Any(Item => Item.DispatchMode == eFormationDispatchMode.Native);
        foreach (var Input in MemberList)
        {
            if (!Enum.IsDefined(Input.Role)) throw new InvalidOperationException("编队角色无效");
            string instanceId = Input.DispatchMode == eFormationDispatchMode.Native ? Controller.InstanceId : Input.InstanceId;
            RequireText(instanceId, "角色实例 ID", 128);
            RequireOptionalText(Input.DisplayName, "角色显示名", 120);
            RequireOptionalText(Input.Model, "角色模型", 128);
            RequireOptionalText(Input.Effort, "角色推理强度", 20);
            RequireOptionalText(Input.SessionId, "角色会话 ID", 128);
            RequireOptionalText(Input.Project, "角色项目", 1024);
            RequireOptionalText(Input.Cwd, "角色目录", 1024);
            int Number = CountDict.GetValueOrDefault(Input.Role) + 1;
            CountDict[Input.Role] = Number;
            string Name = Input.Role switch
            {
                eFormationRole.Executor => "执行者",
                eFormationRole.Reviewer => "审核者",
                eFormationRole.Learner => "学习者",
                _ => RoleName(Input.Role)
            };
            ResultList.Add(new()
            {
                Id = Input.Id.Length == 0 ? NewId() : Input.Id,
                Role = Input.Role,
                DispatchMode = Input.DispatchMode,
                FollowCoordinator = Input.FollowCoordinator,
                SubagentMax = native && Input.SubagentMax == 0 && !SeatProviders.IsExternal(instanceId)
                    ? DefaultSubagentMax(Input.Role) : Input.SubagentMax,
                DisplayName = Input.DisplayName.Length != 0 ? Input.DisplayName : Template ? "" : $"{Theme} {Date:MM-dd} {Name}{(Number > 1 ? Number.ToString() : "")}",
                InstanceId = instanceId,
                SessionId = Template ? "" : Input.SessionId,
                Model = Input.Model,
                Effort = Input.Effort,
                Project = Input.Project,
                Cwd = Input.Cwd
            });
        }
        if (ResultList.Any(Item => Item.Id.Length > 128) || ResultList.Select(Item => Item.Id).Distinct(StringComparer.Ordinal).Count() != ResultList.Count)
            throw new InvalidOperationException("编队席位 ID 重复或过长");
        if (ResultList.GroupBy(Item => Item.Role).Any(Group => Group.Where(Item => !SeatProviders.IsExternal(Item.InstanceId))
            .Select(Item => Item.SubagentMax).Distinct().Count() > 1))
            throw new InvalidOperationException("同一职业的 Codex 席位须使用相同子代理预算");
        if (ResultList.Where(Item => Item.SessionId.Length != 0).GroupBy(Item => (Item.InstanceId, Item.SessionId)).Any(Group => Group.Count() > 1))
            throw new InvalidOperationException("同一会话不能占用同一编队的多个席位");
        return ResultList;
    }

    internal static int DefaultSubagentMax(eFormationRole Role) => Role switch
    {
        eFormationRole.Coordinator => 3,
        eFormationRole.Executor => 2,
        eFormationRole.Learner => 1,
        _ => 0
    };

    public static string RoleName(eFormationRole Role) => Role switch
    {
        eFormationRole.Coordinator => "统筹",
        eFormationRole.Executor => "执行",
        eFormationRole.Reviewer => "审核",
        eFormationRole.Outsider => "外援",
        eFormationRole.Learner => "学习",
        _ => throw new ArgumentOutOfRangeException(nameof(Role))
    };

    internal static FormationRun RequireRun(FormationDatabase Database, string Id) => Database.RunList.SingleOrDefault(Run => Run.Id == Id)
        ?? throw new InvalidOperationException("编队不存在 " + Id);

    internal static void AddEvent(FormationRun Run, string ActorId, string Kind, string Details) => Run.EventList.Add(new(DateTimeOffset.UtcNow, ActorId, Kind, Details));

    internal T Read<T>(Func<FormationDatabase, T> Action) => Access(Action, false);

    internal T Update<T>(Func<FormationDatabase, T> Action) => Access(Action, true);

    private T Access<T>(Func<FormationDatabase, T> Action, bool Commit)
    {
        using var Gate = new Mutex(false, MutexName);
        try
        {
            if (!Gate.WaitOne(TimeSpan.FromSeconds(10))) throw new TimeoutException("等待编队数据存储超时");
        }
        catch (AbandonedMutexException)
        {
            // 原子替换保证只读取上一次完整提交
        }
        try
        {
            var Database = File.Exists(StatePath)
                ? JsonSerializer.Deserialize<FormationDatabase>(File.ReadAllBytes(StatePath)) ?? throw new InvalidDataException("编队数据为空")
                : new();
            if (Database.SchemaVersion != 1) throw new InvalidDataException("不支持的编队数据版本 " + Database.SchemaVersion);
            var Result = Action(Database);
            if (Commit) SettingsStore.AtomicWrite(StatePath, JsonSerializer.SerializeToUtf8Bytes(Database));
            return Result;
        }
        finally { Gate.ReleaseMutex(); }
    }

    internal static string Digest(string Value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Value)));

    internal static string NewId() => Guid.NewGuid().ToString("N");

    internal static string RequireText(string Value, string Name, int Max)
    {
        if (string.IsNullOrWhiteSpace(Value)) throw new InvalidOperationException(Name + "不能为空");
        RequireOptionalText(Value, Name, Max);
        return Value;
    }

    internal static void RequireOptionalText(string Value, string Name, int Max)
    {
        if (Value.Length > Max) throw new InvalidOperationException(Name + "长度最多 " + Max);
    }

    private static void RequireCapacity(int MaxParallel)
    {
        if (MaxParallel is < 1 or > 64) throw new InvalidOperationException("编队并发范围为 1 至 64");
    }
}
