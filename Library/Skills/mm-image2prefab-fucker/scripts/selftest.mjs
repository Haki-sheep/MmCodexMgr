import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dispatch } from './image2prefab.mjs';
import { runProcess, parseProcess } from './lib/process.js';
import { assemblyDelta, assertUpdateFresh, compileAssembly } from './lib/core.js';
import { editableLayout, validateLayout } from './lib/layout.js';
import { expandLayoutInput } from './lib/layout-input.js';
import { prepareComponentLayout } from './lib/component-layout.js';
import { assertLayoutContract } from './lib/layout-contract.js';
import { assertRejectedPreflight } from './lib/preflight-rejection.js';
import { readJson, writeJson, operation, withTask, AssemblyValidationError, python as runPython } from './store.mjs';
import { qualityReview } from './lib/workflow-policy.js';

const python = process.argv[2];
if (!python) throw new Error('需要Python绝对路径 不静默选运行时');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mm-image2prefab-selftest-'));
let checks = 0;
const check = async (name, run) => { await run(); checks++; console.log('PASS ' + name); };
const call = (command, task, input = {}) => dispatch({ command, task, input });
try {
  await check('运行时doctor不依赖DSH', async () => assert.equal((await call('doctor', undefined, { python })).dshRequired, false));
  const setup = 'import sys,json;from pathlib import Path;from PIL import Image,ImageDraw;p=Path(sys.argv[1]);(p/"ProjectSettings").mkdir();(p/"ProjectSettings/ProjectVersion.txt").write_text("m_EditorVersion: 2022.3.0f1");bg=Image.new("RGBA",(1024,768),(50,30,70,255));bg.save(p/"bg.png");s=bg.copy();ImageDraw.Draw(s).rectangle((100,100,163,163),fill="green");s.save(p/"source.png");im=Image.new("RGBA",(64,64));ImageDraw.Draw(im).ellipse((4,4,59,59),fill="green");im.save(p/"icon.png");a=Image.new("RGBA",(128,64));d=ImageDraw.Draw(a);d.rectangle((4,4,24,24),fill="red");d.rectangle((80,4,100,24),fill="blue");a.save(p/"atlas.png");Image.new("RGB",(64,64)).save(p/"tiny.png");print(json.dumps({"ready":True}))';
  parseProcess(await runProcess(python, ['-B', '-X', 'utf8', '-c', setup, directory]));
  const taskDirectory = path.join(directory, 'task');
  const init = { project: directory, source: path.join(directory, 'source.png'), python, directory: taskDirectory };
  await check('拒绝小图且不创建任务', async () => {
    await assert.rejects(call('init', undefined, { ...init, source: path.join(directory, 'tiny.png') }), /262144/);
    await assert.rejects(fs.stat(taskDirectory), /ENOENT/);
  });
  await check('独立任务创建与严格字段接口', async () => {
    assert.equal((await call('init', undefined, init)).directory, taskDirectory);
    await assert.rejects(call('get', taskDirectory, { action: 'status' }), /不支持字段/);
  });
  await check('未确认语义阻止收费规划', async () => {
    await call('structure', taskDirectory, { description: '背景下为装备行', uncertainties: ['红点属于装备还是按钮'] });
    await assert.rejects(call('plan', taskDirectory, { elements: [] }), /语义疑点/);
    await call('structure', taskDirectory, { description: '背景下为装备行 红点属于装备', uncertainties: [], confirmation: '人类确认红点属于装备' });
  });
  await check('区域网格及放大坐标统一映射', async () => {
    await call('region', taskDirectory, { action: 'register', regions: [{ id: 'equipment', name: '装备', box: [100,100,300,300] }] });
    const view = await call('region', taskDirectory, { action: 'view', region_id: 'equipment', scale: 2, grid: [4,4] });
    await call('region', taskDirectory, { action: 'submit', analysis: { region_id: 'equipment', view_id: view.id, elements: [{ id: 'glove', name: '手套', semanticRole: 'icon', box: [20,40,100,120] }], questions: [] } });
    const merged = await call('region', taskDirectory, { action: 'merge' });
    assert.deepEqual(merged.elements[0].sourceBox, [110,120,50,60]);
  });
  const elements = [ { id: 'bg', name: '干净背景', semanticRole: 'background', box: [0,0,1024,768] },
    { id: 'icon', name: '图标', semanticRole: 'icon', box: [100,100,64,64] } ];
  await check('拆图模型路由及单素材计费计划', async () => {
    const image25 = await call('plan', taskDirectory, { model: 'image2.5', elements });
    assert.equal(image25.model, 'image2.5');
    assert.equal(image25.requestCount, 2);
    const builtin = await call('plan', taskDirectory, { model: 'builtin', elements });
    assert.equal(builtin.model, 'builtin');
    assert.ok(builtin.batches.every(batch => batch.promptCharacters <= 2000));
  });
  const layers = path.join(directory, 'decomposition');
  await fs.mkdir(path.join(layers, 'layers'), { recursive: true });
  await fs.copyFile(path.join(directory, 'bg.png'), path.join(layers, 'layers/bg.png'));
  await fs.copyFile(path.join(directory, 'icon.png'), path.join(layers, 'layers/icon.png'));
  await writeJson(path.join(layers, 'manifest.json'), { documentWidth: 1024, documentHeight: 768, items: [
    { id: 'bg', name: '干净背景', file: 'bg.png', role: 'layer', zIndex: 0, placement: { left: 0, top: 0, width: 1024, height: 768 } },
    { id: 'icon', name: '图标', file: 'icon.png', role: 'layer', zIndex: 1, placement: { left: 100, top: 100, width: 64, height: 64 } }
  ] });
  await check('损坏图层不提交状态 修正后原任务可继续', async () => {
    const icon = path.join(layers, 'layers/icon.png');
    const original = await fs.readFile(icon);
    await fs.writeFile(icon, 'invalid png fixture');
    await assert.rejects(call('layers_import', taskDirectory, { directory: layers }), /cannot identify image file/);
    assert.equal((await call('get', taskDirectory)).decomposition, undefined);
    await fs.writeFile(icon, original);
  });
  await check('复用拆层产物与支撑集总览生成', async () => {
    const result = await call('layers_import', taskDirectory, { directory: layers });
    assert.equal(result.document.layers.length, 2);
    assert.equal(result.dataChecks.passed, true);
    assert.ok(result.document.layers.every(layer => layer.visibleSupport));
  });
  await check('资源逐项绑定及未知检查拦截', async () => {
    const bindings = elements.map(item => ({ resource_id: item.id, reference_region_id: 'root', layer_ids: [item.id], material_ids: [], checks: { noForbiddenContent: 'passed', completeContour: 'passed' }, reason: '离线夹具为独立生成纯素材' }));
    bindings[1].checks.completeContour = 'unknown';
    assert.equal((await call('material_bind', taskDirectory, { bindings })).state, 'incomplete');
    bindings[1].checks.completeContour = 'passed';
    assert.equal((await call('material_bind', taskDirectory, { bindings })).state, 'ready');
  });
  await check('透明素材连通块分割与批量验收', async () => {
    const imported = await call('material_import', taskDirectory, { image_path: path.join(directory, 'atlas.png'), material_kind: 'icon', semantic_role: 'icon' });
    const result = await call('material_inspect', taskDirectory, { items: [{ material_id: imported.id }] });
    const inspection = result.inspections[0];
    assert.equal(inspection.components.length, 2);
    const split = await call('material_split', taskDirectory, { items: [{ inspection_id: inspection.id, groups: inspection.components.map(part => ({ name: '独立图标' + part.id, semantic_role: 'icon', component_ids: [part.id] })) }] });
    const accepted = await call('material_accept', taskDirectory, { items: split.results.map(({ material }) => ({ review_id: material.reviewId, expected_size: material.size, reason: '离线夹具纯色独立轮廓', crop_review: '轮廓完整 无邻近残片' })) });
    assert.ok(accepted.every(item => item.state === 'accepted'));
  });
  const layout = { rootLayout: { type: 'overlay' }, nodes: [
    { id: 'bg', kind: 'image', layerId: 'bg', semanticRole: 'background' },
    { id: 'panel', kind: 'group', semanticRole: 'panel', box: [100,100,300,300], layout: { type: 'overlay' } },
    { id: 'row', parent: 'panel', kind: 'group', semanticRole: 'list', box: [100,100,144,64], layout: { type: 'horizontal', spacing: [16,0] } },
    { id: 'first', parent: 'row', kind: 'image', semanticRole: 'icon', layerId: 'icon', box: [100,100,64,64] },
    { id: 'second', parent: 'row', kind: 'image', semanticRole: 'icon', layerId: 'icon', box: [180,100,64,64] },
    { id: 'label', parent: 'panel', kind: 'text', semanticRole: 'value', text: '12', box: [100,200,80,40], font: 'Assets/Fonts/Test.asset', fontSize: 30, color: [1,1,1,1], textColor: [1,1,1,1] }
  ] };
  await check('不支持字段首错保留草案并差量修复', async () => {
    await assert.rejects(call('layout', taskDirectory, layout), /textColor不支持/);
    assert.equal((await call('get', taskDirectory)).layoutDraft.state, 'invalid');
    await call('layout_patch', taskDirectory, { nodes: [{ id: 'label', textColor: null }] });
  });
  let before;
  await check('真实Layout规则编译与素材覆盖审计', async () => {
    before = await readJson(path.join(taskDirectory, 'task.json'));
    assert.equal(before.assembly.plan.nodes.find(node => node.id === 'row').layout.type, 'horizontal');
    assert.ok(before.assembly.plan.nodes.find(node => node.id === 'first').layoutElement);
    const audit = await runPython(before, 'material_audit_cli.py', { plan: before.assembly.plan, source: approvedSourceFile(before), project: directory, output: path.join(directory, 'audit') });
    assert.equal(audit.backgroundComplete, true);
  });
  await check('仅修改字号不生成位置更新', async () => {
    await call('layout_patch', taskDirectory, { nodes: [{ id: 'label', fontSize: 28 }] });
    const after = await readJson(path.join(taskDirectory, 'task.json'));
    assert.deepEqual(assemblyDelta(before.assembly.plan, after.assembly.plan), [{ id: 'label', fields: ['fontSize'] }]);
    assert.equal(before.prefabPath, after.prefabPath);
    const prefabFile = path.join(directory, before.prefabPath);
    await fs.mkdir(path.dirname(prefabFile), { recursive: true });
    await fs.writeFile(prefabFile, 'offline fixture user moved saved undo');
    after.appliedAssembly = { plan: before.assembly.plan, assetState: { sha256: 'old-fixture-hash', nodeBindings: [{ id: 'label' }] } };
    assert.deepEqual(assertUpdateFresh(after, after.assembly.plan, directory), [{ id: 'label', fields: ['fontSize'] }]);
    await fs.unlink(prefabFile);
  });
  await check('批次图层ID导入路径合法且不同ID不碰撞', async () => {
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    const input = structuredClone(task.layoutDraft.input);
    const layer = task.decomposition.document.layers.find(item => item.id === 'icon');
    layer.id = 'batch-1:layer-1';
    task.decomposition.document.layers.push({ ...layer, id: 'batch-1?layer-1' });
    input.nodes.find(item => item.id === 'first').layerId = layer.id;
    input.nodes.find(item => item.id === 'second').layerId = 'batch-1?layer-1';
    const plan = compileAssembly(task, input);
    const destinations = plan.imports.map(item => item.destination);
    assert.equal(new Set(destinations).size, 3);
    assert.ok(destinations.every(item => !/[<>:"|?*\\]/.test(item)));
    task.assembly = { plan };
    assert.equal(editableLayout(task).nodes.find(item => item.id === 'first').layerId, layer.id);
    assert.deepEqual(compileAssembly(task, input).imports, plan.imports);
    assert.doesNotThrow(() => validateLayout(task, input));
  });
  await check('简写与完整布局编译一致且歧义拒绝', async () => {
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    const full = task.layoutDraft.input;
    const compact = structuredClone(full);
    compact.font = 'Assets/Fonts/Test.asset';
    compact.rootLayout = 'overlay';
    for (const node of compact.nodes) {
      delete node.kind;
      if (node.layout) node.layout = node.layout.type;
      if (node.text !== undefined) delete node.font;
      else if (node.layerId) delete node.semanticRole;
    }
    const expanded = expandLayoutInput(task, compact);
    assertLayoutContract(expanded);
    const simplifiedPlan = validateLayout(task, prepareComponentLayout(task, expanded));
    const explicitPlan = validateLayout(task, prepareComponentLayout(task, full));
    assert.deepEqual(assemblyDelta(explicitPlan, simplifiedPlan), []);
    assert.throws(() => expandLayoutInput(task, { nodes: [{ id: 'ambiguous', text: '12', layerId: 'icon' }] }), /歧义/);
    assert.throws(() => expandLayoutInput(task, { nodes: [{ id: 'wrong', kind: 'image', text: '12' }] }), /冲突/);
    const shared = structuredClone(task);
    shared.resourceCatalog.push({ id: 'badge', semanticRole: 'indicator' });
    shared.resourceReview.bindings.push({ resourceId: 'badge', references: [{ kind: 'layer', id: 'icon' }] });
    assert.throws(() => expandLayoutInput(shared, { nodes: [{ id: 'shared', layerId: 'icon' }] }), /唯一/);
    const nested=expandLayoutInput(task,{font:'Assets/Fonts/Shared.asset',nodes:[],components:[
      {id:'inherited',nodes:[{id:'text',text:'12'}]},
      {id:'own',fontId:'font-own',nodes:[{id:'text',text:'34'}]}
    ]});
    assert.equal(nested.components[0].nodes[0].font,'Assets/Fonts/Shared.asset');
    assert.equal(nested.components[1].nodes[0].fontId,'font-own');
    assert.equal(nested.components[1].nodes[0].font,undefined);
  });
  await check('规则Grid测量真实尺寸及间距 不规则拒绝', async () => {
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    const compact = { prefabPath: task.prefabPath, nodes: [
      { id: 'bg', layerId: 'bg' },
      { id: 'grid', layout: 'grid', box: [90,90,164,164] },
      ...[[100,100],[180,100],[100,180],[180,180]].map(([x,y], index) => ({ id: 'cell' + index, parent: 'grid', layerId: 'icon', box: [x,y,64,64] }))
    ] };
    const expanded = expandLayoutInput(task, compact);
    assertLayoutContract(expanded);
    const prepared = prepareComponentLayout(task, expanded);
    const plan = validateLayout(task, prepared);
    const grid = plan.nodes.find(node => node.id === 'grid');
    assert.equal(grid.layout.type, 'grid');
    assert.deepEqual(grid.layout.cellSize, [64,64]);
    assert.equal(grid.layout.constraintCount, 2);
    assert.deepEqual(grid.layout.spacing, [16,16]);
    assert.deepEqual(grid.layout.padding, [10,10,10,10]);
    assert.deepEqual(plan.nodes.find(node => node.id === 'cell3').box, {left:180,top:180,width:64,height:64});
    const irregular = structuredClone(expanded);
    irregular.nodes.find(node => node.id === 'cell3').box[0] += 5;
    assert.throws(() => prepareComponentLayout(task, irregular), /规则Grid/);
    const reversed = structuredClone(expanded);
    [reversed.nodes[2],reversed.nodes[3]]=[reversed.nodes[3],reversed.nodes[2]];
    assert.throws(() => prepareComponentLayout(task,reversed),/规则Grid/);
    const explicit = structuredClone(irregular);
    explicit.nodes.find(node=>node.id==='grid').layout={type:'grid',cellSize:[64,64],constraintCount:2,spacing:[16,16],padding:[10,10,10,10]};
    assert.doesNotThrow(()=>prepareComponentLayout(task,explicit));
    const gridTaskDirectory=path.join(directory,'grid-task');
    await fs.mkdir(gridTaskDirectory);
    task.directory=gridTaskDirectory;
    delete task.layoutDraft;
    delete task.assembly;
    await writeJson(path.join(gridTaskDirectory,'task.json'),task);
    const summary=await call('layout',gridTaskDirectory,compact);
    assert.equal(summary.nodeIndex.find(node=>node.id==='grid').kind,'group');
    const saved=await readJson(path.join(gridTaskDirectory,'task.json'));
    assert.deepEqual(saved.assembly.plan.nodes.find(node=>node.id==='grid').layout,grid.layout);
  });
  await check('公共字体差量更新保留位置及节点覆盖', async () => {
    const fontTaskDirectory = path.join(directory, 'font-task');
    await fs.mkdir(fontTaskDirectory);
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    task.directory = fontTaskDirectory;
    delete task.layoutDraft;
    delete task.assembly;
    await writeJson(path.join(fontTaskDirectory, 'task.json'), task);
    const compact = structuredClone(before.layoutDraft.input);
    compact.font = 'Assets/Fonts/Shared.asset';
    delete compact.nodes.find(node => node.id === 'label').font;
    compact.nodes.push({ id:'override', parent:'panel', text:'34', font:'Assets/Fonts/Override.asset', fontSize:20, box:[200,220,60,40] });
    await call('layout', fontTaskDirectory, compact);
    const first = await readJson(path.join(fontTaskDirectory, 'task.json'));
    await call('layout_patch', fontTaskDirectory, {font:'Assets/Fonts/Changed.asset'});
    const second = await readJson(path.join(fontTaskDirectory, 'task.json'));
    assert.deepEqual(assemblyDelta(first.assembly.plan, second.assembly.plan), [{id:'label',fields:['font']}]);
    assert.equal(second.assembly.plan.nodes.find(node=>node.id==='override').font,'Assets/Fonts/Override.asset');
    await call('layout_patch', fontTaskDirectory, {nodes:[{id:'label',fontSize:23}]});
    const third = await readJson(path.join(fontTaskDirectory, 'task.json'));
    assert.deepEqual(assemblyDelta(second.assembly.plan, third.assembly.plan), [{id:'label',fields:['fontSize']}]);
  });
  await check('多个根容器默认保留各自参考位置', async () => {
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    const input = structuredClone(task.layoutDraft.input);
    delete input.rootLayout;
    input.nodes.push({ id:'other',kind:'group',semanticRole:'panel',layout:{type:'overlay'},box:[500,100,100,100] });
    input.nodes.push({ id:'otherIcon',parent:'other',kind:'image',semanticRole:'icon',layerId:'icon',box:[510,110,64,64] });
    const plan = validateLayout(task,prepareComponentLayout(task,input));
    assert.equal(plan.nodes[0].layout.type,'overlay');
    assert.deepEqual(plan.nodes.find(node=>node.id==='other').box,{left:500,top:100,width:100,height:100});
  });
  await check('按钮格底默认位于图标角标与文字后方且显式层级优先', async () => {
    const task = await readJson(path.join(taskDirectory, 'task.json'));
    const input = structuredClone(task.layoutDraft.input);
    input.nodes.push(
      { id: 'badge', kind: 'image', parent: 'panel', semanticRole: 'indicator', layerId: 'icon', box: [100,100,64,64] },
      { id: 'itemIcon', kind: 'image', parent: 'panel', semanticRole: 'icon', layerId: 'icon', box: [100,100,64,64] },
      { id: 'buttonFace', kind: 'button', parent: 'panel', semanticRole: 'panel', color: [1,1,1,1], box: [100,100,64,64] }
    );
    const plan = compileAssembly(task, input);
    const sibling = id => plan.nodes.find(item => item.id === id).siblingIndex;
    assert.ok(sibling('buttonFace') < sibling('itemIcon'));
    assert.ok(sibling('itemIcon') < sibling('badge'));
    assert.ok(sibling('badge') < sibling('label'));
    input.nodes.find(item => item.id === 'buttonFace').zIndex = 200;
    const explicit = compileAssembly(task, input);
    assert.ok(explicit.nodes.find(item => item.id === 'buttonFace').siblingIndex > explicit.nodes.find(item => item.id === 'label').siblingIndex);
  });
  await check('首次创建前可更换输出目录且已应用或未知Unity操作禁止改路径', async () => {
    const prefabPath = 'Assets/UI/Generated/Relocated/UIRoot.prefab';
    await call('layout_patch', taskDirectory, { prefabPath });
    const state = await readJson(path.join(taskDirectory, 'task.json'));
    assert.equal(state.prefabPath, prefabPath);
    assert.ok(state.assembly.plan.imports.every(item => item.destination.startsWith('Assets/UI/Generated/Relocated/')));
    state.appliedAssembly = { plan: state.assembly.plan };
    await writeJson(path.join(taskDirectory, 'task.json'), state);
    await assert.rejects(call('layout_patch', taskDirectory, { prefabPath: 'Assets/Other.prefab' }), /原Prefab/);
    delete state.appliedAssembly;
    state.operations = { fixture: { kind: 'unity', state: 'unknown', id: 'fixture' } };
    await writeJson(path.join(taskDirectory, 'task.json'), state);
    await assert.rejects(call('layout_patch', taskDirectory, { prefabPath: 'Assets/Other.prefab' }), /未知/);
    state.operations = {};
    await writeJson(path.join(taskDirectory, 'task.json'), state);
    const occupied = path.join(directory, 'Assets/Occupied.prefab');
    await fs.writeFile(occupied, 'offline occupied target');
    await assert.rejects(call('layout_patch', taskDirectory, { prefabPath: 'Assets/Occupied.prefab' }), /已存在/);
    assert.equal((await readJson(path.join(taskDirectory, 'task.json'))).prefabPath, prefabPath);
  });
  await check('任务锁拒绝并发且结束后释放', async () => {
    await withTask(taskDirectory, async () => assert.rejects(withTask(taskDirectory, async () => {}), /已锁定/));
    await assert.rejects(fs.stat(path.join(taskDirectory, '.execution-lock')), /ENOENT/);
  });
  await check('自动背景一次与新的人工授权补图', async () => {
    await call('supplement_plan', taskDirectory, { material_kind: 'background', semantic_role: 'background', prompt: '独立干净背景' });
    await assert.rejects(call('supplement_plan', taskDirectory, { material_kind: 'background', semantic_role: 'background', prompt: '第二张背景' }), /授权/);
    const second = await call('supplement_plan', taskDirectory, { material_kind: 'icon', semantic_role: 'icon', prompt: '缺失箭头', authorization: '同意新增补一张缺失箭头' });
    assert.equal(second.requestCount, 1);
  });
  await check('本地失败与提交未知区分且不可重放', async () => {
    await withTask(taskDirectory, async task => {
      await assert.rejects(operation(task, 'local-failure', 'supplement', async () => { throw new Error('离线模拟本地预检拒绝'); }), /failed_before_submission/);
      await assert.rejects(operation(task, 'remote-unknown', 'supplement', async op => {
        await writeJson(path.join(op.directory, 'submission-started.json'), { fixture: true });
        throw new Error('离线模拟已提交但无响应');
      }), /unknown/);
      await assert.rejects(operation(task, 'remote-unknown', 'supplement', async () => { throw new Error('不可执行'); }), /不重放/);
    });
    assert.equal((await call('get', taskDirectory)).resourceReview.state, 'ready');
    const fresh = await call('supplement_plan', taskDirectory, { material_kind: 'icon', semantic_role: 'icon', prompt: '新的缺失帽子', authorization: '人类同意再补一张帽子' });
    assert.equal(fresh.requestCount, 1);
  });
  await check('写前明确拒绝可继续 真实未知与已写入不误分类', async () => {
    const receiptList = id => [
      { arguments:['editor','guard-check'], receipt:{data:{allowed:true}} },
      { arguments:['editor','exec','--code-file','-'], requestId:id+'-validate', receipt:{error:{details:{terminal_state:'runtime_error',data:{completed:true,response:{
        request_id:id+'-validate',state:'runtime_error',success:false,error_type:'System.InvalidOperationException',error_message:'请先退出当前 Prefab Stage',execute_ms:0
      }}}}} }
    ];
    const op = {id:'test',kind:'unity',state:'unknown'};
    const original = receiptList(op.id);
    assert.equal(assertRejectedPreflight(op,original),'test-validate');
    const guardOnly = [{ arguments: ['editor', 'guard-check'], requestId: null, receipt: {
      command: 'editor guard-check', ok: false, dry_run: false, data: null,
      error: { code: 'FUC_EDITOR_MODE_REQUIRED', retryable: false, details: { allowed: false } }
    } }];
    assert.equal(assertRejectedPreflight(op, guardOnly), null);
    for (const mutate of [
      rows => { rows[0].requestId = 'unexpected-write'; },
      rows => { rows[0].receipt.error.code = 'FUC_TRANSPORT_TIMEOUT'; },
      rows => { rows[0].receipt.error.details.allowed = true; },
      rows => { rows.push({ arguments: ['asset', 'import-file'] }); }
    ]) {
      const rows = structuredClone(guardOnly);
      mutate(rows);
      assert.throws(() => assertRejectedPreflight(op, rows));
    }
    for (const [suffix, message] of [
      ['component-0-validate', '请先退出当前 Prefab Stage'],
      ['folders', '需要空闲Edit Mode并退出Prefab Stage']
    ]) {
      const rows = structuredClone(original);
      rows[1].requestId = op.id + '-' + suffix;
      const response = rows[1].receipt.error.details.data.response;
      response.request_id = rows[1].requestId;
      response.error_message = message;
      assert.equal(assertRejectedPreflight(op, rows), rows[1].requestId);
    }
    for (const mutate of [
      rows=>rows[1].receipt.error.details.data.response.execute_ms=1,
      rows=>rows[1].receipt.error.details.data.response.state='processing_timeout',
      rows=>rows[1].requestId='other-validate',
      rows=>rows.push({arguments:['asset','import-file']}),
      rows=>rows[0].receipt.data.allowed=false
    ]) {const rows=structuredClone(original);mutate(rows);assert.throws(()=>assertRejectedPreflight(op,rows));}
    await withTask(taskDirectory, async task => {
      await assert.rejects(operation(task,'stage-rejection','unity',async pending=>{
        await writeJson(path.join(pending.directory,'receipts.json'),receiptList(pending.id));
        throw new Error('原始Prefab Stage错误');
      }),/rejected_before_write/);
      const rejected=task.operations['stage-rejection'];
      assert.match(rejected.error,/原始Prefab Stage错误/);
      assert.equal(await operation(task,'stage-rejection','unity',async()=> 'continued'),'continued');
      assert.equal(task.operations['stage-rejection:rejected:'+rejected.id].state,'rejected_before_write');
      await assert.rejects(operation(task,'partial-write','unity',async pending=>{
        await writeJson(path.join(pending.directory,'receipts.json'),receiptList(pending.id));
        await writeJson(path.join(pending.directory,'applied.json'),{plan:{},assetState:{}});
        throw new Error('已写入后失败');
      }),/unknown/);
      await assert.rejects(operation(task,'partial-write','unity',async()=> 'must not run'),/不重放/);
      delete task.appliedAssembly;
    });
  });
  await check('完整终态验收失败保留基线 修正可继续 未知仍锁定', async () => {
    await withTask(taskDirectory, async task => {
      const state = { path: task.prefabPath, guid: 'a'.repeat(32), sha256: 'b'.repeat(64), nodeBindings: [], dependencies: [] };
      const plan = { prefabPath: task.prefabPath, imports: [] };
      const fail = async (op, mismatch = false) => {
        const result = { passed: false, prefab_created: true, asset_state: state, receiptDirectory: op.directory };
        task.appliedAssembly = { plan, assetState: state };
        await writeJson(path.join(op.directory, 'applied.json'), { plan: { ...plan, imports: [{ reuse: true }] }, assetState: state });
        await writeJson(path.join(op.directory, 'result.json'), mismatch ? { ...result, passed: true } : result);
        throw new AssemblyValidationError('终态结构检查失败', result);
      };
      await assert.rejects(operation(task, 'unity:failed-layout', 'unity', fail), /failed_validation/);
      assert.deepEqual(task.appliedAssembly.plan, plan);
      assert.ok(!Object.values(task.operations).some(op => op.id === task.operations['unity:failed-layout'].id && ['unknown', 'running'].includes(op.state)));
      await assert.rejects(operation(task, 'unity:failed-layout', 'unity', async () => assert.fail('不得重放原hash')), /不重放/);
      assert.equal(await operation(task, 'unity:revised-layout', 'unity', async () => 'updated'), 'updated');
      await assert.rejects(operation(task, 'unity:inconsistent-receipt', 'unity', op => fail(op, true)), /unknown/);
      assert.equal(task.operations['unity:inconsistent-receipt'].state, 'unknown');
      delete task.appliedAssembly;
    });
  });
  await check('80分及功能底线且没有截图不交付', async () => {
    const value = { scores: { layout: 30, images: 20, text: 20, background: 10 }, deductions: [
      { category: 'layout', points: 10, reason: '夹具测试', evidenceRegion: '左列' },
      { category: 'images', points: 10, reason: '夹具测试', evidenceRegion: '装备' }
    ], functionalIssues: [] };
    assert.equal(qualityReview(value).verdict, 'passed');
    assert.equal(qualityReview({ ...value, functionalIssues: ['背景残留旧装备'] }).verdict, 'failed');
    await assert.rejects(call('report', taskDirectory, value), /真实Unity截图/);
  });
  console.log(JSON.stringify({ passed: checks, networkRequests: 0, unityWrites: 0, scope: '独立入口与本地制作链路 实际上游与Unity写入未测试' }));
} finally {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('mm-image2prefab-selftest-')) throw new Error('临时清理路径校验失败 ' + resolved);
  await fs.rm(resolved, { recursive: true });
}

function approvedSourceFile(task) { return task.candidates.find(item => item.id === task.approval.candidateId).file; }
