/* eslint-disable no-console */
/**
 * Downloads the SmolLM2-360M-Instruct tokenizer.json into the Android assets
 * so the on-device coach can tokenize chat prompts.
 *
 *     node scripts/fetch-tokenizer.js
 *
 * If your network blocks huggingface.co, download this file manually:
 *   https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/tokenizer.json
 * and place it at:
 *   android/app/src/main/assets/tokenizer/tokenizer.json
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const URL =
  'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/tokenizer.json';
const DEST_DIR = path.resolve(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'assets',
  'tokenizer',
);
const DEST = path.join(DEST_DIR, 'tokenizer.json');

function download(url, dest, redirects = 0) {
  if (redirects > 5) throw new Error('Too many redirects');
  fs.mkdirSync(DEST_DIR, {recursive: true});
  const file = fs.createWriteStream(dest);
  https
    .get(url, {headers: {'User-Agent': 'nutrilife-setup'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        // Hugging Face sometimes returns a relative Location; resolve it.
        const next = new URL(res.headers.location, url).toString();
        return download(next, dest, redirects + 1);
      }
      if (res.statusCode !== 200) {
        file.close();
        console.error('HTTP', res.statusCode, '- download tokenizer.json manually (see header comment).');
        process.exit(1);
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => console.log('Saved tokenizer ->', DEST)));
    })
    .on('error', err => {
      file.close();
      console.error('Download failed:', err.message);
      console.error('Download tokenizer.json manually (see header comment).');
      process.exit(1);
    });
}

download(URL, DEST);
