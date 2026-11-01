# Health-Fitness-AI-Analyzer

This package scores a person's health and fitness using WHO-inspired body metrics together with camera-based functional indicators such as posture, symmetry, mobility, movement quality, and gait.

## What I improved

- Added input validation and clamping for BMI, waist circumference, posture, and other scoring inputs.
- Normalized user sex values to eliminate case and formatting issues.
- Added richer `scoreBreakdown` metadata to make results easier to interpret and show in dashboards.
- Added `priorities` to surface the most urgent improvement areas.
- Kept the original scoring model intact while improving safety and output readability.

## Example

```js
const { createAssessment } = require('./src/index.js');

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

console.log(result.overallScore);
console.log(result.status);
console.log(result.priorities);
```

## Run tests

```bash
node --test
```
