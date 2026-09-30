import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CreditCard, Plus } from "lucide-react";
import api from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import BankAccountsSelectorModal from "./BankAccountsSelectorModal";
import BankAccountCard from "./BankAccountCard";

const EditPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pgStatus, setPgStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [errorNotFound, setErrorNotFound] = useState(false);
  const [connectedBank, setConnectedBank] = useState(null);
  const [showBankSelectorModal, setShowBankSelectorModal] = useState(false);

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
    food_type: "Both",
  });

  const [sharingOptions, setSharingOptions] = useState({
    single: { available: false, ac_price: "", non_ac_price: "" },
    double: { available: false, ac_price: "", non_ac_price: "" },
    triple: { available: false, ac_price: "", non_ac_price: "" },
  });

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPG = async () => {
      const cleanId = id ? String(id).trim() : "";
      if (!cleanId || cleanId === "undefined" || cleanId.includes("${")) {
        setErrorNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const [pgRes, banksRes] = await Promise.all([
          api.get(`/pg/${cleanId}`),
          api.get("/auth/bank-accounts").catch(() => ({ data: {} })),
        ]);

        const data = pgRes?.data;
        const allBanks = banksRes?.data?.bank_accounts || [];

        if (data?.pg) {
          const currentUserId = user?.id || user?._id;
          const pgOwnerId = typeof data.pg.owner_id === "object"
            ? (data.pg.owner_id?.id || data.pg.owner_id?._id)
            : data.pg.owner_id;

          // Verify ownership if both IDs are loaded
          if (
            currentUserId &&
            pgOwnerId &&
            Number(pgOwnerId) !== Number(currentUserId) &&
            user?.role !== "admin" &&
            user?.role !== "superadmin"
          ) {
            setErrorNotFound(true);
            setLoading(false);
            return;
          }

          setPgStatus(data.pg.status || "");
          setAdminNote(data.pg.admin_note || "");
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
            food_type: data.pg.food_type || "Both",
          });

          // Resolve connected bank account
          let connectedObj = null;
          if (data.pg.connected_bank_account) {
            connectedObj = typeof data.pg.connected_bank_account === "string"
              ? JSON.parse(data.pg.connected_bank_account)
              : data.pg.connected_bank_account;
          } else if (data.pg.connected_bank_account_id && allBanks.length > 0) {
            connectedObj = allBanks.find((b) => b.id === data.pg.connected_bank_account_id) || null;
          }

          if (!connectedObj && allBanks.length > 0) {
            connectedObj = allBanks.find((b) => b.is_primary) || allBanks[0];
          }
          setConnectedBank(connectedObj);

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
          setErrorNotFound(true);
        }
      } catch (error) {
        console.error("Edit PG Fetch Error:", error);
        setErrorNotFound(true);
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
        ac_price: "",
        non_ac_price: "",
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

    if (!formData.title || !formData.price) {
      alert("Title and Price are required");
      return;
    }

    try {
      setSaving(true);

      const isRevision = pgStatus === "rejected";

      const res = await api.put(`/pg/update/${id}`, {
        ...formData,
        sharing_options: JSON.stringify(sharingOptions),
        connected_bank_account_id: connectedBank?.id || null,
        connected_bank_account: connectedBank || null,
        resubmit: isRevision,
      });

      alert(
        res?.data?.message ||
        (isRevision
          ? "PG updated and re-submitted for admin approval!"
          : "PG updated successfully")
      );

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 text-center shadow-2xs">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-[#93B733] mb-2"></div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading PG Details...</p>
      </div>
    );
  }

  if (errorNotFound) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-12 text-center shadow-2xs space-y-4 max-w-lg mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle size={30} />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">Property Not Found</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This PG listing could not be found or you do not have permission to edit it with your current account.
          </p>
        </div>
        <button
          onClick={() => navigate("/owner/my-pgs")}
          className="px-5 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs transition cursor-pointer"
        >
          Return to My Properties
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1200px] mx-auto animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/owner/my-pgs")}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
            title="Back to My PGs"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
              Edit Property Listing
            </h1>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Update room pricing, location, descriptions, and policies.
            </p>
          </div>
        </div>
      </div>

      {pgStatus === "rejected" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 sm:p-3.5 text-amber-900 dark:text-amber-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <span className="rounded-md bg-amber-500 text-white px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
              Needs Revision
            </span>
            <span>Admin Requested Updates</span>
          </div>
          {adminNote && (
            <div className="rounded-lg bg-amber-500/15 dark:bg-black/40 border border-amber-500/30 p-2 text-[11px] sm:text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold text-amber-700 dark:text-amber-400">Feedback from Admin: </span>
              <span className="leading-snug">{adminNote}</span>
            </div>
          )}
          <p className="text-[11px] sm:text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            Review your details below, update the required fields, and click <strong>Save Changes</strong> to automatically re-submit it for approval.
          </p>
        </div>
      )}

      {pgStatus === "removed" && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 sm:p-3.5 text-rose-900 dark:text-rose-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <AlertCircle size={15} className="text-rose-500 shrink-0" />
            <span className="rounded-md bg-rose-600 text-white px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
              Delisted
            </span>
            <span>Property Removed from Live Listings</span>
          </div>
          <div className="rounded-lg bg-rose-500/15 dark:bg-black/40 border border-rose-500/30 p-2 text-[11px] sm:text-xs text-rose-900 dark:text-rose-200">
            <span className="font-bold text-rose-700 dark:text-rose-400">Admin Removal Note: </span>
            <span className="leading-snug">{adminNote || "This property was delisted by administrator and is hidden from student explore pages."}</span>
          </div>
          <p className="text-[11px] sm:text-xs leading-relaxed text-rose-800 dark:text-rose-300">
            You can still update details and save changes. Contact platform admin to restore this listing.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-2.5 sm:p-4 shadow-2xs">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 sm:gap-2.5">

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">PG Name</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter PG Name"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-1">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Base Price (₹/mo)</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Monthly Price"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-1">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Remaining Rooms</label>
            <input
              name="available_rooms"
              type="number"
              min="0"
              value={formData.available_rooms}
              onChange={handleChange}
              placeholder="Available Rooms"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-1">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-1">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Area</label>
            <input
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Area"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nearby College</label>
            <input
              name="nearby_college"
              value={formData.nearby_college}
              onChange={handleChange}
              placeholder="Nearby College"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Food Preference</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "Veg", label: "Veg 🟢" },
                { id: "Non-Veg", label: "Non-Veg 🟤" },
              ].map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, food_type: diet.id }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                    (formData.food_type || "Veg") === diet.id
                      ? "border-[#93B733] bg-[#93B733]/15 text-[#3e5a0c] dark:text-[#93B733] ring-1 ring-[#93B733]/30"
                      : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-gray-700 dark:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  {diet.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settlement Bank Account */}
          <div className="col-span-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02] p-2.5 sm:p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#93B733]" />
                <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white">
                  Settlement Bank Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBankSelectorModal(true)}
                className="text-[10px] sm:text-xs font-bold text-[#0D3A1D] dark:text-[#93B733] hover:underline cursor-pointer"
              >
                {connectedBank ? "Change Bank" : "+ Connect Bank"}
              </button>
            </div>

            {connectedBank ? (
              <div className="max-w-md pt-0.5">
                <BankAccountCard
                  account={connectedBank}
                  isPrimary={Boolean(connectedBank.is_primary)}
                  selectable={false}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBankSelectorModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border-2 border-dashed border-[#93B733]/40 bg-[#93B733]/5 text-[#0D3A1D] dark:text-[#93B733] text-xs font-bold hover:bg-[#93B733]/10 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Connect Payout Bank Account</span>
              </button>
            )}
          </div>

          {/* Room Sharing & Pricing Configurations */}
          <div className="col-span-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02] p-2.5 sm:p-3 space-y-2">
            <div>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white">Room Sharing & Rates</h3>
              <p className="text-[10px] text-gray-400">
                Configure room occupancy rates (AC / Non-AC).
              </p>
            </div>

            <div className="space-y-1.5">
              {["single", "double", "triple"].map((roomType) => {
                const isAvailable = sharingOptions[roomType]?.available;
                return (
                  <div
                    key={roomType}
                    className={`rounded-lg border p-2 transition-all ${
                      isAvailable ? "border-[#93B733]/50 bg-[#93B733]/5 dark:bg-[#93B733]/10" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edit-sharing-${roomType}`}
                        checked={!!isAvailable}
                        onChange={() => handleSharingCheckboxChange(roomType)}
                        className="h-3.5 w-3.5 accent-[#0D3A1D] dark:accent-[#93B733] rounded cursor-pointer"
                      />
                      <label
                        htmlFor={`edit-sharing-${roomType}`}
                        className="text-[11px] font-bold text-gray-900 dark:text-white capitalize cursor-pointer flex-1"
                      >
                        {roomType} Sharing Room
                      </label>
                    </div>

                    {isAvailable && (
                      <div className="mt-1.5 grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-100 dark:border-white/10">
                        <div>
                          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                            AC Rent (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={sharingOptions[roomType]?.ac_price || ""}
                            onChange={(e) => handleSharingPriceChange(roomType, "ac_price", e.target.value)}
                            className="w-full h-7 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-2 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                          />
                        </div>

                        <div>
                          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                            Non-AC Rent (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 8000"
                            value={sharingOptions[roomType]?.non_ac_price || ""}
                            onChange={(e) => handleSharingPriceChange(roomType, "non_ac_price", e.target.value)}
                            className="w-full h-7 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-2 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full Address"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Google Maps Link
            </label>
            <input
              name="google_map_link"
              value={formData.google_map_link}
              onChange={handleChange}
              placeholder="Paste exact Google Maps link"
              className="w-full h-8 sm:h-8.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="PG Description"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition resize-none"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Rules & Policies <span className="text-red-500">*</span>
            </label>
            <textarea
              name="rules"
              required
              value={formData.rules}
              onChange={handleChange}
              rows="2"
              placeholder="PG Rules & Policies"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-black/20 transition resize-none"
            />
          </div>

          <div className="col-span-2 pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/owner/my-pgs")}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[#0D3A1D] hover:bg-[#07130B] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-4 py-1.5 text-[11px] font-bold text-white dark:text-gray-950 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? "Submitting..."
                : pgStatus === "rejected"
                ? "Save & Re-submit for Approval"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Bank Account Selection Modal */}
      {showBankSelectorModal && (
        <BankAccountsSelectorModal
          isOpen={showBankSelectorModal}
          onClose={() => setShowBankSelectorModal(false)}
          selectedAccountId={connectedBank?.id}
          onAccountSelect={(account) => setConnectedBank(account)}
        />
      )}
    </div>
  );
};

export default EditPG;