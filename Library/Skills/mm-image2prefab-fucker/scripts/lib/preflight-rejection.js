import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const guardArguments = JSON.stringify(['editor', 'guard-check']);

function guardDeniedBeforeSubmission(guard) {
  const receipt = guard?.receipt;
  if (JSON.stringify(guard?.arguments) !== guardArguments || guard?.requestId !== null
    || receipt?.command !== 'editor guard-check' || receipt.ok !== false || receipt.dry_run !== false
    || receipt.data !== null || receipt.error?.retryable !== false) return false;
  return receipt.error.code === 'FUC_EDITOR_PROTECTED'
    || receipt.error.code === 'FUC_EDITOR_MODE_REQUIRED' && receipt.error.details?.allowed === false;
}

export function assertRejectedPreflight(op, receipts) {
  if (op.kind !== 'unity' || op.state !== 'unknown') throw new Error('仅核实Unity未知操作');
  if (!Array.isArray(receipts)) throw new Error('原收据不符合仅预检形态');
  if (receipts.length === 1 && guardDeniedBeforeSubmission(receipts[0])) return null;
  if (receipts.length !== 2) throw new Error('原收据不符合仅预检形态');
  const [guard, validation] = receipts;
  const details = validation.receipt?.error?.details;
  const response = details?.data?.response;
  const prefix = op.id + '-';
  const suffix = typeof validation.requestId === 'string' && validation.requestId.startsWith(prefix)
    ? validation.requestId.slice(prefix.length) : '';
  const createStageRejected = (suffix === 'validate' || /^component-[0-9]+-validate$/.test(suffix))
    && response?.error_message === '请先退出当前 Prefab Stage';
  const updateStageRejected = (suffix === 'validate' || suffix === 'folders')
    && response?.error_message === '需要空闲Edit Mode并退出Prefab Stage';
  if (JSON.stringify(guard.arguments) !== guardArguments || guard.receipt?.data?.allowed !== true
    || JSON.stringify(validation.arguments) !== JSON.stringify(['editor', 'exec', '--code-file', '-'])
    || response?.request_id !== validation.requestId
    || details?.terminal_state !== 'runtime_error' || details?.data?.completed !== true
    || response?.state !== 'runtime_error' || response?.success !== false
    || response?.error_type !== 'System.InvalidOperationException'
    || !(createStageRejected || updateStageRejected) || response?.execute_ms !== 0) {
    throw new Error('无法证明原操作在写入前明确拒绝 不允许恢复');
  }
  return response.request_id;
}

export async function resolveRejectedPreflight(task, input) {
  if (typeof input.authorization !== 'string' || !input.authorization.trim()) throw new Error('需要本轮人类明确继续授权');
  const entry = Object.entries(task.operations || {}).find(([, op]) => op.id === input.operationId);
  if (!entry) throw new Error('原操作不存在');
  const [key, op] = entry;
  for (const name of ['applied.json', 'result.json']) if (existsSync(path.join(op.directory, name))) throw new Error('存在执行产物 不允许按预检拒绝恢复');
  const receipts = JSON.parse(await fs.readFile(path.join(op.directory, 'receipts.json'), 'utf8'));
  const requestId = assertRejectedPreflight(op, receipts);
  const archiveKey = key + ':rejected:' + op.id;
  if (Object.hasOwn(task.operations, archiveKey)) throw new Error('原拒绝已经核实 不重复恢复');
  task.operations[archiveKey] = { ...op, state: 'rejected_before_write', resolution: { requestId, authorization: input.authorization, at: new Date().toISOString() } };
  delete task.operations[key];
  return { state: 'rejected_before_write', requestId, charged: false, unityWritten: false, next: 'apply' };
}
