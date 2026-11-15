import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { assertInside } from './core.js';

export function decompositionView(decomposition) {
  if (!decomposition) return undefined;
  const { width, height, sourceSize, layers, model, coordinateOrigin, batches, resourceMap, resourceCatalog, zIndexOrigin } = decomposition.document;
  return { directory: decomposition.directory, overview: decomposition.overview, composite: decomposition.composite, dataChecks: decomposition.dataChecks,
    document: { width, height, sourceSize, ...model ? { model } : {}, ...coordinateOrigin ? { coordinateOrigin } : {},
      ...batches ? { batches, resourceMap, resourceCatalog, zIndexOrigin } : {}, layers: layers.map(({ id, name, role, semanticRole, file, placement, zIndex, visible, opacity, batchId, providerLayerId, providerZIndex }) =>
      ({ id, name, role, ...semanticRole ? { semanticRole } : {}, file, placement, zIndex, visible, opacity,
        ...batchId ? { batchId, providerLayerId, providerZIndex } : {} })) } };
}

export function decompositionBatchProgress(task) {
  if (!task.decompositionAttempt?.directory) return undefined;
  const directory = assertInside(task.directory, task.decompositionAttempt.directory);
  const file = path.join(directory, 'batch-state.json');
  if (!existsSync(file)) return undefined;
  const batch = JSON.parse(readFileSync(file, 'utf8'));
  return { state: batch.state, requestCount: batch.requestCount, completed: batch.completed, pending: batch.pending,
    directory: batch.directory, partialManifest: existsSync(path.join(directory, 'partial-manifest.json')) ? path.join(directory, 'partial-manifest.json') : undefined,
    next: batch.state === 'completed' ? '合并结果已就绪 统一Layout装配' : '保留已完成批次及原请求 失败或未知停止 不重放整批' };
}
