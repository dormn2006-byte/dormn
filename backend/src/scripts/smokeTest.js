/**
 * End-to-end contract smoke test for the MongoDB migration.
 *
 * Verifies that every major route group still returns the exact shapes the React
 * frontend consumes: numeric `id` (never `_id`/`__v`), snake_case fields, and the
 * specific join aliases that used to come from SQL JOINs.
 *
 * Usage (against a locally-running server):
 *   node src/scripts/smokeTest.js
 *
 * Env:
 *   SMOKE_BASE_URL  base URL of the API (default http://localhost:8000)
 */

import { connectDB, disconnectDB } from "../config/db.js";
import Coupon from "../schemas/couponSchema.js";
import User from "../schemas/userSchema.js";
import StudentProfile from "../schemas/studentProfileSchema.js";
import Enrollment from "../schemas/enrollmentSchema.js";
import { seedEvents } from "./seedEvents.js";

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const API = `${BASE}/api`;
const stamp = Date.now();

const OWNER = {
  full_name: "Smoke Owner",
  email: `smoke.owner.${stamp}@example.com`,
  password: "SmokePass123",
  role: "owner",
  gender: "male",
};
const STUDENT = {
  full_name: "Smoke Student",
  email: `smoke.student.${stamp}@example.com`,
  password: "SmokePass123",
  role: "student",
  gender: "female",
};

let passed = 0;
const failures = [];

const check = (label, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failures.push(`${label}${detail ? ` -> ${detail}` : ""}`);
    console.log(`  \u2717 ${label}${detail ? ` -> ${detail}` : ""}`);
  }
};

const request = async (method, path, { token, body, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, body: json };
};

// Shape guards — these are the invariants the frontend depends on.
const expectClientShape = (label, obj) => {
  if (!obj || typeof obj !== "object") return check(`${label}: is an object`, false, String(obj));
  check(`${label}: has numeric \`id\``, typeof obj.id === "number", `got ${typeof obj.id}`);
  check(`${label}: no \`_id\` leak`, obj._id === undefined);
  check(`${label}: no \`__v\` leak`, obj.__v === undefined);
};

const run = async () => {
  console.log(`\n=== Dormn MongoDB migration smoke test ===\nTarget: ${API}\n`);

  // ── Setup: coupon + events directly in the database ──
  console.log("[setup] seeding coupon + events");
  await connectDB();
  await Coupon.deleteMany({ code: "SMOKE10" });
  await Coupon.create({
    code: "SMOKE10",
    discount_type: "percentage",
    discount_value: 10,
    min_booking_amount: 100,
    max_discount_amount: 500,
    expiry_date: new Date(Date.now() + 86400000),
    usage_limit: 100,
    used_count: 0,
    is_active: 1,
  });
  await seedEvents();
  console.log("[setup] database ready (connection kept open for fixture updates)");

  // ── 1. Health ──
  console.log("\n[1] health");
  const health = await fetch(`${BASE}/`);
  check("GET / responds 200", health.status === 200);

  // ── 2. Auth ──
  console.log("\n[2] auth");
  const suLogin = await request("POST", "/auth/login", {
    body: { email: process.env.SUPERADMIN_EMAIL || "superadmin@dormn.com", password: process.env.SUPERADMIN_PASSWORD || "SuperAdmin@Dormn2026" },
  });
  check("superadmin login succeeds", suLogin.status === 200 && suLogin.body?.success === true, JSON.stringify(suLogin.body)?.slice(0, 120));
  const suToken = suLogin.body?.token;
  check("superadmin token returned", typeof suToken === "string");
  check("superadmin id is numeric", typeof suLogin.body?.user?.id === "number");
  check("superadmin is_email_verified is boolean", typeof suLogin.body?.user?.is_email_verified === "boolean");

  const ownerReg = await request("POST", "/auth/register", { body: OWNER });
  check("owner register succeeds", ownerReg.status === 201, JSON.stringify(ownerReg.body)?.slice(0, 160));
  const ownerToken = ownerReg.body?.token;
  check("owner register returns numeric id", typeof ownerReg.body?.user?.id === "number");

  const ownerLogin = await request("POST", "/auth/login", { body: { email: OWNER.email, password: OWNER.password } });
  check("owner login succeeds", ownerLogin.status === 200);
  const ownerTokenLive = ownerLogin.body?.token || ownerToken;

  const studentReg = await request("POST", "/auth/register", { body: STUDENT });
  check("student register succeeds", studentReg.status === 201, JSON.stringify(studentReg.body)?.slice(0, 160));
  const studentLogin = await request("POST", "/auth/login", { body: { email: STUDENT.email, password: STUDENT.password } });
  check("student login succeeds", studentLogin.status === 200);
  const studentToken = studentLogin.body?.token || studentReg.body?.token;

  const profile = await request("GET", "/auth/profile", { token: studentToken });
  check("GET /auth/profile succeeds", profile.status === 200);
  check("profile user has numeric id", typeof profile.body?.user?.id === "number");

  // A real user verifies via emailed OTP; mark both fixtures verified so the
  // requireVerifiedEmail guard on bookings behaves as it does in production.
  const verified = await User.updateMany(
    { email: { $in: [OWNER.email.toLowerCase(), STUDENT.email.toLowerCase()] } },
    { is_email_verified: 1 }
  );
  check("test fixtures marked email-verified", verified.modifiedCount === 2, `modified ${verified.modifiedCount}`);

  const badLogin = await request("POST", "/auth/login", { body: { email: OWNER.email, password: "WrongPass123" } });
  check("bad password rejected 401", badLogin.status === 401);

  // ── 3. Owner payout + PG creation ──
  console.log("\n[3] owner payout + PG CRUD");
  const payout = await request("PUT", "/auth/payout-details", {
    token: ownerTokenLive,
    body: { account_holder: "Smoke Owner", bank_name: "HDFC", account_number: "1234567890", ifsc_code: "HDFC0001234", upi_id: "smoke@upi" },
  });
  check("payout details saved", payout.status === 200, JSON.stringify(payout.body)?.slice(0, 140));

  const pgForm = new FormData();
  pgForm.append("title", "Smoke Test PG");
  pgForm.append("description", "A PG created by the smoke test");
  pgForm.append("pg_type", "boys");
  pgForm.append("price", "7500");
  pgForm.append("address", "12 Smoke Street");
  pgForm.append("city", "Smokeville");
  pgForm.append("area", "Smoke Area");
  pgForm.append("nearby_college", "Smoke College");
  pgForm.append("available_rooms", "5");
  pgForm.append("amenities", JSON.stringify(["WiFi", "AC"]));
  pgForm.append("rules", "No smoking");
  pgForm.append("sharing_options", JSON.stringify({ "AC": { "double": 7500 } }));

  const pgCreate = await request("POST", "/pg/create", { token: ownerTokenLive, form: pgForm });
  check("PG create succeeds", pgCreate.status === 201, JSON.stringify(pgCreate.body)?.slice(0, 160));
  check("PG create returns numeric pgId", typeof pgCreate.body?.pgId === "number");
  const pgId = pgCreate.body?.pgId;

  const ownerPgList = await request("GET", "/pg/owner/my-pgs", { token: ownerTokenLive });
  check("owner my-pgs succeeds", ownerPgList.status === 200);
  check("owner my-pgs includes new PG", Array.isArray(ownerPgList.body?.pgs) && ownerPgList.body.pgs.some((p) => p.id === pgId));
  const ownerPg = ownerPgList.body?.pgs?.find((p) => p.id === pgId);
  if (ownerPg) {
    expectClientShape("owner PG", ownerPg);
    check("owner PG has spots_left number", typeof ownerPg.spots_left === "number", String(ownerPg.spots_left));
    check("owner PG has occupied_spots number", typeof ownerPg.occupied_spots === "number");
    check("owner PG keeps pg_type normalized", ownerPg.pg_type === "Boys", ownerPg.pg_type);
  }

  const analytics = await request("GET", "/pg/owner/analytics", { token: ownerTokenLive });
  check("owner analytics succeeds", analytics.status === 200);
  check("analytics totalPGs counts PG", analytics.body?.data?.totalPGs >= 1);

  const pendingPublic = await request("GET", "/pg/all");
  check("pending PG hidden from public list", !pendingPublic.body?.pgs?.some((p) => p.id === pgId));

  const approve = await request("PUT", `/superadmin/approve-pg/${pgId}`, { token: suToken });
  check("superadmin approves PG", approve.status === 200, JSON.stringify(approve.body)?.slice(0, 140));

  const publicList = await request("GET", "/pg/all");
  check("GET /pg/all succeeds", publicList.status === 200);
  const listedPg = publicList.body?.pgs?.find((p) => p.id === pgId);
  check("approved PG appears publicly", Boolean(listedPg));
  if (listedPg) {
    expectClientShape("public PG", listedPg);
    check("public PG has owner_name from join", listedPg.owner_name === "Smoke Owner", String(listedPg.owner_name));
    check("public PG has owner_email from join", typeof listedPg.owner_email === "string");
    check("public PG amenities round-trips as array", Array.isArray(listedPg.amenities), JSON.stringify(listedPg.amenities)?.slice(0, 60));
  }

  const single = await request("GET", `/pg/${pgId}`);
  check("GET /pg/:id succeeds", single.status === 200);
  check("single PG includes gallery array", Array.isArray(single.body?.pg?.gallery));
  check("single PG has owner_phone from join", single.body?.pg?.owner_phone === null || typeof single.body?.pg?.owner_phone === "string");

  const search = await request("GET", `/pg/search?city=Smokeville&min_price=1000&max_price=99999&keyword=Smoke`);
  check("search succeeds", search.status === 200);
  check("search finds the PG", search.body?.pgs?.some((p) => p.id === pgId), `keyword/city filter (${search.body?.pgs?.length} results)`);

  const filterOptions = await request("GET", "/pg/filter-options");
  check("filter-options succeeds", filterOptions.status === 200);
  check("filter-options lists city", filterOptions.body?.data?.cities?.includes("Smokeville"));

  const missingPg = await request("GET", "/pg/999999");
  check("missing PG returns 404", missingPg.status === 404);

  // ── 4. Saved PGs ──
  console.log("\n[4] saved PGs");
  const save1 = await request("POST", "/pg/save", { token: studentToken, body: { pgId } });
  check("save PG toggles on", save1.status === 200 && save1.body?.isSaved === true);
  const savedList = await request("GET", "/pg/saved", { token: studentToken });
  check("saved list contains PG", savedList.body?.pgs?.some((p) => p.id === pgId));
  const save2 = await request("POST", "/pg/save", { token: studentToken, body: { pgId } });
  check("save PG toggles off", save2.status === 200 && save2.body?.isSaved === false);

  // ── 5. Bookings ──
  console.log("\n[5] bookings");
  const booking = await request("POST", "/bookings/create", {
    token: studentToken,
    body: { pg_id: pgId, message: "Smoke test booking", selected_room_type: "AC - Double", booked_price: 7500 },
  });
  check("create booking succeeds", booking.status === 201, JSON.stringify(booking.body)?.slice(0, 160));
  check("booking returns numeric bookingId", typeof booking.body?.bookingId === "number");
  const bookingId = booking.body?.bookingId;

  const myBookings = await request("GET", "/bookings/my-bookings", { token: studentToken });
  check("student bookings list succeeds", myBookings.status === 200);
  const studentBooking = myBookings.body?.bookings?.find((b) => b.id === bookingId);
  check("student booking present", Boolean(studentBooking));
  if (studentBooking) {
    check("student booking has pg title from join", studentBooking.title === "Smoke Test PG", String(studentBooking.title));
    check("student booking has owner_name from join", studentBooking.owner_name === "Smoke Owner", String(studentBooking.owner_name));
    check("student booking has owner_phone key", "owner_phone" in studentBooking);
  }

  const ownerBookings = await request("GET", "/bookings/owner-bookings", { token: ownerTokenLive });
  check("owner bookings list succeeds", ownerBookings.status === 200);
  const ownerBooking = ownerBookings.body?.bookings?.find((b) => b.id === bookingId);
  check("owner booking present", Boolean(ownerBooking));
  if (ownerBooking) {
    check("owner booking has student_name from join", ownerBooking.student_name === "Smoke Student");
    check("owner booking has student_email from join", ownerBooking.student_email === STUDENT.email);
  }

  const approveBooking = await request("PUT", `/bookings/${bookingId}/status`, { token: ownerTokenLive, body: { status: "approved" } });
  check("owner approves booking", approveBooking.status === 200, JSON.stringify(approveBooking.body)?.slice(0, 140));

  // The active-stay guard only applies once a stay is approved/paid.
  const duplicateGuard = await request("POST", "/bookings/create", { token: studentToken, body: { pg_id: pgId } });
  check("further booking blocked by active-stay guard once approved", duplicateGuard.status === 400 && duplicateGuard.body?.code === "ACTIVE_STAY_EXISTS", JSON.stringify(duplicateGuard.body)?.slice(0, 160));

  const myPgs = await request("GET", "/bookings/my-pgs", { token: studentToken });
  check("GET /bookings/my-pgs succeeds", myPgs.status === 200);
  const enrolled = myPgs.body?.booking;
  check("enrolled booking returned", Boolean(enrolled));
  if (enrolled) {
    check("enrolled booking_id is numeric", typeof enrolled.booking_id === "number");
    check("enrolled pg_id is numeric", typeof enrolled.pg_id === "number");
    check("enrolled pg title aliased", enrolled.title === "Smoke Test PG");
    check("enrolled booking_date present", enrolled.booking_date !== undefined);
  }

  const invalidStatus = await request("PUT", `/bookings/${bookingId}/status`, { token: ownerTokenLive, body: { status: "bogus" } });
  check("invalid booking status rejected 400", invalidStatus.status === 400);

  // ── 6. Payments / coupons ──
  console.log("\n[6] payments + coupons");
  const coupon = await request("POST", "/payments/apply-coupon", { token: studentToken, body: { code: "SMOKE10", original_amount: 1000 } });
  check("apply-coupon succeeds", coupon.status === 200, JSON.stringify(coupon.body)?.slice(0, 140));
  check("coupon discount is 10%", coupon.body?.discount_applied === 100, String(coupon.body?.discount_applied));
  check("coupon final amount correct", coupon.body?.final_amount === 900, String(coupon.body?.final_amount));

  const lowercaseCoupon = await request("POST", "/payments/apply-coupon", { token: studentToken, body: { code: "smoke10", original_amount: 1000 } });
  check("coupon lookup stays case-insensitive", lowercaseCoupon.status === 200, `status ${lowercaseCoupon.status}`);

  const badCoupon = await request("POST", "/payments/apply-coupon", { token: studentToken, body: { code: "NOPE", original_amount: 1000 } });
  check("invalid coupon returns 404", badCoupon.status === 404);

  const ownerPayments = await request("GET", "/payments/owner-payments", { token: ownerTokenLive });
  check("owner payments endpoint responds", ownerPayments.status === 200, `status ${ownerPayments.status}`);

  const subscription = await request("GET", "/subscriptions/my-subscription", { token: ownerTokenLive });
  check("my-subscription succeeds", subscription.status === 200, JSON.stringify(subscription.body)?.slice(0, 140));
  check("subscription has tier", typeof subscription.body?.data?.tier === "string", String(subscription.body?.data?.tier));

  // ── 7. Student profile ──
  console.log("\n[7] student profile");
  const saveProfile = await request("POST", "/student/profile", {
    token: studentToken,
    body: { full_name: "Smoke Student", bio: "Hello", interests: ["reading"], hobbies: ["chess"], socials: { instagram: "@smoke" }, is_public: 1 },
  });
  // The controller previously referenced an undefined `collegeIdImage` identifier,
  // so this endpoint always threw a ReferenceError. Fixed during the migration.
  check("save student profile succeeds", saveProfile.status === 200, `status ${saveProfile.status} ${JSON.stringify(saveProfile.body)?.slice(0, 120)}`);

  const getProfile = await request("GET", "/student/profile", { token: studentToken });
  check("get student profile succeeds", getProfile.status === 200, JSON.stringify(getProfile.body)?.slice(0, 140));

  // Second save takes the update branch (the bug existed in both).
  const resaveProfile = await request("POST", "/student/profile", {
    token: studentToken,
    body: { full_name: "Smoke Student", bio: "Updated", interests: ["reading"], hobbies: ["chess"], socials: {}, is_public: 1, collegeIdImage: "cid.webp" },
  });
  check("re-save student profile succeeds (update branch)", resaveProfile.status === 200, `status ${resaveProfile.status}`);

  // ── 8. Maintenance ──
  console.log("\n[8] maintenance");
  const maint = await request("POST", "/maintenance", {
    token: studentToken,
    body: { pg_id: pgId, category: "Plumbing", location: "My Room", title: "Leaky tap", description: "Dripping", priority: "Normal" },
  });
  check("create maintenance request succeeds", maint.status === 201 || maint.status === 200, JSON.stringify(maint.body)?.slice(0, 150));
  const requestId = maint.body?.requestId;

  const studentMaint = await request("GET", "/maintenance/student", { token: studentToken });
  check("student maintenance list succeeds", studentMaint.status === 200);
  check("maintenance request listed", studentMaint.body?.requests?.some((r) => r.id === requestId));

  const ownerMaint = await request("GET", "/maintenance/owner", { token: ownerTokenLive });
  check("owner maintenance list succeeds", ownerMaint.status === 200);

  if (requestId) {
    const resolve = await request("PUT", `/maintenance/${requestId}/status`, { token: ownerTokenLive, body: { status: "resolved", resolution_note: "Fixed" } });
    check("owner resolves maintenance", resolve.status === 200, JSON.stringify(resolve.body)?.slice(0, 140));
  }

  // ── 9. Reviews ──
  console.log("\n[9] reviews");
  const review = await request("POST", "/reviews/create", { token: studentToken, body: { rating: 5, description: "Smoke review" } });
  check("create review succeeds", review.status === 201, JSON.stringify(review.body)?.slice(0, 140));

  const adminReviews = await request("GET", "/reviews/admin/all", { token: suToken });
  check("admin reviews list succeeds", adminReviews.status === 200);
  const newReview = adminReviews.body?.reviews?.find((r) => r.description === "Smoke review");
  check("review visible to admin", Boolean(newReview));
  if (newReview) {
    check("admin review has full_name from join", newReview.full_name === "Smoke Student", String(newReview.full_name));
    check("admin review has email from join", newReview.email === STUDENT.email);
    check("admin review id is numeric", typeof newReview.id === "number");

    const approveReview = await request("PUT", "/reviews/admin/status", { token: suToken, body: { id: newReview.id, status: "approved" } });
    check("review status update succeeds", approveReview.status === 200);

    const publicReviews = await request("GET", "/reviews");
    check("approved review is public", publicReviews.body?.reviews?.some((r) => r.description === "Smoke review"));
    const publicReview = publicReviews.body?.reviews?.find((r) => r.description === "Smoke review");
    if (publicReview) {
      check("public review has title from join", publicReview.title === "Smoke Student");
      check("public review has tag computed", publicReview.tag === "Verified Student", String(publicReview.tag));
    }

    const deleteReview = await request("DELETE", `/reviews/admin/${newReview.id}`, { token: suToken });
    check("review delete succeeds", deleteReview.status === 200);
  }

  // ── 10. Enrollments ──
  console.log("\n[10] enrollments");
  const enrollment = await request("POST", "/enrollments/submit", {
    token: studentToken,
    body: {
      booking_id: bookingId, pg_id: pgId, dob: "2000-01-01", home_address: "1 Home St", hometown: "Smokeville",
      pincode: "123456", parent_1_name: "Parent One", parent_1_relation: "Father", parent_1_phone: "9999999999",
      guardian_name: "Guardian", guardian_relation: "Uncle", guardian_phone: "8888888888",
      food_preference: "Veg", blood_group: "O+", occupation: "Student", college_name: "Smoke College",
      interests: ["coding"], suggestions: "None",
    },
  });
  check("submit enrollment succeeds", enrollment.status === 201 || enrollment.status === 200, JSON.stringify(enrollment.body)?.slice(0, 150));

  const ownerEnrollments = await request("GET", "/enrollments/owner-list", { token: ownerTokenLive });
  check("owner enrollment list succeeds", ownerEnrollments.status === 200, JSON.stringify(ownerEnrollments.body)?.slice(0, 140));

  // ── 11. Events ──
  console.log("\n[11] events");
  const events = await request("GET", "/events");
  check("GET /events succeeds", events.status === 200);
  const eventList = events.body?.events || events.body?.data || [];
  check("events seeded", Array.isArray(eventList) && eventList.length > 0, `count ${eventList.length}`);
  if (eventList.length > 0) {
    const first = eventList[0];
    check("event has string id", typeof first.id === "string", `${first.id} (${typeof first.id})`);
    check("event gallery is native array", Array.isArray(first.gallery), typeof first.gallery);
    const singleEvent = await request("GET", `/events/${first.id}`);
    check("GET /events/:id succeeds", singleEvent.status === 200, `status ${singleEvent.status}`);
  }

  // ── 12. Chat ──
  console.log("\n[12] PG chat");
  const rooms = await request("GET", "/pg-chat/my-rooms", { token: studentToken });
  check("GET /pg-chat/my-rooms responds", rooms.status === 200, `status ${rooms.status}`);

  const messages = await request("GET", `/pg-chat/${pgId}/messages?limit=20`, { token: ownerTokenLive });
  check("GET /pg-chat/:pgId/messages responds", messages.status === 200, `status ${messages.status}`);

  // ── 13. Clubs (newly mounted) ──
  console.log("\n[13] clubs");
  const clubs = await request("GET", "/clubs");
  check("GET /clubs responds 200", clubs.status === 200, `status ${clubs.status}`);
  check("clubs payload has clubs array", Array.isArray(clubs.body?.clubs), JSON.stringify(clubs.body)?.slice(0, 100));

  const clubCreate = await request("POST", "/clubs", {
    token: suToken,
    body: { name: "Smoke Club", city: "Smokeville", single_entry_fee: 500, area: "Downtown", address: "1 Club Rd" },
  });
  check("create club succeeds", clubCreate.status === 201 || clubCreate.status === 200, `status ${clubCreate.status} ${JSON.stringify(clubCreate.body)?.slice(0, 120)}`);
  const clubId = clubCreate.body?.club?.id || clubCreate.body?.clubId || clubCreate.body?.id;
  check("club returns numeric id", typeof clubId === "number", `got ${typeof clubId}`);

  if (typeof clubId === "number") {
    const clubDetail = await request("GET", `/clubs/${clubId}`);
    check("GET /clubs/:id succeeds", clubDetail.status === 200);
    check("club detail has images array", Array.isArray(clubDetail.body?.club?.images));

    const myTickets = await request("GET", "/clubs/my-tickets", { token: studentToken });
    check("GET /clubs/my-tickets responds 200", myTickets.status === 200, `status ${myTickets.status}`);
  }

  // ── 14. Super admin reporting ──
  console.log("\n[14] superadmin reporting");
  for (const path of ["/superadmin/dashboard-stats", "/superadmin/all-users", "/superadmin/all-bookings", "/superadmin/owners", "/superadmin/students", "/superadmin/pgs"]) {
    const res = await request("GET", path, { token: suToken });
    check(`GET ${path} succeeds`, res.status === 200, `status ${res.status}`);
  }

  const pgDetail = await request("GET", `/superadmin/pg/${pgId}`, { token: suToken });
  check("superadmin PG detail succeeds", pgDetail.status === 200, `status ${pgDetail.status}`);

  const studentDetail = await request("GET", `/superadmin/student/${studentLogin.body?.user?.id}`, { token: suToken });
  check("superadmin student detail succeeds", studentDetail.status === 200, `status ${studentDetail.status}`);

  // ── 15. Authz guards ──
  console.log("\n[15] authorization guards");
  const noToken = await request("GET", "/auth/profile");
  check("profile without token is 401", noToken.status === 401);
  const studentOnOwnerRoute = await request("GET", "/pg/owner/my-pgs", { token: studentToken });
  check("student blocked from owner route", studentOnOwnerRoute.status === 403, `status ${studentOnOwnerRoute.status}`);
  const studentOnAdminRoute = await request("GET", "/superadmin/dashboard-stats", { token: studentToken });
  check("student blocked from superadmin route", studentOnAdminRoute.status === 403, `status ${studentOnAdminRoute.status}`);

  // ── 16. Pre-payment tenant details (payment KYC) ──
  console.log("\n[16] pre-payment tenant details");
  const AADHAR = "234512345678";
  const kycBase = {
    booking_id: bookingId,
    name: "Smoke Student",
    email: STUDENT.email,
    phone: "9876543210",
    guardianName: "Smoke Guardian",
    guardianEmail: "guardian@example.com",
    guardianPhone: "9876543211",
    currentAddress: "42 Test Street, Smokeville",
    aadharNumber: AADHAR,
  };

  const missingGuardian = await request("POST", "/student/payment-kyc", {
    token: studentToken,
    body: { ...kycBase, guardianName: "" },
  });
  check("rejects missing guardian name", missingGuardian.status === 400, `status ${missingGuardian.status}`);

  const badAadhar = await request("POST", "/student/payment-kyc", {
    token: studentToken,
    body: { ...kycBase, aadharNumber: "12345" },
  });
  check("rejects invalid Aadhar", badAadhar.status === 400, `status ${badAadhar.status}`);

  const badGuardianEmail = await request("POST", "/student/payment-kyc", {
    token: studentToken,
    body: { ...kycBase, guardianEmail: "not-an-email" },
  });
  check("rejects invalid guardian email", badGuardianEmail.status === 400, `status ${badGuardianEmail.status}`);

  const badPhone = await request("POST", "/student/payment-kyc", {
    token: studentToken,
    body: { ...kycBase, phone: "123" },
  });
  check("rejects invalid mobile number", badPhone.status === 400, `status ${badPhone.status}`);

  const kyc = await request("POST", "/student/payment-kyc", { token: studentToken, body: kycBase });
  check("valid tenant details accepted", kyc.status === 200, JSON.stringify(kyc.body)?.slice(0, 140));

  const profAfterKyc = await request("GET", "/student/profile", { token: studentToken });
  check("profile returns guardian email", profAfterKyc.body?.profile?.guardianEmail === "guardian@example.com", String(profAfterKyc.body?.profile?.guardianEmail));
  check("profile returns decrypted Aadhar", profAfterKyc.body?.profile?.aadharNumber === AADHAR, String(profAfterKyc.body?.profile?.aadharNumber));

  const studentUserId = studentLogin.body?.user?.id;
  const storedProfile = await StudentProfile.findOne({ user_id: studentUserId }).lean();
  check("Aadhar encrypted at rest in student_profiles", String(storedProfile?.aadhar_number || "").startsWith("enc:"), String(storedProfile?.aadhar_number).slice(0, 20));
  check("guardian_email persisted on profile", storedProfile?.guardian_email === "guardian@example.com");

  const storedEnrollment = await Enrollment.findOne({ booking_id: bookingId }).lean();
  check("enrollment row exists for the booking", Boolean(storedEnrollment));
  check("Aadhar encrypted at rest in enrollment_forms", String(storedEnrollment?.aadhar_number || "").startsWith("enc:"), String(storedEnrollment?.aadhar_number).slice(0, 20));

  const ownerEnroll = await request("GET", "/enrollments/owner-list", { token: ownerTokenLive });
  const ownerRow = ownerEnroll.body?.enrollments?.find((e) => e.booking_id === bookingId);
  check("owner sees the tenant row", Boolean(ownerRow));
  if (ownerRow) {
    check("owner sees masked Aadhar", ownerRow.aadhar_number === `XXXX XXXX ${AADHAR.slice(-4)}`, String(ownerRow.aadhar_number));
    check("owner response never contains full Aadhar", !JSON.stringify(ownerRow).includes(AADHAR));
    check("owner sees guardian email", ownerRow.guardian_email === "guardian@example.com");
  }

  const crossAccount = await request("POST", "/student/payment-kyc", {
    token: ownerTokenLive,
    body: { ...kycBase, name: "Owner", email: OWNER.email },
  });
  check("rejected 403 for a booking that isn't yours", crossAccount.status === 403, `status ${crossAccount.status}`);

  // ── 17. Owner review cycle: accept / reject / reapply ──
  console.log("\n[17] tenant review cycle");

  const mineBefore = await request("GET", "/enrollments/mine", { token: studentToken });
  check("student can read own KYC status", mineBefore.status === 200, `status ${mineBefore.status}`);
  const enrollmentId = mineBefore.body?.enrollment?.id;
  check("KYC record exists for the student", typeof enrollmentId === "number", `id ${enrollmentId}`);
  check("starts as pending", mineBefore.body?.enrollment?.status === "pending", String(mineBefore.body?.enrollment?.status));

  const rejectNoNote = await request("PUT", "/enrollments/status", {
    token: ownerTokenLive,
    body: { enrollment_id: enrollmentId, status: "rejected" },
  });
  check("reject without a reason is refused", rejectNoNote.status === 400, `status ${rejectNoNote.status}`);

  const badStatus = await request("PUT", "/enrollments/status", {
    token: ownerTokenLive,
    body: { enrollment_id: enrollmentId, status: "banana" },
  });
  check("invalid review status is refused", badStatus.status === 400, `status ${badStatus.status}`);

  const REJECT_REASON = "Aadhar number does not match the document provided.";
  const reject = await request("PUT", "/enrollments/status", {
    token: ownerTokenLive,
    body: { enrollment_id: enrollmentId, status: "rejected", rejection_note: REJECT_REASON },
  });
  check("reject with a reason succeeds", reject.status === 200, JSON.stringify(reject.body)?.slice(0, 120));

  const mineRejected = await request("GET", "/enrollments/mine", { token: studentToken });
  check("student sees rejected status", mineRejected.body?.enrollment?.status === "rejected", String(mineRejected.body?.enrollment?.status));
  check("student sees the owner's reason", mineRejected.body?.enrollment?.rejection_note === REJECT_REASON, String(mineRejected.body?.enrollment?.rejection_note));

  const ownerListAfterReject = await request("GET", "/enrollments/owner-list", { token: ownerTokenLive });
  const rejectedRow = ownerListAfterReject.body?.enrollments?.find((e) => e.id === enrollmentId);
  check("owner sees the rejection reason", rejectedRow?.rejection_note === REJECT_REASON, String(rejectedRow?.rejection_note));

  // Reapply — same details endpoint, no further payment involved
  const reapply = await request("POST", "/student/payment-kyc", {
    token: studentToken,
    body: { ...kycBase, aadharNumber: "234598765432" },
  });
  check("student can reapply without paying again", reapply.status === 200, `status ${reapply.status}`);

  const mineReapplied = await request("GET", "/enrollments/mine", { token: studentToken });
  check("reapply returns the tenant to pending", mineReapplied.body?.enrollment?.status === "pending", String(mineReapplied.body?.enrollment?.status));
  check("reapply clears the previous reason", mineReapplied.body?.enrollment?.rejection_note == null, String(mineReapplied.body?.enrollment?.rejection_note));
  check("reapply stamps resubmitted_at", Boolean(mineReapplied.body?.enrollment?.resubmitted_at), String(mineReapplied.body?.enrollment?.resubmitted_at));

  const accept = await request("PUT", "/enrollments/status", {
    token: ownerTokenLive,
    body: { enrollment_id: enrollmentId, status: "verified" },
  });
  check("owner accepts the tenant", accept.status === 200, JSON.stringify(accept.body)?.slice(0, 120));

  const mineVerified = await request("GET", "/enrollments/mine", { token: studentToken });
  check("student sees enrolled / verified", mineVerified.body?.enrollment?.status === "verified", String(mineVerified.body?.enrollment?.status));

  // A later save must never knock an accepted tenant back into review
  const afterAcceptSave = await request("POST", "/student/payment-kyc", { token: studentToken, body: kycBase });
  check("later details save after acceptance succeeds", afterAcceptSave.status === 200, `status ${afterAcceptSave.status}`);
  const mineStillVerified = await request("GET", "/enrollments/mine", { token: studentToken });
  check("accepted tenant stays verified after a new save", mineStillVerified.body?.enrollment?.status === "verified", String(mineStillVerified.body?.enrollment?.status));

  const studentCannotReview = await request("PUT", "/enrollments/status", {
    token: studentToken,
    body: { enrollment_id: enrollmentId, status: "verified" },
  });
  check("student cannot accept their own KYC", studentCannotReview.status === 403, `status ${studentCannotReview.status}`);

  // ── Summary ──
  await disconnectDB();

  console.log(`\n=== RESULT: ${passed} passed, ${failures.length} failed ===`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("All contract checks passed.\n");
};

run().catch(async (err) => {
  console.error("\nSMOKE TEST CRASHED:", err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
