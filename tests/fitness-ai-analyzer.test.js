const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAssessment,
  normalizeAssessment,
  getPriorityAreas,
  clampValue,
  summarizeCameraFrame,
  estimateHeartRateFromSkin
} = require('../src/index.js');
const {
  estimatePresenceFromPixels
} = require('../src/camera.js');

test('normalizeAssessment returns bounded values and normalized sex', () => {
  const result = normalizeAssessment({
    bmi: 35,
    waistCm: 100,
    hipCm: 110,
    heightCm: 170,
    sex: 'MALE',
    posture: 40,
    symmetry: 55,
    mobility: 90,
    movement: 72,
    gait: 80
  });

  assert.equal(result.sex, 'male');
  assert.equal(result.bmi, 35);
  assert.equal(result.waistCm, 100);
  assert.equal(result.heightCm, 170);
  assert.equal(typeof result.posture, 'number');
});

test('createAssessment includes score breakdown and priorities', () => {
  const result = createAssessment({
    bmi: 27.4,
    waistCm: 91,
    hipCm: 102,
    heightCm: 170,
    sex: 'male',
    posture: 74,
    symmetry: 80,
    mobility: 63,
    movement: 68,
    gait: 76
  });

  assert.ok(result.scoreBreakdown);
  assert.ok(Array.isArray(result.priorities));
  assert.ok(result.overallScore >= 0);
  assert.ok(result.overallScore <= 100);
});

test('clampValue keeps values inside valid range', () => {
  assert.equal(clampValue(-5, 0, 100), 0);
  assert.equal(clampValue(120, 0, 100), 100);
  assert.equal(clampValue(42, 0, 100), 42);
});

test('summarizeCameraFrame normalizes camera-derived metrics', () => {
  const result = summarizeCameraFrame({
    posture: 130,
    symmetry: -10,
    mobility: 65,
    movement: 75,
    gait: 80,
    quality: 55,
    motion: 0.8
  });

  assert.equal(result.posture, 100);
  assert.equal(result.symmetry, 0);
  assert.equal(result.mobility, 65);
  assert.equal(result.movement, 75);
  assert.equal(result.gait, 80);
  assert.equal(typeof result.quality, 'number');
});

test('empty camera frame receives a lower assessment than a real person frame', () => {
  const emptyFrame = summarizeCameraFrame({
    posture: 50,
    symmetry: 48,
    mobility: 52,
    movement: 50,
    gait: 51,
    quality: 50,
    motion: 0.08,
    personPresence: 0.05
  });

  const personFrame = summarizeCameraFrame({
    posture: 76,
    symmetry: 81,
    mobility: 70,
    movement: 74,
    gait: 78,
    quality: 75,
    motion: 0.68,
    personPresence: 0.92
  });

  const emptyAssessment = createAssessment({
    bmi: 27.4,
    waistCm: 91,
    hipCm: 102,
    heightCm: 170,
    sex: 'male',
    ...emptyFrame
  });

  const personAssessment = createAssessment({
    bmi: 27.4,
    waistCm: 91,
    hipCm: 102,
    heightCm: 170,
    sex: 'male',
    ...personFrame
  });

  assert.ok(emptyAssessment.overallScore < personAssessment.overallScore);
  assert.equal(emptyAssessment.status, 'Needs intervention');
  assert.ok(personAssessment.overallScore > 50);
});

test('estimatePresenceFromPixels detects a face-like skin region even when detector confidence is low', () => {
  const width = 80;
  const height = 80;
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const centerMask = Math.abs(x - width / 2) < 20 && Math.abs(y - height / 2) < 25;

      if (centerMask) {
        pixels[i] = 170;
        pixels[i + 1] = 120;
        pixels[i + 2] = 95;
      } else {
        pixels[i] = 30;
        pixels[i + 1] = 25;
        pixels[i + 2] = 25;
      }
      pixels[i + 3] = 255;
    }
  }

  const presence = estimatePresenceFromPixels({ data: pixels, width, height });
  assert.ok(presence >= 0.35, `expected face-like region to register as person, got ${presence}`);
});

test('estimateHeartRateFromSkin identifies a plausible pulse range', () => {
  const samples = [];
  const sampleRate = 30;
  for (let i = 0; i < 180; i += 1) {
    const phase = (2 * Math.PI * (i / sampleRate)) * 1.25;
    samples.push(40 + Math.sin(phase) * 18 + (i % 7) * 0.3);
  }

  const bpm = estimateHeartRateFromSkin(samples, sampleRate);
  assert.ok(bpm >= 60 && bpm <= 110, `expected bpm in range, got ${bpm}`);
});
