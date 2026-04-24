# SKILLS.md – BiteIQ (Vegan/Vegetarian Scanner + Nutrition Tracker)

## Project Overview
Build a cross-platform mobile application (iOS, Android, Web-ready) that allows users to:

1. Scan food ingredient labels using the camera
2. Classify food into:
   - Vegan
   - Vegetarian
   - Eggetarian
   - Non-Vegetarian
3. Identify specific ingredients responsible for classification
4. Track daily intake of:
   - Sugar
   - Protein
5. Provide insights on whether the user is within or exceeding daily intake limits

The app should be modern, fast, visually clean, and intuitive.

---

## Core Functional Requirements

### 1. Ingredient Scanning (Camera + OCR)
- Use device camera to capture ingredient label
- Extract text using OCR
- Clean and normalize extracted text
- Parse ingredient list into structured format

#### Expected Flow:
Camera → OCR → Raw Text → Parsed Ingredients → Classification

---

### 2. Ingredient Parsing System
- Split ingredients by commas and common delimiters
- Normalize ingredient names (e.g., “whey powder” → “whey”)
- Handle edge cases:
  - “natural flavors”
  - “mono- and diglycerides”
  - “lecithin”

---

### 3. Ingredient Knowledge Base
Create a structured database:

Table: ingredients
- id
- name
- category (dairy, meat, additive, plant, etc.)
- source_type (plant / animal / ambiguous)
- notes

Examples:
- whey → animal (dairy)
- gelatin → animal
- soy lecithin → plant
- lecithin → ambiguous

---

### 4. Classification Engine

#### Logic Rules:
- Vegan: No animal-derived ingredients
- Vegetarian: Allows dairy, no eggs/meat/fish
- Eggetarian: Allows eggs + vegetarian
- Non-Vegetarian: Contains meat/fish

#### Output:
- classification_label
- confidence_score (simple heuristic-based)
- flagged_ingredients (list of problematic ingredients)

---

### 5. Explanation Layer
Return meaningful output:
- “Not Vegan because it contains Whey (milk-derived)”
- “Vegetarian but not Vegan due to Dairy”

---

### 6. User Dietary Preference Selection
Allow user to select:
- Vegan
- Vegetarian
- Eggetarian
- Non-Vegetarian

App should validate scanned food against user preference.

---

### 7. Nutrition Tracking

#### User Inputs:
- Daily sugar goal (grams)
- Daily protein goal (grams)

#### From Scan:
- Estimate sugar & protein (via database/API)

#### Tracking:
- Maintain daily totals
- Show:
  - % of daily intake used
  - Warning if exceeding

---

### 8. Product History
- Store scanned items
- Show past scans
- Allow re-checking items

---

### 9. Alerts & Warnings
- High sugar warning
- High protein warning (if exceeding goal)
- Ingredient-based warnings

---

### 10. Alternative Suggestions
If item is not suitable:
- Suggest alternative products (mock or API-based)
Example:
- “Try plant-based milk alternative”

---

## UI/UX Requirements

### Design Principles
- Clean, minimal, modern (inspired by Apple Health / MyFitnessPal)
- Use soft colors and clear typography
- Avoid clutter
- Focus on readability

---

### Screens

#### 1. Onboarding Screen
- Select dietary preference
- Input daily sugar & protein goals

#### 2. Home Screen
- Scan button (primary CTA)
- Daily intake progress (progress bars)
- Quick summary:
  - Sugar consumed
  - Protein consumed

#### 3. Camera Screen
- Live camera preview
- Capture button
- Overlay guide for scanning labels

#### 4. Result Screen
Show:
- Classification (Vegan / etc.)
- Confidence score
- Ingredient breakdown
- Highlight problematic ingredients
- Nutrition estimate

#### 5. History Screen
- List of scanned products
- Tap to view details

#### 6. Profile Screen
- Edit goals
- Change dietary preference

---

### UI Enhancements
- Smooth animations
- Progress bars for nutrition
- Color coding:
  - Green = safe
  - Yellow = caution
  - Red = not suitable

---

## Technical Stack

### Frontend
- React Native (preferred)
- Alternatively Flutter

### Backend
- FastAPI (Python) or Node.js (Express)

### Database
- PostgreSQL (main DB)
- Redis (optional caching)

### OCR
- Google ML Kit (on-device preferred)
- Fallback: Tesseract or AWS Textract

### APIs
- OpenFoodFacts API (for product + nutrition data)

---

## Backend Architecture

### Services

1. OCR Service
2. Ingredient Parser Service
3. Classification Service
4. Nutrition Service
5. User Profile Service

---

## Data Flow

1. User scans image
2. OCR extracts text
3. Backend parses ingredients
4. Ingredients matched with database
5. Classification logic applied
6. Nutrition estimated
7. Results returned to frontend

---

## Edge Case Handling

- Missing ingredients list
- OCR errors
- Unknown ingredients
- Ambiguous ingredients

Fallback:
- Mark as “Uncertain”
- Show partial results

---

## Performance Considerations

- Use local OCR for speed
- Cache ingredient lookups
- Optimize API calls

---

## Security Considerations

- Secure API endpoints
- Validate all inputs
- Prevent injection attacks in parsing

---

## Deliverables

- Fully functional mobile app
- Clean UI with modern UX
- Working OCR + classification pipeline
- Nutrition tracking system
- Modular backend

---

## Coding Guidelines

- Modular code structure
- Clear separation of concerns
- Use environment variables for configs
- Write reusable components

---

## Stretch Goals (Optional but Implementable Later)

- Barcode scanning support
- Weekly nutrition analytics
- Cloud sync for user data
- Social sharing of results

---

## Final Goal

Build a production-ready MVP that:
- Works reliably on real-world food labels
- Provides accurate dietary classification
- Helps users make better food decisions
- Feels like a modern, polished app
