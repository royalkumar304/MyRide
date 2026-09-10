import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import Header from '../../components/common/Header';
import HandoverChecklist from '../../components/booking/HandoverChecklist';
import { InspectionData } from '../../types';
import { useAppDispatch } from '../../store';
import { setStartInspection } from '../../store/slices/bookingSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'DigitalPickup'>;

export const DigitalPickupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (inspection: InspectionData) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dispatch(setStartInspection({ id: bookingId, inspection }));
      Alert.alert(
        'Ride Started! 🚗💨',
        'Vehicle handover inspection recorded successfully. Have a safe journey!',
        [
          {
            text: 'View Booking',
            onPress: () => navigation.replace('BookingDetails', { bookingId }),
          },
        ]
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Digital Handover & Pickup" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HandoverChecklist
          title="Vehicle Pickup Checklist"
          initialOdometer={24150}
          onSubmit={handleSubmit}
          loading={loading}
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
});

export default DigitalPickupScreen;
