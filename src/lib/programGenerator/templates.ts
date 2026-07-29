import type { ProgramTemplate, TemplateDay } from './types'

const REST: TemplateDay = { type: 'rest' }

/**
 * Fixed, literature-named templates per weekly training frequency — hardcoded
 * data, not algorithmically generated. Each cites the system it's taken from;
 * see wetenschappelijk-bronnenoverzicht.md. The equipment substitution layer
 * (catalog.ts) resolves each exercise's patternId to a concrete exercise name
 * — there is no separate "dumbbell program" or "bodyweight program".
 */
export const TEMPLATES: Record<number, ProgramTemplate> = {
  1: {
    daysPerWeek: 1,
    name: 'High-Intensity Full Body (HIT)',
    source: 'McGuff & Little, "Body by Science"',
    disclaimer:
      'Minder mainstream-erkende aanpak dan de andere templates, maar onderzocht en geschikt ' +
      'als je echt maar 1x per week kunt of wilt trainen.',
    week: [
      {
        type: 'training',
        label: 'Full Body (HIT)',
        kind: 'hit',
        exercises: [
          { patternId: 'quad-squat', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo (~4 tellen omlaag, 4 omhoog).' },
          { patternId: 'chest-press', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo.' },
          { patternId: 'back-row', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo.' },
          { patternId: 'shoulder-press', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo.' },
          { patternId: 'hamstring-hinge', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo.' },
          { patternId: 'back-vertical-pull', sets: 1, reps: '8-12', restSeconds: '90-120', note: 'Tot spierfalen, langzaam tempo.' },
          { patternId: 'calf-raise', sets: 1, reps: '12-15', restSeconds: '90', note: 'Tot spierfalen, langzaam tempo.' },
        ],
      },
      REST, REST, REST, REST, REST, REST,
    ],
  },

  2: {
    daysPerWeek: 2,
    name: 'Full Body A/B',
    source: 'Schoenfeld, Ogborn & Krieger (2016) — frequentie-evidentie',
    week: [
      {
        type: 'training',
        label: 'Full Body A',
        kind: 'standard',
        exercises: [
          { patternId: 'quad-squat', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'chest-press', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'back-row', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'shoulder-lateral', sets: 3, reps: '10-15', restSeconds: '60-90' },
          { patternId: 'core-anti-extension', sets: 3, reps: '10-15', restSeconds: '60-90' },
        ],
      },
      REST, REST,
      {
        type: 'training',
        label: 'Full Body B',
        kind: 'standard',
        exercises: [
          { patternId: 'hamstring-hinge', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'shoulder-press', sets: 3, reps: '6-10', restSeconds: '120-180' },
          { patternId: 'biceps-curl', sets: 3, reps: '10-15', restSeconds: '60-90' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-15', restSeconds: '60-90' },
        ],
      },
      REST, REST, REST,
    ],
  },

  3: {
    daysPerWeek: 3,
    name: 'Full Body A/B/C (5×5)',
    source: 'StrongLifts 5×5 / Starting Strength — klassieke lineaire-progressie-aanpak voor beginners',
    week: [
      {
        type: 'training',
        label: 'Workout A',
        kind: 'standard',
        exercises: [
          { patternId: 'quad-squat', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'chest-press', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'back-row', sets: 5, reps: '5', restSeconds: '120-180' },
        ],
      },
      REST,
      {
        type: 'training',
        label: 'Workout B',
        kind: 'standard',
        exercises: [
          { patternId: 'quad-squat', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'shoulder-press', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'hamstring-hinge', sets: 1, reps: '5', restSeconds: '180', note: 'Eén zwaar werkset na opbouwsets, klassiek voor de deadlift in dit systeem.' },
        ],
      },
      REST,
      {
        type: 'training',
        label: 'Workout A',
        kind: 'standard',
        exercises: [
          { patternId: 'quad-squat', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'chest-press', sets: 5, reps: '5', restSeconds: '120-180' },
          { patternId: 'back-row', sets: 5, reps: '5', restSeconds: '120-180' },
        ],
      },
      REST, REST,
    ],
  },

  4: {
    daysPerWeek: 4,
    name: 'PHUL (Power Hypertrophy Upper Lower)',
    source: 'PHUL — Power Hypertrophy Upper Lower',
    week: [
      {
        type: 'training',
        label: 'Upper Power',
        kind: 'power',
        exercises: [
          { patternId: 'chest-press', sets: 4, reps: '4-6', restSeconds: '150-180' },
          { patternId: 'back-row', sets: 4, reps: '4-6', restSeconds: '150-180' },
          { patternId: 'shoulder-press', sets: 3, reps: '5-8', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '6-10', restSeconds: '90' },
        ],
      },
      {
        type: 'training',
        label: 'Lower Power',
        kind: 'power',
        exercises: [
          { patternId: 'quad-squat', sets: 4, reps: '4-6', restSeconds: '150-180' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '5-8', restSeconds: '120' },
          { patternId: 'calf-raise', sets: 4, reps: '8-10', restSeconds: '60' },
        ],
      },
      REST,
      {
        type: 'training',
        label: 'Upper Hypertrophy',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-incline', sets: 4, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'back-row', sets: 4, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'shoulder-lateral', sets: 3, reps: '12-15', restSeconds: '60' },
          { patternId: 'biceps-curl', sets: 3, reps: '8-12', restSeconds: '60' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '8-12', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Lower Hypertrophy',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-lunge', sets: 3, reps: '10-12', restSeconds: '60-90' },
          { patternId: 'hamstring-curl', sets: 3, reps: '10-15', restSeconds: '60' },
          { patternId: 'glute-bridge', sets: 3, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'calf-raise', sets: 3, reps: '12-15', restSeconds: '60' },
        ],
      },
      REST, REST,
    ],
  },

  5: {
    daysPerWeek: 5,
    name: 'PHAT (Power Hypertrophy Adaptive Training)',
    source: 'PHAT — Power Hypertrophy Adaptive Training (Layne Norton)',
    week: [
      {
        type: 'training',
        label: 'Upper Power',
        kind: 'power',
        exercises: [
          { patternId: 'chest-press', sets: 3, reps: '3-5', restSeconds: '150-180' },
          { patternId: 'back-row', sets: 3, reps: '3-5', restSeconds: '150-180' },
          { patternId: 'shoulder-press', sets: 3, reps: '5-8', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 2, reps: '6-10', restSeconds: '90' },
        ],
      },
      {
        type: 'training',
        label: 'Lower Power',
        kind: 'power',
        exercises: [
          { patternId: 'quad-squat', sets: 3, reps: '3-5', restSeconds: '180' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '5-8', restSeconds: '120' },
        ],
      },
      REST,
      {
        type: 'training',
        label: 'Rug & Schouders (Hypertrofie)',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'back-row', sets: 3, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '10-15', restSeconds: '60' },
          { patternId: 'shoulder-lateral', sets: 4, reps: '12-15', restSeconds: '60' },
          { patternId: 'biceps-curl', sets: 3, reps: '8-12', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Benen (Hypertrofie)',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-lunge', sets: 4, reps: '10-12', restSeconds: '60-90' },
          { patternId: 'hamstring-curl', sets: 3, reps: '10-15', restSeconds: '60' },
          { patternId: 'glute-bridge', sets: 3, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'calf-raise', sets: 4, reps: '12-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Borst & Armen (Hypertrofie)',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-press', sets: 3, reps: '8-12', restSeconds: '60-90' },
          { patternId: 'chest-incline', sets: 3, reps: '10-15', restSeconds: '60' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-12', restSeconds: '60' },
          { patternId: 'triceps-dip', sets: 3, reps: '8-12', restSeconds: '60' },
          { patternId: 'biceps-hammer', sets: 3, reps: '10-12', restSeconds: '60' },
        ],
      },
      REST,
    ],
  },

  6: {
    daysPerWeek: 6,
    name: 'Push/Pull/Legs ×2',
    source: 'Schoenfeld, Ogborn & Krieger (2016) — meest geciteerde 6-dagen-structuur',
    week: [
      {
        type: 'training',
        label: 'Push',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-press', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'shoulder-press', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Pull',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'back-row', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'biceps-curl', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Legs',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-squat', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'calf-raise', sets: 3, reps: '12-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Push',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-press', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'shoulder-press', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Pull',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'back-row', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'biceps-curl', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Legs',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-squat', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'calf-raise', sets: 3, reps: '12-15', restSeconds: '60' },
        ],
      },
      REST,
    ],
  },

  7: {
    daysPerWeek: 7,
    name: 'Push/Pull/Legs ×2 + actieve hersteldag',
    source: 'Schoenfeld, Ogborn & Krieger (2016) — meest geciteerde 6-dagen-structuur, aangevuld met een hersteldag',
    disclaimer:
      '7 dagen betekent hier 6 harde trainingsdagen + 1 actieve hersteldag — geen 7 volwaardige ' +
      'zware sessies. Een week zonder enige vorm van rust wordt in de literatuur afgeraden.',
    week: [
      {
        type: 'training',
        label: 'Push',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-press', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'shoulder-press', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Pull',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'back-row', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'biceps-curl', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Legs',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-squat', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'calf-raise', sets: 3, reps: '12-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Push',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'chest-press', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'shoulder-press', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'triceps-pushdown', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Pull',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'back-row', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'back-vertical-pull', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'biceps-curl', sets: 3, reps: '10-15', restSeconds: '60' },
        ],
      },
      {
        type: 'training',
        label: 'Legs',
        kind: 'hypertrophy',
        exercises: [
          { patternId: 'quad-squat', sets: 4, reps: '6-10', restSeconds: '120' },
          { patternId: 'hamstring-hinge', sets: 3, reps: '8-10', restSeconds: '90' },
          { patternId: 'calf-raise', sets: 3, reps: '12-15', restSeconds: '60' },
        ],
      },
      {
        type: 'active_recovery',
        description:
          'Geen zware training. Lichte mobiliteit, een wandeling, of rustige zone 2 cardio ' +
          '(bv. 20-30 min fietsen/wandelen). Dit is een hersteldag, geen 7e trainingsdag.',
      },
    ],
  },
}

export function getTemplate(daysPerWeek: number): ProgramTemplate {
  const template = TEMPLATES[daysPerWeek]
  if (!template) {
    throw new Error(`No template defined for ${daysPerWeek} days/week`)
  }
  return template
}
