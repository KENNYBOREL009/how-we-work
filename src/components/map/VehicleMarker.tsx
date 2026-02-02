import React from 'react';
import { Vehicle } from '@/hooks/useVehicles';

// Couleurs simplifiées : Taxi jaune vs VTC Confort violet
const DESTINATION_COLORS: Record<string, string> = {
  'default': '#FFD42F', // Jaune taxi classique
};

// Retourne la couleur selon le type de véhicule (simplifié)
const getDestinationColor = (destination: string | null, vehicleType?: string, rideMode?: string): string => {
  // VTC en mode confort partagé = violet
  if (rideMode === 'confort-partage') return '#8b5cf6';
  // Tous les taxis = jaune
  return '#FFD42F';
};

interface VehicleMarkerProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

/**
 * Crée le HTML du marqueur de véhicule style Uber/vue de dessus
 * avec coloration basée sur la destination
 */
export const createVehicleMarkerHTML = (vehicle: Vehicle): string => {
  const isSharedRide = vehicle.ride_mode === 'confort-partage';
  const heading = vehicle.heading || 0;
  const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
  
  // Couleur simplifiée : violet pour VTC partagé, jaune pour taxi
  const destinationColor = isSharedRide ? '#8b5cf6' : '#FFD42F';
  
  // Couleur de statut (remplissage)
  let statusColor = '#22c55e'; // Vert - Disponible
  if (availableSeats === 0) {
    statusColor = '#ef4444'; // Rouge - Plein
  } else if ((vehicle.current_passengers || 0) > 0) {
    statusColor = '#f59e0b'; // Orange - Partiel
  }

  return `
    <div class="vehicle-marker" style="
      position: relative;
      cursor: pointer;
      transform: rotate(${heading}deg);
      transition: transform 0.3s ease;
    ">
      <!-- Véhicule SVG vue de dessus style Uber -->
      <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
      ">
        <!-- Corps principal du véhicule -->
        <path d="
          M8 48
          C8 52 12 54 20 54
          C28 54 32 52 32 48
          L32 18
          C32 10 28 4 20 4
          C12 4 8 10 8 18
          L8 48
          Z
        " fill="${destinationColor}" stroke="#fff" stroke-width="2"/>
        
        <!-- Toit / Cabine -->
        <path d="
          M12 36
          L12 20
          C12 14 15 10 20 10
          C25 10 28 14 28 20
          L28 36
          C28 38 26 40 20 40
          C14 40 12 38 12 36
          Z
        " fill="${isSharedRide ? '#7c3aed' : '#1a1a2e'}" opacity="0.9"/>
        
        <!-- Pare-brise avant -->
        <path d="
          M14 18
          C14 14 16 11 20 11
          C24 11 26 14 26 18
          L26 24
          L14 24
          L14 18
          Z
        " fill="#87CEEB" opacity="0.6"/>
        
        <!-- Pare-brise arrière -->
        <rect x="14" y="32" width="12" height="6" rx="2" fill="#87CEEB" opacity="0.5"/>
        
        <!-- Phares avant -->
        <ellipse cx="12" cy="10" rx="2" ry="1.5" fill="#fff" opacity="0.9"/>
        <ellipse cx="28" cy="10" rx="2" ry="1.5" fill="#fff" opacity="0.9"/>
        
        <!-- Feux arrière -->
        <rect x="10" y="50" width="4" height="2" rx="1" fill="#ef4444"/>
        <rect x="26" y="50" width="4" height="2" rx="1" fill="#ef4444"/>
        
        <!-- Rétroviseurs -->
        <ellipse cx="6" cy="22" rx="2" ry="1.5" fill="${destinationColor}" stroke="#fff" stroke-width="1"/>
        <ellipse cx="34" cy="22" rx="2" ry="1.5" fill="${destinationColor}" stroke="#fff" stroke-width="1"/>
        
        ${isSharedRide ? `
          <!-- Badge VTC Partagé -->
          <circle cx="20" cy="28" r="6" fill="#8b5cf6" stroke="#fff" stroke-width="1.5"/>
          <text x="20" y="31" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">👥</text>
        ` : ''}
      </svg>
      
      <!-- Indicateur de statut -->
      <div style="
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        background: ${statusColor};
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${availableSeats > 0 ? 'animation: statusPulse 2s infinite;' : ''}
      "></div>
      
      ${isSharedRide && availableSeats > 0 ? `
        <!-- Badge places disponibles -->
        <div style="
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.5);
        ">${availableSeats}</div>
      ` : ''}
    </div>
    
    <style>
      @keyframes statusPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.15); }
      }
      .vehicle-marker:hover svg {
        transform: scale(1.1);
        transition: transform 0.2s ease;
      }
    </style>
  `;
};

/**
 * Crée le HTML de l'étiquette de destination flottante
 */
export const createDestinationLabelHTML = (vehicle: Vehicle): string => {
  const isSharedRide = vehicle.ride_mode === 'confort-partage';
  const destination = vehicle.destination;
  // Couleur simplifiée
  const destinationColor = isSharedRide ? '#8b5cf6' : '#FFD42F';
  
  if (!destination) return '';
  
  return `
    <div style="
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(-${vehicle.heading || 0}deg);
      margin-bottom: 8px;
      background: linear-gradient(135deg, ${destinationColor}, ${destinationColor}dd);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 8px;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      border: 2px solid rgba(255,255,255,0.8);
      animation: floatLabel 2.5s ease-in-out infinite;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    ">
      <span style="display: flex; align-items: center; gap: 3px;">
        ${isSharedRide ? '👥' : '📍'} ${destination}
      </span>
    </div>
    <div style="
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(-${vehicle.heading || 0}deg);
      margin-bottom: 2px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid ${destinationColor};
    "></div>
    
    <style>
      @keyframes floatLabel {
        0%, 100% { transform: translateX(-50%) translateY(0) rotate(-${vehicle.heading || 0}deg); }
        50% { transform: translateX(-50%) translateY(-3px) rotate(-${vehicle.heading || 0}deg); }
      }
    </style>
  `;
};

/**
 * Crée le marqueur complet avec label de destination
 */
export const createFullVehicleMarkerHTML = (vehicle: Vehicle): string => {
  const isSharedRide = vehicle.ride_mode === 'confort-partage';
  const heading = vehicle.heading || 0;
  const destination = vehicle.destination;
  const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
  
  // Couleur simplifiée : violet pour VTC partagé, jaune pour taxi
  const destinationColor = isSharedRide ? '#8b5cf6' : '#FFD42F';
  
  // Couleur de statut
  let statusColor = '#22c55e';
  if (availableSeats === 0) {
    statusColor = '#ef4444';
  } else if ((vehicle.current_passengers || 0) > 0) {
    statusColor = '#f59e0b';
  }

  return `
    <div class="full-vehicle-marker" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));
    ">
      ${destination ? `
        <!-- Label destination -->
        <div style="
          background: linear-gradient(135deg, ${destinationColor}, ${destinationColor}dd);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 1.5px solid rgba(255,255,255,0.9);
          margin-bottom: 4px;
          animation: floatBadge 2.5s ease-in-out infinite;
        ">
          ${isSharedRide ? '👥' : '🚕'} ${destination}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${destinationColor};
          margin-bottom: 2px;
        "></div>
      ` : ''}
      
      <!-- Véhicule -->
      <div style="
        position: relative;
        transform: rotate(${heading}deg);
        cursor: pointer;
      ">
        <svg width="36" height="50" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Corps principal -->
          <path d="
            M8 48
            C8 52 12 54 20 54
            C28 54 32 52 32 48
            L32 18
            C32 10 28 4 20 4
            C12 4 8 10 8 18
            L8 48
            Z
          " fill="${destinationColor}" stroke="#fff" stroke-width="2.5"/>
          
          <!-- Toit -->
          <path d="
            M12 36
            L12 20
            C12 14 15 10 20 10
            C25 10 28 14 28 20
            L28 36
            C28 38 26 40 20 40
            C14 40 12 38 12 36
            Z
          " fill="${isSharedRide ? '#6d28d9' : '#1f2937'}" opacity="0.95"/>
          
          <!-- Pare-brise avant -->
          <path d="
            M14 18
            C14 14 16 11 20 11
            C24 11 26 14 26 18
            L26 24
            L14 24
            L14 18
            Z
          " fill="#a5d8ff" opacity="0.7"/>
          
          <!-- Pare-brise arrière -->
          <rect x="14" y="32" width="12" height="5" rx="1.5" fill="#a5d8ff" opacity="0.6"/>
          
          <!-- Phares -->
          <ellipse cx="12" cy="9" rx="2.5" ry="1.5" fill="#fef08a"/>
          <ellipse cx="28" cy="9" rx="2.5" ry="1.5" fill="#fef08a"/>
          
          <!-- Feux arrière -->
          <rect x="10" y="50" width="4" height="2" rx="1" fill="#fca5a5"/>
          <rect x="26" y="50" width="4" height="2" rx="1" fill="#fca5a5"/>
          
          <!-- Rétroviseurs -->
          <ellipse cx="5" cy="22" rx="2.5" ry="1.5" fill="${destinationColor}" stroke="#fff" stroke-width="1"/>
          <ellipse cx="35" cy="22" rx="2.5" ry="1.5" fill="${destinationColor}" stroke="#fff" stroke-width="1"/>
        </svg>
        
        <!-- Indicateur statut -->
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: ${statusColor};
          border: 2px solid #fff;
          border-radius: 50%;
          ${availableSeats > 0 ? 'animation: pulse 2s infinite;' : ''}
        "></div>
        
        ${isSharedRide && availableSeats > 0 ? `
          <div style="
            position: absolute;
            bottom: 2px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #22c55e;
            color: #fff;
            font-size: 9px;
            font-weight: bold;
            border: 2px solid #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${availableSeats}</div>
        ` : ''}
      </div>
      
      ${!destination ? `
        <div style="
          margin-top: 4px;
          background: ${statusColor};
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        ">
          ${availableSeats === 0 ? 'Plein' : 'Libre'}
        </div>
      ` : ''}
    </div>
    
    <style>
      @keyframes floatBadge {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .full-vehicle-marker:hover svg {
        filter: brightness(1.1);
      }
    </style>
  `;
};

export { getDestinationColor, DESTINATION_COLORS };
