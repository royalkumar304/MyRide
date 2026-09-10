import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('9919077665');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authService.sendOtp(phoneNumber);
      setLoading(false);
      navigation.navigate('OtpVerification', {
        phoneNumber: `+91 ${phoneNumber}`,
        sentOtp: res.data?.otp,
      });
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Failed to send OTP');
    }
  };

  const handleGoogleSignIn = () => {
    // Simulated Google OAuth
    navigation.replace('CustomerMain');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Graphic */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="car-sport" size={32} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>MYRIDE</Text>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Log in with your mobile number to rent or host vehicles.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Input
              label="Mobile Number"
              placeholder="Enter 10-digit mobile number"
              value={phoneNumber}
              onChangeText={(val) => {
                setPhoneNumber(val);
                if (error) setError('');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              prefixText="+91"
              error={error}
            />

            <Button
              title="Get OTP"
              onPress={handleSendOtp}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            {/* Google Sign-in */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              style={styles.socialBtn}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Direct Guest Explore */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.replace('CustomerMain')}
              style={styles.guestBtn}
            >
              <Text style={styles.guestText}>Explore Rides as Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Signup Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.dark,
    marginTop: 12,
  },
  welcomeSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.body,
    marginTop: 6,
    maxWidth: 280,
  },
  formContainer: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.muted,
    marginHorizontal: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginLeft: 10,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  guestText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    ...typography.body,
    color: colors.body,
  },
  signupLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});

export default LoginScreen;
