// Google Analytics 4 event helpers
// Usage: import { trackSearch, trackListingClick, trackAffiliateClick } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

/** Track a trip search */
export function trackSearch(params: {
  location: string;
  groupSize: number;
  checkIn?: string;
  checkOut?: string;
  budgetMode?: string;
  budgetMin?: number;
  budgetMax?: number;
}) {
  gtag("event", "search", {
    search_term: params.location,
    group_size: params.groupSize,
    check_in: params.checkIn,
    check_out: params.checkOut,
    budget_mode: params.budgetMode,
    budget_min: params.budgetMin,
    budget_max: params.budgetMax,
  });
}

/** Track a listing card click */
export function trackListingClick(params: {
  listingId: string;
  listingName: string;
  source: string;
  price?: number;
}) {
  gtag("event", "select_item", {
    item_list_name: "search_results",
    items: [
      {
        item_id: params.listingId,
        item_name: params.listingName,
        item_brand: params.source,
        price: params.price,
      },
    ],
  });
}

/** Track an outbound affiliate link click */
export function trackAffiliateClick(params: {
  url: string;
  provider: string;
  listingName?: string;
}) {
  gtag("event", "affiliate_click", {
    link_url: params.url,
    provider: params.provider,
    listing_name: params.listingName,
  });
}

/** Track a page view (called automatically by GA, but available for SPAs) */
export function trackPageView(path: string) {
  gtag("event", "page_view", {
    page_path: path,
  });
}
