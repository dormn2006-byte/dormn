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

/**
 * Checks whether a PG's amenities string/list matches the query term or amenity tag
 * @param {Object} pg - The PG listing object
 * @param {string} targetAmenity - The amenity keyword or filter value
 * @returns {boolean}
 */
export const hasAmenityMatch = (pg, targetAmenity) => {
  if (!targetAmenity || !pg) return true;
  const raw = String(pg.amenities || "").toLowerCase();
  const search = targetAmenity.toLowerCase().trim();
  if (!search) return true;

  // Direct substring check
  if (raw.includes(search)) return true;

  // Keyword / Alias dictionary matching
  if (search === "ac" || search.includes("air condition")) {
    return /\b(ac|air conditioner|air conditioning|cooling)\b/i.test(raw);
  }
  if (search === "wifi" || search === "wi-fi" || search.includes("internet")) {
    return /\b(wifi|wi-fi|internet|high-speed)\b/i.test(raw);
  }
  if (search === "food" || search === "meals" || search === "mess" || search.includes("dinner") || search.includes("lunch")) {
    return /\b(food|meal|dinner|lunch|breakfast|kitchen|cook|mess)\b/i.test(raw);
  }
  if (search === "parking" || search.includes("vehicle") || search.includes("bike") || search.includes("car")) {
    return /\b(parking|car|bike|vehicle)\b/i.test(raw);
  }
  if (search === "power" || search.includes("backup") || search.includes("electricity") || search.includes("generator")) {
    return /\b(power|backup|generator|electricity)\b/i.test(raw);
  }
  if (search === "geyser" || search.includes("hot water") || search.includes("heater")) {
    return /\b(geyser|hot water|heater)\b/i.test(raw);
  }
  if (search === "laundry" || search.includes("wash") || search.includes("iron")) {
    return /\b(laundry|wash|iron)\b/i.test(raw);
  }
  if (search === "security" || search === "cctv" || search.includes("guard")) {
    return /\b(security|cctv|guard|safety)\b/i.test(raw);
  }
  if (search === "bath" || search.includes("bathroom") || search.includes("washroom") || search.includes("toilet")) {
    return /\b(bath|washroom|toilet|attached)\b/i.test(raw);
  }
  if (search === "gym" || search.includes("fitness") || search.includes("workout")) {
    return /\b(gym|fitness|workout)\b/i.test(raw);
  }
  if (search === "tv" || search.includes("television")) {
    return /\b(tv|television)\b/i.test(raw);
  }
  if (search === "ro" || search.includes("water") || search.includes("drinking")) {
    return /\b(ro|purified|drinking|water)\b/i.test(raw);
  }
  if (search === "housekeeping" || search.includes("cleaning") || search.includes("maid")) {
    return /\b(housekeeping|cleaning|clean|maid)\b/i.test(raw);
  }
  if (search === "fridge" || search.includes("refrigerator")) {
    return /\b(fridge|refrigerator)\b/i.test(raw);
  }

  return false;
};
