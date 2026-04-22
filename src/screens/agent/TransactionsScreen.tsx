import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { getTransactionsBySession } from '../../db/database';
import { COLORS } from '../../constants';
import { Transaction, TransactionType } from '../../types';
import { TransactionItem } from '../../components/TransactionItem';

export const TransactionsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { activeSession } = useSession();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    if (activeSession) {
      setTxns(getTransactionsBySession(activeSession.id));
    }
  }, [activeSession]));

  const filtered = txns.filter(t => {
    const matchType = filter === 'all' || t.type === filter;
    const matchSearch = !search || t.customerPhone.includes(search) || t.reference.includes(search.toUpperCase());
    return matchType && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phone or reference..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        <View style={styles.filterRow}>
          {(['all', 'deposit', 'withdrawal'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary, padding: 20, paddingTop: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textLight },
  headerCount: {
    backgroundColor: COLORS.primary, color: COLORS.secondary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    fontSize: 13, fontWeight: '700',
  },
  controls: { padding: 16, backgroundColor: COLORS.surface },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 10, backgroundColor: COLORS.background,
  },
  searchInput: { flex: 1, height: 42, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterBtnTextActive: { color: COLORS.textLight },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textSecondary, marginTop: 10, fontSize: 15 },
});
