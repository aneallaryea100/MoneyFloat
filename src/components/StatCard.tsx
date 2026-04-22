import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

export const StatCard = ({ label, value, color = COLORS.primary, sub }: Props) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    {sub ? <Text style={styles.sub}>{sub}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flex: 1,
    minWidth: 140,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
