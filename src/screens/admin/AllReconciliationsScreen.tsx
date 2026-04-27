import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  getReconciliationsByBusiness, getUserById,
  getAgentsByBusiness, getBusinessById
} from '../../db/database';
import { COLORS, formatCurrency, formatDate } from '../../constants';
import { Reconciliation, User } from '../../types';
import { generateBusinessStatementHTML } from '../../utils/pdfTemplates';
import { promptExportAction } from '../../utils/pdfExport';

export const AllReconciliationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, User>>({});

  useFocusEffect(useCallback(() => {
    if (!user) return;
    const data = getReconciliationsByBusiness(user.businessId);
    setRecons(data);
    const agents = getAgentsByBusiness(user.businessId);
    const map: Record<string, User> = {};
    agents.forEach(a => { map[a.id] = a; });
    if (user.role === 'admin') map[user.id] = user;
    setAgentMap(map);
  }, [user]));

  const handleExportPDF = () => {
    if (!user) return;
    const business = getBusinessById(user.businessId);
    if (!business) return;
    const html = generateBusinessStatementHTML(recons, agentMap, business, 'All Time');
    const filename = `MoneyFloat_BusinessStatement_${business.name.replace(/\s+/g, '_')}`;
    promptExportAction(html, filename);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Reconciliations</Text>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.exportBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recons}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="calculator-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No reconciliations yet</Text>
          </View>
        )}
        renderItem={({ item: r }) => {
          const agent = agentMap[r.agentId];
          const cashOk = Math.abs(r.cashVariance) < 1;
          const floatOk = Math.abs(r.floatVariance) < 1;
          const balanced = cashOk && floatOk;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardDate}>{formatDate(r.date)}</Text>
                  <Text style={styles.cardAgent}>{agent?.name ?? 'Unknown Agent'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: balanced ? COLORS.success + '22' : COLORS.warning + '22' }]}>
                  <Ionicons
                    name={balanced ? 'checkmark-circle' : 'alert-circle'}
                    size={14}
                    color={balanced ? COLORS.success : COLORS.warning}
                  />
                  <Text style={[styles.statusText, { color: balanced ? COLORS.success : COLORS.warning }]}>
                    {balanced ? 'Balanced' : 'Variance'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Deposits</Text>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(r.totalDeposits)}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Withdrawals</Text>
                  <Text style={[styles.statValue, { color: COLORS.danger }]}>{formatCurrency(r.totalWithdrawals)}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Cash Var.</Text>
                  <Text style={[styles.statValue, { color: Math.abs(r.cashVariance) < 1 ? COLORS.success : COLORS.warning }]}>
                    {r.cashVariance >= 0 ? '+' : ''}{formatCurrency(r.cashVariance)}
                  </Text>
                </View>
              </View>
              {!balanced && (
                <View style={styles.varianceRow}>
                  {!cashOk && (
                    <Text style={styles.varianceText}>
                      Cash: {r.cashVariance > 0 ? '+' : ''}{formatCurrency(r.cashVariance)}
                    </Text>
                  )}
                  {!floatOk && (
                    <Text style={styles.varianceText}>
                      Float: {r.floatVariance > 0 ? '+' : ''}{formatCurrency(r.floatVariance)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
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
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  exportBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textSecondary, marginTop: 10, fontSize: 15 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardDate: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardAgent: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardStats: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 10, padding: 10 },
  cardStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 3 },
  statValue: { fontSize: 13, fontWeight: '700' },
  varianceRow: {
    flexDirection: 'row', gap: 12, marginTop: 8,
    backgroundColor: COLORS.warning + '11', borderRadius: 8, padding: 8,
  },
  varianceText: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
});
