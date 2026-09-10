import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { typography } from '../../constants/theme';
import VehicleCard from '../../components/vehicle/VehicleCard';
import EmptyState from '../../components/common/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSaveVehicle, setSelectedVehicle } from '../../store/slices/vehicleSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SavedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { vehicles, savedVehicleIds } = useAppSelector((state) => state.vehicles);
  const savedVehicles = vehicles.filter((v) => savedVehicleIds.includes(v.id));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Rides</Text>
      </View>

      <FlatList
        data={savedVehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Save your favourite rides here"
            subtitle="Tap the heart icon on any car or bike to quickly access it later."
            actionTitle="Explore Rides"
            onAction={() => navigation.navigate('CustomerMain')}
          />
        }
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            isSaved={true}
            onToggleSave={() => dispatch(toggleSaveVehicle(item.id))}
            onPress={() => {
              dispatch(setSelectedVehicle(item));
              navigation.navigate('VehicleDetails', { vehicleId: item.id });
            }}
          />
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  listContent: {
    padding: 16,
  },
});

export default SavedScreen;
