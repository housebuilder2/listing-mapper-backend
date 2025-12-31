/**
 * Server-side image composition service using Sharp
 * Composites overlays directly onto map images for web download
 */

import sharp from "sharp";

export type CompositeMapInput = {
  mapUrl: string;
  address: string;
  radius: number;
  stats: {
    restaurants: number;
    grocery: number;
    shopping: number;
    parks: number;
  };
  closestPOIs: Array<{
    name: string;
    category: string;
    distance: number;
  }>;
};

/**
 * Generate SVG overlay for the map image
 */
function generateOverlaySVG(
  address: string,
  radiusMiles: number,
  stats: { restaurants: number; grocery: number; shopping: number; parks: number },
  closestPOIs: Array<{ name: string; category: string; distance: number }>,
  width: number,
  height: number
): string {
  const baseScale = Math.max(width, height) / 1000;
  const scale = Math.max(baseScale, 1.0);
  
  const padding = Math.round(12 * scale);
  const boxPadding = Math.round(10 * scale);
  const titleFontSize = Math.round(14 * scale);
  const textFontSize = Math.round(11 * scale);
  const smallFontSize = Math.round(10 * scale);
  const dotSize = Math.round(8 * scale);
  const lineHeight = Math.round(16 * scale);
  const borderRadius = Math.round(6 * scale);

  const addressBoxWidth = Math.round(240 * scale);
  const addressBoxHeight = Math.round(65 * scale);
  const amenitiesBoxWidth = Math.round(160 * scale);
  const amenitiesBoxHeight = Math.round(115 * scale);
  const closestBoxWidth = Math.round(200 * scale);
  const closestBoxHeight = Math.round(95 * scale);

  const displayAddress = address.length > 40 ? address.substring(0, 37) + "..." : address;
  const addressLine1 = displayAddress.substring(0, 30);
  const addressLine2 = displayAddress.length > 30 ? displayAddress.substring(30) : "";

  // Build closest locations entries
  const categoryColors: Record<string, string> = {
    restaurant: "#F97316",
    grocery: "#92400E",
    shopping: "#A855F7",
    park: "#22C55E",
  };

  const closestEntries = closestPOIs.slice(0, 4).map((poi) => {
    const name = poi.name.length > 22 ? poi.name.substring(0, 19) + "..." : poi.name;
    const color = categoryColors[poi.category] || "#666666";
    return `<tspan fill="${color}">●</tspan> ${name} (${poi.distance.toFixed(1)}mi)`;
  });

  const brandColor = "#1E40AF";

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .box { fill: rgba(255, 255, 255, 0.92); filter: drop-shadow(0 1px 3px rgba(0,0,0,0.15)); }
    .title { font-family: Arial, Helvetica, sans-serif; font-weight: bold; fill: #11181C; }
    .text { font-family: Arial, Helvetica, sans-serif; fill: #11181C; }
    .muted { font-family: Arial, Helvetica, sans-serif; fill: #687076; }
  </style>

  <!-- Address Box - Top Left -->
  <g>
    <rect x="${padding}" y="${padding}" width="${addressBoxWidth}" height="${addressBoxHeight}" 
          class="box" rx="${borderRadius}" stroke="#E5E7EB" stroke-width="1"/>
    <text x="${padding + boxPadding}" y="${padding + boxPadding + titleFontSize}" 
          class="title" font-size="${titleFontSize}">${addressLine1}</text>
    ${addressLine2 ? `<text x="${padding + boxPadding}" y="${padding + boxPadding + titleFontSize + lineHeight * 0.85}" 
          class="title" font-size="${titleFontSize}">${addressLine2}</text>` : ""}
    <text x="${padding + boxPadding}" y="${padding + addressBoxHeight - boxPadding - 2}" 
          class="muted" font-size="${smallFontSize}">${radiusMiles} mile${radiusMiles !== 1 ? "s" : ""} radius</text>
  </g>

  <!-- Nearby Amenities Box - Top Right -->
  <g>
    <rect x="${width - amenitiesBoxWidth - padding}" y="${padding}" 
          width="${amenitiesBoxWidth}" height="${amenitiesBoxHeight}" 
          class="box" rx="${borderRadius}" stroke="#E5E7EB" stroke-width="1"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding}" y="${padding + boxPadding + titleFontSize}" 
          class="title" font-size="${titleFontSize}">Nearby Amenities</text>
    
    <circle cx="${width - amenitiesBoxWidth - padding + boxPadding + dotSize/2}" 
            cy="${padding + boxPadding + titleFontSize + lineHeight + dotSize/4}" r="${dotSize/2}" fill="${brandColor}"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding + dotSize + 6}" 
          y="${padding + boxPadding + titleFontSize + lineHeight + dotSize/2}" 
          class="text" font-size="${textFontSize}">Your Listing</text>
    
    <circle cx="${width - amenitiesBoxWidth - padding + boxPadding + dotSize/2}" 
            cy="${padding + boxPadding + titleFontSize + lineHeight * 2 + dotSize/4}" r="${dotSize/2}" fill="#F97316"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding + dotSize + 6}" 
          y="${padding + boxPadding + titleFontSize + lineHeight * 2 + dotSize/2}" 
          class="text" font-size="${textFontSize}">Restaurants: ${stats.restaurants}</text>
    
    <circle cx="${width - amenitiesBoxWidth - padding + boxPadding + dotSize/2}" 
            cy="${padding + boxPadding + titleFontSize + lineHeight * 3 + dotSize/4}" r="${dotSize/2}" fill="#92400E"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding + dotSize + 6}" 
          y="${padding + boxPadding + titleFontSize + lineHeight * 3 + dotSize/2}" 
          class="text" font-size="${textFontSize}">Grocery: ${stats.grocery}</text>
    
    <circle cx="${width - amenitiesBoxWidth - padding + boxPadding + dotSize/2}" 
            cy="${padding + boxPadding + titleFontSize + lineHeight * 4 + dotSize/4}" r="${dotSize/2}" fill="#A855F7"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding + dotSize + 6}" 
          y="${padding + boxPadding + titleFontSize + lineHeight * 4 + dotSize/2}" 
          class="text" font-size="${textFontSize}">Shopping: ${stats.shopping}</text>
    
    <circle cx="${width - amenitiesBoxWidth - padding + boxPadding + dotSize/2}" 
            cy="${padding + boxPadding + titleFontSize + lineHeight * 5 + dotSize/4}" r="${dotSize/2}" fill="#22C55E"/>
    <text x="${width - amenitiesBoxWidth - padding + boxPadding + dotSize + 6}" 
          y="${padding + boxPadding + titleFontSize + lineHeight * 5 + dotSize/2}" 
          class="text" font-size="${textFontSize}">Parks: ${stats.parks}</text>
  </g>

  <!-- Closest Locations Box - Bottom Left -->
  ${closestEntries.length > 0 ? `
  <g>
    <rect x="${padding}" y="${height - closestBoxHeight - padding}" 
          width="${closestBoxWidth}" height="${closestBoxHeight}" 
          class="box" rx="${borderRadius}" stroke="#E5E7EB" stroke-width="1"/>
    <text x="${padding + boxPadding}" y="${height - closestBoxHeight - padding + boxPadding + titleFontSize}" 
          class="title" font-size="${titleFontSize}">Closest Locations</text>
    ${closestEntries.map((entry, i) => `
    <text x="${padding + boxPadding}" 
          y="${height - closestBoxHeight - padding + boxPadding + titleFontSize + lineHeight * (i + 1)}" 
          class="text" font-size="${smallFontSize}">${entry}</text>
    `).join("")}
  </g>
  ` : ""}
</svg>
  `.trim();
}

/**
 * Composite map image with overlays using Sharp
 */
export async function composeMapImage(input: CompositeMapInput): Promise<string> {
  // Fetch the map image
  const response = await fetch(input.mapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch map image: ${response.status}`);
  }
  const mapBuffer = Buffer.from(await response.arrayBuffer());

  // Get image dimensions
  const metadata = await sharp(mapBuffer).metadata();
  const width = metadata.width || 1280;
  const height = metadata.height || 960;

  // Generate SVG overlay
  const overlaySvg = generateOverlaySVG(
    input.address,
    input.radius,
    input.stats,
    input.closestPOIs,
    width,
    height
  );

  // Composite the overlay onto the map
  const composited = await sharp(mapBuffer)
    .composite([
      {
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  // Return as base64
  return composited.toString("base64");
}
