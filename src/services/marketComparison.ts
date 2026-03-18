export const dummy = {};
export async function calculateListCostByMarket(...args: any[]) { return { rankings: [], savings: 0 }; }
export async function getActiveSponsoredMarkets(...args: any[]) { return []; }
export async function trackAdImpression(...args: any[]) {}
export async function addPoints(...args: any[]) { return null; }
export async function checkAndAwardBadges(...args: any[]) {}
export async function getPricePrediction(...args: any[]) { return null; }
export async function trackProduct(...args: any[]) {}
export async function untrackProduct(...args: any[]) {}
export async function checkPromotions(...args: any[]) {}
export async function getActivePromotions(...args: any[]) { return []; }
export async function getTrackedProducts(...args: any[]) { return []; }
export async function getUserSavings(...args: any[]) { return { totalSaved: 0, monthlySavings: [] }; }
export async function addSavings(...args: any[]) {}
export async function updatePurchasePatterns(...args: any[]) {}
export async function getSmartBasketRecommendations(...args: any[]) { return []; }
export async function detectPromotion(...args: any[]) {}
export interface MarketComparisonResult { market: string; total: number; items: any[]; isSponsored?: boolean; }
export interface UserSavings { totalSaved: number; monthlySavings: any[]; total_saved?: number; saved_this_month?: number; saved_this_year?: number; }
export interface SmartBasketResult { recommendedMarket: string; total: number; savings: number; items: any[]; market?: string; isSponsored?: boolean; }
export async function calculateSmartBasketComparison(...args: any[]) { return null; }
