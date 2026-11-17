# 编队协作

适用于用户明确要求编队或通过管理器创建了编队的任务。按当前部署的 `AIMoreMoreWork.Cli.exe formation help` 核对参数，以下命令由正在运行的 AIMoreMoreWork 处理。

## 创建与管理

新建界面填写问题并配置头像席位、拟推理强度和子代理上限。点开席位头像可选工作区：Codex 选当前实例的项目，DSH 选已登记的工作区，Cursor、Claude Code 和 Antigravity 选文件夹，原生子代理沿用统筹工作区。问题同时作为初始需求交给统筹，以及会话标题的第一部分。会话标题为「问题 MM-dd 职位」，同一职位的后续席位附序号。统筹首次派发时才新建执行席位的独立会话。执行者最多四席，可混用模型。审核与外援默认使用原生子代理，也可切换为独立会话。

选择统筹后，新建界面按统筹的子代理上限配置默认席位。上限为 4 时配置两审核两外援，3 时配置两审核一外援，2 时配置一审核一外援，1 时配置一审核并由统筹兼任外援。默认席位按需启动。有多个原生审核席位时，省略 `reviewer_id` 会优先选择未完任务较少的席位。

CLI 的空编队请求为 `{"operation_id":"稳定标识","formation":{"setup_only":true,"preset":"basic"}}`，可省略主题并自动按日期命名。`setup_only` 不接受非空需求。`activate` 只让统筹准备并等待，尚未确认需求时 `task` 会拒绝登记。已确认需求后由统筹调用 `context`，参数为 `run_id`、`operation_id`、`requirement` 和可选 `context`。执行席不能修改需求。

本机人工操作使用 `formation <action> --operator true --json-file <文件>`。CLI 自动读取管理器发放并用 Windows 当前用户加密的操作凭据；管理器重启会轮换凭据。`MMCODEX_FORMATION_OPERATOR_TOKEN` 仅作为显式覆盖，不要输出或复制凭据。角色调用继续使用各自会话身份和成员凭据。

`create` 的 JSON 包含 `operation_id` 和 `formation`。最简 formation 为 `{"theme":"测试编队","requirement":"交付目标","preset":"basic"}`；`basic` 是统筹加一执行，`reviewed` 是统筹加两执行加一审核。可加 `instance_id`、`model`、`effort` 批量配置，也可使用原有 `template_id` 或 `member_list` 精确指定。创建只登记席位；`activate` 才创建并启动统筹。用户已授权测试编队时可以绑定当前真实会话为统筹，由当前会话直接通过 CLI 登记、派发和验收，避免向自己重复发送启动包。

界面和 CLI 的 `status` 为 `InProgress` 进行中、`Blocked` 阻塞中、`Archived` 已归档。暂停、任务阻塞、投递未知、待交接、结案待归档或会话操作未完成都显示阻塞中；底层 `state` 保留调度状态，`complete` 仅结案，不会自动归档。阻塞编队仍显示卡片。卡片及 `formation open` 可打开已绑定统筹，包括已归档会话，不发送工作消息。

卡片上方提供归档、取消归档和彻底删除。详情不展示需求上下文、交付总结或最近事件，完整记录仍可通过 CLI `show` / `task-show` 查询。

会话生命周期操作只允许人工身份，均先调用 `formation lifecycle-preview`，JSON 为 `{"run_id":"编队ID","action":"archive"}`；action 可换为 `unarchive` 或 `delete`。检查返回的 `target_list`、`blocker_list` 与 `can_apply`，向用户展示确切会话范围，获得相应操作授权后执行。已有授权可沿用，不能从普通任务完成推断永久删除授权。

- `formation archive`：提交 `run_id`、`operation_id`、预览的 `plan_token`。调用各 Agent 原生归档，已经归档或已不存在的项跳过。保存归档前逐会话状态，不重复归档已处理项。
- `formation unarchive`：相同字段。只恢复由本次编队操作归档的会话；Codex 原生恢复会连带子代理，因此按父先子后校正并核实原有归档状态。取消归档后调度保持暂停，需人工恢复，不自动派发。
- `formation delete`：另加 `confirm_delete:true`。永久删除编队及预览中的关联会话；会话全部删除核实后才移除编队和角色凭据。不会用删除编队记录冒充删除会话。模板和用户成果文件不由管理器清理，Codex 的原生确认以其实际提示为准。

目标包括当前席位、历史独立执行轮次、Codex 原生子代理与附属会话，按实例和会话 ID 去重。运行中会话、未确认停止的轮次、其他编队仍关联的会话或不支持的能力会阻止操作。失败保留逐会话进度并显示阻塞，先重新预览，再用返回的 `resume_operation_id` 和最新 token 重试；不能换 ID 绕过原操作。操作期间不改派席位或启动新任务。

已接入 Codex、DeepSeek Harness 和 Antigravity 原生归档；Codex 与 Antigravity 有原生删除入口。当前 DSH 不提供单会话永久删除，Claude Code / Cursor CLI 暂无已验证的单会话原生归档与删除入口，相关范围会明确阻止，不改成管理器虚拟归档、不批量清理项目存档。Codex 使用已运行实例的桌面工具，删除可能在原应用出现确认提示，未确认不会报告成功。

## 统筹任务

1. 由用户在编队界面创建并准备编队。统筹须绑定真实 Codex 会话，CLI 可指定已有会话，界面默认由管理器新建。启动消息提供编队 ID 及该角色的调用凭据。空编队须等待用户在会话中说明需求，再用 `context` 保存已确认内容；携带需求创建的 CLI 编队按启动包继续。投递状态不明时先由用户核对原会话。
2. 统筹调用 CLI 时保持宿主的 `CODEX_HOME` 和 `CODEX_THREAD_ID`，在调用的 PowerShell 子进程设置启动消息提供的 `MMCODEX_FORMATION_MEMBER_TOKEN`。凭据仅用于本编队调用，禁止写入文件、项目配置、长期环境或回报。
3. 用 `formation show` 读取编队与席位，JSON 提供 `run_id`。按需用 `formation task-show` 读取单项任务，JSON 提供 `run_id` 和 `task_id`。
4. 用 `formation task` 登记任务，提供 `run_id`、`operation_id`、`title`、`instructions`、`acceptance`、`executor_id`、`workspace`。省略 `reviewer_id` 时使用已经配置的原生审核，显式空值由统筹验收，独立审核填写席位 ID。只读填写 `{"access":"read_only"}`，写入填写 `{"access":"write","write_paths":["实际绝对路径"]}`。
5. 用 `formation dispatch` 派发，JSON 提供 `run_id`、`task_id`、`operation_id`，执行用 `kind=execute`。启动包逐席列出模型、拟推理强度、子代理上限和席位 ID，同角色多席按序编号。独立 Codex 派发按模型公布的档位选最近值，等距选较低档。档位未知或执行端沿用会话配置时使用默认。每个写请求使用稳定的 `operation_id`，同一请求重试保持 ID 和内容。
6. 独立执行方按 Relay 回报，原生轮次由统筹回传。没有审核席位的任务由统筹用 `formation review` 提交 `run_id`、`task_id`、`attempt_id`、`submission_id`、`operation_id`、`passed` 和 `feedback`。全部任务通过后用 `formation complete` 提交 `run_id`、`operation_id` 与交付 `summary`。

命令通过 Skill 的脚本进入。下列示例假设当前进程已设置本编队角色凭据，并将相应请求 JSON 写入临时文件。

```powershell
& '<Skill目录>/scripts/aimoremorework.ps1' formation task-show --json-file '<请求JSON的绝对路径>'
& '<Skill目录>/scripts/aimoremorework.ps1' formation dispatch --json-file '<另一请求JSON的绝对路径>'
```

## 原生审核与外援

席位通过 `dispatch_mode` 选择 `Native` 或 `Session`。老编队及省略该字段的 CLI 请求沿用独立会话。原生席位保持 `session_id`、`project`、`cwd` 为空。`follow_coordinator:true` 在派发时读取统筹的模型和推理设置，关闭跟随后可填写本席 `model`、`effort`。

各角色都可选择 `subagent_max` 1 至 4，表示本体之外的原生子代理并发上限。独立 Codex 会话使用该席预算并受宿主限制。原生审核或外援占用一个统筹额度，作为叶子时下级预算为 0。暂不支持委派的外部执行端使用有效预算 0。

1. 自动审核通知包含原 `operation_id`。真实统筹用同一 ID 调 `formation dispatch`，仅首次收到 `can_spawn:true` 时调用实际宿主子代理工具。使用返回的 `task_name`、`prompt`、`model`，参考 `preferred_effort` 和 `effort`，选择目标模型与宿主工具共同支持的最近档位。缺少档位能力时沿用默认。工具不可用时回报未启动或未知。
2. 从工具结果取得真实 `agent_id` 后调用 `native-bind`，参数为 `run_id`、`task_id`、`attempt_id`、`operation_id`、`agent_id`、`stage`。只确认创建时用 `created`，有启动证据才用 `running`。重新发请求保持原操作 ID 和参数。
3. 统筹收到结果并由宿主明确确认本轮结束或停止后，调用 `native-report`。除基本轮次字段和 `agent_id`，提供 `outcome` 与 `evidence`。已完成审核填写 `submission_id`、`passed`、`feedback`，外援执行填写 `summary` 及可选 `artifacts` 绝对路径列表。`not_started` 用于有证据明确未创建的轮次，`unknown` 表示待核对并继续占用预算。投递不明时核对原宿主子代理，避免重新创建。

## 审核与交接

审核席只读检查当前轮提交。独立审核通过普通 Relay 的 `completed` 回报，`summary` 是 JSON 对象字符串，例如 `{"passed":false,"feedback":"注明失败证据及需补的内容"}`。原生审核由统筹转交同样的结论。管理器按同一任务、需求版本和实际执行席统计拒绝次数，前两次拒绝自动安排原执行席做差量返工，外援接替后独立计数。

同一任务在同一需求版本第三次被拒绝时，冻结原执行席尚未通过的任务。接管由操作员处理，必要时先请求停止。原生轮次的停止请求通知统筹，统筹核实宿主确认的实际状态后回报 `stopped` 或 `not_started`。操作员逐轮核实原执行、关联审核和工具进程是否已停止，填写证据后执行 `confirm_stop` 和 `transfer`，移交范围仅为原执行席尚未通过的关联任务。

统筹上限为 1 且只有独立审核、没有外援席时，确认移交后由统筹调用 `formation dispatch` 领取任务。返回 `run_in_coordinator:true` 时，统筹在原会话按返回的工作范围执行，用 `formation submit` 提供 `run_id`、`task_id`、`attempt_id`、`operation_id`、`submission_id`、`summary` 和可选 `artifacts`，再交给审核席。

## 需求与上下文更新

需求在统筹会话中沟通，由统筹或人工操作员通过 `formation context` 更新，管理界面仅展示版本与内容。同职业 Codex 席位共享拟推理强度和子代理上限，各自模型仍按能力解析档位。关联席位仍执行或待停时会拒绝修改。

修改需求会提升需求版本，并将所有任务恢复为待派发，旧成果和审核记录保留。新一轮派发携带旧成果摘要和文件位置，执行者据差异复用成果，不必从头重做；只有当前需求版本的提交与审核全部通过才可完成编队。单纯补充上下文保留已有验收结果。

管理器向已启动的统筹发送精简变更通知，统筹据此调整计划和下一轮派发，不重复发送当前执行轮次。已完成编队不接受需求或上下文修改，应新建编队处理新增工作。
