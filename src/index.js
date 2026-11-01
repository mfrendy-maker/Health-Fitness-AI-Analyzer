function clampValue(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeSex(sex) {
  return String(sex || '').trim().toLowerCase();
}

function normalizeAssessment(input = {}) {
  const normalized = {
    ...input,
    sex: normalizeSex(input.sex),
    bmi: clampValue(Number(input.bmi), 0, 80),
    waistCm: clampValue(Number(input.waistCm), 30, 200),
    hipCm: clampValue(Number(input.hipCm), 30, 220),
    heightCm: clampValue(Number(input.heightCm), 100, 250),
    posture: clampValue(Number(input.posture), 0, 100),
    symmetry: clampValue(Number(input.symmetry), 0, 100),
    mobility: clampValue(Number(input.mobility), 0, 100),
    movement: clampValue(Number(input.movement), 0, 100),
    gait: clampValue(Number(input.gait), 0, 100)
  };

  if (!['male', 'female'].includes(normalized.sex)) {
    throw new Error("sex must be 'male' or 'female'");
  }

  return normalized;
}

function bmiScore(bmi) {
  if (bmi < 18.5) return 70;
  if (bmi < 25) return 95;
  if (bmi < 30) return 80;
  if (bmi < 35) return 60;
  if (bmi < 40) return 35;
  return 15;
}

function waistScore(waistCm, sex) {
  const normalizedSex = normalizeSex(sex);
  if (normalizedSex === 'male') {
    if (waistCm <= 94) return 95;
    if (waistCm <= 102) return 70;
    return 35;
  }
  if (normalizedSex === 'female') {
    if (waistCm <= 80) return 95;
    if (waistCm <= 88) return 70;
    return 35;
  }
  throw new Error("sex must be 'male' or 'female'");
}

function whrScore(waistCm, hipCm, sex) {
  const whr = waistCm / hipCm;
  const normalizedSex = normalizeSex(sex);
  if (normalizedSex === 'male') {
    if (whr <= 0.9) return 95;
    if (whr <= 1.0) return 65;
    return 30;
  }
  if (normalizedSex === 'female') {
    if (whr <= 0.85) return 95;
    if (whr <= 0.95) return 65;
    return 30;
  }
  throw new Error("sex must be 'male' or 'female'");
}

function waistHeightScore(waistCm, heightCm) {
  const ratio = waistCm / heightCm;
  if (ratio < 0.5) return 95;
  if (ratio <= 0.57) return 70;
  return 35;
}

function whoHealthScore({ bmi, waistCm, hipCm, heightCm, sex }) {
  return (
    0.25 * bmiScore(bmi) +
    0.25 * waistScore(waistCm, sex) +
    0.2 * whrScore(waistCm, hipCm, sex) +
    0.3 * waistHeightScore(waistCm, heightCm)
  );
}

function functionalScore({ posture, symmetry, mobility, movement, gait }) {
  return (
    0.2 * posture +
    0.2 * symmetry +
    0.2 * mobility +
    0.2 * movement +
    0.2 * gait
  );
}

function overallScore(input) {
  const normalized = normalizeAssessment(input);
  const who = whoHealthScore(normalized);
  const func = functionalScore(normalized);
  return 0.6 * who + 0.4 * func;
}

function statusLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Elevated risk';
  return 'Needs intervention';
}

function getPriorityAreas(assessment) {
  const areas = [
    { key: 'BMI', score: bmiScore(assessment.bmi), label: 'BMI profile' },
    { key: 'waist', score: waistScore(assessment.waistCm, assessment.sex), label: 'Waist health' },
    { key: 'waistToHip', score: whrScore(assessment.waistCm, assessment.hipCm, assessment.sex), label: 'Waist-to-hip ratio' },
    { key: 'posture', score: assessment.posture, label: 'Posture' },
    { key: 'symmetry', score: assessment.symmetry, label: 'Symmetry' },
    { key: 'mobility', score: assessment.mobility, label: 'Mobility' },
    { key: 'movement', score: assessment.movement, label: 'Movement quality' },
    { key: 'gait', score: assessment.gait, label: 'Gait and balance' }
  ];

  return areas
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => ({
      ...item,
      recommendation: item.score < 60 ? 'Prioritize focused improvement work in this area.' : 'Maintain current progression.'
    }));
}

function generateRecommendations(assessment) {
  const recs = [];

  if (assessment.bmi >= 25) {
    recs.push('Your BMI is in the overweight or obesity range. Prioritize calorie control, protein intake, daily walking, and strength training to preserve lean mass while reducing fat.');
  }

  const waistHeightRatio = assessment.waistCm / assessment.heightCm;
  if (waistHeightRatio > 0.5) {
    recs.push('Your waist-to-height ratio is above the practical risk threshold. Reduce sedentary time and improve daily movement, sleep, and diet quality.');
  }

  if (assessment.sex === 'male' && assessment.waistCm > 94) {
    recs.push('Your waist circumference is above the healthy WHO threshold. Focus on reducing central adiposity with daily movement, strength training, and consistent nutrition habits.');
  }

  if (assessment.sex === 'female' && assessment.waistCm > 80) {
    recs.push('Your waist circumference is above the healthy WHO threshold. Focus on reducing central adiposity with daily movement, strength training, and consistent nutrition habits.');
  }

  const whr = assessment.waistCm / assessment.hipCm;
  if (assessment.sex === 'male' && whr > 0.9) {
    recs.push('Your waist-to-hip ratio is elevated. Increase daily movement, improve protein intake, and maintain consistent aerobic activity to reduce metabolic risk.');
  }

  if (assessment.sex === 'female' && whr > 0.85) {
    recs.push('Your waist-to-hip ratio is elevated. Increase daily movement, improve protein intake, and maintain consistent aerobic activity to reduce metabolic risk.');
  }

  if (assessment.posture < 60) {
    recs.push('Your posture assessment needs attention. Reduce prolonged sitting, strengthen your core and glutes, and improve thoracic mobility.');
  }

  if (assessment.symmetry < 70) {
    recs.push('Your symmetry is below target. Add unilateral or side-specific strength work to correct left-right imbalance and improve function.');
  }

  if (assessment.mobility < 60) {
    recs.push('Your mobility is limited. Add a daily 10–15 minute mobility routine focused on hips, ankles, shoulders, and thoracic spine.');
  }

  if (assessment.movement < 60) {
    recs.push('Your movement quality is weak. Focus on squat mechanics, hip stability, knee tracking, and controlled strength work before heavy loading.');
  }

  if (assessment.gait < 60) {
    recs.push('Your gait and balance need attention. Improve single-leg balance, walking posture, and lower-body stability.');
  }

  if (recs.length === 0) {
    recs.push('Your current profile is relatively balanced. Continue your training and recovery routine and focus on maintaining your gains.');
  }

  return recs;
}

function createAssessment(input) {
  const normalized = normalizeAssessment(input);
  const who = whoHealthScore(normalized);
  const func = functionalScore(normalized);
  const total = 0.6 * who + 0.4 * func;

  return {
    healthScore: who,
    functionalScore: func,
    overallScore: total,
    status: statusLabel(total),
    recommendations: generateRecommendations(normalized),
    scoreBreakdown: {
      health: who,
      functional: func,
      overall: total,
      bmi: bmiScore(normalized.bmi),
      waist: waistScore(normalized.waistCm, normalized.sex),
      waistToHip: whrScore(normalized.waistCm, normalized.hipCm, normalized.sex),
      waistToHeight: waistHeightScore(normalized.waistCm, normalized.heightCm),
      posture: normalized.posture,
      symmetry: normalized.symmetry,
      mobility: normalized.mobility,
      movement: normalized.movement,
      gait: normalized.gait
    },
    priorities: getPriorityAreas(normalized)
  };
}

module.exports = {
  clampValue,
  normalizeAssessment,
  normalizeSex,
  bmiScore,
  waistScore,
  whrScore,
  waistHeightScore,
  whoHealthScore,
  functionalScore,
  overallScore,
  statusLabel,
  getPriorityAreas,
  createAssessment,
  generateRecommendations
};
