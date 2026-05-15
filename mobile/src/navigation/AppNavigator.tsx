import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, PlusCircle, Map as MapIcon, ClipboardList, User as UserIcon, Truck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import {
  DonorHomeScreen, PostListingScreen, ProfileScreen,
  ReceiverMapScreen, ReceiverHistoryScreen,
  JobBoardScreen, ActiveJobScreen
} from '../screens';
import { DonorTabParamList, ReceiverTabParamList, CourierTabParamList } from './types';

const DonorTab = createBottomTabNavigator<DonorTabParamList>();
const ReceiverTab = createBottomTabNavigator<ReceiverTabParamList>();
const CourierTab = createBottomTabNavigator<CourierTabParamList>();

const DonorTabs = () => (
  <DonorTab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary }}>
    <DonorTab.Screen name="DonorHome" component={DonorHomeScreen} options={{ title: 'My Listings', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
    <DonorTab.Screen name="PostListing" component={PostListingScreen} options={{ title: 'Post Food', tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} /> }} />
    <DonorTab.Screen name="DonorProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </DonorTab.Navigator>
);

const ReceiverTabs = () => (
  <ReceiverTab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary }}>
    <ReceiverTab.Screen name="ReceiverMap" component={ReceiverMapScreen} options={{ title: 'Nearby Food', tabBarIcon: ({ color }) => <MapIcon color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverHistory" component={ReceiverHistoryScreen} options={{ title: 'My Claims', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </ReceiverTab.Navigator>
);

const CourierTabs = () => (
  <CourierTab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary }}>
    <CourierTab.Screen name="JobBoard" component={JobBoardScreen} options={{ title: 'Job Board', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }} />
    <CourierTab.Screen name="ActiveJob" component={ActiveJobScreen} options={{ title: 'Active Job', tabBarIcon: ({ color }) => <Truck color={color} size={24} /> }} />
    <CourierTab.Screen name="CourierProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </CourierTab.Navigator>
);

export const AppNavigator = () => {
  const primaryRole = useAuthStore((state) => state.user?.primaryRole);

  if (primaryRole === 'receiver') return <ReceiverTabs />;
  if (primaryRole === 'courier') return <CourierTabs />;
  
  // Default to donor if role is somehow missing or explicitly 'donor'
  return <DonorTabs />;
};
