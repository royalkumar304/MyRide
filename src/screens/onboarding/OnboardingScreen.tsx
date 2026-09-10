import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface OnboardingItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
}

const ONBOARDING_SLIDES: OnboardingItem[] = [
  {
    id: '1',
    icon: 'location-outline',
    title: 'Find a Ride Near You',
    subtitle: 'Cars and bikes available in your city. From Lucknow to Indore, ride anytime.',
    accent: colors.primary,
  },
  {
    id: '2',
    icon: 'shield-checkmark-outline',
    title: 'Book With Confidence',
    subtitle: 'Transparent pricing with 100% verified vehicle owners and digital handovers.',
    accent: colors.success,
  },
  {
    id: '3',
    icon: 'key-outline',
    title: 'Your Ride, Your Way',
    subtitle: 'Choose a vehicle that fits your journey. Self-pickup or doorstep delivery.',
    accent: colors.accent,
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width || 390);
  const flatListRef = useRef<FlatList>(null);

  const goToSlide = (index: number) => {
    if (index < 0 || index >= ONBOARDING_SLIDES.length) return;
    setCurrentIndex(index);
    try {
      flatListRef.current?.scrollToOffset({
        offset: index * containerWidth,
        animated: true,
      });
    } catch (e) {
      // Fallback
    }
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header: Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.brandLogoRow}>
          <Text style={styles.brandTitle}>MYRIDE</Text>
        </View>
        {currentIndex < ONBOARDING_SLIDES.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: containerWidth,
          offset: containerWidth * index,
          index,
        })}
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          if (containerWidth > 0) {
            const index = Math.round(offsetX / containerWidth);
            if (index >= 0 && index < ONBOARDING_SLIDES.length && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
          if (index >= 0 && index < ONBOARDING_SLIDES.length) {
            setCurrentIndex(index);
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: containerWidth }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.accent + '15' }]}>
              <Ionicons name={item.icon} size={84} color={item.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Bottom Section: Indicators & CTA */}
      <View style={styles.bottomBar}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => goToSlide(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : undefined,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.dark,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  actionBtn: {
    width: '100%',
  },
});

export default OnboardingScreen;
