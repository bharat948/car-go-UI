# package-map

React frontend for the delivery app: map (**MapLibre** + `react-map-gl`), package create/edit with **address search or pin-on-map pickup/destination**, auth (register/login), courier dashboard, my packages, and nearby packages. Talks to the **package-delivery** API on port 4000.

## Stack

- **React 18** (Create React App)
- **React Router** v6
- **maplibre-gl** + **react-map-gl** — map view (raster XYZ tiles; no Mapbox token)
- **Leaflet** / **react-leaflet** — optional/legacy components elsewhere
- **Axios** – API client
- **Socket.IO client** — live courier positions on `/show-all`
- **react-hot-toast** — notifications

## Environment variables

Copy `.env.example` to `.env` in this folder and adjust:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_URL` | Backend base URL (e.g. `http://localhost:4000`). Leave empty in dev only if your dev proxy fills it; otherwise **set explicitly** when the UI and API run on different hosts. |
| `REACT_APP_MAP_RASTER_TILES` | Optional. Comma-separated raster tile URL templates with `{z}`, `{x}`, `{y}`. If unset, defaults to a public OSM tile URL for local development. **Production:** use your own tile host and follow that provider’s usage policy. |
| `REACT_APP_MAP_RASTER_ATTRIBUTION` | Optional. HTML attribution string for the map. |

You do **not** need `REACT_APP_MAPBOX_TOKEN` for the main map view after the MapLibre migration.

## Features (high level)

- **Operations map (`/show-all`)** — All packages as pins; with an active courier assignment, navigation-style panel, optional **drive mode** (`/show-all?drive=1`, also linked from Courier Dashboard when you have an active delivery), route via public OSRM, follow/recenter controls, thresholds for stale driver / off-route awareness (not turn-by-turn nav).
- **Create / edit shipment** — `LocationAutocomplete` (OpenCage suggestions via server) plus **Map** buttons to drop a pin on a full-screen map **up to zoom 22**, then confirm; labels come from **`GET /api/locations/reverse`** when authenticated.
- **Courier dashboard** — “Open drive map” and location publish status when delivering.

## Routes

| Path | Description |
|------|-------------|
| `/home` | Home |
| `/show-all` | Map view — all packages; add `?drive=1` to enter navigation layout for couriers |
| `/register` | Register |
| `/login` | Login |
| `/create-package` | Create delivery package |
| `/my-packages` | Current user’s packages |
| `/edit-package/:id` | Edit package |
| `/nearby-packages` | Packages near you (requires login) |

## Prerequisites

- Node.js (v14+)
- **Backend** running (see `../car-go-server/README.md`): API on **port 4000**

## Run

```bash
npm install
npm start
```

App: http://localhost:3000 (set `REACT_APP_API_URL` to match your API.)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm test` | Test runner |
| `npm run eject` | Eject CRA (one-way) |

## API

All API calls go to `REACT_APP_API_URL` or **`http://localhost:4000`** when that env is unset in build-time config:

- Auth: `POST /user/register`, `POST /user/login`, `POST /user/logout`
- Packages: `GET /api/packages`, **`POST /api/packages`** (JWT), `GET /api/packages/:id`, `GET /api/my-packages`, `PUT /api/packages/:id`, `PATCH /api/packages/:id/status`, `DELETE /api/packages/:id`, `POST /api/packages/near-me`
- Locations (JWT): `GET /api/locations/suggest?q=`, `GET /api/locations/reverse?lat=&lng=` (reverse label for map-picked coordinates)
- Courier (JWT): e.g. `GET /api/courier/packages`, `GET /api/courier/my-deliveries`; driver socket events as implemented on the server

**Create/update package — coordinates.** If the user chooses a pin on the map, the client may send **`picklat`/`picklng`** and **`destlat`/`destlng`** with the textual fields; the server stores those coords and prefers them over geocoding the address string when supplied.

Ensure the backend is up before using login, create package, locations, courier flows, or map reverse geocode.
