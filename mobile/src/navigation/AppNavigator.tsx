import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, PlusCircle, Map as MapIcon, ClipboardList, User as UserIcon, Truck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import {
  DonorHomeScreen, PostListingScreen,
  ReceiverMapScreen, ReceiverHistoryScreen,
  JobBoardScreen, ActiveJobScreen,
  ProfileScreen,
  ListingDetailScreen,
  ActiveClaimScreen,
  ChatScreen,
} from '../screens';
import { DonorTabParamList, ReceiverTabParamList, CourierTabParamList, AppStackParamList } from './types';

const DonorTab = createBottomTabNavigator<DonorTabParamList>();
const ReceiverTab = createBottomTabNavigator<ReceiverTabParamList>();
const CourierTab = createBottomTabNavigator<CourierTabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const tabBarOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  headerShown: false,
};

const DonorTabs = () => (
  <DonorTab.Navigator screenOptions={tabBarOptions}>
    <DonorTab.Screen name="DonorHome" component={DonorHomeScreen} options={{ title: 'My Listings', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
    <DonorTab.Screen name="PostListing" component={PostListingScreen} options={{ title: 'Post Food', tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} /> }} />
    <DonorTab.Screen name="DonorProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </DonorTab.Navigator>
);

const ReceiverTabs = () => (
  <ReceiverTab.Navigator screenOptions={tabBarOptions}>
    <ReceiverTab.Screen name="ReceiverMap" component={ReceiverMapScreen} options={{ title: 'Nearby Food', tabBarIcon: ({ color }) => <MapIcon color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverHistory" component={ReceiverHistoryScreen} options={{ title: 'My Claims', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </ReceiverTab.Navigator>
);

const CourierTabs = () => (
  <CourierTab.Navigator screenOptions={tabBarOptions}>
    <CourierTab.Screen name="JobBoard" component={JobBoardScreen} options={{ title: 'Job Board', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }} />
    <CourierTab.Screen name="ActiveJob" component={ActiveJobScreen} options={{ title: 'Active Job', tabBarIcon: ({ color }) => <Truck color={color} size={24} /> }} />
    <CourierTab.Screen name="CourierProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </CourierTab.Navigator>
);

const RoleTabs = () => {
  const primaryRole = useAuthStore((state) => state.user?.primaryRole);
  if (primaryRole === 'receiver') return <ReceiverTabs />;
  if (primaryRole === 'courier') return <CourierTabs />;
  return <DonorTabs />;
};

export const AppNavigator = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="DonorTabs" component={RoleTabs} />
      <AppStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: true, title: 'Food Details', headerBackTitle: 'Back' }}
      />
      <AppStack.Screen
        name="ActiveClaim"
        component={ActiveClaimScreen}
        options={{ headerShown: true, title: 'Active Claim', headerBackTitle: 'Back' }}
      />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ headerShown: true, title: route.params.title, headerBackTitle: 'Back' })}
      />
    </AppStack.Navigator>
  );
};
