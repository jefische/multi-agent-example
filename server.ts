// import { ChatOllama } from "@langchain/ollama";
// import { tool } from "langchain";
// import type { BaseMessage } from "@langchain/core/messages";
// @ts-ignore
import Amadeus from "amadeus";
import express from "express";
import "dotenv/config";
import { runManager } from "./agents/managerAgent/index.js";
import { classifyIntent } from "./agents/managerAgent/classifyIntent.js";

interface CheckinLinkResponse {
    data: unknown;
}

interface AmadeusError {
    code: string;
}

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!
});

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const port = 3000;

// Health check
app.get("/", (req, res) => {
    res.json({status: "ok", service: "multi-agent-api"});
});

app.get("/amadeus/checkinLinks", async (req, res) => {
    const { airlineCode } = req.query;

    amadeus.referenceData.urls.checkinLinks.get({
        airlineCode : airlineCode || 'IB'
    }).then(function(response: CheckinLinkResponse){
        console.log(response.data);
        res.json(response.data);
    }).catch(function(responseError: AmadeusError){
        console.log(responseError.code);
        res.send("data not found");
    });
});

app.get("/amadeus/flightOffersSearch", async (req, res) => {
    const { 
        origin, 
        destination,
        date,
        adults,
        currency
     } = req.query;

    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin || 'SYD',
        destinationLocationCode: destination || 'BKK',
        departureDate: date || '2026-06-30',
        adults: adults || '2',
        currencyCode: currency || 'USD',
        max: '10', // limit results to 10 offers
        nonStop: 'true',
        travelClass: 'ECONOMY' // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
    }).then(function(response: CheckinLinkResponse){
        console.log(response.data);
        res.json(response.data);
    }).catch(function(responseError: AmadeusError){
        console.log(responseError.code);
        res.send("data not found");
    });
});

// Main agent endpoint
app.post("/agent", async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "prompt is required" });
        }

        const result = await runManager(prompt);

        if (result.type === "error") {
            return res.status(400).json({ 
                error: result.message 
            });
        }

        // Format the message trace for API response
        const formattedMessages = result.messages.map(msg => ({
            role: msg.type,
            content: msg.text || msg.content
        }));

        res.json({ 
            success: true,
            messages: formattedMessages 
        });

    } catch (error) {
        console.error("Agent error:", error);
        res.status(500).json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});


app.post("/intent", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "prompt is required" });
        }

        const intent = await classifyIntent(prompt);
        res.send(`Intent: ${intent}`);
        
    } catch (error) {
        console.error("Agent error:", error);
        res.status(500).json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.listen(port, () => {
    console.log(`Multi-agent server listening on port ${port}`);
});
