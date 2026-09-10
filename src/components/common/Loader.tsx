import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import colors from '../../constants/colors';
import { borderRadius } from '../../constants/theme';

export interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message = 'Loading...',
  size = 'large',
  color = colors.primary,
}) => {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

export const VehicleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
        <View style={styles.skeletonFooter}>
          <View style={[styles.skeletonLine, { width: '30%', height: 18 }]} />
          <View style={[styles.skeletonLine, { width: '25%', height: 28, borderRadius: 14 }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: colors.body,
    fontWeight: '500',
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonImage: {
    height: 180,
    backgroundColor: colors.inputBackground,
  },
  skeletonBody: {
    padding: 16,
  },
  skeletonLine: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.xs,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default Loader;
