import Notification from "../schemas/notificationSchema.js";

// List the logged-in user's notifications, newest first.
export const getNotifications = async (req, res) => {
  try {
    const user_id = Number(req.user.id);

    const notifications = await Notification.find({ user_id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      unreadCount: notifications.filter((n) => !n.is_read).length,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications." });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, user_id: Number(req.user.id) },
      { $set: { is_read: true } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update the notification." });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: Number(req.user.id), is_read: false },
      { $set: { is_read: true } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications." });
  }
};
