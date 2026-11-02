namespace CodexInstanceManager;

public static class AgentDisplay
{
    public static string Instance(ManagerSettings Settings, string InstanceId, string RecordedName)
    {
        if (InstanceId == CursorRelayRunner.InstanceId) return "Cursor";
        if (InstanceId.Equals("dsh", StringComparison.OrdinalIgnoreCase)) return "DSH";
        return Settings.InstanceList.FirstOrDefault(Item => Item.Id == InstanceId)?.Name ?? RecordedName;
    }

    public static string Session(ManagerSettings Settings, string InstanceId, string RecordedName, string Title, string ThreadId) =>
        Instance(Settings, InstanceId, RecordedName) + "：" + (Title.Length == 0 ? ThreadId : Title);
}
