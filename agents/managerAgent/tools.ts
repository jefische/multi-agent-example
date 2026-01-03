// agents/managerAgent/tools.ts
import { tool } from "@langchain/core/tools";
import { runFlightAgent } from "../flightAgent/index.js";
import { runHotelAgent } from "../hotelAgent/index.js";
import { runAttractionsAgent } from "../attractionsAgent/index.js";
import * as z from "zod";

export const managerTools = {
  searchFlights: tool(
    async ({ origin, destination, date, adults }) => {
      const prompt = `Find flights from ${origin} to ${destination} on ${date} for ${adults} adults`;
      const messages = await runFlightAgent(prompt);
      return messages.at(-1)?.content?.toString() ?? "No results found";
    },
    {
      name: "searchFlights",
      description: "Search for flight options between two cities",
      schema: z.object({
        origin: z.string(),
        destination: z.string(),
        date: z.string(),
        adults: z.string()
      })
    }
  ),
  
  searchHotels: tool(
    async ({ location, checkIn, checkOut }) => {
      return await runHotelAgent({ location, checkIn, checkOut });
    },
    {
      name: "searchHotels",
      description: "Search for hotel accommodations in a location",
      schema: z.object({
        location: z.string(),
        checkIn: z.string(),
        checkOut: z.string()
      })
    }
  ),
  
  findAttractions: tool(
    async ({ location, interests }) => {
      return await runAttractionsAgent({ location, interests });
    },
    {
      name: "findAttractions",
      description: "Find tourist attractions and activities in a location",
      schema: z.object({
        location: z.string(),
        interests: z.string().optional()
      })
    }
  ),
  
  findPhotoSpots: tool(
    async ({ location }) => {
      return await runPhotoSpotAgent({ location });
    },
    {
      name: "findPhotoSpots",
      description: "Find popular photography locations and scenic spots",
      schema: z.object({
        location: z.string()
      })
    }
  )
};
