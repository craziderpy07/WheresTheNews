import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const source = join(process.cwd(), 'node_modules', 'cesium', 'Build', 'Cesium');
const target = join(process.cwd(), 'public', 'cesium');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const dir of ['Assets', 'ThirdParty', 'Widgets', 'Workers']) {
  await cp(join(source, dir), join(target, dir), { recursive: true });
}
console.log('Cesium static assets copied to public/cesium.');
