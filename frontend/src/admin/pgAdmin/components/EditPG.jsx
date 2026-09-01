import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";

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

  useEffect(() => {
    const fetchPG = async () => {
      try {
        const { data } = await api.get(`/pg/${id}`);

        if (data?.pg) {
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
        }
      } catch (error) {
        console.error("Edit PG Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPG();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(`/pg/update/${id}`, formData);

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
            <label className="mb-2 block text-sm font-bold text-gray-700">Available Rooms</label>
            <input
              name="available_rooms"
              value={formData.available_rooms}
              onChange={handleChange}
              placeholder="Available Rooms"
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
            <label className="mb-2 block text-sm font-bold text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="PG Description"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">Rules</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              rows="4"
              placeholder="PG Rules"
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