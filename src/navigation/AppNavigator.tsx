import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Agent screens
import { AgentDashboard } from '../screens/agent/AgentDashboard';
import { RecordTransactionScreen } from '../screens/agent/RecordTransactionScreen';
import { EndOfDayScreen } from '../screens/agent/EndOfDayScreen';
import { TransactionsScreen } from '../screens/agent/TransactionsScreen';
import { ReportsScreen } from '../screens/agent/ReportsScreen';

// Admin screens
import { AdminDashboard } from '../screens/admin/AdminDashboard';
import { AgentManagementScreen } from '../screens/admin/AgentManagementScreen';
import { AllReconciliationsScreen } from '../screens/admin/AllReconciliationsScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AgentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AgentDashboard" component={AgentDashboard} />
    <Stack.Screen name="RecordTransaction" component={RecordTransactionScreen} />
    <Stack.Screen name="EndOfDay" component={EndOfDayScreen} />
    <Stack.Screen name="Transactions" component={TransactionsScreen} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="AgentManagement" component={AgentManagementScreen} />
    <Stack.Screen name="AllReconciliations" component={AllReconciliationsScreen} />
    <Stack.Screen name="AdminReports" component={ReportsScreen} />
    {/* Admin can also record transactions for their own account */}
    <Stack.Screen name="RecordTransaction" component={RecordTransactionScreen} />
    <Stack.Screen name="EndOfDay" component={EndOfDayScreen} />
    <Stack.Screen name="Transactions" component={TransactionsScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : user.role === 'admin' ? <AdminStack /> : <AgentStack />}
    </NavigationContainer>
  );
};
