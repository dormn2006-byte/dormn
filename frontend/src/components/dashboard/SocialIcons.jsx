import { Globe } from "lucide-react";

export const InstagramAppIcon = () => (
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/25 transition-transform hover:scale-105">
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
     <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
     <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
     <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
   </svg>
 </div>
);

export const LinkedinAppIcon = () => (
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-lg shadow-blue-600/25 transition-transform hover:scale-105">
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
     <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
     <rect x="2" y="9" width="4" height="12" />
     <circle cx="4" cy="4" r="2" />
   </svg>
 </div>
);

export const GithubAppIcon = () => (
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 border border-gray-700/80 text-white shadow-lg shadow-black/40 transition-transform hover:scale-105">
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
     <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
   </svg>
 </div>
);

export const TwitterAppIcon = () => (
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#000000] border border-gray-800 text-white shadow-lg shadow-black/40 transition-transform hover:scale-105">
   <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
   </svg>
 </div>
);

export const WebsiteAppIcon = () => (
 <div className="flex h-14 w-14 shrink-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 border border-emerald-400/30 text-white shadow-lg shadow-teal-500/25 transition-transform hover:scale-105">
   <div className="flex h-3.5 w-full items-center gap-1 bg-black/20 px-2">
     <div className="h-1.5 w-1.5 rounded-full bg-rose-300" />
     <div className="h-1.5 w-1.5 rounded-full bg-amber-300" />
     <div className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
   </div>
   <div className="flex flex-1 items-center justify-center text-white">
     <Globe size={20} />
   </div>
 </div>
);

