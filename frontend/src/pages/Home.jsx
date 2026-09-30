import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trash2, X } from "lucide-react";
import HeroSection from "../components/Home/HeroSection";
import SearchSection from "../components/Home/SearchSection";
import FeaturedListings from "../components/Home/FeaturedListings";
const HomeServiceTopics = lazy(() => import("../components/Home/HomeServiceTopics"));
const ReviewsSection = lazy(() => import("../components/Home/ReviewsSection"));
const FeaturesShowcase = lazy(() => import("../components/Home/FeaturesShowcase"));
import PublicLayout from "../layouts/PublicLayout";
import API from "../services/api";
import { hasAmenityMatch } from "../utils/amenities";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [featuredPGs, setFeaturedPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  
  const [filters, setFilters] = useState({
    keyword: "",
    pgType: "",
    city: "", 
    area: "",
    landmark: "",
    amenity: "",
    minPrice: "",
    maxPrice: "30000",
  });
  
  const [activeFilters, setActiveFilters] = useState({
    keyword: "",
    pgType: "",
    city: "",
    area: "",
    landmark: "",
    amenity: "",
    minPrice: "",
    maxPrice: "30000",
  });

  const [dynamicOptions, setDynamicOptions] = useState({
    cities: [],
    areas: [],
    landmarks: []
  });

  // Check for account deleted notification from navigation state
  useEffect(() => {
    if (location.state?.accountDeleted) {
      setShowDeletedToast(true);
      // Clean up location state so refresh doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
      const timer = setTimeout(() => setShowDeletedToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, location.pathname, navigate]);

  const filteredPGs = useMemo(() => {
    const list = featuredPGs.filter((pg) => {
      const keywordMatch =
        !activeFilters.keyword ||
        pg.title?.toLowerCase().includes(activeFilters.keyword.toLowerCase()) ||
        pg.city?.toLowerCase().includes(activeFilters.keyword.toLowerCase()) ||
        pg.address?.toLowerCase().includes(activeFilters.keyword.toLowerCase()) ||
        pg.area?.toLowerCase().includes(activeFilters.keyword.toLowerCase()) ||
        hasAmenityMatch(pg, activeFilters.keyword);

      const typeMatch =
        !activeFilters.pgType ||
        pg.pg_type?.toLowerCase() === activeFilters.pgType.toLowerCase();

      const activeCity = activeFilters.city || activeFilters.location || "";
      const cityMatch =
        !activeCity ||
        pg.city?.toLowerCase() === activeCity.toLowerCase();

      const areaMatch =
        !activeFilters.area ||
        pg.area?.toLowerCase() === activeFilters.area.toLowerCase();

      const landmarkMatch =
        !activeFilters.landmark ||
        pg.nearby_college?.toLowerCase() === activeFilters.landmark.toLowerCase();

      const pgPrice = Number(pg.price || 0);
      const minPriceMatch = !activeFilters.minPrice || Number(activeFilters.minPrice) <= 0 || pgPrice >= Number(activeFilters.minPrice);
      const maxPriceMatch = !activeFilters.maxPrice || Number(activeFilters.maxPrice) >= 50000 || pgPrice <= Number(activeFilters.maxPrice);

      const amenityList = activeFilters.amenities || (activeFilters.amenity ? activeFilters.amenity.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : []);
      const amenityMatch = amenityList.length === 0 || amenityList.every(a => hasAmenityMatch(pg, a));

      return keywordMatch && typeMatch && cityMatch && areaMatch && landmarkMatch && minPriceMatch && maxPriceMatch && amenityMatch;
    });

    return [...list].sort((a, b) => {
      const aSpots = a.spots_left !== undefined ? Number(a.spots_left) : Number(a.available_rooms || 0);
      const bSpots = b.spots_left !== undefined ? Number(b.spots_left) : Number(b.available_rooms || 0);
      const aAvailable = aSpots > 0 ? 1 : 0;
      const bAvailable = bSpots > 0 ? 1 : 0;
      if (aAvailable !== bAvailable) {
        return bAvailable - aAvailable;
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [featuredPGs, activeFilters]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [pgResponse, filterResponse] = await Promise.all([
          API.get("/pg/all"),
          API.get("/pg/filter-options")
        ]);

        const pgs = pgResponse.data?.pgs || pgResponse.data?.data || pgResponse.data || [];
        setFeaturedPGs(Array.isArray(pgs) ? pgs : []);

        if (filterResponse.data?.success) {
          setDynamicOptions({
            cities: filterResponse.data.data.cities || [],
            areas: filterResponse.data.data.areas || [],
            landmarks: filterResponse.data.data.colleges || [],
          });
        }
      } catch (error) {
        console.error("Home page data load failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleHomeSearch = (searchFilters) => {
    setActiveFilters(searchFilters);
  };

  const availableAreas = useMemo(() => {
    return filters.city
      ? [...new Set(featuredPGs.filter((pg) => pg.city?.toLowerCase() === filters.city.toLowerCase() && pg.area).map((pg) => pg.area))]
      : dynamicOptions.areas;
  }, [filters.city, featuredPGs, dynamicOptions.areas]);

  const availableLandmarks = useMemo(() => {
    return filters.city
      ? [...new Set(featuredPGs.filter((pg) => pg.city?.toLowerCase() === filters.city.toLowerCase() && pg.nearby_college).map((pg) => pg.nearby_college))]
      : dynamicOptions.landmarks;
  }, [filters.city, featuredPGs, dynamicOptions.landmarks]);

  return (
    <PublicLayout>
      <HeroSection pgs={featuredPGs} />

      <SearchSection
        filters={filters}
        setFilters={setFilters}
        onSearch={handleHomeSearch}
        availableCities={dynamicOptions.cities}
        availableAreas={availableAreas}           
        availableLandmarks={availableLandmarks}   
      />

      <FeaturedListings
        featuredPGs={filteredPGs}
        loading={loading}
      />

      <Suspense fallback={null}>
        <HomeServiceTopics />
      </Suspense>

      <Suspense fallback={null}>
        <ReviewsSection />
      </Suspense>

      <Suspense fallback={null}>
        <FeaturesShowcase />
      </Suspense>

      {/* Sleek Bottom Notification: Account Deleted */}
      {showDeletedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md w-[92%] sm:w-auto">
          <div className="flex items-center justify-between gap-3.5 rounded-full bg-[#111111]/95 dark:bg-white/95 text-white dark:text-gray-900 px-5 py-3.5 shadow-2xl backdrop-blur-xl border border-white/10 dark:border-black/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-red-500 dark:text-red-600 shrink-0">
                <Trash2 size={15} />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-tight">
                Your account has been permanently deleted.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDeletedToast(false)}
              className="p-1 rounded-full text-gray-400 hover:text-white dark:hover:text-black transition cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default Home;