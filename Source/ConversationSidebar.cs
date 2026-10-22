using System.Text.Json.Nodes;
using Microsoft.Data.Sqlite;

namespace CodexInstanceManager;

internal sealed record SidebarProject(string Id, string LegacyId, string Name, List<string> RootList, JsonObject LegacyData);

internal sealed class ConversationSidebar
{
    public Dictionary<string, string> ProjectIdDict { get; } = new();
    public Dictionary<string, string> LegacyIdDict { get; } = new();
    public List<SidebarProject> NewProjectList { get; } = new();
    public JsonObject Result { get; }

    #region Projects
    public ConversationSidebar(SqliteConnection Database, JsonObject Source, JsonObject Target, ConversationImportPlan Plan)
    {
        Result = (JsonObject)Target.DeepClone();
        var SourceProjectList = ReadProjects(Database, "source", Source, Plan.SourceHome);
        var TargetProjectList = ReadProjects(Database, "main", Target, Plan.Destination.HomePath);
        foreach (var Project in SourceProjectList)
        {
            var Existing = TargetProjectList.FirstOrDefault(Item => Item.Id == Project.Id || Item.LegacyId == Project.LegacyId)
                ?? TargetProjectList.FirstOrDefault(Item => Project.RootList.Count > 0 && SameRoots(Project.RootList, Item.RootList));
            string TargetId = Existing?.Id ?? Project.Id;
            string TargetLegacyId = Existing?.LegacyId ?? Project.LegacyId;
            ProjectIdDict[Project.Id] = TargetId;
            ProjectIdDict[Project.LegacyId] = TargetId;
            LegacyIdDict[Project.LegacyId] = TargetLegacyId;
            if (Existing is not null) { Plan.ExistingProjectCount++; continue; }
            NewProjectList.Add(Project);
            TargetProjectList.Add(Project);
            if (ConversationDatabase.Scalar(Database, "SELECT id FROM source.projects WHERE id=$id", ("$id", Project.Id)) is null)
                ConversationDatabase.Execute(Database, "INSERT INTO source.projects(id,name,metadata,position,created_at_ms,updated_at_ms) VALUES($id,$name,'{}',0,0,0)", ("$id", Project.Id), ("$name", Project.Name));
        }
        Plan.ProjectCount = NewProjectList.Count;
        MergeProjects(Source, Plan);
        if (!Plan.ProjectsOnly) MergeThreads(Source, Plan);
    }

    private static List<SidebarProject> ReadProjects(SqliteConnection Database, string Schema, JsonObject State, string Home)
    {
        var ProjectList = new List<SidebarProject>();
        var Mapping = LocalHostObject(State, "app-server-project-id-by-legacy-project-id-by-host", Home);
        if (State["local-projects"] is JsonObject Legacy && Legacy.Count > 0)
        {
            var OrderList = (State["project-order"] as JsonArray)?.Select(Item => Item!.GetValue<string>()).ToList() ?? new();
            foreach (var Pair in Legacy.OrderBy(Item => { int Index = OrderList.IndexOf(Item.Key); return Index < 0 ? int.MaxValue : Index; }))
            {
                var Value = Pair.Value?.AsObject() ?? throw new InvalidDataException("项目数据为空 " + Pair.Key);
                string Id = Mapping?[Pair.Key]?.GetValue<string>() ?? Pair.Key;
                var RootList = Value["rootPaths"]?.AsArray().Select(Item => Item!.GetValue<string>()).ToList() ?? throw new InvalidDataException("项目缺少目录 " + Pair.Key);
                ProjectList.Add(new(Id, Pair.Key, Value["name"]!.GetValue<string>(), RootList, (JsonObject)Value.DeepClone()));
            }
        }
        else
        {
            foreach (var Row in ConversationDatabase.Rows(Database, $"SELECT * FROM {Schema}.projects ORDER BY position,id"))
            {
                string Id = (string)Row["id"]!;
                var RootList = ConversationDatabase.Rows(Database, $"SELECT path FROM {Schema}.project_roots WHERE project_id=" + Literal(Id) + " ORDER BY position").Select(Item => (string)Item["path"]!).ToList();
                var LegacyData = new JsonObject { ["id"] = Id, ["name"] = (string)Row["name"]!, ["rootPaths"] = new JsonArray(RootList.Select(Item => (JsonNode?)JsonValue.Create(Item)).ToArray()), ["createdAt"] = Convert.ToInt64(Row["created_at_ms"]), ["updatedAt"] = Convert.ToInt64(Row["updated_at_ms"]) };
                ProjectList.Add(new(Id, Id, (string)Row["name"]!, RootList, LegacyData));
            }
        }
        return ProjectList;
    }

    private void MergeProjects(JsonObject Source, ConversationImportPlan Plan)
    {
        var Projects = Object(Result, "local-projects");
        var Order = Array(Result, "project-order");
        var Mapping = HostObject(Result, "app-server-project-id-by-legacy-project-id-by-host", Plan.Destination.HomePath);
        foreach (var Pair in LegacyIdDict) Mapping[Pair.Value] = ProjectIdDict[Pair.Key];
        foreach (var Project in NewProjectList)
        {
            Projects[Project.LegacyId] = Project.LegacyData.DeepClone();
            AppendUnique(Order, Project.LegacyId);
            if (Source["project-appearances"] is JsonObject Appearances && Appearances[Project.LegacyId] is JsonNode Appearance)
                Object(Result, "project-appearances")[Project.LegacyId] = Appearance.DeepClone();
        }
        var Migration = HostObject(Result, "app-server-projects-migration-by-host", Plan.Destination.HomePath);
        if (Migration.Count == 0)
        {
            Migration["version"] = 1;
            Migration["projectsMigrated"] = true;
            if (!Plan.ProjectsOnly) Migration["threadAssignmentsMigrated"] = true;
        }
    }

    public void WriteProjects(SqliteConnection Database)
    {
        long Position = Convert.ToInt64(ConversationDatabase.Scalar(Database, "SELECT COALESCE(MAX(position),-1)+1 FROM projects"));
        foreach (var Project in NewProjectList)
        {
            ConversationDatabase.Execute(Database, "INSERT INTO projects SELECT * FROM source.projects WHERE id=$id", ("$id", Project.Id));
            ConversationDatabase.Execute(Database, "UPDATE projects SET position=$position WHERE id=$id", ("$position", Position++), ("$id", Project.Id));
            int Roots = ConversationDatabase.Execute(Database, "INSERT INTO project_roots SELECT * FROM source.project_roots WHERE project_id=$id", ("$id", Project.Id));
            if (Roots == 0)
            {
                for (int Index = 0; Index < Project.RootList.Count; Index++)
                    ConversationDatabase.Execute(Database, "INSERT INTO project_roots(project_id,position,path) VALUES($id,$position,$path)", ("$id", Project.Id), ("$position", Index), ("$path", Project.RootList[Index]));
            }
            ConversationDatabase.Execute(Database, "INSERT INTO project_idempotency_keys SELECT * FROM source.project_idempotency_keys s WHERE s.project_id=$id AND NOT EXISTS(SELECT 1 FROM project_idempotency_keys t WHERE t.key=s.key)", ("$id", Project.Id));
        }
    }

    private static bool SameRoots(List<string> LeftList, List<string> RightList) => LeftList.Count == RightList.Count && LeftList.All(Left => RightList.Any(Right => ManagerPaths.Same(Left, Right)));
    #endregion

    #region Thread state
    private void MergeThreads(JsonObject Source, ConversationImportPlan Plan)
    {
        var ThreadHashList = Plan.ConversationList.Select(Item => Item.Id).ToHashSet(StringComparer.Ordinal);
        foreach (string Key in new[] { "thread-project-assignments", "thread-project-membership-host-ids", "thread-writable-roots", "thread-projectless-output-directories", "thread-workspace-root-hints" })
        {
            if (Source[Key] is not JsonObject Values) continue;
            var Target = Object(Result, Key);
            foreach (var Pair in Values.Where(Item => ThreadHashList.Contains(Item.Key)))
            {
                JsonNode? Value = Pair.Value?.DeepClone();
                if (Key == "thread-project-assignments" && Value is not null)
                {
                    string? LegacyId = LocalProjectId(Value);
                    if (LegacyId is null || !LegacyIdDict.TryGetValue(LegacyId, out string? TargetId)) continue;
                    Value["projectId"] = TargetId;
                }
                Target[Pair.Key] = Value;
            }
        }
        foreach (string Key in new[] { "projectless-thread-ids", "pinned-thread-ids" })
        {
            if (Source[Key] is not JsonArray Values) continue;
            var Target = Array(Result, Key);
            foreach (var Value in Values)
            {
                string Id = Value!.GetValue<string>();
                if (ThreadHashList.Contains(Id)) AppendUnique(Target, Id);
            }
        }
        if (Source["sidebar-project-thread-orders"] is JsonObject Orders)
        {
            foreach (var Pair in Orders)
            {
                if (!LegacyIdDict.TryGetValue(Pair.Key, out string? ProjectId) || Pair.Value is not JsonArray Values) continue;
                var Target = Array(Object(Result, "sidebar-project-thread-orders"), ProjectId);
                foreach (var Value in Values)
                {
                    string Id = Value!.GetValue<string>();
                    if (ThreadHashList.Contains(Id)) AppendUnique(Target, Id);
                }
            }
        }
    }

    public string? ProjectForThread(string Id, JsonObject Source)
    {
        string? LegacyId = LocalProjectId((Source["thread-project-assignments"] as JsonObject)?[Id]);
        return LegacyId is not null && ProjectIdDict.TryGetValue(LegacyId, out string? TargetId) ? TargetId : null;
    }

    private static string? LocalProjectId(JsonNode? Value)
    {
        if (Value is null) return null;
        var Assignment = Value.AsObject();
        return Assignment["projectKind"]?.GetValue<string>() == "local" ? Assignment["projectId"]!.GetValue<string>() : null;
    }

    private static JsonObject? LocalHostObject(JsonObject State, string Key, string Home)
    {
        if (State[Key] is not JsonObject Hosts) return null;
        return Hosts.FirstOrDefault(Pair => Pair.Key.StartsWith("local:", StringComparison.Ordinal) && ManagerPaths.Same(Pair.Key[6..], Home)).Value as JsonObject;
    }

    private static JsonObject HostObject(JsonObject State, string Key, string Home)
    {
        var Hosts = Object(State, Key);
        string? Existing = Hosts.FirstOrDefault(Pair => Pair.Key.StartsWith("local:", StringComparison.Ordinal) && ManagerPaths.Same(Pair.Key[6..], Home)).Key;
        return Object(Hosts, Existing ?? "local:" + ManagerPaths.Normalize(Home));
    }

    private static JsonObject Object(JsonObject Parent, string Key)
    {
        if (Parent[Key] is null) Parent[Key] = new JsonObject();
        return Parent[Key]!.AsObject();
    }

    private static JsonArray Array(JsonObject Parent, string Key)
    {
        if (Parent[Key] is null) Parent[Key] = new JsonArray();
        return Parent[Key]!.AsArray();
    }

    private static void AppendUnique(JsonArray Target, string Id)
    {
        if (!Target.Any(Item => Item?.GetValue<string>() == Id)) Target.Add(Id);
    }

    private static string Literal(string Value) => "'" + Value.Replace("'", "''") + "'";
    #endregion
}
