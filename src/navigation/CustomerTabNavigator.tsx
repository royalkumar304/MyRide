import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CustomerTabParamList } from './types';
import colors from '../constants/colors';
import HomeScreen from '../screens/customer/HomeScreen';
import ExploreScreen from '../screens/customer/ExploreScreen';
import BookingsListScreen from '../screens/booking/BookingsListScreen';
import SavedScreen from '../screens/customer/SavedScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  HomeTab: { label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  ExploreTab: { label: 'Explore', activeIcon: 'search', inactiveIcon: 'search-outline' },
  BookingsTab: { label: 'Bookings', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  SavedTab: { label: 'Saved', activeIcon: 'heart', inactiveIcon: 'heart-outline' },
  ProfileTab: { label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
};

function CustomCustomerTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] || {
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

export const CustomerTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomCustomerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen} />
      <Tab.Screen name="BookingsTab" component={BookingsListScreen} />
      <Tab.Screen name="SavedTab" component={SavedScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
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

export default CustomerTabNavigator;
