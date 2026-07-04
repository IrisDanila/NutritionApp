/* Quick sanity test of the food model in a reference ONNX runtime. */
const ort = require('onnxruntime-node');

(async () => {
  const path = process.argv[2] || './models/mobilenet_v2_food101.onnx';
  console.log('Testing model:', path);
  const session = await ort.InferenceSession.create(path);
  console.log('inputNames', session.inputNames);
  console.log('outputNames', session.outputNames);
  try {
    console.log('inputMetadata', JSON.stringify(session.inputMetadata));
    console.log('outputMetadata', JSON.stringify(session.outputMetadata));
  } catch (e) {
    console.log('metadata n/a', e.message);
  }

  const N = 3 * 224 * 224;
  const inName = session.inputNames[0];
  const outName = session.outputNames[0];

  async function run(label, gen) {
    const data = Float32Array.from({length: N}, (_, i) => gen(i));
    const t = new ort.Tensor('float32', data, [1, 3, 224, 224]);
    const r = await session.run({[inName]: t});
    const o = r[outName].data;
    let mn = Infinity, mx = -Infinity, ai = 0;
    for (let i = 0; i < o.length; i++) {
      if (o[i] < mn) mn = o[i];
      if (o[i] > mx) { mx = o[i]; ai = i; }
    }
    console.log(`${label}: len=${o.length} min=${mn} max=${mx} argmax=${ai}`);
  }

  await run('zeros', () => 0);
  await run('halves(0.5)', () => 0.5);
  await run('imagenet-random[-2..2.6]', () => Math.random() * 4.6 - 2);
  await run('zero-to-one-random', () => Math.random());
})().catch(e => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
