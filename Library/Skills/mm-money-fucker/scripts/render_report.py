import argparse
import json
import re
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import quote, urlsplit


def ParseDecimal(Value, Field):
    if isinstance(Value, bool) or not isinstance(Value, (str, int)):
        raise ValueError(f"{Field}: 必须使用十进制字符串或整数")
    try:
        Number = Decimal(Value)
    except InvalidOperation as Error:
        raise ValueError(f"{Field}: 非法十进制数 {Value!r}") from Error
    if not Number.is_finite():
        raise ValueError(f"{Field}: 不允许非有限值")
    return Number


def Nonnegative(Value, Field):
    Number = ParseDecimal(Value, Field)
    if Number < 0:
        raise ValueError(f"{Field}: 不允许负值")
    return Number


def Timestamp(Value, Field):
    if not isinstance(Value, str):
        raise ValueError(f"{Field}: 必须是带时区的ISO8601字符串")
    Result = datetime.fromisoformat(Value.replace("Z", "+00:00"))
    if Result.tzinfo is None or Result.utcoffset() is None:
        raise ValueError(f"{Field}: 缺少时区")
    return Result


def CheckBool(Object, Key):
    Value = Object[Key]
    if not isinstance(Value, bool):
        raise ValueError(f"{Key}: 必须是布尔值")
    return Value


def Cell(Value):
    if not isinstance(Value, str) or not Value.strip():
        raise ValueError("消息文本必须是非空字符串")
    return Value.replace("|", "／").replace("\r", " ").replace("\n", " ").strip()


def LinkUrl(Value):
    if not isinstance(Value, str):
        raise ValueError("url: 必须是字符串")
    Parts = urlsplit(Value)
    if Parts.scheme not in {"https", "http"} or not Parts.hostname:
        raise ValueError(f"url: 非法产品来源 {Value!r}")
    if Parts.username or Parts.password or any(Char.isspace() for Char in Value):
        raise ValueError("url: 不允许凭证或空白")
    return quote(Value, safe=":/?&=%#@+;,$-_.!~*'")


def RenderReport(Report):
    AsOf = Timestamp(Report["as_of"], "as_of")
    Beijing = AsOf.astimezone(timezone(timedelta(hours=8)))
    Budget = Nonnegative(Report["budget_yuan"], "budget_yuan")
    Cash = None if Report["settled_cash_yuan"] is None else Nonnegative(
        Report["settled_cash_yuan"], "settled_cash_yuan"
    )
    CashConfirmed = CheckBool(Report, "cash_confirmed")
    HoldingsConfirmed = CheckBool(Report, "holdings_confirmed")
    if CashConfirmed and Cash is None:
        raise ValueError("已确认现金不能为null")
    Available = Report["available_shares"]
    if not isinstance(Available, dict):
        raise ValueError("available_shares: 必须是对象")
    Available = {Code: Nonnegative(Value, f"available_shares.{Code}")
                 for Code, Value in Available.items()}
    Rows = Report["rows"]
    if not isinstance(Rows, list) or len(Rows) < 10:
        raise ValueError("日报必须包含至少10只不同产品")
    Seen = set()
    TotalBuy = Decimal("0")
    Table = []
    for Row in Rows:
        Code = Row["code"]
        if not isinstance(Code, str) or not re.fullmatch(r"[0-9]{6}", Code):
            raise ValueError(f"code: 必须保留六位基金代码 {Code!r}")
        if Code in Seen:
            raise ValueError(f"重复基金代码 {Code}")
        Seen.add(Code)
        Name = Cell(Row["name"]).replace("[", "［").replace("]", "］")
        Url = LinkUrl(Row["url"])
        Reason = Cell(Row["reason"])
        Action = Row["action"]
        Labels = {"buy": "买入", "sell": "卖出", "hold": "持有",
                  "watch": "观望", "unverified": "待核验"}
        if Action not in Labels:
            raise ValueError(f"{Code}: 未知动作 {Action!r}")
        Buy = Nonnegative(Row["buy_amount_yuan"], f"{Code}.buy_amount_yuan")
        Sell = Nonnegative(Row.get("sell_shares", "0"), f"{Code}.sell_shares")
        if Buy != Buy.quantize(Decimal("0.01")):
            raise ValueError(f"{Code}: 买入金额最多保留两位小数")
        if (Action == "buy") != (Buy > 0):
            raise ValueError(f"{Code}: 买入动作与金额不一致")
        if (Action == "sell") != (Sell > 0):
            raise ValueError(f"{Code}: 卖出动作与份额不一致")
        NavDate = None if Row["nav_date"] is None else date.fromisoformat(Row["nav_date"])
        if NavDate is not None and NavDate > Beijing.date():
            raise ValueError(f"{Code}: 净值日期晚于分析截止日期")
        Nav = None if Row["unit_nav"] is None else ParseDecimal(Row["unit_nav"], f"{Code}.unit_nav")
        Change = None if Row["daily_change_pct"] is None else ParseDecimal(
            Row["daily_change_pct"], f"{Code}.daily_change_pct"
        )
        if Nav is not None and (Nav <= 0 or NavDate is None):
            raise ValueError(f"{Code}: 净值必须为正数并具有实际日期")
        Published = None if Row["data_published_at"] is None else Timestamp(
            Row["data_published_at"], f"{Code}.data_published_at"
        )
        if Published is not None and Published > AsOf:
            raise ValueError(f"{Code}: 数据公开时间晚于分析截止时刻")
        if Published is not None and NavDate is not None and Published.astimezone(Beijing.tzinfo).date() < NavDate:
            raise ValueError(f"{Code}: 数据公开时间早于净值所属日期")
        RulesVerified = CheckBool(Row, "trade_rules_verified")
        if Action in {"buy", "sell"} and (
            Nav is None or NavDate is None or Change is None or Published is None or not RulesVerified
        ):
            raise ValueError(f"{Code}: 买卖建议缺少净值 公开时间或交易规则证据")
        if Buy > 0 and (not CashConfirmed or Cash is None):
            raise ValueError(f"{Code}: 现金尚未确认 不能给出新增买入金额")
        if Buy > 0 and not HoldingsConfirmed:
            raise ValueError(f"{Code}: 持仓尚未同步 不能给出新增买入金额")
        if Sell > 0 and (not HoldingsConfirmed or Sell > Available.get(Code, Decimal("0"))):
            raise ValueError(f"{Code}: 卖出超过已确认可赎回份额")
        TotalBuy += Buy
        DateText = "日期待核验" if NavDate is None else NavDate.isoformat()
        NavText = "待核验" if Nav is None else format(Nav, "f")
        ChangeText = "待核验" if Change is None else f"{Change:+.2f}%"
        ActionText = f"卖出{Sell:f}份" if Action == "sell" else Labels[Action]
        Table.append(f"| [{Name}（{Code}）]({Url}) | {DateText}／{NavText}／{ChangeText} | {ActionText}：{Reason} | {Buy:.2f}元 |")
    if TotalBuy > Budget or (Cash is not None and TotalBuy > Cash):
        raise ValueError(f"建议买入合计{TotalBuy}元 超过预算或已到账现金")
    Notes = Report.get("notes", [])
    if not isinstance(Notes, list) or len(Notes) > 3:
        raise ValueError("notes: 最多允许3条必要补充")
    Lines = [f"{Beijing:%Y-%m-%d %H:%M} 北京时间｜各行显示实际净值日期", "",
             "| 产品 | 净值日期／净值／日涨跌 | 建议 | 买入金额 |",
             "| --- | --- | --- | --- |", *Table, ""]
    CashText = f"{Cash:.2f}元（已知口径）" if CashConfirmed else "待同步"
    HoldingsText = "已同步" if HoldingsConfirmed else "待同步"
    Lines.append(f"建议买入合计：{TotalBuy:.2f}元｜可用现金：{CashText}｜持仓：{HoldingsText}")
    Lines.extend(f"\n{Cell(Note)}" for Note in Notes)
    return "\n".join(Lines) + "\n"


def Main():
    Parser = argparse.ArgumentParser(description="检查并渲染基金研究日报 不联网 不交易")
    Parser.add_argument("--input", required=True, type=Path)
    Parser.add_argument("--output", type=Path)
    Args = Parser.parse_args()
    Report = json.loads(Args.input.read_text(encoding="utf-8-sig"))
    Message = RenderReport(Report)
    if Args.output is None:
        print(Message, end="")
    else:
        Args.output.write_text(Message, encoding="utf-8")


if __name__ == "__main__":
    Main()
