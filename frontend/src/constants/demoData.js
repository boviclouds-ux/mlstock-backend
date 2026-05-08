import { Package, Settings, Truck, Home, BarChart3, ShieldCheck } from "lucide-react";

export const DEMO_USERS = {
  magasinier: {
    nom: "Karim Benali",
    email: "k.benali@marocl.ma",
    role: "Magasinier Central",
    unite: "Stock Central · Agadir",
    initiales: "KB",
    couleur: "bg-blue-600",
    mfa: false,
  },
  cooperative: {
    nom: "Fatima Zahra El Alami",
    email: "f.zahra@sah.ma",
    role: "Responsable Coopérative",
    unite: "Coopérative Sakia Al Hamra",
    initiales: "FZ",
    couleur: "bg-emerald-600",
    mfa: false,
  },
  admin: {
    nom: "Hassan El Fassi",
    email: "h.elfassi@marocl.ma",
    role: "Admin Fédéral",
    unite: "Direction · Siège Rabat",
    initiales: "HF",
    couleur: "bg-violet-600",
    mfa: true,
  },
};

export const ROLE_NAV = {
  magasinier: [
    { id: "quai", label: "Quai d'arrivée", icon: Package },
    { id: "chambre", label: "Chambre Froide", icon: Settings },
    { id: "expeditions", label: "Expéditions", icon: Truck },
  ],
  cooperative: [
    { id: "portail", label: "Mon Portail", icon: Home },
    { id: "receptions", label: "Réceptions", icon: Package },
    { id: "commandes", label: "Mes Commandes", icon: BarChart3 },
  ],
  admin: [
    { id: "dashboard", label: "Vue Nationale", icon: Home },
    { id: "quotas", label: "Quotas & Subv.", icon: BarChart3 },
    { id: "validations", label: "Validations", icon: ShieldCheck },
    { id: "tracabilite", label: "Traçabilité", icon: BarChart3 },
    { id: "config", label: "Configuration", icon: Settings },
  ],
};

/** Shared Tailwind class for auth input fields */
export const inp =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
