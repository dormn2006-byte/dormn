import { memo } from "react";
import PGCard from "../cards/PGCard";
import ListingSlider from "./ListingSlider";
import Container from "../../layouts/Container";
import { Link } from "react-router-dom";

const FeaturedListings = ({ featuredPGs = [], loading = false }) => {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24">
      {/* Heading */}
      <Container className="mb-8 md:mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#0D3A1D]">
              Popular PGs Near You
            </h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-gray-600">
              Explore premium student accommodations with verified listings, modern amenities and easy owner connectivity.
            </p>
          </div>

          <Link
            to="/explore"
            className="text-[#4E700F] text-sm sm:text-base font-medium hover:underline flex items-center group whitespace-nowrap pb-1"
          >
            View all PGs
            <svg 
              className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </Link>
        </div>
      </Container>

      {/* Cards */}
      <Container className="pl-3 sm:pl-4 md:px-8 lg:px-12">
        <ListingSlider>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3.5 w-full">
                  <div className="w-full aspect-[20/19] rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
                  <div className="flex flex-col gap-2 px-1">
                    <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-3 w-1/2 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 w-1/3 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPGs.length > 0 ? (
            featuredPGs.map((pg) => (
              <PGCard key={pg.id} pg={pg} />
            ))
          ) : (
            <div className="px-3 py-10 text-sm text-gray-500 sm:px-4">
              No approved PGs available at the moment.
            </div>
          )}
        </ListingSlider>
      </Container>
    </section>
  );
};

export default memo(FeaturedListings);