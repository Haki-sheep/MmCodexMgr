# 特效制作

## 数据与单位

以 `schema --kind emitter3d` 的完整默认对象作为图层模板 只修改当前目标相关字段
现有 ID 保持稳定 复制层或素材使用新 ID 3D 最多 32 层 包含空节点
贴图 ID 为 `a_` 加 4～24 位小写字母或数字 Shader ID 用 `s_` 自定义网格 ID 用 `m_`

| 字段 | 语义 |
|---|---|
| duration bursts.time startDelay stopAfter startLifetime | 秒 |
| position startSize startSpeed velocity force | Unity 米制位置 尺寸 米每秒及米每平方秒 |
| rotation startRotation spin | 角度与度每秒 |
| orbital | 弧度每秒 |
| fadeIn fadeOut | 粒子寿命比例 |
| parentId | 层级父节点 空字符串代表根 |
| empty | 仅 Transform 的分组节点 |
| material.shader | 本包 shaders 中的自定义着色器 ID |
| mesh | renderMode 为 mesh 时使用的内置网格名或 meshes 中的自定义网格 ID |
| velocityCurveX/Y/Z | 对应轴的速度曲线 时间为归一化粒子寿命 空曲线沿用 velocity |

可省略默认字段 渲染时补齐 但已经提供的字段若被截断 取默认或改值会拒绝
startDelay 与 stopAfter 都是从效果开始计算的发射时刻 stopAfter 大于零时需要晚于 startDelay
把错误当作结构问题修复 不通过删除校验或放宽断言使其通过
`analyzeEffect` 检查粒子峰值 范围 存活时间与材质组合 其 No problems found 不是视觉评分
其 24 个时间采样可能漏掉短闪光 材质 intensity 检查也不识别自定义 Shader 返回的 HDR 值 对相关提示结合实际帧复核

## 节奏与方向

- 先做主体轮廓和运动 再补细碎粒子 晕染和光效 同时出现的大面积元素要有明确主次
- 蓄势 出手 命中 消散分别安排发射时刻和寿命 短促攻击不要被慢拖尾重新拉长
- 刀光在末段可从尾部侵蚀或顺势前送 需要逐帧检查刀尖与材质纹理的实际运动
  UV 刀锋停止后继续旋转整片网格可能出现反向回抽 不能只凭 spin 正负判断屏幕方向
- 需要透明水墨时用 normal 混合 控制浓墨 飞白 淡墨和飞溅层次 强 Bloom 会吞掉这些细节
- 同轮比较保持相机 随机种子 分辨率和速度一致 关键帧之外还要看完整动图

## 自定义网格

复用 FX Forge 导出的 meshes 记录 保留 id name description source createdAt updatedAt
新网格的 source 可用 lathe extrude sweep 或 raw 字段定义见 [meshSource.ts](../assets/forge-core/src/engine/meshes/meshSource.ts)
坐标使用 Unity 左手系 Y 向上 单位为米 自定义网格随预设进入 WebGL 预览和 Unity 导出包

## 自定义 Shader

```glsl
vec4 fxCustom(vec2 uv, vec4 tint, float life, float rnd, float age) {
    float edge = smoothstep(life - 0.15, life + 0.15, uv.x);
    return vec4(tint.rgb, tint.a * edge);
}
```

输入为 UV 线性色 tint 生命周期比例 life 每粒子稳定随机数 rnd 和年龄秒数 age
允许普通辅助函数 `fxTex(uv)` `fxNoise(uv)` 常见 GLSL 数学 返回线性 RGB 与 alpha
禁止自行声明 uniform sampler 矩阵 预处理宏 discard 和直接 texture2D 采样
Shader 受限方言的权威实现为 `assets/forge-core/src/shaders/dialect.ts`

优先用 life 和 age 驱动需要逐帧复现的运动
`fxTime` 在网页为播放时刻 在 Unity 为 `_Time.y` 定点 Simulate 时两者不保证一致
WebGL 编译与 HLSL 编译分开记录 后者只有真正导入 Unity 才算完成

## 参考素材与已有示例

`assets/examples/sumi-forward.fxpreset.json` 是这次制作的水墨三连斩 包含 19 层和 7 个 Shader
同目录 `sumi-view.json` 保存对应机位 可用于管线验证或相近风格的起点
不要将该案例的刀数 配色 时长和机位写成所有特效的固定要求
视频参考应按用户指定区间抽帧 关注轮廓 运动路径 起落节奏和色彩 不把数值匹配当作还原度
