/**
 * Cardio activity catalogue — grouped by category.
 * Edit freely; the cardio page renders one `<optgroup>` per key.
 */

export const ACTIVITIES: Record<string, string[]> = {
  Run: [
    "Running",
    "Treadmill Run",
    "Trail Run",
    "Sprint Intervals",
    "Jogging",
  ],
  Ride: [
    "Cycling",
    "Indoor Cycling",
    "Mountain Biking",
    "Road Bike",
    "Stationary Bike",
  ],
  Walk: [
    "Walking",
    "Treadmill Walk",
    "Hiking",
    "Power Walk",
  ],
  Swim: [
    "Swimming",
    "Pool Lap Swim",
    "Open Water Swim",
    "Water Jogging",
  ],
  HIIT: [
    "HIIT Session",
    "Tabata",
    "CrossFit WOD",
    "Burpees",
    "Jump Rope",
    "Kettlebell Circuit",
  ],
  Machine: [
    "Stair Climber",
    "Rowing Machine",
    "Elliptical",
    "Arc Trainer",
    "Rower",
  ],
  Sport: [
    "Basketball",
    "Soccer",
    "Tennis",
    "Badminton",
    "Volleyball",
    "Boxing",
    "Kickboxing",
    "Muay Thai",
    "Martial Arts",
    "Dance",
    "Yoga Flow",
  ],
  Mobility: [
    "Yoga",
    "Stretching",
    "Foam Rolling",
    "Mobility Flow",
    "Pilates",
    "Tai Chi",
    "Cat-Cow Flow",
  ],
};

export const ACTIVITY_CATEGORIES: string[] = Object.keys(ACTIVITIES);

export const INTENSITIES = ["easy", "moderate", "hard", "max"] as const;
export type Intensity = (typeof INTENSITIES)[number];

/** Sentinel value used in `<option>` to mean "show the inline custom input". */
export const NOT_LISTED = "__not_listed__";
