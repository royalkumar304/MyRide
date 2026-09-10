import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Flow Navigators
import CustomerTabNavigator from './CustomerTabNavigator';
import HostTabNavigator from './HostTabNavigator';

// Screens
import SplashScreen from '../screens/splash/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';

import VehicleDetailsScreen from '../screens/customer/VehicleDetailsScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';
import BookingDetailsScreen from '../screens/booking/BookingDetailsScreen';
import DigitalPickupScreen from '../screens/booking/DigitalPickupScreen';
import ReturnVehicleScreen from '../screens/booking/ReturnVehicleScreen';
import ReviewScreen from '../screens/booking/ReviewScreen';

import AddVehicleWizardScreen from '../screens/host/AddVehicleWizardScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import SafetyCenterScreen from '../screens/customer/SafetyCenterScreen';
import ReferEarnScreen from '../screens/customer/ReferEarnScreen';
import OffersScreen from '../screens/customer/OffersScreen';
import SupportTicketScreen from '../screens/profile/SupportTicketScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Auth & Onboarding */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />

        {/* Main Tab Navigators */}
        <Stack.Screen name="CustomerMain" component={CustomerTabNavigator} />
        <Stack.Screen name="HostMain" component={HostTabNavigator} />

        {/* Discovery & Booking Flow */}
        <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
        <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
        <Stack.Screen name="DigitalPickup" component={DigitalPickupScreen} />
        <Stack.Screen name="ReturnVehicle" component={ReturnVehicleScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />

        {/* Host Screens */}
        <Stack.Screen name="AddVehicleWizard" component={AddVehicleWizardScreen} />

        {/* Utilities & Ancillary */}
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
        <Stack.Screen name="ReferEarn" component={ReferEarnScreen} />
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="SupportTicket" component={SupportTicketScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
