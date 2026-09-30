import { Suspense, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import lazyWithRetry from "../utils/lazyRetry";

// Core routes
import ProtectedRoute from "./ProtectedRoute";
import { AudioProvider } from "../context/AudioContext";

// Lazy-loaded routes to keep initial bundle size ultra-light
const Home = lazyWithRetry(() => import("../pages/Home"), "Home");
const ExplorePGs = lazyWithRetry(() => import("../pages/ExplorePGs"), "ExplorePGs");
const PgDetails = lazyWithRetry(() => import("../pages/PgDetails"), "PgDetails");
const GlobalAudioPlayer = lazyWithRetry(() => import("../components/common/GlobalAudioPlayer"), "GlobalAudioPlayer");
const DrDormn = lazyWithRetry(() => import("../pages/DrDormn"), "DrDormn");

// Smart role-based dashboard router
const DashboardRedirect = () => {
  const { user, token } = useContext(AuthContext);
  if (!token || !user) return <Navigate to="/auth?redirect=/dashboard" replace />;
  if (user.role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
  if (user.role === "owner") return <Navigate to="/owner/dashboard" replace />;
  if (user.role === "event_admin" || user.role === "event_manager") return <Navigate to="/event-admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

// Lazy-loaded routes to keep initial bundle size light
const Auth = lazyWithRetry(() => import("../pages/auth/Auth"), "Auth");
const About = lazyWithRetry(() => import("../pages/About"), "About");
const FAQ = lazyWithRetry(() => import("../pages/faq"), "FAQ");
const Contact = lazyWithRetry(() => import("../pages/Contact"), "Contact");
const MyBookings = lazyWithRetry(() => import("../pages/MyBookings"), "MyBookings");

const StudentDashboard = lazyWithRetry(() => import("../pages/StudentDashboard"), "StudentDashboard");
const SavedPGs = lazyWithRetry(() => import("../pages/SavedPGs"), "SavedPGs");
const StudentSettings = lazyWithRetry(() => import("../pages/StudentSettings"), "StudentSettings");
const MyPG = lazyWithRetry(() => import("../pages/MyPG"), "MyPG");

const PrivacyPolicy = lazyWithRetry(() => import("../pages/PrivacyPolicy"), "PrivacyPolicy");
const TermsConditions = lazyWithRetry(() => import("../pages/TermsConditions"), "TermsConditions");
const CookiePolicy = lazyWithRetry(() => import("../pages/CookiePolicy"), "CookiePolicy");

const BlogList = lazyWithRetry(() => import("../pages/BlogList"), "BlogList");
const AmityPGGuide = lazyWithRetry(() => import("../pages/blogs/AmityPGGuide"), "AmityPGGuide");
const Sector62Guide = lazyWithRetry(() => import("../pages/blogs/Sector62Guide"), "Sector62Guide");
const NotFound = lazyWithRetry(() => import("../pages/NotFound"), "NotFound");
const Events = lazyWithRetry(() => import("../pages/Events"), "Events");
const EventInvite = lazyWithRetry(() => import("../pages/EventInvite"), "EventInvite");
const CookieConsent = lazyWithRetry(() => import("../components/CookieConsent"), "CookieConsent");

// Admin & SuperAdmin routes (Lazy loaded)
const PGAdminLayout = lazyWithRetry(() => import("../layouts/PGAdminLayout"), "PGAdminLayout");
const Dashboard = lazyWithRetry(() => import("../admin/pgAdmin/Dashboard"), "Dashboard");
const AddPG = lazyWithRetry(() => import("../admin/pgAdmin/AddPG"), "AddPG");
const MyPGs = lazyWithRetry(() => import("../admin/pgAdmin/MyPGs"), "MyPGs");
const Pricing = lazyWithRetry(() => import("../admin/pgAdmin/Pricing"), "Pricing");
const EditPG = lazyWithRetry(() => import("../admin/pgAdmin/components/EditPG"), "EditPG");
const Bookings = lazyWithRetry(() => import("../admin/pgAdmin/Bookings"), "Bookings");
const Students = lazyWithRetry(() => import("../admin/pgAdmin/Students"), "Students");
const Notifications = lazyWithRetry(() => import("../admin/pgAdmin/Notifications"), "Notifications");
const BookingDetails = lazyWithRetry(() => import("../admin/pgAdmin/BookingDetails"), "BookingDetails");


const OwnerPayments = lazyWithRetry(() => import("../admin/pgAdmin/OwnerPayments"), "OwnerPayments");
const TenantRegistrations = lazyWithRetry(() => import("../admin/pgAdmin/TenantRegistrations"), "TenantRegistrations");
const OwnerRequests = lazyWithRetry(() => import("../admin/pgAdmin/OwnerRequests"), "OwnerRequests");
const PgAnalyticsDetails = lazyWithRetry(() => import("../admin/pgAdmin/PgAnalyticsDetails"), "PgAnalyticsDetails");
const Cancellations = lazyWithRetry(() => import("../admin/pgAdmin/Cancellations"), "Cancellations");
const OwnerPGChat = lazyWithRetry(() => import("../admin/pgAdmin/PGChat"), "OwnerPGChat");
const OwnerProfile = lazyWithRetry(() => import("../admin/pgAdmin/OwnerProfile"), "OwnerProfile");

// New features from Downloads backup
const Gym = lazyWithRetry(() => import("../pages/Gym"), "Gym");
const MyShortStays = lazyWithRetry(() => import("../pages/MyShortStays"), "MyShortStays");
const PgVisits = lazyWithRetry(() => import("../admin/pgAdmin/PgVisits"), "PgVisits");
const PgShortStays = lazyWithRetry(() => import("../admin/pgAdmin/PgShortStays"), "PgShortStays");
const ManagePromoCodes = lazyWithRetry(() => import("../admin/pgAdmin/ManagePromoCodes"), "ManagePromoCodes");
const ManageStaff = lazyWithRetry(() => import("../admin/pgAdmin/ManageStaff"), "ManageStaff");



const SuperAdminDashboard = lazyWithRetry(() => import("../admin/superAdmin/SuperAdminDashboard"), "SuperAdminDashboard");
const ManageOwners = lazyWithRetry(() => import("../admin/superAdmin/ManageOwners"), "ManageOwners");
const ManagePGs = lazyWithRetry(() => import("../admin/superAdmin/ManagePGs"), "ManagePGs");
const ManageStudents = lazyWithRetry(() => import("../admin/superAdmin/ManageStudents"), "ManageStudents");
const OwnerDetails = lazyWithRetry(() => import("../admin/superAdmin/OwnerDetails"), "OwnerDetails");
const PGAdminDetails = lazyWithRetry(() => import("../admin/superAdmin/PGDetails"), "PGAdminDetails");
const StudentDetails = lazyWithRetry(() => import("../admin/superAdmin/StudentDetails"), "StudentDetails");

// Events, Concerts & Clubs Management Hub
const EventAdminLayout = lazyWithRetry(() => import("../admin/eventAdmin/EventAdminLayout"), "EventAdminLayout");
const EventDashboard = lazyWithRetry(() => import("../admin/eventAdmin/EventDashboard"), "EventDashboard");
const EventAnalytics = lazyWithRetry(() => import("../admin/eventAdmin/EventAnalytics"), "EventAnalytics");
const ManageExperiences = lazyWithRetry(() => import("../admin/eventAdmin/ManageExperiences"), "ManageExperiences");
const ManageEvents = lazyWithRetry(() => import("../admin/eventAdmin/ManageEvents"), "ManageEvents");
const ManageConcerts = lazyWithRetry(() => import("../admin/eventAdmin/ManageConcerts"), "ManageConcerts");
const ManageClubs = lazyWithRetry(() => import("../admin/eventAdmin/ManageClubs"), "ManageClubs");
const ManageCoupons = lazyWithRetry(() => import("../admin/eventAdmin/ManageCoupons"), "ManageCoupons");
const ManageAttendees = lazyWithRetry(() => import("../admin/eventAdmin/ManageAttendees"), "ManageAttendees");


// Simple loading indicator for lazy routes
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F5]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent"></div>
  </div>
);

const ManageReviews = lazyWithRetry(() => import("../admin/superAdmin/ManageReviews"), "ManageReviews");

const AppRoutes = () => {
  return (
    <AudioProvider>
      <BrowserRouter>
        <Suspense fallback={null}><GlobalAudioPlayer /></Suspense>
        <Suspense fallback={null}><CookieConsent /></Suspense>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pgs" element={<ExplorePGs />} />
          <Route path="/about" element={<About />} />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/cookies-policy" element={<CookiePolicy />} />
          <Route path="/pg/:id" element={<PgDetails />} />
          <Route path="/pgs/:id" element={<PgDetails />} />
          <Route path="/property/:id" element={<PgDetails />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/pg-near-amity-university-noida" element={<AmityPGGuide />} />
          <Route path="/blogs/pg-in-sector-62-noida" element={<Sector62Guide />} /> 
          <Route path="/events/invite/:inviteCode" element={<EventInvite />} />
          <Route path="/events" element={<Events />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/dr-dormn" element={<DrDormn />} />
          <Route path="/my-pg" element={<MyPG />} />
          <Route path="/my-pgs" element={<MyPG />} />
          <Route path="/my-short-stays" element={<MyShortStays />} />

          {/* Universal Dashboard & Auth Shortcuts */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
          <Route path="/register" element={<Navigate to="/auth?mode=signup" replace />} />

          {/* SuperAdmin Dashboard & Sub-pages */}
          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/super-admin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/super-admin/*" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute role="superadmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/manage-owners"
            element={
              <ProtectedRoute role="superadmin">
                <ManageOwners />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/manage-pgs"
            element={
              <ProtectedRoute role="superadmin">
                <ManagePGs />
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard & Portal */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-pgs"
            element={
              <ProtectedRoute role="student">
                <SavedPGs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/settings"
            element={
              <ProtectedRoute role="student">
                <StudentSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/manage-students"
            element={
              <ProtectedRoute role="superadmin">
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/manage-reviews"
            element={
              <ProtectedRoute role="superadmin">
                <ManageReviews />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/owner-details"
            element={
              <ProtectedRoute role="superadmin">
                <OwnerDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/pg-details"
            element={
              <ProtectedRoute role="superadmin">
                <PGAdminDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute role="student">
                <MyBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/student-details"
            element={
              <ProtectedRoute role="superadmin">
                <StudentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings/:bookingId"
            element={
              <ProtectedRoute role="owner">
                <BookingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bookings/:bookingId"
            element={
              <ProtectedRoute role="owner">
                <BookingDetails />
              </ProtectedRoute>
            }
          />

          {/* Protected Owner Routes */}
          <Route path="/admin" element={<Navigate to="/owner/dashboard" replace />} />
          <Route
            path="/owner"
            element={
              <ProtectedRoute role="owner">
                <PGAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="add-pg" element={<AddPG />} />
            <Route path="my-pgs" element={<MyPGs />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="edit-pg/:id" element={<EditPG />} />
            <Route path="pg-analytics/:pgId" element={<PgAnalyticsDetails />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:bookingId" element={<BookingDetails />} />
            <Route path="cancellations" element={<Cancellations />} />
            <Route path="chat" element={<OwnerPGChat />} />
            <Route path="requests" element={<OwnerRequests />} />
            <Route path="students" element={<Students />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="payments" element={<OwnerPayments />} />
            <Route path="kyc-forms" element={<TenantRegistrations />} />
            <Route path="profile" element={<OwnerProfile />} />
            <Route path="settings" element={<OwnerProfile defaultTab="security" />} />
            <Route path="visits" element={<PgVisits />} />
            <Route path="short-stays" element={<PgShortStays />} />
            <Route path="promo-codes" element={<ManagePromoCodes />} />
            <Route path="staff" element={<ManageStaff />} />
            <Route path="all-staff" element={<Navigate to="/owner/staff" replace />} />
          </Route>

          {/* Events, Concerts & Clubs Management Dashboard */}
          <Route
            path="/event-admin"
            element={
              <ProtectedRoute role="event_admin">
                <EventAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/event-admin/dashboard" replace />} />
            <Route path="dashboard" element={<EventDashboard />} />
            <Route path="analytics" element={<EventAnalytics />} />
            <Route path="experiences" element={<ManageExperiences />} />
            <Route path="events" element={<ManageEvents />} />
            <Route path="concerts" element={<ManageConcerts />} />
            <Route path="clubs" element={<ManageClubs />} />
            <Route path="coupons" element={<ManageCoupons />} />
            <Route path="attendees" element={<ManageAttendees />} />
          </Route>

          {/* Alias for /events-admin */}
          <Route path="/events-admin" element={<Navigate to="/event-admin/dashboard" replace />} />
          <Route path="/events-admin/*" element={<Navigate to="/event-admin/dashboard" replace />} />

          {/* 404 & Access Denied Route */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </BrowserRouter>
    </AudioProvider>
  );
};

export default AppRoutes;