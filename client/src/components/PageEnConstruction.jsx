import { Hammer } from 'lucide-react';

export default function PageEnConstruction() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <Hammer size={32} className="text-amber-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Section en construction</h2>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        Cette fonctionnalité arrive bientôt. Notre équipe travaille à vous offrir la meilleure expérience possible.
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Bientôt disponible
      </span>
    </div>
  );
}
