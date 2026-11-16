import copy
import importlib.util
import unittest
from pathlib import Path


Script = Path(__file__).resolve().parents[1] / "scripts" / "render_report.py"
Spec = importlib.util.spec_from_file_location("render_report", Script)
Module = importlib.util.module_from_spec(Spec)
Spec.loader.exec_module(Module)


def Fixture():
    Rows = [{
        "code": f"{Index:06d}", "name": "测试产品", "url": "https://example.com/fund",
        "nav_date": "2026-10-30", "unit_nav": "1.0000", "daily_change_pct": "0",
        "data_published_at": "2026-10-30T20:00:00+08:00", "action": "watch",
        "reason": "测试数据 不用于投资", "buy_amount_yuan": "0", "sell_shares": "0",
        "trade_rules_verified": False
    } for Index in range(1, 11)]
    return {
        "as_of": "2026-10-31T14:00:00+08:00", "budget_yuan": "1000",
        "settled_cash_yuan": "1000", "cash_confirmed": True,
        "holdings_confirmed": True, "available_shares": {}, "rows": Rows, "notes": []
    }


class ReportTests(unittest.TestCase):
    def test_unknown_is_not_zero(self):
        Report = Fixture()
        Report["rows"][0].update(nav_date=None, unit_nav=None, daily_change_pct=None,
                                 data_published_at=None, action="unverified")
        Message = Module.RenderReport(Report)
        self.assertIn("日期待核验／待核验／待核验", Message)
        self.assertIn("测试产品（000001）", Message)

    def test_over_budget_rejected(self):
        Report = Fixture()
        for Row in Report["rows"]:
            Row.update(action="buy", buy_amount_yuan="101", trade_rules_verified=True)
        with self.assertRaisesRegex(ValueError, "超过预算"):
            Module.RenderReport(Report)

    def test_unsettled_sale_proceeds_not_spendable(self):
        Report = Fixture()
        Report["settled_cash_yuan"] = "10"
        Report["available_shares"] = {"000001": "1000"}
        Report["rows"][0].update(action="sell", sell_shares="1000", trade_rules_verified=True)
        Report["rows"][1].update(action="buy", buy_amount_yuan="100", trade_rules_verified=True)
        with self.assertRaisesRegex(ValueError, "超过预算或已到账现金"):
            Module.RenderReport(Report)

    def test_future_data_rejected(self):
        for Field, Value in [("nav_date", "2026-11-01"),
                             ("data_published_at", "2026-10-31T15:00:00+08:00")]:
            with self.subTest(Field=Field):
                Report = Fixture()
                Report["rows"][0][Field] = Value
                with self.assertRaisesRegex(ValueError, "晚于分析截止"):
                    Module.RenderReport(Report)

    def test_unverified_cash_or_rules_rejected(self):
        Report = Fixture()
        Report["rows"][0].update(action="buy", buy_amount_yuan="100", trade_rules_verified=True)
        Cases = [copy.deepcopy(Report), copy.deepcopy(Report)]
        Cases[0]["cash_confirmed"] = False
        Cases[1]["rows"][0]["trade_rules_verified"] = False
        for Case in Cases:
            with self.subTest(Case=Case["cash_confirmed"]):
                with self.assertRaises(ValueError):
                    Module.RenderReport(Case)

    def test_overselling_rejected(self):
        Report = Fixture()
        Report["available_shares"] = {"000001": "20"}
        Report["rows"][0].update(action="sell", sell_shares="21", trade_rules_verified=True)
        with self.assertRaisesRegex(ValueError, "超过已确认可赎回份额"):
            Module.RenderReport(Report)

    def test_unsynced_holdings_block_new_buy(self):
        Report = Fixture()
        Report["holdings_confirmed"] = False
        Report["rows"][0].update(action="buy", buy_amount_yuan="100", trade_rules_verified=True)
        with self.assertRaisesRegex(ValueError, "持仓尚未同步"):
            Module.RenderReport(Report)

    def test_publication_cannot_precede_nav_date(self):
        Report = Fixture()
        Report["rows"][0]["data_published_at"] = "2026-10-29T20:00:00+08:00"
        with self.assertRaisesRegex(ValueError, "早于净值所属日期"):
            Module.RenderReport(Report)

    def test_valid_sell_keeps_four_columns(self):
        Report = Fixture()
        Report["available_shares"] = {"000001": "20"}
        Report["rows"][0].update(action="sell", sell_shares="10.25", trade_rules_verified=True)
        Message = Module.RenderReport(Report)
        self.assertIn("卖出10.25份", Message)
        for Line in Message.splitlines():
            if Line.startswith("|"):
                self.assertEqual(Line.count("|"), 5)

    def test_invalid_numbers_and_duplicate_code_rejected(self):
        for Value in ["NaN", "Infinity", "-1", 1.1]:
            with self.subTest(Value=Value):
                Report = Fixture()
                Report["rows"][0]["buy_amount_yuan"] = Value
                with self.assertRaises(ValueError):
                    Module.RenderReport(Report)
        Report = Fixture()
        Report["rows"][1]["code"] = "000001"
        with self.assertRaisesRegex(ValueError, "重复基金代码"):
            Module.RenderReport(Report)


if __name__ == "__main__":
    unittest.main()
