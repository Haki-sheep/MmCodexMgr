# 数据源与专业方法

调研日期 2026-10-31 下列页面与仓库用于方法来源和接口发现 使用时重新核对版本 权限 数据覆盖与服务条款 本技能未安装这些依赖 未测试其付费接口 不把项目介绍当成盈利证据

## 已吸收的方法

| 来源 | 吸收内容 | 适用边界 |
| --- | --- | --- |
| [AKShare公募基金文档](https://akshare.akfamily.xyz/data/fund/fund_public.html) 与 [仓库文档](https://github.com/akfamily/akshare/blob/main/docs/data/fund/fund_public.md) | 基金名称 净值 历史 分红 申赎状态的批量数据组织 | 多数为第三方公开网页封装 上游可能变更 缺失不补0 不是支付宝交易或账户接口 |
| Tushare [基金净值](https://tushare.pro/document/2?doc_id=119) 与 [基金持仓](https://tushare.pro/document/2?doc_id=121) | 区分净值日期 公告日期 持仓期末日期 使用结构化字段 | Token 权限 积分和限频需核实 不默认用户已经购买 不泄露凭证 |
| [Morningstar基金研究方法](https://www.morningstar.com/funds/whats-changing-not-changing-with-morningstar-medalist-rating) 与 [官方定义](https://design.morningstar.com/foundations/medalist-rating) | 人员 流程 管理机构及费用的比较 从同类基金中筛选产品 | 面向较长期相对表现 不等于本月择时 不复制或伪称官方评级 |
| [FinRobot](https://github.com/AI4Finance-Foundation/FinRobot) 与 [研究论文](https://arxiv.org/abs/2411.08804) | 将事件 财务指标 估值和研究报告连接成可核验依据 | 主要面向股票研究 应在穿透持仓后使用 不照搬估值参数 不必启用多Agent或交易功能 |
| [Microsoft Qlib](https://github.com/microsoft/qlib) 与 [工作流文档](https://qlib.readthedocs.io/en/latest/component/workflow.html) | 数据处理 时间切片 模型与评估分离 保存实验配置与结果 | 日报无需训练模型 不把股票默认回测改名为场外基金回测 不把研究框架视为现成获利策略 |
| LEAN [现实建模](https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/key-concepts) 与 [时间建模](https://www.quantconnect.com/docs/v1/key-concepts/understanding-time) | 费用 成交与结算模型 按可知时间重放事件 | 场外基金需适配未知价 申赎和到账机制 不能直接套用股票默认成交假设 |

这里只概括吸收方法 未复制上述项目实现或大段文档 不安装FinRobot Qlib LEAN不影响默认联网研究流程

## 来源优先级

1. 产品身份 费率 开放日与重大变更 以基金公司最新公告 产品资料概要 招募说明书和用户渠道页面为准
2. 政策与宏观 用原发布机构 包括 [国家统计局](https://www.stats.gov.cn/) [中国人民银行](https://www.pbc.gov.cn/) [财政部](https://www.mof.gov.cn/) [中国证监会](https://www.csrc.gov.cn/) [美联储](https://www.federalreserve.gov/)
3. 公司基本面 用交易所公告与公司投资者关系 原始指数资料用 [中证指数](https://www.csindex.com.cn/) 或相应指数编制机构
4. 黄金现货参考用 [上海黄金交易所每日行情](https://www.sge.com.cn/sjzx/quotation_daily_new) 报价不等于黄金基金的净值与成交价格
5. 批量结构化数据可用AKShare Tushare及合规销售机构的公开产品数据 用基金公司抽查异常值
6. 可靠财经媒体用于发现事件与补充语境 能找到原文时追溯原文 营销页 论坛 自媒体和生成式日报不能成为重大操作的唯一依据

## 可选取数入口

AKShare接口名称按当前文档核对后再使用

```python
import akshare as ak

FundNameList = ak.fund_name_em()
FundNavList = ak.fund_open_fund_daily_em()
FundHistoryList = ak.fund_open_fund_info_em(
    symbol="007339", indicator="单位净值走势"
)
```

返回字段 日期 更新时段与空表语义必须检查 不默认每日表包含全部候选 不把估值接口缺失伪装成0涨跌

Tushare接口 `fund_basic` `fund_nav` `fund_portfolio` 需先确认用户具有相应权限 日期字段按官方文档解释 股票持仓表不一定完整呈现联接基金的目标ETF暴露

没有库或密钥时按公开官方页面研究 明确这是网页研究模式 不声称已接入API 不为验证而自动购买权限 不将token写进技能 配置 日志或报告

## 数据证据记录

每份研究至少保留决定建议的事实来源 产品代码 指标 数值 单位 数据有效日期 原始公开时间 获取时间 与是否有修订

单位净值与累计净值不混算 日涨跌优先使用经核实的公布值 遇到分红或拆分时校验复权口径 两个复制同一上游的网站只算一条证据链

行情抓取失败记录来源与错误 再查询不同已授权来源 不修改系统时间 不关闭验证 不使用随机值或旧缓存掩盖失败
