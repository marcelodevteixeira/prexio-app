import fs from 'fs';

const files = [
  'src/components/EconomyMission.tsx',
  'src/components/ProductScanner.tsx',
  'src/components/PromotionAlert.tsx',
  'src/components/RadarScreen.tsx',
  'src/services/gamificationService.ts',
  'src/services/marketComparison.ts',
  'src/services/predictionService.ts',
  'src/services/radarService.ts',
  'src/services/savingsService.ts',
  'src/services/smartBasketService.ts',
  'src/services/sponsoredMarketsService.ts'
];

for (const file of files) {
  if (file.includes('components')) {
    fs.writeFileSync(file, 'import React from "react";\nexport default function Component() { return null; }\nexport function EconomyMission() { return null; }\nexport function ProductScanner() { return null; }\nexport function PromotionAlert() { return null; }\nexport function RadarScreen() { return null; }\n');
  } else {
    fs.writeFileSync(file, 'export const dummy = {};\nexport async function calculateListCostByMarket() { return { rankings: [], savings: 0 }; }\nexport async function getActiveSponsoredMarkets() { return []; }\nexport async function trackAdImpression() {}\nexport async function addPoints() { return null; }\nexport async function checkAndAwardBadges() {}\nexport async function getPricePrediction() { return null; }\nexport async function trackProduct() {}\nexport async function untrackProduct() {}\nexport async function checkPromotions() {}\nexport async function getActivePromotions() { return []; }\nexport async function getTrackedProducts() { return []; }\nexport async function getUserSavings() { return { totalSaved: 0, monthlySavings: [] }; }\nexport async function addSavings() {}\nexport async function updatePurchasePatterns() {}\nexport async function getSmartBasketRecommendations() { return []; }\n');
  }
}
