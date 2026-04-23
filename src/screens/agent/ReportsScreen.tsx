import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getReconciliationsByAgent, getSessionsByAgent, getBusinessById } from '../../db/database';
import { COLORS, formatCurrency, formatDate } from '../../constants';
import { Reconciliation } from '../../types';
import { generatePeriodStatementHTML } from '../../utils/pdfTemplates';
import { promptExportAction } from '../../utils/pdfExport';

export const ReportsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [period, setPeriod] = useState<7 | 30>(7);

  useFocusEffect(useCallback(() => {
    if (user) setRecons(getReconciliationsByAgent(user.id, 30));
  }, [user]));

  const filtered = recons.filter(r => {
    const d = new Date(r.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return d >= cutoff;
  });

  const totalDeposits = filtered.reduce((s, r) => s + r.totalDeposits, 0);
  const totalWithdrawals = filtered.reduce((s, r) => s + r.totalWithdrawals, 0);
  const totalCommission = filtered.reduce((s, r) => s + r.totalCommission, 0);
  const totalDays = filtered.length;
  const varianceDays = filtered.filter(r => Math.abs(r.cashVariance) + Math.abs(r.floatVariance) > 1).length;

  const handleExportPDF = () => {
    if (!user) return;
    const business = getBusinessById(user.businessId);
    if (!business) return;
    const label = `Last ${period} Days`;
    const html = generatePeriodStatementHTML(filtered, user, business, label);
    const filename = `MoneyFloat_Statement_${period}days_${user.name.replace(/\s+/g, '_')}`;
    promptExportAction(html, filename);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.exportBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity style={[styles.periodBtn, period === 7 && styles.periodActive]} onPress={() => setPeriod(7)}>
            <Text style={[styles.periodText, period === 7 && styles.periodTextActive]}>7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.periodBtn, period === 30 && styles.periodActive]} onPress={() => setPeriod(30)}>
            <Text style={[styles.periodText, period === 30 && styles.periodTextActive]}>30 Days</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Deposits</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatCurrency(totalDeposits)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Withdrawals</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{formatCurrency(totalWithdrawals)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Commission Earned</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{formatCurrency(totalCommission)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Days Worked</Text>
            <Text style={[styles.summaryValue, { color: COLORS.info }]}>{totalDays}</Text>
          </View>
        </View>

        {/* Performance Insight */}
        <View style={styles.insightCard}>
          <Ionicons
            name={varianceDays === 0 ? 'checkmark-circle' : 'alert-circle'}
            size={28}
            color={varianceDays === 0 ? COLORS.success : COLORS.warning}
          />
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>
              {varianceDays === 0 ? 'Perfect Accuracy' : `${varianceDays} Variance Day${varianceDays > 1 ? 's' : ''}`}
            </Text>
            <Text style={styles.insightSub}>
              {varianceDays === 0
                ? `All ${totalDays} sessions balanced perfectly`
                : `${totalDays - varianceDays} of ${totalDays} days balanced`}
            </Text>
          </View>
        </View>

        {/* Daily History */}
        <Text style={styles.sectionTitle}>Daily History</Text>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No closed sessions in this period</Text>
          </View>
        ) : (
          filtered.map(r => {
            const balanced = Math.abs(r.cashVariance) + Math.abs(r.floatVariance) < 1;
            return (
              <View key={r.id} style={styles.dayCard}>
                <View style={styles.dayTop}>
                  <Text style={styles.dayDate}>{formatDate(r.date)}</Text>
                  <View style={[styles.dayBadge, { backgroundColor: balanced ? COLORS.success + '22' : COLORS.warning + '22' }]}>
                    <Text style={[styles.dayBadgeText, { color: balanced ? COLORS.success : COLORS.warning }]}>
                      {balanced ? '✓ Balanced' : '⚠ Variance'}
                    </Text>
                  </View>
                </View>
                <View style={styles.dayStats}>
                  <View style={styles.dayStat}>
                    <Text style={styles.dayStatLabel}>Deposits</Text>
                    <Text style={[styles.dayStatValue, { color: COLORS.success }]}>{formatCurrency(r.totalDeposits)}</Text>
                  </View>
                  <View style={styles.dayStat}>
                    <Text style={styles.dayStatLabel}>Withdrawals</Text>
                    <Text style={[styles.dayStatValue, { color: COLORS.danger }]}>{formatCurrency(r.totalWithdrawals)}</Text>
                  </View>
                  <View style={styles.dayStat}>
                    <Text style={styles.dayStatLabel}>Commission</Text>
                    <Text style={[styles.dayStatValue, { color: COLORS.primary }]}>{formatCurrency(r.totalCommission)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  exportBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  content: { padding: 16, paddingBottom: 40 },
  periodToggle: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 4, marginBottom: 16,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  periodActive: { backgroundColor: COLORS.secondary },
  periodText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: COLORS.textLight },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  summaryCard: {
    width: '47%', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, elevation: 1,
  },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  insightCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  insightText: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  insightSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  dayCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  dayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayDate: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  dayBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeText: { fontSize: 12, fontWeight: '700' },
  dayStats: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 8, padding: 8 },
  dayStat: { flex: 1, alignItems: 'center' },
  dayStatLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 },
  dayStatValue: { fontSize: 13, fontWeight: '700' },
});
