import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import {
  computeDailySummary, saveReconciliation,
  getTransactionsBySession
} from '../../db/database';
import { COLORS, formatCurrency, formatDate } from '../../constants';
import { DailySummary, Transaction } from '../../types';

export const EndOfDayScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { activeSession, setActiveSession } = useSession();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [actualCash, setActualCash] = useState('');
  const [actualFloat, setActualFloat] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (activeSession) {
      setSummary(computeDailySummary(activeSession.id));
      setTxns(getTransactionsBySession(activeSession.id));
    }
  }, [activeSession]);

  if (!activeSession || !summary) {
    return (
      <View style={styles.noSession}>
        <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.noSessionText}>No active session to reconcile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const parsedCash = parseFloat(actualCash) || 0;
  const parsedFloat = parseFloat(actualFloat) || 0;
  const cashVariance = parsedCash - summary.expectedCash;
  const floatVariance = parsedFloat - summary.expectedFloat;

  const getVarianceColor = (v: number) => {
    if (v === 0) return COLORS.success;
    if (Math.abs(v) < 5) return COLORS.warning;
    return COLORS.danger;
  };

  const getVarianceLabel = (v: number) => {
    if (v === 0) return 'Balanced ✓';
    if (v > 0) return `Overage: +${formatCurrency(v)}`;
    return `Shortage: ${formatCurrency(v)}`;
  };

  const handleReconcile = () => {
    if (!actualCash.trim()) { Alert.alert('Error', 'Enter your actual cash amount'); return; }
    if (!actualFloat.trim()) { Alert.alert('Error', 'Enter your actual float amount'); return; }

    const totalVariance = Math.abs(cashVariance) + Math.abs(floatVariance);
    const msg = totalVariance === 0
      ? 'Books are perfectly balanced! Ready to close?'
      : `Cash variance: ${getVarianceLabel(cashVariance)}\nFloat variance: ${getVarianceLabel(floatVariance)}\n\nProceed to close session?`;

    Alert.alert('End of Day Reconciliation', msg, [
      { text: 'Review Again', style: 'cancel' },
      {
        text: 'Close Session',
        style: totalVariance > 50 ? 'destructive' : 'default',
        onPress: () => {
          saveReconciliation(activeSession.id, user!.id, parsedCash, parsedFloat);
          setActiveSession(null);
          setShowResult(true);
        }
      }
    ]);
  };

  if (showResult) {
    const cashV = parsedCash - summary.expectedCash;
    const floatV = parsedFloat - summary.expectedFloat;
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Ionicons
            name={Math.abs(cashV) + Math.abs(floatV) === 0 ? 'checkmark-circle' : 'alert-circle'}
            size={64}
            color={Math.abs(cashV) + Math.abs(floatV) === 0 ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.resultTitle}>
            {Math.abs(cashV) + Math.abs(floatV) === 0 ? 'Perfectly Balanced!' : 'Session Closed'}
          </Text>
          <Text style={styles.resultDate}>{formatDate(activeSession.date)}</Text>
        </View>

        <ScrollView style={styles.resultScroll}>
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Today's Summary</Text>
            <ResultRow label="Opening Float" value={formatCurrency(activeSession.openingFloat)} />
            <ResultRow label="Opening Cash" value={formatCurrency(activeSession.openingCash)} />
            <ResultRow label="Total Deposits" value={formatCurrency(summary.totalDeposits)} valueColor={COLORS.success} sub={`${summary.depositCount} transactions`} />
            <ResultRow label="Total Withdrawals" value={formatCurrency(summary.totalWithdrawals)} valueColor={COLORS.danger} sub={`${summary.withdrawalCount} transactions`} />
            <ResultRow label="Commission Earned" value={formatCurrency(summary.totalCommission)} valueColor={COLORS.primary} />
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Cash Reconciliation</Text>
            <ResultRow label="Expected Cash" value={formatCurrency(summary.expectedCash)} />
            <ResultRow label="Actual Cash" value={formatCurrency(parsedCash)} />
            <ResultRow
              label="Cash Variance"
              value={getVarianceLabel(cashV)}
              valueColor={getVarianceColor(cashV)}
              highlight
            />
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Float Reconciliation</Text>
            <ResultRow label="Expected Float" value={formatCurrency(summary.expectedFloat)} />
            <ResultRow label="Actual Float" value={formatCurrency(parsedFloat)} />
            <ResultRow
              label="Float Variance"
              value={getVarianceLabel(floatV)}
              valueColor={getVarianceColor(floatV)}
              highlight
            />
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Net Position</Text>
            <ResultRow label="Total Capital (Cash + Float)" value={formatCurrency(parsedCash + parsedFloat)} />
            <ResultRow label="Expected Total" value={formatCurrency(summary.expectedCash + summary.expectedFloat)} />
            <ResultRow
              label="Net Variance"
              value={getVarianceLabel(cashV + floatV)}
              valueColor={getVarianceColor(cashV + floatV)}
              highlight
            />
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('AgentDashboard')}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>End of Day</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.dateLabel}>{formatDate(activeSession.date)}</Text>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Day Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Deposits</Text>
              <Text style={[styles.summaryItemValue, { color: COLORS.success }]}>{formatCurrency(summary.totalDeposits)}</Text>
              <Text style={styles.summaryItemSub}>{summary.depositCount} txns</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Withdrawals</Text>
              <Text style={[styles.summaryItemValue, { color: COLORS.danger }]}>{formatCurrency(summary.totalWithdrawals)}</Text>
              <Text style={styles.summaryItemSub}>{summary.withdrawalCount} txns</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Commission</Text>
              <Text style={[styles.summaryItemValue, { color: COLORS.primary }]}>{formatCurrency(summary.totalCommission)}</Text>
              <Text style={styles.summaryItemSub}>{txns.length} total</Text>
            </View>
          </View>
        </View>

        {/* Expected Values */}
        <View style={styles.expectedCard}>
          <Text style={styles.cardTitle}>Expected Balances</Text>
          <View style={styles.expectedRow}>
            <View style={styles.expectedItem}>
              <Ionicons name="cash-outline" size={24} color={COLORS.success} />
              <Text style={styles.expectedLabel}>Expected Cash</Text>
              <Text style={[styles.expectedValue, { color: COLORS.success }]}>{formatCurrency(summary.expectedCash)}</Text>
            </View>
            <View style={styles.expectedItem}>
              <Ionicons name="phone-portrait-outline" size={24} color={COLORS.info} />
              <Text style={styles.expectedLabel}>Expected Float</Text>
              <Text style={[styles.expectedValue, { color: COLORS.info }]}>{formatCurrency(summary.expectedFloat)}</Text>
            </View>
          </View>
        </View>

        {/* Actual Count Entry */}
        <View style={styles.inputCard}>
          <Text style={styles.cardTitle}>Count Your Physical Balances</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Actual Cash in Hand (GHS)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.ghsLabel}>GHS</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={actualCash}
                onChangeText={setActualCash}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            {actualCash ? (
              <Text style={[styles.varianceHint, { color: getVarianceColor(cashVariance) }]}>
                {getVarianceLabel(cashVariance)}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Actual Float Balance (GHS)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.ghsLabel}>GHS</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={actualFloat}
                onChangeText={setActualFloat}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            {actualFloat ? (
              <Text style={[styles.varianceHint, { color: getVarianceColor(floatVariance) }]}>
                {getVarianceLabel(floatVariance)}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity style={styles.reconcileBtn} onPress={handleReconcile}>
          <Ionicons name="calculator" size={22} color={COLORS.secondary} />
          <Text style={styles.reconcileBtnText}>Close & Reconcile</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const ResultRow = ({ label, value, valueColor, sub, highlight }: {
  label: string; value: string; valueColor?: string; sub?: string; highlight?: boolean;
}) => (
  <View style={[resultStyles.row, highlight && resultStyles.highlightRow]}>
    <Text style={resultStyles.label}>{label}</Text>
    <View style={resultStyles.right}>
      <Text style={[resultStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {sub ? <Text style={resultStyles.sub}>{sub}</Text> : null}
    </View>
  </View>
);

const resultStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  highlightRow: {
    backgroundColor: COLORS.background,
    borderRadius: 8, padding: 10, borderBottomWidth: 0, marginTop: 4,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  right: { alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  noSession: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noSessionText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' },
  backBtn: { marginTop: 16, padding: 12, backgroundColor: COLORS.primary, borderRadius: 10 },
  backBtnText: { color: COLORS.secondary, fontWeight: '700' },
  header: {
    backgroundColor: COLORS.secondary, padding: 20, paddingTop: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textLight },
  container: { padding: 16, paddingBottom: 40 },
  dateLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, fontWeight: '500' },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  summaryItemLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  summaryItemValue: { fontSize: 16, fontWeight: '800' },
  summaryItemSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  expectedCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  expectedRow: { flexDirection: 'row', gap: 12 },
  expectedItem: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 12, padding: 14,
  },
  expectedLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, marginBottom: 4 },
  expectedValue: { fontSize: 18, fontWeight: '800' },
  inputCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 16,
  },
  ghsLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginRight: 10 },
  input: { flex: 1, height: 56, fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  varianceHint: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  reconcileBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  reconcileBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  resultContainer: { flex: 1, backgroundColor: COLORS.background },
  resultHeader: {
    backgroundColor: COLORS.secondary, padding: 32, paddingTop: 60,
    alignItems: 'center',
  },
  resultTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textLight, marginTop: 12 },
  resultDate: { fontSize: 13, color: COLORS.primary, marginTop: 4 },
  resultScroll: { flex: 1, padding: 16 },
  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 12,
  },
  doneBtn: {
    margin: 16, backgroundColor: COLORS.primary, borderRadius: 14, height: 56,
    justifyContent: 'center', alignItems: 'center',
  },
  doneBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
});
