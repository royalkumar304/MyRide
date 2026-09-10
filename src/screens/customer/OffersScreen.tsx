import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
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
import Badge from '../../components/common/Badge';
import { MOCK_OFFERS } from '../../services/mockData';
import { Offer } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Offers'>;

export const OffersScreen: React.FC<Props> = ({ navigation }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Promo Code Copied!', `Use "${code}" during checkout to apply discount.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Offers & Discounts" onBack={() => navigation.goBack()} />

      <FlatList
        data={MOCK_OFFERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Offer }) => (
          <View style={styles.offerCard}>
            <View style={styles.topRow}>
              <Badge label={item.badgeText} variant="primary" size="md" />
              <Text style={styles.validText}>Valid till: {item.validTill}</Text>
            </View>

            <Text style={styles.offerTitle}>{item.title}</Text>
            <Text style={styles.offerDesc}>{item.description}</Text>

            <View style={styles.bottomRow}>
              <View style={styles.codeBox}>
                <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                <Text style={styles.codeText}>{item.code}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCopyCode(item.code)}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>
                  {copiedCode === item.code ? 'Copied ✓' : 'Copy Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  listContent: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  validText: {
    ...typography.caption,
    color: colors.muted,
  },
  offerTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 4,
  },
  offerDesc: {
    ...typography.body,
    color: colors.body,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  applyBtn: {
    backgroundColor: colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default OffersScreen;
