/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Property {
  id: string;
  title: string;
  priceUsd: number;
  neighborhood: string;
  address: string;
  type: 'Casa' | 'Depto' | 'Lote';
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  imageUrl: string;
  hasIaStaging: boolean;
  featuredTag?: string;
  whatsappMessage: string;
}

export type PropertyTypeFilter = 'Todos' | 'Casa' | 'Depto' | 'Lote';

export interface LeadForm {
  address: string;
  type: 'Casa' | 'Depto' | 'Lote';
  phone: string;
  website_trap?: string; // Honeypot field
}

export interface ValuationResult {
  estimatedMin: number;
  estimatedMax: number;
  estimatedAverage: number;
  suggestedFeeUsd: number;
  classicFeeUsd: number;
  savingsUsd: number;
  marketTrend: 'up' | 'stable' | 'down';
  comparablePropertiesCount: number;
}
