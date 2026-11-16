namespace CodexInstanceManager;

public static class FormationPresets
{
    public static List<FormationMember> Members(string Preset, string InstanceId, string Model = "", string Effort = "")
    {
        eFormationRole[] RoleList = Preset switch
        {
            "basic" => new[] { eFormationRole.Coordinator, eFormationRole.Executor },
            "reviewed" => new[] { eFormationRole.Coordinator, eFormationRole.Executor, eFormationRole.Executor, eFormationRole.Reviewer },
            _ => throw new InvalidOperationException("未知编队预设 " + Preset)
        };
        return RoleList.Select(Role => new FormationMember { Role = Role, InstanceId = InstanceId, Model = Model, Effort = Effort }).ToList();
    }
}
