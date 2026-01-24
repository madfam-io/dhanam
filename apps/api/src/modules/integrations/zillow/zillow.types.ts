/**
 * Zillow API Types
 * Based on Zillow's Property API (Zestimate, Property Details)
 */

export interface ZillowPropertyAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  country?: string;
}

export interface ZillowZestimate {
  amount: number;
  currency: string;
  lastUpdated: string;
  lowEstimate?: number;
  highEstimate?: number;
  valueChange30Day?: number;
  valueChangePct30Day?: number;
}

export interface ZillowRentalEstimate {
  amount: number;
  currency: string;
  lastUpdated: string;
  lowEstimate?: number;
  highEstimate?: number;
}

export interface ZillowPropertyDetails {
  zpid: string;
  address: ZillowPropertyAddress;
  zestimate?: ZillowZestimate;
  rentZestimate?: ZillowRentalEstimate;
  propertyType?: string;
  yearBuilt?: number;
  lotSize?: number;
  livingArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  lastSoldDate?: string;
  lastSoldPrice?: number;
  taxAssessedValue?: number;
  taxAssessedYear?: number;
  imageUrl?: string;
  homeStatus?: string;
  latitude?: number;
  longitude?: number;
}

export interface ZillowSearchResult {
  zpid: string;
  address: ZillowPropertyAddress;
  price?: number;
  zestimate?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  imageUrl?: string;
}

export interface ZillowApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PropertyValuationResult {
  zpid: string;
  address: string;
  zestimate: number;
  zestimateLow: number;
  zestimateHigh: number;
  rentEstimate?: number;
  lastUpdated: Date;
  valueChange30Day?: number;
  propertyDetails: {
    propertyType?: string;
    yearBuilt?: number;
    lotSize?: number;
    livingArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    lastSoldDate?: string;
    lastSoldPrice?: number;
  };
}

export interface AddressLookupResult {
  found: boolean;
  zpid?: string;
  formattedAddress?: string;
  suggestions?: Array<{
    address: string;
    zpid: string;
  }>;
}

export interface ZillowConfig {
  apiKey: string;
  baseUrl: string;
  rateLimitPerMinute: number;
  cacheEnabled: boolean;
  cacheTtlHours: number;
}
