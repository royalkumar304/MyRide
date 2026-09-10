import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import RatingStars from '../../components/common/RatingStars';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { bookingService } from '../../services/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export const ReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId, vehicleId, vehicleName } = route.params;

  const [overallRating, setOverallRating] = useState(5);
  const [vehicleCondition, setVehicleCondition] = useState(5);
  const [hostBehaviour, setHostBehaviour] = useState(5);
  const [pickupExperience, setPickupExperience] = useState(5);
  const [valueForMoney, setValueForMoney] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    setLoading(true);
    try {
      await bookingService.submitReview({
        bookingId,
        vehicleId,
        customerId: 'cust-curr',
        customerName: 'Gaurav Mishra',
        rating: overallRating,
        categories: {
          vehicleCondition,
          hostBehaviour,
          pickupExperience,
          valueForMoney,
        },
        comment: comment || 'Smooth ride and friendly host!',
      });
      setLoading(false);
      Alert.alert(
        'Thank You!',
        'Your feedback helps maintain trust and quality in the MyRide community.',
        [
          {
            text: 'Back to Home',
            onPress: () => navigation.replace('CustomerMain'),
          },
        ]
      );
    } catch (e) {
      setLoading(false);
      navigation.replace('CustomerMain');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Rate Your Ride" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>How was your ride?</Text>
          <Text style={styles.subtitle}>{vehicleName}</Text>

          {/* Overall Rating */}
          <View style={styles.overallStars}>
            <RatingStars
              rating={overallRating}
              size={36}
              interactive={true}
              onRatingChange={(r) => setOverallRating(r)}
            />
            <Text style={styles.overallRatingScore}>
              {overallRating === 5
                ? 'Excellent'
                : overallRating === 4
                ? 'Very Good'
                : overallRating === 3
                ? 'Average'
                : 'Could Be Better'}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate by Category</Text>

          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Vehicle Condition & Cleanliness</Text>
            <RatingStars
              rating={vehicleCondition}
              size={22}
              interactive={true}
              onRatingChange={(r) => setVehicleCondition(r)}
            />
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Host Behaviour & Politeness</Text>
            <RatingStars
              rating={hostBehaviour}
              size={22}
              interactive={true}
              onRatingChange={(r) => setHostBehaviour(r)}
            />
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Pickup & Handover Ease</Text>
            <RatingStars
              rating={pickupExperience}
              size={22}
              interactive={true}
              onRatingChange={(r) => setPickupExperience(r)}
            />
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Value for Money</Text>
            <RatingStars
              rating={valueForMoney}
              size={22}
              interactive={true}
              onRatingChange={(r) => setValueForMoney(r)}
            />
          </View>
        </View>

        {/* Written Review */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Write a Review (Optional)</Text>
          <Input
            placeholder="Tell future renters about the car condition, host pickup, or highway performance..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80 }}
          />
        </View>

        <Button
          title="Submit Review"
          onPress={handleSubmitReview}
          variant="primary"
          size="lg"
          loading={loading}
          style={styles.submitBtn}
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
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    color: colors.dark,
  },
  subtitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  overallStars: {
    alignItems: 'center',
    marginTop: 16,
  },
  overallRatingScore: {
    ...typography.bodyBold,
    color: colors.dark,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryLabel: {
    ...typography.body,
    color: colors.body,
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    marginTop: 8,
  },
});

export default ReviewScreen;
