import {
  LayoutDashboard,
  PlusSquare,
  Building2,
  Users,
  Wrench,
  BookOpenCheck,
  CalendarRange,
  CalendarDays,
  UserMinus,
  MessageSquare,
  Tag,
  Megaphone,
  CreditCard,
  ClipboardList,
  User,
  BadgeCheck,
  Lock,
  Zap,
  Settings as SettingsIcon,
  Bookmark,
  CalendarHeart,
  Dumbbell,
  Ticket,
} from "lucide-react";

/**
 * Single Source of Truth for Owner Navigation & Search
 */
export const OWNER_NAV_CONFIG = [
  {
    type: "group",
    id: "profile",
    title: "Profile",
    icon: User,
    accent: "text-blue-500",
    group: "Account",
    children: [
      {
        title: "Profile",
        path: "/owner/profile",
        icon: User,
        color: "text-blue-500 bg-blue-500/10",
        desc: "Personal & property contact details, KYC and settings",
      },
      {
        title: "PGs",
        id: "profile-pgs",
        icon: Building2,
        color: "text-emerald-500 bg-emerald-500/10",
        desc: "Your personal booked PGs, visits, short stays & saved favorites",
        children: [
          {
            title: "Booked PG",
            path: "/owner/booked-pgs",
            icon: BookOpenCheck,
            color: "text-emerald-500 bg-emerald-500/10",
            desc: "Booked PGs, scheduled PG visits, and short stay reservations",
          },
          {
            title: "Saved PG",
            path: "/owner/saved-pgs",
            icon: Bookmark,
            color: "text-rose-500 bg-rose-500/10",
            desc: "Properties and hostels you have saved or liked",
          },
        ],
      },
      {
        title: "Events",
        id: "profile-events",
        icon: CalendarHeart,
        color: "text-pink-500 bg-pink-500/10",
        desc: "Event passes, concerts and bookings",
        children: [
          {
            title: "Booked Tickets",
            path: "/events?view=tickets",
            icon: Ticket,
            color: "text-pink-500 bg-pink-500/10",
            desc: "All your booked tickets, VIP passes and entry badges",
          },
        ],
      },
      {
        title: "Gym",
        path: "/gym",
        icon: Dumbbell,
        color: "text-amber-500 bg-amber-500/10",
        desc: "Gym memberships, fitness passes & workout centers",
      },
    ],
  },
  {
    type: "link",
    id: "dashboard",
    title: "Dashboard",
    path: "/owner/dashboard",
    icon: LayoutDashboard,
    group: "Overview",
    color: "text-blue-500 bg-blue-500/10",
    desc: "Key metrics, active properties & occupancy summary",
  },
  {
    type: "group",
    id: "pgDetails",
    title: "PG Details",
    icon: Building2,
    accent: "text-emerald-500",
    group: "PG Details",
    children: [
      {
        title: "Add PG",
        path: "/owner/add-pg",
        icon: PlusSquare,
        color: "text-emerald-500 bg-emerald-500/10",
        desc: "List a new property with rooms & amenities",
      },
      {
        title: "My PG",
        path: "/owner/my-pgs",
        icon: Building2,
        color: "text-emerald-500 bg-emerald-500/10",
        desc: "Manage properties, room sharing & live status",
      },
      {
        title: "PG Staff",
        path: "/owner/staff",
        icon: Users,
        color: "text-teal-500 bg-teal-500/10",
        desc: "Property managers, wardens & support staff",
      },
      {
        title: "All Tenants",
        path: "/owner/students",
        icon: Users,
        color: "text-cyan-500 bg-cyan-500/10",
        desc: "Enrolled residents, assigned rooms & phone contacts",
      },
      {
        title: "All Requests",
        path: "/owner/requests",
        icon: Wrench,
        color: "text-amber-500 bg-amber-500/10",
        desc: "Resident maintenance requests & ticket resolution",
      },
    ],
  },
  {
    type: "group",
    id: "listings",
    title: "Listings",
    icon: BookOpenCheck,
    accent: "text-blue-500",
    group: "Listings",
    children: [
      {
        title: "All Bookings",
        path: "/owner/bookings",
        icon: BookOpenCheck,
        color: "text-indigo-500 bg-indigo-500/10",
        desc: "Admissions, pending applications & tenant approvals",
      },
      {
        title: "Short Stay",
        path: "/owner/short-stays",
        icon: CalendarRange,
        color: "text-violet-500 bg-violet-500/10",
        desc: "Daily, weekly & temporary visitor bookings",
      },
      {
        title: "PG Visits",
        path: "/owner/visits",
        icon: CalendarDays,
        color: "text-purple-500 bg-purple-500/10",
        desc: "Scheduled walk-ins & prospective tenant visits",
      },
      {
        title: "Cancellations",
        path: "/owner/cancellations",
        icon: UserMinus,
        color: "text-rose-500 bg-rose-500/10",
        desc: "Move-out requests & security deposit refunds",
      },
    ],
  },
  {
    type: "link",
    id: "chat",
    title: "Community Chat",
    path: "/owner/chat",
    icon: MessageSquare,
    group: "Communication",
    color: "text-sky-500 bg-sky-500/10",
    desc: "Direct messages with residents & building announcements",
  },
  {
    type: "link",
    id: "promoCodes",
    title: "Promo Codes",
    path: "/owner/promo-codes",
    icon: Tag,
    group: "Marketing",
    color: "text-pink-500 bg-pink-500/10",
    desc: "Flat or percentage discounts for new admissions",
  },
  {
    type: "group",
    id: "finance",
    title: "Finance & Records",
    icon: CreditCard,
    accent: "text-emerald-500",
    group: "Finance & Records",
    children: [
      {
        title: "All Payments",
        path: "/owner/payments",
        icon: CreditCard,
        color: "text-emerald-500 bg-emerald-500/10",
        desc: "Collected rent ledger, commissions & bank transfers",
      },
      {
        title: "All KYC Forms",
        path: "/owner/kyc-forms",
        icon: ClipboardList,
        color: "text-blue-500 bg-blue-500/10",
        desc: "Verified identity records & downloadable KYC PDFs",
      },
    ],
  },
  {
    type: "link",
    id: "sponsor",
    title: "Sponsor PG",
    path: "/owner/sponsor",
    icon: Megaphone,
    group: "Marketing",
    color: "text-orange-500 bg-orange-500/10",
    desc: "Feature your listing at the top of search & home spotlight",
  },
  {
    type: "divider",
    id: "bottom-divider",
  },
  {
    type: "link",
    id: "pricing",
    title: "Pricing & Plans",
    path: "/owner/pricing",
    icon: CreditCard,
    group: "Billing",
    color: "text-amber-500 bg-amber-500/10",
    desc: "Will be allotted soon",
  },
  {
    type: "settings",
    id: "settings",
    title: "Settings",
    icon: SettingsIcon,
    accent: "text-purple-500",
    group: "Settings",
    children: [
      {
        title: "Profile & Business",
        tab: "profile",
        icon: User,
        color: "text-purple-500 bg-purple-500/10",
        desc: "Owner legal name, property address & contact info",
      },
      {
        title: "Bank & Payouts",
        tab: "payouts",
        icon: CreditCard,
        color: "text-purple-500 bg-purple-500/10",
        desc: "Bank account numbers, IFSC & payout destinations",
      },
      {
        title: "Legal KYC",
        tab: "kyc",
        icon: BadgeCheck,
        color: "text-purple-500 bg-purple-500/10",
        desc: "PAN card, Aadhaar & business verification status",
      },
      {
        title: "Security & Password",
        tab: "security",
        icon: Lock,
        color: "text-purple-500 bg-purple-500/10",
        desc: "Change login password & manage active sessions",
      },
      {
        title: "Plan & Tier",
        tab: "tier",
        icon: Zap,
        color: "text-purple-500 bg-purple-500/10",
        desc: "Current subscription membership & upgrade options",
      },
    ],
  },
];

/**
 * Flattened searchable page list with metadata
 */
export const ALL_PAGE_ITEMS = OWNER_NAV_CONFIG.flatMap((item) => {
  if (item.type === "divider") return [];
  if (item.type === "link") return [item];
  if (item.type === "group") {
    return item.children.flatMap((c) => {
      if (c.children && Array.isArray(c.children)) {
        return c.children.map((sub) => ({ ...sub, group: `${item.title} > ${c.title}` }));
      }
      return [{ ...c, group: item.title }];
    });
  }
  if (item.type === "settings") {
    return item.children.map((c) => ({
      ...c,
      path: `/owner/profile?tab=${c.tab}`,
      tabId: c.tab,
      group: "Settings",
    }));
  }
  return [];
});

/**
 * Grouped categories for the search modal directory view
 */
export const SEARCH_CATEGORIES = OWNER_NAV_CONFIG.filter((s) => s.type !== "divider").map((s) => ({
  group: s.title || s.group,
  items:
    s.type === "link"
      ? [s]
      : s.children.flatMap((c) => {
          if (c.children && Array.isArray(c.children)) {
            return c.children.map((sub) => ({ ...sub, group: `${s.title} > ${c.title}` }));
          }
          return s.type === "settings"
            ? [{ ...c, path: `/owner/profile?tab=${c.tab}`, group: "Settings" }]
            : [{ ...c, group: s.title }];
        }),
}));
