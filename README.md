# Listing Mapper Backend

Backend API server for the Real Estate POI Mapper application. Provides endpoints for:
- Address autocomplete (Google Places API)
- Geocoding addresses to coordinates
- Searching nearby POIs (restaurants, grocery stores, shopping, parks)
- Generating static map images (Mapbox API)
- Compositing map images with overlays

## Deployment to Railway

1. Fork this repository to your GitHub account
2. In Railway, create a new project and select "Deploy from GitHub repo"
3. Select this repository
4. Add the following environment variables in Railway:
   - `GOOGLE_PLACES_API_KEY` - Your Google Places API key
   - `MAPBOX_ACCESS_TOKEN` - Your Mapbox access token
5. Railway will automatically build and deploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_PLACES_API_KEY` | Google Places API key for autocomplete and POI search |
| `MAPBOX_ACCESS_TOKEN` | Mapbox access token for static map generation |
| `PORT` | Server port (defaults to 3000, Railway sets this automatically) |

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/trpc/*` - tRPC API endpoints

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack

- Node.js + Express
- tRPC for type-safe APIs
- Sharp for image processing
- TypeScript
