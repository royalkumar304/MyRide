import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HostTabParamList } from './types';
import colors from '../constants/colors';
import HostDashboardScreen from '../screens/host/HostDashboardScreen';
import HostBookingsScreen from '../screens/host/HostBookingsScreen';
import HostEarningsScreen from '../screens/host/HostEarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<HostTabParamList>();

const HOST_TAB_CONFIG: Record<
  string,
  {
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  HostDashboardTab: { label: 'Dashboard', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  HostVehiclesTab: { label: 'Vehicles', activeIcon: 'car', inactiveIcon: 'car-outline' },
  HostBookingsTab: { label: 'Bookings', activeIcon: 'receipt', inactiveIcon: 'receipt-outline' },
  HostEarningsTab: { label: 'Earnings', activeIcon: 'cash', inactiveIcon: 'cash-outline' },
  HostProfileTab: { label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
};

function CustomHostTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = HOST_TAB_CONFIG[route.name] || {
          label: route.name,
          activeIcon: 'help-circle',
          inactiveIcon: 'help-circle-outline',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const tintColor = isFocused ? colors.primary : colors.muted;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
          >
            <Ionicons
              name={isFocused ? config.activeIcon : config.inactiveIcon}
              size={22}
              color={tintColor}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: tintColor, fontWeight: isFocused ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const HostTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomHostTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HostDashboardTab" component={HostDashboardScreen} />
      <Tab.Screen name="HostVehiclesTab" component={HostDashboardScreen} />
      <Tab.Screen name="HostBookingsTab" component={HostBookingsScreen} />
      <Tab.Screen name="HostEarningsTab" component={HostEarningsScreen} />
      <Tab.Screen name="HostProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: Platform.OS === 'web' ? 70 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 16 : 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
    textAlign: 'center',
  },
});

export default HostTabNavigator;
