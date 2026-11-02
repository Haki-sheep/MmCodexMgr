using System.Text.Json;

namespace CodexInstanceManager;

public sealed record CursorSession(string Id, string Title, string Cwd, string Model, string CliPath)
{
    public string LastTaskId { get; init; } = "";
}
public sealed record CursorReport(string Outcome, string Summary, List<string> Artifacts);

public sealed class CursorSessionStore
{
    private readonly string Root;
    public CursorSessionStore(string Root) => this.Root = Root;

    public List<CursorSession> List(string? Selector, int Offset)
    {
        if (Offset < 0) throw new ArgumentOutOfRangeException(nameof(Offset));
        if (!Directory.Exists(Root)) return new();
        return Directory.EnumerateFiles(Root, "*.json").Select(PathValue => JsonSerializer.Deserialize<CursorSession>(File.ReadAllBytes(PathValue)) ?? throw new InvalidDataException("Cursor 会话记录为空 " + PathValue))
            .Where(Item => Selector is null || Item.Id == Selector || Item.Title == Selector).OrderBy(Item => Item.Id).Skip(Offset).Take(RelayLimits.PageSize).ToList();
    }

    public CursorSession Get(string Id)
    {
        RequireId(Id);
        string PathValue = Path.Combine(Root, Id + ".json");
        return File.Exists(PathValue) ? JsonSerializer.Deserialize<CursorSession>(File.ReadAllBytes(PathValue)) ?? throw new InvalidDataException("Cursor 会话记录为空 " + Id) : throw new InvalidOperationException("管理器未登记此 Cursor CLI 会话 " + Id);
    }

    public void Save(CursorSession Item)
    {
        RequireId(Item.Id);
        SettingsStore.AtomicWrite(Path.Combine(Root, Item.Id + ".json"), JsonSerializer.SerializeToUtf8Bytes(Item));
    }

    private static void RequireId(string Id)
    {
        if (!Guid.TryParseExact(Id, "D", out _)) throw new InvalidDataException("Cursor 会话 ID 必须为标准 UUID " + Id);
    }
}
