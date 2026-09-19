import { connectDB, disconnectDB } from '../config/db.js';
import Event from '../schemas/eventSchema.js';

export const INITIAL_EVENTS = [
  // ─── 7 CLUBS & NIGHTLIFE ───
  {
    id: "disco-club",
    title: "Disco Club",
    tagline: "Enjoy",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Sitapura, Jaipur",
    city: "Jaipur",
    phone: "7415417522",
    single_price: 1,
    couple_price: "FREE",
    couple_condition: "Boy + Girl only",
    cover_image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Retro neon ambience, immersive bass audio acoustics, signature mixology drinks, and top resident DJ sets playing till late.",
    upcoming_night: JSON.stringify({
      title: "The Tuesday Night",
      dateFormatted: "Wednesday 9 September, 2026",
      shortDate: "wed, 9 sept",
      time: "9pm - 3am",
      shortTime: "9pm",
      spotsLeft: 37,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: JSON.stringify(["Age 18+ valid physical ID mandatory", "Dress code: Smart Casual / Party Wear", "Stag entry subject to club discretion"]),
    status: "active"
  },
  {
    id: "molecule-air-bar",
    title: "Molecule Air Bar",
    tagline: "Skyline Rooftop & Molecular Cocktails",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Sector 62, Noida",
    city: "Noida",
    phone: "9811234567",
    single_price: 499,
    couple_price: "FREE",
    couple_condition: "Couple Free on Guestlist",
    cover_image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1570872626485-d8ffea69f463?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Panoramic rooftop terrace overlooking Noida's skyline with nitrogen cocktails, international tapas, and pulsating commercial EDM beats.",
    upcoming_night: JSON.stringify({
      title: "Friday Bollywood Skyblast",
      dateFormatted: "Friday 11 September, 2026",
      shortDate: "fri, 11 sept",
      time: "9pm - 2am",
      shortTime: "9pm",
      spotsLeft: 52,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: JSON.stringify(["Age 21+ only", "Stag entry allowed with cover charge", "Table bookings recommended"]),
    status: "active"
  },
  {
    id: "lord-of-the-drinks",
    title: "Lord of the Drinks",
    tagline: "Grand Medieval Dance Arena",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Gardens Galleria, Sector 38A Noida",
    city: "Noida",
    phone: "9999123456",
    single_price: 699,
    couple_price: "FREE",
    couple_condition: "Free till 10:30 PM",
    cover_image: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "One of North India's largest microbreweries with majestic castle interiors, energetic lasers, and NCR's biggest Saturday dance floor.",
    upcoming_night: JSON.stringify({
      title: "Saturday Royal House Fest",
      dateFormatted: "Saturday 12 September, 2026",
      shortDate: "sat, 12 sept",
      time: "9pm - 3am",
      shortTime: "9pm",
      spotsLeft: 29,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: JSON.stringify(["Proper club attire required", "No flip flops or shorts allowed for men", "ID check at entry"]),
    status: "active"
  },
  {
    id: "imperfecto-ruin-pub",
    title: "Imperfecto Ruin Pub",
    tagline: "Eclectic Underground Vibes",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Logix City Centre, Sector 32 Noida",
    city: "Noida",
    phone: "9711889900",
    single_price: 399,
    couple_price: "FREE",
    couple_condition: "Campus ID / Couples",
    cover_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Bohemian ruin pub with quirky handmade art installations, live acoustic jams from 8 PM followed by midnight high-octane club music.",
    upcoming_night: JSON.stringify({
      title: "Thursday Student Campus Night",
      dateFormatted: "Thursday 17 September, 2026",
      shortDate: "thu, 17 sept",
      time: "8:30pm - 1:30am",
      shortTime: "8:30pm",
      spotsLeft: 65,
    }),
    badge: "STUDENT PASS DISCOUNTS",
    rules: JSON.stringify(["College ID mandatory for student deals", "18+ for entry, 21+ for alcohol", "Rights of admission reserved"]),
    status: "active"
  },
  {
    id: "time-machine",
    title: "Time Machine - The Time Traveller's Pub",
    tagline: "Steampunk Wonderland & Massive Sound",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Gardens Galleria, Noida",
    city: "Noida",
    phone: "9711487111",
    single_price: 599,
    couple_price: "FREE",
    couple_condition: "Free on Pre-Booking",
    cover_image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Step into an awe-inspiring steampunk interior featuring gears, vintage clocks, multi-level seating, and deep bass sound systems.",
    upcoming_night: JSON.stringify({
      title: "Neon Saturday Odyssey",
      dateFormatted: "Saturday 19 September, 2026",
      shortDate: "sat, 19 sept",
      time: "9pm - 3am",
      shortTime: "9pm",
      spotsLeft: 44,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Casual chic party dress code", "Carry digital pass confirmation at gate"],
    status: "active"
  },
  {
    id: "f-bar-lounge",
    title: "F Bar & Lounge (Fashion Bar)",
    tagline: "Glamour, Glitz & VIP High Energy",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "The Grand Venice Mall, Greater Noida",
    city: "Greater Noida",
    phone: "9876543210",
    single_price: 799,
    couple_price: "FREE",
    couple_condition: "Complimentary for couples",
    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "High-fashion ultra lounge featuring international resident DJs, celebrity visits, champagne sparkler presentations, and VIP cabanas.",
    upcoming_night: JSON.stringify({
      title: "Friday Runway Techno Night",
      dateFormatted: "Friday 18 September, 2026",
      shortDate: "fri, 18 sept",
      time: "10pm - 4am",
      shortTime: "10pm",
      spotsLeft: 18,
    }),
    badge: "VIP ENTRY",
    rules: ["Strict 21+ verification", "Glamorous / Cocktail dress code", "Security frisking at entrance"],
    status: "active"
  },
  {
    id: "skyhouse-bar",
    title: "Skyhouse Bar & Cafe",
    tagline: "Starlight Dancefloor & Live Music",
    category: "clubs",
    category_label: "Nightlife & Clubs",
    location: "Logix City Centre, Sector 32 Noida",
    city: "Noida",
    phone: "9818898188",
    single_price: 349,
    couple_price: "FREE",
    couple_condition: "Free Entry for Couples",
    cover_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Sensational glasshouse indoor section and open rooftop garden with live Sufi & Fusion rock bands turning into a DJ club after 11 PM.",
    upcoming_night: JSON.stringify({
      title: "Sunday Sufi & Retro Club Night",
      dateFormatted: "Sunday 20 September, 2026",
      shortDate: "sun, 20 sept",
      time: "8pm - 1am",
      shortTime: "8pm",
      spotsLeft: 40,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Smart casuals allowed", "Free valet parking available"],
    status: "active"
  },

  // ─── 5 LIVE CONCERTS ───
  {
    id: "sunburn-arena-noida",
    title: "Sunburn Arena ft. Martin Garrix",
    tagline: "World #1 DJ Live Arena Fest",
    category: "concerts",
    category_label: "Concerts & Festivals",
    location: "Buddh International Circuit, Greater Noida",
    city: "Greater Noida",
    phone: "1800200300",
    single_price: 1499,
    couple_price: "FREE",
    couple_condition: "Couples Entry Free on Dormn Pass",
    cover_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Asia's biggest electronic music stadium festival bringing multi-platinum DJ Martin Garrix with synchronized laser shows and CO2 cannons.",
    upcoming_night: JSON.stringify({
      title: "Sunburn Arena World Tour 2026",
      dateFormatted: "Saturday 26 September, 2026",
      shortDate: "sat, 26 sept",
      time: "4pm - 11pm",
      shortTime: "4pm",
      spotsLeft: 85,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Wristbands provided at box office upon showing QR code", "No outside food/beverages", "Zero tolerance narcotics policy"],
    status: "active"
  },
  {
    id: "arijit-singh-live",
    title: "Arijit Singh - Soulful Symphony Tour",
    tagline: "3-Hour Live Stadium Concert with Orchestra",
    category: "concerts",
    category_label: "Concerts & Festivals",
    location: "JLN Stadium, New Delhi",
    city: "Delhi",
    phone: "1800200301",
    single_price: 1999,
    couple_price: "FREE",
    couple_condition: "Couple Pass on VIP Tier",
    cover_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "The voice of Bollywood romance in a mesmerizing concert accompanied by a 40-piece grand international symphony orchestra.",
    upcoming_night: JSON.stringify({
      title: "Soulful Symphony Mega Tour",
      dateFormatted: "Sunday 27 September, 2026",
      shortDate: "sun, 27 sept",
      time: "6:30pm - 10:30pm",
      shortTime: "6:30pm",
      spotsLeft: 120,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Gates open at 4:30 PM", "Metro recommended (JLN Stadium Metro Station Gate 1)", "Valid photo ID required"],
    status: "active"
  },
  {
    id: "diljit-dosanjh-tour",
    title: "Dil-Luminati India Tour - Diljit Dosanjh",
    tagline: "High Power Punjabi Beats & Stadium Pyros",
    category: "concerts",
    category_label: "Concerts & Festivals",
    location: "Noida Stadium, Sector 21A",
    city: "Noida",
    phone: "1800200302",
    single_price: 1799,
    couple_price: "FREE",
    couple_condition: "Couples Free Entry",
    cover_image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "The global Punjabi sensation brings his explosive record-breaking stadium show with vibrant dancers, authentic dhol players, and anthems.",
    upcoming_night: JSON.stringify({
      title: "Dil-Luminati Mega Fest",
      dateFormatted: "Friday 2 October, 2026",
      shortDate: "fri, 2 oct",
      time: "6pm - 11pm",
      shortTime: "6pm",
      spotsLeft: 60,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Seating on first-come-first-serve basis within category", "Strict security scanning"],
    status: "active"
  },
  {
    id: "boiler-room-noida",
    title: "Boiler Room: Underground Delhi NCR",
    tagline: "Intimate 360-Degree DJ Booth & Dark Techno",
    category: "concerts",
    category_label: "Concerts & Festivals",
    location: "Warehouse 41, Udyog Vihar",
    city: "Noida NCR",
    phone: "1800200303",
    single_price: 1199,
    couple_price: "FREE",
    couple_condition: "Guestlist Couples Free",
    cover_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "The iconic global underground music broadcasting platform brings its 360-degree raw warehouse stage featuring European acid techno pioneers.",
    upcoming_night: JSON.stringify({
      title: "Boiler Room All-Nighter",
      dateFormatted: "Saturday 3 October, 2026",
      shortDate: "sat, 3 oct",
      time: "10pm - 6am",
      shortTime: "10pm",
      spotsLeft: 45,
    }),
    badge: "EXCLUSIVE GUESTLIST",
    rules: ["No phone photography on dancefloor (camera stickers applied at gate)", "Age 21+ only"],
    status: "active"
  },
  {
    id: "prateek-kuhad-acoustic",
    title: "Prateek Kuhad - Silhouettes Acoustic Night",
    tagline: "Starlit Lawn Concert with Cold Coffee & Fairy Lights",
    category: "concerts",
    category_label: "Concerts & Festivals",
    location: "Sunder Nursery Amphitheatre, Delhi",
    city: "Delhi",
    phone: "1800200304",
    single_price: 899,
    couple_price: "FREE",
    couple_condition: "Couples Free on Pre-Registration",
    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "An intimate, starlit open-lawn indie concert surrounded by heritage Mughal monuments, picnic mats, artisan coffee stalls, and acoustic songs.",
    upcoming_night: JSON.stringify({
      title: "Silhouettes Tour Under the Stars",
      dateFormatted: "Sunday 4 October, 2026",
      shortDate: "sun, 4 oct",
      time: "6pm - 9:30pm",
      shortTime: "6pm",
      spotsLeft: 30,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Picnic lawn seating (bring your light mats)", "Pet friendly venue"],
    status: "active"
  },

  // ─── 4 CAMPUS EVENTS & FESTS ───
  {
    id: "amity-youth-fest-afterparty",
    title: "Amity Youth Fest 2026 Official Afterparty",
    tagline: "Inter-College DJ Battle & Laser Show",
    category: "events",
    category_label: "Campus Events & Fests",
    location: "Amity University Sports Complex, Sector 125 Noida",
    city: "Noida",
    phone: "9810012345",
    single_price: 199,
    couple_price: "FREE",
    couple_condition: "Student Couples Free",
    cover_image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "The grand celebratory afterparty of North India's largest collegiate cultural fest, featuring high-energy student DJ battles, neon glowsticks.",
    upcoming_night: JSON.stringify({
      title: "AYF '26 Finale Rave",
      dateFormatted: "Saturday 10 October, 2026",
      shortDate: "sat, 10 oct",
      time: "6pm - 10:30pm",
      shortTime: "6pm",
      spotsLeft: 95,
    }),
    badge: "STUDENT ID FREE",
    rules: ["College ID mandatory alongside Dormn Digital Pass", "Entry strictly before 7:30 PM"],
    status: "active"
  },
  {
    id: "campus-standup-night",
    title: "The Comic Circuit: Standup Comedy Showcase",
    tagline: "Top Comedians & Unfiltered Jokes",
    category: "events",
    category_label: "Campus Events & Fests",
    location: "Canvas Laugh Club, Mall of India, Noida",
    city: "Noida",
    phone: "9810054321",
    single_price: 299,
    couple_price: "FREE",
    couple_condition: "Couples Free Entry",
    cover_image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Two hours of non-stop laughs with 4 of India's funniest trending standup comics testing fresh club sets.",
    upcoming_night: JSON.stringify({
      title: "Weekend Standup Live",
      dateFormatted: "Friday 9 October, 2026",
      shortDate: "fri, 9 oct",
      time: "7:30pm - 9:30pm",
      shortTime: "7:30pm",
      spotsLeft: 50,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Age 16+ recommended", "Audio/video recording prohibited"],
    status: "active"
  },
  {
    id: "ncr-collegiate-gaming-fest",
    title: "Battleground NCR: Valorant & FIFA Collegiate Cup",
    tagline: "LAN Finals, Cosplay Stage & Prize Pool",
    category: "events",
    category_label: "Campus Events & Fests",
    location: "Expocentre Noida, Sector 62",
    city: "Noida",
    phone: "9810098765",
    single_price: 149,
    couple_price: "FREE",
    couple_condition: "Free spectator entry for couples",
    cover_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Largest collegiate esports gathering in Delhi NCR. 64 college teams fighting on main stage screens with live caster commentary.",
    upcoming_night: JSON.stringify({
      title: "Grand Finals Weekend",
      dateFormatted: "Saturday 17 October, 2026",
      shortDate: "sat, 17 oct",
      time: "11am - 8pm",
      shortTime: "11am",
      spotsLeft: 110,
    }),
    badge: "FREE ENTRY PASS",
    rules: ["Open to all gaming fans", "Spectator pass includes gaming arcade test access"],
    status: "active"
  },
  {
    id: "open-air-pool-fest",
    title: "SunSplash: Rooftop Pool & Sunset Fest",
    tagline: "Floating Loungers, Mocktails & Deep House",
    category: "events",
    category_label: "Campus Events & Fests",
    location: "Radisson Blu Rooftop, Sector 18 Noida",
    city: "Noida",
    phone: "9810077777",
    single_price: 499,
    couple_price: "FREE",
    couple_condition: "Free Couple Entry",
    cover_image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
    banner_image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1600&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
    ]),
    about: "Open-air luxury pool fest with floating mocktail bars, water volleyball, live BBQ counters, and breezy tropical house tracks.",
    upcoming_night: JSON.stringify({
      title: "Sunday Sunsplash Sunset Party",
      dateFormatted: "Sunday 18 October, 2026",
      shortDate: "sun, 18 oct",
      time: "3pm - 10pm",
      shortTime: "3pm",
      spotsLeft: 60,
    }),
    badge: "COUPLES ENTRY FREE",
    rules: ["Swimwear / Pool attire required", "Locker & changing rooms available", "Lifeguards on duty"],
    status: "active"
  }
];

export async function seedEvents() {
  await connectDB();

  // The seed literals below express nested values as JSON strings; store them natively.
  const toNative = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  for (const ev of INITIAL_EVENTS) {
    await Event.findOneAndUpdate(
      { _id: ev.id },
      {
        title: ev.title,
        tagline: ev.tagline,
        category: ev.category,
        category_label: ev.category_label,
        location: ev.location,
        city: ev.city,
        phone: ev.phone,
        single_price: ev.single_price,
        couple_price: ev.couple_price,
        couple_condition: ev.couple_condition,
        cover_image: ev.cover_image,
        banner_image: ev.banner_image,
        gallery: toNative(ev.gallery),
        about: ev.about,
        upcoming_night: toNative(ev.upcoming_night),
        badge: ev.badge,
        rules: toNative(ev.rules),
        status: ev.status,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Successfully seeded ${INITIAL_EVENTS.length} events into MongoDB!`);
}

if (process.argv[1] && process.argv[1].includes('seedEvents.js')) {
  seedEvents()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
