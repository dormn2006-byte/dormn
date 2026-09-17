import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";

const EditPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    area: "",
    nearby_college: "",
    available_rooms: "",
    google_map_link: "",
    rules: "",
  });

  const [sharingOptions, setSharingOptions] = useState({
    single: { available: false, ac_price: "", non_ac_price: "" },
    double: { available: false, ac_price: "", non_ac_price: "" },
    triple: { available: false, ac_price: "", non_ac_price: "" },
  });

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPG = async () => {
      try {
        const { data } = await api.get(`/pg/${id}`);

        if (data?.pg) {
          // Verify ownership: if this PG does not belong to the logged-in owner, redirect to 404
          if (Number(data.pg.owner_id) !== Number(user?.id) && user?.role !== "admin" && user?.role !== "superadmin") {
            navigate("/404", { replace: true });
            return;
          }

          setFormData({
            title: data.pg.title || "",
            description: data.pg.description || "",
            price: data.pg.price || "",
            address: data.pg.address || "",
            city: data.pg.city || "",
            area: data.pg.area || "",
            nearby_college: data.pg.nearby_college || "",
            available_rooms: data.pg.available_rooms || "",
            google_map_link: data.pg.google_map_link || "",
            rules: data.pg.rules || "",
          });

          // Parse sharing options concisely
          let parsed = {};
          try {
            parsed = typeof data.pg.sharing_options === "string" ? JSON.parse(data.pg.sharing_options) : data.pg.sharing_options || {};
          } catch {}

          const parsedSharing = ["single", "double", "triple"].reduce((acc, k) => {
            const item = parsed?.[k] || {};
            acc[k] = {
              available: !!(item.available || item.ac_price || item.non_ac_price),
              ac_price: item.ac_price || "",
              non_ac_price: item.non_ac_price || "",
            };
            return acc;
          }, {});
          setSharingOptions(parsedSharing);
        } else {
          navigate("/404", { replace: true });
        }
      } catch (error) {
        console.error("Edit PG Fetch Error:", error);
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchPG();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSharingCheckboxChange = (roomType) => {
    setSharingOptions((prev) => ({
      ...prev,
      [roomType]: {
        ...prev[roomType],
        available: !prev[roomType].available,
      },
    }));
  };

  const handleSharingPriceChange = (roomType, field, value) => {
    setSharingOptions((prev) => ({
      ...prev,
      [roomType]: {
        ...prev[roomType],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description?.trim()) {
      alert("Please provide a property description.");
      return;
    }
    if (!formData.rules?.trim()) {
      alert("Please provide property rules & policies.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/pg/update/${id}`, {
        ...formData,
        sharing_options: JSON.stringify(sharingOptions),
      });

      alert("PG updated successfully");

      navigate("/owner/my-pgs");
    } catch (error) {
      console.error("Update PG Error:", error);
      alert(error?.response?.data?.message || "Failed to update PG");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-black">Loading PG Details...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-black text-black">Edit PG</h1>
        <p className="mt-2 text-gray-600">
          Update your PG information and save changes.
        </p>
      </div>

      <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">PG Name</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter PG Name"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Price</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Monthly Price"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Area</label>
            <input
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Area"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Total Capacity / Spots Available</label>
            <input
              name="available_rooms"
              type="number"
              min="0"
              value={formData.available_rooms}
              onChange={handleChange}
              placeholder="Total Capacity / Spots (e.g. 10)"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Nearby College</label>
            <input
              name="nearby_college"
              value={formData.nearby_college}
              onChange={handleChange}
              placeholder="Nearby College"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          {/* Room Sharing & Pricing Configurations */}
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-black">Room Sharing & Rates</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure room occupancy types (Single, Double, Triple) and their AC / Non-AC monthly rates.
              </p>
            </div>

            <div className="space-y-3">
              {["single", "double", "triple"].map((roomType) => {
                const isAvailable = sharingOptions[roomType]?.available;
                return (
                  <div
                    key={roomType}
                    className={`rounded-xl border p-4 transition-all ${
                      isAvailable ? "border-[#93B733] bg-white" : "border-gray-200 bg-gray-100/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`edit-sharing-${roomType}`}
                        checked={!!isAvailable}
                        onChange={() => handleSharingCheckboxChange(roomType)}
                        className="h-5 w-5 accent-[#0D3A1D] rounded cursor-pointer"
                      />
                      <label
                        htmlFor={`edit-sharing-${roomType}`}
                        className="text-sm font-bold text-gray-900 capitalize cursor-pointer flex-1"
                      >
                        {roomType} Sharing Room
                      </label>
                    </div>

                    {isAvailable && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 pt-3 border-t border-gray-100">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
                            AC Monthly Rent (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={sharingOptions[roomType]?.ac_price || ""}
                            onChange={(e) => handleSharingPriceChange(roomType, "ac_price", e.target.value)}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-black outline-none focus:border-[#93B733]"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
                            Non-AC Monthly Rent (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 8000"
                            value={sharingOptions[roomType]?.non_ac_price || ""}
                            onChange={(e) => handleSharingPriceChange(roomType, "non_ac_price", e.target.value)}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-black outline-none focus:border-[#93B733]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full Address"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Google Maps Link
            </label>
            <input
              name="google_map_link"
              value={formData.google_map_link}
              onChange={handleChange}
              placeholder="Paste exact Google Maps link"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="PG Description"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Rules & Policies <span className="text-red-500">*</span>
            </label>
            <textarea
              name="rules"
              required
              value={formData.rules}
              onChange={handleChange}
              rows="4"
              placeholder="PG Rules & Policies"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 rounded-2xl bg-black px-6 py-4 font-bold text-white"
          >
            {saving ? "Updating..." : "Update PG"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPG;