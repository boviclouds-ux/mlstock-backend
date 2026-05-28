import { api } from './api.js';

const DEFAULTS = {
  nomEntreprise: 'Maroc Lait',
  slogan:        'Hub Central National · Agadir',
  piedDePage:    '',
  logoUrl:       '',
};

let _cache = null;

/**
 * Retourne la config de branding (mise en cache après le premier appel).
 * Chaque champ tombe sur DEFAULTS si absent ou vide en base.
 */
export async function getBranding() {
  if (_cache) return _cache;
  try {
    const cfg = await api.get('/api/configuration');
    _cache = {
      nomEntreprise: cfg.nomEntreprise?.trim() || DEFAULTS.nomEntreprise,
      slogan:        cfg.slogan?.trim()        || DEFAULTS.slogan,
      piedDePage:    cfg.piedDePage?.trim()    || DEFAULTS.piedDePage,
      logoUrl:       cfg.logoUrl?.trim()       || '',
    };
  } catch {
    _cache = { ...DEFAULTS };
  }
  return _cache;
}

/** À appeler après chaque sauvegarde admin pour forcer le rechargement. */
export function clearBrandingCache() {
  _cache = null;
}
