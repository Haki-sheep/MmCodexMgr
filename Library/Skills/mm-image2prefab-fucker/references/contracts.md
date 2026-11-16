# 独立CLI契约

唯一入口 `node <skill>/scripts/image2prefab.mjs --request-file <绝对JSON路径或->`。
JSON请求统一为`{"command":"命令","task":"绝对任务目录","input":{}}`。`doctor/init`省略task。不要传DSH的task_id/action外层封装。首次命令使用准确路径 后续task仅用init返回directory。所有外部命令通过参数数组调用 不拼shell。


图层本地导入仅在支撑集与预览全部成功后提交状态 修正损坏素材后可用原目录重试 不重发收费拆图。Unity已返回完整终态且资产基线与回执一致的结构失败记为`failed_validation` 保留原Prefab与原始布局基线 用`layout_patch`修正后提交新hash 原hash不重放 无终态或部分写入仍为`unknown`。

## 运行时与任务

| command | input | 结果或前提 |
| --- | --- | --- |
| doctor | python绝对路径 可选fuc绝对路径 | 只检查Node/Python/Pillow/FUC版本 不联网或写Unity |
| init | project source python 可选directory prefabPath fuc | project/source为绝对路径 directory必须不存在 默认工程outputs/image2prefab/新ID 输出task目录及定图 |
| get | {} | 本地状态 不查询上游 不扫描别的任务 |
| structure | description uncertainties数组 可选confirmation人类补充原话 | uncertainties非空且无确认时不准plan |

当前工作流用默认`builtin`登记资源清单及DXX内置拆层。`imagegen`由Agent调用 不传给CLI的model字段。任务配置持久化于task.json。别在此文件填API Key。DXX缺凭据在真实提交之前返回本地错误 不改变任务成上游未知。

## 可选局部观察

`region`的input先填action 以下参数按action选择 不传其他动作字段。

| action | 字段 |
| --- | --- |
| register | regions:[{id,name,parent,box}] 每个box相对父容器 原图像素[left,top,width,height] parent默认root |
| get | 无 |
| view | region_id 可选crop_box scale grid question crop_box相对区域 scale为1到4整数默认2 grid为false/true/[列数,行数] 每轴1到64 |
| submit | analysis:{region_id,view_id?,elements:[{id,name,box,semanticRole,requirements?}],questions:[]} |
| merge | 无 使用已保存各叶级区域submit |

无view_id时元素box相对对应区域 有view_id时相对该查看图片 工具按scale映射；不要手动转换后又传view_id。图层返回的placement优先于查看图的估计位置。局部网格只做视读 不重复网格化已精确拆层结果。

## 拆图

`plan` input:

```json
{"model":"builtin","layerSize":"1K","prompt":"只写额外任务语义 不重复整份规则","elements":[
  {"id":"background","name":"无前景干净背景","semanticRole":"background","box":[0,0,1776,1488]},
  {"id":"slot","name":"通用紫色装备格","semanticRole":"panel","box":[120,180,200,200],"requirements":"自带固定金边 无图标等级与红点"},
  {"id":"glove","name":"手套图标","semanticRole":"icon","box":[140,200,160,160]},
  {"id":"slot2","reuseOf":"slot"}
]}
```

仅示意box 实际由Agent根据本次图及工具坐标填写 不抄例子。role只支持background panel icon indicator decoration 不将TMP的label/value加入图片清单。

builtin每项可另含regionId/forbiddenContent，复用项仅id/reuseOf。forbiddenContent须为枚举数组 可选ordinaryText variableNumbers otherIndependentElements neighborFragments bakedRankBadge。中文限制写requirements 省略时使用默认禁止项。背景box必须整屏。plan只保存不收费。

`name`使用简短可辨认的素材名 `requirements`仅写该素材独有约束 通用透明 去文案数字 去邻项 固定边框及品质标分离规则已由工具加入 不逐素材重复。先查看plan返回的请求数 不为减少请求截断约束或合并应独立替换的元素。

`decompose` input:`{"planId":"plan返回的真实ID"}` 同步执行并保存manifest、layer-overview.jpg、图层及visible-support。请求失败保留成功批次 不重放整批。

`layers_import` input:`{"directory":"已有manifest.json和layers目录的绝对目录"}`。先plan固定资源清单 再接入本次定图已产生的拆层结果或按下节整理的`imagegen`图层。

## imagegen接入

用Codex内置`image_gen`编辑本次定图 每次输出一个可独立使用的素材。独立前景要求透明背景并核对实际alpha与轮廓 背景要求不透明且保持原图构图与比例。把选定的实际PNG复制到当前任务目录 保存提示词与对应素材路径。

- **逐素材生成整套图层**。`plan`后直接调用`imagegen` 将PNG放入任务内图层包的`layers/`。同目录`manifest.json`填`documentWidth`和`documentHeight`为定图宽高 `items`每项包含`id` `name` `file` `role:"layer"` `semanticRole` `zIndex` `placement:{left,top,width,height}`。`file`相对于`layers/` 位置和尺寸按原图参考框填写 背景铺满定图。用`layers_import`接入后按实际图层ID验收绑定。复用素材只生成一次。
- **现有图层补缺或替换**。生成后用`material_import`导入PNG 对照原图后走`material_accept` → `material_bind`。补全屏背景时 导入文件须与定图或拆层画布尺寸一致且完全不透明。若构图和比例一致 仅分辨率不同可按目标尺寸重采样。更新绑定时将被替换的图层显式记为unused或按Layout替换契约处理。

CLI仍保留旧DXX接口供兼容。当前Skill只在`builtin`拆层时调用DXX 生图和补图用`imagegen`。

## 素材

| command | input |
| --- | --- |
| material_inspect | items:[{layer_id或material_id,crop_box?,scale?,question?}] 局部坐标是该位图像素 含crop时必须具体question |
| material_split | items:[{inspection_id,groups:[{name,semantic_role,component_ids:[]}]}] 所有连通块恰好归属一次 |
| material_import | image_path material_kind semantic_role 可选name crop_box clear_boxes chroma_key |
| material_accept | items:[{review_id,expected_size:[w,h],reason,crop_review?}] 本地裁图还须crop_review |
| material_bind | bindings:[{resource_id,reference_region_id,layer_ids:[],material_ids:[],checks:{noForbiddenContent:"passed",completeContour:"passed"},reason}] 可选unused_layers:[{layer_id,reason}] |

material_kind为background/icon/decoration；semantic_role为background/panel/icon/indicator/decoration。原始截图不可用改成decoration绕过原子化。裁图crop_box/clear_boxes为位图[left,top,width,height]；chroma_key={color:[r,g,b],tolerance,feather}。裁图不能修补背景。import不会自动验收。

绑定仅提交变化资源 未指定regionId时reference_region_id=root；否则使用资源登记regionId。checks允许passed/failed/unknown 工具拒绝不完整/缺陷进入布局，不会自行替你判断干净与否。旧图层替换后显式unused或layout.replacements 不默默忽略。

当前CLI仍须显式填写layer_ids和material_ids两个数组 未使用一侧为[] reference_region_id也须显式填写。不要套用DSH新版省略字段或传issues。明确缺陷用已有checks的failed和reason留存区域、实际请求文件及返回素材路径 不以单连通块或完整透明轮廓代替语义原子化结论。

## Layout与Unity

### Layout简写

以下省略项由工具确定性展开 显式参数仍优先 不依据名称或文字内容猜职责。

- `layout`和`rootLayout`允许直接填`vertical/horizontal/grid/overlay` 对应`{type:...}`。
- 省略`kind`时 `text`字段推导为text 素材引用推导为image `layout`推导为group `componentId/prefab`推导为prefab。多个信号并存或没有信号直接报错。可交互按钮必须显式`kind:button` 不能由图片猜交互。
- image省略`semanticRole`时继承`material_bind`对应资源目录的职责；独立accepted素材可继承自身semanticRole。同一引用对应多个职责时报错。其他类型默认text为label button为button prefab为item overlay容器为panel 排列容器为list 可显式覆盖。
- 布局顶层`font`或`fontId`指定公共字体 文字节点和components继承；节点或component显式字体优先。两个字段不可同时指定 换字体来源时用patch将旧字段设null。继承来源保存在草案中 公共字体patch只更新继承节点 不覆盖节点专用字体。
- Grid缺少cellSize或constraintCount时 从子项参考矩形推导；需等尺寸 等步长 从左到右逐行排列 最后一行可不满 不允许空洞 乱序或交叠。坐标一致性容差为1设计像素。自动补齐格子尺寸 行列间距及四边padding。其他排列方向或不规则数据须显式参数；不放宽检测静默猜位置。
- rootLayout省略时 参与排列的根子项为1个使用vertical 多个使用overlay保持原参考位置。背景不参与排列。页面内部仍必须存在真实LayoutGroup。

简写示例：

```json
{"font":"Assets/Fonts/Chinese.asset","nodes":[
  {"id":"background","layerId":"实际背景ID"},
  {"id":"items","layout":"grid","box":[90,90,164,164]},
  {"id":"first","parent":"items","layerId":"实际图标ID","box":[100,100,64,64]},
  {"id":"second","parent":"items","layerId":"实际图标ID","box":[180,100,64,64]}
]}
```

素材ID必须来自本任务验收绑定 示例数值仅说明字段；普通文案仍为独立text节点。

`preflight` input:{} 返回fontCatalog和sourceFonts。fontCatalog[].id用于fontId 或用真实Assets/...asset路径作为font 不传字体名称。没有所需字形时用mm-fake-unity-fucker准备专用TMP字体 禁止改共享字体或自己模拟描边。

`layout` input:

```json
{"name":"UIRoot","canvasSize":[1776,1488],"coordinateSize":[1776,1488],"rootLayout":{"type":"overlay"},"nodes":[
  {"id":"background","kind":"image","semanticRole":"background","layerId":"实际背景图层ID"},
  {"id":"equipment","kind":"group","semanticRole":"list","box":[120,180,200,650],"layout":{"type":"vertical","spacing":[0,25]}},
  {"id":"item1","kind":"group","parent":"equipment","semanticRole":"item","box":[120,180,200,200],"layout":{"type":"overlay"}},
  {"id":"slot","kind":"image","parent":"item1","semanticRole":"panel","layerId":"实际格底ID","box":[120,180,200,200]},
  {"id":"icon","kind":"image","parent":"item1","semanticRole":"icon","layerId":"实际图标ID","content":{"fit":"contain"}},
  {"id":"level","kind":"text","parent":"item1","semanticRole":"value","text":"12","fontId":"preflight返回ID","fontSize":30,"color":[1,1,1,1],"box":[250,330,50,40],"placement":{"mode":"reference","anchor":"bottomRight"}}
]}
```

此示例仅说明字段 真实页面须包含全部资源和条目。`nodes`扁平数组 用parent引用 层级不是children；root由工具生成，不自己定义id=root。页面node.box是统一原图/coordinateSize全局坐标，工具计算父局部位置；仅region注册用父局部box。局部组件components内使用自己的canvasSize/coordinateSize局部基准。不要混两套坐标。

每个节点须有`semanticRole` 允许background/panel/header/navigation/list/item/icon/indicator/label/value/button/input/decoration/overlay 不使用group作为职责。根下只有background图片可直接作为视觉节点 角色展示 科技入口和按钮等先放进对应group。已验收补图或裁图使用`materialId` 与`layerId`及`sprite`互斥 切换引用时用patch将旧字段设为null。

同父级overlay默认按格底panel或button 0 图标icon 10 装饰decoration 20 角标indicator 30 TMP文字100绘制 显式`zIndex`优先。水平垂直及网格排列按`order`或提交顺序处理。批次图层ID可含冒号 CLI会为实际文件名生成稳定安全映射 仍使用工具返回的原始layerId 不重新导入或修改图层ID来规避路径字符。

group必须layout，type为horizontal/vertical/grid/overlay。主体排列必须存在真实group Layout组件 root设置Layout不能代替全部容器。可省padding/spacing由参考范围推导 参考范围不完整时给box/bounds/layerId或stretch。spacing推荐二元[x,y] padding为[left,top,right,bottom]整数。grid完整形式包含cellSize:[w,h]、constraint:fixedColumnCount/fixedRowCount/flexible、非flexible时constraintCount正整数；简写缺项按上方规则测量 不规则情况必须显式填写。

layoutElement支持minSize/preferredSize/flexibleSize二元数组及ignoreLayout。Grid的子项不要同时传LayoutElement尺寸。容器管理位置的子项不要另设placement；独立装饰设ignoreLayout或放overlay容器。

placement.mode为reference/anchor/stretch。anchor可topLeft/topCenter/topRight/middleLeft/center/middleRight/bottomLeft/bottomCenter/bottomRight。reference保留参考位置 anchor配offset:[x,y]（Unity局部坐标x右y上） stretch配insets:{left,top,right,bottom}。pivot由工具中心化。文字alignment是TMP对齐（Center/Left/Right等） 不是锚点。图片content.fit=contain为等比完整容纳 stretch为拉伸填满；content.alignment仅center。

文字允许fontSize fontStyle alignment wordWrap overflow autoSize color，颜色RGBA 0到1。textColor/outline/shadow明确不支持。普通文本只一层TMP 品质标选择图片或TMP一个来源。button用kind=button 生成真实Button组件 不只画图像。

`components`可定义{id,name,prefabPath,canvasSize,coordinateSize,rootLayout,nodes}，页面用kind=prefab、componentId引用；可选overrides只改实例字段。明确要求同款条目复用时定义一个模板 页面多个prefab节点引用它 核对真实引用数量 不能用同Sprite的多个group替代。当前CLI没有顶层instances字段 不传DSH实例简写。不是所有页面都强制套预设模板。完整字段以CLI --help及核心严格校验为准。

`layout_patch` input只发变化 如`{"nodes":[{"id":"level","fontSize":28}]}`；可remove:[id]。草案失败也保存 只修错字段 不重发全树。`apply` input:{}，首次新建 后续按真实applied基准原位update；输入计划变化自动推导字段差量 保留用户手动位置。已有组件模板整体改动/节点类型变更当前不支持 明确报告，不偷重建。

首次apply之前可在layout或layout_patch中设置新`prefabPath` 成功编译后任务同步采用该路径。原路径和新路径均须没有已有Prefab及meta 且无running/unknown的Unity或字体操作。已应用的Prefab继续原位更新 不通过改路径重建。

apply完成已包含截图与结构检查。不再额外inspect 主Agent不再审核。不写Unity YAML/meta 不绕过Bridge。

## 评分与异常

`report` input:{scores:{layout:0..40,images:0..30,text:0..20,background:0..10},deductions:[{category,points,reason,evidenceRegion}],functionalIssues:[]}。各项满分减扣分须等于得分 80分且functionalIssues为空才通过；必须先查看真实Unity截图 不凭结构通过填100。报告绑定当前源图、已应用计划和截图哈希。评分是执行者视觉判断 不声称客观精度。

`reason`与`evidenceRegion`为非空字符串 区域可写`左中装备格 x100 y550 宽280 高215` 不传坐标数组。

长操作同步等待原进程 不用status/get主动轮询；主机工具session继续wait同一session。错误看返回首错与对应操作目录。submission-started.json标记实际收费提交，pending-request.json/receipts.json/applied.json/result.json是Unity证据。程序结束但无收据时状态unknown，停止自动写入和重提 收据只读核实由人类决定下一步。不要把原生查询接口用于自动恢复或原请求重发。

task锁防同任务重入；跨任务同一Unity工程由执行者串行使用。不通过新任务绕过旧任务未知收费请求。任务目录不删除 原成功图片及Prefab始终保留。

初次preflight检查Prefab Stage。每次apply先保存本地操作记录 Unity写前由guard-check和装配模板检查现场及Prefab Stage。无applied.json/result.json时 仅单条guard-check明确拒绝或guard通过后首条装配模板返回可核实的写前终态 才记录rejected_before_write。现场恢复后可再次apply 原错误和收据保留并归档。真正未知或已开始写入仍锁定。

`resolve_preflight` input:`{operationId,authorization}` 用于旧版本误记为unknown的同类请求 由人类明确授权继续后按上述收据核实与归档。guard-check未提交Unity请求时requestId为null。不用于收费请求恢复。
