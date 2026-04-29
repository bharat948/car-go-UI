# Deploying to Vercel

Since you've already pushed your code to GitHub, the best way to deploy is through the Vercel Dashboard.

## Step-by-Step Instructions

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. **Import Project**:
    - Click **"Add New..."** -> **"Project"**.
    - Find your repository: `bharat948/car-go-UI`.
    - Click **"Import"**.
3. **Configure Project**:
    - **Framework Preset**: Vercel should automatically detect **Create React App**.
    - **Root Directory**: Ensure it points to this app directory if needed.
4. **Environment Variables**:
    - Expand the **"Environment Variables"** section.
    - Add:
        - **Key**: `REACT_APP_API_URL`
        - **Value**: `https://<your-backend-stable-url>` (Your backend URL).
    - Optional (map):
        - **Key**: `REACT_APP_MAP_RASTER_TILES`
        - **Value**: Comma-separated XYZ tile URLs with `{z}`, `{x}`, `{y}` (use your production tile CDN; do not rely on public demo tiles at scale).
        - **Key**: `REACT_APP_MAP_RASTER_ATTRIBUTION`
        - **Value**: HTML attribution required by your tile provider.

    You do **not** need Mapbox credentials for MapLibre + raster tiles.

5. **Deploy**:
    - Click **"Deploy"**.

## Post-Deployment

- Once deployed, Vercel will give you a production URL (e.g., `https://car-go-ui.vercel.app`).
- **IMPORTANT**: Take this URL and add it to your backend's `FRONTEND_URL` environment variable (e.g. on EC2) to allow CORS.

## Updating the App

- Any future pushes to the `main` branch will automatically trigger a new deployment on Vercel.

## Map tiles note

Public OSM raster endpoints are acceptable for development only. For production traffic, budget for hosted tiles or self-hosting so you comply with usage policies and avoid outages.
