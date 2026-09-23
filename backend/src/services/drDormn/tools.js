import Booking from "../../schemas/bookingSchema.js";
import MaintenanceRequest from "../../schemas/maintenanceRequestSchema.js";
import PG from "../../schemas/pgSchema.js";
import {
  getFilterOptions,
  getPGById,
  getSavedPGsByUser,
  searchPGs,
} from "../../models/pgModel.js";

const MAX_RESULTS = 5;
const MAX_AMENITIES = 6;

// Tool output is forwarded to Groq's servers, so it must never carry another
// person's contact details — only the listing facts a seeker would see.
const compactPg = (pg) => {
  const amenityList = Array.isArray(pg.amenities)
    ? pg.amenities
    : typeof pg.amenities === "object" && pg.amenities
      ? Object.keys(pg.amenities)
      : [];

  return {
    id: pg.id ?? pg._id,
    title: pg.title,
    url: `/pg/${pg.id ?? pg._id}`,
    city: pg.city,
    area: pg.area || null,
    nearby_college: pg.nearby_college || null,
    pg_type: pg.pg_type,
    rent_per_month: pg.price,
    rooms_available: pg.spots_left ?? pg.available_rooms ?? null,
    amenities: amenityList.slice(0, MAX_AMENITIES),
    image: pg.profile_image || null,
  };
};

const knowledgeBase = {
  mess: "Mess & dining: Breakfast 7:30–9:30 AM, Lunch 12:30–2:30 PM, Evening snacks 5–6 PM, Dinner 7:30–9:30 PM. Residents with late classes or shift timings can request a packed plate from the warden in advance. Exact timings and menus are set per property and are posted on the notice board in the resident dashboard.",
  maintenance:
    "Filing a maintenance/repair ticket: open My PG from the top navigation, go to the Requests tab, enter your room number, pick a category (Plumbing, Electrical, AC, WiFi, Furniture), add photos if useful, and submit. The PG manager is notified instantly and can dispatch a technician. You can track the ticket status (open → in progress → resolved) in the same tab.",
  curfew:
    "Gate timings & curfew: the main gate typically closes at 10:30 PM, with a late-entry buffer up to 11:30 PM when you sign the digital register. Overnight stays need an out-station/night-out request submitted at least 4 hours in advance. Keep your Dormn digital resident ID handy for after-hours entry. Exact timings are set by each property.",
  rent: "Rent & payments: pay monthly rent on Dormn with Razorpay (UPI, credit/debit card, net banking) from My PG → Pay Rent. That screen shows the active invoice, due date and breakdown. A GST-compliant PDF receipt is generated right after payment and stored with your records. Security deposits are collected and refunded by the property owner — check the listing's rules for the deposit amount.",
  wifi: "WiFi: Dormn-verified properties advertise the connection speed in their amenities list. Network name and password are handed over at check-in, or are visible under the property's welcome packet in your dashboard. If speeds drop, raise a ticket from My PG → Requests.",
  laundry:
    "Laundry: many properties provide self-service washing machines on a designated terrace/utility floor, and some run a paid weekly ironing + laundry pickup. Free load quotas per month, where offered, are listed in the property's amenities card.",
  events:
    "Events & clubs: the Events tab in the top navigation lists live concerts, DJ nights, student meetups and club experiences. Event tickets are booked through Dormn and appear under your tickets. Some events run student discounts and guestlist offers.",
  booking:
    "Booking a PG: open Explore PGs, filter by city/area/college/budget/type, open a listing, pick a sharing option, and send a booking request to the owner. You will be asked for tenant + guardian KYC details before payment. The owner approves or rejects the request; once approved you pay through Razorpay. Approved+paid bookings become your active residency, and the booking shows up under My Bookings.",
  account:
    "Account help: manage your profile and privacy from the student settings page. Email verification is required before booking PGs or event tickets — if you did not get the code, request it again from the verification prompt. For hostels specifically, contact the property manager from My PG → Requests; for platform issues, Dormn support is available 24/7.",
  safety:
    "Safety: Dormn collects tenant and guardian KYC before move-in, and Dormn-verified listings are reviewed by our team before they go live. Report any listing concern or unsafe incident to Dormn support and to the property manager so we can act on it.",
};

// Descriptions are deliberately terse: this schema is re-sent to Groq on every
// round of every turn, and the free tier only allows 8,000 tokens/minute.
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_pgs",
      description:
        "Search approved PG/hostel listings. Combine filters for better matches. Buildings/gyms/events are not PGs.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "e.g. Noida, Delhi, Jaipur" },
          area: { type: "string", description: "Locality, e.g. Sector 62" },
          nearby_college: { type: "string", description: "College or landmark" },
          pg_type: { type: "string", enum: ["Boys", "Girls", "Coed"] },
          min_price: { type: "number", description: "Min monthly rent in INR" },
          max_price: { type: "number", description: "Max monthly rent in INR" },
          amenity: { type: "string", description: "e.g. AC, WiFi, food, laundry" },
          keyword: { type: "string", description: "Free-text fallback" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pg_details",
      description: "Full details of one PG: pricing, sharing options, rules, amenities, map link.",
      parameters: {
        type: "object",
        properties: {
          pg_id: { type: "number", description: "Numeric id from search results" },
        },
        required: ["pg_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_filter_options",
      description:
        "List cities, areas and colleges that have listings. Call before searching when a place name is uncertain.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_help",
      description:
        "Read Dormn help text for how the platform works. Always use this for 'how do I' questions about Dormn.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: Object.keys(knowledgeBase),
            description: "Help topic to read",
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_bookings",
      description: "The signed-in user's own PG bookings with status and payment state.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_saved_pgs",
      description: "PG listings the signed-in user has saved.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_maintenance_requests",
      description: "The signed-in user's own maintenance tickets and their status.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const handlers = {
  search_pgs: async (args) => {
    const normalizeType = (value) => {
      if (!value) return undefined;
      const map = { boys: "Boys", girls: "Girls", coed: "Coed", both: "Coed" };
      return map[String(value).toLowerCase()] || String(value);
    };

    const results = await searchPGs({
      city: args.city,
      area: args.area,
      nearby_college: args.nearby_college,
      pg_type: normalizeType(args.pg_type),
      min_price: args.min_price,
      max_price: args.max_price,
      amenity: args.amenity,
      keyword: args.keyword,
    });

    const cards = results.slice(0, MAX_RESULTS).map(compactPg);

    return {
      count: cards.length,
      total_matches: results.length,
      results: cards,
      note:
        cards.length === 0
          ? "No approved listings matched these filters. Try widening the budget, area or omitting a filter."
          : undefined,
    };
  },

  get_pg_details: async (args) => {
    const pg = await getPGById(args.pg_id);
    if (!pg) return { error: `No PG found with id ${args.pg_id}.` };

    return {
      ...compactPg(pg),
      description: pg.description || null,
      address: pg.address,
      google_map_link: pg.google_map_link || null,
      sharing_options: pg.sharing_options || {},
      rules: pg.rules || [],
      all_amenities: pg.amenities || [],
      // Deliberately includes only facts a seeker sees on the listing page.
    };
  },

  get_filter_options: async () => {
    const options = await getFilterOptions();
    return {
      cities: options.cities,
      areas: options.areas,
      colleges: options.colleges,
    };
  },

  get_platform_help: async (args) => ({
    topic: args.topic,
    content: knowledgeBase[args.topic] || null,
  }),

  get_my_bookings: async (_args, { userId }) => {
    const bookings = await Booking.find({ student_id: Number(userId) })
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    if (bookings.length === 0) return { count: 0, bookings: [] };

    const pgs = await PG.find({ _id: { $in: bookings.map((b) => b.pg_id) } })
      .select("title city area")
      .lean();
    const pgMap = new Map(pgs.map((p) => [p._id, p]));

    return {
      count: bookings.length,
      bookings: bookings.map((b) => {
        const pg = pgMap.get(b.pg_id);
        return {
          booking_id: b._id,
          pg_id: b.pg_id,
          pg_title: pg?.title || null,
          pg_url: pg ? `/pg/${b.pg_id}` : null,
          city: pg?.city || null,
          area: pg?.area || null,
          status: b.status,
          payment_status: b.payment_status,
          selected_room_type: b.selected_room_type || null,
          booked_price: b.booked_price || null,
          booked_on: b.booking_date,
        };
      }),
    };
  },

  get_my_saved_pgs: async (_args, { userId }) => {
    const saved = await getSavedPGsByUser(userId);
    return {
      count: saved.length,
      results: saved.slice(0, MAX_RESULTS).map(compactPg),
    };
  },

  get_my_maintenance_requests: async (_args, { userId }) => {
    const requests = await MaintenanceRequest.find({
      student_id: Number(userId),
    })
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    return {
      count: requests.length,
      requests: requests.map((r) => ({
        request_id: r._id,
        pg_id: r.pg_id,
        title: r.title,
        category: r.category,
        location: r.location || null,
        priority: r.priority,
        status: r.status,
        raised_on: r.created_at,
      })),
    };
  },
};

/**
 * Runs one tool call. Never throws — a failure is returned to the model as
 * `{ error }` so the conversation can continue instead of dying mid-stream.
 */
export const executeTool = async (name, rawArgs, ctx) => {
  const handler = handlers[name];

  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  let args = {};
  if (typeof rawArgs === "string" && rawArgs.trim()) {
    try {
      args = JSON.parse(rawArgs);
    } catch {
      return { error: `Could not parse arguments for ${name}.` };
    }
  } else if (rawArgs && typeof rawArgs === "object") {
    args = rawArgs;
  }

  try {
    return await handler(args, ctx);
  } catch (err) {
    console.error(`[DrDormn] Tool "${name}" failed:`, err.message);
    return { error: `The ${name} tool failed to run.` };
  }
};

// Which tools produced PG listings, so the controller can forward card data
// to the UI alongside the streamed text.
export const PG_CARD_TOOLS = new Set([
  "search_pgs",
  "get_my_saved_pgs",
  "get_pg_details",
]);
