import { Vehicle } from '@/hooks/useVehicles';

/**
 * Creates realistic bus marker HTML for Mapbox
 */
export const createBusMarkerHTML = (vehicle: Vehicle): string => {
  const heading = vehicle.heading || 0;
  const currentPassengers = vehicle.current_passengers || 0;
  const capacity = vehicle.capacity || 70;
  const fillPercent = Math.round((currentPassengers / capacity) * 100);
  const availableSeats = capacity - currentPassengers;

  // Status color
  let statusColor = '#22c55e'; // Green - available
  let statusLabel = 'En service';
  if (availableSeats === 0) {
    statusColor = '#ef4444';
    statusLabel = 'Complet';
  } else if (fillPercent > 70) {
    statusColor = '#f59e0b';
    statusLabel = 'Presque plein';
  }

  const operatorLabel = vehicle.operator || 'SOCATUR';

  return `
    <div class="bus-marker-container" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 6px 16px rgba(0,0,0,0.45));
      cursor: pointer;
    ">
      ${vehicle.destination ? `
        <div style="
          background: linear-gradient(135deg, #414042, #2d2d2f);
          color: #FFD42F;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 2px solid #FFD42F;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          animation: busFloat 3s ease-in-out infinite;
        ">→ ${vehicle.destination}</div>
        <div style="
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #FFD42F;
          margin-bottom: 2px;
        "></div>
      ` : ''}
      
      <div style="
        position: relative;
        transform: rotate(${heading}deg);
        transition: transform 0.5s ease;
      ">
        <!-- Bus SVG réaliste vue de dessus -->
        <svg width="32" height="64" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Ombre portée -->
          <ellipse cx="20" cy="78" rx="14" ry="3" fill="rgba(0,0,0,0.2)"/>
          
          <!-- Corps principal du bus -->
          <rect x="4" y="8" width="32" height="62" rx="6" fill="#FFD42F" stroke="#414042" stroke-width="2"/>
          
          <!-- Bande latérale opérateur -->
          <rect x="4" y="30" width="32" height="8" fill="#414042" opacity="0.85"/>
          <text x="20" y="36" text-anchor="middle" fill="#FFD42F" font-size="5" font-weight="bold" font-family="sans-serif">${operatorLabel}</text>
          
          <!-- Pare-brise avant (grand, réaliste) -->
          <rect x="8" y="10" width="24" height="14" rx="3" fill="#87CEEB" opacity="0.75" stroke="#414042" stroke-width="0.8"/>
          <!-- Reflet pare-brise -->
          <rect x="10" y="12" width="8" height="6" rx="1" fill="#fff" opacity="0.25"/>
          
          <!-- Rangées de fenêtres passagers -->
          <rect x="7" y="28" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="7" y="40" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="7" y="48" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="7" y="56" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          
          <rect x="28" y="28" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="28" y="40" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="28" y="48" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          <rect x="28" y="56" width="5" height="4" rx="1" fill="#a5d8ff" opacity="0.65"/>
          
          <!-- Pare-brise arrière -->
          <rect x="10" y="62" width="20" height="6" rx="2" fill="#a5d8ff" opacity="0.55" stroke="#414042" stroke-width="0.5"/>
          
          <!-- Phares avant -->
          <rect x="6" y="8" width="6" height="3" rx="1.5" fill="#fef08a" opacity="0.95"/>
          <rect x="28" y="8" width="6" height="3" rx="1.5" fill="#fef08a" opacity="0.95"/>
          
          <!-- Feux arrière -->
          <rect x="6" y="67" width="5" height="2.5" rx="1" fill="#ef4444" opacity="0.9"/>
          <rect x="29" y="67" width="5" height="2.5" rx="1" fill="#ef4444" opacity="0.9"/>
          
          <!-- Clignotants arrière -->
          <rect x="6" y="64.5" width="5" height="2" rx="0.8" fill="#f59e0b" opacity="0.7"/>
          <rect x="29" y="64.5" width="5" height="2" rx="0.8" fill="#f59e0b" opacity="0.7"/>
          
          <!-- Rétroviseurs -->
          <ellipse cx="2" cy="18" rx="2.5" ry="1.5" fill="#414042" stroke="#FFD42F" stroke-width="0.8"/>
          <ellipse cx="38" cy="18" rx="2.5" ry="1.5" fill="#414042" stroke="#FFD42F" stroke-width="0.8"/>
          
          <!-- Toit / climatisation -->
          <rect x="12" y="14" width="16" height="3" rx="1.5" fill="#414042" opacity="0.4"/>
          
          <!-- Porte avant -->
          <rect x="4" y="22" width="2" height="6" rx="1" fill="#414042" opacity="0.6"/>
          
          <!-- Porte milieu -->
          <rect x="4" y="44" width="2" height="8" rx="1" fill="#414042" opacity="0.6"/>
        </svg>
        
        <!-- Indicateur statut -->
        <div style="
          position: absolute;
          top: -3px;
          right: -3px;
          width: 14px;
          height: 14px;
          background: ${statusColor};
          border: 2.5px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ${availableSeats > 0 ? 'animation: busPulse 2s infinite;' : ''}
        "></div>
        
        <!-- Badge passagers -->
        <div style="
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%) rotate(-${heading}deg);
          background: ${statusColor};
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          border: 1.5px solid #fff;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${currentPassengers}/${capacity}</div>
      </div>
    </div>
    
    <style>
      @keyframes busPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
      @keyframes busFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .bus-marker-container:hover svg {
        filter: brightness(1.15);
        transition: filter 0.2s ease;
      }
    </style>
  `;
};
