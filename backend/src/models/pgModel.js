import db from "../config/db.js";

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

  const query = `
    INSERT INTO pgs (
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
      status,
      sharing_options
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(query, [
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
    'pending',
    sharing_options, // NEW: Insert into database
  ]);

  return result;
};

// Get All PGs
export const getAllPGs = async () => {
  const query = `
    SELECT
      pgs.*,
      users.full_name AS owner_name,
      users.email AS owner_email,
      COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0) AS occupied_spots,
      GREATEST(0, CAST(COALESCE(pgs.available_rooms, 0) AS SIGNED) - COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0)) AS spots_left
    FROM pgs
    LEFT JOIN users ON pgs.owner_id = users.id
    WHERE pgs.status = 'approved'
      AND (
        users.role != 'owner'
        OR users.subscription_status IS NULL
        OR users.subscription_status IN ('trial', 'active')
        OR users.subscription_expires_at > NOW()
      )
    ORDER BY (spots_left > 0) DESC, pgs.created_at DESC
  `;

  const [rows] = await db.execute(query);

  return rows;
};

// Get Single PG By ID
export const getPGById = async (id) => {
  // Fetch PG details
  const pgQuery = `
    SELECT
      pgs.*,
      users.full_name AS owner_name,
      users.email AS owner_email,
      users.phone AS owner_phone,
      COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0) AS occupied_spots,
      GREATEST(0, CAST(COALESCE(pgs.available_rooms, 0) AS SIGNED) - COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0)) AS spots_left
    FROM pgs
    JOIN users ON pgs.owner_id = users.id
    WHERE pgs.id = ?
  `;

  const [pgRows] = await db.execute(pgQuery, [id]);

  if (pgRows.length === 0) {
    return null;
  }

  const pg = pgRows[0];

  // Fetch gallery images
  const imageQuery = `
    SELECT
      id,
      image_url,
      display_order,
      is_cover
    FROM pg_images
    WHERE pg_id = ?
    ORDER BY display_order ASC
  `;

  const [images] = await db.execute(imageQuery, [id]);

  // Attach gallery to PG object
  pg.gallery = images;

  return pg;
};

// Get PGs By Owner
export const getPGsByOwner = async (ownerId) => {
  const query = `
    SELECT 
      pgs.*,
      COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0) AS occupied_spots,
      GREATEST(0, CAST(COALESCE(pgs.available_rooms, 0) AS SIGNED) - COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0)) AS spots_left
    FROM pgs
    WHERE owner_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(query, [ownerId]);

  return rows;
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
    sharing_options, // NEW: Extract sharing options
  } = pgData;

  const query = `
    UPDATE pgs
    SET
      title = ?,
      description = ?,
      pg_type = ?,
      price = ?,
      address = ?,
      city = ?,
      area = ?,
      nearby_college = ?,
      available_rooms = ?,
      amenities = ?,
      rules = ?,
      google_map_link = ?,
      profile_image = ?,
      sharing_options = ?
    WHERE id = ?
  `;

  const [result] = await db.execute(query, [
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
    sharing_options, // NEW: Update in database
    id,
  ]);

  return result;
};

// Delete PG
export const deletePG = async (id) => {
  const query = `DELETE FROM pgs WHERE id = ?`;

  const [result] = await db.execute(query, [id]);

  return result;
};

// Save Multiple PG Images
export const savePGImages = async (pgId, images) => {
  if (!images || images.length === 0) {
    return;
  }

  const query = `
    INSERT INTO pg_images (
      pg_id,
      image_url,
      display_order,
      is_cover
    )
    VALUES (?, ?, ?, ?)
  `;

  for (let i = 0; i < images.length; i++) {
    await db.execute(query, [
      pgId,
      images[i],
      i + 1,
      i === 0 ? 1 : 0,
    ]);
  }
};
// ==========================================
// SAVED PGS (FAVORITES) MODELS
// ==========================================

// Toggle Save/Unsave a PG
export const toggleSavePG = async (userId, pgId) => {
  // First, check if the user has already saved this PG
  const checkQuery = `SELECT * FROM saved_pgs WHERE user_id = ? AND pg_id = ?`;
  const [existing] = await db.execute(checkQuery, [userId, pgId]);

  if (existing.length > 0) {
    // If it exists, UN-SAVE it (Delete)
    const deleteQuery = `DELETE FROM saved_pgs WHERE user_id = ? AND pg_id = ?`;
    await db.execute(deleteQuery, [userId, pgId]);
    return { isSaved: false, message: "PG removed from saved list" };
  } else {
    // If it doesn't exist, SAVE it (Insert)
    const insertQuery = `INSERT INTO saved_pgs (user_id, pg_id) VALUES (?, ?)`;
    await db.execute(insertQuery, [userId, pgId]);
    return { isSaved: true, message: "PG saved successfully" };
  }
};

// Get all PGs saved by a specific user
export const getSavedPGsByUser = async (userId) => {
  const query = `
    SELECT 
      pgs.*,
      users.full_name AS owner_name,
      users.email AS owner_email,
      COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0) AS occupied_spots,
      GREATEST(0, CAST(COALESCE(pgs.available_rooms, 0) AS SIGNED) - COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0)) AS spots_left
    FROM pgs
    JOIN saved_pgs ON pgs.id = saved_pgs.pg_id
    LEFT JOIN users ON pgs.owner_id = users.id
    WHERE saved_pgs.user_id = ? AND pgs.status = 'approved'
      AND (
        users.role != 'owner'
        OR users.subscription_status IS NULL
        OR users.subscription_status IN ('trial', 'active')
        OR users.subscription_expires_at > NOW()
      )
    ORDER BY (spots_left > 0) DESC, saved_pgs.created_at DESC
  `;

  const [rows] = await db.execute(query, [userId]);
  return rows;
};

// ==========================================
// NEW ADVANCED SEARCH & FILTER MODELS
// ==========================================

// Get distinct locations and landmarks for frontend dropdowns
export const getFilterOptions = async () => {
  // We only fetch distinct options from 'approved' PGs to ensure we don't show empty search results
  const cityQuery = `SELECT DISTINCT city FROM pgs WHERE status = 'approved' AND city IS NOT NULL AND city != ''`;
  const areaQuery = `SELECT DISTINCT area FROM pgs WHERE status = 'approved' AND area IS NOT NULL AND area != ''`;
  const collegeQuery = `SELECT DISTINCT nearby_college FROM pgs WHERE status = 'approved' AND nearby_college IS NOT NULL AND nearby_college != ''`;

  const [cities] = await db.execute(cityQuery);
  const [areas] = await db.execute(areaQuery);
  const [colleges] = await db.execute(collegeQuery);

  return {
    cities: cities.map(row => row.city),
    areas: areas.map(row => row.area),
    colleges: colleges.map(row => row.nearby_college),
  };
};

// Advanced dynamic search query
export const searchPGs = async (filters) => {
  const { pg_type, city, area, nearby_college, min_price, max_price, amenity, keyword } = filters;

  let query = `
    SELECT
      pgs.*,
      users.full_name AS owner_name,
      users.email AS owner_email,
      COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0) AS occupied_spots,
      GREATEST(0, CAST(COALESCE(pgs.available_rooms, 0) AS SIGNED) - COALESCE((
        SELECT COUNT(*) FROM bookings b 
        WHERE b.pg_id = pgs.id AND (b.status = 'approved' OR b.payment_status = 'paid')
      ), 0)) AS spots_left
    FROM pgs
    LEFT JOIN users ON pgs.owner_id = users.id
    WHERE pgs.status = 'approved'
      AND (
        users.role != 'owner'
        OR users.subscription_status IS NULL
        OR users.subscription_status IN ('trial', 'active')
        OR users.subscription_expires_at > NOW()
      )
  `;
  
  const params = [];

  // Dynamically append WHERE clauses only if the user provided the filter
  if (pg_type) {
    query += ` AND pgs.pg_type = ?`;
    params.push(pg_type);
  }
  
  if (city) {
    query += ` AND pgs.city = ?`;
    params.push(city);
  }
  
  if (area) {
    query += ` AND pgs.area = ?`;
    params.push(area);
  }
  
  if (nearby_college) {
    query += ` AND pgs.nearby_college = ?`;
    params.push(nearby_college);
  }

  if (amenity) {
    query += ` AND pgs.amenities LIKE ?`;
    params.push(`%${amenity}%`);
  }

  if (keyword) {
    query += ` AND (pgs.title LIKE ? OR pgs.city LIKE ? OR pgs.area LIKE ? OR pgs.address LIKE ? OR pgs.amenities LIKE ?)`;
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw, kw);
  }
  
  if (min_price) {
    query += ` AND pgs.price >= ?`;
    params.push(Number(min_price));
  }
  
  if (max_price) {
    query += ` AND pgs.price <= ?`;
    params.push(Number(max_price));
  }

  // Finalize query with sorting: Available PGs first (spots_left > 0), full/filled PGs at the bottom
  query += ` ORDER BY (spots_left > 0) DESC, pgs.created_at DESC`;

  const [rows] = await db.execute(query, params);
  
  return rows;
};
// ==========================================
// OWNER ANALYTICS MODEL (FIXED)
// ==========================================
export const getOwnerAnalyticsData = async (ownerId) => {
  // Fetch owner subscription tier directly from database
  const [userRows] = await db.execute(`SELECT subscription_tier FROM users WHERE id = ?`, [ownerId]);
  const subscriptionTier = userRows[0]?.subscription_tier || "Pro Tier";

  // 1. Fetch all PGs owned by this user
  const pgsQuery = `SELECT * FROM pgs WHERE owner_id = ?`;
  const [pgs] = await db.execute(pgsQuery, [ownerId]);

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
      topPerformingPGs: []
    };
  }

  const pgIds = pgs.map(p => p.id);

  // 2. Fetch all bookings for these PGs
  const placeholders = pgIds.map(() => '?').join(',');
  const bookingsQuery = `
    SELECT b.*, p.title AS pg_title, p.city 
    FROM bookings b
    JOIN pgs p ON b.pg_id = p.id
    WHERE b.pg_id IN (${placeholders})
    ORDER BY b.id DESC
  `;
  const [bookings] = await db.execute(bookingsQuery, pgIds);

  // 3. Process calculations
  const approvedBookings = bookings.filter(b => b.status === 'approved' || b.payment_status === 'paid');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');

  const estimatedMonthlyRevenue = approvedBookings.reduce((sum, b) => sum + Number(b.booked_price || b.price || 0), 0);
  
  const totalRooms = pgs.reduce((sum, p) => sum + Number(p.available_rooms || 0), 0);
  const totalSpots = totalRooms;
  const occupiedSpots = approvedBookings.length;
  const spotsLeft = Math.max(0, totalSpots - occupiedSpots);

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
    topPerformingPGs: pgs.map(pg => {
      const pgApproved = approvedBookings.filter(b => b.pg_id === pg.id);
      const pgCapacity = Number(pg.available_rooms || 0);
      const pgOccupied = pgApproved.length;
      return {
        id: pg.id,
        title: pg.title,
        city: pg.city,
        totalSpots: pgCapacity,
        occupiedSpots: pgOccupied,
        spotsLeft: Math.max(0, pgCapacity - pgOccupied),
        studentsCount: pgApproved.length,
        revenue: pgApproved.reduce((sum, b) => sum + Number(b.booked_price || pg.price || 0), 0)
      };
    }).sort((a, b) => b.revenue - a.revenue)
  };
};