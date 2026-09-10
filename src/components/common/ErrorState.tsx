import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { typography } from '../../constants/theme';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryAction?: () => void;
  isOffline?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  retryAction,
  isOffline = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={44}
          color={colors.danger}
        />
      </View>
      <Text style={styles.title}>
        {title || (isOffline ? "Looks like you're offline" : 'Something went wrong')}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {retryAction ? (
        <Button
          title="Try Again"
          onPress={retryAction}
          variant="outline"
          size="md"
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h3,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.body,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 140,
  },
});

export default ErrorState;
