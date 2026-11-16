# ChaWu Unity 恢复会话经验

适用：接手 Unity 发布包恢复工程、整合独立候选、处理原脚本身份或 Editor 运行差异时按症状读取。普通问答和局部修改不因此启动协作。

来源：本会话 2026 年 10 月 14 至 15 日的 NoSuchPlace 恢复与联调，2026 年 11 月 7 日根据会话及本地历史收据整理。本轮没有重新运行 Unity，历史 PASS 只代表当时记录的版本和场景。

归责范围：协调者承担正式集成与最终结论责任。前任外部 AI 的交接、本地子代理候选、主 Agent 的集成修改、原游戏继承缺陷分别说明；不能把所有失败都归给子代理，也不根据交付分数推断某个模型的整体智能。

本文件是独立贡献，公共 SKILL.md 由创建该 Skill 的会话维护。历史路径用于追证，不授予重建临时目录、开新会话、创建 worktree、安装工具或修改原游戏的权限。

## 一 协调者的问题

| 出现了什么问题 | 为什么出现 | 如何解决 | 如何加快速度 |
| --- | --- | --- | --- |
| 旧交接中“导入无 Missing Script”“只剩三个阻塞”不足以代表实际地图；正式运行后来发现 31 个 Fog 缺失组件 | 导入日志、程序集解析、实际场景组件和完整玩法使用了不同分母；原 Player URP DLL 还包含官方包没有的定制类型 | 把旧交接作为定位线索，逐项核验；恢复 16 个 Fog 类型并保留原程序集身份、152 项序列化字段，实际 Map Missing 从 31 降为 0 | 接手先核对当前场景和原程序集类型差集，再决定依赖路线；避免依据概括性结论重复试错 |
| 19 个 DLL 更名实验当时显示 214 个 MonoScript 身份相等，Reload 后 TMP/UI/Input/URP 绑定失败 | 热态缓存掩盖了文件名、导出 GUID、程序集身份与实现选择之间的关系 | 用 AssetDatabase 回滚原 DLL 文件名，保留原 meta 锚点；关闭重叠实现的 Auto Reference，运行实现使用匹配 Editor 的官方包，并冷启动复验 | 在最小依赖上先做更名前后 Reload 探针；大批文件操作前验证脚本身份的持久性 |
| 原 URP Global Settings 注册在热态有效，重开后选中了另一个自动生成资产 | 修改了注册关系，却只保存 Global 资产，没有持久化持有注册表的 GraphicsSettings 对象 | 使用公开注册 API，显式标脏 GraphicsSettings，再保存；冷启动读取真实绑定 | 先确认“谁拥有被修改的数据”，随后做一次保存与重开检查；热态反复读取同一对象不能替代持久化验证 |
| 原 Shader bundle 能加载，Shader.Find 仍是 0/124；绑定材质后还出现白色体积光和 HUD 异常 | 加载对象不等于登记原名称；部分消费者直接持有 Shader 字段，并不通过 Material 查找 | 用 ShaderUtil.RegisterShader 登记同一原实例，得到 124/124；同时恢复 RendererFeature、VLB、Prefab 等直接字段，保留像素和真实 GameView 证据 | 先分开测试“能加载”“名称可查”“消费者字段已绑”“实际绘制”；每层最小探针能更快定位下一处缺口 |
| 退出 Play 后原生 Shader 已销毁，C# 包装对象和列表仍在；旧比较有把两个 Unity null 判为相等的风险 | 验证只覆盖首次 Play，没有覆盖原生对象寿命与托管包装对象寿命的差异 | ExitingPlay 先恢复引用并释放句柄，EnteredEdit 重建原生库和 Renderer 缓存；登记检查显式拒绝已销毁对象，0/124 的失败保留，修复后验证 124/124 | 对持有原生对象的桥优先检查 Play→Stop→Play 和 Reload；比重复首轮截图更早暴露失效引用 |
| 临时 bundle Shader 被写入持久资产的风险出现在运行时重绑与原 Kawase Create 写字段的交叉处 | 原逻辑默认 Shader 来自正式资产；恢复桥引入的临时对象没有可持久化的正式 GUID/localID | 记录 owner、属性路径和原引用；保存、Reload、退出前恢复并校验。Kawase 在 Editor 中用局部 Shader 传给原 Pass，避免写回持久字段。明确 SaveAssetIfDirty 不经过 OnWillSaveAssets | 派发恢复桥时就说明对象归属和保存契约；先用一项临时引用注入验证写盘拦截，避免最后清理整批污染 |
| 自动验收先用新建档，攻击被 Fist 前置条件阻塞；独立射线观察器过早启动又在准备阶段超时 | 场景、装备、目标距离和观察窗口没有在同一时点满足；不能把“进入 Map”当成“战斗已就绪” | 保留 blocked；沿原移动、触碰、搜索、MoveItem 路径取得原枪，实际接近敌人后再启动观察器和原攻击验收，最后在原服务器线程解绑 | 先列动作前置条件及可观察的就绪状态；昂贵或有超时的观察只在最后启动，不在导航和背包准备期间空等 |
| Editor 异步命令可能 processing_timeout 或结果未知，手动切换 Play 也会改变测试状态 | 通信超时不等于命令未执行；同一 Editor 是共享外部资源，文件隔离无法隔离它 | 对已提交请求按原 request_id 查询结果，未知状态不重发 mutation；expired 明确未执行时才按真实条件重试。集成人独占正式 Editor，人工介入后重新确认状态 | 请求一次后等待同一任务的终态；用实际状态与短检查点衔接，不用重复提交推动进度 |
| 原枪取得后再做存档重进，才暴露已销毁 MinimapMarker 残留在缩放回调中 | 首轮新档没有经过相同任务和标记生命周期；单次可运行不足以覆盖订阅、禁用和场景销毁 | 注册改为幂等，记录真实 RoomViewer 发布者并成对解绑，旧委托快照不能重新注册失活标记；保留首错并做独立生命周期探针与实际持枪存档重进 | 选择能改变对象集合的真实流程，再覆盖退出与重进；小探针定位机制，实际流程证明集成，避免用 Zoom 过滤 null 隐藏来源 |
| 一次手动 Play 后 Editor 无响应；请求过期、原生窗口激活两次超时，根因仍未知 | 现有证据只能证明不可用，不能证明是后台应用、runInBackground 或某脚本造成 | 确认本任务 PID、命令行、已保存枪档与无待决未知 mutation 后，仅恢复本任务 Editor；完整保留场景备份并校验 SHA，不覆盖正式场景。Stop 命令退出 1 与之后旧进程已不存在分别记录 | 受控重试仍失败后停止 UI 输入；在权限允许范围内走可核验的恢复路径，保留恢复前状态，避免无限点击与反复抢占工程 |
| 本会话后续查时间戳时曾做过宽文件枚举和长日志读取，输出截断 | 搜索根目录含导出工程、依赖、SDK 与重复日志；路径过滤未充分收窄，重复读取已处理信息 | 改为先列 Notes/logs 的候选元数据，再只读报告的时间、阶段、首错和相关证据行；时间戳结合报告内 UTC 转换 | 先确定一个问题需要哪几个字段，再定目录和文件；长输出按症状搜索，不把大量原始日志搬入上下文 |

协调者的结论边界也影响速度：完整入口报告保留 Steam 初始化失败，枪击和持枪重进另有独立 PASS，不能改写原报告来得到“全绿”。性能用户已明确暂缓；已采 Editor 帧间隔包含编辑器开销，后台占用未测量，继续优化会偏离当前目标。

## 二 子执行者候选与交付中的问题

这里记录候选及接入链实际出现的问题。部分修复由主 Agent 完成，不把无法核实的具体编辑归属记为某个子代理的个人错误。

| 出现了什么问题 | 为什么出现 | 如何解决 | 如何加快速度 |
| --- | --- | --- | --- |
| 教程路线初版在客户端 Actor 表查找枪箱，首次运行出现 Sequence contains no matching element | 远处实体尚未进入客户端可见集合；把可见集合当成完整权威世界 | 用 PostToServerThread 在原服务器完整 Actor 集合中定位真实箱子，固定身份与坐标；接近后仍要求客户端真实可见、实际触碰，再调用原交互，不插入假 Actor | 派发时给出权威数据与客户端投影的归属；先做“权威存在但客户端不可见”的最小探针再写路线 |
| 随后的 RequestLongPath 等待 15 秒后超时，没有得到路径 | 使用客户端 mapMesh，但该侧没有推进原路径回调的更新循环；只认方法签名，未核查回调生产者 | 改在原服务器线程调用实际推进中的 mapMesh，保留原路径算法和移动输入；原超时报告不覆盖 | 调用异步游戏 API 前先追到队列由谁 Tick、回调在哪个线程执行；一个请求的闭环比先写整套自动行走更便宜 |
| 路线已经到达预设终点，搜索仍未开始 | 目标点离箱子约 2 米以上，导航完成条件没有满足原 Collider 的触碰与选中条件 | 调整原路径终点和接近条件，实际到约 1.1 米范围并观察原触发器成员、目标选中与 SearchReady；不扩碰撞体、不瞬移、不绕过交互 | 验收条件直接使用业务所需的触碰和选择状态；距离仅作导航控制参数，不能单独宣称交互完成。本次约 1.1 米不是其他物体的通用阈值 |
| 取枪与射线候选第一次离线编译出现 CS0030、CS0023 | 新工装有无效字符串取反表达式，编译前就存在可直接发现的问题 | 修正表达式并把装填完成判断放到真实服务器确认分支；保留初次错误，候选报告明确 offline_compiled_candidates_runtime_not_executed | 新辅助代码先跑最小离线编译，再占用正式 Editor；检查结果同时交付实际运行范围，避免把“编译通过”消费成玩法 PASS |
| 恢复的 Fog 候选通过隔离编译和字段契约检查，正式退出时却试图销毁持久 sharedMaterial | 候选延续了原 DLL 借用材质后修改、销毁的逻辑；Editor 持久资产语义使原问题显现。这属于继承缺陷，不是子代理凭空引入 | 每组件创建并拥有自己的 Material 副本，保留原 Shader 与参数；反复刷新复用实例，销毁时只释放自有对象并恢复借用引用。对两个实际 Fog 组件验证复用及原材质不变 | 派发资源恢复时标出 borrowed/owned 与销毁责任；字段一致性检查后加一次真实创建、刷新、销毁，可更早发现跨环境寿命问题 |

### 不应误归为执行者错误的情况

- 五处反编译语法、局部函数或闭包缺陷来自工具输出。修复依据原 DLL IL，不能把反编译失败直接计为 AI 写错，也不能删业务分支换取可编译。
- 独立 Shader GPU 探针和 Fog 隔离编译有实际价值，但其 PASS 不能证明正式工程已集成、全部场景有效或跨平台构建成功。
- 原枪可能已经装满。候选将显式 Reload 标为 reload_not_exercised_already_full 是正确边界，不应修改断言制造装填 PASS。
- 枪弹使用原 Line_Rifle 瞬时射线。没有可持续观察的飞行子弹不等于武器失效，应按原弹药配置和伤害链选择观察对象。
- HotkeyHinter 销毁时重新创建、MinimapMarker 订阅残留有原实现/IL 证据；归类为原逻辑在恢复环境暴露的生命周期问题，修复者不等于缺陷引入者。

### 已经有效的子任务交付方式

本次按插件与脚本绑定、Shader/Fog 恢复、玩法验收工装拆出可独立工作。正式 Editor 与正式集成由主 Agent 串行操作，子执行者交最小候选、来源、哈希、初次错误与真实验证层级。这里描述历史分工，不要求以后固定开三个子代理。

## 三 下次如何更快执行

### 分派时给影响整合的契约

只有任务确实可独立推进时才分派，并服从当轮用户授权与宿主额度。原生子代理作为叶子时明确 subagent_max=0、session_max=0、cross_agent_max=0，不通过转派绕过额度。

| 字段 | 本类任务需要提供的内容 |
| --- | --- |
| 输入 | 冻结版本、当前正式基线、原 DLL/资源来源、已确认事实和仍未决的假设 |
| 可写范围 | 具体候选文件与已有隔离位置；正式场景、共享程序集和正式 Editor 的独占归属。没有授权就不新建 worktree 或会话 |
| 接口 | 真实程序集身份、序列化字段、权威线程、异步队列推进者、对象所有权和回调解绑责任 |
| 产物 | 最小补丁或文件清单、源哈希、首错、真实命令/退出码、验证结果和未验证项 |
| 验收 | 明确是离线编译、隔离 Editor、正式热态、Reload/冷启动、原玩法哪个层级；选择能区分错误解释的最小场景 |
| 中断 | 保存原 request_id、RunId、未完成业务操作和清理状态；背包尚未归位或订阅未解绑时不能清空状态重新开始 |

### 优先解决会改变路线的疑点

1. 先确认原代码是否在包内、地图是否动态创建、单机服务器是否本地运行，再选择恢复路线。本项目是 Mono 发布包并含本地玩法代码，这些条件不能外推到其他游戏。
2. 先核对程序集、文件名、GUID、字段及实际实现来源；在少量对象上证明热态与 Reload 一致后再批量整合。
3. 对异步入口验证“发出→真实队列推进→回调→消费者”；对交互验证实际业务状态，不用工具自己的完成标记代替。
4. 对临时原生对象和借用资源先测销毁边界；对持久设置先测保存与重开。风险对应的小反例比重复正常首轮更快。
5. 观察器等测试装备和目标就绪再启动；结束在真实所有者线程解绑，保留首错与清理结果。
6. 修改后只复验受影响层及仍未决的集成路径；原枪战斗、地图重进、Shader GPU 绘制分别提供证据，避免每次重跑所有无变化任务。

### 按已证明的范围交付

- 可执行原 Shader GPU 程序不等于取得原 Shader 源码；本次自定义 124 项只验证 Windows/DX12 Editor 范围。
- 编译 generation 无错误不等于 Console 全部无错误；同名 DLL/asmdef 验证、历史 warning 与运行时异常分开记录。
- 原业务输入消息、真实客户端/服务器状态、伤害 HP 变化各有证据，不扩大为所有物理键鼠、所有关卡和联网服务已验收。
- 文档更新一个详细权威位置，交接与索引只提供入口和边界；保留失败报告，不用新 PASS 覆盖第一次失败。
- 时间估算注明起点。计划文件初建、计划最后修改、交接文件落盘、首条接手日志和玩法 PASS 是不同事件，文件时间不能冒充精确聊天接手时间；本次耗时也不作为通用 SLA。

## 四 当前会话的追证入口

以下都是历史产物，使用时核验存在与版本。路径根为 `E:/AAAA学习资料/ChaWu`，只列本经验所需入口，不复制完整项目文档。

| 对应问题 | 证据位置 |
| --- | --- |
| 旧交接与正式恢复路线差异 | `Tools/RecoveryCloseout/DocumentBackups/Notes/交接记录.md`、`Notes/Unity工程/工程恢复记录.md` |
| DLL 更名热态有效但 Reload 失败 | `Notes/logs/plugin_anchors_before_rename.json`、`plugin_anchors_after_rename.json`、`preload_anchor_reload_diagnostic.json`、`plugin_anchor_original_names_restored.json`，后三项同在 `Notes/logs` |
| 冷启动配置与最终编译范围 | `Notes/logs/cold_start_configuration_11.json`、`Notes/logs/compile_gate_minimap_guard_cold_11.json` |
| Shader 名称登记和原程序像素 | `Tools/ShaderBinaryResearch/Complete/native_registration_probe.json`、`native_fullscreen_variants_probe.json`，后一项同目录 |
| 原生 Shader 退出后失效与修复 | `Notes/logs/post_play_native_registry_lifetime_06.json`、`Notes/logs/post_stop_registry_lifetime_07.json` |
| 远处箱子查找候选与编译边界 | `Tools/TutorialRouteHelperFix/validation.json`、`Tools/TutorialRouteHelperFix/gun_preparation_audit.json` |
| 路径超时、到达但未触碰、真实搜索就绪 | `Notes/logs/tutorial_route_20261015_022446_22755034.json`、`tutorial_route_20261015_022547_0943ec20.json`、`tutorial_route_20261015_022718_7ff13841.json`，后三项均在 `Notes/logs` |
| Fog 材质继承缺陷与实际所有权验证 | `Tools/FogRecovery/LifetimeFix/integration_receipt.json`、`Notes/logs/fog_material_ownership_actual_08.json` |
| Minimap 首次失败、机制探针和真实重进 | `Notes/logs/runtime_verification_20261014_183559_5260c7cc.json`、`Notes/logs/minimap_lifecycle_fixture_61aa1324ae1d4059a218978a4f592e84.json`、`Notes/logs/runtime_verification_20261014_185444_a70d2cf4.json` |
| 原枪攻击与独立射线/HP 证据 | `Notes/logs/runtime_verification_20261014_183429_8fc127a3.json`、`Notes/logs/tutorial_line_observer_20261015_023421_e4f31e4c.json` |
| 主报告仍保留真实失败 | `Notes/logs/runtime_verification_20261014_182207_da688cf2.json`，整体 fail，Steam 初始化失败与枪前置阻塞保留；各已通过步骤单列 |
| Editor 恢复与备份完整性 | `Notes/logs/editor_unresponsive_recovery_09.json`、`Tools/EditorRecovery/scene_backup_preservation_09.json` |

公共入口维护者可在 SKILL.md 中按需链接 `references/chawu-session-coordination-lessons.md`，用于接手 Unity 发布包恢复、处理脚本身份/Shader 原生寿命或候选工装联调。
