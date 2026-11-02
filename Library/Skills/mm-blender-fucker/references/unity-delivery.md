# Unity 导入 覆盖与交付

使用 Unity 的 ModelImporter TextureImporter AnimatorController PrefabUtility 和 AssetDatabase API 创建或更新资源 不手写 Unity YAML 或猜测 fileID。

- **模型** 静态模型不强制创建 Avatar 或 Animator 带骨架时按用途选择 Generic 或 Humanoid 动画导入开关按实际需要配置 检查根骨骼 蒙皮 朝向 尺寸及相关姿态下的 Renderer bounds。
- **贴图** 将实际使用的贴图单独导入 颜色图按用途使用 sRGB 法线图设为 Normal Map 数据图使用线性空间 检查 UV 和法线方向。
- **材质** 匹配项目渲染管线 为每个材质槽配置外部 `.mat` remap 并显式绑定贴图 双面 透明和裁剪按源数据及实际画面决定。FBX 嵌入纹理不能补齐断开的法线节点 也不能代替外部贴图交付。
- **动画** 配置 take 名 显示名称 帧区间和循环设置 重新导入后用 `LoadAllAssetsAtPath` 获取真实片段引用 不依赖动作顺序。
- **Animator** 没有动画需求或可用片段时不创建空 Controller 有动画时默认采用精简状态图 Entry 默认进入已有 Idle 状态 若有死亡动作则仅增加 Any State → Death 并使用必要的 Death Trigger 条件 关闭自身过渡。其他动作保留独立状态 默认不增加状态互连 自动回待机或 Shoot/Hit 等参数 由业务按需使用 Animator.Play 或 CrossFade 切换。只有用户明确要求状态机逻辑才增加其他参数和过渡 覆盖更新保留未涉及的业务配置。
- **Prefab** 绑定模型 材质及本次需要的 Controller 沿用现有 Prefab 或 Variant 形式 保留用户组件与 overrides。
- **署名** 保留原作者 来源链接 授权和要求的声明 不推断缺失授权 不以动画加工者替换模型作者。

覆盖时沿用原路径和 `.meta` 不先删除再重建。保留 GUID 仍需核对 FBX 子资源 fileID 骨架 层级或 take 名变化可能影响 Controller 和 Prefab Variant 引用。发生变化时修复本次资源引用并检查外部使用者。

Unity 正打开时不关闭用户编辑器 不对同一工程并发启动 batchmode。使用已有 Editor 接口 或工程外同版本同渲染配置的临时工程 临时工程带上原 `.meta` 和必要依赖 不删除用户组件来消除 Missing Script 回写仅同步本次资源增量。

## 标准交付

沿用工程已有目录 无约定时使用以下结构 数量由实际模型决定：

```text
Assets/Arts/<分类>/<角色>/
  Models/<角色>.fbx
  Textures/<实际贴图>
  Materials/<实际材质>.mat
  Animations/<角色>.controller
  <角色>.prefab
  LICENSE.txt
```

- 上述结构按实际交付裁剪 没有动画时不创建 Animations 与 Controller
- 包含必要 `.meta` 动画优先随 FBX 交付 现有工作流需要时才增加独立 `.anim`。
- 沿用现有 Shader 用户要求新增的项目 Shader 放在 `Assets/Arts/ProjectShader`。
- `.blend` 保存在工程外源目录 制作脚本 导入助手 日志 验证场景和截图放在临时目录。
- 默认不添加游戏逻辑 碰撞体 弹丸 特效 README 演示场景或 UPM 配置。
- 用户要求资源包或需要同步已有交付包时 使用 Unity 导出 API 生成 `.unitypackage` 包含模型和实际依赖及署名 排除临时工具 项目场景和整套渲染管线包。

## 验证与收尾

交付涉及动画时执行 [动画验证](animation.md#验证) 即使本次只做导入 也要核对实际片段 状态机与 Prefab 引用。

在 Unity 临时场景实际渲染 检查贴图 法线 朝向 双面和 bounds 自定义 Shader 检查编译及实际 Pass 渲染验证不用 `-nographics` 启动。

核对包内文件与依赖 目标目录只包含本次资源 清理自己的临时助手 不删除用户源文件或历史资源。报告最终路径及实际验证范围 仅在临时工程运行时明确说明 未运行或失败项不能标为通过。
