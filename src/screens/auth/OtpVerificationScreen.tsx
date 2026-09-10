import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography, shadows } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, sentOtp, isSignup, signupData } = route.params;
  const dispatch = useAppDispatch();

  const [receivedOtp, setReceivedOtp] = useState(sentOtp || '1234');
  const [showSmsBanner, setShowSmsBanner] = useState(true);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length < 4) {
      setError('Please enter the 4-digit OTP sent to your number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isSignup && signupData) {
        // First verify OTP
        await authService.verifyOtp(phoneNumber, otp);
        // Then register the user profile
        const res = await authService.signup(signupData);
        setLoading(false);
        if (res.data) {
          dispatch(setUser({ user: res.data.user, token: res.data.token }));
          if (signupData.initialRole === 'HOST') {
            navigation.replace('HostMain');
          } else {
            navigation.replace('CustomerMain');
          }
        }
      } else {
        const res = await authService.verifyOtp(phoneNumber, otp);
        setLoading(false);
        if (res.data) {
          dispatch(setUser({ user: res.data.user, token: res.data.token }));
          if (res.data.user.activeRole === 'HOST') {
            navigation.replace('HostMain');
          } else {
            navigation.replace('CustomerMain');
          }
        }
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Invalid OTP. Please enter the OTP sent to your number.');
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      setTimer(30);
      setError('');
      setLoading(true);
      try {
        const res = await authService.sendOtp(phoneNumber);
        setLoading(false);
        if (res.data?.otp) {
          setReceivedOtp(res.data.otp);
          setShowSmsBanner(true);
        }
      } catch {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title={isSignup ? 'Verify Registration' : 'Verify Mobile'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Simulated Real-Time Incoming SMS Notification Banner */}
          {showSmsBanner && (
            <View style={styles.smsNotificationCard}>
              <View style={styles.smsHeaderRow}>
                <View style={styles.smsSenderRow}>
                  <View style={styles.smsIconCircle}>
                    <Ionicons name="chatbubble" size={14} color={colors.surface} />
                  </View>
                  <Text style={styles.smsSenderName}>MESSAGES • Just now</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSmsBanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.smsMessageBody}>
                <Text style={{ fontWeight: '700', color: colors.dark }}>MYRIDE SMS: </Text>
                Your verification OTP is <Text style={styles.smsCodeHighlight}>{receivedOtp}</Text>. Do not share this with anyone.
              </Text>

              <TouchableOpacity
                style={styles.autoFillPill}
                activeOpacity={0.8}
                onPress={() => {
                  setOtp(receivedOtp);
                  setError('');
                }}
              >
                <Ionicons name="flash" size={14} color={colors.primary} />
                <Text style={styles.autoFillText}>Auto-fill {receivedOtp}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              OTP code sent to mobile number:
            </Text>
            <View style={styles.phoneBadge}>
              <Ionicons name="call-outline" size={14} color={colors.primary} />
              <Text style={styles.phoneText}>{phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.otpInputContainer}>
            <Input
              placeholder="• • • •"
              value={otp}
              onChangeText={(val) => {
                setOtp(val);
                if (error) setError('');
              }}
              keyboardType="numeric"
              maxLength={4}
              style={styles.otpInput}
              error={error}
            />
          </View>

          <Button
            title={isSignup ? 'Complete Registration' : 'Verify & Log In'}
            onPress={handleVerify}
            variant="primary"
            size="lg"
            loading={loading}
            style={styles.verifyBtn}
          />

          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP to {phoneNumber}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  smsNotificationCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  smsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smsSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smsIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smsMessageBody: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 18,
    marginBottom: 10,
  },
  smsCodeHighlight: {
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  autoFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  autoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
    textAlign: 'center',
    marginBottom: 6,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 4,
  },
  phoneText: {
    fontWeight: '700',
    color: colors.dark,
    fontSize: 13,
  },
  otpInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 26,
    letterSpacing: 12,
    fontWeight: '700',
    color: colors.dark,
  },
  verifyBtn: {
    width: '100%',
    marginBottom: 20,
  },
  resendContainer: {
    marginTop: 8,
  },
  timerText: {
    fontSize: 13,
    color: colors.muted,
  },
  resendLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default OtpVerificationScreen;
