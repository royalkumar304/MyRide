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
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'SupportTicket'>;

export const SupportTicketScreen: React.FC<Props> = ({ navigation }) => {
  const [category, setCategory] = useState<'Booking' | 'Payment' | 'Vehicle Issue' | 'Host Dispute' | 'Other'>('Booking');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Booking', 'Payment', 'Vehicle Issue', 'Host Dispute', 'Other'] as const;

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please enter subject and description of your issue.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Ticket Created! 🎫',
        'Your support ticket #TKT-' + Math.floor(1000 + Math.random() * 9000) + ' has been logged. Our dedicated 24/7 support desk will resolve it within 4 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Help & Support Desk" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Raise a Support Request</Text>
        <Text style={styles.subtitle}>
          We are committed to quick resolution for all mobility and payment disputes.
        </Text>

        <Text style={styles.label}>Select Category</Text>
        <View style={styles.catWrap}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.catChip, category === c && styles.catChipActive]}
            >
              <Text style={[styles.catText, category === c && styles.catTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Subject"
          placeholder="Brief description of the problem"
          value={subject}
          onChangeText={setSubject}
        />

        <Input
          label="Detailed Explanation"
          placeholder="Please mention vehicle name, booking ID, or transaction details..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={{ minHeight: 110 }}
        />

        <Button
          title="Submit Ticket"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          loading={loading}
          style={{ marginTop: 12 }}
        />
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
  title: {
    ...typography.h2,
    color: colors.dark,
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.darkMuted,
    marginBottom: 8,
  },
  catWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  catChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  catTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default SupportTicketScreen;
