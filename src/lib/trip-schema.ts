import { z } from "zod";

// Zod schema describing what the AI parser is allowed to extract from a
// natural-language trip description. Mirrors a partial TripInput.
//
// All fields optional — Claude only fills in what the user actually said.
export const ParsedTripSchema = z.object({
  location: z.string().optional(),
  groupSize: z.number().int().min(1).optional(),
  pairs: z.number().int().min(0).optional(),
  minBeds: z.number().int().min(1).optional(),

  stayType: z.enum(["houses", "hotels", "both"]).optional(),
  priority: z.enum(["value", "location", "vibe", "overall"]).optional(),

  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  budgetMode: z.enum(["total", "per_person"]).optional(),

  vibes: z
    .array(
      z.enum(["lively", "chill", "romantic", "family", "adventure", "party"]),
    )
    .optional(),

  checkIn: z.string().optional(),       // ISO date if user gave one
  checkOut: z.string().optional(),
  flexibleDates: z.boolean().optional(),
  // flexibleDuration is in the form but excluded from AI parsing to keep the schema
  // under Claude's 24 optional-param limit. Users pick duration manually in the UI.
  flexibleMonths: z.array(z.string()).optional(), // YYYY-MM strings

  hardFilters: z
    .object({
      noCouchBeds: z.boolean().optional(),
      noBunkBeds: z.boolean().optional(),
      minFullBaths: z.number().int().min(0).optional(),
      pool: z
        .array(
          z.enum([
            "indoor",
            "outdoor_in_ground",
            "outdoor_above_ground",
            "shared",
          ]),
        )
        .optional(),
      waterfrontRequired: z.boolean().optional(),
      privateWaterfrontAccess: z.boolean().optional(),
      renovatedOnly: z.boolean().optional(),
      maxMinutesToTown: z.number().int().min(0).optional(),
      allowCouchBeds: z.boolean().optional(),
    })
    .optional(),
});

export type ParsedTrip = z.infer<typeof ParsedTripSchema>;
