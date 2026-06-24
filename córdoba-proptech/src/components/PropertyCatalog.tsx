/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Home,
  DollarSign,
  Maximize2,
  Bed,
  Bath,
  MessageSquare,
  Sparkles,
  Calendar,
  CheckCircle2,
  Bookmark,
  MapPin
} from 'lucide-react';
import { Property, PropertyTypeFilter } from '../types';
import { PROPERTIES_DATA, CORDOBA_NEIGHBORHOODS } from '../data';

export default function PropertyCatalog() {
  // Filter States
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<PropertyTypeFilter>('Todos');
  const [maxPrice, setMaxPrice] = useState<number>(400000);
  const [minRooms, setMinRooms] = useState<number>(0);
  
  // Booked virtual tours tracking state
  const [bookedTours, setBookedTours] = useState<Record<string, boolean>>({});
  // Saved properties state
  const [savedProps, setSavedProps] = useState<Record<string, boolean>>({});

  // Reset filters
  const resetFilters = () => {
    setSelectedNeighborhood('Todos');
    setSelectedType('Todos');
    setMaxPrice(400000);
    setMinRooms(0);
  };

  // Filter properties logic
  const filteredProperties = useMemo(() => {
    return PROPERTIES_DATA.filter((prop) => {
      // Neighborhood filter
      if (selectedNeighborhood !== 'Todos' && prop.neighborhood !== selectedNeighborhood) {
        return false;
      }
      // Type filter
      if (selectedType !== 'Todos' && prop.type !== selectedType) {
        return false;
      }
      // Price filter
      if (prop.priceUsd > maxPrice) {
        return false;
      }
      // Bedrooms filter
      if (minRooms > 0 && prop.bedrooms < minRooms) {
        return false;
      }
      return true;
    });
  }, [selectedNeighborhood, selectedType, maxPrice, minRooms]);

  // Format price
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const toggleBookTour = (propId: string) => {
    setBookedTours((prev) => ({
      ...prev,
      [propId]: !prev[propId]
    }));
  };

  const toggleSaveProperty = (propId: string) => {
    setSavedProps((prev) => ({
      ...prev,
      [propId]: !prev[propId]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-outfit font-extrabold text-white flex items-center gap-2">
            <span>Catálogo de Propiedades Exclusivas</span>
            <span className="text-xs font-normal font-mono bg-white text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded-full">
              {filteredProperties.length} disponibles
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Encontrá tu próximo hogar en Córdoba con tasación algorítmica y visitas virtuales inmersivas.
          </p>
        </div>

        {/* Reset filters shortcut button */}
        {(selectedNeighborhood !== 'Todos' || selectedType !== 'Todos' || maxPrice < 400000 || minRooms > 0) && (
          <button
            onClick={resetFilters}
            className="text-xs text-blue-500 hover:text-blue-300 font-semibold underline underline-offset-4 self-start md:self-auto"
          >
            Limpiar filtros aplicados
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Barrio Filter */}
          <div>
            <label htmlFor="filter-barrio" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Barrio
            </label>
            <select
              id="filter-barrio"
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos los Barrios</option>
              {CORDOBA_NEIGHBORHOODS.map((nb) => (
                <option key={nb} value={nb}>
                  {nb}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Propiedad Filter */}
          <div>
            <label htmlFor="filter-tipo" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-400" /> Tipo
            </label>
            <select
              id="filter-tipo"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Casa">Casa</option>
              <option value="Depto">Departamento</option>
              <option value="Lote">Lote</option>
            </select>
          </div>

          {/* Precio Máximo Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="filter-precio" className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Presupuesto Máximo
              </label>
              <span className="text-xs font-mono font-bold text-blue-500">{formatUSD(maxPrice)}</span>
            </div>
            <input
              type="range"
              id="filter-precio"
              min="100000"
              max="400000"
              step="10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Ambientes / Dormitorios Filter */}
          <div>
            <label htmlFor="filter-ambientes" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" /> Dormitorios Mínimos
            </label>
            <div className="flex gap-1.5">
              {[0, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMinRooms(num)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    minRooms === num
                      ? 'bg-blue-500 border-blue-700 text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-100 hover:border-brand-navy-700'
                  }`}
                >
                  {num === 0 ? 'Cualquiera' : `${num}+`}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* CATALOG GRID */}
      {filteredProperties.length > 0 ? (
        <div id="property-catalog-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => {
            const isTourBooked = !!bookedTours[prop.id];
            const isSaved = !!savedProps[prop.id];

            return (
              <div
                key={prop.id}
                className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image Container with overlays */}
                <div className="relative h-48 overflow-hidden bg-slate-50">
                  <img
                    src={prop.imageUrl}
                    alt={prop.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950 via-brand-navy-950/20 to-transparent" />

                  {/* Absolute Badge: CPCPI / Tag */}
                  {prop.featuredTag && (
                    <span className="absolute top-3 left-3 bg-slate-50/90 border border-slate-200 text-[9px] text-blue-500 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                      {prop.featuredTag}
                    </span>
                  )}

                  {/* STRICT REQUIREMENT: "Home Staging por IA" in Cobalt Blue/Gold */}
                  {prop.hasIaStaging && (
                    <div
                      id={`staging-badge-${prop.id}`}
                      className="absolute top-3 right-3 bg-blue-500 text-white border border-blue-500/40 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-blue-500/20"
                    >
                      <Sparkles className="w-3 h-3 text-blue-200 animate-pulse" />
                      <span>Home Staging por IA</span>
                    </div>
                  )}

                  {/* Save/Favorite toggle icon button */}
                  <button
                    onClick={() => toggleSaveProperty(prop.id)}
                    className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-slate-50/70 border border-slate-200 flex items-center justify-center text-slate-350 hover:text-white transition-colors"
                    title={isSaved ? 'Quitar de Favoritos' : 'Guardar Propiedad'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-500 text-blue-500' : ''}`} />
                  </button>

                  {/* STRICT REQUIREMENT: Floating action button: WhatsApp icon to trigger visits */}
                  <a
                    href={`https://wa.me/5493510000000?text=${encodeURIComponent(prop.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all z-10"
                    title="Agendar visita inmediata por WhatsApp"
                  >
                    <MessageSquare className="w-5 h-5 fill-white" />
                  </a>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{prop.neighborhood}</span>
                    </div>
                    
                    <h4 className="text-sm font-outfit font-extrabold text-white leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                      {prop.title}
                    </h4>
                    
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {prop.address}
                    </p>
                  </div>

                  {/* SPEC ICONS: Area, Rooms, Bathrooms */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-slate-400 text-xs">
                    <div className="flex items-center gap-1 justify-center bg-slate-50/50 py-1 rounded" title="Superficie total">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{prop.areaSqm}m²</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center bg-slate-50/50 py-1 rounded" title="Dormitorios">
                      <Bed className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{prop.bedrooms} Dorm.</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center bg-slate-50/50 py-1 rounded" title="Baños">
                      <Bath className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{prop.bathrooms} Baños</span>
                    </div>
                  </div>

                  {/* Card Footer: Price + Secondary CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Tasación Algorítmica</span>
                      <span className="text-lg font-mono font-black text-white tracking-tight">
                        {formatUSD(prop.priceUsd)}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleBookTour(prop.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isTourBooked
                          ? 'bg-blue-900 text-blue-500 border border-blue-500/30'
                          : 'bg-slate-50 hover:bg-brand-navy-800 text-slate-800 hover:text-white border border-slate-200'
                      }`}
                    >
                      {isTourBooked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>¡Tour Reservado!</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar Tour Virtual</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white/50 border border-slate-200 rounded-2xl space-y-3">
          <SlidersHorizontal className="w-12 h-12 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">No se encontraron propiedades</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Probá ajustando el presupuesto máximo, cambiando el barrio o la cantidad de dormitorios mínimos para encontrar coincidencias.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 text-xs font-semibold transition-all"
          >
            Ver Todas las Propiedades
          </button>
        </div>
      )}
    </div>
  );
}
