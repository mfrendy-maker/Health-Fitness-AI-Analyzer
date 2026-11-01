# Fitness AI Analyzer

A JavaScript package for health and fitness assessment using WHO-based health risk scoring together with camera-assisted functional analysis.

This package helps estimate:
- BMI-based health risk
- waist circumference risk
- waist-to-hip ratio risk
- waist-to-height ratio risk
- posture score
- symmetry score
- mobility score
- movement quality score
- gait and balance score
- overall body health and fitness score
- personalized recommendations

This project is designed as a practical assessment utility and is not intended to replace medical diagnosis.

## Features

- WHO health score model
- Functional fitness score model
- Unified overall score calculation
- Recommendation engine for health improvement priorities
- Lightweight JavaScript implementation

## Installation

```bash
npm install @mfrendy-maker/fitness-ai-analyzer
```

## Usage

```js
const { createAssessment } = require('@mfrendy-maker/fitness-ai-analyzer');

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

console.log(result);
```

Example output:

```json
{
  "healthScore": 58.1,
  "functionalScore": 72.1,
  "overallScore": 63.3,
  "status": "Moderate",
  "recommendations": [
    "Your waist-to-height ratio is above the practical risk threshold.",
    "Your mobility is limited.",
    "Your posture and symmetry are moderate."
  ]
}
```

## Scoring logic

The package combines:
- WHO-style health risk metrics
- camera-based motion and posture scores
- an overall score weighted toward health risk and functional status

## Notes

This package is intended for health tracking and fitness monitoring, not clinical diagnosis.

## License

MIT
