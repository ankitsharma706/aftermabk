'use strict';

/**
 * ══════════════════════════════════════════════════════════════
 *  AFTERMA HEALTH SCORING ENGINE
 *  services/healthScoring.service.js
 *
 *  All scores are clamped to [0, 100] or their specified range.
 *  Frontend CANNOT submit scores — only raw daily logs.
 * ══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max (inclusive).
 */
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

/**
 * Linear normalise: maps value in [a, b] → [0, 1]
 */
const normalise = (value, a, b) => clamp((value - a) / (b - a), 0, 1);

// ─────────────────────────────────────────────────────────────
// 1. HYDRATION RATIO
//    recommended_liters = weight_kg × 0.033
//    hydration_ratio = min(actual / recommended, 1) × 100
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} waterLiters   - actual water intake today
 * @param {number} weightKg      - user's body weight in kg
 * @returns {number}             - 0–100 hydration score
 */
const calcHydrationRatio = (waterLiters, weightKg) => {
  const recommended = (weightKg || 60) * 0.033; // fallback 60 kg
  const ratio = waterLiters / recommended;
  return clamp(Math.min(ratio, 1) * 100);
};

// ─────────────────────────────────────────────────────────────
// 2. SLEEP QUALITY
//    (0.4 × sleep_duration_score +
//     0.2 × interruption_score +
//     0.2 × insomnia_factor +
//     0.2 × energy_factor) × 100
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} sleepHours        - hours slept
 * @param {number} interruptions     - night wake-ups
 * @param {boolean} insomnia         - had insomnia?
 * @param {number} energyLevel       - 0–10 energy score
 * @returns {number}                 - 0–100 sleep quality score
 */
const calcSleepQuality = (sleepHours, interruptions = 0, insomnia = false, energyLevel = 5) => {
  // Ideal sleep: 7–9 hours (score = 1 at 8 hrs)
  const sleepDurationScore = normalise(sleepHours, 0, 9);

  // Fewer interruptions = better (max 5+)
  const interruptionScore = clamp(1 - interruptions / 5, 0, 1);

  // Insomnia = 0, no insomnia = 1
  const insomniaFactor = insomnia ? 0 : 1;

  // Energy 0–10 → 0–1
  const energyFactor = normalise(energyLevel, 0, 10);

  const raw =
    0.4 * sleepDurationScore +
    0.2 * interruptionScore +
    0.2 * insomniaFactor +
    0.2 * energyFactor;

  return clamp(raw * 100);
};

// ─────────────────────────────────────────────────────────────
// 3. PELVIC INDEX
//    (0.35 × pain_factor +
//     0.25 × mobility_factor +
//     0.25 × week_factor +
//     0.15 × delivery_factor)
//    → range 0–1
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} painIntensity    - 0–10
 * @param {number} mobilityScore    - 0–10
 * @param {number} weeksPostpartum  - weeks since delivery
 * @param {string} deliveryMethod   - 'Normal' | 'C-section' | 'Assisted'
 * @returns {number}                - 0–1 pelvic resilience index
 */
const calcPelvicIndex = (
  painIntensity = 0,
  mobilityScore = 5,
  weeksPostpartum = 0,
  deliveryMethod = 'Normal'
) => {
  // Pain: lower is better (inverted)
  const painFactor = clamp(1 - painIntensity / 10, 0, 1);

  // Mobility: higher is better
  const mobilityFactor = normalise(mobilityScore, 0, 10);

  // Time since delivery: full recovery by 12 weeks
  const weekFactor = normalise(Math.min(weeksPostpartum, 12), 0, 12);

  // Delivery method factor: Normal = easier recovery
  const deliveryFactorMap = { Normal: 1, Assisted: 0.8, 'C-section': 0.6, Unknown: 0.7 };
  const deliveryFactor = deliveryFactorMap[deliveryMethod] ?? 0.7;

  const raw =
    0.35 * painFactor +
    0.25 * mobilityFactor +
    0.25 * weekFactor +
    0.15 * deliveryFactor;

  return clamp(raw, 0, 1);
};

// ─────────────────────────────────────────────────────────────
// 4. ACTIVITY LOAD
//    (6 × step_factor +
//     3 × workout_factor -
//     2 × fatigue_penalty)
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} dailySteps      - steps today
 * @param {number} workoutMinutes  - minutes of workout
 * @param {number} fatigueScore    - 0–10
 * @returns {number}               - clamped activity load score
 */
const calcActivityLoad = (dailySteps = 0, workoutMinutes = 0, fatigueScore = 0) => {
  // Ideal steps: 10,000 (for postpartum, 5,000 is good)
  const stepFactor = normalise(Math.min(dailySteps, 10000), 0, 10000);

  // Ideal workout: 30 min
  const workoutFactor = normalise(Math.min(workoutMinutes, 60), 0, 60);

  // Fatigue: high fatigue = penalty
  const fatiguePenalty = normalise(fatigueScore, 0, 10);

  const raw = 6 * stepFactor + 3 * workoutFactor - 2 * fatiguePenalty;

  return clamp(raw * 10, 0, 100); // scale to 0–100
};

// ─────────────────────────────────────────────────────────────
// 5. TISSUE RESTORATION
//    0.4 × sleep_quality +
//    0.3 × hydration_ratio +
//    0.3 × protein_score -
//    inflammation_penalty
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} sleepQuality        - 0–100
 * @param {number} hydrationRatio      - 0–100
 * @param {number} proteinIntakeGrams  - actual grams
 * @param {number} inflammationMarkers - 0–10
 * @param {number} weightKg            - for protein needs
 * @returns {number}                   - 0–100 tissue restoration score
 */
const calcTissueRestoration = (
  sleepQuality,
  hydrationRatio,
  proteinIntakeGrams = 0,
  inflammationMarkers = 0,
  weightKg = 60
) => {
  // Recommended protein: ~1.2g/kg for postpartum
  const recommendedProtein = weightKg * 1.2;
  const proteinScore = clamp((proteinIntakeGrams / recommendedProtein) * 100);

  // Inflammation penalty (0–10 → 0–20 point deduction)
  const inflammationPenalty = (inflammationMarkers / 10) * 20;

  const raw =
    0.4 * sleepQuality +
    0.3 * hydrationRatio +
    0.3 * proteinScore -
    inflammationPenalty;

  return clamp(raw);
};

// ─────────────────────────────────────────────────────────────
// 6. CORE ALIGNMENT
//    (0.4 × (1 - back_pain/10) +
//     0.3 × strength_score +
//     0.3 × posture_score) × 100
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} backPain          - 0–10
 * @param {number} coreStrengthScore - 0–10
 * @param {number} postureScore      - 0–10
 * @returns {number}                 - 0–100 core alignment score
 */
const calcCoreAlignment = (backPain = 0, coreStrengthScore = 5, postureScore = 5) => {
  const backFactor = clamp(1 - backPain / 10, 0, 1);
  const strengthFactor = normalise(coreStrengthScore, 0, 10);
  const postureFactor = normalise(postureScore, 0, 10);

  const raw =
    0.4 * backFactor +
    0.3 * strengthFactor +
    0.3 * postureFactor;

  return clamp(raw * 100);
};

// ─────────────────────────────────────────────────────────────
// 7. AFTERMA READINESS SCORE
//    (0.25 × tissue_restoration +
//     0.25 × pelvic_resilience +   ← pelvicIndex × 100
//     0.20 × core_alignment +
//     0.15 × sleep_quality +
//     0.15 × hydration_ratio)
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} tissueRestoration - 0–100
 * @param {number} pelvicIndex       - 0–1 (will × 100)
 * @param {number} coreAlignment     - 0–100
 * @param {number} sleepQuality      - 0–100
 * @param {number} hydrationRatio    - 0–100
 * @returns {number}                 - 0–100 overall readiness score
 */
const calcAftermaReadiness = (
  tissueRestoration,
  pelvicIndex,
  coreAlignment,
  sleepQuality,
  hydrationRatio
) => {
  const pelvicResilienceScore = pelvicIndex * 100;

  const raw =
    0.25 * tissueRestoration +
    0.25 * pelvicResilienceScore +
    0.20 * coreAlignment +
    0.15 * sleepQuality +
    0.15 * hydrationRatio;

  return clamp(raw);
};

// ─────────────────────────────────────────────────────────────
// 8. RISK CLASSIFICATION
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} readinessScore - 0–100
 * @returns {string}              - risk label
 */
const classifyRisk = (readinessScore) => {
  if (readinessScore >= 90) return 'Optimal';
  if (readinessScore >= 75) return 'Stable';
  if (readinessScore >= 60) return 'Moderate Risk';
  return 'High Risk';
};

// ─────────────────────────────────────────────────────────────
// 9. AI FLAGS GENERATOR
// ─────────────────────────────────────────────────────────────

/**
 * Generate intelligent AI alert flags from computed scores.
 * @param {object} scores - All computed scores
 * @returns {object}      - ai_flags and alerts array
 */
const generateAiFlags = (scores) => {
  const flags = {
    doctor_consultation_needed: false,
    hydration_improvement_suggested: false,
    rest_improvement_suggested: false,
    activity_warning: false,
    pain_alert: false,
    inflammation_alert: false,
  };

  const alerts = [];

  if (scores.afterma_readiness_score < 60) {
    flags.doctor_consultation_needed = true;
    alerts.push('High Risk detected: Please consult your doctor immediately.');
  }

  if (scores.hydration_ratio < 50) {
    flags.hydration_improvement_suggested = true;
    alerts.push('Low hydration detected. Aim to increase daily water intake.');
  }

  if (scores.sleep_quality < 40) {
    flags.rest_improvement_suggested = true;
    alerts.push('Poor sleep quality observed. Consider rest optimization strategies.');
  }

  if (scores.activity_load > 80) {
    flags.activity_warning = true;
    alerts.push('High activity level detected. Ensure adequate postpartum rest periods.');
  }

  if (scores.pain_intensity >= 7) {
    flags.pain_alert = true;
    flags.doctor_consultation_needed = true;
    alerts.push('Severe pain level reported. Medical attention is strongly advised.');
  }

  return { ai_flags: flags, alerts };
};

// ─────────────────────────────────────────────────────────────
// 10. MASTER HEALTH SUMMARY CALCULATOR
// ─────────────────────────────────────────────────────────────

/**
 * Calculate complete health summary from a daily log + user profile.
 *
 * @param {object} log  - DailyLog instance (raw input data)
 * @param {object} user - User instance (weight_kg, delivery_method, delivery_date, etc.)
 * @returns {object}    - Complete health summary payload
 */
const calculateHealthSummary = (log, user) => {
  // ── Derived context from user ──────────────────────────────────────
  const weightKg = user.weight_kg || 60;
  const deliveryMethod = user.delivery_method || 'Unknown';

  // Weeks since delivery
  let weeksPostpartum = 0;
  if (user.delivery_date) {
    const now = new Date();
    const delivery = new Date(user.delivery_date);
    weeksPostpartum = Math.floor((now - delivery) / (7 * 24 * 60 * 60 * 1000));
  }

  // ── Core Calculations ──────────────────────────────────────────────
  const hydration_ratio = calcHydrationRatio(log.water_liters, weightKg);

  const sleep_quality = calcSleepQuality(
    log.sleep_hours,
    log.sleep_interruptions,
    log.insomnia,
    log.energy_level
  );

  const pelvic_index = calcPelvicIndex(
    log.pain_intensity,
    log.mobility_score,
    weeksPostpartum,
    deliveryMethod
  );

  const activity_load = calcActivityLoad(
    log.daily_steps,
    log.workout_minutes,
    log.fatigue_score
  );

  // ── Restoration & Alignment ────────────────────────────────────────
  const tissue_restoration = calcTissueRestoration(
    sleep_quality,
    hydration_ratio,
    log.protein_intake_grams,
    log.inflammation_markers,
    weightKg
  );

  const core_alignment = calcCoreAlignment(
    log.back_pain,
    log.core_strength_score,
    log.posture_score
  );

  // Pelvic resilience = pelvic_index × 100
  const pelvic_resilience = clamp(pelvic_index * 100);

  // ── AFTERMA Readiness ──────────────────────────────────────────────
  const afterma_readiness_score = calcAftermaReadiness(
    tissue_restoration,
    pelvic_index,
    core_alignment,
    sleep_quality,
    hydration_ratio
  );

  const risk_level = classifyRisk(afterma_readiness_score);

  // ── Behavioral Patterns ────────────────────────────────────────────
  const hydration_adherence = hydration_ratio; // alias for readability
  const rest_efficiency = clamp(
    (sleep_quality * 0.6 + (1 - log.fatigue_score / 10) * 40)
  );

  // ── AI Flags ───────────────────────────────────────────────────────
  const { ai_flags, alerts } = generateAiFlags({
    afterma_readiness_score,
    hydration_ratio,
    sleep_quality,
    activity_load,
    pain_intensity: log.pain_intensity,
  });

  // ── Final Summary Object ───────────────────────────────────────────
  return {
    summary_date: log.log_date,
    core_metrics: {
      hydration_ratio: parseFloat(hydration_ratio.toFixed(2)),
      sleep_quality: parseFloat(sleep_quality.toFixed(2)),
      pelvic_index: parseFloat(pelvic_index.toFixed(4)),
      activity_load: parseFloat(activity_load.toFixed(2)),
    },
    readiness_indices: {
      tissue_restoration: parseFloat(tissue_restoration.toFixed(2)),
      pelvic_resilience: parseFloat(pelvic_resilience.toFixed(2)),
      core_alignment: parseFloat(core_alignment.toFixed(2)),
    },
    behavioral_patterns: {
      hydration_adherence: parseFloat(hydration_adherence.toFixed(2)),
      rest_efficiency: parseFloat(rest_efficiency.toFixed(2)),
    },
    pain_assessment: {
      pain_intensity: log.pain_intensity,
      cramps_severity: log.cramps_severity,
      pelvic_pressure: log.pelvic_pressure,
    },
    risk_assessment: {
      afterma_readiness_score: parseFloat(afterma_readiness_score.toFixed(2)),
      risk_level,
      alerts,
    },
    ai_flags,

    // ── DB-friendly flat fields ─────────────────────────────────────
    hydration_ratio: parseFloat(hydration_ratio.toFixed(2)),
    sleep_quality: parseFloat(sleep_quality.toFixed(2)),
    pelvic_index: parseFloat(pelvic_index.toFixed(4)),
    activity_load: parseFloat(activity_load.toFixed(2)),
    tissue_restoration: parseFloat(tissue_restoration.toFixed(2)),
    pelvic_resilience: parseFloat(pelvic_resilience.toFixed(2)),
    core_alignment: parseFloat(core_alignment.toFixed(2)),
    afterma_readiness_score: parseFloat(afterma_readiness_score.toFixed(2)),
    risk_level,
    pain_intensity: log.pain_intensity,
    cramps_severity: log.cramps_severity,
    pelvic_pressure: log.pelvic_pressure,
    hydration_adherence: parseFloat(hydration_adherence.toFixed(2)),
    rest_efficiency: parseFloat(rest_efficiency.toFixed(2)),
    alerts,
  };
};

// ─────────────────────────────────────────────────────────────
// PREDICT PERIOD & OVULATION CALENDAR
// ─────────────────────────────────────────────────────────────

/**
 * Predict next period and ovulation dates based on user cycle data.
 *
 * @param {string} lastPeriodDate     - YYYY-MM-DD
 * @param {number} cycleLength        - days
 * @param {number} periodDuration     - days
 * @param {number} monthsAhead        - how many future cycles to predict
 * @returns {object[]}                - array of calendar events
 */
const predictCycleCalendar = (
  lastPeriodDate,
  cycleLength = 28,
  periodDuration = 5,
  monthsAhead = 3
) => {
  if (!lastPeriodDate) return [];

  const events = [];
  const start = new Date(lastPeriodDate);
  const totalCycles = Math.ceil((monthsAhead * 30) / cycleLength) + 1;

  for (let i = 1; i <= totalCycles; i++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + i * cycleLength);

    // Period window
    const periodEnd = new Date(cycleStart);
    periodEnd.setDate(periodEnd.getDate() + periodDuration - 1);

    // Ovulation: typically day 14 for 28-day cycle (cycle_length - 14)
    const ovulationOffset = cycleLength - 14;
    const ovulationDate = new Date(cycleStart);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationOffset);

    // Fertile window: 5 days before ovulation to 1 day after
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    events.push({
      event_type: 'period_start',
      event_date: cycleStart.toISOString().split('T')[0],
      title: `Period Day 1`,
      is_confirmed: false,
      color_tag: '#E91E63',
    });

    events.push({
      event_type: 'period_end',
      event_date: periodEnd.toISOString().split('T')[0],
      title: `Period End`,
      is_confirmed: false,
      color_tag: '#E91E63',
    });

    events.push({
      event_type: 'ovulation',
      event_date: ovulationDate.toISOString().split('T')[0],
      title: `Ovulation Day`,
      is_ovulation_predicted: true,
      is_confirmed: false,
      color_tag: '#9C27B0',
    });

    // Fertile window days
    for (
      let d = new Date(fertileStart);
      d <= fertileEnd;
      d.setDate(d.getDate() + 1)
    ) {
      events.push({
        event_type: 'fertile_window',
        event_date: new Date(d).toISOString().split('T')[0],
        title: 'Fertile Window',
        is_fertile_window: true,
        is_confirmed: false,
        color_tag: '#4CAF50',
      });
    }
  }

  return events;
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  calculateHealthSummary,
  predictCycleCalendar,
  // Individual calculators (useful for testing)
  calcHydrationRatio,
  calcSleepQuality,
  calcPelvicIndex,
  calcActivityLoad,
  calcTissueRestoration,
  calcCoreAlignment,
  calcAftermaReadiness,
  classifyRisk,
  generateAiFlags,
  clamp,
};
