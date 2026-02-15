import { useState, useCallback } from 'react';
import { TrafficPrediction } from './useTrafficIntelligence';

// Simulated AI predictions for Douala zones
const MOCK_PREDICTIONS: TrafficPrediction[] = [
  {
    zone_name: 'Ndokoti',
    zone_lat: 4.0450,
    zone_lng: 9.7350,
    predicted_demand: 87,
    confidence: 0.92,
    peak_time: '07:30',
    reason: 'Heure de pointe matinale - forte affluence scolaire et professionnelle',
  },
  {
    zone_name: 'Akwa Centre',
    zone_lat: 4.0511,
    zone_lng: 9.6943,
    predicted_demand: 75,
    confidence: 0.88,
    peak_time: '08:00',
    reason: 'Zone commerciale - arrivée des travailleurs',
  },
  {
    zone_name: 'Bonabéri Gare',
    zone_lat: 4.0780,
    zone_lng: 9.6650,
    predicted_demand: 68,
    confidence: 0.85,
    peak_time: '07:15',
    reason: 'Transit inter-rive - forte demande vers Akwa/Ndokoti',
  },
  {
    zone_name: 'Deido',
    zone_lat: 4.0620,
    zone_lng: 9.6870,
    predicted_demand: 55,
    confidence: 0.78,
    peak_time: '07:45',
    reason: 'Zone résidentielle - départs matinaux',
  },
  {
    zone_name: 'Bessengue',
    zone_lat: 4.0560,
    zone_lng: 9.6780,
    predicted_demand: 42,
    confidence: 0.72,
    peak_time: '08:15',
    reason: 'Demande modérée - flux secondaire',
  },
  {
    zone_name: 'Bépanda',
    zone_lat: 4.0380,
    zone_lng: 9.7200,
    predicted_demand: 63,
    confidence: 0.81,
    peak_time: '07:00',
    reason: 'Marché de Bépanda - affluence commerciale',
  },
];

// Simulated revenue entries for the driver
export interface BusRevenueEntry {
  id: string;
  time: string;
  type: 'cash' | 'wallet' | 'qr_code' | 'code' | 'reservation';
  passengerName?: string;
  amount: number;
  ticketCount: number;
  stopName: string;
  paymentCode?: string;
}

const MOCK_REVENUE_ENTRIES: BusRevenueEntry[] = [
  { id: '1', time: '06:05', type: 'cash', amount: 500, ticketCount: 2, stopName: 'Akwa Gare', passengerName: 'Anonyme' },
  { id: '2', time: '06:08', type: 'wallet', amount: 200, ticketCount: 1, stopName: 'Akwa Gare', passengerName: 'Jean Kamga' },
  { id: '3', time: '06:10', type: 'qr_code', amount: 600, ticketCount: 3, stopName: 'Akwa Gare', passengerName: 'Marie Onana', paymentCode: 'QR-4829' },
  { id: '4', time: '06:18', type: 'code', amount: 200, ticketCount: 1, stopName: 'Ndokoti', passengerName: 'Paul Etoga', paymentCode: '482916' },
  { id: '5', time: '06:20', type: 'wallet', amount: 400, ticketCount: 2, stopName: 'Ndokoti', passengerName: 'Aminatou B.' },
  { id: '6', time: '06:22', type: 'reservation', amount: 300, ticketCount: 1, stopName: 'Ndokoti', passengerName: 'David Ngo' },
  { id: '7', time: '06:25', type: 'cash', amount: 1000, ticketCount: 5, stopName: 'Ndokoti', passengerName: 'Groupe' },
  { id: '8', time: '06:30', type: 'qr_code', amount: 200, ticketCount: 1, stopName: 'Deido', passengerName: 'Sandrine M.', paymentCode: 'QR-5031' },
];

export const useMockTrafficData = () => {
  const [mockPredictions, setMockPredictions] = useState<TrafficPrediction[]>([]);
  const [revenueEntries] = useState<BusRevenueEntry[]>(MOCK_REVENUE_ENTRIES);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateTrafficAnalysis = useCallback(async (): Promise<TrafficPrediction[]> => {
    setIsSimulating(true);
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 2000));
    
    // Add slight randomness to predictions
    const randomized = MOCK_PREDICTIONS.map(p => ({
      ...p,
      predicted_demand: Math.min(100, Math.max(10, p.predicted_demand + Math.floor(Math.random() * 20 - 10))),
      confidence: Math.min(0.99, Math.max(0.5, p.confidence + (Math.random() * 0.1 - 0.05))),
    }));
    
    setMockPredictions(randomized);
    setIsSimulating(false);
    return randomized;
  }, []);

  const totalRevenue = revenueEntries.reduce((sum, e) => sum + e.amount, 0);
  const cashRevenue = revenueEntries.filter(e => e.type === 'cash').reduce((sum, e) => sum + e.amount, 0);
  const digitalRevenue = totalRevenue - cashRevenue;

  return {
    mockPredictions,
    revenueEntries,
    isSimulating,
    simulateTrafficAnalysis,
    totalMockRevenue: totalRevenue,
    cashRevenue,
    digitalRevenue,
  };
};
