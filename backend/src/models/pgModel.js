import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import SavedPG from "../schemas/savedPGSchema.js";
import Booking from "../schemas/bookingSchema.js";

// Create New PG
export const createPG = async (pgData) => {
  const {
    owner_id,
    title,
    description,
    pg_type,
    price,
    address,
    city,
    area,
    nearby_college,
    available_rooms,
    amenities,
    rules,
    google_map_link,
    profile_image,
    sharing_options,
  } = pgData;

  const pg = await PG.create({
    owner_id,
    title,
    description,
    pg_type,
    price,
    address,
    city,
    area,
    nearby_college,
    available_rooms,
    amenities,
    rules,
    google_map_link,
    profile_image,
    sharing_options,
    status: "pending",
  });

  return { insertId: pg._id };
};

// Get All PGs (approved only, with owner info)
export const getAllPGs = async () => {
  const pgs = await PG.find({ status: "approved" })
    .sort({ created_at: -1 })
    .populate("owner_id", "full_name email")
    .lean();

  // Flatten owner info to match old API shape
  return pgs.map((pg) => ({
    ...pg,
    id: pg._id,
    owner_name: pg.owner_id?.full_name || "",
    owner_email: pg.owner_id?.email || "",
    owner_id: pg.owner_id?._id || pg.owner_id,
  }));
};

// Get Single PG By ID (with owner info + gallery)
export const getPGById = async (id) => {
  // Validate MongoDB ObjectId format before querying
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }

  const pg = await PG.findById(id)
    .populate("owner_id", "full_name email phone")
    .lean();

  if (!pg) return null;

  return {
    ...pg,
    id: pg._id,
    owner_name: pg.owner_id?.full_name || "",
    owner_email: pg.owner_id?.email || "",
    owner_phone: pg.owner_id?.phone || "",
    owner_id: pg.owner_id?._id || pg.owner_id,
  };
};

// Get PGs By Owner
export const getPGsByOwner = async (ownerId) => {
  const pgs = await PG.find({ owner_id: ownerId })
    .sort({ created_at: -1 })
    .lean();

  return pgs.map((pg) => ({ ...pg, id: pg._id }));
};

// Update PG
export const updatePG = async (id, pgData) => {
  return await PG.findByIdAndUpdate(id, pgData, { new: true });
};

// Delete PG
export const deletePG = async (id) => {
  return await PG.findByIdAndDelete(id);
};

// Save Multiple PG Images (appends to gallery subdocument array)
export const savePGImages = async (pgId, images) => {
  if (!images || images.length === 0) return;

  const galleryDocs = images.map((img, i) => ({
    image_url: img,
    display_order: i + 1,
    is_cover: i === 0 ? 1 : 0,
  }));

  await PG.findByIdAndUpdate(pgId, {
    $push: { gallery: { $each: galleryDocs } },
  });
};

// ==========================================
// SAVED PGS (FAVORITES) MODELS
// ==========================================

// Toggle Save/Unsave a PG
export const toggleSavePG = async (userId, pgId) => {
  const existing = await SavedPG.findOne({ user_id: userId, pg_id: pgId });

  if (existing) {
    await SavedPG.deleteOne({ _id: existing._id });
    return { isSaved: false, message: "PG removed from saved list" };
  } else {
    await SavedPG.create({ user_id: userId, pg_id: pgId });
    return { isSaved: true, message: "PG saved successfully" };
  }
};

// Get all PGs saved by a specific user
export const getSavedPGsByUser = async (userId) => {
  const saved = await SavedPG.find({ user_id: userId })
    .sort({ created_at: -1 })
    .lean();

  const pgIds = saved.map((s) => s.pg_id);

  const pgs = await PG.find({ _id: { $in: pgIds }, status: "approved" })
    .populate("owner_id", "full_name email")
    .lean();

  return pgs.map((pg) => ({
    ...pg,
    id: pg._id,
    owner_name: pg.owner_id?.full_name || "",
    owner_email: pg.owner_id?.email || "",
    owner_id: pg.owner_id?._id || pg.owner_id,
  }));
};

// ==========================================
// ADVANCED SEARCH & FILTER MODELS
// ==========================================

// Get distinct locations and landmarks for frontend dropdowns
export const getFilterOptions = async () => {
  const cities = await PG.distinct("city", { status: "approved", city: { $ne: "" } });
  const areas = await PG.distinct("area", { status: "approved", area: { $ne: "" } });
  const colleges = await PG.distinct("nearby_college", { status: "approved", nearby_college: { $ne: "" } });

  return { cities, areas, colleges };
};

// Advanced dynamic search query
export const searchPGs = async (filters) => {
  const { pg_type, city, area, nearby_college, min_price, max_price } = filters;

  const query = { status: "approved" };

  if (pg_type) query.pg_type = pg_type;
  if (city) query.city = city;
  if (area) query.area = area;
  if (nearby_college) query.nearby_college = nearby_college;
  if (min_price || max_price) {
    query.price = {};
    if (min_price) query.price.$gte = Number(min_price);
    if (max_price) query.price.$lte = Number(max_price);
  }

  const pgs = await PG.find(query)
    .sort({ created_at: -1 })
    .populate("owner_id", "full_name email")
    .lean();

  return pgs.map((pg) => ({
    ...pg,
    id: pg._id,
    owner_name: pg.owner_id?.full_name || "",
    owner_email: pg.owner_id?.email || "",
    owner_id: pg.owner_id?._id || pg.owner_id,
  }));
};

// ==========================================
// OWNER ANALYTICS MODEL
// ==========================================
export const getOwnerAnalyticsData = async (ownerId) => {
  const user = await User.findById(ownerId).lean();
  const subscriptionTier = user?.subscription_tier || "Pro Tier";

  const pgs = await PG.find({ owner_id: ownerId }).lean();

  if (pgs.length === 0) {
    return {
      subscriptionTier,
      totalPGs: 0,
      approvedPGs: 0,
      pendingPGs: 0,
      totalRooms: 0,
      totalStudents: 0,
      totalBookings: 0,
      estimatedMonthlyRevenue: 0,
      pgTypeBreakdown: { boys: 0, girls: 0, coed: 0 },
      bookingStats: { approved: 0, pending: 0, rejected: 0 },
      recentBookings: [],
      topPerformingPGs: []
    };
  }

  const pgIds = pgs.map(p => p._id);

  const bookings = await Booking.find({ pg_id: { $in: pgIds } })
    .sort({ _id: -1 })
    .populate("pg_id", "title city price")
    .lean();

  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');

  const estimatedMonthlyRevenue = approvedBookings.reduce(
    (sum, b) => sum + Number(b.booked_price || b.pg_id?.price || 0), 0
  );

  const totalRooms = pgs.reduce((sum, p) => sum + Number(p.available_rooms || 0), 0);

  const pgTypeBreakdown = {
    boys: pgs.filter(p => p.pg_type?.toLowerCase() === 'boys').length,
    girls: pgs.filter(p => p.pg_type?.toLowerCase() === 'girls').length,
    coed: pgs.filter(p => ['coed', 'both'].includes(p.pg_type?.toLowerCase())).length,
  };

  return {
    subscriptionTier,
    totalPGs: pgs.length,
    approvedPGs: pgs.filter(p => p.status === 'approved').length,
    pendingPGs: pgs.filter(p => p.status === 'pending').length,
    totalRooms,
    totalStudents: approvedBookings.length,
    totalBookings: bookings.length,
    estimatedMonthlyRevenue,
    pgTypeBreakdown,
    bookingStats: {
      approved: approvedBookings.length,
      pending: pendingBookings.length,
      rejected: rejectedBookings.length,
    },
    topPerformingPGs: pgs.map(pg => {
      const pgApproved = approvedBookings.filter(
        b => (b.pg_id?._id || b.pg_id).toString() === pg._id.toString()
      );
      return {
        id: pg._id,
        title: pg.title,
        city: pg.city,
        studentsCount: pgApproved.length,
        revenue: pgApproved.reduce(
          (sum, b) => sum + Number(b.booked_price || pg.price || 0), 0
        )
      };
    }).sort((a, b) => b.revenue - a.revenue)
  };
};