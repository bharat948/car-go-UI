# package-map

React frontend for the delivery app: map (Leaflet/Mapbox), package create/edit, auth (register/login), my packages, and nearby packages. Talks to the **package-delivery** API on port 4000.

## Stack

- **React 18** (Create React App)
- **React Router** v6
- **Leaflet** / **react-leaflet** / **mapbox-gl** / **react-map-gl**
- **Axios** – API client
- **use-places-autocomplete** – Address search

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
- **package-delivery** backend running (see `../package-delivery/README.md`):
  - json-server on **port 5000**
  - API server on **port 4000**

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

All API calls go to `http://localhost:4000`:

- Auth: `POST /user/register`, `POST /user/login`, `POST /user/logout`
- Packages: `GET/POST /api/packages`, `GET /api/my-packages`, `PUT /api/packages/:id`, `POST /api/packages/near-me`

Ensure the backend is up before using login, create package, my packages, or edit.
