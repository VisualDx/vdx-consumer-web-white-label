# VisualDx White-Label Consumer Skin Condition Finder

## Overview
A white-label, consumer-facing web app modeled after Aysa, streamlined to reduce steps required to generate a differential diagnosis (DDx).
Mobile-first, simple UI, easily skinnable.

⚠️ Not a diagnostic tool. For informational use only.

---

## Main User Flow

Home → Summary → Differential Results (DDx) → Diagnosis Details

- Back button returns to previous screens
- Modals (lesion, location, image upload) are launched from Summary
- Closing a modal returns to Summary

---

## Screens & Behavior

### 1. Home
- Logo (white-label)
- Title: “Get an instant skin analysis”
- Disclaimer text
- CTA: “Start your skin analysis →”
- Action: Navigate to Summary

---

### 2. Summary Page (Core)
Main data input screen.

#### Inputs
- Age (dropdown)
- Sex (dropdown)
- Timing (auto-adjust by age)
- Skin type (toggle, default: light)
- Fever / Itch (optional checkboxes)

#### Modal-driven inputs
- Lesion selector
- Location selector
- Image upload

#### Behavior
- “Show possible conditions” button:
    - Disabled until required inputs are filled
    - On click → call `/api/differential`
    - Navigate to DDx page

---

### 3. Lesion Selector
Modal with 2 options:
- Take a Skin Picture → upload → analyze (`/api/analyze-image`)
- Select a Skin Lesion → manual selection

Behavior:
- Show loading during processing
- Handle API errors
- After selection → return to Summary
- Selected lesion is displayed with icon + name

---

### 4. Location Selector
Modal with 3 options:
- Single lesion
- Limited area (multiple lesions)
- Widespread

Behavior:
- Body picker for location
- Must select at least 1 area
- “Done” enables after selection
- Return to Summary and display selected info

---

### 5. Differential Results (DDx)
- Fetch from `/api/differential`
- Show list of possible diagnoses
- Each item:
    - Image
    - Diagnosis name
- Click → navigate to Diagnosis Details

---

### 6. Diagnosis Details
- Fetch from `/api/diagnosis/[id]`
- Display:
    - Images (carousel)
    - Sections of content (text)

---

## Architecture

### Frontend
- Next.js
- React

### API Routes
- `/api/analyze-image`
- `/api/differential`
- `/api/diagnosis/[id]`
- `/api/images/*`
- `/api/auth/*`

---

## Key Features
- Image-based analysis
- Symptom-based DDx
- Modal-driven UX
- White-label support

---

## Setup
### 1. Install dependencies
```bash
npm install
```
### 2. Environment Setup
Create a local environment file from the template:
```bash
cp .env.template .env
```
Update all required environment variables in .env.local before running the app.

Typical values to configure:

API endpoints (e.g. base URL)
Auth credentials / tokens
Any integration-specific settings

Refer to .env.template for required variables.

### 3. Run locally
```bash
npm run dev
```
Open:
http://localhost:3000

---

## Production build
```bash
npm run build
npm run start
```
