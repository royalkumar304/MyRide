import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import { deductBalanceAfterPayout, fetchHostDashboard } from '../../store/slices/hostSlice';
import { hostService } from '../../services/hostService';

export const HostEarningsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, isLoading } = useAppSelector((state) => state.host);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchHostDashboard());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchHostDashboard());
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    if (summary.availableBalance <= 0) {
      Alert.alert('No Balance', 'Your current withdrawable balance is ₹0.');
      return;
    }

    Alert.alert(
      'Withdraw Earnings',
      `Transfer ₹${summary.availableBalance.toLocaleString()} to your linked bank account (HDFC Bank ••4821)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Transfer',
          onPress: async () => {
            setIsWithdrawing(true);
            try {
              await hostService.requestPayout(summary.availableBalance, 'HDFC_4821');
              dispatch(deductBalanceAfterPayout(summary.availableBalance));
              setIsWithdrawing(false);
              Alert.alert(
                'Payout Initiated 💸',
                '₹' + summary.availableBalance.toLocaleString() + ' will be credited to your bank account via IMPS within 15 minutes.'
              );
            } catch (e) {
              setIsWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Host Earnings & Commission" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Gross vs Net Card */}
        <View style={styles.mainCard}>
          <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
          <Text style={styles.balanceAmount}>₹{summary.availableBalance.toLocaleString()}</Text>

          <Button
            title="Withdraw to Bank"
            onPress={handleWithdraw}
            variant="primary"
            size="md"
            loading={isWithdrawing}
            icon={<Ionicons name="cash-outline" size={18} color={colors.surface} />}
            style={styles.withdrawBtn}
          />

          <View style={styles.divider} />

          {/* Breakdown stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Gross Earnings</Text>
              <Text style={styles.statVal}>₹{summary.totalGrossEarnings.toLocaleString()}</Text>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>MyRide 15%</Text>
              <Text style={[styles.statVal, { color: colors.danger }]}>
                -₹{summary.totalPlatformCommission.toLocaleString()}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Net Earnings</Text>
              <Text style={[styles.statVal, { color: colors.success }]}>
                ₹{summary.totalNetEarnings.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 15% Commission Explainer Box */}
        <View style={styles.explainerCard}>
          <View style={styles.explainerHeader}>
            <Ionicons name="pie-chart-outline" size={20} color={colors.primary} />
            <Text style={styles.explainerTitle}>Transparent 15% Commission Formula</Text>
          </View>
          <Text style={styles.explainerText}>
            For every ride booked on MyRide:
          </Text>
          
          <View style={styles.formulaRow}>
            <View style={styles.formulaCol}>
              <Text style={styles.formulaTitle}>Ride Amount</Text>
              <Text style={styles.formulaValue}>₹2,000</Text>
            </View>
            <Text style={styles.operator}>−</Text>
            <View style={styles.formulaCol}>
              <Text style={styles.formulaTitle}>15% MyRide Fee</Text>
              <Text style={[styles.formulaValue, { color: colors.danger }]}>₹300</Text>
            </View>
            <Text style={styles.operator}>=</Text>
            <View style={styles.formulaCol}>
              <Text style={styles.formulaTitle}>Host Receives</Text>
              <Text style={[styles.formulaValue, { color: colors.success }]}>₹1,700</Text>
            </View>
          </View>
        </View>

        {/* Time Period Filter */}
        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar Chart Visualizer */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Earnings Trend (Last 5 Months)</Text>
          <View style={styles.barsContainer}>
            {summary.chartData.labels.map((month, idx) => {
              const val = summary.chartData.values[idx];
              const maxVal = 14000;
              const heightPct = Math.min(100, Math.round((val / maxVal) * 120));
              return (
                <View key={month} style={styles.barCol}>
                  <Text style={styles.barValueText}>₹{(val / 1000).toFixed(1)}k</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: heightPct }]} />
                  </View>
                  <Text style={styles.barLabel}>{month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.recentTitle}>Recent Completed Trips</Text>
        {summary.recentTransactions.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txTop}>
              <Text style={styles.txVehicle}>{tx.vehicleName}</Text>
              <Text style={styles.txNet}>+₹{tx.netHostEarnings.toFixed(0)}</Text>
            </View>
            <Text style={styles.txDate}>{tx.tripDate} • {tx.durationDays} days rental</Text>
            <Text style={styles.txBreakdown}>
              Gross: ₹{tx.grossAmount} • MyRide (15%): -₹{tx.platformCommissionAmount.toFixed(0)}
            </Text>
          </View>
        ))}
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
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.dark,
    marginTop: 4,
    marginBottom: 14,
  },
  withdrawBtn: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 2,
  },
  explainerCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: 16,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  explainerTitle: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    marginLeft: 8,
  },
  explainerText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: 10,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: borderRadius.md,
  },
  formulaCol: {
    alignItems: 'center',
  },
  formulaTitle: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  formulaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 2,
  },
  operator: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.muted,
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.darkMuted,
  },
  periodTextActive: {
    color: colors.surface,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  chartTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 6,
  },
  barTrack: {
    width: 28,
    height: 110,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: '600',
    marginTop: 8,
  },
  recentTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txVehicle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  txNet: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  txDate: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  txBreakdown: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
});

export default HostEarningsScreen;
