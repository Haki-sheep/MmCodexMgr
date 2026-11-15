using System.Text.Json;
using CodexInstanceManager;

internal static class AntigravityTests
{
    public static int Run()
    {
        const string RequestId = "owned-request";
        var History = JsonSerializer.Deserialize<List<JsonElement>>("""
            [
              {"userInput":{"clientMessageId":"different-request"}},
              {"status":"CORTEX_STEP_STATUS_DONE","plannerResponse":{"response":"old"}},
              {"userInput":{"clientMessageId":"owned-request"}},
              {"status":"CORTEX_STEP_STATUS_DONE","plannerResponse":{"response":"{\"outcome\":\"completed\",\"summary\":\"owned\",\"artifacts\":[]}"}}
            ]
            """)!;
        Require(AntigravityRelayRunner.ReadTurn(RequestId, History.Take(2).ToList(), true, out bool Found) is null && !Found, "old reply must not be attributed to the current request");
        Require(AntigravityRelayRunner.ReadTurn(RequestId, History, false, out Found) is null && Found, "streamed reply must wait for the desktop turn to finish");
        Require(AntigravityRelayRunner.ReadTurn(RequestId, History, true, out Found)?.Summary == "owned" && Found, "completed reply must match the request");

        var Waiting = JsonSerializer.SerializeToElement(new { status = "CORTEX_STEP_STATUS_WAITING" });
        History.Add(Waiting);
        Require(AntigravityRelayRunner.ReadTurn(RequestId, History, true, out _) is null, "outstanding approval must block completion");
        History.RemoveAt(History.Count - 1);
        var NextInput = JsonSerializer.SerializeToElement(new { userInput = new { clientMessageId = "next-request" } });
        History.Add(NextInput);
        Require(AntigravityRelayRunner.ReadTurn(RequestId, History, true, out _)?.Outcome == "needs_decision", "a later user turn must not be used to complete this task");
        var Skill = SkillDistribution.Scan().Single(Target => Target.Agent == "antigravity");
        string Home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        Require(ManagerPaths.Same(Skill.PathValue, Path.Combine(Home, ".gemini", "config", "skills")), "the App must receive skills in its shared global folder");
        Console.WriteLine("PASS Antigravity request attribution, completion gates, and Skill discovery target");
        return 0;
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new InvalidOperationException(Message);
    }
}
