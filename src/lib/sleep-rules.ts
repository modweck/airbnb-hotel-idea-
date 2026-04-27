import type { BedCount } from "@/lib/types";

// Bed truth, the simple, honest version:
//
//   - A couple (2 people sharing) needs ONE couple-capable bed:
//       king, queen, or double.
//   - A single (1 person sleeping alone) needs ONE bed of any size:
//       king, queen, double, twin, or bunk level.
//   - Couches are NOT real beds — only counted when the user opts in
//     via allowCouchBeds.
//
// No "3 in a king" math. No "max 2 per bed" toggle. Either every couple
// has a couple-capable bed and every single has a bed, or it doesn't fit.

/** Beds large enough for a couple to share (king/queen/double). */
export function coupleCapableBeds(beds: BedCount, allowCouches = false): number {
  return beds.king + beds.queen + beds.double + (allowCouches ? beds.couch : 0);
}

/** All real sleeping spots (excludes couches by default). */
export function totalRealBeds(beds: BedCount, allowCouches = false): number {
  return (
    beds.king +
    beds.queen +
    beds.double +
    beds.twin +
    beds.bunkLevel +
    (allowCouches ? beds.couch : 0)
  );
}

/** Beds needed for a group with a given number of pairs. */
export function bedsNeededFor(groupSize: number, pairs = 0): number {
  const singles = Math.max(0, groupSize - 2 * pairs);
  return pairs + singles;
}

/**
 * Maximum people who can sleep comfortably in this listing.
 * Assumes pairs take couple-capable beds first; everyone else takes one bed each.
 */
export function comfortableCapacity(
  beds: BedCount,
  pairs = 0,
  allowCouches = false,
): number {
  const cc = coupleCapableBeds(beds, allowCouches);
  const total = totalRealBeds(beds, allowCouches);
  const pairsAccommodated = Math.min(pairs, cc);
  const remainingBeds = total - pairsAccommodated;
  return pairsAccommodated * 2 + remainingBeds;
}

/** True if the group fits without anyone sharing a bed they shouldn't. */
export function fitsGroup(
  beds: BedCount,
  groupSize: number,
  pairs = 0,
  allowCouches = false,
): boolean {
  const cc = coupleCapableBeds(beds, allowCouches);
  if (cc < pairs) return false;                // not enough big beds for the pairs
  const needed = bedsNeededFor(groupSize, pairs);
  return totalRealBeds(beds, allowCouches) >= needed;
}

/** "2 kings, 3 queens, 1 twin" — for "why" cards on the results page. */
export function bedSummary(beds: BedCount, allowCouches = false): string {
  const parts: string[] = [];
  const push = (count: number, singular: string, plural: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
  };
  push(beds.king, "king", "kings");
  push(beds.queen, "queen", "queens");
  push(beds.double, "double", "doubles");
  push(beds.twin, "twin", "twins");
  push(beds.bunkLevel, "bunk", "bunks");
  if (allowCouches) push(beds.couch, "couch bed", "couch beds");
  return parts.join(", ") || "no real beds";
}

// =====================================================================
// Hotel Optimizer (feature 13) — same rules drive room configurations.
// =====================================================================

export interface HotelRoomOption {
  /** e.g. "King" or "Two Queens" — what the listing calls this room type */
  label: string;
  beds: BedCount;
  pricePerNight: number;
}

export interface HotelConfig {
  rooms: { option: HotelRoomOption; count: number }[];
  totalPeople: number;
  totalPerNight: number;
}

/**
 * Greedy room-pack: pick highest-capacity rooms first until the group fits.
 * Each room is rated by how many of *this group's* people it can sleep
 * (so a King counts for 2 if there's still a couple to place, otherwise 1).
 *
 * Good enough for v1; replace with proper bin-pack later if needed.
 */
export function optimizeHotelRooms(
  options: HotelRoomOption[],
  groupSize: number,
  pairs = 0,
  allowCouches = false,
): HotelConfig | null {
  let remainingPeople = groupSize;
  let remainingCouples = pairs;

  function valueFor(opt: HotelRoomOption): number {
    if (remainingCouples > 0 && coupleCapableBeds(opt.beds, allowCouches) > 0) {
      // This room can take a couple — score by how many people it sleeps for the couple
      return Math.min(2, remainingPeople);
    }
    return Math.min(1, remainingPeople);
  }

  const config: HotelConfig = {
    rooms: [],
    totalPeople: 0,
    totalPerNight: 0,
  };

  // Greedy: at each step, pick the room option with the highest current value.
  while (remainingPeople > 0) {
    const ranked = [...options]
      .map((opt) => ({ opt, val: valueFor(opt) }))
      .filter(({ val }) => val > 0)
      .sort((a, b) => b.val - a.val || a.opt.pricePerNight - b.opt.pricePerNight);

    if (ranked.length === 0) return null;
    const { opt, val } = ranked[0];

    const existing = config.rooms.find((r) => r.option.label === opt.label);
    if (existing) existing.count += 1;
    else config.rooms.push({ option: opt, count: 1 });

    config.totalPerNight += opt.pricePerNight;
    config.totalPeople += val;
    remainingPeople -= val;
    if (val === 2) remainingCouples = Math.max(0, remainingCouples - 1);
  }

  return config;
}
