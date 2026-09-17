import pool from '../config/db.js';

function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function formatEventRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    category: row.category,
    categoryLabel: row.category_label,
    location: row.location,
    city: row.city,
    phone: row.phone,
    singlePrice: row.single_price,
    couplePrice: row.couple_price,
    coupleCondition: row.couple_condition,
    coverImage: row.cover_image,
    bannerImage: row.banner_image,
    gallery: parseJsonField(row.gallery, []),
    about: row.about,
    upcomingNight: parseJsonField(row.upcoming_night, {}),
    badge: row.badge,
    rules: parseJsonField(row.rules, []),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/events - Public
export const getEvents = async (req, res) => {
  try {
    const { category, city, search } = req.query;
    let query = 'SELECT * FROM events WHERE status != "cancelled"';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }
    if (search) {
      query += ' AND (title LIKE ? OR location LIKE ? OR city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    const events = rows.map(formatEventRow);

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    console.error('getEvents error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events from database',
      error: err.message,
    });
  }
};

// GET /api/events/:id - Public
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      event: formatEventRow(rows[0]),
    });
  } catch (err) {
    console.error('getEventById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: err.message,
    });
  }
};

// POST /api/events - Admin / Event Manager
export const createEvent = async (req, res) => {
  try {
    const ev = req.body;
    const id = ev.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const sql = `
      INSERT INTO events (
        id, title, tagline, category, category_label, location, city, phone,
        single_price, couple_price, couple_condition, cover_image, banner_image,
        gallery, about, upcoming_night, badge, rules, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [
      id,
      ev.title || 'Untitled Event',
      ev.tagline || '',
      ev.category || 'clubs',
      ev.categoryLabel || ev.category_label || 'Nightlife & Clubs',
      ev.location || '',
      ev.city || 'Noida',
      ev.phone || '',
      typeof ev.singlePrice === 'number' ? ev.singlePrice : (typeof ev.single_price === 'number' ? ev.single_price : 0),
      ev.couplePrice || ev.couple_price || 'FREE',
      ev.coupleCondition || ev.couple_condition || 'Free Entry for Couples',
      ev.coverImage || ev.cover_image || '',
      ev.bannerImage || ev.banner_image || '',
      typeof ev.gallery === 'string' ? ev.gallery : JSON.stringify(ev.gallery || []),
      ev.about || '',
      typeof ev.upcomingNight === 'string' ? ev.upcomingNight : JSON.stringify(ev.upcomingNight || {}),
      ev.badge || 'COUPLES ENTRY FREE',
      typeof ev.rules === 'string' ? ev.rules : JSON.stringify(ev.rules || []),
      ev.status || 'active',
    ]);

    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    return res.status(201).json({
      success: true,
      message: 'Event created successfully in database',
      event: formatEventRow(rows[0]),
    });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event in database',
      error: err.message,
    });
  }
};

// PUT /api/events/:id - Admin / Event Manager
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = req.body;

    const [existing] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const current = existing[0];
    const sql = `
      UPDATE events SET
        title = ?,
        tagline = ?,
        category = ?,
        category_label = ?,
        location = ?,
        city = ?,
        phone = ?,
        single_price = ?,
        couple_price = ?,
        couple_condition = ?,
        cover_image = ?,
        banner_image = ?,
        gallery = ?,
        about = ?,
        upcoming_night = ?,
        badge = ?,
        rules = ?,
        status = ?
      WHERE id = ?
    `;

    await pool.execute(sql, [
      ev.title !== undefined ? ev.title : current.title,
      ev.tagline !== undefined ? ev.tagline : current.tagline,
      ev.category !== undefined ? ev.category : current.category,
      ev.categoryLabel !== undefined ? ev.categoryLabel : (ev.category_label !== undefined ? ev.category_label : current.category_label),
      ev.location !== undefined ? ev.location : current.location,
      ev.city !== undefined ? ev.city : current.city,
      ev.phone !== undefined ? ev.phone : current.phone,
      ev.singlePrice !== undefined ? ev.singlePrice : (ev.single_price !== undefined ? ev.single_price : current.single_price),
      ev.couplePrice !== undefined ? ev.couplePrice : (ev.couple_price !== undefined ? ev.couple_price : current.couple_price),
      ev.coupleCondition !== undefined ? ev.coupleCondition : (ev.couple_condition !== undefined ? ev.couple_condition : current.couple_condition),
      ev.coverImage !== undefined ? ev.coverImage : (ev.cover_image !== undefined ? ev.cover_image : current.cover_image),
      ev.bannerImage !== undefined ? ev.bannerImage : (ev.banner_image !== undefined ? ev.banner_image : current.banner_image),
      ev.gallery !== undefined ? (typeof ev.gallery === 'string' ? ev.gallery : JSON.stringify(ev.gallery)) : current.gallery,
      ev.about !== undefined ? ev.about : current.about,
      ev.upcomingNight !== undefined ? (typeof ev.upcomingNight === 'string' ? ev.upcomingNight : JSON.stringify(ev.upcomingNight)) : current.upcoming_night,
      ev.badge !== undefined ? ev.badge : current.badge,
      ev.rules !== undefined ? (typeof ev.rules === 'string' ? ev.rules : JSON.stringify(ev.rules)) : current.rules,
      ev.status !== undefined ? ev.status : current.status,
      id,
    ]);

    const [updated] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Event updated successfully in database',
      event: formatEventRow(updated[0]),
    });
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: err.message,
    });
  }
};

// DELETE /api/events/:id - Admin / Event Manager
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted from database',
    });
  } catch (err) {
    console.error('deleteEvent error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: err.message,
    });
  }
};
