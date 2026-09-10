import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { borderRadius, typography, shadows } from '../../constants/theme';

export interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  onConfirm: (startDate: string, endDate: string) => void;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onClose,
  initialStartDate,
  initialEndDate,
  onConfirm,
}) => {
  // Generate next 14 days
  const today = new Date();
  const daysList = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();
    return {
      index: i,
      dayName,
      monthName,
      dateNum,
      fullFormatted: `${dayName}, ${dateNum} ${monthName}`,
    };
  });

  const timeSlots = [
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '04:00 PM',
    '06:00 PM',
    '08:00 PM',
    '10:00 PM',
  ];

  const [pickupDayIndex, setPickupDayIndex] = useState(1); // Default: Tomorrow
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnDayIndex, setReturnDayIndex] = useState(3); // Default: +2 days
  const [returnTime, setReturnTime] = useState('08:00 PM');
  const [activePicker, setActivePicker] = useState<'pickup' | 'return'>('pickup');

  const selectedPickupDay = daysList[pickupDayIndex] || daysList[0];
  const selectedReturnDay = daysList[returnDayIndex] || daysList[2];

  // Quick duration shortcuts
  const applyDuration = (days: number) => {
    const newReturnIndex = Math.min(13, pickupDayIndex + days);
    setReturnDayIndex(newReturnIndex);
    setReturnTime(pickupTime);
  };

  const handleConfirm = () => {
    const startStr = `${selectedPickupDay.fullFormatted}, ${pickupTime}`;
    const endStr = `${selectedReturnDay.fullFormatted}, ${returnTime}`;
    onConfirm(startStr, endStr);
    onClose();
  };

  const durationDays = Math.max(1, returnDayIndex - pickupDayIndex);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Trip Schedule</Text>
              <Text style={styles.subtitle}>Choose your pickup & drop-off date and time</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Quick Duration Chips */}
            <View style={styles.durationRow}>
              <Text style={styles.sectionLabel}>Quick Duration:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationChips}>
                {[
                  { label: '1 Day', days: 1 },
                  { label: '2 Days', days: 2 },
                  { label: '3 Days (Weekend)', days: 3 },
                  { label: '5 Days', days: 5 },
                  { label: '1 Week', days: 7 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.days}
                    style={[styles.chip, durationDays === item.days && styles.chipActive]}
                    onPress={() => applyDuration(item.days)}
                  >
                    <Text style={[styles.chipText, durationDays === item.days && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab Switcher: Pickup vs Return */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabBtn, activePicker === 'pickup' && styles.tabBtnActive]}
                onPress={() => setActivePicker('pickup')}
              >
                <View style={styles.tabIconRow}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={activePicker === 'pickup' ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.tabLabel, activePicker === 'pickup' && styles.tabLabelActive]}>
                    Pick-up
                  </Text>
                </View>
                <Text style={styles.tabValue} numberOfLines={1}>
                  {selectedPickupDay.dayName}, {selectedPickupDay.dateNum} {selectedPickupDay.monthName}
                </Text>
                <Text style={styles.tabTime}>{pickupTime}</Text>
              </TouchableOpacity>

              <View style={styles.tabDivider} />

              <TouchableOpacity
                style={[styles.tabBtn, activePicker === 'return' && styles.tabBtnActive]}
                onPress={() => setActivePicker('return')}
              >
                <View style={styles.tabIconRow}>
                  <Ionicons
                    name="time"
                    size={16}
                    color={activePicker === 'return' ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.tabLabel, activePicker === 'return' && styles.tabLabelActive]}>
                    Drop-off
                  </Text>
                </View>
                <Text style={styles.tabValue} numberOfLines={1}>
                  {selectedReturnDay.dayName}, {selectedReturnDay.dateNum} {selectedReturnDay.monthName}
                </Text>
                <Text style={styles.tabTime}>{returnTime}</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker Row */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                Select {activePicker === 'pickup' ? 'Pick-up' : 'Drop-off'} Date
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                {daysList.map((item) => {
                  const isSelected = activePicker === 'pickup'
                    ? pickupDayIndex === item.index
                    : returnDayIndex === item.index;

                  return (
                    <TouchableOpacity
                      key={item.index}
                      style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      onPress={() => {
                        if (activePicker === 'pickup') {
                          setPickupDayIndex(item.index);
                          if (item.index >= returnDayIndex) {
                            setReturnDayIndex(Math.min(13, item.index + 1));
                          }
                        } else {
                          if (item.index <= pickupDayIndex) {
                            setPickupDayIndex(Math.max(0, item.index - 1));
                          }
                          setReturnDayIndex(item.index);
                        }
                      }}
                    >
                      <Text style={[styles.dateCardDay, isSelected && styles.dateCardTextSelected]}>
                        {item.dayName}
                      </Text>
                      <Text style={[styles.dateCardNum, isSelected && styles.dateCardTextSelected]}>
                        {item.dateNum}
                      </Text>
                      <Text style={[styles.dateCardMonth, isSelected && styles.dateCardTextSelected]}>
                        {item.monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time Picker Row */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                Select {activePicker === 'pickup' ? 'Pick-up' : 'Drop-off'} Time
              </Text>
              <View style={styles.timeGrid}>
                {timeSlots.map((time) => {
                  const isSelected = activePicker === 'pickup'
                    ? pickupTime === time
                    : returnTime === time;

                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                      onPress={() => {
                        if (activePicker === 'pickup') {
                          setPickupTime(time);
                        } else {
                          setReturnTime(time);
                        }
                      }}
                    >
                      <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Trip Duration Summary Pill */}
            <View style={styles.summaryBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.summaryText}>
                Total Rental Duration: <Text style={{ fontWeight: 'bold', color: colors.dark }}>{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</Text> (approx {durationDays * 24} hours)
              </Text>
            </View>
          </ScrollView>

          {/* Confirm Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.surface} style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirm Dates & Times</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 10 : 0,
  },
  container: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 370 : 440,
    backgroundColor: colors.surface,
    borderRadius: 24,
    maxHeight: Platform.OS === 'web' ? '88%' : '90%',
    overflow: 'hidden',
    ...shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  durationRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.darkMuted,
    marginBottom: 6,
  },
  durationChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.body,
  },
  chipTextActive: {
    color: colors.surface,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
  },
  tabTime: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  tabDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.darkMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dateList: {
    gap: 8,
  },
  dateCard: {
    width: 58,
    height: 72,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dateCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateCardDay: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 1,
  },
  dateCardNum: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.dark,
  },
  dateCardMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  dateCardTextSelected: {
    color: colors.surface,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeCard: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark,
  },
  timeTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 11,
    color: colors.primaryDark,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default DateTimePickerModal;
