import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a push notification to a specific user using their saved Expo Push Token
 * and also saves the notification to the database.
 */
export async function sendPushNotification(
  userId: string,
  type: string,
  notification: PushNotificationData
): Promise<void> {
  try {
    // 1. Save to database for in-app history
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      },
    });

    // 2. Fetch the user's Expo push token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }, // Re-using fcmToken column for Expo Push Token
    });

    const pushToken = user?.fcmToken;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      console.log(`[Push] User ${userId} has no valid push token, skipped. Token: ${pushToken}`);
      return;
    }

    // 3. Send the push notification via Expo
    const messages: ExpoPushMessage[] = [
      {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`[Push] Sent ticket to ${userId}:`, ticketChunk);
      } catch (error) {
        console.error(`[Push] Error sending push to ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error(`[Push] Failed to process notification for user ${userId}:`, error);
  }
}
