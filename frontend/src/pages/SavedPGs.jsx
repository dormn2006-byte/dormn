 import { useState, useEffect, useContext, useCallback, useRef, memo, useMemo } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { User, BookOpen, Heart, Settings, Search, Home, MapPin, Building2, X, ChevronRight, IndianRupee, Loader2, Bookmark } from 'lucide-react';
 import api from '../services/api';
 import { AuthContext } from '../context/AuthContext';
 import MacOSDock from '../components/ui/mac-os-dock';
 import { ThemeSwitch } from '../components/ui/theme-switch-button';
 import { buildStudentDockApps } from '../constants/studentDockConfig';

 
 const parseJSON = (str) => {
   if (!str) return [];
   if (Array.isArray(str)) return str;
   try { return JSON.parse(str); } catch { return []; }
 };
 
 const SectionCard = memo(({ children, className = '' }) => (
   <div className={`rounded-2xl border border-gray-100/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] ${className}`}>
     {children}
   </div>
 ));
 SectionCard.displayName = "SectionCard";
 
 const PGCard = memo(({ pg, onUnsave }) => {
   const images = parseJSON(pg.images);
   const imageUrl = images[0] || '';
 
   return (
     <SectionCard className="overflow-hidden flex flex-col group transition-all hover:shadow-md">
       <div className="relative h-48 sm:h-52 bg-gray-100 overflow-hidden">
         {imageUrl ? (
           <img src={imageUrl} alt={pg.pg_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-gray-400">
             <Building2 size={36} />
           </div>
         )}
         <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#0D3A1D] shadow-sm uppercase tracking-wide">
           {pg.pg_type}
         </div>
         <button 
           onClick={(e) => { e.preventDefault(); onUnsave(pg.id); }}
           className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-sm p-2 rounded-full text-red-500 shadow-sm hover:bg-red-50 transition-colors"
         >
           <X size={16} />
         </button>
       </div>
       <div className="p-5 sm:p-6 flex flex-col flex-1">
         <h3 className="font-black text-xl text-gray-900 mb-1.5 leading-tight truncate">{pg.pg_name}</h3>
         <div className="flex items-center text-gray-500 text-xs sm:text-sm mb-4">
           <MapPin size={14} className="mr-1.5 text-gray-400 shrink-0" />
           <span className="truncate">{pg.area}, {pg.city}</span>
         </div>
         <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-gray-100">
           <div className="flex items-center text-gray-900">
             <IndianRupee size={16} className="mr-0.5 text-gray-800" />
             <span className="font-black text-xl">{pg.price}</span>
             <span className="text-gray-500 text-xs font-bold ml-1">/mo</span>
           </div>
           <Link to={`/pg/${pg.id}`} className="flex items-center text-[#93B733] font-bold text-xs sm:text-sm hover:text-[#7a992a] transition-colors gap-0.5">
             View Details <ChevronRight size={16} />
           </Link>
         </div>
       </div>
     </SectionCard>
   );
 });
 PGCard.displayName = "PGCard";
 
 const SavedPGs = () => {
   const { user } = useContext(AuthContext);
   const navigate = useNavigate();
   const [pgs, setPgs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [showMenu, setShowMenu] = useState(false);
   const menuRef = useRef(null);
   const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
 
   useEffect(() => {
     const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
     document.addEventListener("mousedown", handler);
     return () => document.removeEventListener("mousedown", handler);
   }, []);
 
   useEffect(() => {
     let mounted = true;
     const fetchSavedPGs = async () => {
       try {
         setLoading(true);
         const { data } = await api.get('/pg/saved');
         if (mounted && data.success) {
           setPgs(data.pgs || []);
         }
       } catch (err) {
         if (mounted) setError(err.response?.data?.message || 'Failed to fetch saved PGs');
       } finally {
         if (mounted) setLoading(false);
       }
     };
     fetchSavedPGs();
     return () => { mounted = false; };
   }, []);
 
   const handleUnsave = useCallback(async (pgId) => {
     try {
       setPgs(prev => prev.filter(p => p.id !== pgId));
       await api.post('/pg/save', { pgId });
     } catch {
       const { data } = await api.get('/pg/saved');
       if (data.success) setPgs(data.pgs || []);
     }
   }, []);
 
   const handleDockClick = useCallback((id) => navigate(id), [navigate]);
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-[#f8f9f3] to-[#f0f1eb] pb-28 font-sans selection:bg-[#93B733]/20">
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
              <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(v => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden hover:border-[#93B733] transition-all">
                  <span className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200">{(user?.name || "S").charAt(0).toUpperCase()}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link to="/my-pg" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <Building2 size={16} /> My PG
                    </Link>
                    <Link to="/pgs" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <Search size={16} /> Explore PGs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
 
       <main className="max-w-5xl mx-auto px-4 pt-8 pb-12 space-y-6">
         <SectionCard className="p-6 sm:p-8">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-[#93B733]/10 flex items-center justify-center text-[#93B733] shrink-0">
               <Heart size={26} fill="currentColor" />
             </div>
             <div>
               <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Saved PGs</h1>
               <p className="text-xs sm:text-sm text-gray-500 font-bold">Your bookmarked stays & accommodations</p>
             </div>
             <div className="ml-auto bg-[#93B733] text-white px-4 py-1.5 rounded-full text-sm font-black shadow-sm">
               {pgs.length}
             </div>
           </div>
         </SectionCard>
 
         {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <Loader2 size={36} className="animate-spin mb-4 text-[#93B733]" />
             <p className="font-bold text-sm">Loading saved stays...</p>
           </div>
         ) : error ? (
           <div className="text-center py-12 text-red-500 font-bold text-sm">{error}</div>
         ) : pgs.length === 0 ? (
           <SectionCard className="p-12 sm:p-16 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
               <Bookmark size={36} className="text-gray-300" />
             </div>
             <h3 className="text-xl font-black text-gray-900 mb-2.5">No saved PGs yet</h3>
             <p className="text-gray-500 text-sm mb-6 max-w-sm font-medium">Keep track of your favorite stays by tapping the heart icon on any PG page.</p>
             <Link to="/pgs" className="bg-[#93B733] hover:bg-[#85a62e] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-xs sm:text-sm">
               <Search size={16} /> Explore PGs
             </Link>
           </SectionCard>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             {pgs.map(pg => (
               <PGCard key={pg.id} pg={pg} onUnsave={handleUnsave} />
             ))}
           </div>
         )}
       </main>
 
       {/* ── DOCK ── */}
       <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
         <div className="pointer-events-auto">
           <MacOSDock apps={DOCK_APPS} onAppClick={handleDockClick} openApps={["/saved-pgs"]} />
         </div>
       </div>
     </div>
   );
 };
 
 export default memo(SavedPGs);
 