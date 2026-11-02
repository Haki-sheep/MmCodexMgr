---
name: ShaderAssetFucker
description: 使用内置 ShaderRipper 还原 Unity 编译 Shader 资产并执行变体编译验证 支持用户明确要求后的原资产替换 备份及材质引用迁移 用于 AssetRipper 导出的 Shader asset 及游戏编译数据 不用于普通 Shader 编写或渲染管线迁移
---

# ShaderAssetFucker

把仍有编译数据的 Unity Shader 还原成可编辑源码 并区分生成完整度 编译结果与视觉等价

## 包内工具

- `runtime/windows-x64/ShaderRipper.exe` 是修改后源码发布的独立程序 依赖程序集和 .NET 运行时已包含 无需引用原 Git 仓库
- `scripts/saf.py` 提供自检 导出 编译及 Editor 作业生成 需要 Python 3.10+ 标准库
- `scripts/usc_validate.py` 与 `usc_compile.py` 使用指定 Unity 安装内的编译器和 CGIncludes 不分发 Unity Editor
- 当前整包为 Windows x64 实测 Unity 6000.3.26f1 其他 Editor 和后端必须按实际结果验证

路径均相对本 Skill 目录 不把本次角色 工程目录或人数当作默认值

## 还原

1. 运行 `python scripts/saf.py doctor --run-tool` 核对包内程序与验证脚本指纹
2. 对 Unity 工程先通过现有 Unity 工具和 `AssetDatabase` 盘点所选范围的 Shader 区分已有源码与编译 `.asset` 不对普通 `.asset` 全目录盲跑
3. 使用 `export` 导出到工程 `Assets` 外的独立目录 保留反汇编 原输入与生成文件指纹
4. 使用 `validate` 指定项目实际 Unity 版本 验证发射出的每个 Pass 关键字组合与着色阶段
5. 报告成功 不完整 失败 跳过数量以及未映射缓冲和未翻译指令 不把 `exported` 写成 Unity 编译通过

```powershell
python scripts/saf.py export --file "D:/Game/Assets/角色/着色器/a.asset" --out "D:/Restore/run-01"
python scripts/saf.py validate --input "D:/Restore/run-01/Assets" --unity "C:/Program Files/Unity/Hub/Editor/6000.3.26f1" --out "D:/Restore/check-01/validation.json" --workers 4
```

`.asset` 读取由包内正式解析器完成 不把序列化 YAML 作为手工编辑接口 不手写 `.meta`

## 替换原工程

仅还原或评估不包含替换授权 用户已经明确要求替换时直接执行已授权步骤 不重复索要确认

替换前读取 [工程替换](references/replacement.md) 使用 `prepare` 生成项目 `Temp/FakeUnityCLI` 下的 C# 作业 通过已安装的 `fakeunity-cli` 或当前可用的等价 Unity Editor 执行工具运行

作业生成本身不修改资产 `plan` 执行后生成原 Shader 材质及配套 meta 的工程外备份 `apply` 每次处理一个 Shader `verify` 独立回读持久化后的参数与引用

保留 GUID 不能代替材质迁移 Native Shader `.asset` 改成 `ShaderImporter` 源码后 材质指针的资产类型也须由 Unity 材质 API 更新

引用含非材质直接 Shader 引用或材质变体时 当前模板先报告并停止 由实际引用类型设计迁移 不强行套普通材质流程

遇到未知执行结果只查询原请求 不重发写操作 已知失败保留首错和完成记录 先检查现场再决定续接

## 修复与效果判断

- 参数绑定按 Vertex 与 Fragment 各自的反射寄存器解析 不拿相邻阶段的缓冲布局硬套
- 动态实例矩阵仅按完整字节码索引证据识别 未识别布局保留诊断 不填零或删除变体凑通过
- 比较位掩码筛选浮点 UV 时须保留原位值 正反面系统语义只进入片元输入
- 编译器必须使用预处理返回的真实 ShaderRequirements 不能丢成零或靠强制宏绕过
- 修复生成器后重跑受影响的导出与检查 不把手工修过的展示样例当作批量能力
- 用户需要效果时读取 [视觉对照](references/visual-check.md) 原版重复渲染也会波动时不能把逐像素差异直接归因给还原

缺少编译数据无法补回原逻辑 还原结果是编译后逻辑的表达 不是原作者源码 编译通过也不证明所有场景与平台完全一致
