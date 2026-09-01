import React, { memo, useRef } from 'react';
import { ArrowLeft, Download, FileText, Building2, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const InvoiceView = memo(({ payment, pgInfo, studentName, onBack }) => {
  const invoiceRef = useRef(null);

  const handleDownloadPdf = () => {
    if (!invoiceRef.current) return;
    const w = window.open('', '', 'width=900,height=650');
    w.document.write(`
      <html><head><title>Invoice - ${payment?.id}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
        .title { font-size: 28px; font-weight: 800; color: #0D3A1D; margin: 0; }
        .grid { display: flex; justify-content: space-between; margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f9fafb; padding: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; text-align: left; }
        td { padding: 14px; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
        .total-row td { font-weight: 800; font-size: 17px; color: #0D3A1D; background: #f9fafb; }
        .text-right { text-align: right; }
      </style></head>
      <body>${invoiceRef.current.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const invoiceNumber = `INV-${new Date(payment?.created_at || payment?.booking_date || Date.now()).getFullYear()}-${String(payment?.id || 1).padStart(5, '0')}`;
  const amountVal = Number(payment?.amount || payment?.booked_price || payment?.price || 0);
  const pgTitle = pgInfo?.title || pgInfo?.pg_name || payment?.title || payment?.pg_name || 'PG Accommodation';
  const pgAddress = pgInfo?.pg_address || (pgInfo?.area && pgInfo?.city ? `${pgInfo.area}, ${pgInfo.city}` : (payment?.area && payment?.city ? `${payment.area}, ${payment.city}` : 'Address on file'));
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  const status = (payment?.payment_status || payment?.status || 'paid').toLowerCase();

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-sm font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments
        </button>
        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3A1D] text-white font-bold text-sm shadow-md hover:bg-[#155e30] dark:bg-[#93B733] dark:text-[#0D3A1D] transition-all cursor-pointer">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Hidden printable div */}
      <div className="hidden">
        <div ref={invoiceRef}>
          <div className="header">
            <div>
              <h1 className="title">{pgTitle}</h1>
              <p>Invoice #: {invoiceNumber}</p>
              <p>Date: {formatDate(payment?.created_at || payment?.booking_date)}</p>
            </div>
            <div className="text-right"><strong>{status.toUpperCase()}</strong></div>
          </div>
          <div className="grid">
            <div><h3>From</h3><p><strong>{pgTitle}</strong></p><p>{pgAddress}</p></div>
            <div className="text-right"><h3>Billed To</h3><p><strong>{studentName}</strong></p><p>Resident Student</p></div>
          </div>
          <table>
            <thead><tr><th>Description</th><th>Booking Date</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              <tr><td>Monthly Rent</td><td>{formatDate(payment?.booking_date || payment?.created_at)}</td><td>{status}</td><td className="text-right">₹{amountVal.toLocaleString('en-IN')}</td></tr>
              <tr className="total-row"><td colSpan="3">Total</td><td className="text-right">₹{amountVal.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen Invoice Card */}
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Invoice</h2>
              <p className="text-gray-400 text-xs mt-0.5">{invoiceNumber}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 mt-2">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {status}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-gray-400">Total Amount</span>
            <p className="text-3xl font-black text-[#0D3A1D] dark:text-white mt-1">₹{amountVal.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 border-b border-gray-100 dark:border-white/10">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Billed From</span>
            <h4 className="text-base font-black text-[#0D3A1D] dark:text-white mt-1">{pgTitle}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{pgAddress}</p>
          </div>
          <div className="md:text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5 md:justify-end"><User className="w-3.5 h-3.5" /> Billed To</span>
            <h4 className="text-base font-black text-[#0D3A1D] dark:text-white mt-1">{studentName}</h4>
            <p className="text-xs text-gray-400 mt-0.5">Resident Tenant</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03] text-xs font-bold text-gray-500 uppercase">
                <tr><th className="py-3 px-4">Description</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
                <tr><td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">Monthly Rent</td><td className="py-3.5 px-4">{formatDate(payment?.booking_date || payment?.created_at)}</td><td className="py-3.5 px-4 capitalize">{status}</td><td className="py-3.5 px-4 text-right font-bold">₹{amountVal.toLocaleString('en-IN')}</td></tr>
                <tr className="bg-gray-50/50 dark:bg-white/[0.02] font-black text-gray-900 dark:text-white"><td colSpan="3" className="py-3.5 px-4">Total Amount</td><td className="py-3.5 px-4 text-right text-[#0D3A1D] dark:text-[#93B733]">₹{amountVal.toLocaleString('en-IN')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceView.displayName = 'InvoiceView';
export default InvoiceView;
