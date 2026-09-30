// Utility for tracking seen notification badge counts across Owner Portal

export const getOwnerSeenCounts = () => {
  try {
    return JSON.parse(localStorage.getItem("dormn_owner_seen_counts") || "{}");
  } catch {
    return {};
  }
};

export const markOwnerCategorySeen = (category, currentCount) => {
  try {
    const seen = getOwnerSeenCounts();
    seen[category] = Number(currentCount) || 0;
    localStorage.setItem("dormn_owner_seen_counts", JSON.stringify(seen));
    window.dispatchEvent(new CustomEvent("dormn_seen_counts_updated"));
  } catch (e) {
    console.error("Error marking owner category seen:", e);
  }
};

export const markMultipleCategoriesSeen = (mapObj) => {
  try {
    const seen = getOwnerSeenCounts();
    Object.keys(mapObj).forEach((cat) => {
      seen[cat] = Number(mapObj[cat]) || 0;
    });
    localStorage.setItem("dormn_owner_seen_counts", JSON.stringify(seen));
    window.dispatchEvent(new CustomEvent("dormn_seen_counts_updated"));
  } catch (e) {
    console.error("Error marking multiple categories seen:", e);
  }
};

export const getUnseenCount = (category, currentCount) => {
  const seen = getOwnerSeenCounts();
  const seenCount = seen[category] ?? 0;
  return Math.max(0, (Number(currentCount) || 0) - (Number(seenCount) || 0));
};
