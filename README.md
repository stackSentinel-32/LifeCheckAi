# LifeCheck AI

> Real-time environmental safety intelligence for Indian cities.

LifeCheck AI combines air quality, weather, pollen, UV, and water-quality
signals into one practical safety view. It is designed to answer a simple
question: **is it safe for me to go outside or use water in this location
right now?**

The project contains a Next.js web application, a FastAPI API, a
scikit-learn water-quality model, and an optional SpaceTimeDB module for
shared city snapshots and real-time features.

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Technology](#technology)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Water-quality model](#water-quality-model)
- [Deployment](#deployment)
- [Validation](#validation)
- [Limitations](#limitations)
- [Contributing](#contributing)

## What it does

### Environmental safety

- Fetches air-quality data and pollutant details from the Google Air Quality
  API.
- Fetches temperature, humidity, UV, wind, and weather conditions from
  Open-Meteo.
- Uses Google geocoding for Indian-city lookup, coordinate resolution, and
  location suggestions.
- Adds pollen information when the Google Pollen API has coverage.
- Applies shared safety rules to produce `safe`, `caution`, or `unsafe`
  guidance and a composite score.
- Returns partial-data and synchronization status explicitly instead of
  silently presenting a nominal score.

### Water quality

- Reads the included CPCB water-quality CSV datasets from 2016–2022 and
  2024.
- Selects monitoring stations by state, station, location, or coordinates.
- Predicts water-quality classes with the bundled Random Forest pipeline.
- Reports confidence, parameter status, recommendations, trends, nearby
  insights, and model metrics.
- Provides optional AI analysis of water-quality results.

### AI assistant

- Answers questions about air, weather, water, pollen, and environmental
  safety.
- Extracts intent and location from natural-language questions.
- Applies safety guardrails and critical-condition overrides before using an
  LLM.
- Supports normal JSON responses and Server-Sent Events (SSE) streaming.
- Uses the configured provider chain: Gemini, then OpenAI-compatible Groq
  and DeepSeek fallbacks when configured.

### Maps, alerts, and real-time activity

- Risk-map view with Google Maps and safety markers.
- Live cached city snapshots and historical safety records.
- In-memory presence, activity, crowd reports, and report upvotes.
- Shared alerts backed by SpaceTimeDB when the optional module is configured.
- Optional browser voice briefings through ElevenLabs.

## Architecture

```text
┌──────────────────────────────┐
│ Next.js 16 + React 19        │
│ Landing · Dashboard · Water  │
│ Map · Chat · Alerts          │
└───────────────┬──────────────┘
                │ REST / SSE
┌───────────────▼──────────────┐
│ FastAPI application          │
│ safety · chat · water        │
│ alerts · history · realtime  │
└───────┬──────────┬───────────┘
        │          │
        │          ├── Google Air Quality, Geocoding, Pollen
        │          ├── Open-Meteo weather
        │          └── CPCB CSV datasets + scikit-learn model
        │
        └── SpaceTimeDB REST API (optional)
            Rust/WebAssembly module in lifecheck-sbt/server
```

The backend keeps a small runtime cache for fast reads. When
`SPACETIMEDB_HOST` is configured, city snapshots and shared alerts are
persisted through SpaceTimeDB. Without it, the backend still serves the
weather, air-quality, pollen, chat, and water features, while persistence
and shared real-time synchronization are unavailable.

## Repository layout

```text
LifeCheckAi/
├── README.md
├── render.yaml                         # Render backend deployment
├── lifecheckai/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py                 # FastAPI application
│   │   │   ├── config.py               # Environment configuration
│   │   │   ├── models/                 # Pydantic response/request models
│   │   │   ├── routes/                 # API route modules
│   │   │   ├── services/               # External APIs, DB, ML, scheduler
│   │   │   └── utils/                  # Rules, parsing, prompts, guards
│   │   ├── data/                       # CPCB water-quality CSV files
│   │   ├── model/                      # Serialized water model artifacts
│   │   ├── models/                     # Additional serialized model
│   │   ├── requirements.txt
│   │   └── train_pipeline.py
│   ├── frontend/
│   │   ├── app/                        # Next.js routes/pages
│   │   ├── components/                 # Reusable feature and UI components
│   │   ├── hooks/                      # Client hooks and data queries
│   │   ├── lib/                        # API, voice, realtime utilities
│   │   ├── public/
│   │   └── package.json
│   └── screenshots/
└── lifecheck-sbt/
    └── server/                         # Rust SpaceTimeDB module
        ├── src/lib.rs
        └── Cargo.toml
```

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16.2, React 19.2, TypeScript, Tailwind CSS |
| UI and state | Framer Motion, Radix UI, Zustand, Lucide React |
| Charts | Recharts, Chart.js, react-chartjs-2 |
| API | FastAPI, Pydantic 2, Uvicorn, Gunicorn |
| Data and ML | pandas, NumPy, scikit-learn, joblib |
| External data | Google APIs, Open-Meteo, CPCB datasets |
| AI | Gemini, Groq-compatible API, DeepSeek-compatible API |
| Persistence/realtime | SpaceTimeDB 2.1, Rust 2021, WebAssembly |

## Requirements

- Node.js 20 or newer.
- Python 3.11 or newer. Render is configured for Python 3.11.9.
- Rust and Cargo only when building the SpaceTimeDB module.
- API keys for the integrations you want to enable.
- A Google Maps browser key for the map page.

## Run locally

The Python package imports use the repository root as the module root. Start
the backend from `LifeCheckAi/`, not from inside `lifecheckai/backend/`.

### 1. Configure the backend

```bash
cd lifecheckai/backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create `lifecheckai/backend/.env` using the variables in the table below.

### 2. Start the backend

From the repository root:

```bash
uvicorn lifecheckai.backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. Interactive OpenAPI docs
are available at `http://localhost:8000/docs`, and the health endpoint is
`http://localhost:8000/health`.

### 3. Start the frontend

In a second terminal:

```bash
cd lifecheckai/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend defaults to `http://127.0.0.1:8000` for API requests. Set
`NEXT_PUBLIC_API_BASE_URL` when the backend runs elsewhere.

### 4. Optional SpaceTimeDB module

Build the Rust module when SpaceTimeDB persistence or shared alerts are
needed:

```bash
cd lifecheck-sbt/server
cargo build --release
```

Publish it with the SpaceTimeDB CLI for your deployment:

```bash
spacetimedb publish --server <server-url> lifecheck
```

Set the resulting host and database name in the backend environment.

## Environment variables

### Backend: `lifecheckai/backend/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GOOGLE_API_KEY` | Recommended | — | Google Air Quality, Geocoding, and Pollen APIs |
| `GEMINI_API_KEY` | Recommended | Falls back to `GOOGLE_API_KEY` | Gemini chat provider |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name |
| `GROQ_API_KEY` | No | — | Groq/OpenAI-compatible chat fallback |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | Groq model name |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek chat fallback |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | DeepSeek model name |
| `SPACETIMEDB_HOST` | No | — | SpaceTimeDB base host |
| `SPACETIMEDB_DB_NAME` | No | `lifecheck` | SpaceTimeDB database/module name |
| `ENABLE_SCHEDULER` | No | `true` | Enable background city refresh |
| `SCHEDULER_INTERVAL_SECONDS` | No | `300` | Scheduler refresh interval |
| `SCHEDULER_CITIES` | No | `Delhi,Mumbai,Bangalore,Chennai` | Comma-separated warm-cache cities |
| `ALLOWED_ORIGINS` | No | localhost and production app | Comma-separated CORS origins |
| `GEOCODING_COUNTRY` | No | `IN` | Geocoding country restriction |
| `GEOCODING_REGION` | No | `in` | Geocoding region bias |

At least one Google/Gemini key is needed for the corresponding live and AI
features. The water model uses the checked-in data and artifacts locally.

### Frontend: `lifecheckai/frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_maps_key
NEXT_PUBLIC_SPACETIMEDB_HOST=your_spacetimedb_host
NEXT_PUBLIC_SPACETIMEDB_DB_NAME=lifecheck
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id
```

`NEXT_PUBLIC_API_URL` is supported by some existing client utilities;
`NEXT_PUBLIC_API_BASE_URL` is the preferred setting. Maps and voice features
are optional.

## API overview

All routes are GET unless stated otherwise. Use `/docs` for complete
parameters and response schemas.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Backend health and scheduler status |
| GET | `/api/check-safety?city=Delhi` | City safety snapshot |
| GET | `/api/check-safety-by-coordinates?lat=...&lon=...` | Coordinate safety snapshot |
| GET | `/api/cities/live` | Cached city snapshots |
| GET | `/api/location-suggestions?q=del` | Location autocomplete |
| GET | `/ask?query=...` or `/api/ask?query=...` | Structured AI answer |
| GET | `/ask/stream?query=...` or `/api/ask/stream?query=...` | SSE chat response |
| GET | `/api/safety-rules` | Active frontend/backend safety thresholds |
| GET | `/api/water/states` | Available water-quality states |
| GET | `/api/water/stations?state=...` | Stations for a state |
| GET | `/api/water/predict?...` | Water-quality prediction |
| GET | `/api/water/trends?...` | Station/year trend data |
| GET | `/api/water/nearby?lat=...&lon=...` | Nearby water insights |
| GET | `/api/water/model-metrics` | Model metadata and metrics |
| GET | `/api/water/analyze?...` | Detailed water analysis |
| GET | `/alerts/live` | Current alert feed |
| GET | `/history` | Historical safety snapshots |
| POST | `/realtime/presence` | Register client presence |
| GET | `/realtime/presence` | List active presence |
| POST | `/realtime/crowd-report` | Submit a community report |
| GET | `/realtime/crowd-reports` | List/filter community reports |
| PUT | `/realtime/crowd-report/{report_id}/upvote` | Upvote a report |
| GET | `/realtime/activity` | Recent activity events |
| GET | `/realtime/snapshot` | Latest snapshots for all cities |

## Water-quality model

The backend loads the serialized artifacts in `lifecheckai/backend/model/`
and can train or refresh them from the CSV files in
`lifecheckai/backend/data/`. The feature pipeline covers water measurements
such as pH, BOD, TDS, nitrates, fluoride, arsenic, and fecal/total
coliforms, subject to the available columns in each dataset.

The model is an advisory signal, not a substitute for laboratory testing or
an official public-health notice. Station coverage and confidence vary by
location.

## Deployment

### Frontend

Deploy `lifecheckai/frontend` to Vercel or another Next.js-compatible host.
Configure the frontend environment variables in the hosting provider and
set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.

### Backend

The included `render.yaml` deploys the backend to Render with:

- Python 3.11.9.
- `pip install -r lifecheckai/backend/requirements.txt`.
- Gunicorn with Uvicorn workers.
- `lifecheckai.backend.app.main:app`.
- `/health` as the health check.

The scheduler uses a file lock and is intended for a single backend worker.
For multiple workers or multiple hosts, disable it with
`ENABLE_SCHEDULER=false` and run refresh work separately.

## Validation

Frontend checks:

```bash
cd lifecheckai/frontend
npm run lint
npm run build
```

Backend smoke test:

```bash
uvicorn lifecheckai.backend.app.main:app --host 127.0.0.1 --port 8000
```

Then open `http://127.0.0.1:8000/health` or `http://127.0.0.1:8000/docs`.

## Limitations

- Google Pollen coverage is limited for Indian locations.
- Water predictions are dependent on monitoring-station coverage and
  historical data quality.
- AQI forecasting is a lightweight trend estimate, not a meteorological
  forecast.
- Presence and crowd reports are in-memory and expire; they are not tied to
  authenticated user accounts.
- The scheduler is not safe to run redundantly across multiple processes.
- API availability and rate limits of external providers affect live data.

## Contributing

1. Create a focused branch from the current default branch.
2. Keep changes scoped to one feature or fix.
3. Run `npm run lint` and `npm run build` for frontend changes.
4. Start the FastAPI app and check `/health` for backend changes.
5. Update this README when setup, routes, configuration, or deployment
   behavior changes.

## License

No license file is currently included in the repository. Add a license
before distributing the project outside its intended development context.
