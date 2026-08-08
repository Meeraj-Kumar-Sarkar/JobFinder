import Notification from "../models/Notification";

export async function createNotification(data: any) {
  return Notification.create(data);
}

export async function getNotifications(userId: string) {
  return Notification.find({
    user: userId,
  }).sort({
    createdAt: -1,
  });
}
