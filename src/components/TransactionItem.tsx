import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { COLORS, formatCurrency, formatTime } from '../constants';
import { NetworkBadge } from './NetworkBadge';

interface Props {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction: t }: Props) => {
  const isDeposit = t.type === 'deposit';
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: isDeposit ? COLORS.success + '22' : COLORS.danger + '22' }]}>
        <Ionicons
          name={isDeposit ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={isDeposit ? COLORS.success : COLORS.danger}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.type}>{isDeposit ? 'Deposit' : 'Withdrawal'}</Text>
          <NetworkBadge network={t.network} size="sm" />
        </View>
        <Text style={styles.phone}>{t.customerPhone}</Text>
        <Text style={styles.ref}>{t.reference}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isDeposit ? COLORS.success : COLORS.danger }]}>
          {isDeposit ? '+' : '-'}{formatCurrency(t.amount)}
        </Text>
        <Text style={styles.time}>{formatTime(t.createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  phone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ref: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
