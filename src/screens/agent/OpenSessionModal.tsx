import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatCurrency } from '../../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpen: (openingFloat: number, openingCash: number) => void;
}

export const OpenSessionModal = ({ visible, onClose, onOpen }: Props) => {
  const [floatAmt, setFloatAmt] = useState('');
  const [cashAmt, setCashAmt] = useState('');

  const handleOpen = () => {
    const f = parseFloat(floatAmt);
    const c = parseFloat(cashAmt);
    if (isNaN(f) || f < 0) { Alert.alert('Error', 'Enter a valid opening float amount'); return; }
    if (isNaN(c) || c < 0) { Alert.alert('Error', 'Enter a valid opening cash amount'); return; }
    onOpen(f, c);
    setFloatAmt('');
    setCashAmt('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Open Today's Session</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Enter your starting balances for the day</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Float (e-Money Balance)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.currency}>GHS</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={floatAmt}
                onChangeText={setFloatAmt}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <Text style={styles.hint}>Amount of e-money in your MoMo account</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Cash</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.currency}>GHS</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={cashAmt}
                onChangeText={setCashAmt}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <Text style={styles.hint}>Physical cash in your till/drawer</Text>
          </View>

          {floatAmt && cashAmt && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Float</Text>
                <Text style={styles.summaryValue}>{formatCurrency(parseFloat(floatAmt) || 0)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cash</Text>
                <Text style={styles.summaryValue}>{formatCurrency(parseFloat(cashAmt) || 0)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total Capital</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatCurrency((parseFloat(floatAmt) || 0) + (parseFloat(cashAmt) || 0))}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.openBtn} onPress={handleOpen}>
            <Ionicons name="play-circle" size={22} color={COLORS.secondary} />
            <Text style={styles.openBtnText}>Start Session</Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 12,
  },
  currency: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 18, color: COLORS.textPrimary, fontWeight: '600' },
  hint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  summaryBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  summaryTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  summaryTotalValue: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  openBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  openBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
});
