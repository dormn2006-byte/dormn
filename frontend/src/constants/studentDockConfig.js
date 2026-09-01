// Shared dock configuration for all student pages
// Profile avatar pool — each student gets one permanently based on their user ID
const PROFILE_AVATARS = [
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.16_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.16_PM__1_-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.17_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.24_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.27_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.29_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.31_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.33_PM-removebg-preview.webp',
  '/icons/WhatsApp_Image_2026-08-05_at_5.51.36_PM-removebg-preview.webp',
];

// Deterministic hash: same user ID always maps to same avatar index
export const getProfileAvatar = (userId) => {
  if (!userId) return PROFILE_AVATARS[0];
  const numericId = typeof userId === 'number' ? userId : parseInt(String(userId).replace(/\D/g, '') || '0', 10);
  return PROFILE_AVATARS[numericId % PROFILE_AVATARS.length];
};

// Build the dock apps array for student pages
export const buildStudentDockApps = (userId) => [
  { id: "/student/dashboard", name: "Profile", icon: getProfileAvatar(userId) },
  { id: "/my-bookings", name: "Requests", icon: '/icons/my_requests-removebg-preview.webp' },
  { id: "/saved-pgs", name: "Saved", icon: '/icons/saved_pg-removebg-preview.webp' },
  { id: "/student/settings", name: "Settings", icon: '/icons/settings-removebg-preview.webp' },
];
