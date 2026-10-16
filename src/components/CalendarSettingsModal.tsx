'use client';

import React, { useState } from 'react';
import { 
  updateCalendar, 
  addZone, updateZone, deleteZone, 
  addCallTarget, updateCallTarget, deleteCallTarget, 
  addGlobalPermit, updateGlobalPermit, deleteGlobalPermit,
  addPermitCoordination, updatePermitCoordination, deletePermitCoordination,
  addPermitExclusion, removePermitExclusion,
  addMultiplePermitExclusions, parseExclusionsWithAI 
} from '@/app/actions';
import styles from './CalendarSettingsModal.module.css';

type PermitExclusion = {
  id: number;
  startDate: Date | string;
  endDate: Date | string | null;
  ruleType: string;
  timeWindowsJson: string | null;
  reason: string | null;
};

type PermitCoordination = {
  id: number;
  startDate: Date | string | null;
  expirationDate: Date | string;
  warningDays: number;
  exclusions?: PermitExclusion[];
};

type GlobalPermit = {
  id: number;
  name: string;
  coordinations?: PermitCoordination[];
};

type CallTarget = {
  id: number;
  name: string;
  requiresOpening: boolean;
  requiresClosing: boolean;
  contactNotes?: string | null;
};

type Zone = {
  id: number;
  name: string;
};

type Calendar = {
  id: number;
  title: string;
  requiresDailyCoordination: boolean;
  zones: Zone[];
  callTargets?: CallTarget[];
  globalPermits?: GlobalPermit[];
  lat?: number | null;
  lng?: number | null;
};

type TabType = 'general' | 'zones' | 'permits' | 'calls';

export default function CalendarSettingsModal({
  calendar,
  onClose,
  onUpdated
}: {
  calendar: Calendar;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  
  // -- General Tab State --
  const [calendarTitle, setCalendarTitle] = useState(calendar.title);
  const [calendarLat, setCalendarLat] = useState(calendar.lat !== null && calendar.lat !== undefined ? String(calendar.lat) : '');
  const [calendarLng, setCalendarLng] = useState(calendar.lng !== null && calendar.lng !== undefined ? String(calendar.lng) : '');
  
  // -- Zones Tab State --
  const [newZoneName, setNewZoneName] = useState('');
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingZoneName, setEditingZoneName] = useState('');

  // -- Permits Tab State --
  const [showPermitsInfo, setShowPermitsInfo] = useState(false);
  const [newPermitName, setNewPermitName] = useState('');
  const [newPermitStartDate, setNewPermitStartDate] = useState('');
  const [newPermitDate, setNewPermitDate] = useState('');
  const [newPermitWarningDays, setNewPermitWarningDays] = useState(30);

  const [editingPermitId, setEditingPermitId] = useState<number | null>(null);
  const [editingPermitName, setEditingPermitName] = useState('');
  const [editingPermitDate, setEditingPermitDate] = useState('');
  const [editingPermitWarningDays, setEditingPermitWarningDays] = useState(30);

  const [newExclusionIsRange, setNewExclusionIsRange] = useState(false);
  const [newExclusionStartDate, setNewExclusionStartDate] = useState('');
  const [newExclusionEndDate, setNewExclusionEndDate] = useState('');
  const [newExclusionRuleType, setNewExclusionRuleType] = useState('DENY_ALL'); // DENY_ALL, ALLOW_WINDOWS, DENY_WINDOWS
  const [newExclusionTimeWindows, setNewExclusionTimeWindows] = useState<{start: string, end: string}[]>([{start: '', end: ''}]);
  const [newExclusionReason, setNewExclusionReason] = useState('');

  // -- AI Exclusions Import State --
  const [aiModalCoordId, setAiModalCoordId] = useState<number | null>(null);
  const [aiRawText, setAiRawText] = useState('');
  const [aiDefaultReason, setAiDefaultReason] = useState('MILNOF-1793');
  const [aiGroupConsecutive, setAiGroupConsecutive] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiExtractedCoordination, setAiExtractedCoordination] = useState<{ startDate?: string | null; expirationDate?: string | null } | null>(null);
  const [aiRawItems, setAiRawItems] = useState<any[]>([]);
  const [aiPreviewItems, setAiPreviewItems] = useState<{
    selected: boolean;
    startDate: string;
    endDate: string | null;
    ruleType: string;
    timeWindows: { start: string; end: string }[] | null;
    reason: string;
  }[]>([]);

  // -- Coordination / Calls Tab State --
  const [requiresDaily, setRequiresDaily] = useState(calendar.requiresDailyCoordination);
  const [newTargetName, setNewTargetName] = useState('');
  const [targetReqOpening, setTargetReqOpening] = useState(true);
  const [targetReqClosing, setTargetReqClosing] = useState(true);
  const [targetNotes, setTargetNotes] = useState('');
  
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [editingTargetName, setEditingTargetName] = useState('');
  const [editingTargetReqOpening, setEditingTargetReqOpening] = useState(true);
  const [editingTargetReqClosing, setEditingTargetReqClosing] = useState(true);
  const [editingTargetNotes, setEditingTargetNotes] = useState('');

  // -- Location Search State --
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{lat: string, lon: string, display_name: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      alert('Error buscando ubicación');
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (lat: string, lon: string) => {
    setCalendarLat(lat);
    setCalendarLng(lon);
    setSearchResults([]);
    setSearchQuery('');
  };

  // --- ACTIONS ---

  // General Actions
  const handleSaveGeneral = async () => {
    if (!calendarTitle.trim()) return;
    setLoading(true);
    try {
      const latVal = calendarLat.trim() ? parseFloat(calendarLat) : null;
      const lngVal = calendarLng.trim() ? parseFloat(calendarLng) : null;
      await updateCalendar(calendar.id, { 
        title: calendarTitle.trim(),
        lat: latVal,
        lng: lngVal
      });
      onUpdated();
      alert('Ajustes generales actualizados correctamente.');
    } catch (error) {
      console.error(error);
      alert('Error al actualizar los ajustes generales');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoordinationSetting = async (checked: boolean) => {
    setRequiresDaily(checked);
    setLoading(true);
    try {
      await updateCalendar(calendar.id, { requiresDailyCoordination: checked });
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al guardar ajustes de coordinación');
      setRequiresDaily(!checked); // revert
    } finally {
      setLoading(false);
    }
  };

  // Zones Actions
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    setLoading(true);
    try {
      await addZone(calendar.id, newZoneName.trim());
      setNewZoneName('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir la zona');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditZone = async (id: number) => {
    if (!editingZoneName.trim()) return;
    setLoading(true);
    try {
      await updateZone(id, { name: editingZoneName.trim() });
      setEditingZoneId(null);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la zona');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id: number, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar la zona "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteZone(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la zona');
    } finally {
      setLoading(false);
    }
  };

  // Permits Actions
  const handleAddPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermitName.trim()) return;
    setLoading(true);
    try {
      await addGlobalPermit(calendar.id, newPermitName.trim());
      setNewPermitName('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir la restricción');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditPermit = async (id: number) => {
    if (!editingPermitName.trim()) return;
    setLoading(true);
    try {
      await updateGlobalPermit(id, editingPermitName.trim());
      setEditingPermitId(null);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar la restricción');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoordination = async (permitId: number) => {
    if (!newPermitDate) return;
    setLoading(true);
    try {
      const startD = newPermitStartDate ? new Date(newPermitStartDate) : null;
      await addPermitCoordination(permitId, startD, new Date(newPermitDate), newPermitWarningDays);
      setNewPermitStartDate('');
      setNewPermitDate('');
      setNewPermitWarningDays(30);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir la coordinación');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoordination = async (id: number) => {
    if (!confirm('¿Eliminar esta coordinación?')) return;
    setLoading(true);
    try {
      await deletePermitCoordination(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la coordinación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoordination = (coord: any) => {
    if (coord.startDate) {
      setNewPermitStartDate(new Date(coord.startDate).toISOString().substring(0, 10));
    } else {
      setNewPermitStartDate('');
    }
    setNewPermitDate(new Date(coord.expirationDate).toISOString().substring(0, 10));
    setNewPermitWarningDays(coord.warningDays);
  };

  const handleAddExclusion = async (permitId: number) => {
    if (!newExclusionStartDate) return;
    setLoading(true);
    try {
      const endD = newExclusionIsRange && newExclusionEndDate ? new Date(newExclusionEndDate) : null;
      const validWindows = newExclusionTimeWindows.filter(w => w.start && w.end);
      const twJson = newExclusionRuleType !== 'DENY_ALL' && validWindows.length > 0 ? JSON.stringify(validWindows) : null;
      
      await addPermitExclusion(permitId, new Date(newExclusionStartDate), endD, newExclusionRuleType, twJson, newExclusionReason.trim() || null);
      
      setNewExclusionStartDate('');
      setNewExclusionEndDate('');
      setNewExclusionRuleType('DENY_ALL');
      setNewExclusionTimeWindows([{start: '', end: ''}]);
      setNewExclusionReason('');
      setNewExclusionIsRange(false);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir la exclusión de fecha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExclusion = async (exclusionId: number) => {
    setLoading(true);
    try {
      await removePermitExclusion(exclusionId);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar exclusión');
    } finally {
      setLoading(false);
    }
  };

  // --- AI EXCLUSIONS IMPORT HANDLERS ---
  const processItemsWithGrouping = (items: any[], group: boolean, defaultReasonVal: string) => {
    if (!items || items.length === 0) return [];
    if (!group) {
      return items.map(it => ({
        selected: true,
        startDate: it.startDate,
        endDate: it.endDate || null,
        ruleType: it.ruleType || 'DENY_ALL',
        timeWindows: it.timeWindows || null,
        reason: it.reason || defaultReasonVal || 'MILNOF'
      }));
    }

    const sorted = [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const grouped: {
      selected: boolean;
      startDate: string;
      endDate: string | null;
      ruleType: string;
      timeWindows: { start: string; end: string }[] | null;
      reason: string;
    }[] = [];
    
    let current = {
      selected: true,
      startDate: sorted[0].startDate,
      endDate: sorted[0].endDate || null,
      ruleType: sorted[0].ruleType || 'DENY_ALL',
      timeWindows: sorted[0].timeWindows || null,
      reason: sorted[0].reason || defaultReasonVal || 'MILNOF'
    };

    for (let i = 1; i < sorted.length; i++) {
      const next = {
        selected: true,
        startDate: sorted[i].startDate,
        endDate: sorted[i].endDate || null,
        ruleType: sorted[i].ruleType || 'DENY_ALL',
        timeWindows: sorted[i].timeWindows || null,
        reason: sorted[i].reason || defaultReasonVal || 'MILNOF'
      };

      const sameRule = current.ruleType === next.ruleType;
      const sameReason = (current.reason || '') === (next.reason || '');
      const sameWindows = JSON.stringify(current.timeWindows || []) === JSON.stringify(next.timeWindows || []);

      const curEnd = new Date(current.endDate || current.startDate);
      const nxtStart = new Date(next.startDate);
      const diffDays = Math.round((nxtStart.getTime() - curEnd.getTime()) / (1000 * 60 * 60 * 24));

      if (sameRule && sameReason && sameWindows && diffDays === 1) {
        current.endDate = next.endDate || next.startDate;
      } else {
        grouped.push(current);
        current = next;
      }
    }
    grouped.push(current);
    return grouped;
  };

  const handleOpenAiModal = (coordId: number) => {
    setAiModalCoordId(coordId);
    setAiRawText('');
    setAiExtractedCoordination(null);
    setAiRawItems([]);
    setAiPreviewItems([]);
  };

  const handleAnalyzeAiText = async () => {
    if (!aiRawText.trim()) return;
    setIsAiAnalyzing(true);
    try {
      const res = await parseExclusionsWithAI(aiRawText.trim(), aiDefaultReason.trim() || 'MILNOF');
      if (res.error) {
        alert('Error devuelto por la IA: ' + res.error);
        return;
      }

      const rawExclusions = res.exclusions || [];
      if (rawExclusions.length === 0) {
        alert('La IA no ha detectado ninguna fecha con exclusión o reparo en el texto facilitado.');
      }
      setAiRawItems(rawExclusions);
      setAiExtractedCoordination(res.coordination || null);

      const processed = processItemsWithGrouping(rawExclusions, aiGroupConsecutive, aiDefaultReason.trim() || 'MILNOF');
      setAiPreviewItems(processed);
    } catch (err: any) {
      console.error(err);
      alert('Error al analizar texto con IA: ' + (err.message || 'Error de conexión'));
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleToggleGroupOption = (group: boolean) => {
    setAiGroupConsecutive(group);
    if (aiRawItems.length > 0) {
      setAiPreviewItems(processItemsWithGrouping(aiRawItems, group, aiDefaultReason.trim() || 'MILNOF'));
    }
  };

  const handleToggleSelectAll = (select: boolean) => {
    setAiPreviewItems(prev => prev.map(it => ({ ...it, selected: select })));
  };

  const handleToggleSelectItem = (idx: number) => {
    setAiPreviewItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const handleDeletePreviewItem = (idx: number) => {
    setAiPreviewItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAiExclusions = async () => {
    if (!aiModalCoordId) return;
    const selected = aiPreviewItems.filter(it => it.selected);
    if (selected.length === 0) {
      alert('Debes seleccionar al menos una exclusión para guardar.');
      return;
    }

    setLoading(true);
    try {
      const bulkData = selected.map(it => ({
        startDate: it.startDate,
        endDate: it.endDate || null,
        ruleType: it.ruleType,
        timeWindowsJson: it.timeWindows && it.timeWindows.length > 0 ? JSON.stringify(it.timeWindows) : null,
        reason: it.reason
      }));

      await addMultiplePermitExclusions(aiModalCoordId, bulkData);
      setAiModalCoordId(null);
      onUpdated();
    } catch (err: any) {
      console.error(err);
      alert('Error al guardar exclusiones: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermit = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este permiso?')) return;
    setLoading(true);
    try {
      await deleteGlobalPermit(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el permiso');
    } finally {
      setLoading(false);
    }
  };

  // Calls Actions
  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName.trim()) return;
    setLoading(true);
    try {
      await addCallTarget(calendar.id, newTargetName.trim(), targetReqOpening, targetReqClosing, targetNotes.trim() || null);
      setNewTargetName('');
      setTargetReqOpening(true);
      setTargetReqClosing(true);
      setTargetNotes('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir el sitio');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditTarget = async (id: number) => {
    if (!editingTargetName.trim()) return;
    setLoading(true);
    try {
      await updateCallTarget(id, { 
        name: editingTargetName.trim(),
        requiresOpening: editingTargetReqOpening,
        requiresClosing: editingTargetReqClosing,
        contactNotes: editingTargetNotes.trim() || null
      });
      setEditingTargetId(null);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el sitio de llamada');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarget = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este sitio de llamada?')) return;
    setLoading(true);
    try {
      await deleteCallTarget(id);
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el sitio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Ajustes de {calendar.title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'general' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('general')}
            >
              🛠️ General
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'zones' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('zones')}
            >
              🏔️ Zonas de Vuelo
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'permits' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('permits')}
            >
              📄 Permisos Globales
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'calls' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('calls')}
            >
              ☎️ Llamadas Diarias
            </button>
          </div>

          <div className={styles.tabContent}>
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
              <div className={styles.section}>
                <h3>Nombre del Calendario</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <input 
                    type="text"
                    value={calendarTitle}
                    onChange={(e) => setCalendarTitle(e.target.value)}
                    className={styles.input}
                    placeholder="Ej. Octubre 2026..."
                    style={{ flex: 1 }}
                  />
                </div>

                <h3>Ubicación Geográfica (Clima)</h3>
                <p className={styles.helpText}>Busca una ciudad o lugar para autocompletar las coordenadas. También puedes editarlas manualmente.</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar ciudad (ej. Madrid, España)..."
                    className={styles.input}
                    style={{ flex: 1, margin: 0 }}
                    onKeyDown={e => { if(e.key === 'Enter') searchLocation(); }}
                  />
                  <button className={styles.primaryBtn} onClick={() => searchLocation()} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? 'Buscando...' : '🔍 Buscar'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <ul className={styles.list} style={{ marginTop: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    {searchResults.map((r, i) => (
                      <li key={i} className={styles.listItem} style={{ cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: i < searchResults.length - 1 ? '1px solid #e2e8f0' : 'none', border: 'none' }} onClick={() => selectLocation(r.lat, r.lon)}>
                        <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>{r.display_name}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', opacity: 0.8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Latitud</label>
                    <input 
                      type="number"
                      step="any"
                      value={calendarLat}
                      onChange={(e) => setCalendarLat(e.target.value)}
                      className={styles.input}
                      placeholder="Ej. 29.37"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Longitud</label>
                    <input 
                      type="number"
                      step="any"
                      value={calendarLng}
                      onChange={(e) => setCalendarLng(e.target.value)}
                      className={styles.input}
                      placeholder="Ej. -39.3"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className={styles.primaryBtn} 
                    onClick={handleSaveGeneral}
                    disabled={loading || !calendarTitle.trim()}
                  >
                    Guardar Cambios Generales
                  </button>
                </div>
              </div>
            )}

            {/* --- ZONES TAB --- */}
            {activeTab === 'zones' && (
              <div className={styles.section}>
                <h3>Zonas Existentes</h3>
                
                {calendar.zones.length === 0 ? (
                  <p className={styles.empty}>No hay zonas en este calendario.</p>
                ) : (
                  <ul className={styles.list}>
                    {calendar.zones.map(zone => (
                      <li key={zone.id} className={styles.listItem}>
                        {editingZoneId === zone.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <input 
                              type="text" 
                              value={editingZoneName} 
                              onChange={e => setEditingZoneName(e.target.value)} 
                              className={styles.input}
                              style={{ flex: 1, margin: 0 }}
                            />
                            <button onClick={() => handleSaveEditZone(zone.id)} disabled={loading} className={styles.successBtn}>✔️</button>
                            <button onClick={() => setEditingZoneId(null)} disabled={loading} className={styles.cancelBtn}>❌</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{zone.name}</strong>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => { setEditingZoneId(zone.id); setEditingZoneName(zone.name); }} className={styles.iconBtn}>✏️</button>
                              <button onClick={() => handleDeleteZone(zone.id, zone.name)} className={styles.iconBtn}>🗑️</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <h3 style={{ marginTop: '2rem' }}>Añadir Nueva Zona</h3>
                <form onSubmit={handleAddZone} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    value={newZoneName} 
                    onChange={e => setNewZoneName(e.target.value)} 
                    placeholder="Nombre de la zona (ej: D68 Torrejón)"
                    className={styles.input}
                    style={{ flex: 1, margin: 0 }}
                  />
                  <button type="submit" disabled={loading || !newZoneName.trim()} className={styles.primaryBtn}>Añadir Zona</button>
                </form>
              </div>
            )}

            {/* --- PERMITS TAB --- */}
            {activeTab === 'permits' && (
              <div className={styles.section}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Restricciones y Coordinaciones</h3>
                  <button 
                    onClick={() => setShowPermitsInfo(!showPermitsInfo)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#0284c7' }}
                    title="Información sobre cómo funciona esto"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </button>
                </div>
                <p className={styles.helpText} style={{ marginTop: 0 }}>1º Añade una Restricción (Permiso) y 2º añádele periodos de Coordinación.</p>

                {showPermitsInfo && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0284c7', fontSize: '0.95rem' }}>¿Cómo funciona el sistema de doble nivel?</h4>
                    <p style={{ margin: '0 0 0.5rem 0' }}>El sistema funciona en <strong>dos niveles</strong> jerárquicos:</p>
                    <ol style={{ margin: '0 0 0.75rem 1.5rem', padding: 0 }}>
                      <li style={{ marginBottom: '0.3rem' }}><strong>Nivel 1 (Restricción):</strong> Define la norma o zona afectada (ej. "ZGUAS LECU" o "LEP118"). Actúa como el contenedor general permanente.</li>
                      <li style={{ marginBottom: '0.3rem' }}><strong>Nivel 2 (Coordinaciones):</strong> Dentro de una restricción, añades los <em>periodos temporales</em> (intervalos) en los que tienes permiso efectivo para volar.</li>
                    </ol>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>¿Qué pasa si caduca una coordinación?</strong><br />Cuando caduca una coordinación (o si defines una nueva que empieza más adelante, dejando un hueco), el sistema detectará automáticamente esos días "vacíos" sin cobertura y te avisará en rojo (❌ <em>Sin coordinación en fecha...</em>).</p>
                    <p style={{ margin: 0 }}><strong>Exclusiones (Intermitencias):</strong><br />A veces tienes una coordinación general aprobada para un mes, pero te deniegan el vuelo en días específicos dentro de ese mismo mes (ej. prohibido el día 15). Puedes añadir esas exclusiones (los "agujeros") dentro de tu coordinación activa para que el calendario pinte esos días sueltos en rojo.</p>
                  </div>
                )}

                {calendar.globalPermits && calendar.globalPermits.length > 0 ? (
                  <ul className={styles.list}>
                    {calendar.globalPermits.map(permit => (
                      <li key={permit.id} className={styles.listItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        
                        {editingPermitId === permit.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" value={editingPermitName} onChange={e => setEditingPermitName(e.target.value)} className={styles.input} style={{ flex: 1, margin: 0 }} />
                              <button onClick={() => handleSaveEditPermit(permit.id)} disabled={loading} className={styles.successBtn}>✔️</button>
                              <button onClick={() => setEditingPermitId(null)} disabled={loading} className={styles.cancelBtn}>❌</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{permit.name}</strong>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                <button onClick={() => {
                                  setEditingPermitId(permit.id);
                                  setEditingPermitName(permit.name);
                                }} disabled={loading} className={styles.iconBtn} title="Editar nombre">✏️</button>
                                <button onClick={() => handleDeletePermit(permit.id)} disabled={loading} className={styles.iconBtn} title="Eliminar restricción">🗑️</button>
                              </div>
                            </div>
                            
                            {/* Coordinations Sub-list */}
                            <div style={{ marginTop: '1rem', padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                              <h4 style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>Periodos de Coordinación:</h4>
                              {permit.coordinations && permit.coordinations.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {permit.coordinations.map(coord => (
                                    <div key={coord.id} style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                          <span style={{ fontWeight: 600 }}>
                                            {coord.startDate ? `Del ${new Date(coord.startDate).toLocaleDateString()} al ` : `Hasta el `}
                                            {new Date(coord.expirationDate).toLocaleDateString()}
                                          </span>
                                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>(aviso {coord.warningDays} días)</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                          <button onClick={() => handleDeleteCoordination(coord.id)} className={styles.iconBtn} title="Eliminar coordinación">🗑️</button>
                                        </div>
                                      </div>

                                      {/* Exclusions Sub-list */}
                                      <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c' }}>Fechas Excluidas (No se permite volar):</div>
                                          <button 
                                            type="button"
                                            onClick={() => handleOpenAiModal(coord.id)} 
                                            className={styles.aiSparkleBtn}
                                            title="Pegar oficio oficial y extraer exclusiones automáticamente con IA"
                                          >
                                            ✨ Importar Oficio (IA)
                                          </button>
                                        </div>
                                        {coord.exclusions && coord.exclusions.length > 0 ? (
                                          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>
                                            {coord.exclusions.map(ex => {
                                              const startStr = new Date(ex.startDate).toLocaleDateString();
                                              const endStr = ex.endDate ? new Date(ex.endDate).toLocaleDateString() : null;
                                              const dateText = endStr ? `Del ${startStr} al ${endStr}` : startStr;
                                              let ruleText = '';
                                              if (ex.ruleType === 'DENY_ALL') ruleText = ' (Todo el día)';
                                              else {
                                                const tw = ex.timeWindowsJson ? JSON.parse(ex.timeWindowsJson) : [];
                                                const twStr = tw.map((w:any) => `${w.start}-${w.end}`).join(', ');
                                                if (ex.ruleType === 'ALLOW_WINDOWS') ruleText = ` (Solo permitido: ${twStr})`;
                                                if (ex.ruleType === 'DENY_WINDOWS') ruleText = ` (Solo prohibido: ${twStr})`;
                                              }
                                              return (
                                                <li key={ex.id} style={{ marginBottom: '0.2rem' }}>
                                                  {dateText}{ruleText} - {ex.reason || 'Sin motivo'}
                                                  <button onClick={() => handleDeleteExclusion(ex.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '0.5rem' }}>✖</button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        ) : (
                                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Ninguna fecha excluida en esta coordinación.</div>
                                        )}
                                        
                                        {/* Add Exclusion Form */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px dotted #cbd5e1', paddingTop: '0.75rem' }}>
                                          <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                            <input type="checkbox" checked={newExclusionIsRange} onChange={e => setNewExclusionIsRange(e.target.checked)} /> Rango de días
                                          </label>
                                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <input type="date" value={newExclusionStartDate} onChange={e => setNewExclusionStartDate(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem' }} />
                                            {newExclusionIsRange && (
                                              <>
                                                <span style={{ fontSize: '0.8rem' }}>al</span>
                                                <input type="date" value={newExclusionEndDate} onChange={e => setNewExclusionEndDate(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem' }} />
                                              </>
                                            )}
                                            <select value={newExclusionRuleType} onChange={e => setNewExclusionRuleType(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem' }}>
                                              <option value="DENY_ALL">Prohibir todo el día</option>
                                              <option value="ALLOW_WINDOWS">SÍ se puede volar en horas...</option>
                                              <option value="DENY_WINDOWS">NO se puede volar en horas...</option>
                                            </select>
                                          </div>
                                          
                                          {newExclusionRuleType !== 'DENY_ALL' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid #cbd5e1' }}>
                                              {newExclusionTimeWindows.map((tw, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                  <input type="time" value={tw.start} onChange={e => {
                                                    const newW = [...newExclusionTimeWindows];
                                                    newW[idx].start = e.target.value;
                                                    setNewExclusionTimeWindows(newW);
                                                  }} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem' }} />
                                                  <span style={{ fontSize: '0.8rem' }}>a</span>
                                                  <input type="time" value={tw.end} onChange={e => {
                                                    const newW = [...newExclusionTimeWindows];
                                                    newW[idx].end = e.target.value;
                                                    setNewExclusionTimeWindows(newW);
                                                  }} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem' }} />
                                                  {idx === newExclusionTimeWindows.length - 1 && (
                                                    <button onClick={() => setNewExclusionTimeWindows([...newExclusionTimeWindows, {start: '', end: ''}])} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}>+</button>
                                                  )}
                                                  {newExclusionTimeWindows.length > 1 && (
                                                    <button onClick={() => {
                                                      const newW = [...newExclusionTimeWindows];
                                                      newW.splice(idx, 1);
                                                      setNewExclusionTimeWindows(newW);
                                                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}>×</button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input type="text" placeholder="Motivo (opcional)..." value={newExclusionReason} onChange={e => setNewExclusionReason(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.2rem', fontSize: '0.8rem', flex: 1 }} />
                                            <button onClick={() => handleAddExclusion(coord.id)} disabled={!newExclusionStartDate || loading || (newExclusionIsRange && !newExclusionEndDate)} className={styles.primaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>+ Exclusión</button>
                                          </div>
                                        </div>

                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Aún no hay coordinaciones añadidas.</p>
                              )}

                              {/* Add Coordination Form */}
                              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', flexWrap: 'wrap' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Inicia (opcional):</label>
                                <input type="date" value={newPermitStartDate} onChange={e => setNewPermitStartDate(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.3rem', fontSize: '0.85rem' }} />
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem' }}>Caduca el:</label>
                                <input type="date" value={newPermitDate} onChange={e => setNewPermitDate(e.target.value)} className={styles.input} style={{ margin: 0, padding: '0.3rem', fontSize: '0.85rem' }} />
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem' }}>Aviso (días):</label>
                                <input type="number" value={newPermitWarningDays} onChange={e => setNewPermitWarningDays(Number(e.target.value))} className={styles.input} style={{ margin: 0, width: '60px', padding: '0.3rem', fontSize: '0.85rem' }} />
                                <button onClick={() => handleAddCoordination(permit.id)} disabled={loading || !newPermitDate} className={styles.primaryBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>+ Coordinación</button>
                              </div>
                            </div>

                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>No hay Restricciones / Permisos añadidos.</p>
                )}

                <h3 style={{ marginTop: '2.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Añadir Nueva Restricción (Permiso)</h3>
                <form onSubmit={handleAddPermit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nombre de la Restricción</label>
                      <input 
                        type="text" 
                        value={newPermitName} 
                        onChange={e => setNewPermitName(e.target.value)} 
                        placeholder="Ej: ZGUAS LECU, Permiso ENAIRE..."
                        className={styles.input}
                        style={{ margin: 0, width: '100%' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="submit" disabled={loading || !newPermitName.trim()} className={styles.primaryBtn} style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold' }}>
                      + Añadir Restricción
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- CALLS TAB --- */}
            {activeTab === 'calls' && (
              <div className={styles.section}>
                <h3>Coordinación Operativa Diaria</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
                    <input 
                      type="checkbox" 
                      checked={requiresDaily} 
                      onChange={e => handleSaveCoordinationSetting(e.target.checked)} 
                      disabled={loading}
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    Requerir coordinación operativa diaria
                  </label>
                  <p className={styles.helpText}>Si se marca, el calendario aparecerá en el Banner Global y requerirá firmas de apertura y cierre (🟢/🔴).</p>
                </div>

                {requiresDaily && (
                  <>
                    <h3>Sitios de Llamada Configurados</h3>
                    {calendar.callTargets && calendar.callTargets.length > 0 ? (
                      <ul className={styles.list}>
                        {calendar.callTargets.map(target => (
                          <li key={target.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {editingTargetId === target.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                <input 
                                  type="text" 
                                  value={editingTargetName} 
                                  onChange={e => setEditingTargetName(e.target.value)} 
                                  className={styles.input}
                                  placeholder="Nombre..."
                                  style={{ margin: 0 }}
                                />
                                <input 
                                  type="text" 
                                  value={editingTargetNotes} 
                                  onChange={e => setEditingTargetNotes(e.target.value)} 
                                  className={styles.input}
                                  placeholder="Notas de contacto..."
                                  style={{ margin: 0 }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={editingTargetReqOpening} 
                                        onChange={e => setEditingTargetReqOpening(e.target.checked)} 
                                      /> Req. Apertura
                                    </label>
                                    <label style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={editingTargetReqClosing} 
                                        onChange={e => setEditingTargetReqClosing(e.target.checked)} 
                                      /> Req. Cierre
                                    </label>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleSaveEditTarget(target.id)} disabled={loading} className={styles.successBtn}>✔️</button>
                                    <button onClick={() => setEditingTargetId(null)} disabled={loading} className={styles.cancelBtn}>❌</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ flex: 1, paddingRight: '1rem' }}>
                                  <strong style={{ color: '#0f172a' }}>{target.name}</strong>
                                  {target.contactNotes && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.1rem' }}>
                                      {target.contactNotes}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    {target.requiresOpening && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px' }}>Apertura</span>}
                                    {target.requiresClosing && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: '4px' }}>Cierre</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => {
                                    setEditingTargetId(target.id);
                                    setEditingTargetName(target.name);
                                    setEditingTargetReqOpening(target.requiresOpening);
                                    setEditingTargetReqClosing(target.requiresClosing);
                                    setEditingTargetNotes(target.contactNotes || '');
                                  }} className={styles.iconBtn} title="Editar sitio">✏️</button>
                                  <button onClick={() => handleDeleteTarget(target.id)} disabled={loading} className={styles.iconBtn} title="Eliminar sitio">🗑️</button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.empty}>No hay sitios a los que llamar configurados.</p>
                    )}

                    <h3 style={{ marginTop: '2rem' }}>Añadir Sitio de Llamada</h3>
                    <form onSubmit={handleAddTarget} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <input 
                        type="text" 
                        value={newTargetName} 
                        onChange={e => setNewTargetName(e.target.value)} 
                        placeholder="Nombre del sitio (ej: Torrejón)..."
                        className={styles.input}
                        style={{ margin: 0 }}
                      />
                      <input 
                        type="text" 
                        value={targetNotes} 
                        onChange={e => setTargetNotes(e.target.value)} 
                        placeholder="Notas fijas / Contacto (opcional)..."
                        className={styles.input}
                        style={{ margin: 0 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <label style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={targetReqOpening} 
                              onChange={e => setTargetReqOpening(e.target.checked)} 
                            />
                            Req. Apertura
                          </label>
                          <label style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={targetReqClosing} 
                              onChange={e => setTargetReqClosing(e.target.checked)} 
                            />
                            Req. Cierre
                          </label>
                        </div>
                        <button 
                          type="submit"
                          disabled={loading || !newTargetName.trim() || (!targetReqOpening && !targetReqClosing)} 
                          className={styles.primaryBtn}
                        >
                          Añadir Sitio
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Modal de Importación IA */}
      {aiModalCoordId !== null && (
        <div className={styles.aiSubModalOverlay} onClick={() => setAiModalCoordId(null)}>
          <div className={styles.aiSubModal} onClick={e => e.stopPropagation()}>
            <div className={styles.aiSubModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>Importar Exclusiones con Inteligencia Artificial</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Extrae automáticamente fechas, restricciones y franjas horarias de resoluciones oficiales</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setAiModalCoordId(null)} 
                className={styles.closeBtn}
                title="Cerrar ventana"
              >
                &times;
              </button>
            </div>

            <div className={styles.aiSubModalBody}>
              {/* Opciones de extracción */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Motivo / Expediente:</label>
                  <input 
                    type="text" 
                    value={aiDefaultReason} 
                    onChange={e => setAiDefaultReason(e.target.value)} 
                    placeholder="Ej. MILNOF-1793" 
                    className={styles.input} 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '130px', margin: 0 }} 
                  />
                </div>
                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={aiGroupConsecutive} 
                    onChange={e => handleToggleGroupOption(e.target.checked)} 
                  /> 
                  Agrupar días consecutivos (ej. Del 06/10 al 07/10)
                </label>
              </div>

              {/* Textarea del Oficio */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Texto de la Resolución / Oficio de Vuelo:
                </label>
                <textarea 
                  className={styles.aiTextarea} 
                  rows={5} 
                  value={aiRawText} 
                  onChange={e => setAiRawText(e.target.value)} 
                  placeholder="Pega aquí el texto oficial. Ejemplo:&#10;SE AUTORIZAN dichos vuelos durante el periodo del 24 de septiembre al 08 de octubre de 2026...&#10;- 25 de septiembre de 2026.&#10;- 29 de septiembre de 2026. Autorizado a partir de las 18:00 horas..."
                />
              </div>

              {/* Botón de análisis */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={handleAnalyzeAiText} 
                  disabled={isAiAnalyzing || !aiRawText.trim()} 
                  className={styles.primaryBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  {isAiAnalyzing ? (
                    <>⏳ Analizando texto con IA...</>
                  ) : (
                    <>🔍 Analizar Texto con IA</>
                  )}
                </button>
              </div>

              {/* Previsualización de resultados */}
              {aiPreviewItems.length > 0 && (
                <div className={styles.aiPreviewContainer}>
                  {aiExtractedCoordination && (
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📅</span>
                      <span>
                        <strong>Periodo de coordinación detectado:</strong>{' '}
                        {aiExtractedCoordination.startDate ? `Del ${aiExtractedCoordination.startDate} al ` : ''}
                        {aiExtractedCoordination.expirationDate || 'No especificado'}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      Exclusiones detectadas ({aiPreviewItems.filter(it => it.selected).length} de {aiPreviewItems.length} seleccionadas):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => handleToggleSelectAll(true)} 
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Marcar todas
                      </button>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <button 
                        type="button" 
                        onClick={() => handleToggleSelectAll(false)} 
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {aiPreviewItems.map((item, idx) => {
                      const startFmt = item.startDate ? item.startDate.split('-').reverse().join('/') : '';
                      const endFmt = item.endDate ? item.endDate.split('-').reverse().join('/') : null;
                      const dateDisplay = endFmt ? `Del ${startFmt} al ${endFmt}` : startFmt;

                      let ruleBadge = <span className={styles.badgeDeny}>Prohibido todo el día</span>;
                      if (item.ruleType === 'ALLOW_WINDOWS') {
                        const twStr = item.timeWindows?.map(w => `${w.start}-${w.end}`).join(', ') || '';
                        ruleBadge = <span className={styles.badgeAllow}>Solo permitido: {twStr}</span>;
                      } else if (item.ruleType === 'DENY_WINDOWS') {
                        const twStr = item.timeWindows?.map(w => `${w.start}-${w.end}`).join(', ') || '';
                        ruleBadge = <span className={styles.badgeDenyWindows}>Prohibido: {twStr}</span>;
                      }

                      return (
                        <div key={idx} className={styles.aiPreviewItem} style={{ opacity: item.selected ? 1 : 0.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                            <input 
                              type="checkbox" 
                              checked={item.selected} 
                              onChange={() => handleToggleSelectItem(idx)} 
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                              {dateDisplay}
                            </span>
                            {ruleBadge}
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
                              {item.reason}
                            </span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleDeletePreviewItem(idx)} 
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem' }}
                            title="Descartar esta fecha"
                          >
                            ✖
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botones de acción modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setAiModalCoordId(null)} 
                  className={styles.cancelBtn}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveAiExclusions} 
                  disabled={loading || aiPreviewItems.filter(it => it.selected).length === 0} 
                  className={styles.successBtn}
                  style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {loading ? 'Guardando...' : `💾 Guardar ${aiPreviewItems.filter(it => it.selected).length} Exclusiones`}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
