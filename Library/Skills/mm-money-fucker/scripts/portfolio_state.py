import argparse
import copy
import hashlib
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from render_report import CheckBool, Nonnegative, ParseDecimal, RenderReport, Timestamp


# region 输入校验

def JsonBytes(Value):
    return json.dumps(Value, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8")


def CheckCode(Value):
    if not isinstance(Value, str) or not re.fullmatch(r"[0-9]{6}", Value):
        raise ValueError(f"基金代码必须为六位字符串 {Value!r}")


def CheckNumbers(Data, FieldList, SignedFieldList=()):
    for Field in FieldList:
        Value = Data.get(Field)
        if Value is not None:
            (ParseDecimal if Field in SignedFieldList else Nonnegative)(Value, Field)


def CheckTrade(Data):
    CheckCode(Data["code"])
    if Data["side"] not in {"buy", "sell"} or Data["status"] not in {"pending", "confirmed", "cancelled"}:
        raise ValueError("订单 side 或 status 非法")
    CheckNumbers(Data, ("amount_yuan", "shares", "fee_yuan"))
    if Data["status"] == "confirmed" and Data.get("amount_yuan") is None and Data.get("shares") is None:
        raise ValueError("已确认成交至少提供金额或份额")


def CheckSnapshot(Data):
    CheckBool(Data, "holdings_complete")
    CheckBool(Data, "orders_complete")
    CheckNumbers(Data, ("settled_cash_yuan", "investment_total_yuan"))
    if not isinstance(Data["positions"], list) or not isinstance(Data["pending_orders"], list):
        raise ValueError("positions 与 pending_orders 必须为数组")
    CodeHashList = set()
    for Position in Data["positions"]:
        Code = Position["code"]
        CheckCode(Code)
        if Code in CodeHashList:
            raise ValueError(f"快照重复基金代码 {Code}")
        CodeHashList.add(Code)
        CheckNumbers(Position, ("shares", "redeemable_shares", "market_value_yuan", "cost_yuan", "pnl_yuan"), ("pnl_yuan",))
        if Position.get("shares") is not None and Position.get("redeemable_shares") is not None:
            if ParseDecimal(Position["redeemable_shares"], "redeemable_shares") > ParseDecimal(Position["shares"], "shares"):
                raise ValueError(f"{Code}: 可卖份额超过总份额")
    for Order in Data["pending_orders"]:
        CheckTrade(Order)
        if Order["status"] != "pending":
            raise ValueError("pending_orders 只能包含待确认订单")


def ValidateEvent(Event):
    Kind = Event["kind"]
    if Kind not in {"snapshot", "trade", "cash_flow", "advice", "feedback"}:
        raise ValueError(f"未知记录类型 {Kind!r}")
    if Event["observed_at"] is not None:
        if Timestamp(Event["observed_at"], "observed_at") > datetime.now(timezone.utc):
            raise ValueError("事实发生或观察时间不能在未来")
    if Event["time_basis"] not in {"source", "user_reported_current", "unknown"}:
        raise ValueError("time_basis 非法")
    if (Event["time_basis"] == "unknown") != (Event["observed_at"] is None):
        raise ValueError("未知观察时间必须同时使用 null 与 unknown")
    if not isinstance(Event["unresolved"], list) or any(not isinstance(Item, str) or not Item.strip() for Item in Event["unresolved"]):
        raise ValueError("unresolved 必须为非空问题字符串的数组")
    if not isinstance(Event["sources"], list) or not Event["sources"]:
        raise ValueError("每条记录必须保留来源")
    for Source in Event["sources"]:
        if Source["kind"] not in {"screenshot", "user_text", "model_advice"} or not isinstance(Source["reference"], str) or not Source["reference"].strip():
            raise ValueError("来源类型或引用非法")
        if (Kind == "advice") != (Source["kind"] == "model_advice"):
            raise ValueError("模型建议不能充当账户事实来源")
        if Source.get("file_path") and Source["kind"] != "screenshot":
            raise ValueError("只有截图来源可以归档原图或PDF")
    Data = Event["data"]
    if Kind == "snapshot":
        CheckSnapshot(Data)
    elif Kind == "trade":
        CheckTrade(Data)
    elif Kind == "cash_flow":
        if Data["flow_type"] not in {"deposit", "withdrawal", "cash_dividend", "fee"} or Nonnegative(Data["amount_yuan"], "amount_yuan") <= 0:
            raise ValueError("资金流水类型非法或金额非正")
    elif Kind == "advice":
        RenderReport(Data)
        if Event["observed_at"] is None or Timestamp(Event["observed_at"], "observed_at") != Timestamp(Data["as_of"], "as_of"):
            raise ValueError("建议记录时间必须等于报告截止时间")
    elif Data["outcome"] not in {"not_executed", "executed", "partial", "unknown"}:
        raise ValueError("反馈 outcome 非法")

# endregion


# region 持久记录

def WriteOnce(Target, Content):
    Target.parent.mkdir(parents=True, exist_ok=True)
    if Target.exists():
        if Target.read_bytes() != Content:
            raise ValueError(f"拒绝覆盖已有记录 {Target}")
        return
    Temporary = Target.with_name(f".{Target.name}.{uuid.uuid4().hex}.tmp")
    try:
        with Temporary.open("xb") as Stream:
            Stream.write(Content)
            Stream.flush()
            os.fsync(Stream.fileno())
        try:
            os.link(Temporary, Target)
        except FileExistsError:
            if Target.read_bytes() != Content:
                raise ValueError(f"并发写入冲突 {Target}")
    finally:
        Temporary.unlink(missing_ok=True)


def ReadRecords(Root):
    RecordList = []
    for File in sorted((Root / "records").glob("*.json")):
        try:
            Record = json.loads(File.read_text(encoding="utf-8"))
        except (ValueError, OSError) as Error:
            raise ValueError(f"无法读取持久记录 {File}") from Error
        Digest = hashlib.sha256(JsonBytes(Record["event"])).hexdigest()
        if Record["record_id"] != Digest or File.stem != Digest:
            raise ValueError(f"记录内容或文件名被修改 {File}")
        RecordList.append(Record)
    return sorted(RecordList, key=lambda Record: Record["recorded_at"])


def ActiveRecords(RecordList):
    SupersededHashList = {Record["event"].get("supersedes") for Record in RecordList}
    return [Record for Record in RecordList if Record["record_id"] not in SupersededHashList]


def AppendRecord(Root, Input):
    Event = copy.deepcopy(Input)
    ValidateEvent(Event)
    for Source in Event["sources"]:
        if "archived_file" in Source or "sha256" in Source or "archive_status" in Source:
            raise ValueError("证据归档字段由脚本生成 请提供file_path或来源引用")
    RecordList = ReadRecords(Root)
    RecordDict = {Record["record_id"]: Record for Record in RecordList}
    if Event.get("supersedes"):
        Previous = RecordDict[Event["supersedes"]]
        if Previous["event"]["kind"] != Event["kind"]:
            raise ValueError("更正记录类型必须一致")
    AdviceId = Event["data"].get("advice_id")
    if Event["kind"] == "feedback" and not AdviceId:
        raise ValueError("执行反馈必须关联已保存的 advice_id")
    if AdviceId and RecordDict[AdviceId]["event"]["kind"] != "advice":
        raise ValueError("advice_id 必须指向建议记录")
    for Source in Event["sources"]:
        SourceFile = Source.pop("file_path", None)
        if SourceFile:
            File = Path(SourceFile)
            if not File.is_absolute() or File.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".pdf"}:
                raise ValueError("截图证据必须是图片或PDF的绝对路径")
            Content = File.read_bytes()
            Digest = hashlib.sha256(Content).hexdigest()
            Relative = f"evidence/{Digest}{File.suffix.lower()}"
            WriteOnce(Root / Relative, Content)
            Source.update(sha256=Digest, archived_file=Relative)
        elif "archived_file" not in Source:
            Source["archive_status"] = "reference_only"
    RecordId = hashlib.sha256(JsonBytes(Event)).hexdigest()
    if RecordId in RecordDict:
        return RecordDict[RecordId]
    if Event.get("supersedes") and Event["supersedes"] not in {Record["record_id"] for Record in ActiveRecords(RecordList)}:
        raise ValueError("原记录已有更正 请更正当前有效版本")
    Record = {"record_id": RecordId, "recorded_at": datetime.now(timezone.utc).isoformat(), "event": Event}
    WriteOnce(Root / "records" / f"{RecordId}.json", JsonBytes(Record))
    return Record


def CurrentContext(Root):
    RecordList = ActiveRecords(ReadRecords(Root))
    SnapshotList = [Record for Record in RecordList if Record["event"]["kind"] == "snapshot" and Record["event"]["observed_at"] is not None and Record["event"]["data"]["holdings_complete"]]
    OrderKey = lambda Record: (Timestamp(Record["event"]["observed_at"], "observed_at"), Record["recorded_at"])
    Basis = max(SnapshotList, key=OrderKey) if SnapshotList else None
    UpdateList = [Record for Record in RecordList if Record != Basis and (Basis is None or Record["event"]["observed_at"] is None or OrderKey(Record)[0] >= OrderKey(Basis)[0])]
    return {
        "basis_snapshot": Basis,
        "updates_to_review": UpdateList,
        "active_record_count": len(RecordList),
        "policy": "按来源时点核对更新 部分快照不清空未展示持仓 建议不更新余额 未知与未解决冲突不能视为当前已同步",
    }

# endregion


# region 命令入口

def Main():
    Parser = argparse.ArgumentParser(description="保存截图提取事实与反馈 追加记录 不识图 不交易")
    Parser.add_argument("command", choices=("init", "append", "current", "history"))
    Parser.add_argument("--profile", type=Path, default=Path(__file__).resolve().parents[1] / "config" / "profile.json")
    Parser.add_argument("--state-dir", type=Path)
    Parser.add_argument("--input", type=Path)
    Args = Parser.parse_args()
    if Args.state_dir is not None:
        Root = Args.state_dir
    else:
        Profile = json.loads(Args.profile.read_text(encoding="utf-8-sig"))
        if not Profile.get("state_directory"):
            Parser.error("profile.state_directory 尚未配置")
        Root = Path(Profile["state_directory"])
    if not Root.is_absolute():
        Parser.error("状态目录必须为绝对路径")
    if Args.command == "init":
        for Name in ("records", "evidence"):
            (Root / Name).mkdir(parents=True, exist_ok=True)
        Result = {"state_directory": str(Root), "record_count": len(ReadRecords(Root))}
    elif Args.command == "append":
        if Args.input is None:
            Parser.error("append 必须提供 --input")
        Result = AppendRecord(Root, json.loads(Args.input.read_text(encoding="utf-8-sig")))
    elif Args.command == "history":
        if not (Root / "records").is_dir():
            Parser.error("状态目录未初始化 不能将不可用目录当成空账户")
        Result = ReadRecords(Root)
    else:
        if not (Root / "records").is_dir():
            Parser.error("状态目录未初始化 不能将不可用目录当成空账户")
        Result = CurrentContext(Root)
    print(json.dumps(Result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    Main()

# endregion
