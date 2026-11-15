"""Analyze complete MmPerformance observations without mistaking missing counters for zero."""
import json
import math
from pathlib import Path

COUNTERS = {
    "gc_alloc_bytes": ("gc_alloc_valid", "Bytes"),
    "main_thread_ns": ("main_thread_valid", "TimeNanoseconds"),
    "draw_calls": ("draw_calls_valid", "Count"),
    "total_used_memory_bytes": ("memory_valid", "Bytes"),
    "gpu_frame_ns": ("gpu_frame_valid", "TimeNanoseconds"),
}
ENVIRONMENT_KEYS = (
    "unityVersion", "platform", "scenePath", "buildTarget", "deviceModel", "graphicsDevice",
    "processor", "screenWidth", "screenHeight", "targetFrameRate", "vSyncCount", "qualityLevel",
    "qualityName", "renderPipeline", "colorSpace", "fixedDeltaTime",
)


def load(path):
    with Path(path).open(encoding="utf-8-sig") as stream:
        report = json.load(stream)
    if report.get("schema_version") != 1:
        raise ValueError("不支持的报告 schema_version")
    return report


def finite(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"指标不是有限数字 {value!r}")
    return value


def metadata(value, path, unavailable):
    """Only normalize upstream metadata sentinels; observed samples remain fail-fast."""
    if isinstance(value, float) and not math.isfinite(value):
        unavailable.append(path)
        return None
    if isinstance(value, dict):
        return {key: metadata(item, f"{path}.{key}", unavailable) for key, item in value.items()}
    if isinstance(value, list):
        return [metadata(item, f"{path}[{index}]", unavailable) for index, item in enumerate(value)]
    return value


def percentile(sorted_values, percent):
    return sorted_values[max(0, math.ceil(len(sorted_values) * percent / 100) - 1)]


def stats(values):
    if not values:
        return {"available": False, "samples": 0}
    ordered = sorted(finite(value) for value in values)
    return {
        "available": True, "samples": len(values), "mean": math.fsum(values) / len(values),
        "min": ordered[0], "max": ordered[-1],
        "p50": percentile(ordered, 50), "p95": percentile(ordered, 95), "p99": percentile(ordered, 99),
    }


def capture_samples(report):
    if "samplesList" not in report:
        raise ValueError("此命令需要本包完整帧采样报告")
    samples = report["samplesList"]
    previous_time = -1
    previous_frame = -1
    for sample in samples:
        now = finite(sample["elapsed_seconds"])
        frame = sample["frame"]
        if now <= previous_time or frame <= previous_frame or finite(sample["interval_ms"]) < 0:
            raise ValueError("样本时间或帧序号不递增 或间隔为负")
        previous_time, previous_frame = now, frame
    return samples


def metric_values(report, samples, key):
    descriptor = next((item for item in report.get("countersList", []) if item["key"] == key), None)
    valid_key, expected_unit = COUNTERS[key]
    if not descriptor or not descriptor.get("available"):
        return [], "counter_unavailable"
    if descriptor.get("unit") != expected_unit:
        return [], f"unsupported_unit:{descriptor.get('unit')}"
    return [finite(sample[key]) for sample in samples if sample.get(valid_key) is True], "observed"


def slow_windows(samples, budget_ms):
    windows = []
    current = None
    for index, sample in enumerate(samples):
        slow = sample["interval_ms"] > budget_ms
        contiguous = index > 0 and sample["frame"] == samples[index - 1]["frame"] + 1
        if not slow or not contiguous:
            if current:
                windows.append(current)
                current = None
        if not slow:
            continue
        if current is None:
            current = {"start_index": index, "end_index": index, "start_seconds": sample["elapsed_seconds"],
                       "end_seconds": sample["elapsed_seconds"], "samples": 0, "excess_ms": 0, "peak_ms": 0}
        current["end_index"] = index
        current["end_seconds"] = sample["elapsed_seconds"]
        current["samples"] += 1
        current["excess_ms"] += sample["interval_ms"] - budget_ms
        current["peak_ms"] = max(current["peak_ms"], sample["interval_ms"])
    if current:
        windows.append(current)
    return sorted(windows, key=lambda window: window["excess_ms"], reverse=True)


def analyze(report, limit=5):
    unavailable = []
    if "snapshot" in report:
        snapshot = report["snapshot"]
        findings = sorted(snapshot.get("findings", []), key=lambda item: {"error": 0, "warn": 1, "info": 2}.get(item["severity"], 3))
        return {"kind": "static_risk_audit", "job": report["job"], "budget": metadata(report["budget"], "budget", unavailable),
                "notes": snapshot.get("notes", []), "finding_count": len(findings),
                "findings": metadata(findings[:limit], "findings", unavailable), "metadata_unavailable_fields": unavailable,
                "issue_counts": {key: len(snapshot.get(key, [])) for key in ("assetIssues", "sceneIssues", "codeIssues")},
                "interpretation": "静态风险筛查 不代表已测得的运行瓶颈 请保留 notes 中的缺失和截断"}
    samples = capture_samples(report)
    fps = finite(report["options"]["fps"])
    if fps <= 0:
        raise ValueError("fps 必须大于零")
    budget_ms = 1000 / fps
    intervals = [sample["interval_ms"] for sample in samples]
    windows = slow_windows(samples, budget_ms)
    metrics = {}
    for key in COUNTERS:
        values, source_state = metric_values(report, samples, key)
        metrics[key] = {**stats(values), "source_state": source_state}
    missed_frames = sum(max(0, samples[i]["frame"] - samples[i - 1]["frame"] - 1) for i in range(1, len(samples)))
    memory_samples = [sample for sample in samples if sample.get("memory_valid") is True]
    memory_values, _ = metric_values(report, samples, "total_used_memory_bytes")
    trend = {"available": False}
    if len(memory_values) >= 2:
        seconds = memory_samples[-1]["elapsed_seconds"] - memory_samples[0]["elapsed_seconds"]
        growth = memory_values[-1] - memory_values[0]
        trend = {"available": True, "delta_bytes": growth, "bytes_per_second": growth / seconds,
                 "interpretation": "首尾增长 不是泄漏证据"}
    gc_values, _ = metric_values(report, samples, "gc_alloc_bytes")
    gc_spikes = []
    if gc_values:
        gc_spikes = sorted(({"index": i, "seconds": sample["elapsed_seconds"], "bytes": sample["gc_alloc_bytes"],
                             "interval_ms": sample["interval_ms"]} for i, sample in enumerate(samples)
                            if sample.get("gc_alloc_valid") is True and sample["gc_alloc_bytes"] > 0),
                           key=lambda item: item["bytes"], reverse=True)[:limit]
    return {
        "kind": report.get("observation_source", "editor_play_observations"), "job": report["job"], "options": report["options"],
        "environment": metadata(report["environment"], "environment", unavailable), "metadata_unavailable_fields": unavailable,
        "samples": len(samples), "unobserved_frame_count": missed_frames,
        "interval_ms": stats(intervals), "budget_ms": budget_ms,
        "over_budget_ratio": sum(value > budget_ms for value in intervals) / len(intervals) if intervals else None,
        "metrics": metrics, "memory_trend": trend, "slow_window_count": len(windows),
        "slow_windows": windows[:limit], "gc_spikes": gc_spikes, "events": report.get("eventsList", [])[:100],
        "event_count": len(report.get("eventsList", [])),
        "scene_validity": scene_validity(report),
        "overhead": report.get("overhead", {"available": False}),
        "callback_us": stats([finite(item["capture_callback_us"]) for item in samples if "capture_callback_us" in item]),
        "unity_delta_ms": stats([finite(item["unity_delta_ms"]) for item in samples if "unity_delta_ms" in item]),
        "profiler_path": report.get("profiler_path", ""),
        "limitations": ["Editor 更新间隔包含编辑器和采集开销 不等同 CPU 执行耗时",
                        "Recorder 为最近可用样本 不保证与观察帧严格对齐 GC 可能包含 Editor 分配",
                        "缺口之外的未观察帧不纳入统计 域重载或暂停中断的报告不是完整采样"],
    }


def detail(report, index, radius):
    samples = capture_samples(report)
    if not 0 <= index < len(samples) or not 0 <= radius <= 100:
        raise ValueError("索引越界或 radius 不在 0 至 100")
    first, last = max(0, index - radius), min(len(samples), index + radius + 1)
    begin, end = samples[first]["elapsed_seconds"], samples[last - 1]["elapsed_seconds"]
    return {"job_id": report["job"]["job_id"], "counters": report["countersList"], "start_index": first,
            "samples": samples[first:last],
            "events": [event for event in report.get("eventsList", []) if begin <= event["elapsed_seconds"] <= end]}


def compare(baseline, current, *, counter_overhead=False):
    differences = []
    for report in (baseline, current):
        capture_samples(report)
        for key in ENVIRONMENT_KEYS:
            if key not in report.get("environment", {}):
                differences.append(f"缺少 environment.{key}")
        differences.extend(scene_validity(report)["reasons"])
        conditions = parse_conditions(report)
        if not conditions.get("protocol_id") or not conditions.get("workload_id"):
            differences.append("需要 conditions_json 中的 protocol_id 与 workload_id")
        if not report["options"].get("code_revision"):
            differences.append("需要记录 code_revision")
        if report["job"]["state"] != "completed" or report["job"]["reason"] != "duration_reached":
            differences.append("需要两份按时长完整结束的采样")
        if report["options"].get("phase") in (None, "", "unspecified"):
            differences.append("需要明确且相同的 phase 场景阶段")
    if baseline["job"]["job_id"] == current["job"]["job_id"]:
        differences.append("不能对比同一任务")
    for group, keys in (("environment", ENVIRONMENT_KEYS), ("options", ("seconds", "warmup", "fps", "max_frames", "stall_seconds", "phase"))):
        for key in keys:
            if baseline[group].get(key) != current[group].get(key):
                differences.append(f"{group}.{key} 不同")
    for key in ("adapter_version", "schema_version", "countersList"):
        if key == "countersList" and counter_overhead:
            continue
        if baseline.get(key) != current.get(key):
            differences.append(f"{key} 不同")
    if baseline.get("observation_source") != current.get("observation_source"):
        differences.append("observation_source 不同 不混比 Editor 与 Player")
    if parse_conditions(baseline) != parse_conditions(current):
        differences.append("场景协议或工作负载条件不同")
    if context_signature(baseline) != context_signature(current):
        differences.append("现场快照不同 镜头 渲染设置或项目扩展状态不一致")
    for key in ("context_type", "receipt_seconds", "profile_frames", "allocation_stacks", "counters_enabled"):
        if key == "counters_enabled" and counter_overhead:
            continue
        if baseline["options"].get(key) != current["options"].get(key):
            differences.append(f"options.{key} 不同")
    if differences:
        return {"comparable": False, "reasons": sorted(set(differences))}
    first, second = analyze(baseline), analyze(current)
    deltas = {}
    for key in ("mean", "p50", "p95", "p99", "max"):
        if not first["interval_ms"]["available"] or not second["interval_ms"]["available"]:
            return {"comparable": False, "reasons": ["采样没有观察帧"]}
        before, after = first["interval_ms"][key], second["interval_ms"][key]
        deltas[key] = {"baseline_ms": before, "current_ms": after, "delta_ms": after - before,
                       "delta_percent": (after - before) / before * 100 if before else None}
    return {"comparable": True, "interval_deltas": deltas,
            "revision_baseline": baseline["options"].get("code_revision"), "revision_current": current["options"].get("code_revision"),
            "gc_baseline": first["metrics"]["gc_alloc_bytes"], "gc_current": second["metrics"]["gc_alloc_bytes"],
            "over_budget_baseline": first["over_budget_ratio"], "over_budget_current": second["over_budget_ratio"],
            "interpretation": "描述性对比 不代表统计显著收益 操作流程一致性仍需人工或场景脚本证明"}


def parse_conditions(report):
    value = json.loads(report["options"].get("conditions_json") or "{}")
    if not isinstance(value, dict):
        raise ValueError("conditions_json 必须为 JSON 对象")
    # Reject NaN and Infinity even when nested in project-supplied conditions
    json.dumps(value, allow_nan=False)
    return value


def scene_validity(report):
    reasons = []
    contexts = report.get("contextList", [])
    if len(contexts) != 2 or [item.get("stage") for item in contexts] != ["start", "end"]:
        reasons.append("缺少启动与结束现场快照")
    for context in contexts:
        if context.get("health_verified") is not True or context.get("healthy") is not True:
            reasons.append("项目现场健康状态未通过验证")
        if context.get("visual_status") != "valid" or not context.get("evidence"):
            reasons.append("画面有效性没有明确证据 或画面已无效")
    if report.get("error_count", 0) > 0:
        reasons.append("采样期间有 Error Exception 或 Assert")
    return {"eligible_for_comparison": not reasons, "reasons": sorted(set(reasons)),
            "error_count": report.get("error_count"), "errors": report.get("errorList", [])[:20],
            "interpretation": "健康与画面由项目钩子或现场证据证明 计数器本身不能检测黑屏"}


def context_signature(report):
    result = []
    for item in report.get("contextList", []):
        project = json.loads(item.get("project_json") or "{}")
        pipeline = json.loads(item.get("pipeline_json") or "{}")
        result.append({"stage": item.get("stage"), "project": project, "pipeline": pipeline,
                       "cameras": item.get("camerasList", [])})
    return result


def compare_series(manifest_path):
    manifest_path = Path(manifest_path).resolve(strict=True)
    runs = json.loads(manifest_path.read_text(encoding="utf-8-sig"))["runs"]
    if len(runs) < 4 or len(runs) % 2:
        raise ValueError("至少提供两组相邻 A/B 或 B/A 配对 每次运行必须独立")
    reports = [load((manifest_path.parent / item["report"]).resolve(strict=True)) for item in runs]
    identities = [item["job"]["job_id"] for item in reports]
    if len(set(identities)) != len(identities):
        raise ValueError("多轮复测不得重复使用同一任务")
    pairs = []
    reasons = []
    revisions = {}
    for index in range(0, len(runs), 2):
        labels = [runs[index]["group"], runs[index + 1]["group"]]
        if set(labels) != {"A", "B"}:
            raise ValueError("每个相邻配对必须各有一次 A 和 B")
        for label, report in zip(labels, reports[index:index + 2]):
            revision = report["options"].get("code_revision")
            if label in revisions and revisions[label] != revision:
                reasons.append(f"{label}组 code_revision 在多轮复测中变化")
            revisions.setdefault(label, revision)
        first, second = reports[index:index + 2]
        before, after = (first, second) if labels == ["A", "B"] else (second, first)
        result = compare(before, after)
        pairs.append({"order": "".join(labels), "result": result})
        if not result["comparable"]:
            reasons.extend(result["reasons"])
    for item in reports[1:]:
        check = compare(reports[0], item)
        if not check["comparable"]:
            reasons.extend(check["reasons"])
    if reasons:
        return {"comparable": False, "reasons": sorted(set(reasons)), "pairs": pairs}
    return {"comparable": True, "runs": len(runs), "pairs": pairs,
            "delta_ms": {key: stats([item["result"]["interval_deltas"][key]["delta_ms"] for item in pairs])
                         for key in ("mean", "p50", "p95", "p99", "max")},
            "interpretation": "保留每轮和全部异常帧的配对分布 未自动判定统计显著性 未自动重放业务操作"}


def overhead_comparison(disabled, enabled):
    if disabled["options"].get("counters_enabled") is not False or enabled["options"].get("counters_enabled") is not True:
        raise ValueError("开销对照要求依次为 counters_enabled=false 与 true")
    result = compare(disabled, enabled, counter_overhead=True)
    result["scope"] = "相同观察器开启与关闭原生计数器的增量 不是整个采集器零开销基线"
    result["disabled_overhead"] = disabled.get("overhead")
    result["enabled_overhead"] = enabled.get("overhead")
    return result


def hotspots(report, limit=10):
    if report.get("kind") != "unity_raw_profiler_frames":
        raise ValueError("hotspots 需要原始 Profiler 帧证据文件")
    groups = {}
    stacks = []
    for thread in report["threadsList"]:
        for item in thread["samplesList"]:
            key = (thread["thread_name"], item["name"])
            group = groups.setdefault(key, {"thread": key[0], "marker": key[1], "calls": 0, "inclusive_ms": 0, "max_ms": 0})
            duration = finite(item["duration_ms"])
            group["calls"] += 1
            group["inclusive_ms"] += duration
            group["max_ms"] = max(group["max_ms"], duration)
            if item.get("callstackList"):
                stacks.append({"frame": thread["frame"], "thread": key[0], "sample_index": item["index"],
                               "allocation_bytes": item.get("allocation_bytes"), "callstack": item["callstackList"],
                               "resolved_stack": item.get("resolvedStackList", []),
                               "stack_truncated": item.get("stack_truncated", False)})
    return {"kind": report["kind"], "availability": report["availability"], "truncated": report["truncated"],
            "first_frame": report["first_frame"], "last_frame": report["last_frame"],
            "sample_count": report["sample_count"], "markers": sorted(groups.values(), key=lambda item: item["inclusive_ms"], reverse=True)[:limit],
            "allocation_stack_count": len(stacks), "allocation_stacks": sorted(stacks, key=lambda item: item["allocation_bytes"] or 0, reverse=True)[:limit],
            "interpretation": "原始 Marker 为包含子节点的耗时 不可相加当总 CPU 时间 栈地址仍需匹配构建符号解析 GPU 仅提供可用计数器 不提供绘制调用归因"}
