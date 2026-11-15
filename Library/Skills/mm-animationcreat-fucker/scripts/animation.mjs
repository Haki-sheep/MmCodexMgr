import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LocalDirectory = process.env.LOCALAPPDATA;
const RuntimeDirectory = process.env.MM_ANIMATIONCREAT_RUNTIME || (LocalDirectory && join(LocalDirectory, 'MmAnimationCreat'));
if (!RuntimeDirectory) throw new Error('请使用 MM_ANIMATIONCREAT_RUNTIME 指定动画运行目录');
const Runtime = resolve(RuntimeDirectory);
const Dependencies = join(Runtime, 'cli');
if (!existsSync(join(Dependencies, 'node_modules', '@babel', 'parser', 'package.json'))) {
  throw new Error('缺少动画运行依赖 ' + Dependencies + ' 请按 references/runtime.md 安装');
}

const ChildEnvironment = {
  ...process.env,
  MM_ANIMATIONCREAT_DEPENDENCIES: Dependencies,
  DRAWAI_VIDEO_RUNTIME_DIR: join(Runtime, 'video-runtime'),
  DRAWAI_ASSETS_DIR: join(Runtime, 'assets-v1'),
  DRAWAI_DEMO_ASSETS_DIR: join(Runtime, 'demo-assets-v1'),
  DRAWAI_FFMPEG_DIR: join(Runtime, 'ffmpeg'),
  npm_config_bin_links: 'false',
  npm_config_cache: process.env.TEMP ? join(process.env.TEMP, 'MmAnimationCreat-npm') : process.env.npm_config_cache,
};
const Entry = fileURLToPath(new URL('./workbuddy/bin/wb.mjs', import.meta.url));
const Child = spawnSync(process.execPath, [Entry, ...process.argv.slice(2)], {
  env: ChildEnvironment,
  stdio: 'inherit',
  windowsHide: true,
});
if (Child.error) throw Child.error;
process.exitCode = Child.status ?? 1;
