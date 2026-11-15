# 通过 FakeUnityCLI 导入与采样

先加载 `mm-fake-unity-fucker` 使用其当前版本和目标工程契约
普通操作优先结构化命令 这里只有粒子包转换与定点渲染需要专用 C# 适配
适配脚本通过已存在的 `editor exec --code-file -` 输入 不安装另一套通信桥 不手写 Unity YAML 或 meta

## 准备

1. 用户指定目标工程时先查 project capabilities 及对应 preflight
2. 查 editor status 和保护状态 需要 Bridge 初始化时走 FakeUnityCLI 的更新或首次安装流程
3. `unity.mjs run` 要求目标 Editor 已在线 其本身不安装 Bridge 不启动或关闭用户 Editor
4. 导出目录必须来自 `effect.mjs export-unity` 导入前再次检查全部文件 SHA256

```text
node <skill>/scripts/unity.mjs plan --export <export-directory> --project <Unity-root> --out <new-plan.json> --times 0.64,0.80,2.76,2.92 --view-file <camera.json>
node <skill>/scripts/unity.mjs run --plan <plan.json> --fuc <actual-fuc-executable> --out <new-evidence-directory> --yes
```

plan 不修改 Unity 资产 输出目标 文件清单和采样设置
run 的 `--yes` 表示当前任务已授权这些写入 不要求已有授权用户再次确认
FUC 路径必须来自实际 Skill 或工程入口 不复制另一个二进制来替换既有版本
工程统一启动脚本需要额外参数时 使用计划中的相同阶段经该入口执行 不绕开项目选择规则

## 执行合同

- 用 operation-prepare edit-required 检查运行状态和保护 只接受明确 allowed=true
- C# StagePackage 先校验全部输入 仅向 `Assets/FXForge/` 补充新文件 既有相同文件保留
  遇到内容不同的既有文件会在本次写入前拒绝 通过新效果名 新 Shader ID 或明确迁移任务解决
- 每个效果的贴图 网格 JSON 粒子 JSON 和生成的 Material Prefab 放在按内容标识的 `Variants/fx_<hash>/`
  避免原导入器按层 ID 命名材质时让不同效果互相覆盖 共享的 C# 和 Shader 保持一份
- 素材与源码由 Editor 内的适配逻辑导入 目录由 AssetDatabase 创建 下一步使用结构化 editor import 和编译门禁
  首次加入 C# 时先导入脚本并等待编译和重载 然后导入素材与效果 JSON 确保原生后处理器已经可用
- 根下运行时代码是共享的 不给每个效果复制另一份 FXForge C# 类型 不用导入来覆盖已有不同版本
- 编译回执保存于 `04-compile.json` 只有新的 generation 完整 coverage 零 errors 和最终 ready 才报告编译通过
  只有素材变化时先执行结构化 import 再显式请求新编译 不能等待素材导入自行触发 C# 编译
  编译完成后最多等待 60 秒让同一 Editor 完成重载 每次状态保留回执 不重发写入请求
- CaptureEffect 在 NewPreviewScene 内加载已经导入的 Prefab 原生 Simulate 并 Camera.Render
  finally 释放 RenderTexture 和预览场景 不保存用户场景 不修改色彩空间和渲染管线
- 只对本次新建效果目录内的材质调用 SaveAssetIfDirty 不使用全局 SaveAssets 不重建既有 Prefab
- 回传 Prefab 路径 各层粒子数 采样图 Shader 错误 警告及当前色彩空间
  此结果仅证明 Editor 采样 不证明 Play 生命周期 URP HDRP Player 和真机

所有阶段保留完整 FUC 回执及稳定 request ID
`expired` 表示未执行 `processing_timeout` 或 `outcome_unknown` 必须查同一 request ID
停止重跑计划 不换 ID 不删队列 不关闭 Unity 来重试 已写入部分不承诺自动回滚

## 复核与局限

在本次使用的目标版本里看原生输出 对比网页参考时相机 Z 转换由适配器统一完成
噪声场 随机分布 反复碰撞与网页近似模拟有差异
Bloom 不由粒子预制体自动创建 项目需要时另按其渲染管线配置
Gamma 与 Linear 会影响混合观感 本适配器回报实际值 不自动改 ProjectSettings
旧项目已有 FXForge 资产时先核对内容冲突 当前策略是追加与相同内容复用 不执行覆盖更新
