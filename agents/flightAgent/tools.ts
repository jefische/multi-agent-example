// @ts-ignore
import Amadeus from "amadeus";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!
});

export const flightToolsByName = {
  searchFlights: tool(
    async ({ origin, destination, date, adults }) => {
      try {
        const response = await amadeus.shopping.flightOffersSearch.get({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: date,
          adults: adults,
          currencyCode: 'USD',
          max: '10'
        });
        return JSON.stringify(response.data, null, 2);
      } catch (error) {
        return `Error searching flights: ${error}`;
      }
    },
    {
      name: "searchFlights",
      description: "Search for flights between two airports on a specific date",
      schema: z.object({
        origin: z.string().describe("Origin airport code (e.g., LAX)"),
        destination: z.string().describe("Destination airport code (e.g., CDG)"),
        date: z.string().describe("Departure date (YYYY-MM-DD)"),
        adults: z.string().describe("Number of adult passengers")
      })
    }
  )
};

export const flightTools = Object.values(flightToolsByName);
