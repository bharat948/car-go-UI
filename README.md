# package-map

React frontend for the delivery app: map (**MapLibre** + `react-map-gl`), package create/edit, auth (register/login), my packages, and nearby packages. Talks to the **package-delivery** API on port 4000.

## Stack

- **React 18** (Create React App)
- **React Router** v6
- **maplibre-gl** + **react-map-gl** — map view (raster XYZ tiles; no Mapbox token)
- **Leaflet** / **react-leaflet** — optional/legacy components elsewhere
- **Axios** – API client
- **use-places-autocomplete** – Address search

## Environment variables

Copy `.env.example` to `.env` in this folder and adjust:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_URL` | Backend base URL (e.g. `http://localhost:4000`) |
| `REACT_APP_MAP_RASTER_TILES` | Optional. Comma-separated raster tile URL templates with `{z}`, `{x}`, `{y}`. If unset, defaults to a public OSM tile URL for local development. **Production:** use your own tile host and follow that provider’s usage policy. |
| `REACT_APP_MAP_RASTER_ATTRIBUTION` | Optional. HTML attribution string for the map. |

You do **not** need `REACT_APP_MAPBOX_TOKEN` for the main map view after the MapLibre migration.

## Routes

| Path | Description |
|------|-------------|
| `/home` | Home |
| `/show-all` | Map view – all packages |
| `/register` | Register |
| `/login` | Login |
| `/create-package` | Create delivery package |
| `/my-packages` | Current user’s packages |
| `/edit-package/:id` | Edit package |
| `/nearby-packages` | Packages near you (requires login) |

## Prerequisites

- Node.js (v14+)
- **Backend** running (see `../car-go-server/README.md`): API server on **port 4000**

## Run

```bash
npm install
npm start
```

App: http://localhost:3000

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm test` | Test runner |
| `npm run eject` | Eject CRA (one-way) |

## API

All API calls go to `REACT_APP_API_URL` or `http://localhost:4000` when unset:

- Auth: `POST /user/register`, `POST /user/login`, `POST /user/logout`
- Packages: `GET/POST /api/packages`, `GET /api/my-packages`, `PUT /api/packages/:id`, `POST /api/packages/near-me`

Ensure the backend is up before using login, create package, my packages, or edit.
