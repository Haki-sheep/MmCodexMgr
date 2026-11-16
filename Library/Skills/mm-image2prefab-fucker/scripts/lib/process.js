import { spawn } from 'node:child_process';

// 子进程只接收参数数组 禁止 shell 拼接 请求未知时由上层保留原任务
export function runProcess(executable, args, { cwd, env = {}, input, signal, timeoutMs = 1900000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env: { ...process.env, ...env, PYTHONDONTWRITEBYTECODE: '1' }, windowsHide: true, shell: false });
    const out = [];
    const err = [];
    let bytes = 0;
    let stopped = null;
    const stop = reason => { stopped = reason; child.kill(); };
    const timer = setTimeout(() => stop('子进程超时 外部请求结果可能未知'), timeoutMs);
    const abort = () => stop('操作取消 外部请求结果可能未知');
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const collect = target => chunk => {
      bytes += chunk.length;
      if (bytes > 8 * 1024 * 1024) stop('子进程回传超过 8 MiB');
      else target.push(chunk);
    };
    child.stdout.on('data', collect(out));
    child.stderr.on('data', collect(err));
    child.on('error', error => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      const stdout = Buffer.concat(out).toString('utf8');
      const stderr = Buffer.concat(err).toString('utf8');
      if (stopped) reject(new Error(stopped));
      else resolve({ code, stdout, stderr });
    });
    child.stdin.on('error', error => { stopped = `子进程输入失败 ${error.message}`; });
    child.stdin.end(input ?? '');
  });
}

export function parseProcess(result) {
  if (result.code !== 0) throw new Error((result.stderr || result.stdout || `进程退出 ${result.code}`).slice(-6000));
  return JSON.parse(result.stdout.trim());
}
