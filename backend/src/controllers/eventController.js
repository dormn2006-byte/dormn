import Event from '../schemas/eventSchema.js';

// Legacy rows stored JSON columns as strings; parse tolerantly so both native
// values (new) and serialized strings (old) work.
function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function formatEventRow(row) {
  if (!row) return null;
  return {
    id: row._id ?? row.id,
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
    const match = { status: { $ne: 'cancelled' } };

    if (category && category !== 'all') {
      match.category = category;
    }
    if (city) {
      match.city = city;
    }
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      match.$or = [{ title: rx }, { location: rx }, { city: rx }];
    }

    const rows = await Event.find(match).sort({ created_at: -1 }).lean();
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
    const row = await Event.findById(id).lean();

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      event: formatEventRow(row),
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

    await Event.create({
      _id: id,
      title: ev.title || 'Untitled Event',
      tagline: ev.tagline || '',
      category: ev.category || 'clubs',
      category_label: ev.categoryLabel || ev.category_label || 'Nightlife & Clubs',
      location: ev.location || '',
      city: ev.city || 'Noida',
      phone: ev.phone || '',
      single_price: typeof ev.singlePrice === 'number' ? ev.singlePrice : (typeof ev.single_price === 'number' ? ev.single_price : 0),
      couple_price: ev.couplePrice || ev.couple_price || 'FREE',
      couple_condition: ev.coupleCondition || ev.couple_condition || 'Free Entry for Couples',
      cover_image: ev.coverImage || ev.cover_image || '',
      banner_image: ev.bannerImage || ev.banner_image || '',
      gallery: ev.gallery ?? [],
      about: ev.about || '',
      upcoming_night: ev.upcomingNight ?? {},
      badge: ev.badge || 'COUPLES ENTRY FREE',
      rules: ev.rules ?? [],
      status: ev.status || 'active',
    });

    const row = await Event.findById(id).lean();
    return res.status(201).json({
      success: true,
      message: 'Event created successfully in database',
      event: formatEventRow(row),
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

    const current = await Event.findById(id).lean();
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const update = {
      title: ev.title !== undefined ? ev.title : current.title,
      tagline: ev.tagline !== undefined ? ev.tagline : current.tagline,
      category: ev.category !== undefined ? ev.category : current.category,
      category_label: ev.categoryLabel !== undefined ? ev.categoryLabel : (ev.category_label !== undefined ? ev.category_label : current.category_label),
      location: ev.location !== undefined ? ev.location : current.location,
      city: ev.city !== undefined ? ev.city : current.city,
      phone: ev.phone !== undefined ? ev.phone : current.phone,
      single_price: ev.singlePrice !== undefined ? ev.singlePrice : (ev.single_price !== undefined ? ev.single_price : current.single_price),
      couple_price: ev.couplePrice !== undefined ? ev.couplePrice : (ev.couple_price !== undefined ? ev.couple_price : current.couple_price),
      couple_condition: ev.coupleCondition !== undefined ? ev.coupleCondition : (ev.couple_condition !== undefined ? ev.couple_condition : current.couple_condition),
      cover_image: ev.coverImage !== undefined ? ev.coverImage : (ev.cover_image !== undefined ? ev.cover_image : current.cover_image),
      banner_image: ev.bannerImage !== undefined ? ev.bannerImage : (ev.banner_image !== undefined ? ev.banner_image : current.banner_image),
      gallery: ev.gallery !== undefined ? ev.gallery : current.gallery,
      about: ev.about !== undefined ? ev.about : current.about,
      upcoming_night: ev.upcomingNight !== undefined ? ev.upcomingNight : current.upcoming_night,
      badge: ev.badge !== undefined ? ev.badge : current.badge,
      rules: ev.rules !== undefined ? ev.rules : current.rules,
      status: ev.status !== undefined ? ev.status : current.status,
    };

    await Event.updateOne({ _id: id }, update);

    const row = await Event.findById(id).lean();
    return res.status(200).json({
      success: true,
      message: 'Event updated successfully in database',
      event: formatEventRow(row),
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
    const result = await Event.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
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
