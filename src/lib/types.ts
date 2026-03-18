export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  pointsTotal: number;
  level: string;
  city?: string;
  radarEnabled?: boolean;
  radarMaxDistance?: number; // in km
  radarCategories?: string[];
  favoriteItems?: string[];
  itemFrequencies?: Record<string, number>;
  shareAnonymizedData?: boolean;
}

export interface UserPurchasePattern {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  purchaseFrequency: number;
  lastPurchaseDate: string;
  averageQuantity: number;
}

export interface SponsoredMarket {
  id?: string;
  marketId: string;
  marketName: string;
  campaignStart: string;
  campaignEnd: string;
  priorityLevel: number;
  dailyBudget: number;
}

export interface MarketAdMetric {
  id?: string;
  marketId: string;
  views: number;
  clicks: number;
  date: string;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  source: 'manual' | 'list' | 'favorite' | 'frequent' | 'scan';
}

export interface Promotion {
  id: string;
  productId: string;
  productName: string;
  market: string;
  price: number;
  averagePrice: number;
  discountPercent: number;
  city: string;
  lat?: number;
  lng?: number;
  dateDetected: string;
  category?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  promotionId: string;
  title: string;
  body: string;
  sent: boolean;
  opened: boolean;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  dateEarned: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  goal: number;
  rewardPoints: number;
  type: 'receipt' | 'price' | 'product' | 'promotion';
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  lastUpdated: string;
}

export interface RankingEntry {
  userId: string;
  displayName: string;
  pointsTotal: number;
  city: string;
  level: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  itemCount: number;
  estimatedTotal: number;
  completed?: boolean;
}

export interface ListItem {
  id: string;
  listId: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  isBought: boolean;
  ean?: string;
  savingsApplied?: number;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  ean?: string;
}

export interface PriceRecord {
  id: string;
  productId: string;
  price: number;
  market: string;
  city: string;
  date: string;
  userId: string;
}
