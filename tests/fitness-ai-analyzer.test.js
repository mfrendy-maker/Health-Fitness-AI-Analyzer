const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAssessment,
  normalizeAssessment,
  getPriorityAreas,
  clampValue
} = require('../src/index.js');

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
