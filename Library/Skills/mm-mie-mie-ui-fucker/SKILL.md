---
name: mm-mie-mie-ui-fucker
description: >-
  MieMieUIFrameWork Runtime 面板架构 一壳多功能脚本 生命周期在 UI 壳 Bind
  用于改 BagPanel/PlayerPanel 等 *Panel、*Gen、PlayerPart/Host/Preview/StackFlow
  以及拆 UI 功能脚本、InitComponents、避免污染 Gen 时
---

# mm-mie-mie-ui-fucker

针对 `Assets/Scripts/4_UI/` 下 Runtime（`MieMieUIFrameWork.GameRuntime` / `MieMieUIFrameWork.Runtime`）。

## 核心结构

通常是 **一个 UI 壳 + 各种功能脚本**：

| 角色 | 典型类 | 职责 |
|------|--------|------|
| UI 壳 | `BagPanel` / `*Panel`（`UIWindowBase`） | 生命周期编排 业务决策 对外 API |
| View 生成 | `*Gen`（自动生成） | 只挂「编排入口」组件引用 |
| 功能脚本 | Host / Hotspot / Preview / StackFlow / ThrowRect… | 节点自治 UI 状态与局部逻辑 |

## 生命周期统一到壳内 Bind

壳的 `OnAwake`（或唯一初始化入口）里 **统一 Bind**：

1. 取 `*Gen`（或壳上字段）
2. 依次 `BindXxx` → 功能脚本的 `InitComponents` / `BindView`
3. 注入壳侧回调（如世界掉落、卸装）
4. `OnShow` / `OnHide` / `OnDestroy` 只调功能脚本的开闭与释放

功能脚本：

- 自备 `SerializeField` 引用 不向 `*Gen` 塞局部 Rect/Slider/子节点
- `InitComponents` / `Bind` **只允许壳调用一次**
- 禁止在 Show/Refresh/Set 里重复初始化

参考现网：`BagPanel.OnAwake` → `BindContainerHost` / `BindStackFlow` / `BindDropZones` / `BindModelPreview`。

## *Gen 该留什么

**保留**：壳要编排的入口组件（如 `ModelHotspot`、`BagMainContainerHost`、`ThrowRect`、`StackMenu`）。

**不要进 Gen**：

- 功能脚本内部子节点（热区 Rect、预览 RawImage、槽位 GridContainerGroup…）
- 可被功能脚本 `GetComponent` / `SerializeField` 自己拿到的东西

改 prefab 绑定后用 UI 生成器重生 Gen；禁止手改无关业务进 Gen。

## 业务放哪

- **壳 partial**：跨容器装备、拾取、IUIBagInteract、世界掉落等编排
- **功能脚本**：高亮、RT 预览、堆叠菜单 UI 流程、容器显隐排序等局部状态
- 回调方向：功能脚本事件/委托 → 壳处理；壳不反向掏功能脚本私有字段

## 拆新功能时

1. 新脚本挂到对应 Part 节点
2. 字段引用放脚本自身
3. 壳增加一次 `BindXxx` + Show/Hide/Destroy 接线
4. Gen 最多加该脚本组件入口（若壳需要）
5. 更新 `Docs/Modules/4_UI.md` 最后核验日期
