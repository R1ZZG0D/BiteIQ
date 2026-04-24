# Food Intelligence App

Cross-platform MVP for scanning food labels, classifying dietary suitability, and tracking daily sugar/protein intake. The implementation follows `SKILLS.md` with a React Native-first Expo app and a modular Node/Express backend.

## What It Includes

- Camera/image OCR endpoint using Tesseract.
- Ingredient cleanup, parsing, normalization, and knowledge-base matching.
- Classification into Vegan, Vegetarian, Eggetarian, Non-Vegetarian, or Uncertain.
- Problem ingredient explanations and alternative suggestions.
- Daily sugar and protein goals, progress summaries, warnings, and product history.
- PostgreSQL-ready persistence with a local JSON fallback for hackathon development.
- OpenFoodFacts barcode lookup endpoint for product ingredients and nutrition values.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev:backend
```

In a second terminal:

```bash
npm run dev:mobile
```

The API runs on `http://localhost:4000/api` and the Expo web app runs on `http://localhost:8081`.

For a physical mobile device, set `EXPO_PUBLIC_API_URL` to your machine's LAN address, for example:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api npm run dev:mobile
```

The mobile app is pinned to Expo SDK 54 so it works with the current App Store Expo Go app during the SDK 55 transition window.

## PostgreSQL

Set `DATABASE_URL` in `.env` to use PostgreSQL. Without it, the backend writes local development data to `.data/food-intelligence.json`.

```bash
DATABASE_URL=postgres://user:password@localhost:5432/food_intelligence
```

The backend applies `backend/db/schema.sql` automatically on startup.

## API Highlights

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/summary`
- `GET /api/history`
- `POST /api/scan/text`
- `POST /api/scan/image`
- `POST /api/scan/barcode`
- `GET /api/ingredients`

## Scanner Notes

The mobile app supports camera capture, image upload, manual OCR text entry, and barcode lookup. Manual text entry is useful for repeatable testing; camera/image flows use the same backend classification pipeline after OCR.
