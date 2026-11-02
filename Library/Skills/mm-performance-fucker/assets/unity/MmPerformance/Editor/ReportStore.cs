using System;
using System.IO;
using System.Text;
using UnityEngine;

namespace MmPerformance
{
    public static class ReportStore
    {
        public static string Root { get { return Path.GetFullPath(Path.Combine(Application.dataPath, "../Library/MmPerformance")); } }

        /// <summary>
        /// 验证任务编号 返回标准 GUID 路径片段
        /// </summary>
        public static string NormalizeId(string value)
        {
            if (!Guid.TryParse(value, out var Id)) throw new ArgumentException("job_id 必须为 GUID");
            return Id.ToString("N");
        }

        /// <summary>
        /// 输入任务编号和后缀 返回受限输出路径
        /// </summary>
        public static string PathFor(string id, string suffix)
        {
            return Path.Combine(Root, NormalizeId(id) + suffix + ".json");
        }

        /// <summary>
        /// 输入诊断对象 原子保存 JSON 并保留写入异常
        /// </summary>
        public static void Save(string path, object value, bool replace)
        {
            Directory.CreateDirectory(Root);
            string TempPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                string Json = NormalizeMissingNumbers(JsonUtility.ToJson(value, false));
                File.WriteAllText(TempPath, Json, new UTF8Encoding(false));
                if (replace && File.Exists(path)) File.Replace(TempPath, path, null);
                else File.Move(TempPath, path);
            }
            finally
            {
                if (File.Exists(TempPath)) File.Delete(TempPath);
            }
        }

        /// <summary>
        /// 输入 Unity JSON 将字符串外的非有限缺失标记转为标准 JSON null
        /// </summary>
        public static string NormalizeMissingNumbers(string json)
        {
            var Result = new StringBuilder(json.Length);
            bool insideString = false;
            bool escaped = false;
            var TokenList = new string[] { "NaN", "Infinity", "-Infinity" };
            for (int i = 0; i < json.Length; i++)
            {
                char character = json[i];
                if (insideString)
                {
                    Result.Append(character);
                    if (escaped) escaped = false;
                    else if (character == '\\') escaped = true;
                    else if (character == '"') insideString = false;
                    continue;
                }
                if (character == '"') { insideString = true; Result.Append(character); continue; }
                bool replaced = false;
                foreach (string Token in TokenList)
                {
                    if (i + Token.Length > json.Length || string.CompareOrdinal(json, i, Token, 0, Token.Length) != 0) continue;
                    int next = i + Token.Length;
                    if (next < json.Length && !char.IsWhiteSpace(json[next]) && json[next] != ',' && json[next] != ']' && json[next] != '}') continue;
                    Result.Append("null");
                    i += Token.Length - 1;
                    replaced = true;
                    break;
                }
                if (!replaced) Result.Append(character);
            }
            return Result.ToString();
        }

        /// <summary>
        /// 输入任务编号 返回完整任务收据 缺失或损坏时抛错
        /// </summary>
        public static Job LoadJob(string id)
        {
            var Result = JsonUtility.FromJson<Job>(File.ReadAllText(PathFor(id, ".job")));
            if (Result == null || Result.job_id != NormalizeId(id)) throw new InvalidDataException("任务收据身份不一致");
            return Result;
        }
    }
}
