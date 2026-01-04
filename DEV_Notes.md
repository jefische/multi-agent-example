# Development Notes - Multi-Agent Travel App

Last updated: 2026-01-04

## Current Progress

### Architecture Completed
✅ Manager agent with tool-calling orchestration (Option 1 approach)
✅ Flight sub-agent structure (`agents/flightAgent/index.ts`)
✅ Manager tools wrapper for sub-agents (`agents/managerAgent/tools.ts`)
✅ Express server with `/agent` endpoint
✅ Manager agent automatically asks for clarification on missing info (tested with Postman)

### Current Behavior
- When user prompt lacks specific details (e.g., "flights in July" without exact date), manager asks for clarification
- Single-turn conversations only (no memory between requests)
- Manager has `searchFlights` tool that calls flight sub-agent

---

## Next Steps

### 1. Complete Flight Agent Implementation
Flight agent needs these files (follow arithmetic agent pattern):
- `agents/flightAgent/callLlm.ts` - Budget flight expert persona
- `agents/flightAgent/model.ts` - LLM with Amadeus tools bound
- `agents/flightAgent/tools.ts` - Amadeus API integration
- `agents/flightAgent/callTool.ts` - Tool dispatcher

### 2. Implement Database & Auth
See detailed options below.

### 3. Add Multi-turn Conversation Support
- Modify `/agent` endpoint to accept `conversationId`
- Load/save conversation history from database
- Update `runManager()` to accept previous messages

---

## Memory & Database Options

### Two Types of Memory Needed

| Type | Purpose | Lifespan | Best Storage |
|------|---------|----------|--------------|
| **Conversation Memory** | Track chat history within planning session | Short-term | Redis or Database |
| **Persistent Storage** | User profiles, saved itineraries | Long-term | Database |

### Option 1: In-Memory Map (Dev/Testing Only)

```typescript
const sessions = new Map<string, BaseMessage[]>();
```

**Pros**: Simple, fast, no setup
**Cons**: Lost on restart, doesn't scale, no persistence

### Option 2: Redis (Recommended for Conversations)

```typescript
import Redis from "ioredis";
const redis = new Redis();

// Store with auto-expiry (3600s = 1 hour)
await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(messages));
```

**Pros**: Fast, TTL support, scales well
**Cons**: Separate service, not ideal for complex queries

### Option 3: PostgreSQL + Prisma (RECOMMENDED for MVP)

**Why**: Single database for everything - auth, profiles, conversations, itineraries

```prisma
// Simplified schema
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  conversations Conversation[]
  itineraries   Itinerary[]
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  messages  Json     // BaseMessage[] stored as JSON
  createdAt DateTime @default(now())
}

model Itinerary {
  id          String          @id @default(cuid())
  userId      String
  name        String
  destination String
  items       ItineraryItem[]
}
```

**Pros**: Type-safe, handles everything, scales well
**Cons**: More setup than in-memory

---

## Auth Options

### MVP Requirements
- User registration/login ✅
- User profiles with travel preferences ✅
- Secure password storage ✅
- Session management ✅

### Option A: Simple JWT (RECOMMENDED for MVP)

**Fastest to implement, works great for API-first apps**

```typescript
// Dependencies
pnpm add bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken

// Usage
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Register
const hash = await bcrypt.hash(password, 10);
const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });

// Protect routes
const { userId } = jwt.verify(token, process.env.JWT_SECRET!);
```

**Pros**: Simple, stateless, works with any frontend
**Cons**: Can't invalidate tokens (use short expiry or blacklist)

### Option B: Lucia Auth

**Modern, lightweight auth library for TypeScript**

```bash
pnpm add lucia @lucia-auth/adapter-prisma
```

**Pros**: Session management, multiple providers, type-safe
**Cons**: More setup than JWT

### Option C: Passport.js

**Battle-tested, many strategies (Google, GitHub, etc.)**

**Pros**: Social login ready, widely used
**Cons**: Older API, more boilerplate

---

## Recommended MVP Stack

```
┌─────────────────────────────────────────────┐
│         Express Server (server.ts)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────┐│
│  │  Redis   │  │  PostgreSQL  │  │Amadeus ││
│  │(optional)│  │   + Prisma   │  │  API   ││
│  │          │  │              │  │        ││
│  │Sessions  │  │• Users       │  │Flights ││
│  │(cache)   │  │• Profiles    │  │Hotels  ││
│  │          │  │• Convos      │  │        ││
│  │          │  │• Itineraries │  │        ││
│  └──────────┘  └──────────────┘  └────────┘│
└─────────────────────────────────────────────┘
```

### For Development
1. **PostgreSQL + Prisma** - All data in one place
2. **Simple JWT** - Fast auth implementation
3. **In-memory sessions** initially (move to DB later)

### For Production
1. **PostgreSQL + Prisma** - Same as dev
2. **JWT with refresh tokens** - Better security
3. **Redis** - Fast conversation caching (optional)

---

## Database Schema (Full Version)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  profile       Profile?
  conversations Conversation[]
  itineraries   Itinerary[]
}

model Profile {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  homeAirport       String?
  preferredCurrency String?  @default("USD")
  travelStyle       String?  // "budget", "comfort", "luxury"
  interests         String[] // ["museums", "food", "outdoor"]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  messages  Json      // BaseMessage[] as JSON
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Itinerary {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  name        String
  destination String
  startDate   DateTime
  endDate     DateTime
  items       ItineraryItem[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model ItineraryItem {
  id          String    @id @default(cuid())
  itineraryId String
  itinerary   Itinerary @relation(fields: [itineraryId], references: [id])
  type        String    // "flight", "hotel", "attraction"
  day         Int
  order       Int
  data        Json      // Flexible item details
  createdAt   DateTime  @default(now())
}
```

---

## Setup Commands (When Ready)

```bash
# Install dependencies
pnpm add prisma @prisma/client bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken

# Initialize Prisma
npx prisma init

# Create schema (copy from above)
# Edit prisma/schema.prisma

# Set database URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/travel_app"
# Or for SQLite (simpler for local dev):
DATABASE_URL="file:./dev.db"

# Run migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

---

## Key Architectural Decisions

### Tool vs Sub-Agent Pattern
- **Tool**: Wrapper function in `managerTools`
- **Sub-Agent**: Full LLM with persona, tools, and reasoning loop
- **Pattern**: Manager tools call sub-agents (e.g., `searchFlights` → `runFlightAgent`)

### Nested Architecture
```
Manager Agent
  └─ searchFlights (tool)
      └─ Flight Sub-Agent
          └─ amadeusFlightSearch (tool)
              └─ Amadeus API
```

### Handling Missing Information
- Manager LLM is smart enough to ask for clarification (tested)
- No need for explicit validation in most cases
- Can add `.describe()` hints in Zod schemas for guidance

---

## Questions to Answer

1. ✅ Do we need user authentication? **YES** - required for profiles & saved itineraries
2. ⏳ How long should conversations persist? **TBD** - suggest 30 days with cleanup
3. ⏳ Should users resume old conversations? **TBD** - yes for itinerary planning
4. ⏳ Analyze conversation data later? **TBD** - if yes, store in DB not Redis

---

## Testing Notes

### Postman Test Results
**Request:**
```json
POST /agent
{
  "prompt": "Help me find flights from DFW to LIM in July for 2 adults"
}
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {"role": "human", "content": "Help me find flights..."},
    {"role": "ai", "content": "What specific date in July would you like to fly?"}
  ]
}
```

✅ Manager correctly asks for missing date before calling searchFlights tool

---

## Files Modified

### Manager Agent
- `agents/managerAgent/index.ts` - Added tool-calling loop with final message append
- `agents/managerAgent/callTool.ts` - Fixed TypeScript error with `(tool as any).invoke()`
- `agents/managerAgent/tools.ts` - Converted args to prompt string for sub-agents
- `agents/managerAgent/model.ts` - Updated comment for clarity

### Flight Agent
- `agents/flightAgent/index.ts` - Basic structure, needs implementation

### Server
- `server.ts` - Added `/agent` endpoint with error handling
- `utils/tokenManager.ts` - Amadeus token caching (in-memory)

---

## Resources

- [LangChain Tool Calling Docs](https://docs.langchain.com/oss/javascript/langchain/tools)
- [Prisma TypeScript ORM](https://www.prisma.io/)
- [Amadeus Travel API](https://developers.amadeus.com/)
- Branch: `jeremy-multi-agent-testing`
