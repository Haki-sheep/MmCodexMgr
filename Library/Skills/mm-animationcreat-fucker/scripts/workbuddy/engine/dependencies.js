import { createRequire } from 'node:module';
import { join } from 'node:path';

const DependencyDirectory = process.env.MM_ANIMATIONCREAT_DEPENDENCIES;
if (!DependencyDirectory) throw new Error('通过 scripts/animation.mjs 启动 DrawAI');

export const requireDependency = createRequire(join(DependencyDirectory, 'package.json'));
