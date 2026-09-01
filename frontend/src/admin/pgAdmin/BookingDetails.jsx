import Topbar from "./components/Topbar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { IMAGE_BASE_URL } from "../../services/api";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  FileText,
  User,
  BadgeCheck,
  BedDouble,
  Building2,
  Download,
  MessageCircle,
} from "lucide-react";

const infoCardClass =
  "rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 bg-white p-4 sm:p-5 lg:p-6 shadow-sm";

const BookingDetails = () => {
  const { id } = useParams();
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPG = async () => {
      try {
        const { data } = await api.get(`/pg/${id}`);
        setPg(data.pg);
      } catch (error) {
        console.error('BookingDetails Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPG();
  }, [id]);

  if (loading) {
    return <div className="p-8">Loading PG Details...</div>;
  }

  if (!pg) {
    return <div className="p-8">PG not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Main Content */}
      <div className="overflow-y-auto p-3 sm:p-5 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Topbar */}
          <Topbar title="PG Details" />

          {/* Hero Section */}
          <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 bg-white p-4 sm:p-6 lg:p-7 shadow-sm">
            <div className="flex flex-col gap-5 lg:gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <img
                  src={
                    pg.profile_image
                      ? `${IMAGE_BASE_URL}/uploads/${pg.profile_image}`
                      : "https://via.placeholder.com/300"
                  }
                  alt={pg.title}
                  className="mx-auto h-24 w-24 rounded-[1.5rem] object-cover sm:h-28 sm:w-28 lg:h-32 lg:w-32 sm:rounded-[2rem] md:mx-0"
                />

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black">
                      {pg.title}
                    </h1>

                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-emerald-700">
                      {pg.status}
                    </span>
                  </div>

                  <p className="mt-3 text-base text-gray-600">
                    PG Listing • {pg.city}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02]">
                      <Phone size={18} />
                      Call Student
                    </button>

                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>

                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
                      <Download size={18} />
                      Agreement
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="rounded-2xl bg-gray-100 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Booking ID
                  </p>

                  <h3 className="mt-2 text-xl font-black text-black">
                    {`PG-${pg.id}`}
                  </h3>
                </div>

                <div className="rounded-2xl bg-gray-100 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Security Deposit
                  </p>

                  <h3 className="mt-2 text-xl font-black text-black">
                    N/A
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1fr_0.95fr]">
            {/* Left Section */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <User className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Student Information
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <h3 className="mt-1 break-words text-base sm:text-lg font-bold text-black">
                      N/A
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <Phone size={18} />
                      Owner Managed
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <Mail size={18} />
                      {pg.owner_email || 'N/A'}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Emergency Contact
                    </p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <Shield size={18} />
                      N/A
                    </h3>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <Building2 className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Booking Information
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">PG Name</p>
                    <h3 className="mt-1 break-words text-base sm:text-lg font-bold text-black">
                      {pg.title}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Room Number</p>
                    <h3 className="mt-1 break-words text-base sm:text-lg font-bold text-black">
                      {`${pg.available_rooms || 0} Rooms`}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Bed Type</p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <BedDouble size={18} />
                      Available Rooms
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Room Type</p>
                    <h3 className="mt-1 break-words text-base sm:text-lg font-bold text-black">
                      {pg.pg_type}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Move In Date</p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <Calendar size={18} />
                      Created Listing
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Move Out Date</p>
                    <h3 className="mt-1 flex items-center gap-2 break-words text-base sm:text-lg font-bold text-black">
                      <Calendar size={18} />
                      Active
                    </h3>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <FileText className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Owner Notes
                  </h2>
                </div>

                <textarea
                  placeholder="PG Rules"
                  value={pg.rules || ''}
                  readOnly
                  className="min-h-[120px] sm:min-h-[180px] w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm outline-none transition focus:border-cyan-500"
                ></textarea>

                <button className="mt-5 w-full sm:w-auto rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02]">
                  Save Notes
                </button>
              </div>
            </div>

            {/* Right Section */}
            <div className="space-y-6">
              {/* Payment Information */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <CreditCard className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Payment Information
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl bg-gray-100 p-4 sm:p-5">
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-black text-black">
                      {`₹${pg.price}`}
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gray-100 p-5">
                      <p className="text-sm text-gray-500">Due Date</p>
                      <h3 className="mt-2 text-lg font-bold text-black">
                        N/A
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-gray-100 p-5">
                      <p className="text-sm text-gray-500">Status</p>

                      <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
                        {pg.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gray-100 p-5">
                      <p className="text-sm text-gray-500">Last Payment</p>
                      <h3 className="mt-2 text-lg font-bold text-black">
                        N/A
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-gray-100 p-5">
                      <p className="text-sm text-gray-500">Pending Dues</p>
                      <h3 className="mt-2 text-lg font-bold text-black">
                        N/A
                      </h3>
                    </div>
                  </div>

                  <button className="w-full rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white transition hover:scale-[1.02]">
                    Mark Payment as Paid
                  </button>
                </div>
              </div>

              {/* Documents */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <BadgeCheck className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Uploaded Documents
                  </h2>
                </div>

                <div className="space-y-4">
                  {[
                    'PG Information',
                    'Amenities',
                    'Location Details',
                    'Owner Information'
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-cyan-600" size={20} />

                        <h3 className="font-semibold text-black">
                          {doc}
                        </h3>
                      </div>

                      <button className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className={infoCardClass}>
                <div className="mb-6 flex items-center gap-3">
                  <MapPin className="text-cyan-600" />

                  <h2 className="text-xl sm:text-2xl font-black text-black">
                    Nearby Highlights
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-gray-100 p-5">
                    <h3 className="font-bold text-black">
                      Address
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {pg.address}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-5">
                    <h3 className="font-bold text-black">
                      Area
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {pg.area || 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-5">
                    <h3 className="font-bold text-black">
                      Nearby College
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {pg.nearby_college || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;