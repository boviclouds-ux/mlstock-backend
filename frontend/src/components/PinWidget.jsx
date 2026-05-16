import { useState, useEffect, useCallback } from "react";
import { Key, RefreshCw, ChevronDown, Zap } from "lucide-react";
import { DUREES, genPin, dureeToSec, fmtTime } from "../constants/validationsData";

export default function PinWidget() {
  const [pin,        setPin]        = useState(null);
  const [duree,      setDuree]      = useState(DUREES[0]);
  const [customDate, setCustomDate] = useState("");
  const [rem,        setRem]        = useState(0);
  const [copied,     setCopied]     = useState(false);

  const isCustom = duree === "Personnaliser...";

  function computeSec() {
    if (isCustom && customDate) {
      const d = Math.floor((new Date(customDate) - Date.now()) / 1000);
      return d > 0 ? d : 0;
    }
    return dureeToSec(duree);
  }

  const gen = useCallback(() => {
    const s = computeSec();
    if (s <= 0) return;
    setPin(genPin());
    setRem(s);
    setCopied(false);
  }, [duree, customDate]);

  useEffect(() => {
    if (!pin || rem <= 0) return;
    const t = setInterval(() => setRem((r) => {
      if (r <= 1) { clearInterval(t); setPin(null); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [pin]);

  const pct    = pin ? (rem / computeSec()) * 100 : 0;
  const urgent = rem > 0 && rem < 60;

  return (
    <div className="bg-blue-900 border border-blue-800 rounded-xl p-4 flex flex-col gap-3 min-w-[220px]">
      <div className="flex items-center gap-2">
        <div className="bg-blue-800 p-1.5 rounded-lg"><Key size={13} className="text-blue-300" /></div>
        <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">PIN Dérogation</span>
      </div>

      {pin ? (
        <>
          {/* Active PIN */}
          <div className="flex items-center justify-between gap-3">
            <span className={`text-3xl font-mono font-bold tracking-[0.2em] transition-colors ${urgent ? "text-red-300 animate-pulse" : "text-white"}`}>
              {pin}
            </span>
            <button
              onClick={() => { navigator.clipboard?.writeText(pin); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="text-xs text-blue-300 hover:text-white border border-blue-700 hover:border-blue-500 px-2 py-1 rounded-md transition-colors"
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
          {/* Countdown */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-semibold tabular-nums ${urgent ? "text-red-300" : "text-blue-200"}`}>{fmtTime(rem)}</span>
              <span className="text-[10px] text-blue-400">{duree}</span>
            </div>
            <div className="h-1.5 bg-blue-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-400" : pct > 50 ? "bg-emerald-400" : "bg-amber-400"}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={gen} className="flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-200 transition-colors">
            <RefreshCw size={11} /> Régénérer
          </button>
        </>
      ) : (
        <>
          {/* Duration picker */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <select
                value={duree}
                onChange={(e) => { setDuree(e.target.value); setCustomDate(""); }}
                className="w-full appearance-none bg-blue-800 border border-blue-700 text-blue-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {DUREES.map((d) => <option key={d} className="bg-blue-900 text-blue-100">{d}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
            </div>
            {isCustom && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">Valide jusqu'au</label>
                <input
                  type="datetime-local"
                  value={customDate}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-white/10 border border-blue-600 text-blue-50 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 [color-scheme:dark]"
                />
              </div>
            )}
          </div>
          <button
            onClick={gen}
            disabled={isCustom && (!customDate || new Date(customDate) <= new Date())}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
          >
            <Zap size={12} className="text-blue-200" /> Générer PIN
          </button>
        </>
      )}
    </div>
  );
}
