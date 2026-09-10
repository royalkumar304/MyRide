import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { APP_CONFIG } from '../../constants/config';
import { typography } from '../../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Icon Circle */}
        <View style={styles.iconContainer}>
          <Ionicons name="car-sport" size={54} color={colors.primary} />
          <View style={styles.bikeBadge}>
            <Ionicons name="bicycle" size={20} color={colors.surface} />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>MYRIDE</Text>
        <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
        <Text style={styles.altTagline}>{APP_CONFIG.altTagline}</Text>

        <View style={styles.tierCityPill}>
          <Text style={styles.tierCityText}>Cars & Bikes for Bharat's Cities</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Self-Drive Rentals • 100% Verified</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  bikeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.surface,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E0E7FF',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  altTagline: {
    ...typography.body,
    color: '#BFDBFE',
    marginTop: 4,
  },
  tierCityPill: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierCityText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
  },
  footerText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SplashScreen;
