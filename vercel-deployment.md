# Deploying to Vercel

Since you've already pushed your code to GitHub, the best way to deploy is through the Vercel Dashboard.

## Step-by-Step Instructions

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2.  **Import Project**:
    - Click **"Add New..."** -> **"Project"**.
    - Find your repository: `bharat948/car-go-UI`.
    - Click **"Import"**.
3.  **Configure Project**:
    - **Framework Preset**: Vercel should automatically detect **Create React App**.
    - **Root Directory**: Ensure it points to `package-map` if it's not already.
4.  **Environment Variables**:
    - Expand the **"Environment Variables"** section.
    - Add the following:
        - **Key**: `REACT_APP_API_URL`
        - **Value**: `https://<your-backend-stable-url>` (Your EC2 backend URL).
5.  **Deploy**:
    - Click **"Deploy"**.

## Post-Deployment
- Once deployed, Vercel will give you a production URL (e.g., `https://car-go-ui.vercel.app`).
- **IMPORTANT**: Take this URL and add it to your backend's `FRONTEND_URL` environment variable on EC2 to allow CORS.

## Updating the App
- Any future pushes to the `main` branch of `bharat948/car-go-UI` will automatically trigger a new deployment on Vercel.
