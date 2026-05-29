import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, ChevronRight, X, Camera, MessageSquare,
  AlertTriangle, CheckCircle2, Square, RefreshCw, MapPin,
} from 'lucide-react';

const token = () => localStorage.getItem('mlstock_token');

const CHECKLIST_ITEMS = [
  'Articles réceptionnés conformément au BL',
  'Scellés intacts et numéros vérifiés',
  'Documents de transport conformes',
  'État général de la livraison satisfaisant',
];

function StatutBadge({ statut }) {
  if (statut === 'En_transit') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
        En transit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-400 border-slate-200">
      {statut}
    </span>
  );
}

export default function ResponsableRegional() {
  const [ordres,       setOrdres]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [checklist,    setChecklist]    = useState({});
  const [commentaire,  setCommentaire]  = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);
  const [successMsg,   setSuccessMsg]   = useState('');

  /* ── Chargement des ordres En_transit ──────────────────── */
  const fetchOrdres = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/transactions?statut=En_transit', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement.`);
      const data = await res.json();
      setOrdres(Array.isArray(data) ? data : (data.data ?? []));
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrdres(); }, [fetchOrdres]);

  /* ── Gestion modale ────────────────────────────────────── */
  function openModal(ordre) {
    setSelected(ordre);
    setChecklist({});
    setCommentaire('');
    setPhotoPreview(null);
    setSubmitError(null);
    setSuccessMsg('');
  }

  function closeModal() {
    if (submitting) return;
    setSelected(null);
    setPhotoPreview(null);
  }

  function toggleCheck(item) {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  const allChecked  = CHECKLIST_ITEMS.every(item => checklist[item]);
  const isConforme  = allChecked;

  /* ── Validation finale ─────────────────────────────────── */
  async function handleValider() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/ordres/${selected._id}/reception-regionale`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token()}`,
        },
        body: JSON.stringify({ conformite: isConforme, commentaire }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la validation.');
      setSuccessMsg(`Ordre ${selected.reference} validé — statut : Expédié.`);
      setTimeout(() => {
        closeModal();
        fetchOrdres();
      }, 1600);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Rendu principal ───────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Réceptions Régionales</h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Ordres <span className="font-semibold text-amber-600">En transit</span> en attente de votre validation
          </p>
        </div>
        <button
          onClick={fetchOrdres}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Erreur de chargement */}
      {fetchError && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-100">
          {fetchError}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Chargement des ordres…</div>
      ) : ordres.length === 0 && !fetchError ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center">
          <Truck size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-semibold">Aucun ordre en transit</p>
          <p className="text-slate-400 text-sm mt-1">Les expéditions validées apparaîtront ici dès leur départ.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordres.map(ordre => (
            <div
              key={ordre._id}
              onClick={() => openModal(ordre)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer
                         hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                    <Truck size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{ordre.reference}</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      <MapPin size={10} className="inline mr-0.5" />
                      {ordre.uniteCible?.nom ?? '—'} · {ordre.lignes?.length ?? 0} article(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatutBadge statut={ordre.statut} />
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>

              {(ordre.transporteur?.societe || ordre.blReference) && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-300">
                  {ordre.transporteur?.societe && (
                    <span className="flex items-center gap-1">
                      <Truck size={10} className="text-slate-400" />
                      {ordre.transporteur.societe}
                      {ordre.transporteur.matricule ? ` · ${ordre.transporteur.matricule}` : ''}
                    </span>
                  )}
                  {ordre.blReference && (
                    <span className="flex items-center gap-1">
                      <Package size={10} className="text-slate-400" />
                      BL : {ordre.blReference}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════ MODALE ══════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

            {/* Header modale */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Validation de Réception</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selected.reference}</p>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps modale (scrollable) */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Succès */}
              {successMsg && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold border border-emerald-100">
                  <CheckCircle2 size={16} />
                  {successMsg}
                </div>
              )}

              {/* Erreur de soumission */}
              {submitError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-100">
                  <AlertTriangle size={16} />
                  {submitError}
                </div>
              )}

              {/* Récap ordre */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm">
                {[
                  ['Destinataire',  selected.uniteCible?.nom ?? '—'],
                  ['Transporteur',  selected.transporteur?.societe ?? '—'],
                  ['Matricule',     selected.transporteur?.matricule || '—'],
                  ['Réf. BL',       selected.blReference ?? '—'],
                  ['Nb articles',   `${selected.lignes?.length ?? 0} ligne(s)`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-300">{label}</span>
                    <span className="font-semibold text-slate-800 text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Checklist de conformité</p>
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleCheck(item)}
                      disabled={!!successMsg}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all text-sm font-medium disabled:opacity-50 ${
                        checklist[item]
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {checklist[item]
                        ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        : <Square       size={16} className="text-slate-400 shrink-0" />
                      }
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo (démo-safe : prévisualisation locale uniquement) */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Photo de la livraison</p>
                <label className={`cursor-pointer block ${successMsg ? 'pointer-events-none opacity-50' : ''}`}>
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={photoPreview}
                        alt="Aperçu livraison"
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">
                          Changer la photo
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                      <Camera size={20} className="text-slate-400 mb-1" />
                      <p className="text-xs text-slate-400">Ajouter une photo <span className="text-slate-300">(optionnel)</span></p>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                </label>
              </div>

              {/* Commentaire */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
                  <MessageSquare size={14} /> Commentaire
                </label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  disabled={!!successMsg}
                  placeholder="Observations, réserves, remarques…"
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>

              {/* Indicateur de conformité */}
              {!successMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
                  isConforme
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isConforme
                    ? <><CheckCircle2 size={15} /> Réception conforme — tous les points validés</>
                    : <><AlertTriangle size={15} /> Réception non conforme — checklist incomplète</>
                  }
                </div>
              )}
            </div>

            {/* Footer modale */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-400
                           hover:bg-slate-50 disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleValider}
                disabled={submitting || !!successMsg}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold
                           hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-colors"
              >
                {submitting
                  ? <><RefreshCw size={14} className="animate-spin" /> Validation…</>
                  : <><CheckCircle2 size={15} /> Valider la réception</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
