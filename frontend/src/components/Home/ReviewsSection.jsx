import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { Star, PlusCircle, X, CheckCircle2 } from "lucide-react";
import Container from "../../layouts/Container";
import { CardStack } from "../ui/CardStack";
import axios from "axios";

// 🚀 SMART URL: Connects to 8000 locally, and standard /api on production
const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3000/api" 
  : "/api";

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
        const response = await axios.get(`${API_BASE_URL}/reviews`);
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
        width: Math.min(window.innerWidth - 40, isMobile ? 320 : 420),
        height: isMobile ? 140 : 180,
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

      await axios.post(
        `${API_BASE_URL}/reviews/create`,
        {
          rating: formData.rating,
          description: formData.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the reviews directly from the backend to guarantee accuracy
      const refresh = await axios.get(`${API_BASE_URL}/reviews`);
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

  return (
    <section className="bg-[#FAF9F5] px-4 py-24 sm:px-6 lg:px-8 border-y border-gray-100 [content-visibility:auto] [contain-intrinsic-size:1px_600px]">
      <Container className="max-w-[1440px] 2xl:max-w-[1600px]">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/20 bg-[#93B733]/10 px-4 py-1.5 shadow-sm mb-4">
            <Star className="h-4 w-4 text-[#93B733] fill-[#93B733]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D3A1D]">
              Verified Reviews
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0D3A1D] tracking-tight mb-3">
            What Our Students <span className="text-[#4E700F]">Say</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 font-medium">
            Real experiences from students who found their perfect PG through Dormn.
          </p>
        </div>

        {/* 3D Interactive Review Cards Stack */}
        <div className="mx-auto mt-8 w-full max-w-4xl flex justify-center pb-8 min-h-[220px]">
          {/* 🛡️ THE FIX: Handle Loading, Empty, and Render States properly */}
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
               <p className="text-sm font-semibold animate-pulse text-[#93B733]">Loading verified reviews...</p>
             </div>
          ) : reviews.length > 0 ? (
            <CardStack
              key={reviews.length} // Extra safety layer to reset animations if length changes
              items={reviews}
              initialIndex={0}
              maxVisible={Math.min(5, reviews.length)}
              autoAdvance
              intervalMs={3000}
              pauseOnHover
              showDots
              cardWidth={dimensions.width}
              cardHeight={dimensions.height}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg font-semibold text-gray-500">No reviews yet.</p>
              <p className="text-sm mt-1">Be the first to share your experience!</p>
            </div>
          )}
        </div>

        {/* Add Review Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleAddReviewClick} 
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0D3A1D] px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:bg-[#07130B] hover:scale-[1.03] active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5 text-[#93B733]" />
            Add Your Review
          </button>
        </div>
      </Container>

      {/* Add Review Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
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