import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { Star, PlusCircle, X, CheckCircle2 } from "lucide-react";
import Container from "../../layouts/Container";
import { CardStack } from "../ui/CardStack";
import api from "../../services/api";

const ReviewsSection = () => {
  const navigate = useNavigate(); 
  
  // 🛡️ CRITICAL FIX: Start with an empty array. No more fake placeholders!
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  
  const [dimensions, setDimensions] = useState({ width: 420, height: 180 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    rating: 5,
    description: "",
  });

  // Fetch Reviews on Load from Backend
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get("/reviews");
        if (response.data.success) {
          setReviews(response.data.reviews); 
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        // Stop loading whether it succeeds or fails
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Window Resize Logic
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: Math.min(window.innerWidth - 32, isMobile ? 320 : 440),
        height: isMobile ? 180 : 205,
      });
    };

    handleResize();
    let ticking = false;
    const throttledResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleResize();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("resize", throttledResize);
    return () => window.removeEventListener("resize", throttledResize);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRatingChange = useCallback((rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  }, []);

  // Check Login BEFORE Opening Modal
  const handleAddReviewClick = () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      navigate("/login"); 
    } else {
      setIsModalOpen(true);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      await api.post(
        "/reviews/create",
        {
          rating: formData.rating,
          description: formData.description.trim(),
        }
      );

      // Refresh the reviews directly from the backend to guarantee accuracy
      const refresh = await api.get("/reviews");
      if (refresh.data.success) {
        setReviews(refresh.data.reviews);
      }

      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setIsModalOpen(false);
        setFormData({ rating: 5, description: "" });
      }, 1500);

    } catch (error) {
      console.error("Error submitting review:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSubmitted(false);
  }, []);

  const count = reviews.length;
  const hasReviews = count > 0;

  // Adaptive vertical footprint: lowest when empty, expands gracefully as reviews are added
  const sectionPadding = !hasReviews
    ? "py-8 sm:py-12"
    : count === 1
    ? "py-10 sm:py-14"
    : count === 2
    ? "py-12 sm:py-16"
    : "py-16 sm:py-20 lg:py-24";

  const headerMargin = !hasReviews
    ? "mb-4 sm:mb-5"
    : count === 1
    ? "mb-6 sm:mb-8"
    : "mb-8 sm:mb-10";

  return (
    <section className={`bg-[#FAF9F5] px-4 sm:px-6 lg:px-8 border-y border-gray-100 transition-all duration-300 ${sectionPadding}`}>
      <Container className="max-w-[1440px] 2xl:max-w-[1600px]">
        {/* Section Header */}
        <div className={`${headerMargin} text-center transition-all duration-300`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/20 bg-[#93B733]/10 px-3.5 py-1 sm:px-4 sm:py-1.5 shadow-xs mb-3">
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#93B733] fill-[#93B733]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#0D3A1D]">
              Verified Reviews
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0D3A1D] tracking-tight mb-2">
            What Our Students <span className="text-[#4E700F]">Say</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl mx-auto">
            Real experiences from students who found their perfect PG through Dormn.
          </p>
        </div>

        {/* Dynamic Reviews Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <div className="h-4 w-40 rounded-full bg-gray-200/80 animate-pulse mb-2" />
            <p className="text-xs font-semibold text-[#93B733]">Loading verified reviews...</p>
          </div>
        ) : hasReviews ? (
          <div className="mx-auto w-full max-w-4xl flex flex-col items-center transition-all duration-300">
            <CardStack
              key={reviews.length}
              items={reviews}
              initialIndex={0}
              maxVisible={Math.min(5, reviews.length)}
              autoAdvance={reviews.length > 1}
              intervalMs={3000}
              pauseOnHover
              showDots={reviews.length > 1}
              cardWidth={dimensions.width}
              cardHeight={dimensions.height}
            />

            {/* Add Review Button when reviews exist */}
            <div className="flex justify-center pt-4 sm:pt-6">
              <button
                onClick={handleAddReviewClick} 
                className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0D3A1D] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:bg-[#07130B] hover:scale-[1.03] active:scale-[0.98]"
              >
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#93B733]" />
                Add Your Review
              </button>
            </div>
          </div>
        ) : (
          /* Optimized Compact Low-Profile Empty State */
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200/70 bg-white/80 p-5 sm:p-6 text-center shadow-xs transition-all duration-300">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
              <Star className="h-5 w-5 fill-[#93B733]" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#0D3A1D]">No reviews yet</h3>
            <p className="mt-1 text-xs text-gray-500 font-medium">
              Be the first resident to share your experience and help others find their stay!
            </p>
            <div className="mt-3.5 flex justify-center">
              <button
                onClick={handleAddReviewClick}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-black text-white shadow-md transition-all hover:bg-[#07130B] hover:scale-105 active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5 text-[#93B733]" />
                Write the First Review
              </button>
            </div>
          </div>
        )}
      </Container>

      {/* Add Review Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl animate-[slideUp_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-[#0D3A1D] tracking-tight">Write a Review</h3>
                <p className="text-xs font-semibold text-gray-500">Your verified name will be used.</p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-[#93B733] mb-3 animate-bounce" />
                <h4 className="text-lg font-black text-[#0D3A1D]">Review Submitted!</h4>
                <p className="text-xs font-medium text-gray-600 mt-1">Thank you for helping the student community.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0D3A1D] mb-1.5">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= formData.rating
                              ? "fill-[#93B733] text-[#93B733]"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0D3A1D] mb-1.5">
                    Review Details *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us what you loved about your stay..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-[#0D3A1D] outline-none focus:border-[#93B733] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#93B733] py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#82a32d] active:scale-[0.98]"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(ReviewsSection);