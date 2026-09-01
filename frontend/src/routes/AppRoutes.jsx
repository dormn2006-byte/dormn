import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Core routes imported directly for instant first paint
import Home from "../pages/Home";
import ProtectedRoute from "./ProtectedRoute";


const ExplorePGs = lazy(() => import("../pages/ExplorePGs"));
const PgDetails = lazy(() => import("../pages/PgDetails"));
const GlobalAudioPlayer = lazy(() => import("../components/common/GlobalAudioPlayer"));

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

const ClubsList = lazy(() => import("../pages/clubs/ClubsList"));
const ClubDetails = lazy(() => import("../pages/clubs/ClubDetails"));
const MyTickets = lazy(() => import("../pages/clubs/MyTickets"));
const PartnerInvite = lazy(() => import("../pages/clubs/PartnerInvite"));

const BlogList = lazy(() => import("../pages/BlogList"));
const AmityPGGuide = lazy(() => import("../pages/blogs/AmityPGGuide"));
const Sector62Guide = lazy(() => import("../pages/blogs/Sector62Guide"));

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



const SuperAdminDashboard = lazy(() => import("../admin/superAdmin/SuperAdminDashboard"));
const ManageOwners = lazy(() => import("../admin/superAdmin/ManageOwners"));
const ManagePGs = lazy(() => import("../admin/superAdmin/ManagePGs"));
const ManageStudents = lazy(() => import("../admin/superAdmin/ManageStudents"));
const OwnerDetails = lazy(() => import("../admin/superAdmin/OwnerDetails"));
const PGAdminDetails = lazy(() => import("../admin/superAdmin/PGDetails"));
const StudentDetails = lazy(() => import("../admin/superAdmin/StudentDetails"));
const ManageClubs = lazy(() => import("../admin/superAdmin/ManageClubs"));
const ManageClubBookings = lazy(() => import("../admin/superAdmin/ManageClubBookings"));


// Simple loading indicator for lazy routes
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F5]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent"></div>
  </div>
);

import { AudioProvider } from "../context/AudioContext";
import ManageReviews from "../admin/superAdmin/ManageReviews";

const AppRoutes = () => {
  return (
    <AudioProvider>
      <BrowserRouter>
        <Suspense fallback={null}><GlobalAudioPlayer /></Suspense>
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
          <Route path="/pg/:id" element={<PgDetails />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/pg-near-amity-university-noida" element={<AmityPGGuide />} />
          <Route path="/blogs/pg-in-sector-62-noida" element={<Sector62Guide />} /> 
          <Route path="/events" element={<Navigate to="/clubs" replace />} />
          <Route path="/clubs" element={<ClubsList />} />
          <Route path="/clubs/tickets" element={<ProtectedRoute role="student"><MyTickets /></ProtectedRoute>} />
          <Route path="/clubs/invite/:token" element={<PartnerInvite />} />
          <Route path="/clubs/:id" element={<ClubDetails />} />
          <Route path="/gym" element={<MyPG defaultTab="gym" />} />
          <Route path="/dr-dormn" element={<MyPG defaultTab="dr-dormn" />} />
          <Route path="/my-pg" element={<MyPG />} />
          <Route path="/my-pgs" element={<MyPG />} />      

          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />

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
            path="/my-pg"
            element={
              <ProtectedRoute role="student">
                <MyPG />
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
            path="/superadmin/manage-clubs"
            element={
              <ProtectedRoute role="superadmin">
                <ManageClubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/club-bookings"
            element={
              <ProtectedRoute role="superadmin">
                <ManageClubBookings />
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
            element={<BookingDetails />}
          />

          {/* Protected Owner Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute role="owner">
                <PGAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="add-pg" element={<AddPG />} />
            <Route path="my-pgs" element={<MyPGs />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="edit-pg/:id" element={<EditPG />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="requests" element={<OwnerRequests />} />
            <Route path="students" element={<Students />} />

            <Route path="notifications" element={<Notifications />} />

            
            <Route path="payments" element={<OwnerPayments />} />
            <Route path="kyc-forms" element={<TenantRegistrations />} />
            

          </Route>
          <Route path="*" element={<Navigate to="/pgs" replace />} />
        </Routes>
      </Suspense>
      </BrowserRouter>
    </AudioProvider>
  );
};

export default AppRoutes;