import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, PlusCircle, Map as MapIcon, ClipboardList, User as UserIcon, Truck, History, Bell } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import {
  DonorHomeScreen, PostListingScreen,
  ReceiverMapScreen, ReceiverHistoryScreen,
  JobBoardScreen, CourierHistoryScreen,
  ProfileScreen,
  ListingDetailScreen,
  ActiveClaimScreen,
  ChatScreen,
  JobDetailScreen,
  ActiveJobScreen,
  NotificationsScreen,
  RatingModalScreen,
} from '../screens';
import {
  DonorTabParamList, ReceiverTabParamList,
  CourierTabParamList, AppStackParamList,
} from './types';

const DonorTab = createBottomTabNavigator<DonorTabParamList>();
const ReceiverTab = createBottomTabNavigator<ReceiverTabParamList>();
const CourierTab = createBottomTabNavigator<CourierTabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const TAB_OPTIONS = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  headerShown: false,
};

const DonorTabs = () => (
  <DonorTab.Navigator screenOptions={TAB_OPTIONS}>
    <DonorTab.Screen name="DonorHome" component={DonorHomeScreen}
      options={{ title: 'My Listings', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
    <DonorTab.Screen name="PostListing" component={PostListingScreen}
      options={{ title: 'Post Food', tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} /> }} />
    <DonorTab.Screen name="DonorProfile" component={ProfileScreen}
      options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </DonorTab.Navigator>
);

const ReceiverTabs = () => (
  <ReceiverTab.Navigator screenOptions={TAB_OPTIONS}>
    <ReceiverTab.Screen name="ReceiverMap" component={ReceiverMapScreen}
      options={{ title: 'Nearby Food', tabBarIcon: ({ color }) => <MapIcon color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverHistory" component={ReceiverHistoryScreen}
      options={{ title: 'My Claims', tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }} />
    <ReceiverTab.Screen name="ReceiverProfile" component={ProfileScreen}
      options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </ReceiverTab.Navigator>
);

const CourierTabs = () => (
  <CourierTab.Navigator screenOptions={TAB_OPTIONS}>
    <CourierTab.Screen name="JobBoard" component={JobBoardScreen}
      options={{ title: 'Job Board', tabBarIcon: ({ color }) => <Truck color={color} size={24} /> }} />
    <CourierTab.Screen name="CourierHistory" component={CourierHistoryScreen}
      options={{ title: 'My History', tabBarIcon: ({ color }) => <History color={color} size={24} /> }} />
    <CourierTab.Screen name="CourierProfile" component={ProfileScreen}
      options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }} />
  </CourierTab.Navigator>
);

const RoleTabs = () => {
  const primaryRole = useAuthStore((state) => state.user?.primaryRole);
  if (primaryRole === 'receiver') return <ReceiverTabs />;
  if (primaryRole === 'courier') return <CourierTabs />;
  return <DonorTabs />;
};

export const AppNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    {/* Role-based tab root */}
    <AppStack.Screen name="DonorTabs" component={RoleTabs} />

    {/* Shared stack screens */}
    <AppStack.Screen name="ListingDetail" component={ListingDetailScreen}
      options={{ headerShown: true, title: 'Food Details', headerBackTitle: 'Back' }} />
    <AppStack.Screen name="ActiveClaim" component={ActiveClaimScreen}
      options={{ headerShown: true, title: 'Active Claim', headerBackTitle: 'Back' }} />
    <AppStack.Screen name="Chat" component={ChatScreen}
      options={({ route }) => ({
        headerShown: true,
        title: route.params.title,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.surface },
      })} />
    <AppStack.Screen name="JobDetail" component={JobDetailScreen}
      options={{ headerShown: true, title: 'Job Details', headerBackTitle: 'Back' }} />
    <AppStack.Screen name="ActiveJob" component={ActiveJobScreen}
      options={{
        headerShown: true,
        title: 'Active Delivery',
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.surface,
      }} />
    <AppStack.Screen name="Notifications" component={NotificationsScreen}
      options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Back' }} />
    <AppStack.Screen name="RatingModal" component={RatingModalScreen}
      options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
  </AppStack.Navigator>
);
