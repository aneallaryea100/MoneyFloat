import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { createUser, createBusiness, getUserByPhone } from '../../db/database';
import { COLORS, NETWORKS } from '../../constants';
import { MomoNetwork, UserRole } from '../../types';

export const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>('agent');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [network, setNetwork] = useState<MomoNetwork>('MTN');
  const [businessName, setBusinessName] = useState('');
  const [businessCode, setBusinessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!name.trim()) return 'Enter your full name';
    if (phone.trim().length < 10) return 'Enter a valid 10-digit phone number';
    if (pin.length < 4) return 'PIN must be at least 4 digits';
    if (pin !== confirmPin) return 'PINs do not match';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { Alert.alert('Error', err); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const existing = getUserByPhone(phone.trim());
      if (existing) {
        Alert.alert('Error', 'An account with this phone number already exists');
        return;
      }

      if (role === 'admin') {
        if (!businessName.trim()) {
          Alert.alert('Error', 'Enter your business name');
          return;
        }
        const tempAdminId = Date.now().toString();
        const business = createBusiness(businessName.trim(), tempAdminId);
        const user = createUser({
          name: name.trim(),
          phone: phone.trim(),
          pin,
          role: 'admin',
          network,
          businessId: business.id,
        });
        await login(user);
      } else {
        if (!businessCode.trim()) {
          Alert.alert('Error', 'Enter the business code given by your admin');
          return;
        }
        Alert.alert('Error', 'Please ask your admin to add you as an agent from their dashboard.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="wallet" size={40} color={COLORS.primary} />
          <Text style={styles.appName}>MoneyFloat</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {step === 1 ? 'Create Account' : 'Business Setup'}
          </Text>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepActive]} />
          </View>

          {step === 1 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} placeholderTextColor={COLORS.textSecondary} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="0XX XXX XXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textSecondary} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Create PIN (4-6 digits)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••" value={pin} onChangeText={setPin} secureTextEntry keyboardType="numeric" maxLength={6} placeholderTextColor={COLORS.textSecondary} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm PIN</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••" value={confirmPin} onChangeText={setConfirmPin} secureTextEntry keyboardType="numeric" maxLength={6} placeholderTextColor={COLORS.textSecondary} />
                </View>
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                  onPress={() => setRole('admin')}
                >
                  <Ionicons name="business-outline" size={24} color={role === 'admin' ? COLORS.secondary : COLORS.textSecondary} />
                  <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>I'm the Admin</Text>
                  <Text style={styles.roleSubText}>Business Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'agent' && styles.roleBtnActive]}
                  onPress={() => setRole('agent')}
                >
                  <Ionicons name="person-outline" size={24} color={role === 'agent' ? COLORS.secondary : COLORS.textSecondary} />
                  <Text style={[styles.roleBtnText, role === 'agent' && styles.roleBtnTextActive]}>I'm an Agent</Text>
                  <Text style={styles.roleSubText}>Vendor / Cashier</Text>
                </TouchableOpacity>
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

              {role === 'admin' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="e.g. Kofi MoMo Shop" value={businessName} onChangeText={setBusinessName} placeholderTextColor={COLORS.textSecondary} />
                  </View>
                </View>
              )}

              {role === 'agent' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Code (from your Admin)</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Enter business code" value={businessCode} onChangeText={setBusinessCode} autoCapitalize="characters" placeholderTextColor={COLORS.textSecondary} />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.nextBtn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.secondary} /> : (
                  <>
                    <Text style={styles.nextBtnText}>Create Account</Text>
                    <Ionicons name="checkmark" size={20} color={COLORS.secondary} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 24, paddingTop: 50 },
  backBtn: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  appName: { fontSize: 26, fontWeight: '900', color: COLORS.secondary },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  stepActive: { backgroundColor: COLORS.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 6 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.background, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 16, color: COLORS.textPrimary },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: {
    flex: 1, borderWidth: 2, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  roleBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 6 },
  roleBtnTextActive: { color: COLORS.secondary },
  roleSubText: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  networkBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  networkBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  networkBtnTextActive: { color: COLORS.secondary },
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8,
  },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLinkBold: { color: COLORS.primary, fontWeight: '700' },
});
