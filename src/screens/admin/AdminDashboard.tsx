import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  getAgentsByBusiness, getBusinessById,
  getAllSessionsByBusiness, getReconciliationsByBusiness,
  getTodaySession, computeDailySummary
} from '../../db/database';
import { COLORS, formatCurrency, formatDate, TODAY } from '../../constants';
import { User, Business, DailySummary } from '../../types';
import { StatCard } from '../../components/StatCard';
import { NetworkBadge } from '../../components/NetworkBadge';

interface AgentSummary {
  agent: User;
  summary: DailySummary | null;
  hasSession: boolean;
}

export const AdminDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const biz = getBusinessById(user.businessId);
    setBusiness(biz);
    const agents = getAgentsByBusiness(user.businessId);
    const summaries: AgentSummary[] = agents.map(agent => {
      const session = getTodaySession(agent.id);
      if (session && session.status === 'open') {
        return { agent, summary: computeDailySummary(session.id), hasSession: true };
      }
      return { agent, summary: null, hasSession: false };
    });
    setAgentSummaries(summaries);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); setRefreshing(false); };

  const totalDeposits = agentSummaries.reduce((s, a) => s + (a.summary?.totalDeposits ?? 0), 0);
  const totalWithdrawals = agentSummaries.reduce((s, a) => s + (a.summary?.totalWithdrawals ?? 0), 0);
  const totalCommission = agentSummaries.reduce((s, a) => s + (a.summary?.totalCommission ?? 0), 0);
  const activeAgents = agentSummaries.filter(a => a.hasSession).length;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.businessName}>{business?.name ?? 'MoneyFloat'}</Text>
          <Text style={styles.adminLabel}>Admin Dashboard · {formatDate(TODAY())}</Text>
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
        {/* Business Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Active Agents" value={`${activeAgents}/${agentSummaries.length}`} color={COLORS.success} />
          <StatCard label="Commission Today" value={formatCurrency(totalCommission)} color={COLORS.primary} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Total Deposits" value={formatCurrency(totalDeposits)} color={COLORS.success} />
          <StatCard label="Total Withdrawals" value={formatCurrency(totalWithdrawals)} color={COLORS.danger} />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AgentManagement')}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminReports')}>
            <Ionicons name="bar-chart" size={24} color={COLORS.info} />
            <Text style={styles.actionBtnText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AllReconciliations')}>
            <Ionicons name="calculator" size={24} color={COLORS.success} />
            <Text style={styles.actionBtnText}>Reconcile</Text>
          </TouchableOpacity>
        </View>

        {/* Agents List */}
        <Text style={styles.sectionTitle}>Today's Agent Activity</Text>
        {agentSummaries.length === 0 ? (
          <View style={styles.noAgents}>
            <Ionicons name="people-outline" size={40} color={COLORS.textSecondary} />
            <Text style={styles.noAgentsText}>No agents yet. Add agents from the Agents screen.</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AgentManagement')}>
              <Text style={styles.addBtnText}>+ Add Agent</Text>
            </TouchableOpacity>
          </View>
        ) : (
          agentSummaries.map(({ agent, summary, hasSession }) => (
            <View key={agent.id} style={styles.agentCard}>
              <View style={styles.agentTop}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentInitial}>{agent.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentPhone}>{agent.phone}</Text>
                  <NetworkBadge network={agent.network} size="sm" />
                </View>
                <View style={[styles.statusDot, { backgroundColor: hasSession ? COLORS.success : COLORS.textSecondary }]} />
              </View>
              {hasSession && summary ? (
                <View style={styles.agentStats}>
                  <View style={styles.agentStat}>
                    <Text style={styles.agentStatLabel}>Deposits</Text>
                    <Text style={[styles.agentStatValue, { color: COLORS.success }]}>{formatCurrency(summary.totalDeposits)}</Text>
                  </View>
                  <View style={styles.agentStat}>
                    <Text style={styles.agentStatLabel}>Withdrawals</Text>
                    <Text style={[styles.agentStatValue, { color: COLORS.danger }]}>{formatCurrency(summary.totalWithdrawals)}</Text>
                  </View>
                  <View style={styles.agentStat}>
                    <Text style={styles.agentStatLabel}>Commission</Text>
                    <Text style={[styles.agentStatValue, { color: COLORS.primary }]}>{formatCurrency(summary.totalCommission)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noSessionLabel}>No active session today</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.secondary, padding: 20, paddingTop: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  businessName: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  adminLabel: { fontSize: 12, color: COLORS.textLight, opacity: 0.7, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 6, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  noAgents: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 32, alignItems: 'center' },
  noAgentsText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 16 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  addBtnText: { color: COLORS.secondary, fontWeight: '700' },
  agentCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  agentTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  agentAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  agentInitial: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  agentInfo: { flex: 1, gap: 2 },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  agentPhone: { fontSize: 12, color: COLORS.textSecondary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  agentStats: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 10, padding: 10 },
  agentStat: { flex: 1, alignItems: 'center' },
  agentStatLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 3 },
  agentStatValue: { fontSize: 14, fontWeight: '700' },
  noSessionLabel: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
});
