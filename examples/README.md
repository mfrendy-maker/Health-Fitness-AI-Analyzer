# Example outputs

This folder contains sample outputs for the Health-Fitness-AI-Analyzer webcam assessment flow.

## Included examples

- `sample-output.json` – a valid assessment when a real person is detected.
- `no-person-output.json` – a rejected or lower-confidence assessment when no face/person is present.
- `output-example.md` – a human-readable summary of the expected result format.

## Interpretation rules

- A valid score should only be produced when a real face/person is visually present.
- If the camera is on but no face is detected, the system should return a low or invalid score instead of a normal assessment result.
- Heart rate should only be shown when a stable face signal is available.

## Example use

```bash
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('./examples/sample-output.json','utf8')); console.log(data.status, data.overallScore);"
```
