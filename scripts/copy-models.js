/* eslint-disable no-console */
/**
 * Copies the ONNX models from ./models into the Android assets folder so they
 * get packaged into the APK. Run once before building:
 *
 *     node scripts/copy-models.js
 *
 * The app copies them out of assets to the app's files dir on first launch
 * (see src/services/onnx/modelManager.ts) because ONNX Runtime needs a real
 * file path, and large compressed assets cannot be mmap'd directly.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'models');
const DEST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'models');

const FILES = [
  // local filename in ./models   ->   asset filename used by the app
  ['efficientnet_b0_food101.onnx', 'food_classifier.onnx'],
  ['model_q4.onnx', 'coach_smollm2_360m_q4.onnx'],
];

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('No ./models directory found at', SRC);
    process.exit(1);
  }
  fs.mkdirSync(DEST, {recursive: true});

  for (const [from, to] of FILES) {
    const src = path.join(SRC, from);
    const dst = path.join(DEST, to);
    if (!fs.existsSync(src)) {
      console.warn('! Skipping missing model:', from);
      continue;
    }
    const size = (fs.statSync(src).size / (1024 * 1024)).toFixed(1);
    process.stdout.write(`Copying ${from} -> assets/models/${to} (${size} MB) ... `);
    fs.copyFileSync(src, dst);
    console.log('done');
  }
  console.log('\nAll models staged into Android assets.');
}

main();
