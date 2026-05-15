import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerify: { phone: string; verificationId: string };
  ProfileSetup: undefined;
};

export type DonorTabParamList = {
  DonorHome: undefined;
  PostListing: undefined;
  DonorProfile: undefined;
};

export type ReceiverTabParamList = {
  ReceiverMap: undefined;
  ReceiverHistory: undefined;
  ReceiverProfile: undefined;
};

export type CourierTabParamList = {
  JobBoard: undefined;
  ActiveJob: undefined;
  CourierProfile: undefined;
};

export type AppStackParamList = {
  DonorTabs: NavigatorScreenParams<DonorTabParamList>;
  ReceiverTabs: NavigatorScreenParams<ReceiverTabParamList>;
  CourierTabs: NavigatorScreenParams<CourierTabParamList>;
  ListingDetail: { listingId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
