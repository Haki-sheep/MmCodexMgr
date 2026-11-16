# 兼容范围与验证边界

## 单一事实源

- 运行中的 `project capabilities` 与 `project preflight` 决定当前工程前置条件 不按文档版本号猜权限
- Bridge 1.22.0 可安装于 Unity 2022.3 与 6000 系列 U6 为 experimental-editor 不是所有 API 已兼容
- Scene Prefab Material Importer 与 ProjectSettings 离线写入仍须正式可写 Profile
- unity-6000-core 在 6000.3～6000.6 提供 limited 离线写入 未验证系列不借用相邻 Profile
- unity-6000-draft 保留历史 research-only 快照 有限正式 Profile 优先匹配 不修改历史研究结论冒充全量验证
- U6 Bridge 安装只允许完整内置包文件与字节 不允许额外目标 删除或符号链接
  有遗留清理需求时拒绝并报告 不用 force 扩大授权
- 限定授权同样覆盖 .fuc 日志 快照目录与具体快照文件 这些辅助路径链接也必须拒写
- Windows 日志还必须是单硬链接文件 当前 U6 特例未实现其他平台链接计数 因此非 Windows 拒写
- 领域工作流仍按独立版本策略判断 不继承在线 Bridge 权限
- Windows U6 的 editor delegate-plan 与 delegate-run 支持 import-assets 和 execute-code
  必须安装完整匹配 Bridge 与精确版本 Editor 使用 --manifest 和显式 --yes
  CLI 仅暂存受校验的计划日志与结果 委托资产修改由后台 Unity API 执行 不扩大 limited 离线字段范围
  execute-code 的 arguments.code 使用与 editor exec 相同的 Roslyn C# 入口 通过 return 返回验证数据
  每次生成独立 request_id 与结果路径 仅本次进程退出零且 success=true 表示完成
  任意 C# 可能产生不可逆副作用 operation_id 只覆盖计划暂存 不承诺资产 byte undo
  Editor 正在运行时不启动第二个 batchmode 实例 应使用在线 Bridge
- Unity 6000.4 及以上在线对象标识使用 EntityId 与 SceneHandle 原始 64 位整数
  instance_id component_instance_id 与 scene_handle 不得收窄为 Int32 或浮点数
  继续绑定 Editor session 与对象路径 不持久化为跨会话身份

## 已验证范围

2026-10-16 Windows x64 离线核心矩阵实际运行 2022.3.62f3 6000.3.26f1 6000.4.10f1 6000.5.1f1 6000.6.4f1
每个精确 Editor 先生成普通父子 Prefab 与 Scene 再退出 CLI 离线执行 19 条创建 编辑和回读操作
最后由同一精确 Editor 导入并断言 Prefab 新建 子对象创建 改名 激活状态 Tag Layer localPosition localScale 以及 Scene 对象改写
5 个版本全部通过 真实样本与来源哈希封存在 unity-6000-core/golden 和 release-manifest.json
CoreOracle 的编译与导入通过不代表 Bridge 编译 generation 或业务行为全矩阵通过

同日对这 5 个精确版本补充 BoxCollider 与普通 MonoBehaviour 的混合 Prefab/Scene 图
U6 每版本 7 条操作证明 GO 改名和 Transform 改值后两个非核心组件文档 SHA256 完全相同
其字段改写均拒绝且资产字节不变 随后 Editor 回读 BoxCollider 数值 脚本字段及对象引用全部通过
2022.3 保持原 full 能力 对 BoxCollider 的写入成功且按原操作 ID undo 后恢复精确字节 再由 Editor 回读通过
16 份 U6 真实原始资产和逐版本混合图哈希纳入同一 Profile 签封 发布物自检不需要 Editor

limited 只允许 Assets 内普通 Prefab 创建及既有 Scene/Prefab 的 GameObject Transform SceneRoots
核心对象必须具有完整已知字段集合 正确 serializedVersion 唯一 Transform 与闭合父子引用
允许同一资产保留既有 Camera Collider MonoBehaviour 等非核心组件
非核心组件按文档逐字节比较且必须完全不变 其本地引用目标不得消失或改变 classID 所属 GameObject 与既有组件引用表不得重接
有限 Profile 严格检查 UTF-8 无效字节拒绝写入 不通过解码替换字符重写保留文档
Scene 的 29 104 157 196 管理器文档只允许保持原文 不允许离线创建 Scene
RectTransform 新建非核心组件 非核心组件字段修改或删除 MonoBehaviour Dictionary SerializeReference 字段修改
PrefabInstance Variant Material ScriptableObject Importer ProjectSettings 以及资产删除 移动和既有 meta 修改均未开放
相关请求含 dry-run 仍返回 FUC_VERSION_UNSUPPORTED
项目 refresh 使用独立 2022.3 full 合同 不因 limited 存在就套用 2022 模板生成 U6 meta
6000.0～6000.2 及 6000.7 以上无可写 Profile Linux macOS Player 未验证
其他补丁按所属系列匹配 逐文件形态漂移仍拒写 不表示每个补丁均已实机运行

复测入口为 eng/unity6-core/run_oracle.py 的 generate mutate verify 与 generate-mixed mutate-mixed verify-mixed 阶段
仅使用自有隔离工程 mutate 的显式 force 用于已退出 Editor 的 stale 锁 不解除用户工程保护

2026-10-02 Windows x64 隔离工程实测 6000.4.10f1 6000.5.1f1 6000.6.4f1
覆盖 Bridge 安装 ready 结构化 context Roslyn 对象身份往返 64 位标识 Prefab 保存导入
新 generation 的编译门禁与受控退出 未覆盖所有 Inspector UI 测试运行器与第三方 Provider
其他 6000 系列只允许实验性安装 不推定 API 全通过 当时 6000.3 安装不完整 未做在线 Bridge 实测
2022.3.62f3 同范围回归通过 使用 Editor 自带 Newtonsoft 3.2.1 原 3.0.2 下载失败不记为通过
初始编译存在过时 API 与 Unity analyzer 警告 警告不是编译错误 也没有被隐藏
此版本未做 U6 live-update 现场保护全矩阵 Linux macOS 或 Player 验证

## 预检

### Windows U6 后台资产编辑

将 manifest 放在 `<UnityRoot>/Temp/FakeUnityCLI/` 计划预览后执行

```json
{"operation":"execute-code","arguments":{"code":"return UnityEngine.Application.unityVersion;"}}
```

```text
<fuc> editor delegate-plan --manifest <manifest.json> --project <root> --json
<fuc> editor delegate-run --manifest <manifest.json> --project <root> --yes --json
```

import-assets 使用 `arguments.paths` 数组 指向 Assets 或 Packages 内工程相对路径
执行 C# 可调用 UnityEditor API 保存资产 返回值在 `data.result.result_json` 中
后台 Unity 退出可能清理 Temp 下一次调用前重新准备 manifest 不依赖上次临时文件
缺 Bridge 时先安装 Editor 在线时改用在线入口 不在用户工程自动关闭 Editor
其他委托操作与非 Windows U6 暂不开放 缺精确版本不得换 nearest_patch

```text
<fuc> project capabilities --project <root> --json
<fuc> project preflight asset clone --project <root> --json
<fuc> project preflight editor bridge-install --project <root> --json
<fuc> project preflight editor exec --project <root> --json
```

`supported=true` 只表示已检查的前置条件成立 `validation_scope` 公布检查范围
未检查目标字段 包 API 兼容性和执行结果 `requires_target_validation=true` 不可忽略
拒绝返回非零退出码与 failure_code 不自动强制重试
Template list/describe 从本地 catalog 读取 不要求 Editor 在线
在线命令按实际 capability 判断 TestRunner 与 GameView 分辨率不能只检查 online=true

## 分层结果

1. 文件层 语义回读 diff 引用与事务撤销
2. 导入层 Unity 能导入修改的资产 并回读组件或序列化对象
3. 编译层 新 generation 完整 coverage 零 errors 最终 ready 同时报 warning
4. 行为层 对本任务的最小可观察结果检查 非全部游戏正确性声明

按任务影响选择层级 不重复全量检查 不以空日志或旧 generation 判通过
Online 任意代码不会自动获得文件层 byte undo

## 发布完整性

独立包 manifest 记录 Runtime SHA256 大小 构建身份 全部 Profile 与其他 payload 哈希
`release_channel=preview` 不是正式 release `source_commit=unknown` 表示源码无 Git 身份
`execution_validation=not_run` 不是通过 平台没有当前构建则不可用
包验证用 `scripts/verify-package.ps1` 同时检查完整文件集合 不只验证可执行文件
打包必须包含完整签封的 unity-6000-core Profile 与黄金样本 自检失败不能靠删断言或补造证据修复
