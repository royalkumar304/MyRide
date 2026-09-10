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
import { UserRole } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import CityPickerModal from '../../components/modals/CityPickerModal';
import { DEFAULT_CITY, CityOption } from '../../constants/cities';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();

  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityOption>(DEFAULT_CITY);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
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
        isSignup: true,
        signupData: {
          fullName,
          phoneNumber: `+91 ${phoneNumber}`,
          email,
          city: selectedCity.name,
          initialRole: role === 'HOST' ? 'HOST' : 'CUSTOMER',
        },
      });
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Failed to send OTP to mobile number');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Create Account" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Welcome to MyRide</Text>
          <Text style={styles.subheading}>
            Join India's local self-drive vehicle community
          </Text>

          {/* Role Selector */}
          <Text style={styles.selectorTitle}>I want to:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRole('CUSTOMER')}
              style={[
                styles.roleCard,
                role === 'CUSTOMER' && styles.roleCardActive,
              ]}
            >
              <Ionicons
                name="car"
                size={26}
                color={role === 'CUSTOMER' ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.roleCardTitle,
                  role === 'CUSTOMER' && styles.roleCardTitleActive,
                ]}
              >
                Rent a Vehicle
              </Text>
              <Text style={styles.roleCardSubtitle}>
                Discover & ride cars and bikes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRole('HOST')}
              style={[
                styles.roleCard,
                role === 'HOST' && styles.roleCardActive,
              ]}
            >
              <Ionicons
                name="key"
                size={26}
                color={role === 'HOST' ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.roleCardTitle,
                  role === 'HOST' && styles.roleCardTitleActive,
                ]}
              >
                List Your Vehicle
              </Text>
              <Text style={styles.roleCardSubtitle}>
                Host & earn monthly income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChangeText={setFullName}
              prefixIcon="person-outline"
            />

            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              prefixText="+91"
            />

            <Input
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              prefixIcon="mail-outline"
            />

            {/* City Selector */}
            <Text style={styles.cityLabel}>City</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCityModalVisible(true)}
              style={styles.citySelector}
            >
              <View style={styles.citySelectorContent}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.cityName}>
                  {selectedCity.name}, {selectedCity.state}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Register & Get OTP"
              onPress={handleSignup}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Already have account */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CityPickerModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
      />
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
  },
  heading: {
    ...typography.h2,
    color: colors.dark,
    marginTop: 8,
  },
  subheading: {
    ...typography.body,
    color: colors.body,
    marginTop: 4,
    marginBottom: 20,
  },
  selectorTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleCardTitle: {
    ...typography.bodyBold,
    color: colors.darkMuted,
    marginTop: 8,
  },
  roleCardTitleActive: {
    color: colors.primaryDark,
  },
  roleCardSubtitle: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  form: {
    marginTop: 6,
  },
  cityLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.darkMuted,
    marginBottom: 6,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  citySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 15,
    color: colors.dark,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: 10,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    ...typography.body,
    color: colors.body,
  },
  loginLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});

export default SignupScreen;
