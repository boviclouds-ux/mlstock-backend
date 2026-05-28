import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Search, Download, FileText, ChevronUp, ChevronDown,
  ChevronsUpDown, X, CheckSquare,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   DataGridV2 — Composant tableau générique MLstock
   ─────────────────────────────────────────────────────────────
   Props
   ─────
   columns       Array  Définitions des colonnes (voir type ci-dessous)
   data          Array  Tableau d'objets à afficher
   rowKey        string | fn  Clé unique par ligne  (défaut : id → _id → index)
   title         string  Libellé affiché dans le header PDF/Excel
   exportFilename string  Nom du fichier exporté sans extension
   emptyMessage  string  Message affiché quand aucun résultat
   loading       bool   Affiche un skeleton de chargement
   actions       ReactNode  Boutons supplémentaires dans la barre d'actions
   className     string  Classe CSS additionnelle sur le conteneur

   Type Column
   ────────────
   key           string   Propriété lue dans chaque ligne de data
   label         string   En-tête de colonne
   render        fn       (value, row, idx) → ReactNode  — affichage personnalisé
   exportValue   fn       (row) → string  — valeur texte brute pour l'export
                          (si absent : String(row[key]))
   sortable      bool     Colonne triable (défaut : false)
   align         string   'left' | 'center' | 'right'  (défaut : 'left')
   className     string   Classes Tailwind supplémentaires sur chaque cellule
═══════════════════════════════════════════════════════════════ */

/* ── Squelette de chargement ── */
function SkeletonRows({ cols, rows = 6 }) {
  return Array.from({ length: rows }).map((_, ri) => (
    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
      <td className="px-3 py-3">
        <div className="w-4 h-4 rounded bg-gray-200 animate-pulse mx-auto" />
      </td>
      {cols.map((_, ci) => (
        <td key={ci} className="px-4 py-3">
          <div className="h-3.5 rounded-full bg-gray-200 animate-pulse" style={{ width: `${55 + ((ri * 3 + ci * 7) % 35)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

/* ── Icône de tri ── */
function SortIcon({ col, sortKey, sortDir }) {
  if (!col.sortable) return null;
  if (sortKey !== col.key) return <ChevronsUpDown size={12} className="text-gray-300 shrink-0" />;
  return sortDir === 'asc'
    ? <ChevronUp  size={12} className="text-blue-500 shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 shrink-0" />;
}

/* ── Export CSV (compatible Excel FR — séparateur point-virgule + BOM UTF-8) ── */
function buildCSV(columns, rows, totalRow) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.map(c => escape(c.label)).join(';');
  const body   = rows.map(row =>
    columns.map(col => escape(
      col.exportValue ? col.exportValue(row) : (row[col.key] ?? '')
    )).join(';')
  ).join('\r\n');
  let result = '﻿' + header + '\r\n' + body;
  if (totalRow) {
    const cells = columns.map((col, i) =>
      escape(i === 0 ? (totalRow._label ?? 'TOTAL GLOBAL') : String(totalRow[col.key] ?? ''))
    ).join(';');
    result += '\r\n' + cells;
  }
  return result;
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Export PDF via impression navigateur ── */
function printPDF(title, columns, rows, totalRow) {
  const escape = v => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const headHtml = columns.map(c =>
    `<th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;
      letter-spacing:.05em;color:#64748b;border-bottom:2px solid #e2e8f0;
      background:#f8fafc;white-space:nowrap;">${escape(c.label)}</th>`
  ).join('');

  const bodyHtml = rows.map((row, ri) => {
    const bg = ri % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cells = columns.map(col => {
      const v = col.exportValue ? col.exportValue(row) : (row[col.key] ?? '');
      return `<td style="padding:7px 12px;font-size:11px;color:#1e293b;
        border-bottom:1px solid #f1f5f9;">${escape(v)}</td>`;
    }).join('');
    return `<tr style="background:${bg};">${cells}</tr>`;
  }).join('');

  const totalRowHtml = totalRow ? (() => {
    const al = a => a === 'right' ? 'right' : a === 'center' ? 'center' : 'left';
    const cells = columns.map((col, i) => {
      const v = i === 0 ? escape(totalRow._label ?? 'TOTAL GLOBAL') : escape(String(totalRow[col.key] ?? ''));
      return `<td style="padding:9px 12px;font-size:11px;font-weight:700;color:#1e293b;border-top:2px solid #3b82f6;background:#eff6ff;text-align:${al(col.align)};">${v}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  })() : '';

  const now = new Date().toLocaleDateString('fr-FR', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>${escape(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:24px 28px;margin:0;color:#1e293b}
  .header{display:flex;justify-content:space-between;align-items:flex-start;
    border-bottom:3px solid #3b82f6;padding-bottom:14px;margin-bottom:20px}
  .logo{font-size:20px;font-weight:900;color:#3b82f6;letter-spacing:-.5px}
  .meta{font-size:10px;color:#94a3b8;text-align:right;line-height:1.6}
  table{width:100%;border-collapse:collapse;font-size:11px}
  tfoot td{padding:10px 12px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0}
  @media print{body{padding:12px 16px}@page{margin:.8cm}}
</style>
</head><body>
<div class="header">
  <div class="logo">MLstock</div>
  <div class="meta">
    <strong>${escape(title)}</strong><br>
    ${rows.length} ligne${rows.length > 1 ? 's' : ''} exportée${rows.length > 1 ? 's' : ''}<br>
    ${now}
  </div>
</div>
<table>
  <thead><tr>${headHtml}</tr></thead>
  <tbody>${bodyHtml}${totalRowHtml}</tbody>
  <tfoot><tr><td colspan="${columns.length}">MLstock — Export généré le ${now}</td></tr></tfoot>
</table>
</body></html>`;

  const win = window.open('', '_blank', 'width=960,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

/* ═══════════════════════════════════════════════════════════════
   Composant principal
═══════════════════════════════════════════════════════════════ */
export default function DataGridV2({
  columns      = [],
  data         = [],
  rowKey,
  title        = 'Export',
  exportFilename = 'export',
  emptyMessage = 'Aucune donnée à afficher.',
  loading      = false,
  actions,
  totalRow,
  className    = '',
}) {
  const [search,  setSearch]  = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState('asc');
  const searchRef = useRef(null);

  /* ── Clé stable par ligne ── */
  const getKey = useCallback((row, idx) => {
    if (typeof rowKey === 'function') return String(rowKey(row));
    if (typeof rowKey === 'string')   return String(row[rowKey] ?? idx);
    return String(row.id ?? row._id ?? idx);
  }, [rowKey]);

  /* ── Recherche textuelle globale ── */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(row =>
      columns.some(col => {
        const v = col.exportValue
          ? col.exportValue(row)
          : String(row[col.key] ?? '');
        return v.toLowerCase().includes(term);
      })
    );
  }, [data, search, columns]);

  /* ── Tri ── */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find(c => c.key === sortKey);
    return [...filtered].sort((a, b) => {
      const va = col?.exportValue ? col.exportValue(a) : String(a[sortKey] ?? '');
      const vb = col?.exportValue ? col.exportValue(b) : String(b[sortKey] ?? '');
      const cmp = va.localeCompare(vb, 'fr', { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  /* ── Sélection ── */
  const allKeys     = sorted.map((row, idx) => getKey(row, idx));
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected.has(k));
  const indeterminate = !allSelected && allKeys.some(k => selected.has(k));
  const selectedCount = allKeys.filter(k => selected.has(k)).length;

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); allKeys.forEach(k => n.delete(k)); return n; });
    } else {
      setSelected(prev => new Set([...prev, ...allKeys]));
    }
  }

  function toggleRow(key) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  /* ── Tri colonne ── */
  function handleSort(key) {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  /* ── Lignes à exporter ── */
  function getExportRows() {
    const exportKeys = new Set(allKeys.filter(k => selected.has(k)));
    if (exportKeys.size > 0) {
      return sorted.filter((row, idx) => exportKeys.has(getKey(row, idx)));
    }
    return sorted;
  }

  /* ── Alignement ── */
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  /* ═══════════════════ JSX ═══════════════════ */
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ${className}`}>

      {/* ── Barre d'actions ── */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">

        {/* Recherche */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Recherche…"
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300
              placeholder:text-gray-300 bg-gray-50 transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Compteur résultats / sélection */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap select-none">
          {selectedCount > 0 ? (
            <>
              <CheckSquare size={12} className="text-blue-500" />
              <span className="font-semibold text-blue-600">{selectedCount}</span>
              <span>sélectionné{selectedCount > 1 ? 's' : ''}</span>
              <button onClick={clearSelection}
                className="ml-1 text-[10px] text-gray-400 hover:text-red-500 underline transition-colors">
                Effacer
              </button>
            </>
          ) : (
            <span>{sorted.length} ligne{sorted.length > 1 ? 's' : ''}{search ? ` (sur ${data.length})` : ''}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          {/* Bouton Export Excel */}
          <button
            onClick={() => downloadCSV(exportFilename, buildCSV(columns, getExportRows(), totalRow))}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
              bg-emerald-50 border border-emerald-200 text-emerald-700
              hover:bg-emerald-100 hover:border-emerald-300 transition-colors whitespace-nowrap">
            <Download size={12} />
            Excel{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>

          {/* Bouton Export PDF */}
          <button
            onClick={() => printPDF(title, columns, getExportRows(), totalRow)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
              bg-blue-50 border border-blue-200 text-blue-700
              hover:bg-blue-100 hover:border-blue-300 transition-colors whitespace-nowrap">
            <FileText size={12} />
            PDF{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>

          {/* Slot pour actions supplémentaires (boutons métier) */}
          {actions && <>{actions}</>}
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {/* Colonne checkbox */}
              <th className="w-10 px-3 py-3 text-center shrink-0">
                <button
                  onClick={toggleAll}
                  className={`inline-flex items-center justify-center w-4 h-4 rounded
                    border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400
                    focus:ring-offset-1
                    ${allSelected
                      ? 'bg-blue-600 border-blue-600'
                      : indeterminate
                      ? 'bg-blue-100 border-blue-400'
                      : 'bg-white border-gray-300 hover:border-blue-400'}`}>
                  {allSelected && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2 text-white stroke-white stroke-2">
                      <polyline points="1 4 4 7 9 1" />
                    </svg>
                  )}
                  {indeterminate && !allSelected && (
                    <span className="block w-2 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              </th>

              {/* Colonnes de données */}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide
                    whitespace-nowrap select-none
                    ${alignClass[col.align ?? 'left']}
                    ${col.sortable ? 'cursor-pointer hover:text-gray-600 hover:bg-gray-100/60 transition-colors' : ''}
                    ${col.className ?? ''}`}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <SkeletonRows cols={columns} rows={7} />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-14">
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <Search size={28} strokeWidth={1.5} />
                    <p className="text-sm text-gray-400">{emptyMessage}</p>
                    {search && (
                      <button onClick={() => setSearch('')}
                        className="text-xs text-blue-500 hover:underline mt-1">
                        Effacer la recherche
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => {
                const key       = getKey(row, idx);
                const isChecked = selected.has(key);
                return (
                  <tr
                    key={key}
                    onClick={() => toggleRow(key)}
                    className={`cursor-pointer transition-colors
                      ${isChecked
                        ? 'bg-blue-50/70 hover:bg-blue-100/60'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-gray-50/80'
                        : 'bg-gray-50/50 hover:bg-gray-100/60'}`}>

                    {/* Cellule checkbox */}
                    <td className="px-3 py-3 text-center" onClick={e => { e.stopPropagation(); toggleRow(key); }}>
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded
                        border-2 transition-all shrink-0
                        ${isChecked
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-blue-400'}`}>
                        {isChecked && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2 stroke-white stroke-2">
                            <polyline points="1 4 4 7 9 1" />
                          </svg>
                        )}
                      </span>
                    </td>

                    {/* Cellules de données */}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-xs text-gray-700
                          ${alignClass[col.align ?? 'left']}
                          ${col.className ?? ''}`}>
                        {col.render
                          ? col.render(row[col.key], row, idx)
                          : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {totalRow && !loading && sorted.length > 0 && (
            <tfoot>
              <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                <td className="px-3 py-3" />
                {columns.map((col, i) => (
                  <td key={col.key}
                    className={`px-4 py-3 text-xs font-bold text-indigo-800 ${alignClass[col.align ?? 'left']} ${col.className ?? ''}`}>
                    {i === 0
                      ? (totalRow._label ?? 'TOTAL GLOBAL')
                      : (totalRow[col.key] !== undefined ? String(totalRow[col.key]) : '')}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pied de tableau ── */}
      {!loading && sorted.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-[10px] text-gray-400">
          <span>
            {sorted.length} ligne{sorted.length > 1 ? 's' : ''}
            {search ? ` filtrée${sorted.length > 1 ? 's' : ''} sur ${data.length}` : ' au total'}
            {selectedCount > 0 ? ` · ${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}` : ''}
          </span>
          {selectedCount > 0 && (
            <button onClick={clearSelection}
              className="text-[10px] text-blue-500 hover:underline transition-colors">
              Tout désélectionner
            </button>
          )}
        </div>
      )}
    </div>
  );
}
