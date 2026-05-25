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
  CourierHistory: undefined;
  CourierProfile: undefined;
};

// Shared modal / full-screen stack screens accessible from any role
export type AppStackParamList = {
  DonorTabs: NavigatorScreenParams<DonorTabParamList>;
  ReceiverTabs: NavigatorScreenParams<ReceiverTabParamList>;
  CourierTabs: NavigatorScreenParams<CourierTabParamList>;
  ListingDetail: { listingId: string };
  DonorListingDetail: { listingId: string };
  ActiveClaim: { claimId: string; listingId: string };
  Chat: { listingId: string; title: string };
  JobDetail: { jobId: string };
  ActiveJob: { jobId: string };
  Notifications: undefined;
  ImpactDashboard: undefined;
  RatingModal: {
    listingId: string;
    ratedUserId: string;
    ratedUserName: string;
    roleTitle: string;
  };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
