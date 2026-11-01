# Health-Fitness-AI-Analyzer Example Output

This folder shows an example of the expected output from the webcam-based assessment demo.

## Example result

```json
{
  "healthScore": 83.8,
  "functionalScore": 82.4,
  "overallScore": 83.1,
  "status": "Good",
  "personDetected": true,
  "personPresence": 1,
  "cameraStatus": "Person detected",
  "heartRate": 72,
  "scoreBreakdown": {
    "health": 83.8,
    "functional": 82.4,
    "overall": 83.1,
    "posture": 81,
    "symmetry": 66,
    "mobility": 100,
    "movement": 95,
    "gait": 87
  },
  "priorities": [
    {
      "key": "posture",
      "score": 81,
      "label": "Posture",
      "recommendation": "Maintain current progression."
    },
    {
      "key": "symmetry",
      "score": 66,
      "label": "Symmetry",
      "recommendation": "Maintain current progression."
    },
    {
      "key": "mobility",
      "score": 100,
      "label": "Mobility",
      "recommendation": "Maintain current progression."
    }
  ],
  "recommendations": [
    "Your current profile is relatively balanced. Continue your training and recovery routine and focus on maintaining your gains."
  ]
}
```

## Example UI summary

```text
Status: Good. Person detected. Presence 1.00/1. Camera confidence 100/100. Heart rate 72 bpm.
```

## Notes

- A real person must be in view for the score to be considered valid.
- No-face or warm-wallpaper false positives are rejected.
- Heart rate is only displayed when the face signal is valid and stable enough to estimate.
