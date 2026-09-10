import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

export interface RatingStarsProps {
  rating: number; // 1 to 5
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showScore?: boolean;
  scoreCount?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  showScore = false,
  scoreCount,
}) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= Math.floor(rating);
    const isHalf = !isFilled && i <= rating + 0.5;

    const starIcon = isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline';
    const starColor = isFilled || isHalf ? '#F59E0B' : '#D1D5DB';

    if (interactive) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange?.(i)}
          style={styles.starTouch}
        >
          <Ionicons name={starIcon} size={size} color={starColor} />
        </TouchableOpacity>
      );
    } else {
      stars.push(
        <Ionicons key={i} name={starIcon} size={size} color={starColor} style={styles.star} />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showScore ? (
        <Text style={styles.scoreText}>
          {rating.toFixed(1)}
          {scoreCount !== undefined ? ` (${scoreCount})` : ''}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  starTouch: {
    padding: 4,
  },
  scoreText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
});

export default RatingStars;
