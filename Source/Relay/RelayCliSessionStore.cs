using System.Text.Json;

namespace CodexInstanceManager;

public sealed record RelayCliSession(string Id, string Title, string Cwd, string Model, string CliPath)
{
    public string LastTaskId { get; init; } = "";
}
public sealed class RelayCliSessionStore
{
    private readonly string Root;
    private readonly string Agent;

    public RelayCliSessionStore(string Root, string Agent = "Cursor")
    {
        this.Root = Root;
        this.Agent = Agent;
    }

    public List<RelayCliSession> List(string? Selector, int Offset)
    {
        if (Offset < 0) throw new ArgumentOutOfRangeException(nameof(Offset));
        if (!Directory.Exists(Root)) return new();
        return Directory.EnumerateFiles(Root, "*.json").Select(Read)
            .Where(Item => Selector is null || Item.Id == Selector || Item.Title == Selector).OrderBy(Item => Item.Id).Skip(Offset).Take(RelayLimits.PageSize).ToList();
    }

    public RelayCliSession Get(string Id)
    {
        RequireId(Id);
        string PathValue = Path.Combine(Root, Id + ".json");
        return File.Exists(PathValue) ? Read(PathValue) : throw new InvalidOperationException("管理器未登记此 " + Agent + " CLI 会话 " + Id);
    }

    public void Save(RelayCliSession Item)
    {
        RequireId(Item.Id);
        SettingsStore.AtomicWrite(Path.Combine(Root, Item.Id + ".json"), JsonSerializer.SerializeToUtf8Bytes(Item));
    }

    private RelayCliSession Read(string PathValue) => JsonSerializer.Deserialize<RelayCliSession>(File.ReadAllBytes(PathValue)) ?? throw new InvalidDataException(Agent + " 会话记录为空 " + PathValue);

    private void RequireId(string Id)
    {
        if (!Guid.TryParseExact(Id, "D", out _)) throw new InvalidDataException(Agent + " 会话 ID 必须为标准 UUID " + Id);
    }
}
