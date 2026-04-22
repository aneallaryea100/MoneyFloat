import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAgentsByBusiness, createUser, getUserByPhone } from '../../db/database';
import { COLORS, NETWORKS } from '../../constants';
import { User, MomoNetwork } from '../../types';
import { NetworkBadge } from '../../components/NetworkBadge';

export const AgentManagementScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [network, setNetwork] = useState<MomoNetwork>('MTN');

  useFocusEffect(useCallback(() => {
    if (user) setAgents(getAgentsByBusiness(user.businessId));
  }, [user]));

  const handleAddAgent = () => {
    if (!name.trim() || !phone.trim() || !pin.trim()) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }
    if (phone.trim().length < 10) { Alert.alert('Error', 'Enter valid phone number'); return; }
    if (pin.length < 4) { Alert.alert('Error', 'PIN must be at least 4 digits'); return; }

    const existing = getUserByPhone(phone.trim());
    if (existing) { Alert.alert('Error', 'Phone number already registered'); return; }

    const newAgent = createUser({
      name: name.trim(),
      phone: phone.trim(),
      pin,
      role: 'agent',
      network,
      businessId: user!.businessId,
    });

    setAgents(prev => [...prev, newAgent]);
    setShowModal(false);
    setName(''); setPhone(''); setPin(''); setNetwork('MTN');
    Alert.alert('Success', `${name} added as agent successfully!`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agents ({agents.length})</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="person-add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={agents}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No agents yet</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addBtnText}>+ Add First Agent</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item: agent }) => (
          <View style={styles.agentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{agent.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentPhone}>{agent.phone}</Text>
              <NetworkBadge network={agent.network} size="sm" />
            </View>
            <View style={styles.agentMeta}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Agent</Text>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add New Agent</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} placeholder="Agent's full name" value={name} onChangeText={setName} placeholderTextColor={COLORS.textSecondary} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} placeholder="0XX XXX XXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textSecondary} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Initial PIN (Agent can change later)</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} placeholder="4-6 digits" value={pin} onChangeText={setPin} keyboardType="numeric" maxLength={6} secureTextEntry placeholderTextColor={COLORS.textSecondary} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Network</Text>
              <View style={styles.networkRow}>
                {NETWORKS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.networkBtn, network === n && styles.networkBtnActive]}
                    onPress={() => setNetwork(n)}
                  >
                    <Text style={[styles.networkBtnText, network === n && styles.networkBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddAgent}>
              <Text style={styles.saveBtnText}>Add Agent</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textSecondary, marginTop: 10, marginBottom: 16, fontSize: 15 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  addBtnText: { color: COLORS.secondary, fontWeight: '700' },
  agentCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: '800' },
  agentInfo: { flex: 1, gap: 3 },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  agentPhone: { fontSize: 13, color: COLORS.textSecondary },
  agentMeta: { alignItems: 'flex-end' },
  roleBadge: {
    backgroundColor: COLORS.info + '22', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.info,
  },
  roleText: { fontSize: 11, color: COLORS.info, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputWrap: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 12,
  },
  input: { height: 48, fontSize: 15, color: COLORS.textPrimary },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.surface,
  },
  networkBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  networkBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  networkBtnTextActive: { color: COLORS.secondary },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
});
