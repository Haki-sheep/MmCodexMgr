using Microsoft.Data.Sqlite;

namespace CodexInstanceManager;

internal static class ConversationDatabase
{
    public static SqliteConnection Open(string PathValue, bool ReadOnly = false)
    {
        var Connection = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = PathValue, Mode = ReadOnly ? SqliteOpenMode.ReadOnly : SqliteOpenMode.ReadWrite, Pooling = false }.ToString());
        try
        {
            Connection.Open();
            Execute(Connection, "PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA cache_size=-2048;");
            return Connection;
        }
        catch { Connection.Dispose(); throw; }
    }

    public static void Snapshot(string Source, string Destination)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Destination)!);
        using var Input = Open(Source, true);
        using var Output = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = Destination, Pooling = false }.ToString());
        Output.Open();
        Input.BackupDatabase(Output);
        Execute(Output, "PRAGMA journal_mode=DELETE;");
    }

    public static int Execute(SqliteConnection Connection, string Sql, params (string Name, object? Value)[] ParameterList)
    {
        using var Command = Connection.CreateCommand();
        Command.CommandText = Sql;
        foreach (var Parameter in ParameterList) Command.Parameters.AddWithValue(Parameter.Name, Parameter.Value ?? DBNull.Value);
        return Command.ExecuteNonQuery();
    }

    public static object? Scalar(SqliteConnection Connection, string Sql, params (string Name, object? Value)[] ParameterList)
    {
        using var Command = Connection.CreateCommand();
        Command.CommandText = Sql;
        foreach (var Parameter in ParameterList) Command.Parameters.AddWithValue(Parameter.Name, Parameter.Value ?? DBNull.Value);
        object? Value = Command.ExecuteScalar();
        return Value is DBNull ? null : Value;
    }

    public static List<Dictionary<string, object?>> Rows(SqliteConnection Connection, string Sql)
    {
        using var Command = Connection.CreateCommand();
        Command.CommandText = Sql;
        using var Reader = Command.ExecuteReader();
        var ResultList = new List<Dictionary<string, object?>>();
        while (Reader.Read())
        {
            var Row = new Dictionary<string, object?>();
            for (int Index = 0; Index < Reader.FieldCount; Index++) Row[Reader.GetName(Index)] = Reader.IsDBNull(Index) ? null : Reader.GetValue(Index);
            ResultList.Add(Row);
        }
        return ResultList;
    }

    public static string Quote(string Name) => "\"" + Name.Replace("\"", "\"\"") + "\"";

    public static void AttachSource(SqliteConnection Connection, string Source)
    {
        Execute(Connection, "ATTACH DATABASE $path AS source;", ("$path", Source));
        string MainSchema = string.Join('\n', Rows(Connection, "SELECT name,sql FROM main.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").Select(Row => Row["name"] + ":" + Row["sql"]));
        string SourceSchema = string.Join('\n', Rows(Connection, "SELECT name,sql FROM source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").Select(Row => Row["name"] + ":" + Row["sql"]));
        if (MainSchema != SourceSchema) throw new InvalidOperationException("两个实例的数据库结构不同 请先使用同一版本启动两个实例再退出重试");
        long Differences = Convert.ToInt64(Scalar(Connection, "SELECT COUNT(*) FROM (SELECT version,checksum FROM main._sqlx_migrations EXCEPT SELECT version,checksum FROM source._sqlx_migrations)"));
        Differences += Convert.ToInt64(Scalar(Connection, "SELECT COUNT(*) FROM (SELECT version,checksum FROM source._sqlx_migrations EXCEPT SELECT version,checksum FROM main._sqlx_migrations)"));
        if (Differences != 0) throw new InvalidOperationException("两个实例的数据库迁移版本不同 请先更新并启动目标实例");
    }

    public static void AttachDesktopSource(SqliteConnection Connection, string Source)
    {
        Execute(Connection, "ATTACH DATABASE $path AS source;", ("$path", Source));
        foreach (string Table in new[] { "local_thread_catalog", "local_thread_catalog_hosts", "local_thread_catalog_sync_state", "local_thread_catalog_scan_checkpoints", "local_thread_catalog_scan_entries", "local_thread_catalog_metadata", "thread_timeline_ledger" })
        {
            string? MainSql = Scalar(Connection, "SELECT sql FROM main.sqlite_master WHERE name=$name", ("$name", Table)) as string;
            string? SourceSql = Scalar(Connection, "SELECT sql FROM source.sqlite_master WHERE name=$name", ("$name", Table)) as string;
            if (MainSql is null || MainSql != SourceSql) throw new InvalidOperationException("两个实例的侧边栏数据库结构不同 请先使用同一版本启动两个实例");
        }
    }

    public static void AddThreadMap(SqliteConnection Connection, ConversationImportPlan Plan)
    {
        Execute(Connection, "CREATE TEMP TABLE import_threads (id TEXT PRIMARY KEY, rollout_path TEXT NOT NULL);");
        using var Transaction = Connection.BeginTransaction();
        using var Command = Connection.CreateCommand();
        Command.Transaction = Transaction;
        Command.CommandText = "INSERT INTO import_threads VALUES ($id,$path)";
        var Id = Command.Parameters.Add("$id", SqliteType.Text);
        var PathValue = Command.Parameters.Add("$path", SqliteType.Text);
        foreach (var Thread in Plan.ConversationList)
        {
            Id.Value = Thread.Id;
            PathValue.Value = ImportPaths.Resolve(Plan.Destination.HomePath, Thread.RelativePath);
            Command.ExecuteNonQuery();
        }
        Transaction.Commit();
    }

    public static void AddMap(SqliteConnection Connection, string Table, Dictionary<string, string> Map)
    {
        Execute(Connection, $"CREATE TEMP TABLE {Quote(Table)} (source_id TEXT PRIMARY KEY,target_id TEXT NOT NULL);");
        foreach (var Pair in Map) Execute(Connection, $"INSERT INTO {Quote(Table)} VALUES ($source,$target)", ("$source", Pair.Key), ("$target", Pair.Value));
    }

    public static int CopyRows(SqliteConnection Connection, string Table, string Where, Dictionary<string, string>? OverrideDict = null)
    {
        var ColumnList = Rows(Connection, $"PRAGMA main.table_info({Quote(Table)});").Select(Row => (string)Row["name"]!).ToList();
        string Columns = string.Join(',', ColumnList.Select(Quote));
        string Values = string.Join(',', ColumnList.Select(Name => OverrideDict?.GetValueOrDefault(Name) ?? "s." + Quote(Name)));
        return Execute(Connection, $"INSERT INTO main.{Quote(Table)} ({Columns}) SELECT {Values} FROM source.{Quote(Table)} s WHERE {Where}");
    }

    public static void Verify(SqliteConnection Connection)
    {
        if (Scalar(Connection, "PRAGMA integrity_check;") as string != "ok") throw new InvalidDataException("导入预览数据库完整性检查失败");
        if (Rows(Connection, "PRAGMA foreign_key_check;").Count != 0) throw new InvalidDataException("导入预览包含缺失的关联记录");
    }
}
