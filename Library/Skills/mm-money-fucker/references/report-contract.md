# 日报消息与结构化输入

## 用户可见消息

开头一行写北京时间的分析日期与截止时刻 如 `2026-11-02 14:00 北京时间｜各行显示最近已公布净值日期`

所有产品净值日期相同时 表头可用 `11月1日净值／日涨跌` 日期不同时使用 `净值日期／净值／日涨跌` 每行保留真实日期 不将QDII统一改成境内日期

主表固定四列 至少10只不同产品 产品名与六位代码带对应产品或数据来源链接

| 产品 | 净值日期／净值／日涨跌 | 建议 | 买入金额 |
| --- | --- | --- | --- |
| 产品名称及代码链接 | 实际日期与已核实数值 | 买入 持有 卖出 观望或待核验 加一句主要依据 | 本次新增金额 |

这只是格式定义 表格中不预填本轮操作金额与历史行情 不继承过去报告的观望或买入结论

建议列在卖出时写 `卖出X份｜关键原因` 参考金额如给出需写约数 不能保证到账金额 买入金额列仍为0元 持有与观望均为0元 数据不明写待核验而不把净值写0

默认表尾最多补充三项

1. 建议买入合计与可用现金口径 持仓状态不明则提示待同步
2. 最重要的1至3条事件与原始来源 可与上一项合并成简短行
3. 会改变操作的关键条件 或该产品必要的费用和确认提醒

不默认输出16项长清单 完整研究记录 持仓细节或回测过程 不添加收益保证 胜率与无依据目标价 不因为每日运行就每天交易

若本次来源不可用导致分析未完成 在开头说明 `数据核验未完成` 保留产品行与具体缺项 不把系统故障包装成市场看空

## scripts/render_report.py

脚本只读JSON与生成Markdown 不联网 不获取凭证 不发消息 不交易 调用路径以技能根目录为基准

```powershell
python scripts/render_report.py --input REPORT_JSON
python scripts/render_report.py --input REPORT_JSON --output REPORT_MD
```

根对象字段

| 字段 | 内容 |
| --- | --- |
| as_of | 带时区的ISO8601截止时刻 |
| budget_yuan | 实验预算 十进制字符串 |
| settled_cash_yuan | 已知已到账可用现金 未知为null |
| cash_confirmed | 是否有用户自报或授权证据支持此现金口径 |
| holdings_confirmed | 当前持仓范围与相关可卖份额是否已经同步 未同步时不报精确新增买入或卖出数量 |
| available_shares | 六位代码到可卖份额十进制字符串的对象 无持仓为空对象 |
| rows | 至少10行产品 |
| notes | 最多3条必要补充字符串 |

每行字段

| 字段 | 内容 |
| --- | --- |
| code name url | 六位代码 产品名称 对应产品页或数据页URL |
| nav_date unit_nav daily_change_pct | 净值日期 正数净值 有符号百分数 使用百分数数值如-1.30而非-0.013 未取得为null |
| data_published_at | 本组数据实际已公开的带时区时刻 未知可为null 但不允许精确买卖建议 |
| action | buy sell hold watch unverified |
| reason | 简短已核实的操作依据 |
| buy_amount_yuan | 非负金额 十进制字符串 无新增买入用0 |
| sell_shares | 非负份额 默认0 |
| trade_rules_verified | 此产品当前渠道 申赎费用 限额及可执行性是否核实 |

数字使用字符串避免二进制浮点误差 脚本拒绝浮点JSON数 非有限值 负金额 非正净值 未来数据与超现金建议

正金额买入及精确卖出必须有完整净值 公开时间和已核实交易规则 公开日期不得早于净值所属日期 持仓未同步时不得精确新增买入 不允许同时买卖同一行 不允许重复代码 不把预计卖出回款加入现金

`trade_rules_verified` 和确认标志由研究者对真实证据负责 脚本无法验证网页内容真假 通过脚本不代表行情正确或建议能够盈利

## 持久记录契约

`config/profile.json` 的 `state_directory` 是本用户独立状态目录 原始版与已安装版使用同一目录 不把真实账户数据放进技能包 不将本机路径推广为其他用户默认值

`scripts/portfolio_state.py` 只负责验证和追加保存AI提取的数据 不识图 不联网 不交易 不自动重建成交后的余额 所有金额和份额使用十进制字符串 未知为null 收益可为负值

```powershell
python -X utf8 scripts/portfolio_state.py init
python -X utf8 scripts/portfolio_state.py current
python -X utf8 scripts/portfolio_state.py append --input FEEDBACK_JSON
python -X utf8 scripts/portfolio_state.py history
```

命令默认读取当前技能的profile 可用 `--profile` 指定配置 测试用 `--state-dir` 指定独立绝对路径 测试记录不得写入真实状态目录

输入公共字段

| 字段 | 内容 |
| --- | --- |
| kind | snapshot trade cash_flow advice feedback |
| observed_at | 来源记载或用户明确确认的带时区观察或发生时刻 未知为null |
| time_basis | source表示来源时间 user_reported_current表示用户明确称当前状态 unknown与null时刻配套 |
| sources | 非空数组 每项含kind和reference kind为screenshot user_text或model_advice reference标明本轮附件或文字来源 有本地图片或PDF时可加绝对路径file_path |
| unresolved | 尚未识别或解决的问题字符串数组 无问题为空数组 不把猜测写进已知数字字段 |
| supersedes | 可选 被更正记录的record_id 只更正同类记录 原记录保留 已更正时须关联当前有效版本 |
| data | 按类型定义的事实或建议 |

snapshot的data

| 字段 | 内容 |
| --- | --- |
| holdings_complete orders_complete | 两个独立布尔值 是否已核对全部持仓和全部待确认订单 局部截图不得标为完整 |
| settled_cash_yuan investment_total_yuan | 可选 已到账可用现金及同一投资账户范围总额 未显示为null 不混用金额口径 |
| positions | 数组 每项code必填 name可选 shares redeemable_shares market_value_yuan cost_yuan pnl_yuan均可选或为null 份额与金额分开 pnl_yuan记录截图展示的持仓收益口径 |
| pending_orders | 待确认订单数组 使用trade字段且status只能为pending 未取得完整订单页时orders_complete为false |

其他data类型

- trade：code side status必填 side为buy或sell status为pending confirmed或cancelled amount_yuan shares fee_yuan可选或null confirmed至少提供金额或份额 仅有下单成功图不能标为confirmed 可选advice_id关联建议
- cash_flow：flow_type为deposit withdrawal cash_dividend或fee amount_yuan为正金额 外部入金出金与分红费用分别保存 不从资产增长猜测流水
- advice：直接使用本文件定义的完整报告根对象 observed_at等于报告as_of sources只能为model_advice 校验报告后保存原始建议 同一截止时间后发现错误可追加更正 不按未来行情重写
- feedback：advice_id指向已保存建议 outcome为not_executed executed partial或unknown 可加note说明用户反馈 明确执行不代表已取得成交价格与份额

输出record_id由规范化内容哈希生成 recorded_at为本地实际保存时刻 不替代observed_at 相同输入重复写入返回同一记录 文件位于records目录 有本地原图时按内容哈希归档到evidence目录 无本地原图则保留archive_status=reference_only

archived_file sha256 archive_status由脚本生成 输入不能自行声明已归档 原图引用不等于已经保存文件

current返回basis_snapshot及updates_to_review basis只按观察时点选择最近完整持仓快照 后续局部图不删除未展示持仓 旧图晚到不覆盖较新完整快照 无时点记录始终待核对 history包含建议及更正前后所有记录 读取时校验记录内容哈希 修改损坏的记录会报错 不默默跳过

AI在给出精确金额前须处理current中相关更新及未知项 现金 份额和订单状态可确认时才填写日报确认标志 目录存在 记录成功或有一份完整旧快照都不等于当前账户已同步

## bot调用

将 `assets/bot-prompt.txt` 交给有联网能力的bot调度 已安装的技能提供研究步骤 调度器另行设置时间和消息目的地

首次运行提供可访问的技能根目录 用户配置与持久状态路径 每次执行读取current 新反馈按上述契约追加 最终建议保存为advice 不依赖本聊天记忆 接入发送渠道前由用户在bot侧配置授权

## 本机接入检查记录

本次安装检查发现 PATH 中的 codex-cli 0.130.0 无法解析现有全局 model_reasoning_effort = "max" 配置 skills/list 的重载也未采用该进程的临时覆盖

已使用当前桌面版附带的 codex-cli 0.166.0-alpha.5.1 执行只读 skills/list 检查 确认 mm-money-fucker 可被发现 enabled 为 true 且无该技能解析错误 全局配置未修改

未来接入 bot 时先核实它实际使用的 Codex 可执行文件与版本 能否读取用户原有配置 不把宿主兼容性报错当作技能错误 不自动降低用户的模型设置 不在技能内硬编码某个会随更新变化的桌面安装目录
