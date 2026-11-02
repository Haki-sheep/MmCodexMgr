import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


ScriptRoot = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(ScriptRoot))
Spec = importlib.util.spec_from_file_location("portfolio_state", ScriptRoot / "portfolio_state.py")
Module = importlib.util.module_from_spec(Spec)
Spec.loader.exec_module(Module)


def Snapshot():
    return {
        "kind": "snapshot", "observed_at": "2025-01-02T14:00:00+08:00",
        "time_basis": "source", "unresolved": [],
        "sources": [{"kind": "user_text", "reference": "合成测试数据 不是真实账户"}],
        "data": {
            "holdings_complete": True, "orders_complete": True,
            "settled_cash_yuan": "500", "investment_total_yuan": "1000",
            "positions": [{"code": "007339", "name": "合成测试基金", "shares": "400",
                           "redeemable_shares": "300", "market_value_yuan": "500", "pnl_yuan": "-20"}],
            "pending_orders": [],
        },
    }


class PortfolioStateTests(unittest.TestCase):
    def setUp(self):
        self.Temporary = tempfile.TemporaryDirectory(prefix="mm-money-feedback-")
        self.Root = Path(self.Temporary.name)

    def tearDown(self):
        self.Temporary.cleanup()

    def test_idempotent_snapshot_preserves_unknown_and_zero(self):
        Event = Snapshot()
        Event["data"]["settled_cash_yuan"] = None
        Event["data"]["positions"][0]["redeemable_shares"] = "0"
        First = Module.AppendRecord(self.Root, Event)
        Second = Module.AppendRecord(self.Root, Event)
        self.assertEqual(First, Second)
        self.assertEqual(len(Module.ReadRecords(self.Root)), 1)
        Data = Module.CurrentContext(self.Root)["basis_snapshot"]["event"]["data"]
        self.assertIsNone(Data["settled_cash_yuan"])
        self.assertEqual(Data["positions"][0]["redeemable_shares"], "0")

    def test_correction_keeps_original_file(self):
        First = Module.AppendRecord(self.Root, Snapshot())
        Original = (self.Root / "records" / f"{First['record_id']}.json").read_bytes()
        Correction = Snapshot()
        Correction["supersedes"] = First["record_id"]
        Correction["data"]["settled_cash_yuan"] = "450"
        Second = Module.AppendRecord(self.Root, Correction)
        self.assertEqual(len(Module.ReadRecords(self.Root)), 2)
        self.assertEqual(Module.CurrentContext(self.Root)["basis_snapshot"]["record_id"], Second["record_id"])
        self.assertEqual((self.Root / "records" / f"{First['record_id']}.json").read_bytes(), Original)
        self.assertEqual(Module.AppendRecord(self.Root, Correction), Second)
        Correction["data"]["settled_cash_yuan"] = "400"
        with self.assertRaisesRegex(ValueError, "已有更正"):
            Module.AppendRecord(self.Root, Correction)

    def test_partial_and_late_old_screenshots_do_not_replace_complete_snapshot(self):
        First = Module.AppendRecord(self.Root, Snapshot())
        Partial = Snapshot()
        Partial["observed_at"] = "2025-01-03T14:00:00+08:00"
        Partial["data"].update(holdings_complete=False, positions=[])
        Update = Module.AppendRecord(self.Root, Partial)
        Old = Snapshot()
        Old["observed_at"] = "2024-12-01T14:00:00+08:00"
        Old["data"]["settled_cash_yuan"] = "999"
        Module.AppendRecord(self.Root, Old)
        Context = Module.CurrentContext(self.Root)
        self.assertEqual(Context["basis_snapshot"]["record_id"], First["record_id"])
        self.assertEqual([Record["record_id"] for Record in Context["updates_to_review"]], [Update["record_id"]])

    def test_undated_screenshot_remains_an_unresolved_update(self):
        Event = Snapshot()
        Event.update(observed_at=None, time_basis="unknown", unresolved=["截图时点未知"])
        Record = Module.AppendRecord(self.Root, Event)
        Context = Module.CurrentContext(self.Root)
        self.assertIsNone(Context["basis_snapshot"])
        self.assertEqual(Context["updates_to_review"][0]["record_id"], Record["record_id"])

    def test_pending_trade_and_cashflow_do_not_synthesize_balances(self):
        First = Module.AppendRecord(self.Root, Snapshot())
        for Kind, Data in [
            ("trade", {"code": "007339", "side": "sell", "status": "pending", "shares": "100"}),
            ("cash_flow", {"flow_type": "deposit", "amount_yuan": "1000"}),
        ]:
            Event = Snapshot()
            Event.update(kind=Kind, observed_at="2025-01-03T14:00:00+08:00", data=Data)
            Module.AppendRecord(self.Root, Event)
        Context = Module.CurrentContext(self.Root)
        self.assertEqual(Context["basis_snapshot"], First)
        self.assertEqual(len(Context["updates_to_review"]), 2)

    def test_advice_never_becomes_a_position_and_feedback_links_it(self):
        from test_render_report import Fixture
        First = Module.AppendRecord(self.Root, Snapshot())
        Event = Snapshot()
        Report = Fixture()
        Report["as_of"] = "2025-01-04T14:00:00+08:00"
        for Row in Report["rows"]:
            Row.update(nav_date="2025-01-03", data_published_at="2025-01-03T20:00:00+08:00")
        Event.update(kind="advice", observed_at=Report["as_of"], data=Report,
                     sources=[{"kind": "model_advice", "reference": "模拟研究建议"}])
        Advice = Module.AppendRecord(self.Root, Event)
        Feedback = Snapshot()
        Feedback.update(kind="feedback", observed_at="2025-01-04T15:00:00+08:00",
                        data={"advice_id": Advice["record_id"], "outcome": "not_executed"})
        Module.AppendRecord(self.Root, Feedback)
        self.assertEqual(Module.CurrentContext(self.Root)["basis_snapshot"], First)

    def test_evidence_is_archived_and_unchanged_on_retry(self):
        Source = self.Root / "source.png"
        Source.write_bytes(b"synthetic screenshot evidence")
        Event = Snapshot()
        Event["sources"] = [{"kind": "screenshot", "reference": "合成证据", "file_path": str(Source)}]
        First = Module.AppendRecord(self.Root, Event)
        SourceEntry = First["event"]["sources"][0]
        self.assertEqual((self.Root / SourceEntry["archived_file"]).read_bytes(), Source.read_bytes())
        self.assertEqual(Module.AppendRecord(self.Root, Event), First)

    def test_invalid_fact_and_model_fact_source_are_rejected(self):
        Event = Snapshot()
        Event["data"]["positions"][0]["redeemable_shares"] = "401"
        with self.assertRaisesRegex(ValueError, "超过总份额"):
            Module.AppendRecord(self.Root, Event)
        Event = Snapshot()
        Event["sources"][0]["kind"] = "model_advice"
        with self.assertRaisesRegex(ValueError, "不能充当账户事实"):
            Module.AppendRecord(self.Root, Event)
        Event = Snapshot()
        Event["data"]["settled_cash_yuan"] = 1.1
        with self.assertRaises(ValueError):
            Module.AppendRecord(self.Root, Event)

    def test_modified_history_fails_visibly(self):
        Record = Module.AppendRecord(self.Root, Snapshot())
        File = self.Root / "records" / f"{Record['record_id']}.json"
        Changed = copy.deepcopy(Record)
        Changed["event"]["data"]["settled_cash_yuan"] = "9000"
        File.write_text(json.dumps(Changed), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "被修改"):
            Module.CurrentContext(self.Root)

    def test_fabricated_archive_metadata_is_rejected(self):
        Event = Snapshot()
        Event["sources"][0]["archived_file"] = "evidence/not-actually-saved.png"
        with self.assertRaisesRegex(ValueError, "由脚本生成"):
            Module.AppendRecord(self.Root, Event)


if __name__ == "__main__":
    unittest.main()
