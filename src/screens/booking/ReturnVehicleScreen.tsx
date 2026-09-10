import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import Header from '../../components/common/Header';
import HandoverChecklist from '../../components/booking/HandoverChecklist';
import { InspectionData } from '../../types';
import { useAppDispatch } from '../../store';
import { setEndInspection } from '../../store/slices/bookingSlice';
import { bookingService } from '../../services/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'ReturnVehicle'>;

export const ReturnVehicleScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (inspection: InspectionData) => {
    setLoading(true);
    try {
      const res = await bookingService.endRideInspection(bookingId, inspection);
      setLoading(false);

      if (res.success && res.data) {
        dispatch(setEndInspection({ id: bookingId, inspection: res.data.endInspection || inspection }));
        Alert.alert(
          'Vehicle Returned 🎉',
          'Thank you! Your return handover verification has been saved to the server and security deposit refund initiated.',
          [
            {
              text: 'Rate Ride',
              onPress: () =>
                navigation.replace('Review', {
                  bookingId,
                  vehicleId: res.data?.vehicleId || 'veh-003',
                  vehicleName: res.data?.vehicle ? `${res.data.vehicle.brand} ${res.data.vehicle.model}` : 'Vehicle',
                }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Return Failed',
          res.message || 'Unable to complete vehicle return on server. Please try again.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Network error occurred while connecting to server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Return Vehicle" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HandoverChecklist
          title="Vehicle Return Verification"
          isEndRide={true}
          initialOdometer={24380}
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

export default ReturnVehicleScreen;
