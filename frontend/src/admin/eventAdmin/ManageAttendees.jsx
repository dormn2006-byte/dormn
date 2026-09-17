import { useState, useMemo, useEffect } from "react";
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Calendar,
  Download,
  QrCode,
  Tag,
  ShieldCheck,
  Users,
  Heart,
  Users2
} from "lucide-react";
import { getAdminAttendees, toggleAttendeeCheckin } from "../../services/eventAdminService";

const ManageAttendees = () => {
  const [attendees, setAttendees] = useState(() => getAdminAttendees());

  useEffect(() => {
    const handleUpdate = () => setAttendees(getAdminAttendees());
    window.addEventListener("dormn_tickets_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dormn_tickets_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);

  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      const matchSearch =
        a.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.guestPhone.includes(searchTerm) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "all" ? true : a.category === categoryFilter;
      const matchType = ticketTypeFilter === "all" ? true : a.ticketType === ticketTypeFilter;
      const matchStatus = statusFilter === "all" ? true : a.status === statusFilter;

      return matchSearch && matchCategory && matchType && matchStatus;
    });
  }, [attendees, searchTerm, categoryFilter, ticketTypeFilter, statusFilter]);

  const handleToggleCheckin = (ticketId) => {
    const updated = toggleAttendeeCheckin(ticketId);
    setAttendees(updated);
  };

  const handleExportCSV = () => {
    const headers = ["Ticket ID", "Guest Name", "Phone", "Email", "Event Title", "Category", "Ticket Type", "Quantity", "Base Price", "Discount", "Net Amount", "Coupon Code", "Status", "Booking Date"];
    const rows = filteredAttendees.map(a => [
      a.id,
      `"${a.guestName}"`,
      a.guestPhone,
      a.guestEmail,
      `"${a.eventTitle}"`,
      a.category,
      a.ticketType,
      a.quantity,
      a.basePrice,
      a.discount,
      a.netAmount,
      a.couponCode || "None",
      a.status,
      a.bookingDate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dormn_event_attendees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black">
              <Ticket size={18} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Ticket Attendees & Gate Pass Log ({filteredAttendees.length})
            </h2>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Real-time bookings, gate check-in status, contact info, and coupon redemptions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-5 py-3 text-xs font-black text-gray-800 dark:text-white transition cursor-pointer"
        >
          <Download size={15} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, ticket ID, event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="events">Events & Fests</option>
            <option value="concerts">Live Concerts</option>
            <option value="clubs">Clubs & Nightlife</option>
          </select>

          <select
            value={ticketTypeFilter}
            onChange={(e) => setTicketTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Pass Types</option>
            <option value="single">Single Pass</option>
            <option value="couple">Couple Pass</option>
            <option value="group">Group Pass</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
          </select>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="py-4 px-4">Ticket ID</th>
                <th className="py-4 px-4">Guest Info</th>
                <th className="py-4 px-4">Event / Show</th>
                <th className="py-4 px-4">Pass Type</th>
                <th className="py-4 px-4">Amount Paid</th>
                <th className="py-4 px-4">Coupon</th>
                <th className="py-4 px-4">Gate Status</th>
                <th className="py-4 px-4 text-right">QR / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-bold">
              {filteredAttendees.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition">
                  {/* Ticket ID */}
                  <td className="py-3.5 px-4 font-mono font-black text-purple-600 dark:text-purple-400">
                    {att.id}
                  </td>

                  {/* Guest Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-black text-gray-900 dark:text-white">
                      {att.guestName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mt-0.5">
                      <span>{att.guestPhone}</span>
                    </div>
                  </td>

                  {/* Event */}
                  <td className="py-3.5 px-4">
                    <div className="font-black text-gray-900 dark:text-white max-w-xs truncate">
                      {att.eventTitle}
                    </div>
                    <span className="text-[10px] uppercase text-purple-500 font-bold">
                      {att.category}
                    </span>
                  </td>

                  {/* Pass Type */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black capitalize ${
                      att.ticketType === 'couple'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : att.ticketType === 'group'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {att.ticketType === 'couple' ? '👫 Couple' : att.ticketType === 'group' ? `👥 Group (${att.seatsCount})` : '👤 Single'}
                    </span>
                  </td>

                  {/* Amount Paid */}
                  <td className="py-3.5 px-4">
                    <span className="font-black text-gray-900 dark:text-white">
                      ₹{att.netAmount}
                    </span>
                    {att.discount > 0 && (
                      <span className="text-[10px] text-emerald-500 block">
                        Saved ₹{att.discount}
                      </span>
                    )}
                  </td>

                  {/* Coupon */}
                  <td className="py-3.5 px-4">
                    {att.couponCode ? (
                      <span className="font-mono text-[11px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                        {att.couponCode}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Status toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleCheckin(att.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        att.status === 'checked_in'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-emerald-500/10 hover:text-emerald-500'
                      }`}
                    >
                      {att.status === 'checked_in' ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Checked In</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>Admit Entry</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* QR view */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedTicketForQR(att)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                      title="View Digital QR Pass"
                    >
                      <QrCode size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Pass Modal */}
      {selectedTicketForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#0C1220] p-6 text-white text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest">DIGITAL GATE PASS</span>
              <button onClick={() => setSelectedTicketForQR(null)} className="text-gray-400 hover:text-white font-black">✕</button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-lg">
              <QrCode size={140} className="text-black" />
            </div>

            <div>
              <span className="font-mono text-xs font-black text-purple-400 block">{selectedTicketForQR.id}</span>
              <h3 className="text-lg font-black text-white mt-1">{selectedTicketForQR.guestName}</h3>
              <p className="text-xs text-gray-400">{selectedTicketForQR.eventTitle}</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex justify-between">
              <span>Pass Type:</span>
              <span className="font-black text-purple-400 capitalize">{selectedTicketForQR.ticketType} ({selectedTicketForQR.seatsCount} Pax)</span>
            </div>

            <button
              onClick={() => {
                handleToggleCheckin(selectedTicketForQR.id);
                setSelectedTicketForQR(null);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white transition shadow-lg cursor-pointer"
            >
              Verify & Check In Guest
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageAttendees;
