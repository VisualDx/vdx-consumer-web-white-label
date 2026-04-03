// src/constants/visualdxOptions.js

// ===== AGE (demographic, ID number) =====
export const AGE_OPTIONS = [
  { id: 0, label: "< 1 month old" },           // neonatal
  { id: 1, label: "1–23 months old" },
  { id: 2, label: "2–12 years old" },
  { id: 3, label: "13–19 years old" },
  { id: 4, label: "20–29 years old" },
  { id: 5, label: "30–39 years old" },
  { id: 6, label: "40–49 years old" },
  { id: 7, label: "50–59 years old" },
  { id: 8, label: "60–69 years old" },
  { id: 9, label: "70–79 years old" },
  { id: 10, label: "80+ years old" },
];

// ===== SEX =====
export const SEX_OPTIONS = [
  { id: "M", label: "Male" },
  { id: "F", label: "Female" },
];

// ===== PATIENT QUESTIONS (from GuidedSkinWorkupDataHydrate) =====
export const PATIENT_QUESTIONS = {
  onset: [
    {
      id: 24363,
      label: "Rapid (minutes to hours)",
    },
    {
      id: 24364,
      label: "Acute (days to weeks)",
    },
    {
      id: 25942,
      label: "Chronic (months to years)",
    },
    {
      id: 24366,
      label: "Recurrent",
    },
    {
      id: 24157,
      label: "Present at birth",
    },
  ],

  itch: {
    id: 20080,
    label: "Does it itch?",
  },

  fever: {
    id: 20002,
    label: "Do you have a fever?",
  },
};


