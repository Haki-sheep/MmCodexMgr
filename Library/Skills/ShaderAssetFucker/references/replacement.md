# 工程替换

此流程只处理原工程 `Assets` 内一份文件对应一个 Shader 的编译 `.asset` Bundles APK 先用于导出 不自动对应某个工程资产

## 准备作业

`export` 产生 `export-manifest.json` `validate` 产生 `validation.manifest.json` 它们将输入与生成文件的 SHA256 绑定到本次结果 原文件变化或部分导出不能进入替换

```powershell
python scripts/saf.py prepare --phase plan --project "D:/Game" --task "D:/Game/Temp/FakeUnityCLI/shader-job" --backup "D:/Restore/backup-01" --export-manifest "D:/Restore/run-01/export-manifest.json" --validation-manifest "D:/Restore/check-01/validation.manifest.json"
```

按返回的 `codeFile` 通过 Editor 执行完整 compilation unit 精确工具参数以当前 Unity Skill 为准 例如 FakeUnityCLI

```text
fuc editor guard-check --project D:/Game --json
fuc editor exec --project D:/Game --code-file <返回的codeFile> --request-id <本次唯一ID> --timeout 60 --json
```

执行前检查项目身份 Edit 状态与现场保护 不擅自停 Play 保存用户场景 或接管 Prefab Stage 作业生成放 Temp 不把临时 C# 放 Assets

## plan

- 验证源 Shader 名称 GUID ID 原文件和已验证源码指纹
- 检查目标 `.shader` 与 meta 均不存在
- 通过 `AssetDatabase` 收集所有项目材质引用 并检查其他直接依赖
- 原 Shader 材质及各自 meta 按相对路径备份 材质参数快照从 `EditorJsonUtility` 获取
- 普通材质模板不处理变体及非材质直接引用 遇到这些依赖在任何原资产改动前终止
- `plan-result.json` 是完整备份就绪标记 没有该标记不能 apply

## apply

用户明确要求替换后 才传 `--allow-replace` 该开关记录调用意图 本身不构成人类授权

```powershell
python scripts/saf.py prepare --phase apply --project "D:/Game" --task "D:/Game/Temp/FakeUnityCLI/shader-job" --index 0 --allow-replace
```

每次生成独立的 `apply-N.cs.txt` 并串行执行 不并发操作同一个 Editor 按 `plan-result.json` 中数量推进 失败或超时不继续下一项

`AssetDatabase.MoveAsset` 将原 `.asset` 改成同目录同名 `.shader` 通过源码写入和 Unity 导入生成 `ShaderImporter` 不手改 meta

写入使用 UTF-8 无 BOM 与 LF 只规范化行尾 不重写算法 GUID 须保持 主对象 ID 按实际结果检查 材质引用以导入后真实 ID 为准

材质通过 `Material.shader` 和材质 API 迁移 保存后重新导入 贴图及其缩放偏移 浮点 颜色 关键字 渲染队列 GI 实例化设置和禁用 Pass 等都与快照比对

JSON 快照保留 Unity 原始数值表示 包括 Infinity 已知旧快照的数值字符串仅作等值编码规范化 不能改动实际材质值

## verify

```powershell
python scripts/saf.py prepare --phase verify --project "D:/Game" --task "D:/Game/Temp/FakeUnityCLI/shader-job"
```

独立回读全部新 Shader GUID 导入器 源码指纹 编译消息及材质引用 再比对持久化后的材质参数 并检查启用的材质 Pass

对工程内替换后的实际 `.shader` 再运行 `validate` 需要角色或场景验收时通过 Unity API 检查对应 Prefab 或当前场景 不擅自切换或保存用户场景

作业输出中 `passed` 仅覆盖实际检查项 `--compile-only` 只验证 C# API 可编译 不执行 plan apply verify 也不代表迁移成功

保留备份 完成记录 原请求回执和失败信息 只提交本次资产 源码 配套 meta 和引用迁移 不把用户已有改动一并提交
