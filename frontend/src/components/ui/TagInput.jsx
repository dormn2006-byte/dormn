import { useState, useCallback, memo } from "react";
import { X } from "lucide-react";
import CustomSelect from "./CustomSelect";
const INPUT_STYLE = "w-full bg-white rounded-xl border border-gray-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0D3A1D] outline-none focus:border-[#93B733] hover:border-[#93B733]/30 transition-all";

const TagInput = memo(({ tags, onChange, placeholder, options = [], color = "#93B733" }) => {
  const [v, setV] = useState("");
  const add = useCallback(() => { const t = v.trim(); if (t && !tags.includes(t)) { onChange([...tags, t]); setV(""); } }, [v, tags, onChange]);
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold animate-[fadeIn_0.15s_ease-out_forwards]" style={{ background: `${color}12`, color }}>
            {t}<button onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-55 hover:opacity-100"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <CustomSelect
          options={options}
          value=""
          onChange={val => { if (val && !tags.includes(val)) onChange([...tags, val]); }}
          placeholder="Select preset..."
        />
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className={INPUT_STYLE + " !py-2"} />
      </div>
    </div>
  );
});
TagInput.displayName = "TagInput";

export default TagInput;
