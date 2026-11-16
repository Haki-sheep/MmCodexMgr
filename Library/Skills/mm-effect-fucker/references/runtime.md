# 运行时来源与维护

`runtime/browser/engine.js` 是从 FX Forge 的 main 提取并构建的独立浏览器模块 完整提交见 runtime/manifest.json 的 sourceCommit
`assets/forge-core/` 保留实际依赖的源码 原有注释保持原样 逐文件摘要位于 `runtime/manifest.json`
本地修正 `src/engine/sprites.ts` 的拖尾透明遮罩 遮罩覆盖整张画布 避免 destination-in 擦掉头部区域之外的拖尾
本地修正 `src/engine/sim3d/particle.ts` 的出生帧速度 使用恒定速度或对应曲线首值初始化 避免 stretched 粒子在首帧朝向错误
`assets/browser/` 是本 Skill 的无存储适配层 不连接原应用数据库 写租约 页面 MCP 或模型网关
依赖的 three fflate gifenc 许可文本放在 `runtime/licenses/`
原 FX Forge 副本未提供独立 LICENSE 本包保留其来源标识 本次未发布远端

## 构建

日常运行不需要源码构建 Vite 和 npm
更新核心时显式提供工具链目录 该目录的 node_modules 应包含 manifest 中记录的精确依赖版本

```text
node <skill>/scripts/build.mjs --toolchain <dependency-project>
node <skill>/scripts/build.mjs --source <FX-Forge-source> --source-commit <full-git-sha> --toolchain <dependency-project>
```

第一条从包内源码重建 第二条仅在明确更新来源时重新提取依赖
重新提取来源会覆盖本地修正 必须运行包含拖尾透明度与出生帧朝向检查的 selftest 再接纳新版本
构建不修改来源工程 Vite 缓存放系统 TEMP 最终只更新本 Skill 的源码快照和运行时
更新后运行自测 必要时复核真实 Unity 编译与采样 不将打包成功视作运行验证

## 当前验证范围

本次验证记录见 `evidence/` 其中历史失败和修复保留在 validation.json
`evidence/trail-fix/` 保留拖尾修复前的失败及该次运行时的 21 项自测结果
`evidence/velocity-birth-fix/` 保留出生帧朝向修复前后的实际像素边界与当时运行时的 22 项自测结果 自测中的对照角色会污染像素边界 测试现场显式关闭该角色
新版本的自测覆盖自定义网格预览与导出隔离 首帧速度曲线及缺失贴图拒绝
根目录原始验证文件记录首次交付状态 其中的 Unity 实测不代表之后修改的预设或 Shader 已通过 Unity 验证
渲染验证使用 Windows x64 Node 24 Chromium FFmpeg
在线导入验证使用 FakeUnityCLI 与 Unity 2022.3.62f3 的自有临时工程
其他平台 Unity 版本与管线需要目标验证 不由代码可运行推定全部支持
