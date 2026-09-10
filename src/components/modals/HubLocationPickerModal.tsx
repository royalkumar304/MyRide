import React from 'react';
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
import { CityOption } from '../../constants/cities';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';

export interface HubLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCity: CityOption;
  currentLocation: string;
  onSelectHub: (hubAddress: string) => void;
  onChangeCityPress: () => void;
}

export const HubLocationPickerModal: React.FC<HubLocationPickerModalProps> = ({
  visible,
  onClose,
  selectedCity,
  currentLocation,
  onSelectHub,
  onChangeCityPress,
}) => {
  const hubs = selectedCity.hubs && selectedCity.hubs.length > 0
    ? selectedCity.hubs
    : ['City Center Hub', 'Railway Station Hub', 'Airport Pickup Point'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Pick-up Hub in {selectedCity.name}</Text>
              <Text style={styles.subtitle}>Verified handover hubs with sanitised parking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          {/* Change City Banner */}
          <View style={styles.cityBanner}>
            <View style={styles.cityBannerLeft}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={styles.cityBannerText}>
                Active City: <Text style={{ fontWeight: 'bold', color: colors.dark }}>{selectedCity.name}, {selectedCity.state}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onChangeCityPress();
              }}
              style={styles.changeCityBtn}
            >
              <Text style={styles.changeCityBtnText}>Change City</Text>
            </TouchableOpacity>
          </View>

          {/* Hubs List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.hubsList}>
            <Text style={styles.sectionHeader}>Verified Pickup Hubs in {selectedCity.name}</Text>

            {hubs.map((hub, idx) => {
              const fullAddress = `${hub}, ${selectedCity.name}`;
              const isSelected = currentLocation.toLowerCase().includes(hub.toLowerCase());

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectHub(fullAddress);
                    onClose();
                  }}
                  style={[styles.hubCard, isSelected && styles.hubCardSelected]}
                >
                  <View style={[styles.hubIconCircle, isSelected && styles.hubIconCircleSelected]}>
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={isSelected ? colors.surface : colors.primary}
                    />
                  </View>

                  <View style={styles.hubInfo}>
                    <Text style={[styles.hubTitle, isSelected && styles.hubTitleSelected]}>
                      {hub}
                    </Text>
                    <Text style={styles.hubSubtitle}>
                      {selectedCity.name}, {selectedCity.state} • Free self-pickup
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Doorstep Delivery Option */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                onSelectHub(`Doorstep Home Delivery, ${selectedCity.name}`);
                onClose();
              }}
              style={styles.doorstepCard}
            >
              <View style={styles.doorstepIcon}>
                <Ionicons name="home-outline" size={18} color={colors.success} />
              </View>
              <View style={styles.hubInfo}>
                <Text style={styles.doorstepTitle}>Doorstep Home Delivery</Text>
                <Text style={styles.hubSubtitle}>
                  Delivered to your home, office, or hotel in {selectedCity.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: Platform.OS === 'web' ? '86%' : '88%',
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    ...typography.h3,
    color: colors.dark,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  closeBtn: {
    padding: 4,
  },
  cityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cityBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cityBannerText: {
    fontSize: 12,
    color: colors.body,
  },
  changeCityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeCityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  hubsList: {
    padding: 20,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.darkMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  hubCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  hubIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hubIconCircleSelected: {
    backgroundColor: colors.primary,
  },
  hubInfo: {
    flex: 1,
  },
  hubTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  hubTitleSelected: {
    color: colors.primaryDark,
  },
  hubSubtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  doorstepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.successLight,
    backgroundColor: colors.successLight + '20',
    marginTop: 6,
  },
  doorstepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doorstepTitle: {
    ...typography.bodyBold,
    color: colors.success,
  },
});

export default HubLocationPickerModal;
