/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property } from './types';

export const CORDOBA_NEIGHBORHOODS = [
  'Nueva Córdoba',
  'Cerro de las Rosas',
  'Villa Belgrano',
  'General Paz',
  'La Calera / Countries',
  'Manantiales',
  'Urca'
];

export const PROPERTIES_DATA: Property[] = [
  {
    id: 'prop-1',
    title: 'Residencia de Diseño Minimalista',
    priceUsd: 295000,
    neighborhood: 'Villa Belgrano',
    address: 'Av. Laplace 5100, Villa Belgrano',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 4,
    areaSqm: 310,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: true,
    featuredTag: 'Estreno / Premium',
    whatsappMessage: 'Hola! Me interesa la Residencia de Diseño en Villa Belgrano (USD 295,000).'
  },
  {
    id: 'prop-2',
    title: 'Semipiso Exclusivo con Terraza y Parrilla',
    priceUsd: 125000,
    neighborhood: 'Nueva Córdoba',
    address: 'Bv. Chacabuco 1100, Nueva Córdoba',
    type: 'Depto',
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 88,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: true,
    featuredTag: 'Ideal Inversor',
    whatsappMessage: 'Hola! Me interesa el Semipiso Exclusivo en Nueva Córdoba (USD 125,000).'
  },
  {
    id: 'prop-3',
    title: 'Casa de Lujo en Colinas de la Calera',
    priceUsd: 380000,
    neighborhood: 'La Calera / Countries',
    address: 'Country La Cuesta, La Calera',
    type: 'Casa',
    bedrooms: 4,
    bathrooms: 5,
    areaSqm: 420,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: false,
    featuredTag: 'Vista Panorámica',
    whatsappMessage: 'Hola! Me interesa la Casa de Lujo en La Cuesta, La Calera (USD 380,000).'
  },
  {
    id: 'prop-4',
    title: 'Penthouse en Edificio Premium',
    priceUsd: 145000,
    neighborhood: 'General Paz',
    address: 'Av. 24 de Septiembre 1400, General Paz',
    type: 'Depto',
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 115,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: true,
    featuredTag: 'Financiación Privada',
    whatsappMessage: 'Hola! Me interesa el Penthouse Premium en General Paz (USD 145,000).'
  },
  {
    id: 'prop-5',
    title: 'Casa Contemporánea en Manantiales II',
    priceUsd: 215000,
    neighborhood: 'Manantiales',
    address: 'Country Quebradas, Manantiales',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 240,
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: false,
    featuredTag: 'Oportunidad',
    whatsappMessage: 'Hola! Me interesa la Casa Contemporánea en Manantiales (USD 215,000).'
  },
  {
    id: 'prop-6',
    title: 'Duplex Exclusivo con Amenities',
    priceUsd: 185000,
    neighborhood: 'Urca',
    address: 'Emilio Lamarca 3900, Urca',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 195,
    imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
    hasIaStaging: true,
    featuredTag: 'Excelente Ubicación',
    whatsappMessage: 'Hola! Me interesa el Duplex en Urca (USD 185,000).'
  }
];
