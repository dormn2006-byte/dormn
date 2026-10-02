// Persistent in-app notifications. Kept non-throwing on purpose: a notification
// failing must never roll back the money movement that triggered it.

import Notification from "../schemas/notificationSchema.js";

export const createNotification = async ({
  userId,
  role = "owner",
  type = "system",
  title,
  message = "",
  data = {},
  actionType = null,
  actionRef = null,
}) => {
  try {
    return await Notification.create({
      user_id: Number(userId),
      role,
      type,
      title,
      message,
      data,
      action_type: actionType,
      action_ref: actionRef != null ? String(actionRef) : null,
    });
  } catch (err) {
    console.error("[Notification] create error:", err.message);
    return null;
  }
};
