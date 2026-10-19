using System.Buffers.Binary;
using System.Text;
using System.Text.Json;

namespace CodexInstanceManager;

public static class RelayWire
{
    public static async Task WriteAsync(Stream Stream, object Message, int Limit, CancellationToken Cancellation)
    {
        byte[] DataList = JsonSerializer.SerializeToUtf8Bytes(Message);
        if (DataList.Length > Limit) throw new InvalidDataException("通信消息超过容量限制");
        byte[] HeaderList = new byte[sizeof(int)];
        BinaryPrimitives.WriteInt32LittleEndian(HeaderList, DataList.Length);
        await Stream.WriteAsync(HeaderList, Cancellation);
        await Stream.WriteAsync(DataList, Cancellation);
        await Stream.FlushAsync(Cancellation);
    }

    public static async Task<JsonElement> ReadAsync(Stream Stream, int Limit, CancellationToken Cancellation)
    {
        byte[] HeaderList = new byte[sizeof(int)];
        await Stream.ReadExactlyAsync(HeaderList, Cancellation);
        int Length = BinaryPrimitives.ReadInt32LittleEndian(HeaderList);
        if (Length <= 0 || Length > Limit) throw new InvalidDataException("通信帧长度不合法 " + Length);
        byte[] DataList = new byte[Length];
        await Stream.ReadExactlyAsync(DataList, Cancellation);
        using var Document = JsonDocument.Parse(DataList);
        return Document.RootElement.Clone();
    }

    public static async Task<string?> ReadLineAsync(Stream Stream, CancellationToken Cancellation)
    {
        using var Buffer = new MemoryStream();
        byte[] ByteList = new byte[1];
        while (await Stream.ReadAsync(ByteList, Cancellation) != 0)
        {
            if (ByteList[0] == '\n') return Encoding.UTF8.GetString(Buffer.GetBuffer(), 0, (int)Buffer.Length).TrimEnd('\r');
            if (Buffer.Length >= RelayLimits.MaxFrameBytes) throw new InvalidDataException("MCP 请求超过容量限制");
            Buffer.WriteByte(ByteList[0]);
        }
        return Buffer.Length == 0 ? null : throw new EndOfStreamException("MCP 请求未结束");
    }
}
