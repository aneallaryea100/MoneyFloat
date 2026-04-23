import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatCurrency } from '../../constants';
import { ReplenishmentType } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onTopUp: (type: ReplenishmentType, amount: number, note?: string) => void;
}

export const TopUpModal = ({ visible, onClose, onTopUp }: Props) => {
  const [type, setType] = useState<ReplenishmentType>('cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = () => {
    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    Alert.alert(
      'Confirm Top Up',
      `Add ${formatCurrency(parsedAmount)} to your ${type === 'cash' ? 'Cash' : 'E-Money Float'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            onTopUp(type, parsedAmount, note.trim() || undefined);
            setAmount('');
            setNote('');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>Top Up Balance</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Add funds to your cash or e-money float mid-day</Text>

          {/* Type selector */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'cash' && styles.cashActive]}
              onPress={() => setType('cash')}
            >
              <Ionicons name="cash-outline" size={22} color={type === 'cash' ? 'white' : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, type === 'cash' && styles.typeBtnTextActive]}>Cash Top Up</Text>
              <Text style={[styles.typeBtnSub, type === 'cash' && styles.typeBtnSubActive]}>
                Banknotes added to till
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === 'float' && styles.floatActive]}
              onPress={() => setType('float')}
            >
              <Ionicons name="phone-portrait-outline" size={22} color={type === 'float' ? 'white' : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, type === 'float' && styles.typeBtnTextActive]}>Float Top Up</Text>
              <Text style={[styles.typeBtnSub, type === 'float' && styles.typeBtnSubActive]}>
                E-money added to account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info box */}
          <View style={[styles.infoBox, { borderColor: type === 'cash' ? COLORS.success : COLORS.info }]}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={type === 'cash' ? COLORS.success : COLORS.info}
            />
            <Text style={[styles.infoText, { color: type === 'cash' ? COLORS.success : COLORS.info }]}>
              {type === 'cash'
                ? 'Use this when someone brings you physical cash (e.g. owner sends top-up, you received change).'
                : 'Use this when you buy more e-money or receive a float transfer into your MoMo account.'}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.ghsLabel}>₵</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Owner sent ₵500 via MoMo"
                value={note}
                onChangeText={setNote}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: type === 'cash' ? COLORS.success : COLORS.info }]}
            onPress={handleSubmit}
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text style={styles.submitBtnText}>
              Add {parsedAmount > 0 ? formatCurrency(parsedAmount) : ''} to {type === 'cash' ? 'Cash' : 'Float'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 4,
    backgroundColor: COLORS.background,
  },
  cashActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  floatActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
  typeBtnTextActive: { color: 'white' },
  typeBtnSub: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  typeBtnSubActive: { color: 'rgba(255,255,255,0.8)' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 16,
  },
  ghsLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginRight: 10 },
  amountInput: { flex: 1, height: 56, fontSize: 26, fontWeight: '700', color: COLORS.textPrimary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 14, color: COLORS.textPrimary },
  submitBtn: {
    borderRadius: 14, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
