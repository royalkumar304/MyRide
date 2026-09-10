import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Text,
} from 'react-native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

function MobileFrameWrapper({ children }: { children: React.ReactNode }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth > 500;

  if (!isDesktopWeb) {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  return (
    <View style={styles.desktopCanvas}>
      {/* Top Header Tag for Desktop Viewers */}
      <View style={styles.topInfoBar}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>MYRIDE MOBILE PREVIEW</Text>
        </View>
        <Text style={styles.dimensionsBadge}>393 × 852 (Mobile Viewport)</Text>
      </View>

      {/* Smartphone Device Shell */}
      <View style={styles.phoneDeviceShell}>
        {/* Top Speaker / Dynamic Island Notch */}
        <View style={styles.notchContainer}>
          <View style={styles.speakerGrill} />
          <View style={styles.cameraDot} />
        </View>

        {/* Screen Viewport */}
        <View style={styles.phoneScreenViewport}>
          {children}
        </View>

        {/* Bottom Home Indicator Bar */}
        <View style={styles.homeIndicatorWrapper}>
          <View style={styles.homeIndicatorBar} />
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <MobileFrameWrapper>
          <AppNavigator />
        </MobileFrameWrapper>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopCanvas: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  topInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 10,
  },
  brandPillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dimensionsBadge: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  phoneDeviceShell: {
    width: 400,
    height: 840,
    maxHeight: '94%',
    backgroundColor: '#1E293B',
    borderRadius: 44,
    padding: 10,
    borderWidth: 4,
    borderColor: '#334155',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(37, 99, 235, 0.25)',
      },
    }),
    position: 'relative',
  },
  notchContainer: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: [{ translateX: -45 }],
    width: 90,
    height: 18,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerGrill: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  cameraDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  phoneScreenViewport: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    overflow: 'hidden',
  },
  homeIndicatorWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  homeIndicatorBar: {
    width: 110,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
});
