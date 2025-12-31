import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import axios from "axios";
import { composeMapImage } from "./services/image-composer.js";

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;

// Get API keys from environment
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

export const appRouter = t.router({
  config: t.router({
    // Get API keys status (not the actual keys)
    getApiKeys: publicProcedure.query(() => {
      return {
        googlePlacesConfigured: !!GOOGLE_PLACES_API_KEY,
        mapboxConfigured: !!MAPBOX_ACCESS_TOKEN,
        googlePlacesKey: GOOGLE_PLACES_API_KEY,
        mapboxToken: MAPBOX_ACCESS_TOKEN,
      };
    }),

    // Address autocomplete
    getAddressSuggestions: publicProcedure
      .input(z.object({ input: z.string() }))
      .query(async ({ input }) => {
        if (!GOOGLE_PLACES_API_KEY || input.input.length < 3) {
          return [];
        }

        try {
          const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            {
              params: {
                input: input.input,
                types: "address",
                key: GOOGLE_PLACES_API_KEY,
              },
            }
          );

          return response.data.predictions.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
          }));
        } catch (error) {
          console.error("Autocomplete error:", error);
          return [];
        }
      }),

    // Geocode address
    geocodeAddress: publicProcedure
      .input(z.object({ address: z.string() }))
      .mutation(async ({ input }) => {
        if (!GOOGLE_PLACES_API_KEY) {
          throw new Error("Google Places API key not configured");
        }

        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: input.address,
              key: GOOGLE_PLACES_API_KEY,
            },
          }
        );

        if (response.data.status !== "OK" || !response.data.results.length) {
          throw new Error(`Geocoding failed: ${response.data.status}`);
        }

        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }),

    // Search nearby POIs
    searchNearbyPOIs: publicProcedure
      .input(
        z.object({
          lat: z.number(),
          lng: z.number(),
          radius: z.number(),
          type: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        if (!GOOGLE_PLACES_API_KEY) {
          throw new Error("Google Places API key not configured");
        }

        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
          {
            params: {
              location: `${input.lat},${input.lng}`,
              radius: input.radius,
              type: input.type,
              key: GOOGLE_PLACES_API_KEY,
            },
          }
        );

        return response.data.results.map((place: any) => ({
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          vicinity: place.vicinity,
          rating: place.rating,
          types: place.types,
        }));
      }),

    // Generate static map URL
    generateMapUrl: publicProcedure
      .input(
        z.object({
          lat: z.number(),
          lng: z.number(),
          zoom: z.number(),
          width: z.number(),
          height: z.number(),
          markers: z.array(
            z.object({
              lat: z.number(),
              lng: z.number(),
              color: z.string(),
              label: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        if (!MAPBOX_ACCESS_TOKEN) {
          throw new Error("Mapbox access token not configured");
        }

        // Build marker overlays for Mapbox Static API
        const markerOverlays = input.markers
          .slice(0, 100) // Limit markers
          .map((m) => {
            const pinSize = m.label === "home" ? "l" : "m";
            const label = m.label || "";
            return `pin-${pinSize}-${label}+${m.color.replace("#", "")}(${m.lng},${m.lat})`;
          })
          .join(",");

        const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerOverlays}/${input.lng},${input.lat},${input.zoom}/${input.width}x${input.height}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

        return { url };
      }),

    // Composite map with overlays
    compositeMap: publicProcedure
      .input(
        z.object({
          mapUrl: z.string(),
          address: z.string(),
          radius: z.number(),
          stats: z.object({
            restaurants: z.number(),
            grocery: z.number(),
            shopping: z.number(),
            parks: z.number(),
          }),
          closestPOIs: z.array(
            z.object({
              name: z.string(),
              category: z.string(),
              distance: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const composedImageBase64 = await composeMapImage(input);
          return { imageBase64: composedImageBase64 };
        } catch (error) {
          console.error("Image composition error:", error);
          throw new Error("Failed to compose map image");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
