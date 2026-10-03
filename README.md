# ORCA-X — Ocean Reasoning & Collaborative AI

![React](https://img.shields.io/badge/React-Vite-61dafb?style=for-the-badge&logo=react&logoColor=111827)
![Express](https://img.shields.io/badge/Express-TypeScript-000000?style=for-the-badge&logo=express&logoColor=ffffff)
![FastAPI](https://img.shields.io/badge/FastAPI-ML%20%2B%20RAG-009688?style=for-the-badge&logo=fastapi&logoColor=ffffff)
![Qdrant](https://img.shields.io/badge/Qdrant-BGE--M3-dc244c?style=for-the-badge&logo=qdrant&logoColor=ffffff)
![XGBoost](https://img.shields.io/badge/XGBoost-risk%20model-337ab7?style=for-the-badge)

> **Smart India Hackathon 2026 — PS176**
> **Team Samudra Dristhi** · Heritage Institute of Technology, Kolkata

ORCA-X is a marine-intelligence decision-support platform for coastal safety, fishing and navigation. It combines live weather/marine observations, hourly tomorrow weather/marine forecasts, Copernicus Sentinel catalogue metadata, a deterministic marine-risk engine, an XGBoost risk model, GIS layers, BGE-M3 + Qdrant evidence retrieval and optional Gemini grounded synthesis.

**Live:** [hack-heritage-opal.vercel.app](https://hack-heritage-opal.vercel.app)

## Architecture

```text
React + Vite
    │
    ▼
Express / TypeScript API (port 3000)
    ├── /api/orca/query
    ├── /api/marine/conditions       ← current/live observations
    ├── /api/marine/forecast         ← hourly tomorrow forecast + ML risk
    ├── /api/marine/risk             ← point-in-time ML risk
    ├── /api/satellite/analysis
    ├── /api/evidence/search
    └── /api/health
            │
            ├──────────────► Open-Meteo Weather + Marine APIs
            │
            ├──────────────► FastAPI + XGBoost ML API (port 8000)
            │
            └──────────────► FastAPI + BGE-M3 RAG API (port 8001)
                                      │
                                      ▼
                               Qdrant (port 6333)
                                      │
                                      ▼
                         orca_marine_evidence
```

The TypeScript backend owns orchestration and external connectors. The Python ML service owns XGBoost inference. The Python RAG service owns real BAAI/BGE-M3 dense embeddings and Qdrant vector retrieval. If the RAG service is unavailable, the backend explicitly falls back to the existing lexical evidence retriever and marks the response as degraded.

## Live observations vs forecast risk

ORCA-X keeps the distinction between **what is happening now** and **what is forecast to happen tomorrow** explicit:

- `GET /api/marine/conditions?lat=...&lon=...` fetches current weather and marine conditions.
- `GET /api/marine/forecast?locationKey=digha` fetches tomorrow's hourly Open-Meteo weather + marine forecast and evaluates the configured XGBoost model at each forecast hour.
- A forecast response is marked `sourceType: "FORECAST"` and each hourly prediction is timestamped with its forecast hour.
- The forecast endpoint refuses to return a partial window when fewer than 12 hourly points are available.
- Forecast output is decision support, not a guarantee of safety. IMD/INCOIS/Coast Guard warnings take precedence.

Example:

```text
GET http://127.0.0.1:3000/api/marine/forecast?locationKey=digha
```

The response contains the local forecast date, timezone, model version, worst forecast risk, hourly risk predictions, and explicit safety warnings.

**Important model gate:** the repository's committed production artifact is documented separately in `ml/PRODUCTION_MODEL_STATUS.md`. Until the validated forward 6-hour v2.6 artifact is promoted, the forecast path must be treated as a forecast-input integration using the currently committed artifact, not as proof that the final v2.6 model has been trained.

## Refinement 3 — Real BGE-M3 + Qdrant RAG

Refinement 3 replaces the previous in-memory lexical-only evidence ranking with an actual vector retrieval path:

- Embedding model: `BAAI/bge-m3` via FlagEmbedding.
- Vector size: 1024-dimensional dense embeddings.
- Vector database: Qdrant.
- Collection: `orca_marine_evidence`.
- Distance: cosine similarity.
- Canonical source corpus: `MARINE_EVIDENCE_CORPUS` from `src/data/coastalData.ts`.
- Stable UUID5 point IDs prevent duplicate documents on repeated ingestion.
- Query path: ORCA query → BGE-M3 query embedding → Qdrant top-K → grounded synthesis.
- Failure behavior: lexical fallback is retained, but the trace identifies that fallback explicitly.

BGE-M3 is designed for multilingual, multi-functionality retrieval, and its authors recommend hybrid retrieval plus reranking for stronger RAG systems. Refinement 3 intentionally establishes the real dense BGE-M3 + Qdrant foundation first; sparse/hybrid retrieval and reranking can be layered on afterward.

All commands below run from `frontend/`.

### Start Qdrant

Run Qdrant locally on port 6333 using your existing Docker setup, or point `QDRANT_URL` at a hosted Qdrant instance.

### Start the RAG API

```bash
npm run dev:rag
```

The RAG service runs on:

```text
http://127.0.0.1:8001
```

### Ingest the canonical evidence corpus

With Qdrant and the RAG API running:

```bash
npm run ingest:rag
```

This embeds the canonical marine evidence documents with BGE-M3 and upserts them into `orca_marine_evidence`.

### Check RAG health

```text
http://127.0.0.1:8001/health
```

The response reports the embedding model, 1024-dimensional vector configuration, collection name and Qdrant point count.

## Project structure

```text
HackHeritage/
├── frontend/                    # The application — React frontend, Express API, ML and RAG
│   ├── src/                     # React frontend + shared domain types
│   │   ├── components/
│   │   ├── data/
│   │   ├── services/
│   │   │   ├── ml/
│   │   │   │   └── riskService.ts
│   │   │   └── satellite/
│   │   │       └── satelliteService.ts
│   │   ├── utils/
│   │   │   └── marineRiskEngine.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── types.ts
│   │
│   ├── server/                  # Express application backend
│   │   ├── app.ts
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── evidenceService.ts   # lexical fallback
│   │   │   ├── marineService.ts
│   │   │   ├── realtime/
│   │   │   │   ├── openMeteoProvider.ts
│   │   │   │   ├── openMeteoForecastProvider.ts
│   │   │   │   ├── realtimeObservationService.ts
│   │   │   │   └── marineForecastService.ts
│   │   │   ├── orcaService.ts
│   │   │   └── ragService.ts        # BGE-M3 RAG bridge
│   │   ├── controllers/
│   │   └── middleware/
│   │
│   ├── ml/                      # Python ML + RAG subsystem
│   │   ├── api.py               # XGBoost API
│   │   ├── rag_api.py           # BGE-M3 + Qdrant API
│   │   ├── src/
│   │   ├── models/
│   │   ├── data/
│   │   └── requirements.txt
│   │
│   └── scripts/                 # dev-all, health, ingest, MOSDAC and realtime sync
│
├── orca/                        # Submodule → Ankan0503/ORCA
├── legacy/                      # Superseded frontend, express backend and ml-service
└── docs/
```

## Running it

```bash
cd frontend
npm install
npm run dev          # Vite on port 3001
npm run dev:ml       # XGBoost API on 8000
npm run dev:rag      # BGE-M3 + Qdrant RAG API on 8001
```

Or bring the whole stack up at once:

```bash
npm run dev:all
```

| Command | Purpose |
| --- | --- |
| `npm run dev:all` | Start frontend, API, ML and RAG together |
| `npm run health` | System health across every service |
| `npm run verify:realtime` | Check the live marine data sources |
| `npm run sync:mosdac` | Pull MOSDAC data |
| `npm run evaluate:realtime-ml` | Evaluate a live model candidate |
| `npm run lint` | `tsc --noEmit` |
| `npm run build` | Production build |

## Validation

Build and type-check the TypeScript application, then run the health check across the running services:

```bash
npm run lint
npm run build
npm run health
```

The health check covers live weather/marine data **and** the tomorrow forecast path, in addition to ML, RAG/Qdrant, evidence retrieval and the ORCA workflow.

## Team Samudra Dristhi

Heritage Institute of Technology, Kolkata.

| Member | GitHub |
| --- | --- |
| Sayan Sinha | [@Sayan260106](https://github.com/Sayan260106) |
| Ankan Giri | [@Ankan0503](https://github.com/Ankan0503) |
| Swarnavo Sen | [@swarnavosen10-byte](https://github.com/swarnavosen10-byte) |
| Raunak | [@raunak095](https://github.com/raunak095) |
| Rupkatha Ghosh | [@Rupkatha-Ghosh](https://github.com/Rupkatha-Ghosh) |
| Shrabani Neogi | [@shrabani-stack](https://github.com/shrabani-stack) |

## Licence

MIT — see [LICENSE](LICENSE).
