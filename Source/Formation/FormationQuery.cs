using System.Text.Json;

namespace CodexInstanceManager;

internal sealed record FormationQuery(bool Full, string? Section, int Offset)
{
    private const int PageSize = 20;

    public static FormationQuery Parse(string Action, JsonElement Arguments)
    {
        if (Arguments.ValueKind != JsonValueKind.Object) throw new InvalidOperationException("编队请求必须是 JSON 对象");
        string? View = Arguments.TryGetProperty("view", out var ViewValue) ? ViewValue.GetString() : null;
        string? Section = Arguments.TryGetProperty("section", out var SectionValue) ? SectionValue.GetString() : null;
        bool HasOffset = Arguments.TryGetProperty("offset", out var OffsetValue);
        int Offset = HasOffset ? OffsetValue.GetInt32() : 0;
        if (View is not (null or "summary" or "full") || Offset < 0 || View == "full" && (Section is not null || HasOffset) ||
            Action == "list" && Section is not null || Action == "task-show" && Section is null && HasOffset)
            throw new InvalidOperationException("编队查询参数无效 请核对 view section offset");
        return new(View == "full", Section, Offset);
    }

    public object Format(object Result)
    {
        if (Full) return Result;
        return Result switch
        {
            List<FormationRun> RunList => new
            {
                run_list = RunList.Skip(Offset).Take(PageSize).Select(Run => new
                {
                    Run.Id, Run.Theme, Run.Status, Run.State, Run.Archived, Run.CreatedAt,
                    task_count = Run.TaskList.Count
                }).ToArray(),
                total = RunList.Count,
                next_offset = NextOffset(RunList.Count, Offset, PageSize)
            },
            FormationRun Run => Section is null ? DescribeRun(Run, Offset) : ReadRunSection(Run),
            FormationTask TaskItem => Section is null ? DescribeTask(TaskItem) : ReadTaskSection(TaskItem),
            _ => throw new InvalidOperationException("编队查询返回未知类型")
        };
    }

    public static object DescribeRun(FormationRun Run, int Offset = 0) => new
    {
        Run.Id, Run.Theme, Run.SetupOnly, Run.State, Run.Status, Run.Archived, Run.RemovedFromView,
        Run.TemplateId, Run.TemplateVersion, Run.MaxParallel, Run.CreatedAt, Run.ActivationState,
        activation_detail = RelayLimits.Excerpt(Run.ActivationDetail, 640),
        final_summary = RelayLimits.Excerpt(Run.FinalSummary, 640),
        Run.ContextVersion, Run.RequirementVersion, Run.MemberList,
        revision_list = Run.RevisionList.TakeLast(1).ToArray(),
        task_list = Run.TaskList.Skip(Offset).Take(PageSize).Select(TaskStatus).ToArray(),
        task_count = Run.TaskList.Count,
        next_offset = NextOffset(Run.TaskList.Count, Offset, PageSize)
    };

    private static object TaskStatus(FormationTask Item) => new
    {
        Item.Id, Item.Title, Item.State, Item.ExecutorId, Item.ReviewerId
    };

    private static object DescribeTask(FormationTask Item) => new
    {
        Item.Id, Item.Title, Item.State, Item.ExecutorId, Item.ReviewerId, Item.Instructions, Item.Acceptance,
        Item.Workspace, Item.ResumeState,
        processing_detail = RelayLimits.Excerpt(Item.ProcessingDetail, 640),
        attempt_count = Item.AttemptList.Count,
        submission_count = Item.SubmissionList.Count,
        review_count = Item.ReviewList.Count,
        latest_attempt = Item.AttemptList.TakeLast(1).Select(Attempt => new
        {
            Attempt.Id, Attempt.Kind, Attempt.State, Attempt.MemberId, Attempt.SessionId, Attempt.RelayId, Attempt.NativeAgentId
        }).SingleOrDefault(),
        latest_submission = Item.SubmissionList.TakeLast(1).Select(Submission => new
        {
            Submission.Id, Submission.AttemptId, Submission.RequirementVersion, Submission.At,
            summary = RelayLimits.Excerpt(Submission.Summary, 640),
            artifact_count = Submission.ArtifactList.Count
        }).SingleOrDefault(),
        latest_review = Item.ReviewList.TakeLast(1).Select(Review => Review with { Feedback = RelayLimits.Excerpt(Review.Feedback, 640) }).SingleOrDefault()
    };

    private object ReadRunSection(FormationRun Run) => Section switch
    {
        "revision_list" => ReadEntry(Run.RevisionList),
        "event_list" => ReadEntry(Run.EventList),
        "handoff_list" => ReadEntry(Run.HandoffList),
        "notification_list" => ReadEntry(Run.NotificationList),
        "archive_snapshot" => ReadEntry(Run.ArchiveSnapshot),
        "lifecycle_operation" => ReadEntry(new[] { Run.LifecycleOperation }),
        "activation_detail" => ReadEntry(new[] { Run.ActivationDetail }),
        "final_summary" => ReadEntry(new[] { Run.FinalSummary }),
        _ => throw new InvalidOperationException("未知编队详情 section " + Section)
    };

    private object ReadTaskSection(FormationTask Item) => Section switch
    {
        "attempt_list" => ReadEntry(Item.AttemptList),
        "submission_list" => ReadEntry(Item.SubmissionList),
        "review_list" => ReadEntry(Item.ReviewList),
        "processing_detail" => ReadEntry(new[] { Item.ProcessingDetail }),
        _ => throw new InvalidOperationException("未知任务详情 section " + Section)
    };

    private object ReadEntry<T>(IReadOnlyList<T> ItemList) => new
    {
        section = Section,
        offset = Offset,
        total = ItemList.Count,
        items = ItemList.Skip(Offset).Take(1).ToArray(),
        next_offset = NextOffset(ItemList.Count, Offset, 1)
    };

    private static int? NextOffset(int Count, int Offset, int Size) => Count - Offset > Size ? Offset + Size : null;
}
