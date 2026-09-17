import { lazy, Suspense, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Core routes
import ProtectedRoute from "./ProtectedRoute";
import { AudioProvider } from "../context/AudioContext";

// Lazy-loaded routes to keep initial bundle size ultra-light
const Home = lazy(() => import("../pages/Home"));
const ExplorePGs = lazy(() => import("../pages/ExplorePGs"));
const PgDetails = lazy(() => import("../pages/PgDetails"));
const GlobalAudioPlayer = lazy(() => import("../components/common/GlobalAudioPlayer"));
const DrDormn = lazy(() => import("../pages/DrDormn"));

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
const Auth = lazy(() => import("../pages/auth/Auth"));
const About = lazy(() => import("../pages/About"));
const FAQ = lazy(() => import("../pages/faq"));
const Contact = lazy(() => import("../pages/Contact"));
const MyBookings = lazy(() => import("../pages/MyBookings"));

const StudentDashboard = lazy(() => import("../pages/StudentDashboard"));
const SavedPGs = lazy(() => import("../pages/SavedPGs"));
const StudentSettings = lazy(() => import("../pages/StudentSettings"));
const MyPG = lazy(() => import("../pages/MyPG"));

const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const CookiePolicy = lazy(() => import("../pages/CookiePolicy"));

const BlogList = lazy(() => import("../pages/BlogList"));
const AmityPGGuide = lazy(() => import("../pages/blogs/AmityPGGuide"));
const Sector62Guide = lazy(() => import("../pages/blogs/Sector62Guide"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Events = lazy(() => import("../pages/Events"));
const EventInvite = lazy(() => import("../pages/EventInvite"));
const CookieConsent = lazy(() => import("../components/CookieConsent"));

// Admin & SuperAdmin routes (Lazy loaded)
const PGAdminLayout = lazy(() => import("../layouts/PGAdminLayout"));
const Dashboard = lazy(() => import("../admin/pgAdmin/Dashboard"));
const AddPG = lazy(() => import("../admin/pgAdmin/AddPG"));
const MyPGs = lazy(() => import("../admin/pgAdmin/MyPGs"));
const Pricing = lazy(() => import("../admin/pgAdmin/Pricing"));
const EditPG = lazy(() => import("../admin/pgAdmin/components/EditPG"));
const Bookings = lazy(() => import("../admin/pgAdmin/Bookings"));
const Students = lazy(() => import("../admin/pgAdmin/Students"));
const Notifications = lazy(() => import("../admin/pgAdmin/Notifications"));
const BookingDetails = lazy(() => import("../admin/pgAdmin/BookingDetails"));


const OwnerPayments = lazy(() => import("../admin/pgAdmin/OwnerPayments"));
const TenantRegistrations = lazy(() => import("../admin/pgAdmin/TenantRegistrations"));
const OwnerRequests = lazy(() => import("../admin/pgAdmin/OwnerRequests"));
const PgAnalyticsDetails = lazy(() => import("../admin/pgAdmin/PgAnalyticsDetails"));
const Cancellations = lazy(() => import("../admin/pgAdmin/Cancellations"));
const OwnerPGChat = lazy(() => import("../admin/pgAdmin/PGChat"));
const OwnerProfile = lazy(() => import("../admin/pgAdmin/OwnerProfile"));



const SuperAdminDashboard = lazy(() => import("../admin/superAdmin/SuperAdminDashboard"));
const ManageOwners = lazy(() => import("../admin/superAdmin/ManageOwners"));
const ManagePGs = lazy(() => import("../admin/superAdmin/ManagePGs"));
const ManageStudents = lazy(() => import("../admin/superAdmin/ManageStudents"));
const OwnerDetails = lazy(() => import("../admin/superAdmin/OwnerDetails"));
const PGAdminDetails = lazy(() => import("../admin/superAdmin/PGDetails"));
const StudentDetails = lazy(() => import("../admin/superAdmin/StudentDetails"));

// Events, Concerts & Clubs Management Hub
const EventAdminLayout = lazy(() => import("../admin/eventAdmin/EventAdminLayout"));
const EventDashboard = lazy(() => import("../admin/eventAdmin/EventDashboard"));
const EventAnalytics = lazy(() => import("../admin/eventAdmin/EventAnalytics"));
const ManageExperiences = lazy(() => import("../admin/eventAdmin/ManageExperiences"));
const ManageEvents = lazy(() => import("../admin/eventAdmin/ManageEvents"));
const ManageConcerts = lazy(() => import("../admin/eventAdmin/ManageConcerts"));
const ManageClubs = lazy(() => import("../admin/eventAdmin/ManageClubs"));
const ManageCoupons = lazy(() => import("../admin/eventAdmin/ManageCoupons"));
const ManageAttendees = lazy(() => import("../admin/eventAdmin/ManageAttendees"));


// Simple loading indicator for lazy routes
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F5]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent"></div>
  </div>
);

const ManageReviews = lazy(() => import("../admin/superAdmin/ManageReviews"));

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
          <Route path="/gym" element={<MyPG defaultTab="gym" />} />
          <Route path="/dr-dormn" element={<DrDormn />} />
          <Route path="/my-pg" element={<MyPG />} />
          <Route path="/my-pgs" element={<MyPG />} />      

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