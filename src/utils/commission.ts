import { MomoNetwork } from '../types';
import { COMMISSION_RATES } from '../constants';

export const calculateCommission = (amount: number, network: MomoNetwork): number => {
  const tiers = COMMISSION_RATES[network];
  const tier = tiers.find(t => amount >= t.min && amount <= t.max);
  if (!tier) return 0;
  return parseFloat((amount * tier.rate).toFixed(2));
};

export const generateReference = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MF-${ts}-${rand}`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
