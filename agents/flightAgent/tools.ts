// @ts-ignore
import Amadeus from "amadeus";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!
});

// Parse various date formats into YYYY-MM-DD
function parseDate(dateStr: string): string {
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Remove ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
  const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

  const currentYear = new Date().getFullYear();

  // First, try parsing with current year appended (handles "July 6", "July 6", etc.)
  const withYear = new Date(`${cleaned} ${currentYear}`);
  if (!isNaN(withYear.getTime())) {
    // If the date is in the past, use next year
    if (withYear < new Date()) {
      withYear.setFullYear(currentYear + 1);
    }
    return withYear.toISOString().slice(0, 10);
  }

  // Try parsing as-is (handles "July 6, 2025" or other full formats)
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  throw new Error(`Could not parse date: ${dateStr}`);
}

export const flightToolsByName = {
  searchFlights: tool(
    async ({ origin, destination, date, adults }) => {
      try {
        const formattedDate = parseDate(date);
        const response = await amadeus.shopping.flightOffersSearch.get({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: formattedDate,
          adults: adults,
          currencyCode: 'USD',
          max: '10'
        });
        const results = response.data;
        if (!results || results.length === 0) {
          return `No flights found for ${origin} to ${destination} on ${formattedDate} for ${adults} adults.`;
        }
        return JSON.stringify(results, null, 2);
      } catch (error) {
        return `Error searching flights (${origin} to ${destination} on ${date} -> ${parseDate(date)}): ${error}`;
      }
    },
    {
      name: "searchFlights",
      description: "Search for flights between two airports on a specific date",
      schema: z.object({
        origin: z.string().describe("Origin airport code (e.g., LAX)"),
        destination: z.string().describe("Destination airport code (e.g., CDG)"),
        date: z.string().describe("Departure date in any format (e.g., 'July 6th', '2025-07-06', 'July 6, 2025')"),
        adults: z.string().describe("Number of adult passengers")
      })
    }
  )
};

export const flightTools = Object.values(flightToolsByName);
