import React, { useState } from 'react';
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
import { borderRadius, shadows, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { APP_CONFIG } from '../../constants/config';
import { useAppSelector } from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferEarn'>;

export const ReferEarnScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAppSelector((state) => state.auth);
  const referralCode = user?.referralCode || 'MYRIDE200';
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    setCopied(true);
    Alert.alert('Code Copied!', `Referral code "${referralCode}" copied to clipboard.`);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = () => {
    Alert.alert(
      'Share MyRide',
      `Use code ${referralCode} to get ₹${APP_CONFIG.referredUserDiscount} off your first ride on MyRide! Download now: https://myride.in/app`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Refer & Earn" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner Graphic */}
        <View style={styles.banner}>
          <View style={styles.giftIconCircle}>
            <Ionicons name="gift" size={48} color={colors.accent} />
          </View>
          <Text style={styles.bannerTitle}>
            Invite Friends, Earn ₹{APP_CONFIG.referralRewardAmount}
          </Text>
          <Text style={styles.bannerSubtitle}>
            Share MyRide with your friends. They get ₹{APP_CONFIG.referredUserDiscount} off their first rental, and you receive ₹{APP_CONFIG.referralRewardAmount} wallet cash!
          </Text>
        </View>

        {/* Code Box */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR UNIQUE REFERRAL CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyCode}
              style={styles.copyBtn}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Share Invite Link"
          onPress={handleShare}
          variant="primary"
          size="lg"
          icon={<Ionicons name="share-social-outline" size={20} color={colors.surface} />}
          style={styles.shareBtn}
        />

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsHeading}>Your Referral Milestones</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>8</Text>
              <Text style={styles.statDesc}>Invited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>3</Text>
              <Text style={styles.statDesc}>Rides Taken</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.success }]}>₹600</Text>
              <Text style={styles.statDesc}>Earned</Text>
            </View>
          </View>
        </View>

        {/* How It Works Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.statsHeading}>How It Works</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Share your invite code</Text>
              <Text style={styles.stepDesc}>Send code via WhatsApp, Telegram, or SMS</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Friend books a car or bike</Text>
              <Text style={styles.stepDesc}>They save ₹{APP_CONFIG.referredUserDiscount} on checkout</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>You get ₹{APP_CONFIG.referralRewardAmount} in wallet</Text>
              <Text style={styles.stepDesc}>Credited immediately upon completed trip</Text>
            </View>
          </View>
        </View>
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
  banner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  giftIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    ...typography.h2,
    color: colors.dark,
    textAlign: 'center',
  },
  bannerSubtitle: {
    ...typography.body,
    color: colors.body,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.dark,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  shareBtn: {
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.subtle,
  },
  statsHeading: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
  },
  statDesc: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderLight,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  stepDesc: {
    ...typography.caption,
    color: colors.body,
  },
});

export default ReferEarnScreen;
