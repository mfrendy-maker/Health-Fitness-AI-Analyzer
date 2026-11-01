# Fitness AI Analyzer

This project has been moved to a Python-first architecture for camera-based health and fitness screening.

It combines:
- WHO-style risk metrics (BMI, waist, waist-to-hip ratio, waist-to-height ratio)
- camera-based posture, symmetry, mobility, movement, and gait signals
- an overall wellness score with tailored recommendations

This is meant for general tracking and coaching support, not clinical diagnosis.

## Python installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run a sample assessment

```bash
python -m fitness_ai_analyzer --sample-only --height 170 --weight 72 --waist 88 --hip 98 --sex male
```

## Run the live camera analyzer

```bash
python -m fitness_ai_analyzer --height 170 --weight 72 --waist 88 --hip 98 --sex male --camera-index 0
```

## Example Python usage

```python
from fitness_ai_analyzer import create_assessment

result = create_assessment({
    "bmi": 27.4,
    "waistCm": 91,
    "hipCm": 102,
    "heightCm": 170,
    "sex": "male",
    "posture": 74,
    "symmetry": 80,
    "mobility": 63,
    "movement": 68,
    "gait": 76,
})

print(result)
```

## Features

- WHO health score model
- Functional fitness score model
- Unified overall score calculation
- Recommendation engine for health improvement priorities
- Python/OpenCV + MediaPipe camera pipeline

## Camera pipeline

The project uses MediaPipe Pose to estimate landmarks from the live camera feed and then derives posture, symmetry, mobility, movement quality, and gait scores.

## Heart-rate monitoring

The Python version also includes a non-contact heart-rate estimator based on photoplethysmography from the face region.

```bash
py -3 -m fitness_ai_analyzer --heart-rate-only --camera-index 0
```

This picks up subtle color changes in the face ROI, converts the green-channel signal into a time series, and estimates BPM using FFT-based frequency analysis.

## Notes

This package is intended for health tracking and fitness monitoring, not clinical diagnosis.

## License

MIT
