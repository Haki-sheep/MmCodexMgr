"""Behavior checks for statistics, evidence slicing, comparison, and deployment conflicts."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from install import deployment_plan
from report_analysis import analyze, compare, detail


def report():
    values = [10, 30, 40, 10]
    return {
        "schema_version": 1, "adapter_version": "0.1.0",
        "job": {"job_id": "a", "state": "completed", "reason": "duration_reached"},
        "options": {"fps": 60, "seconds": 30, "warmup": 2, "max_frames": 300000, "stall_seconds": 10, "phase": "combat"},
        "environment": {"scenePath": "Assets/Combat.unity", "screenWidth": 1920},
        "countersList": [{"key": "gc_alloc_bytes", "available": True, "unit": "Bytes"},
                         {"key": "total_used_memory_bytes", "available": True, "unit": "Bytes"}],
        "samplesList": [{"frame": i + 1, "elapsed_seconds": 2.1 + i * .1, "interval_ms": value,
                         "gc_alloc_valid": True, "gc_alloc_bytes": 1000 if i == 1 else 0,
                         "memory_valid": True, "total_used_memory_bytes": 100 + i * 10}
                        for i, value in enumerate(values)],
        "eventsList": [{"elapsed_seconds": 2.2, "frame": 2, "text": "打开背包"}],
    }


class AnalysisTests(unittest.TestCase):
    def test_zero_allocations_included(self):
        result = analyze(report())
        self.assertEqual(result["metrics"]["gc_alloc_bytes"]["mean"], 250)
        self.assertEqual(result["metrics"]["gc_alloc_bytes"]["samples"], 4)

    def test_upstream_metadata_missing_value_is_null(self):
        value = report()
        value["environment"]["metrics"] = [{"previous": float("nan"), "description": "NaN is a literal"}]
        result = analyze(value)
        json.dumps(result, allow_nan=False)
        self.assertIsNone(result["environment"]["metrics"][0]["previous"])
        self.assertEqual(result["environment"]["metrics"][0]["description"], "NaN is a literal")
        self.assertIn("environment.metrics[0].previous", result["metadata_unavailable_fields"])

    def test_static_missing_metadata_not_zero(self):
        value = {"snapshot": {"findings": [{"severity": "info", "confidence": float("nan")}]},
                 "job": {"state": "completed"}, "budget": {"maxMainThreadMs": float("inf")}}
        result = analyze(value)
        json.dumps(result, allow_nan=False)
        self.assertIsNone(result["budget"]["maxMainThreadMs"])
        self.assertIsNone(result["findings"][0]["confidence"])

    def test_unavailable_distinct_from_zero(self):
        value = report()
        for sample in value["samplesList"]:
            sample["gc_alloc_valid"] = False
        self.assertFalse(analyze(value)["metrics"]["gc_alloc_bytes"]["available"])
        for sample in value["samplesList"]:
            sample.update(gc_alloc_valid=True, gc_alloc_bytes=0)
        metric = analyze(value)["metrics"]["gc_alloc_bytes"]
        self.assertTrue(metric["available"])
        self.assertEqual(metric["mean"], 0)

    def test_full_sample_average_not_truncated(self):
        value = report()
        value["samplesList"] = [{"frame": i + 1, "elapsed_seconds": i + .1, "interval_ms": 10,
                                 "gc_alloc_valid": True, "gc_alloc_bytes": 4000 if i == 3500 else 0}
                                for i in range(4000)]
        self.assertEqual(analyze(value)["metrics"]["gc_alloc_bytes"]["mean"], 1)

    def test_consecutive_slow_window_and_details(self):
        result = analyze(report())
        self.assertEqual(result["slow_window_count"], 1)
        self.assertEqual(result["slow_windows"][0]["start_index"], 1)
        self.assertEqual(result["slow_windows"][0]["end_index"], 2)
        evidence = detail(report(), 1, 1)
        self.assertEqual(len(evidence["samples"]), 3)
        self.assertEqual(evidence["events"][0]["text"], "打开背包")

    def test_frame_gap_breaks_window(self):
        value = report()
        value["samplesList"][2]["frame"] = 5
        value["samplesList"][3]["frame"] = 6
        result = analyze(value)
        self.assertEqual(result["slow_window_count"], 2)
        self.assertEqual(result["unobserved_frame_count"], 2)

    def test_wrong_unit_is_unavailable(self):
        value = report()
        value["countersList"][0]["unit"] = "Count"
        metric = analyze(value)["metrics"]["gc_alloc_bytes"]
        self.assertFalse(metric["available"])
        self.assertEqual(metric["source_state"], "unsupported_unit:Count")

    def test_bad_order_and_nonfinite_fail(self):
        value = report()
        value["samplesList"][1]["elapsed_seconds"] = 0
        with self.assertRaises(ValueError):
            analyze(value)
        value = report()
        value["samplesList"][0]["interval_ms"] = float("nan")
        with self.assertRaises(ValueError):
            analyze(value)

    def test_comparison_conditions(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        self.assertTrue(compare(first, second)["comparable"])
        second["environment"]["screenWidth"] = 1280
        self.assertFalse(compare(first, second)["comparable"])
        second = report()
        second["job"].update(job_id="b", state="interrupted")
        self.assertFalse(compare(first, second)["comparable"])

    def test_diff_does_not_mutate_history(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        original = copy.deepcopy(first)
        compare(first, second)
        self.assertEqual(first, original)

    def test_unspecified_phase_rejected(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        first["options"]["phase"] = second["options"]["phase"] = "unspecified"
        self.assertFalse(compare(first, second)["comparable"])


class DeploymentTests(unittest.TestCase):
    def test_preview_no_writes_and_collision_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "Assets").mkdir()
            (root / "ProjectSettings").mkdir()
            (root / "ProjectSettings/ProjectVersion.txt").write_text("m_EditorVersion: 2022.3.62f3", encoding="utf-8")
            plan = deployment_plan(root)
            self.assertEqual(len(plan), 3)
            self.assertTrue(all(item["state"] == "missing" for item in plan))
            self.assertFalse((root / "Assets/PerfAgent").exists())
            (root / "Assets/MmPerformance").mkdir()
            (root / "Assets/MmPerformance/user.txt").write_text("keep me", encoding="utf-8")
            with self.assertRaises(ValueError):
                deployment_plan(root)
            self.assertEqual((root / "Assets/MmPerformance/user.txt").read_text(), "keep me")

    def test_existing_upm_not_duplicated(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "Assets").mkdir()
            (root / "ProjectSettings").mkdir()
            (root / "ProjectSettings/ProjectVersion.txt").write_text("version", encoding="utf-8")
            (root / "Packages").mkdir()
            (root / "Packages/manifest.json").write_text(json.dumps({"dependencies": {"com.night.perfagent": "file:../package"}}), encoding="utf-8")
            with self.assertRaises(ValueError):
                deployment_plan(root)


if __name__ == "__main__":
    unittest.main(verbosity=2)
