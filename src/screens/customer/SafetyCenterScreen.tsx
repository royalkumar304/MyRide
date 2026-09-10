import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { APP_CONFIG } from '../../constants/config';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Header from '../../components/common/Header';

type Props = NativeStackScreenProps<RootStackParamList, 'SafetyCenter'>;

export const SafetyCenterScreen: React.FC<Props> = ({ navigation }) => {
  const handleCallEmergency = () => {
    Alert.alert('Emergency SOS', `Calling Emergency Helpline ${APP_CONFIG.emergencyPhone}`);
  };

  const handleCallRSA = () => {
    Alert.alert('Roadside Assistance', `Calling MyRide 24/7 RSA: ${APP_CONFIG.roadsideAssistancePhone}`);
  };

  const handleReportIssue = (type: string) => {
    navigation.navigate('SupportTicket');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Safety Center" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency SOS Banner */}
        <View style={styles.sosCard}>
          <View style={styles.sosIconCircle}>
            <Ionicons name="warning" size={28} color={colors.danger} />
          </View>
          <View style={styles.sosTextCol}>
            <Text style={styles.sosTitle}>Emergency SOS (112)</Text>
            <Text style={styles.sosSubtitle}>
              National emergency helpline for immediate police or medical assistance.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCallEmergency}
            style={styles.sosButton}
          >
            <Text style={styles.sosButtonText}>Call 112</Text>
          </TouchableOpacity>
        </View>

        {/* 24/7 Roadside Assistance */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCallRSA}
          style={styles.card}
        >
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="build" size={22} color={colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>24/7 Roadside Assistance (RSA)</Text>
              <Text style={styles.cardSubtitle}>
                Flat tyre, engine breakdown, battery jump-start, or towing support.
              </Text>
              <Text style={styles.rsaPhone}>Toll-Free: {APP_CONFIG.roadsideAssistancePhone}</Text>
            </View>
            <Ionicons name="call" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <Text style={styles.sectionHeading}>MyRide Safety Standards</Text>

          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.badgeText}>100% Host & KYC Document Verification</Text>
          </View>

          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.badgeText}>Pre-ride Digital Handover Inspection</Text>
          </View>

          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.badgeText}>Speed Governors & Vehicle Safety Checks</Text>
          </View>

          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.badgeText}>256-bit Secure Razorpay Payment Escrow</Text>
          </View>
        </View>

        {/* Report an Issue */}
        <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Report Concerns</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleReportIssue('vehicle')}
          style={styles.reportRow}
        >
          <Ionicons name="alert-circle-outline" size={20} color={colors.darkMuted} />
          <Text style={styles.reportText}>Report a Vehicle Mechanical Issue</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleReportIssue('host')}
          style={styles.reportRow}
        >
          <Ionicons name="person-circle-outline" size={20} color={colors.darkMuted} />
          <Text style={styles.reportText}>Report Host Behaviour or Scam</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleReportIssue('general')}
          style={styles.reportRow}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.darkMuted} />
          <Text style={styles.reportText}>Contact Customer Support Team</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>
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
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.danger + '40',
    marginBottom: 16,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sosTextCol: {
    flex: 1,
  },
  sosTitle: {
    ...typography.bodyBold,
    color: colors.danger,
  },
  sosSubtitle: {
    fontSize: 11,
    color: colors.body,
    marginTop: 2,
  },
  sosButton: {
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginLeft: 8,
  },
  sosButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.body,
    marginTop: 2,
  },
  rsaPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  trustSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  badgeText: {
    ...typography.body,
    color: colors.dark,
    marginLeft: 8,
    fontWeight: '500',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportText: {
    ...typography.body,
    color: colors.dark,
    flex: 1,
    marginLeft: 10,
    fontWeight: '500',
  },
});

export default SafetyCenterScreen;
