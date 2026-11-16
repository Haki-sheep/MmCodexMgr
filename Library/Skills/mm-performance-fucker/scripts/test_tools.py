"""Behavior checks for statistics, evidence slicing, comparison, and deployment conflicts."""
import copy
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import install
import perf
from install import deployment_plan
from report_analysis import analyze, compare, detail, compare_series, overhead_comparison, hotspots, ENVIRONMENT_KEYS


def report():
    values = [10, 30, 40, 10]
    return {
        "schema_version": 1, "adapter_version": "0.2.0", "observation_source": "editor_update",
        "contextList": [{"stage": stage, "health_verified": True, "healthy": True, "visual_status": "valid", "evidence": "synthetic fixture"} for stage in ("start", "end")],
        "job": {"job_id": "a", "state": "completed", "reason": "duration_reached"},
        "options": {"fps": 60, "seconds": 30, "warmup": 2, "max_frames": 300000, "stall_seconds": 10, "phase": "combat", "conditions_json": '{"protocol_id":"fixture","workload_id":"stationary"}', "code_revision":"test-v1", "counters_enabled":True},
        "environment": {**{key: "fixture" for key in ENVIRONMENT_KEYS}, "scenePath": "Assets/Combat.unity", "screenWidth": 1920},
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


class EvidenceTests(unittest.TestCase):
    def test_unverified_and_black_scene_never_comparable(self):
        for field, value in (("visual_status", "invalid"), ("visual_status", "unverified"), ("healthy", False), ("health_verified", False)):
            first, second = report(), report()
            second["job"]["job_id"] = "b"
            second["contextList"][0][field] = value
            self.assertFalse(compare(first, second)["comparable"])
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        del second["contextList"]
        self.assertFalse(compare(first, second)["comparable"])

    def test_error_storm_and_workload_change_rejected(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        second["error_count"] = 1
        self.assertFalse(compare(first, second)["comparable"])
        second.pop("error_count")
        second["options"]["conditions_json"] = '{"protocol_id":"fixture","workload_id":"other"}'
        self.assertFalse(compare(first, second)["comparable"])

    def test_camera_render_scale_and_project_position_change_rejected(self):
        for key, value in (("pipeline_json", '{"renderScale":0.5}'), ("project_json", '{"player":[1,0,0],"Volume":false}'), ("camerasList", [{"fov":45}])):
            first, second = report(), report()
            second["job"]["job_id"] = "b"
            second["contextList"][0][key] = value
            self.assertFalse(compare(first, second)["comparable"])

    def test_revision_is_recorded_treatment_not_workload(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        second["options"]["code_revision"] = "test-v2"
        self.assertTrue(compare(first, second)["comparable"])
        second["observation_source"] = "player_late_update"
        self.assertFalse(compare(first, second)["comparable"])

    def test_counter_overhead_scope_and_units(self):
        first, second = report(), report()
        second["job"]["job_id"] = "b"
        first["options"]["counters_enabled"] = False
        first["countersList"] = []
        self.assertFalse(compare(first, second)["comparable"])
        self.assertTrue(overhead_comparison(first, second)["comparable"])
        with self.assertRaises(ValueError):
            overhead_comparison(second, first)

    def test_series_ab_ba_and_duplicate_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            runs = []
            for index, label in enumerate("ABBA"):
                value = report()
                value["job"]["job_id"] = str(index)
                value["options"]["code_revision"] = "revision-" + label
                (root / f"{index}.json").write_text(json.dumps(value), encoding="utf-8")
                runs.append({"group":label, "report":f"{index}.json"})
            manifest = root / "series.json"
            manifest.write_text(json.dumps({"runs":runs}), encoding="utf-8")
            self.assertTrue(compare_series(manifest)["comparable"])
            value["options"]["code_revision"] = "unrelated-revision"
            (root / "3.json").write_text(json.dumps(value), encoding="utf-8")
            mixed = compare_series(manifest)
            self.assertFalse(mixed["comparable"])
            self.assertNotIn("delta_ms", mixed)
            self.assertTrue(any("A组 code_revision" in reason for reason in mixed["reasons"]))
            runs[3]["report"] = "0.json"
            manifest.write_text(json.dumps({"runs":runs}), encoding="utf-8")
            with self.assertRaises(ValueError):
                compare_series(manifest)

    def test_raw_hotspots_keep_thread_and_inclusive_scope(self):
        value = {"schema_version":1,"kind":"unity_raw_profiler_frames", "availability":"available", "truncated":True,
                 "first_frame":1,"last_frame":1,"sample_count":2,
                 "threadsList":[{"frame":1,"thread_name":"Main Thread","samplesList":[
                     {"index":0,"name":"PlayerLoop","duration_ms":10},
                     {"index":1,"name":"GC.Alloc","duration_ms":1,"allocation_bytes":32,"callstackList":["0x1234"]}]}]}
        result = hotspots(value)
        self.assertEqual(result["markers"][0]["inclusive_ms"], 10)
        self.assertEqual(result["allocation_stacks"][0]["allocation_bytes"], 32)
        self.assertTrue(result["truncated"])


class DeploymentTests(unittest.TestCase):
    def test_full_profile_includes_optional_audit(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "Assets").mkdir()
            (root / "ProjectSettings").mkdir()
            (root / "ProjectSettings/ProjectVersion.txt").write_text("version", encoding="utf-8")
            capture = deployment_plan(root)
            full = deployment_plan(root, "full")
            self.assertEqual(len(capture), 2)
            self.assertEqual(len(full), 4)
            self.assertFalse(any("PerfAgent" in item["destination"] for item in capture))
            self.assertTrue(any("MmPerformanceAudit" in item["destination"] for item in full))

    def test_publish_failure_reports_partial_and_cleans_system_staging(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "Assets").mkdir()
            (root / "ProjectSettings").mkdir()
            (root / "ProjectSettings/ProjectVersion.txt").write_text("version", encoding="utf-8")
            copytree = install.shutil.copytree
            staged = []

            def copy(source, destination, *args, **kwargs):
                source, destination = Path(source), Path(destination)
                if destination.name == "0" and "MmPerformance-install-" in str(destination):
                    staged.append(destination.parent)
                if destination == root / "Tools/FakeUnityCLI/plugins/mm-performance":
                    raise OSError("injected publish failure")
                return copytree(source, destination, *args, **kwargs)

            with patch("sys.argv", ["install.py", "--project", str(root), "--fuc", "fixture.exe", "--apply"]), \
                    patch.object(install, "invoke", return_value={"data":{"allowed":True}}), \
                    patch.object(install.shutil, "copytree", side_effect=copy):
                with self.assertRaisesRegex(RuntimeError, "injected publish failure") as failure:
                    install.main()
            self.assertIn("MmPerformance", str(failure.exception))
            self.assertIn("mm-performance", str(failure.exception))
            self.assertTrue((root / "Assets/MmPerformance").is_dir())
            self.assertFalse((root / "Temp").exists())
            self.assertTrue(staged)
            self.assertTrue(all(not path.exists() for path in staged))

    def test_start_passes_conditions_as_single_argv_and_preserves_request(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            conditions = root / "conditions.json"
            conditions.write_text('{"protocol_id":"中文协议","workload_id":"combat"}', encoding="utf-8")
            request = "a1000000000000000000000000000001"
            with patch("sys.argv", ["perf.py", "start", "--project", str(root), "--fuc", "fixture.exe", "--yes",
                                    "--conditions-file", str(conditions), "--counters-off", "--revision", "v2", "--request-id", request]), \
                    patch.object(perf, "invoke", return_value={"success":True}) as invoke, patch.object(perf, "emit"):
                self.assertEqual(perf.main(), 0)
                tokens = invoke.call_args.args[1]
            self.assertEqual(tokens[tokens.index("--request-id") + 1], request)
            self.assertEqual(json.loads(tokens[tokens.index("--conditions_json") + 1])["protocol_id"], "中文协议")
            self.assertEqual(tokens[tokens.index("--counters_enabled") + 1], "false")

    def test_preview_no_writes_and_collision_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "Assets").mkdir()
            (root / "ProjectSettings").mkdir()
            (root / "ProjectSettings/ProjectVersion.txt").write_text("m_EditorVersion: 2022.3.62f3", encoding="utf-8")
            plan = deployment_plan(root)
            self.assertEqual(len(plan), 2)
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
                deployment_plan(root, "full")


if __name__ == "__main__":
    unittest.main(verbosity=2)
