import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { recordTransaction } from '../../db/database';
import { calculateCommission } from '../../utils/commission';
import { COLORS, NETWORKS, formatCurrency } from '../../constants';
import { MomoNetwork, TransactionType } from '../../types';

export const RecordTransactionScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { activeSession } = useSession();
  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'deposit');
  const [amount, setAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [network, setNetwork] = useState<MomoNetwork>(user?.network ?? 'MTN');
  const [note, setNote] = useState('');

  const isDeposit = type === 'deposit';
  const parsedAmount = parseFloat(amount) || 0;
  const estimatedComm = parsedAmount > 0 ? calculateCommission(parsedAmount, network) : 0;

  const handleSubmit = () => {
    if (!activeSession) {
      Alert.alert('Error', 'No active session. Please open a session first.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (customerPhone.trim().length < 10) {
      Alert.alert('Error', 'Enter the customer\'s phone number');
      return;
    }

    Alert.alert(
      'Confirm Transaction',
      `${isDeposit ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(parsedAmount)} for ${customerPhone}\nNetwork: ${network}\nCommission: ${formatCurrency(estimatedComm)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            try {
              const tx = recordTransaction(
                user!.id,
                activeSession.id,
                type,
                parsedAmount,
                customerPhone.trim(),
                network,
                note.trim() || undefined
              );
              Alert.alert(
                'Success',
                `Transaction recorded!\nRef: ${tx.reference}\nCommission: ${formatCurrency(tx.commission)}`,
                [{ text: 'OK', onPress: () => { setAmount(''); setCustomerPhone(''); setNote(''); } }]
              );
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to record transaction');
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Transaction</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, isDeposit && styles.depositActive]}
            onPress={() => setType('deposit')}
          >
            <Ionicons name="arrow-down-circle" size={22} color={isDeposit ? 'white' : COLORS.textSecondary} />
            <Text style={[styles.typeBtnText, isDeposit && styles.typeBtnTextActive]}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, !isDeposit && styles.withdrawalActive]}
            onPress={() => setType('withdrawal')}
          >
            <Ionicons name="arrow-up-circle" size={22} color={!isDeposit ? 'white' : COLORS.textSecondary} />
            <Text style={[styles.typeBtnText, !isDeposit && styles.typeBtnTextActive]}>Withdrawal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name={isDeposit ? 'information-circle-outline' : 'information-circle-outline'}
            size={16}
            color={isDeposit ? COLORS.success : COLORS.danger}
          />
          <Text style={[styles.infoText, { color: isDeposit ? COLORS.success : COLORS.danger }]}>
            {isDeposit
              ? 'Customer gives you CASH → You send E-MONEY to customer'
              : 'Customer requests CASH → You receive E-MONEY from customer'}
          </Text>
        </View>

        {/* Network Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Network</Text>
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

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount (GHS)</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.ghsLabel}>GHS</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          {estimatedComm > 0 && (
            <Text style={styles.commHint}>
              Estimated commission: {formatCurrency(estimatedComm)}
            </Text>
          )}
        </View>

        {/* Customer Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>Customer Phone Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0XX XXX XXXX"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Note (optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Note (Optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Add a note..."
              value={note}
              onChangeText={setNote}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Summary Preview */}
        {parsedAmount > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Transaction Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Type</Text>
              <Text style={[styles.previewValue, { color: isDeposit ? COLORS.success : COLORS.danger }]}>
                {isDeposit ? 'Deposit' : 'Withdrawal'}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Amount</Text>
              <Text style={styles.previewValue}>{formatCurrency(parsedAmount)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Network</Text>
              <Text style={styles.previewValue}>{network}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewLast]}>
              <Text style={styles.previewLabel}>Commission</Text>
              <Text style={[styles.previewValue, { color: COLORS.success }]}>{formatCurrency(estimatedComm)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: isDeposit ? COLORS.success : COLORS.danger }]}
          onPress={handleSubmit}
        >
          <Ionicons name={isDeposit ? 'arrow-down-circle' : 'arrow-up-circle'} size={22} color="white" />
          <Text style={styles.submitBtnText}>Record {isDeposit ? 'Deposit' : 'Withdrawal'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary,
    padding: 20,
    paddingTop: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textLight },
  container: { padding: 16, paddingBottom: 40 },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  depositActive: { backgroundColor: COLORS.success },
  withdrawalActive: { backgroundColor: COLORS.danger },
  typeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  typeBtnTextActive: { color: 'white' },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10, marginBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  networkBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  networkBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  networkBtnTextActive: { color: COLORS.secondary },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.surface, paddingHorizontal: 16,
  },
  ghsLabel: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginRight: 10 },
  amountInput: { flex: 1, height: 60, fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  commHint: { fontSize: 12, color: COLORS.success, marginTop: 6, fontWeight: '500' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.surface, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 16, color: COLORS.textPrimary },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  previewLast: { borderBottomWidth: 0 },
  previewLabel: { fontSize: 14, color: COLORS.textSecondary },
  previewValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  submitBtn: {
    borderRadius: 14, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: 'white' },
});
