// Copies the files that onnxruntime-web loads at run time (its WebAssembly engine) into
// public/ort, so the app serves them itself and the phone never asks a third-party host.
// It runs before `npm run dev` and `npm run build`; the copies are not committed.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'onnxruntime-web', 'dist');
const target = join(root, 'public', 'ort');
const files = ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];

mkdirSync(target, { recursive: true });
for (const file of files) {
  const from = join(source, file);
  if (!existsSync(from)) {
    console.error(`copy-ort: ${from} does not exist. Run "npm install" first.`);
    process.exit(1);
  }
  copyFileSync(from, join(target, file));
}
console.log(`copy-ort: ${files.length} files copied to public/ort`);
