using System.Text.Json.Nodes;

namespace CodexInstanceManager;

public static class ResponsesCompatInput
{
    public static byte[] Rewrite(byte[] Body)
    {
        var Request = JsonNode.Parse(Body)?.AsObject() ?? throw new InvalidDataException("Responses 请求为空");
        if (Request["input"] is not JsonArray InputList) return Body;
        bool Changed = false;
        for (int Index = 0; Index < InputList.Count; Index++)
        {
            if (InputList[Index] is not JsonObject Item || Item["type"]?.GetValue<string>() != "function_call_output" || Item.ContainsKey("call_id")) continue;
            if (Item["namespace"]?.GetValue<string>() != "codex_app" || Item["name"]?.GetValue<string>() is not ("send_message_to_thread" or "create_thread" or "handoff_thread")) continue;
            if (string.IsNullOrWhiteSpace(Item["id"]?.GetValue<string>())) throw new InvalidDataException("联调工具结果缺少 id");
            if (Item["output"] is not JsonValue Output || !Output.TryGetValue<string>(out string? Text)) throw new InvalidDataException("联调工具结果不是受支持的文本输入");
            InputList[Index] = new JsonObject
            {
                ["role"] = "user",
                ["content"] = new JsonArray(new JsonObject { ["type"] = "input_text", ["text"] = Text })
            };
            Changed = true;
        }
        return Changed ? System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(Request) : Body;
    }
}
