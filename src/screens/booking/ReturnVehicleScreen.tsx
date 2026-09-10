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

type Props = NativeStackScreenProps<RootStackParamList, 'ReturnVehicle'>;

export const ReturnVehicleScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (inspection: InspectionData) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dispatch(setEndInspection({ id: bookingId, inspection }));
      Alert.alert(
        'Vehicle Returned 🎉',
        'Thank you! Your security deposit refund has been initiated and will reach your account within 2 hours.',
        [
          {
            text: 'Rate Ride',
            onPress: () =>
              navigation.replace('Review', {
                bookingId,
                vehicleId: 'veh-003',
                vehicleName: 'Hyundai i20 Sportz',
              }),
          },
        ]
      );
    }, 600);
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
