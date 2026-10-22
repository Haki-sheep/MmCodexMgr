using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json.Nodes;
using CodexInstanceManager;

internal static class ResponsesCompatTests
{
    private static int Count;

    #region Verification
    public static int Run()
    {
        VerifyInput();
        VerifyConfig();
        Task.Run(VerifyServerAsync).GetAwaiter().GetResult();
        Console.WriteLine("PASS Responses compatibility " + Count + " assertions");
        return 0;
    }

    public static int VerifyInstallation(string CliPath)
    {
        string Root = Path.Combine(Path.GetTempPath(), "MmCodexResponsesCompat-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
        var Instance = new InstanceProfile { HomePath = Root };
        string ConfigPath = Path.Combine(Root, "config.toml");
        string Original = "model='keep-model'\nmodel_reasoning_effort='max'\nmodel_provider='custom'\n[model_providers.custom]\nbase_url='https://opencode.ai/zen/go/v1' # keep\nexperimental_bearer_token='fixture-secret'\n";
        File.WriteAllText(ConfigPath, Original);
        var Profile = ResponsesCompatProfile.Install(Instance, CliPath);
        Require(File.ReadAllText(Profile.BackupPath) == Original, "installation backs up exact original config");
        Require(ResponsesCompatProfile.Install(Instance, CliPath).Id == Profile.Id, "installation is idempotent and reuses the service");
        Require(File.ReadAllText(ConfigPath).Contains(Profile.LocalUrl) && File.ReadAllText(ConfigPath).Contains("model_reasoning_effort='max'"), "installation activates local routing without changing model settings");
        File.AppendAllText(ConfigPath, "new_user_setting='keep user edit'\n");
        ResponsesCompatProfile.Remove(Instance);
        string Restored = File.ReadAllText(ConfigPath);
        Require(Restored.Contains("https://opencode.ai/zen/go/v1") && Restored.Contains("new_user_setting='keep user edit'") && Restored.Contains("experimental_bearer_token='fixture-secret'"), "removal restores URL without rolling back unrelated edits");
        Require(!File.Exists(Path.Combine(Root, ResponsesCompatProfile.FileName)), "removal releases the profile so the background listener exits");
        bool Stopped = false;
        for (int Index = 0; Index < 40; Index++)
        {
            if (!System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners().Any(Item => Item.Port == Profile.Port)) { Stopped = true; break; }
            Thread.Sleep(50);
        }
        Require(Stopped, "background listener stops after removing its profile");
        Console.WriteLine("PASS Responses compatibility installation " + Count + " assertions");
        return 0;
    }

    private static void VerifyInput()
    {
        var InputList = new JsonArray();
        foreach (string Name in new[] { "send_message_to_thread", "create_thread", "handoff_thread" }) InputList.Add(Envelope(Name));
        var NormalCall = new JsonObject { ["type"] = "function_call", ["call_id"] = "real-call", ["name"] = "work", ["arguments"] = "{}" };
        var NormalResult = Envelope("send_message_to_thread"); NormalResult["call_id"] = "real-call";
        var InvalidResult = Envelope("send_message_to_thread"); InvalidResult["call_id"] = null;
        var OtherNamespace = Envelope("send_message_to_thread"); OtherNamespace["namespace"] = "another_app";
        var OtherTool = Envelope("another_tool");
        InputList.Add(NormalCall); InputList.Add(NormalResult); InputList.Add(InvalidResult); InputList.Add(OtherNamespace); InputList.Add(OtherTool);
        var Request = new JsonObject { ["input"] = InputList, ["model"] = "keep-model", ["reasoning"] = new JsonObject { ["effort"] = "max" }, ["stream"] = true, ["tools"] = new JsonArray() };
        var Result = JsonNode.Parse(ResponsesCompatInput.Rewrite(Encoding.UTF8.GetBytes(Request.ToJsonString())))!;
        for (int Index = 0; Index < 3; Index++)
        {
            var Item = Result["input"]![Index]!;
            Require(Item["role"]!.GetValue<string>() == "user" && Item["content"]![0]!["text"]!.GetValue<string>() == "<codex_delegation>任务原文\n&amp;</codex_delegation>", "delegation text and attribution remain intact in user role");
        }
        for (int Index = 3; Index < InputList.Count; Index++) Require(JsonNode.DeepEquals(Result["input"]![Index], InputList[Index]), "paired outputs and unrelated or malformed envelopes are not reinterpreted");
        Require(JsonNode.DeepEquals(Result["reasoning"], Request["reasoning"]) && JsonNode.DeepEquals(Result["tools"], Request["tools"]) && Result["model"]!.GetValue<string>() == "keep-model", "model effort and tool configuration survive normalization");
        byte[] Original = Encoding.UTF8.GetBytes("{\n  \"input\":\"ordinary user text\",\"stream\":true\n}");
        Require(ReferenceEquals(Original, ResponsesCompatInput.Rewrite(Original)), "ordinary requests retain exact original bytes");
        var Malformed = Envelope("create_thread"); Malformed["output"] = new JsonArray(new JsonObject { ["type"] = "input_image" });
        bool Rejected = false;
        try { ResponsesCompatInput.Rewrite(Encoding.UTF8.GetBytes(new JsonObject { ["input"] = new JsonArray(Malformed) }.ToJsonString())); }
        catch (InvalidDataException) { Rejected = true; }
        Require(Rejected, "unsupported delegated content fails explicitly without discarding content");
    }

    private static void VerifyConfig()
    {
        string Original = "# keep\r\nmodel='keep-model'\r\nmodel_reasoning_effort='max'\r\n[model_providers.'custom.test']\r\nname='keep'\r\nbase_url = 'https://opencode.ai/zen/go/v1' # keep URL comment\r\nexperimental_bearer_token='KEEP_SECRET'\r\n[model_providers.other]\r\nbase_url='https://unrelated.example/v1'\r\n";
        string Updated = ResponsesCompatProfile.RewriteUrl(Original, "custom.test", "https://opencode.ai/zen/go/v1", "http://127.0.0.1:45267");
        Require(Updated == Original.Replace("'https://opencode.ai/zen/go/v1'", "\"http://127.0.0.1:45267\""), "only the selected base URL value changes including for quoted provider keys");
        string WithUserEdit = Updated.Replace("name='keep'", "name='user edit'");
        string Restored = ResponsesCompatProfile.RewriteUrl(WithUserEdit, "custom.test", "http://127.0.0.1:45267", "https://opencode.ai/zen/go/v1");
        Require(Restored.Contains("name='user edit'") && Restored.Contains("experimental_bearer_token='KEEP_SECRET'") && Restored.Contains("# keep URL comment"), "removal preserves later user edits secrets and comments");
        bool Rejected = false;
        try { ResponsesCompatProfile.RewriteUrl(Original, "custom.test", "http://127.0.0.1:45267", "https://opencode.ai/zen/go/v1"); }
        catch (InvalidOperationException) { Rejected = true; }
        Require(Rejected, "unexpected provider changes fail instead of overwriting config");
    }

    private static async Task VerifyServerAsync()
    {
        var Profile = new ResponsesCompatProfile { Port = FreePort(), UpstreamUrl = "http://127.0.0.1:" + FreePort() + "/zen/go/v1" };
        using var Upstream = new HttpListener();
        Upstream.Prefixes.Add(Profile.UpstreamUrl[..Profile.UpstreamUrl.IndexOf("/zen", StringComparison.Ordinal)] + "/");
        Upstream.Start();
        var ErrorList = new System.Collections.Concurrent.ConcurrentQueue<Exception>();
        using var Cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var Server = new ResponsesCompatServer(Profile, ErrorList.Enqueue);
        var Run = Server.RunAsync(Cancellation.Token);
        using var Client = new HttpClient(new SocketsHttpHandler { UseProxy = false });
        var Final = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var Handle = Task.Run(async () =>
        {
            var Context = await Upstream.GetContextAsync().WaitAsync(Cancellation.Token);
            Require(Context.Request.RawUrl == "/zen/go/v1/responses", "upstream path is fixed to the original provider");
            Require(Context.Request.Headers["Authorization"] == "Bearer test-key" && Context.Request.Headers["x-opencode-session"] == "test-session", "authorization and upstream routing headers are preserved");
            string Body = await new StreamReader(Context.Request.InputStream).ReadToEndAsync(Cancellation.Token);
            Require(JsonNode.Parse(Body)!["input"]![0]!["role"]!.GetValue<string>() == "user", "actual HTTP forwarding normalizes historical standalone tool output");
            Context.Response.ContentType = "text/event-stream";
            Context.Response.Headers["x-upstream-probe"] = "preserved";
            Context.Response.SendChunked = true;
            await Context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes("data: first\n\n"), Cancellation.Token);
            await Context.Response.OutputStream.FlushAsync(Cancellation.Token);
            await Final.Task.WaitAsync(Cancellation.Token);
            await Context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes("data: last\n\n"), Cancellation.Token);
            Context.Response.Close();
        });
        var Payload = new JsonObject { ["input"] = new JsonArray(Envelope("send_message_to_thread")), ["model"] = "keep-model" };
        using var Request = new HttpRequestMessage(HttpMethod.Post, Profile.LocalUrl + "/responses") { Content = new StringContent(Payload.ToJsonString(), Encoding.UTF8, "application/json") };
        Request.Headers.Add("Authorization", "Bearer test-key"); Request.Headers.Add("x-opencode-session", "test-session");
        using (var Response = await Client.SendAsync(Request, HttpCompletionOption.ResponseHeadersRead, Cancellation.Token))
        {
            Require(Response.StatusCode == HttpStatusCode.OK && Response.Headers.GetValues("x-upstream-probe").Single() == "preserved", "stream status and response headers pass through");
            using var Reader = new StreamReader(await Response.Content.ReadAsStreamAsync(Cancellation.Token));
            Require(await Reader.ReadLineAsync(Cancellation.Token) == "data: first", "first SSE chunk arrives before upstream completion");
            Final.SetResult();
            Require((await Reader.ReadToEndAsync(Cancellation.Token)).Contains("data: last"), "remaining SSE output is forwarded intact");
        }
        await Handle;
        var ErrorHandle = Task.Run(async () =>
        {
            var Context = await Upstream.GetContextAsync().WaitAsync(Cancellation.Token);
            Context.Response.StatusCode = 503;
            Context.Response.ContentType = "application/json";
            await Context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes("{\"error\":\"original upstream failure\"}"), Cancellation.Token);
            Context.Response.Close();
        });
        using (var Response = await Client.PostAsync(Profile.LocalUrl + "/responses", new StringContent("{\"input\":\"ordinary\"}"), Cancellation.Token))
            Require((int)Response.StatusCode == 503 && await Response.Content.ReadAsStringAsync(Cancellation.Token) == "{\"error\":\"original upstream failure\"}", "upstream errors are preserved without retry or fallback");
        await ErrorHandle;
        using (var Response = await Client.GetAsync(Profile.LocalUrl + "/other", Cancellation.Token)) Require((int)Response.StatusCode == 404, "proxy rejects unrelated destinations and routes");
        using (var Response = await Client.PostAsync(Profile.LocalUrl + "/responses", new StringContent("bad-json"), Cancellation.Token)) Require((int)Response.StatusCode == 400 && (await Response.Content.ReadAsStringAsync(Cancellation.Token)).Contains("mmcodex_compat_error"), "local parse failure remains explicit");
        Require(ErrorList.Count == 1 && ErrorList.Single() is System.Text.Json.JsonException, "local diagnostics report the first actual parsing error");
        Cancellation.Cancel();
        await Run;
    }
    #endregion

    #region Fixtures
    private static JsonObject Envelope(string Name) => new() { ["type"] = "function_call_output", ["id"] = "fco-test", ["namespace"] = "codex_app", ["name"] = Name, ["output"] = "<codex_delegation>任务原文\n&amp;</codex_delegation>" };

    private static int FreePort()
    {
        var Reservation = new TcpListener(IPAddress.Loopback, 0);
        Reservation.Start();
        int Port = ((IPEndPoint)Reservation.LocalEndpoint).Port;
        Reservation.Stop();
        return Port;
    }

    private static void Require(bool Condition, string Message)
    {
        if (!Condition) throw new Exception("FAILED Responses compatibility: " + Message);
        Interlocked.Increment(ref Count);
    }
    #endregion
}
