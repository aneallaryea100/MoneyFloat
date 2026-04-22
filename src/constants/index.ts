import { MomoNetwork } from '../types';

export const COLORS = {
  primary: '#FFD700',       // Gold - MTN MoMo yellow
  primaryDark: '#E6B800',
  secondary: '#1A1A2E',     // Dark navy
  accent: '#E94560',        // Red accent
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  textPrimary: '#1A1A2E',
  textSecondary: '#6C757D',
  textLight: '#FFFFFF',
  mtn: '#FFD700',
  telecel: '#E40000',
  airteltigo: '#FF6600',
};

export const NETWORK_COLORS: Record<MomoNetwork, string> = {
  MTN: '#FFD700',
  Telecel: '#E40000',
  AirtelTigo: '#FF6600',
};

// Ghana MoMo commission tiers (GHS) - approximate vendor rates
export const COMMISSION_RATES: Record<MomoNetwork, { min: number; max: number; rate: number }[]> = {
  MTN: [
    { min: 1, max: 50, rate: 0.01 },
    { min: 51, max: 300, rate: 0.009 },
    { min: 301, max: 1000, rate: 0.008 },
    { min: 1001, max: 5000, rate: 0.007 },
    { min: 5001, max: 99999, rate: 0.006 },
  ],
  Telecel: [
    { min: 1, max: 50, rate: 0.01 },
    { min: 51, max: 300, rate: 0.009 },
    { min: 301, max: 1000, rate: 0.008 },
    { min: 1001, max: 99999, rate: 0.007 },
  ],
  AirtelTigo: [
    { min: 1, max: 50, rate: 0.01 },
    { min: 51, max: 300, rate: 0.009 },
    { min: 301, max: 99999, rate: 0.008 },
  ],
};

export const NETWORKS: MomoNetwork[] = ['MTN', 'Telecel', 'AirtelTigo'];

export const formatCurrency = (amount: number): string => {
  return `GHS ${amount.toFixed(2)}`;
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
};

export const TODAY = (): string => new Date().toISOString().split('T')[0];
