import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Star, Eye, EyeOff, Trash2, Filter } from "lucide-react";
import { AuthContext } from "../../context/AuthContext"; // <-- Added to grab your real token!

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("ALL");
  
  // 🚀 Grab the exact token from your context, just like Dashboard.jsx does
  const { token } = useContext(AuthContext); 
  
  // 🚀 Match your global API URL structure perfectly
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.dormn.com/api";

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) return; // Don't fetch if token hasn't loaded yet

      try {
        const response = await axios.get(`${API_BASE_URL}/reviews/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error("Error fetching admin reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    try {
      await axios.put(
        `${API_BASE_URL}/reviews/admin/status`,
        { id, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update UI instantly
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/reviews/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from UI
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      alert("Failed to delete review");
    }
  };

  // Filter Logic
  const filteredReviews = filterRating === "ALL" 
    ? reviews 
    : reviews.filter(r => r.rating === filterRating);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0D3A1D]">Manage Reviews</h1>
        <p className="text-gray-500 mt-2 font-medium">Monitor, hide, and manage user feedback across the platform.</p>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mr-4 text-sm font-bold text-gray-700 uppercase">
          <Filter className="h-4 w-4" /> Filters:
        </div>
        
        <button 
          onClick={() => setFilterRating("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterRating === "ALL" ? "bg-[#0D3A1D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All Reviews
        </button>
        
        {[5, 4, 3, 2, 1].map(star => (
          <button 
            key={star}
            onClick={() => setFilterRating(star)}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterRating === star ? "bg-[#93B733] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {star} <Star className={`h-3 w-3 ${filterRating === star ? "fill-white" : "fill-gray-400"}`} />
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-black uppercase text-xs tracking-wider">
              <tr>
                <th className="p-5">User</th>
                <th className="p-5">Rating</th>
                <th className="p-5">Review</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium animate-pulse">Loading reviews...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No reviews found for this filter.</td></tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* User Column */}
                    <td className="p-5">
                      <p className="font-bold text-[#0D3A1D]">{review.full_name}</p>
                      <p className="text-xs text-gray-500 font-medium">ID: {review.user_id}</p>
                      <p className="text-xs text-gray-500 font-medium">{review.email}</p>
                    </td>

                    {/* Rating Column */}
                    <td className="p-5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-[#93B733] text-[#93B733]" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                    </td>

                    {/* Description Column */}
                    <td className="p-5 max-w-xs">
                      <p className="text-gray-700 italic line-clamp-2">"{review.description}"</p>
                    </td>

                    {/* Status Column */}
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                        review.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {review.status === 'approved' ? 'Public' : 'Hidden'}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Hide/Show Toggle */}
                        <button 
                          onClick={() => handleToggleStatus(review.id, review.status)}
                          className={`p-2 rounded-lg transition-colors ${review.status === 'approved' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          title={review.status === 'approved' ? "Hide Review" : "Publish Review"}
                        >
                          {review.status === 'approved' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDelete(review.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageReviews;