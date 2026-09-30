/**
 * Standard amenities options and alias matching helper
 */

export const AMENITY_OPTIONS = [
  { value: "wifi", label: "High-Speed WiFi" },
  { value: "ac", label: "AC Rooms" },
  { value: "food", label: "Food / Mess Included" },
  { value: "power", label: "100% Power Backup" },
  { value: "bath", label: "Attached Bathroom" },
  { value: "laundry", label: "Laundry & Washing" },
  { value: "parking", label: "Dedicated Parking" },
  { value: "security", label: "24/7 CCTV & Security" },
  { value: "geyser", label: "Geyser / Hot Water" },
  { value: "ro", label: "RO Purified Water" },
  { value: "housekeeping", label: "Daily Housekeeping" },
  { value: "fridge", label: "Refrigerator" },
  { value: "gym", label: "Gym / Fitness" },
  { value: "tv", label: "Television" },
];

const AMENITY_PATTERNS = {
  ac: /\b(ac|air conditioner|air conditioning|cooling)\b/i,
  wifi: /\b(wifi|wi-fi|internet|high-speed)\b/i,
  food: /\b(food|meal|dinner|lunch|breakfast|kitchen|cook|mess)\b/i,
  parking: /\b(parking|car|bike|vehicle)\b/i,
  power: /\b(power|backup|generator|electricity)\b/i,
  geyser: /\b(geyser|hot water|heater)\b/i,
  laundry: /\b(laundry|wash|iron)\b/i,
  security: /\b(security|cctv|guard|safety)\b/i,
  bath: /\b(bath|washroom|toilet|attached)\b/i,
  gym: /\b(gym|fitness|workout)\b/i,
  tv: /\b(tv|television)\b/i,
  ro: /\b(ro|purified|drinking|water)\b/i,
  housekeeping: /\b(housekeeping|cleaning|clean|maid)\b/i,
  fridge: /\b(fridge|refrigerator)\b/i,
};

/**
 * Checks whether a PG's amenities string/list matches the query term or amenity tag
 */
export const hasAmenityMatch = (pg, targetAmenity) => {
  if (!targetAmenity || !pg) return true;
  const raw = String(pg.amenities || "").toLowerCase();
  const search = targetAmenity.toLowerCase().trim();
  if (!search) return true;
  if (raw.includes(search)) return true;

  for (const [key, regex] of Object.entries(AMENITY_PATTERNS)) {
    if (search.includes(key) && regex.test(raw)) return true;
  }
  if (["veg", "pure veg", "vegetarian"].includes(search)) return matchesFoodPreference(pg, "veg");
  if (["non-veg", "non veg", "nonveg"].includes(search)) return matchesFoodPreference(pg, "non-veg");

  return false;
};

/**
 * Resolves the food preference and metadata of a PG (Strictly Veg or Non-Veg)
 */
export const getPgFoodPreference = (pg) => {
  if (!pg) return { type: "Veg", label: "Veg", tag: "Veg 🟢", isVeg: true, isNonVeg: false };

  const raw = String(pg.food_type || "").trim().toLowerCase();
  if (["veg", "pure veg", "vegetarian", "pure-veg"].includes(raw)) {
    return { type: "Veg", label: "Veg", tag: "Veg 🟢", isVeg: true, isNonVeg: false };
  }
  if (["non-veg", "nonveg", "non veg", "non_veg"].includes(raw)) {
    return { type: "Non-Veg", label: "Non-Veg", tag: "Non-Veg 🟤", isVeg: false, isNonVeg: true };
  }

  // Fallback: check text in description, rules, amenities, and title
  const text = `${pg.title || ""} ${pg.description || ""} ${pg.rules || ""} ${pg.amenities || ""}`.toLowerCase();
  if (/\b(pure veg|strictly veg|veg only|pure vegetarian|strictly vegetarian)\b/i.test(text)) {
    return { type: "Veg", label: "Veg", tag: "Veg 🟢", isVeg: true, isNonVeg: false };
  }
  if (/\b(non-veg|non veg|nonveg|chicken|meat|egg)\b/i.test(text)) {
    return { type: "Non-Veg", label: "Non-Veg", tag: "Non-Veg 🟤", isVeg: false, isNonVeg: true };
  }

  return { type: "Veg", label: "Veg", tag: "Veg 🟢", isVeg: true, isNonVeg: false };
};

/**
 * Checks whether a PG matches a food diet filter ('veg' or 'non-veg')
 */
export const matchesFoodPreference = (pg, preference) => {
  if (!preference || !pg) return true;
  const pref = preference.toLowerCase().trim();
  const food = getPgFoodPreference(pg);
  if (["veg", "pure veg", "pure-veg"].includes(pref)) return food.isVeg;
  if (["non-veg", "non veg", "nonveg"].includes(pref)) return food.isNonVeg;
  return true;
};

