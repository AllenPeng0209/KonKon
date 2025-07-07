import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleNotificationForEvent(event: { id: string, title: string, date: Date, startTime?: string | null }) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
  }

  const { date, startTime, title, id } = event;
  const triggerDate = new Date(date);

  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    triggerDate.setHours(hours);
    triggerDate.setMinutes(minutes);
  } else {
    // Default to 9 AM if no start time is provided
    triggerDate.setHours(9);
    triggerDate.setMinutes(0);
  }
  
  // Schedule 10 minutes before the event
  const trigger = new Date(triggerDate.getTime() - 10 * 60 * 1000);

  if (trigger.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Event Reminder",
          body: `${title} is starting in 10 minutes.`,
          data: { eventId: id },
        },
        trigger,
      });
      console.log(`Notification scheduled for event: ${title} at ${trigger.toLocaleString()}`);
  } else {
    console.log(`Event ${title} is in the past, not scheduling notification.`);
  }
}

export async function cancelNotificationForEvent(eventId: string) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.eventId === eventId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`Cancelled notification for eventId: ${eventId}`);
    }
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
    }
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    token = pushToken.data;
    console.log(token);
  } catch (e) {
    console.error("Failed to get push token", e);
  }

  return token;
} 