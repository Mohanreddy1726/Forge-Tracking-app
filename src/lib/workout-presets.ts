/**
 * Common workout split names — the default list shown in the dropdown on
 * /workouts. Users can still pick "Not listed" to enter a custom name.
 */

export const WORKOUT_PRESETS: string[] = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Push Pull Legs",
  "Bro Split",
  "Cardio Day",
  "Mobility Day",
];

/** Sentinel value used in `<option>` to mean "show the inline custom input". */
export const NOT_LISTED = "__not_listed__";
