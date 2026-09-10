import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveRole, logout } from '../../store/slices/authSlice';
import { setLanguage } from '../../store/slices/uiSlice';
import { SupportedLanguage } from '../../localization';
import { UserRole } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { user, activeRole } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.ui);

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const isHost = activeRole === 'HOST';

  const handleRoleToggle = () => {
    const nextRole: UserRole = isHost ? 'CUSTOMER' : 'HOST';
    dispatch(setActiveRole(nextRole));
    if (nextRole === 'HOST') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HostMain' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerMain' }],
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of MyRide?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const languages: { key: SupportedLanguage; label: string; sub: string }[] = [
    { key: 'en', label: 'English', sub: 'Default' },
    { key: 'hi', label: 'हिंदी (Hindi)', sub: 'शुद्ध हिंदी' },
    { key: 'hinglish', label: 'Hinglish', sub: 'Apni Ride, Apni Bhasha' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.fullName?.charAt(0) || 'G'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.fullName || 'Gaurav Mishra'}</Text>
              <Badge
                label={user?.isKycVerified ? '✓ KYC Verified' : 'Pending KYC'}
                variant={user?.isKycVerified ? 'success' : 'warning'}
                size="sm"
                style={{ marginLeft: 6 }}
              />
            </View>
            <Text style={styles.userPhone}>{user?.phoneNumber || '+91 99190 77665'}</Text>
            <Text style={styles.userCity}>📍 {user?.city || 'Lucknow, Uttar Pradesh'}</Text>
          </View>
        </View>

        {/* Switch Mode Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRoleToggle}
          style={[styles.switchCard, isHost && styles.switchCardHost]}
        >
          <View style={styles.switchIconCol}>
            <Ionicons
              name={isHost ? 'car-outline' : 'key-outline'}
              size={24}
              color={isHost ? colors.primary : colors.accent}
            />
          </View>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>
              {isHost ? 'Switch to Customer Mode' : 'Switch to Host Mode'}
            </Text>
            <Text style={styles.switchSub}>
              {isHost
                ? 'Rent cars and bikes for your personal travels'
                : 'Manage your listed vehicles and earnings'}
            </Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color={colors.dark} />
        </TouchableOpacity>

        {/* Common Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>Account & Preferences</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setLangModalVisible(true)}
            style={styles.menuItem}
          >
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemTitle}>App Language</Text>
            <Text style={styles.menuItemValue}>
              {language === 'hi' ? 'हिंदी' : language === 'hinglish' ? 'Hinglish' : 'English'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ReferEarn')}
            style={styles.menuItem}
          >
            <Ionicons name="gift-outline" size={20} color={colors.accent} />
            <Text style={styles.menuItemTitle}>Refer & Earn ₹200</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Offers')}
            style={styles.menuItem}
          >
            <Ionicons name="pricetag-outline" size={20} color={colors.success} />
            <Text style={styles.menuItemTitle}>Offers & Promos</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Safety & Support */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>Safety & Support</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SafetyCenter')}
            style={styles.menuItem}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemTitle}>Safety Center & Emergency</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SupportTicket')}
            style={styles.menuItem}
          >
            <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
            <Text style={styles.menuItemTitle}>Help & Support Tickets</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Legal & App Details */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionHeader}>About MyRide</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTermsModalVisible(true)}
            style={styles.menuItem}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.darkMuted} />
            <Text style={styles.menuItemTitle}>Terms of Service & 15% Fee Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPrivacyModalVisible(true)}
            style={styles.menuItem}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.darkMuted} />
            <Text style={styles.menuItemTitle}>Privacy & Security Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.darkMuted} />
            <Text style={styles.menuItemTitle}>App Version</Text>
            <Text style={styles.menuItemValue}>v1.0.0 (Production)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={langModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.langModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select App Language</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.dark} />
              </TouchableOpacity>
            </View>

            {languages.map((l) => {
              const isSelected = language === l.key;
              return (
                <TouchableOpacity
                  key={l.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    dispatch(setLanguage(l.key));
                    setLangModalVisible(false);
                  }}
                  style={[styles.langRow, isSelected && styles.langRowActive]}
                >
                  <View>
                    <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                      {l.label}
                    </Text>
                    <Text style={styles.langSub}>{l.sub}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.policyModalContainer}>
            <View style={styles.policyHeader}>
              <View style={styles.policyHeaderIcon}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.policyTitle}>Privacy & Security Policy</Text>
                <Text style={styles.policySubtitle}>Updated Sep 2026 • DPDP & RBI Compliant</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPrivacyModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.policyScroll} showsVerticalScrollIndicator={false}>
              {/* Section 1 */}
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
                  <Text style={styles.policyCardTitle}>1. User Identity & KYC Security</Text>
                </View>
                <Text style={styles.policyCardText}>
                  Your Driving License, Aadhaar, and identity credentials are encrypted using military-grade AES-256 standards both at rest and in transit.
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Aadhaar numbers are masked in strict compliance with UIDAI regulations.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Documents are accessed solely for license verification and never shared with 3rd-party advertisers.</Text>
                </View>
              </View>

              {/* Section 2 */}
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="card-outline" size={18} color={colors.accent} />
                  <Text style={styles.policyCardTitle}>2. Payment & Deposit Protection</Text>
                </View>
                <Text style={styles.policyCardText}>
                  All transactions are handled via Razorpay’s Level-1 PCI-DSS compliant banking gateway with 256-bit SSL encryption.
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Zero raw card numbers, CVVs, or bank credentials are ever stored on MyRide servers.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Refundable security deposits are automatically credited back to your source account within 2–4 hours post trip completion.</Text>
                </View>
              </View>

              {/* Section 3 */}
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="time-outline" size={18} color="#D97706" />
                  <Text style={styles.policyCardTitle}>3. 24-Hour Policy Transparency</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="information-circle" size={14} color="#D97706" style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '700' }}>Customer Cancellations:</Text> 100% full refund if cancelled at least 24 hours prior to booking start time. 0% refund applies for cancellations within 24 hours to compensate the host's reserved vehicle.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="information-circle" size={14} color="#D97706" style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '700' }}>Host Schedule Changes:</Text> Direct vehicle adjustments permitted ≥ 24 hours before pickup. Within 24 hours, hosts must formally inform and coordinate with customer first.
                  </Text>
                </View>
              </View>

              {/* Section 4 */}
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="camera-outline" size={18} color={colors.secondary} />
                  <Text style={styles.policyCardTitle}>4. Inspection Photos & RSA Telematics</Text>
                </View>
                <Text style={styles.policyCardText}>
                  Digital vehicle handover/return photos, odometer readings, and fuel levels are timestamped and cryptographically archived on Cloudinary to prevent disputable damage claims.
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>GPS location tracking is active solely during authorized trip sessions for 24/7 Roadside Assistance and anti-theft security.</Text>
                </View>
              </View>

              {/* Section 5 */}
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="key-outline" size={18} color={colors.primary} />
                  <Text style={styles.policyCardTitle}>5. DPDP Act & Data Rights</Text>
                </View>
                <Text style={styles.policyCardText}>
                  In full compliance with the Digital Personal Data Protection (DPDP) Act, you retain complete rights over your personal profile data.
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Request data export or complete account deletion anytime by contacting privacy@myride.in or via in-app Help & Support.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.policyFooter}>
              <TouchableOpacity
                style={styles.policyAcceptBtn}
                activeOpacity={0.85}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.policyAcceptText}>I Understand & Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms of Service & 15% Fee Modal */}
      <Modal
        visible={termsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.policyModalContainer}>
            <View style={styles.policyHeader}>
              <View style={styles.policyHeaderIcon}>
                <Ionicons name="document-text" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.policyTitle}>Terms & 15% Fee Policy</Text>
                <Text style={styles.policySubtitle}>Clear, Fair & Transparent Mobility</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTermsModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.policyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
                  <Text style={styles.policyCardTitle}>Transparent 15% Fee Structure</Text>
                </View>
                <Text style={styles.policyCardText}>
                  MyRide maintains a flat, transparent 15% platform commission on gross rental fares.
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Hosts receive 85% net earnings directly transferred to their linked bank accounts.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>The 15% fee funds 24/7 Roadside Assistance, instant KYC verification, insurance support, and 24x7 customer helpline.</Text>
                </View>
              </View>

              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
                  <Text style={styles.policyCardTitle}>Rider Eligibility & Safety</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Must be at least 18 years old with a valid Government-issued driving license.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>Zero tolerance for rash driving, unauthorized sub-leasing, or driving under intoxication.</Text>
                </View>
              </View>

              <View style={styles.policyCard}>
                <View style={styles.policyCardHeader}>
                  <Ionicons name="time-outline" size={18} color="#D97706" />
                  <Text style={styles.policyCardTitle}>Cancellation & 24-Hour Policy</Text>
                </View>
                <Text style={styles.policyCardText}>
                  Cancellations 24+ hours prior to booking start time receive a 100% full refund. Cancellations made within 24 hours are non-refundable (0% refund).
                </Text>
              </View>
            </ScrollView>

            <View style={styles.policyFooter}>
              <TouchableOpacity
                style={styles.policyAcceptBtn}
                activeOpacity={0.85}
                onPress={() => setTermsModalVisible(false)}
              >
                <Text style={styles.policyAcceptText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.card,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...typography.h3,
    color: colors.dark,
  },
  userPhone: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  userCity: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  switchCardHost: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '30',
  },
  switchIconCol: {
    marginRight: 12,
  },
  switchTextCol: {
    flex: 1,
  },
  switchTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  switchSub: {
    fontSize: 11,
    color: colors.darkMuted,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.subtle,
  },
  menuSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    paddingVertical: 10,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  menuItemTitle: {
    ...typography.body,
    color: colors.dark,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  menuItemValue: {
    fontSize: 13,
    color: colors.muted,
    marginRight: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 12 : 16,
  },
  langModalContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 370 : 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 24,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  langRowActive: {
    backgroundColor: colors.primaryLight + '30',
  },
  langLabel: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  langLabelActive: {
    color: colors.primary,
  },
  langSub: {
    ...typography.caption,
    color: colors.body,
  },
  policyModalContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 370 : 440,
    maxHeight: Platform.OS === 'web' ? '86%' : '88%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.card,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  policyHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.dark,
  },
  policySubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyScroll: {
    padding: 14,
  },
  policyCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  policyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  policyCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginLeft: 8,
  },
  policyCardText: {
    fontSize: 12,
    color: colors.body,
    lineHeight: 18,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletText: {
    fontSize: 11.5,
    color: colors.body,
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
  },
  policyFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  policyAcceptBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default ProfileScreen;
