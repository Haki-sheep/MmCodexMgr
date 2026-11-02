# 资产、Meta 与贴图命令模板

## 创建资产

```text
<fuc> asset create <目标.prefab> [--value <根节点名>] --project <root> [--force] --json
<fuc> asset create <目标.asset> --type <ScriptableObject脚本类型> --project <root> [--force] --json
<fuc> asset create <目标.mat> [--value <standard|particles/additive|Shader GUID>] --project <root> [--force] --json
```

父目录必须已存在。命令创建资产及配套 `.meta`，目标已存在时拒绝覆盖。

## 导入工程外文件（Bridge 1.12）

先使用 dry-run 取得 source SHA、大小、规范化目标和能力要求；确认后使用相同 source SHA 正式导入：

```text
<fuc> asset import-file <外部绝对路径.png> Assets/Art/icon.png --dry-run --project <root> --json
<fuc> asset import-file <外部绝对路径.png> Assets/Art/icon.png --expected-source-sha256 <dry-run返回值> --project <root> --json
<fuc> asset import-file-status <operation-id> --project <root> --json
<fuc> asset import-file-undo <operation-id> --yes --project <root> --json
```

source 必须在工程外且不是 reparse/symlink；destination 父目录已存在、严格位于 `Assets/`、扩展名相同，
asset/meta 均不存在。第一版只新建，不覆盖；不接受 C#、DLL、asmdef、Shader、QTN 等会启动代码编译的文件。
正式执行要求空闲 Edit、无现场保护和 `external_asset_import` capability。Bridge 以 1 MiB 块流式复制并复核 SHA，
同步调用 Unity Import，成功返回 GUID、Importer、asset/meta hash 和 receipt-bound undo。

导入/undo 中断后不能换 request ID 盲重试。先用原 request ID 查询 `editor result`，再用 import operation ID 查询
`import-file-status`。额外 AssetPostprocessor 新建资产会使操作成为 residual failure；既有资产被 Postprocessor
修改的影响目前标为 `not_observed`，专用 undo 不声称覆盖。项目业务重绑定和 Addressables 分组在成功 receipt 后
由项目 Plugin/Template 继续完成。

## 移动与重命名

```text
<fuc> asset move <源资产或目录路径> --path <目标路径> --project <root> [--force] --json
<fuc> asset rename <资产或目录路径> --path <新名称> --project <root> [--force] --json
```

`asset move` 的 `--path` 是完整目标路径；`asset rename` 的 `--path` 是同目录下的新名称。两者都会同步处理 `.meta` 并保持 GUID。

## Meta

```text
<fuc> meta ensure <资产路径> --project <root> [--force] --json
```

仅为缺失 `.meta` 的现有资产生成正确 Importer 模板。

## TextureImporter 压缩

```text
<fuc> texture set-compression --format <格式> [--max-size <像素>] [--path <Assets目录前缀>] [--type <资产类型>] --project <root> [--dry-run] [--force] --json
```

该命令可能批量修改贴图，默认先使用 `--dry-run` 确认范围。

## 删除资产与目录（Bridge 1.21）

```text
<fuc> asset delete Assets/Unused.cs --backend auto --dry-run --project <root> --json
<fuc> asset delete Assets/Unused.cs --backend online --yes --request-id <stable-id> --project <root> --json
<fuc> editor result <stable-id> --project <root> --json
<fuc> asset delete Assets/Old --backend offline --dry-run --project <root> --json
```

`--backend` 为 `auto`（默认）、`online` 或 `offline`。auto 只在身份证据能确认 Editor 已关闭时选择
离线 Profile；Editor 在线时要求当前 Bridge 公布 `asset_delete`。在线能力缺失、身份不明、保护拒绝、
失败或结果未知均拒绝自动切换离线后端。明确 offline 仍执行 Profile 版本与目标范围门禁。
U6 limited Profile 未开放资产删除，包括 dry-run 在内仍返回 `FUC_VERSION_UNSUPPORTED`，`--force` 不扩大范围。

在线 dry-run 也投递绑定实例与 session 的请求，要求空闲 Edit、无现场保护、无 Prefab Stage、
无 dirty 场景或工程资产，不改变播放模式。计划列出精确文件、配套 meta、子目录及 SHA256；
拒绝 Assets 根目录、meta 单独目标、工程外路径和符号链接。正式删除需 `--yes`，Bridge 在调用
`AssetDatabase.DeleteAsset` 前复查范围和内容，删除后核实文件、目录、meta 与 AssetDatabase 身份均已移除。

在线引用门禁通过 Unity 的直接资产依赖查询覆盖 Assets 与 Packages，排除同时删除的内部引用，
报告具体来源资产、目标资产和 GUID。dry-run 报告 `blocked_by_references`，存在外部依赖时正式
删除返回 `FUC_WRITE_DENIED`；已有 `--force` 仅确认引用破坏，不突破模式、身份和现场保护。
动态字符串与未保存引用不属于已证明覆盖范围，因此存在未保存现场时拒绝删除。

结果返回实际 `backend`、`request_id` 与 `operation_id`；在线两个 ID 相同。在线删除不创建 CLI 备份，
不承诺 Unity Undo 或完整撤销，恢复需版本控制或独立备份，Unity 删除和导入回调可能影响其他资产。
`processing_timeout` / `outcome_unknown` 只通过原 request ID 查询 `editor result`，不得更换 ID、后端或自动重删；
Bridge 不对删除进行 Reload 自动重放。离线仍使用原 WritePipeline 快照与 `undo`。
