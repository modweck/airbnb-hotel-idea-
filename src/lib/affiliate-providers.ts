export const TP_PROVIDER_IDS: Record<string, number> = {
  "booking.com": 4115,
  "www.booking.com": 4115,
  "secure.booking.com": 4115,
  "m.booking.com": 4115,

  "hotels.com": 4034,
  "www.hotels.com": 4034,
  "m.hotels.com": 4034,

  "vrbo.com": 4499,
  "www.vrbo.com": 4499,

  "expedia.com": 4114,
  "www.expedia.com": 4114,
  "m.expedia.com": 4114,

  "hotellook.com": 5210,
  "www.hotellook.com": 5210,
};

// Hosts we deliberately do NOT wrap -- no affiliate program yet, or
// known to leak attribution. Silent passthrough (no warn).
// Airbnb will move to TP_PROVIDER_IDS after #94 (Stay22 pivot).
export const KNOWN_UNAFFILIATED = new Set<string>([
  "airbnb.com",
  "www.airbnb.com",
]);

// Hosts that act as redirectors to the real destination. We try to
// extract the underlying URL from a query param before deciding.
export const KNOWN_INTERMEDIARIES = new Set<string>([
  "google.com",
  "www.google.com",
  "googleadservices.com",
  "www.googleadservices.com",
]);

// Hosts of known affiliate-wrap endpoints. If the input is already
// pointing at one of these, it's already wrapped -- passthrough.
export const KNOWN_AFFILIATE_HOSTS = new Set<string>([
  "tp.media",
  "stay22.com",
  "www.stay22.com",
]);

export const MAX_UNWRAP_DEPTH = 3;
