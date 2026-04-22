import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import {
  getTodaySession, openDailySession, computeDailySummary,
  getTransactionsBySession
} from '../../db/database';
import { COLORS, formatCurrency, formatDate, TODAY } from '../../constants';
import { StatCard } from '../../components/StatCard';
import { TransactionItem } from '../../components/TransactionItem';
import { DailySummary, Transaction } from '../../types';
import { OpenSessionModal } from './OpenSessionModal';

export const AgentDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const { activeSession, setActiveSession } = useSession();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const session = getTodaySession(user.id);
    if (session && session.status === 'open') {
      setActiveSession(session);
      const s = computeDailySummary(session.id);
      setSummary(s);
      setRecentTxns(getTransactionsBySession(session.id).slice(0, 5));
    } else {
      setActiveSession(null);
      setSummary(null);
      setRecentTxns([]);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleOpenSession = (openingFloat: number, openingCash: number) => {
    if (!user) return;
    const session = openDailySession(user.id, user.businessId, openingFloat, openingCash);
    setActiveSession(session);
    setShowOpenModal(false);
    loadData();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.agentName}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: logout }
        ])}>
          <Ionicons name="log-out-outline" size={26} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Session Banner */}
        {!activeSession ? (
          <View style={styles.noSessionCard}>
            <Ionicons name="time-outline" size={40} color={COLORS.textSecondary} />
            <Text style={styles.noSessionTitle}>No Active Session</Text>
            <Text style={styles.noSessionSub}>Start your business day by opening a session</Text>
            <TouchableOpacity style={styles.openBtn} onPress={() => setShowOpenModal(true)}>
              <Ionicons name="play-circle-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.openBtnText}>Open Today's Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sessionBanner}>
              <View style={styles.sessionBannerLeft}>
                <View style={styles.liveDot} />
                <Text style={styles.sessionDate}>{formatDate(TODAY())}</Text>
              </View>
              <Text style={styles.sessionTxnCount}>
                {(summary?.depositCount ?? 0) + (summary?.withdrawalCount ?? 0)} transactions
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsRow}>
              <StatCard
                label="Cash on Hand"
                value={formatCurrency(summary?.expectedCash ?? 0)}
                color={COLORS.success}
              />
              <StatCard
                label="Float Balance"
                value={formatCurrency(summary?.expectedFloat ?? 0)}
                color={COLORS.info}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Total Deposits"
                value={formatCurrency(summary?.totalDeposits ?? 0)}
                color={COLORS.success}
                sub={`${summary?.depositCount ?? 0} txns`}
              />
              <StatCard
                label="Total Withdrawals"
                value={formatCurrency(summary?.totalWithdrawals ?? 0)}
                color={COLORS.danger}
                sub={`${summary?.withdrawalCount ?? 0} txns`}
              />
            </View>

            <View style={styles.commissionCard}>
              <Ionicons name="trending-up" size={22} color={COLORS.primary} />
              <View style={styles.commissionText}>
                <Text style={styles.commissionLabel}>Commission Earned Today</Text>
                <Text style={styles.commissionValue}>{formatCurrency(summary?.totalCommission ?? 0)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
                onPress={() => navigation.navigate('RecordTransaction', { type: 'deposit' })}
              >
                <Ionicons name="arrow-down-circle" size={28} color="white" />
                <Text style={styles.actionBtnText}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => navigation.navigate('RecordTransaction', { type: 'withdrawal' })}
              >
                <Ionicons name="arrow-up-circle" size={28} color="white" />
                <Text style={styles.actionBtnText}>Withdrawal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                onPress={() => navigation.navigate('EndOfDay')}
              >
                <Ionicons name="calculator" size={28} color="white" />
                <Text style={styles.actionBtnText}>Reconcile</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions */}
            {recentTxns.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Transactions</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                {recentTxns.map(t => <TransactionItem key={t.id} transaction={t} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <OpenSessionModal
        visible={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onOpen={handleOpenSession}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.secondary,
    padding: 20,
    paddingTop: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  agentName: { fontSize: 22, fontWeight: '800', color: COLORS.textLight },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  noSessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  noSessionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  noSessionSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  openBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  openBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  sessionBanner: {
    backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  sessionBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  sessionDate: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  sessionTxnCount: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  commissionCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  commissionText: { flex: 1 },
  commissionLabel: { color: COLORS.textLight, fontSize: 12, opacity: 0.7 },
  commissionValue: { color: COLORS.primary, fontSize: 20, fontWeight: '800', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 6,
  },
  actionBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  section: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
