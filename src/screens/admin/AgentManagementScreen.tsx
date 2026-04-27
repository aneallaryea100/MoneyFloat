import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAgentsByBusiness, createUser, getUserByPhone, updateUser } from '../../db/database';
import { COLORS, NETWORKS } from '../../constants';
import { User, MomoNetwork } from '../../types';
import { NetworkBadge } from '../../components/NetworkBadge';

type ModalMode = 'add' | 'edit';

export const AgentManagementScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<User[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [network, setNetwork] = useState<MomoNetwork>('MTN');

  useFocusEffect(useCallback(() => {
    if (user) setAgents(getAgentsByBusiness(user.businessId));
  }, [user]));

  const resetForm = () => {
    setName(''); setPhone(''); setPin(''); setNewPin(''); setNetwork('MTN');
    setEditingAgent(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (agent: User) => {
    setEditingAgent(agent);
    setName(agent.name);
    setPhone(agent.phone);
    setNetwork(agent.network);
    setPin('');
    setNewPin('');
    setModalMode('edit');
    setShowModal(true);
  };

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
    resetForm();
    Alert.alert('Success', `${name.trim()} added as agent successfully!`);
  };

  const handleEditAgent = () => {
    if (!editingAgent) return;
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    if (phone.trim().length < 10) { Alert.alert('Error', 'Enter valid phone number'); return; }

    const existing = getUserByPhone(phone.trim());
    if (existing && existing.id !== editingAgent.id) {
      Alert.alert('Error', 'Phone number already used by another agent');
      return;
    }

    if (newPin && newPin.length < 4) {
      Alert.alert('Error', 'New PIN must be at least 4 digits');
      return;
    }

    updateUser(editingAgent.id, {
      name: name.trim(),
      phone: phone.trim(),
      network,
      pin: newPin.trim() || undefined,
    });

    setAgents(prev => prev.map(a =>
      a.id === editingAgent.id
        ? { ...a, name: name.trim(), phone: phone.trim(), network }
        : a
    ));
    setShowModal(false);
    resetForm();
    Alert.alert('Updated', `${name.trim()}'s details have been updated.`);
  };

  const handleDeleteAgent = (agent: User) => {
    Alert.alert(
      'Remove Agent',
      `Are you sure you want to remove ${agent.name}? This will not delete their transaction history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAgents(prev => prev.filter(a => a.id !== agent.id));
            setShowModal(false);
            resetForm();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agents ({agents.length})</Text>
        <TouchableOpacity onPress={openAddModal}>
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
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
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
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(agent)}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {modalMode === 'add' ? 'Add New Agent' : 'Edit Agent'}
              </Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Agent's full name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="0XX XXX XXXX"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor={COLORS.textSecondary}
                  />
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

              {modalMode === 'add' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PIN (4–6 digits)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Agent's login PIN"
                      value={pin}
                      onChangeText={setPin}
                      keyboardType="numeric"
                      maxLength={6}
                      secureTextEntry
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New PIN (leave blank to keep current)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new PIN to reset"
                      value={newPin}
                      onChangeText={setNewPin}
                      keyboardType="numeric"
                      maxLength={6}
                      secureTextEntry
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={modalMode === 'add' ? handleAddAgent : handleEditAgent}
              >
                <Text style={styles.saveBtnText}>
                  {modalMode === 'add' ? 'Add Agent' : 'Save Changes'}
                </Text>
              </TouchableOpacity>

              {modalMode === 'edit' && editingAgent && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteAgent(editingAgent)}
                >
                  <Ionicons name="person-remove-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.deleteBtnText}>Remove Agent</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.primary, fontSize: 20, fontWeight: '800' },
  agentInfo: { flex: 1, gap: 3 },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  agentPhone: { fontSize: 13, color: COLORS.textSecondary },
  editBtn: {
    padding: 8, backgroundColor: COLORS.primary + '22',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '44',
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
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
  deleteBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    marginTop: 12, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.danger + '55',
    backgroundColor: COLORS.danger + '11',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
