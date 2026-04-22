import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MomoNetwork } from '../types';
import { NETWORK_COLORS } from '../constants';

interface Props {
  network: MomoNetwork;
  size?: 'sm' | 'md';
}

export const NetworkBadge = ({ network, size = 'md' }: Props) => {
  const color = NETWORK_COLORS[network];
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]}>{network}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  smallText: {
    fontSize: 10,
  },
});
