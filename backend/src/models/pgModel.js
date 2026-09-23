import PG from "../schemas/pgSchema.js";
import Booking from "../schemas/bookingSchema.js";
import User from "../schemas/userSchema.js";
import SavedPG from "../schemas/savedPGSchema.js";
import { serialize } from "../utils/serialize.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// `$toString` throws on arrays ("Unsupported conversion from array to string"),
// and `amenities` is a Mixed field that may be an array of strings, an array of
// objects, or a plain object. Flatten it into one searchable string so keyword
// and amenity searches don't blow up the aggregation.
const amenitiesSearchText = () => ({
  $let: {
    vars: {
      items: {
        $cond: [
          { $isArray: "$amenities" },
          { $ifNull: ["$amenities", []] },
          {
            $cond: [
              { $eq: [{ $type: "$amenities" }, "object"] },
              {
                $map: {
                  input: { $objectToArray: { $ifNull: ["$amenities", {}] } },
                  in: "$$this.k",
                },
              },
              [],
            ],
          },
        ],
      },
    },
    in: {
      $reduce: {
        input: "$$items",
        initialValue: {
          $convert: {
            input: { $ifNull: ["$amenities", ""] },
            to: "string",
            onError: "",
          },
        },
        in: {
          $concat: [
            "$$value",
            " ",
            { $convert: { input: "$$this", to: "string", onError: "" } },
          ],
        },
      },
    },
  },
});

// Only PGs whose owner is on a usable subscription are publicly visible.
const ownerSubscriptionMatch = () => ({
  $or: [
    { "owner.role": { $ne: "owner" } },
    { "owner.subscription_status": null },
    { "owner.subscription_status": { $in: ["trial", "active"] } },
    { "owner.subscription_expires_at": { $gt: new Date() } },
  ],
});

const ownerLookup = [
  {
    $lookup: {
      from: "users",
      localField: "owner_id",
      foreignField: "_id",
      as: "owner",
    },
  },
  { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
];

const occupancyLookup = [
  {
    $lookup: {
      from: "bookings",
      let: { pgId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$pg_id", "$$pgId"] },
                {
                  $or: [
                    { $eq: ["$status", "approved"] },
                    { $eq: ["$payment_status", "paid"] },
                  ],
                },
              ],
            },
          },
        },
        { $count: "total" },
      ],
      as: "occupancy",
    },
  },
  {
    $addFields: {
      occupied_spots: {
        $ifNull: [{ $arrayElemAt: ["$occupancy.total", 0] }, 0],
      },
    },
  },
  {
    $addFields: {
      spots_left: {
        $max: [
          0,
          { $subtract: [{ $ifNull: ["$available_rooms", 0] }, "$occupied_spots"] },
        ],
      },
    },
  },
];

const ownerNameFields = [
  {
    $addFields: {
      owner_name: "$owner.full_name",
      owner_email: "$owner.email",
      owner_phone: "$owner.phone",
    },
  },
];

const publicListPipeline = (match = {}) => [
  { $match: match },
  ...ownerLookup,
  ...occupancyLookup,
  { $match: ownerSubscriptionMatch() },
  {
    $addFields: {
      _spots_available: { $cond: [{ $gt: ["$spots_left", 0] }, 1, 0] },
    },
  },
  { $sort: { _spots_available: -1, created_at: -1 } },
  ...ownerNameFields,
  { $project: { owner: 0, occupancy: 0, _spots_available: 0, gallery: 0 } },
];

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
    profile_image,
    google_map_link,
    status: "pending",
    sharing_options,
  });

  return { insertId: pg._id, affectedRows: 1 };
};

// Get All PGs
export const getAllPGs = async () => {
  const rows = await PG.aggregate(publicListPipeline({ status: "approved" }));
  return serialize(rows);
};

// Get Single PG By ID
export const getPGById = async (id) => {
  const pgId = Number(id);
  if (!Number.isFinite(pgId)) return null;

  const [pg] = await PG.aggregate([
    { $match: { _id: pgId } },
    ...ownerLookup,
    ...occupancyLookup,
    ...ownerNameFields,
    { $project: { owner: 0, occupancy: 0 } },
    { $limit: 1 },
  ]);

  if (!pg) return null;

  pg.gallery = (pg.gallery || [])
    .slice()
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return serialize(pg);
};

// Get PGs By Owner
export const getPGsByOwner = async (ownerId) => {
  const rows = await PG.aggregate([
    { $match: { owner_id: Number(ownerId) } },
    ...occupancyLookup,
    { $sort: { created_at: -1 } },
    { $project: { occupancy: 0, gallery: 0 } },
  ]);

  return serialize(rows);
};

// Update PG
export const updatePG = async (id, pgData) => {
  const {
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

  const result = await PG.updateOne(
    { _id: Number(id) },
    {
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
    }
  );

  return result;
};

// Delete PG
export const deletePG = async (id) => {
  return PG.deleteOne({ _id: Number(id) });
};

// Save Multiple PG Images
export const savePGImages = async (pgId, images) => {
  if (!images || images.length === 0) return;

  const gallery = images.map((image, index) => ({
    image_url: image,
    display_order: index + 1,
    is_cover: index === 0 ? 1 : 0,
  }));

  await PG.updateOne({ _id: Number(pgId) }, { $push: { gallery: { $each: gallery } } });
};

// ==========================================
// SAVED PGS (FAVORITES) MODELS
// ==========================================

// Toggle Save/Unsave a PG
export const toggleSavePG = async (userId, pgId) => {
  const user = Number(userId);
  const pg = Number(pgId);

  const existing = await SavedPG.findOne({ user_id: user, pg_id: pg }).lean();

  if (existing) {
    await SavedPG.deleteOne({ user_id: user, pg_id: pg });
    return { isSaved: false, message: "PG removed from saved list" };
  }

  await SavedPG.create({ user_id: user, pg_id: pg });

  return { isSaved: true, message: "PG saved successfully" };
};

// Get all PGs saved by a specific user
export const getSavedPGsByUser = async (userId) => {
  const rows = await PG.aggregate([
    {
      $lookup: {
        from: "saved_pgs",
        let: { pgId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$pg_id", "$$pgId"] },
                  { $eq: ["$user_id", Number(userId)] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "saved",
      },
    },
    { $unwind: "$saved" },
    { $match: { status: "approved" } },
    ...ownerLookup,
    ...occupancyLookup,
    { $match: ownerSubscriptionMatch() },
    {
      $addFields: {
        _spots_available: { $cond: [{ $gt: ["$spots_left", 0] }, 1, 0] },
      },
    },
    { $sort: { _spots_available: -1, "saved.created_at": -1 } },
    ...ownerNameFields,
    { $project: { owner: 0, occupancy: 0, saved: 0, _spots_available: 0, gallery: 0 } },
  ]);

  return serialize(rows);
};

// ==========================================
// NEW ADVANCED SEARCH & FILTER MODELS
// ==========================================

// Get distinct locations and landmarks for frontend dropdowns
export const getFilterOptions = async () => {
  const match = { status: "approved" };

  const [cities, areas, colleges] = await Promise.all([
    PG.distinct("city", { ...match, city: { $nin: [null, ""] } }),
    PG.distinct("area", { ...match, area: { $nin: [null, ""] } }),
    PG.distinct("nearby_college", {
      ...match,
      nearby_college: { $nin: [null, ""] },
    }),
  ]);

  return { cities, areas, colleges };
};

// Advanced dynamic search query
export const searchPGs = async (filters) => {
  const {
    pg_type,
    city,
    area,
    nearby_college,
    min_price,
    max_price,
    amenity,
    keyword,
  } = filters;

  const match = { status: "approved" };
  const expressions = [];

  // Locations are stored as free text (e.g. "noida"), but callers — the AI
  // assistant in particular — send "Noida". Match case-insensitively so a
  // capitalised city name doesn't silently return nothing.
  const caseInsensitive = (value) => ({
    $regex: `^${escapeRegex(value)}$`,
    $options: "i",
  });

  if (pg_type) match.pg_type = pg_type;
  if (city) match.city = caseInsensitive(city);
  if (area) match.area = caseInsensitive(area);
  if (nearby_college) match.nearby_college = caseInsensitive(nearby_college);

  if (amenity) {
    expressions.push({
      $regexMatch: {
        input: amenitiesSearchText(),
        regex: escapeRegex(amenity),
        options: "i",
      },
    });
  }

  if (keyword) {
    const regex = escapeRegex(keyword);
    const fields = ["title", "city", "area", "address"];

    expressions.push({
      $or: [
        ...fields.map((field) => ({
          $regexMatch: {
            input: { $ifNull: [`$${field}`, ""] },
            regex,
            options: "i",
          },
        })),
        {
          $regexMatch: {
            input: amenitiesSearchText(),
            regex,
            options: "i",
          },
        },
      ],
    });
  }

  if (expressions.length > 0) {
    match.$expr = expressions.length === 1 ? expressions[0] : { $and: expressions };
  }

  if (min_price || max_price) {
    match.price = {};
    if (min_price) match.price.$gte = Number(min_price);
    if (max_price) match.price.$lte = Number(max_price);
  }

  const rows = await PG.aggregate(publicListPipeline(match));

  return serialize(rows);
};

// ==========================================
// OWNER ANALYTICS MODEL
// ==========================================
export const getOwnerAnalyticsData = async (ownerId) => {
  const owner = await User.findById(Number(ownerId))
    .select("subscription_tier")
    .lean();
  const subscriptionTier = owner?.subscription_tier || "Pro Tier";

  const pgs = await PG.find({ owner_id: Number(ownerId) }).lean();

  if (pgs.length === 0) {
    return {
      subscriptionTier,
      totalPGs: 0,
      approvedPGs: 0,
      pendingPGs: 0,
      totalRooms: 0,
      totalSpots: 0,
      occupiedSpots: 0,
      spotsLeft: 0,
      totalStudents: 0,
      totalBookings: 0,
      estimatedMonthlyRevenue: 0,
      pgTypeBreakdown: { boys: 0, girls: 0, coed: 0 },
      bookingStats: { approved: 0, pending: 0, rejected: 0 },
      recentBookings: [],
      topPerformingPGs: [],
    };
  }

  const pgIds = pgs.map((p) => p._id);

  const bookings = await Booking.find({ pg_id: { $in: pgIds } })
    .sort({ _id: -1 })
    .lean();

  const approvedBookings = bookings.filter(
    (b) => b.status === "approved" || b.payment_status === "paid"
  );
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const rejectedBookings = bookings.filter((b) => b.status === "rejected");

  const estimatedMonthlyRevenue = approvedBookings.reduce(
    (sum, b) => sum + Number(b.booked_price || 0),
    0
  );

  const totalRooms = pgs.reduce((sum, p) => sum + Number(p.available_rooms || 0), 0);
  const totalSpots = totalRooms;
  const occupiedSpots = approvedBookings.length;
  const spotsLeft = Math.max(0, totalSpots - occupiedSpots);

  const priceByPg = new Map(pgs.map((p) => [p._id, p.price]));

  const pgTypeBreakdown = {
    boys: pgs.filter((p) => p.pg_type?.toLowerCase() === "boys").length,
    girls: pgs.filter((p) => p.pg_type?.toLowerCase() === "girls").length,
    coed: pgs.filter((p) => ["coed", "both"].includes(p.pg_type?.toLowerCase()))
      .length,
  };

  return {
    subscriptionTier,
    totalPGs: pgs.length,
    approvedPGs: pgs.filter((p) => p.status === "approved").length,
    pendingPGs: pgs.filter((p) => p.status === "pending").length,
    totalRooms,
    totalSpots,
    occupiedSpots,
    spotsLeft,
    totalStudents: approvedBookings.length,
    totalBookings: bookings.length,
    estimatedMonthlyRevenue,
    pgTypeBreakdown,
    bookingStats: {
      approved: approvedBookings.length,
      pending: pendingBookings.length,
      rejected: rejectedBookings.length,
    },
    topPerformingPGs: pgs
      .map((pg) => {
        const pgApproved = approvedBookings.filter((b) => b.pg_id === pg._id);
        const pgCapacity = Number(pg.available_rooms || 0);
        const pgOccupied = pgApproved.length;

        return {
          id: pg._id,
          title: pg.title,
          city: pg.city,
          totalSpots: pgCapacity,
          occupiedSpots: pgOccupied,
          spotsLeft: Math.max(0, pgCapacity - pgOccupied),
          studentsCount: pgApproved.length,
          revenue: pgApproved.reduce(
            (sum, b) => sum + Number(b.booked_price || priceByPg.get(pg._id) || 0),
            0
          ),
        };
      })
      .sort((a, b) => b.revenue - a.revenue),
  };
};
