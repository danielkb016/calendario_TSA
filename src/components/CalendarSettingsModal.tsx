'use client';

import React, { useState } from 'react';
import { 
  updateCalendar, 
  addZone, updateZone, deleteZone, 
  addCallTarget, updateCallTarget, deleteCallTarget, 
  addGlobalPermit, deleteGlobalPermit 
} from '@/app/actions';
import styles from './CalendarSettingsModal.module.css';

type GlobalPermit = {
  id: number;
  name: string;
  expirationDate: Date;
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
  const [newPermitName, setNewPermitName] = useState('');
  const [newPermitDate, setNewPermitDate] = useState('');

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
    if (!newPermitName.trim() || !newPermitDate) return;
    setLoading(true);
    try {
      await addGlobalPermit(calendar.id, newPermitName.trim(), new Date(newPermitDate));
      setNewPermitName('');
      setNewPermitDate('');
      onUpdated();
    } catch (error) {
      console.error(error);
      alert('Error al añadir el permiso');
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
                <h3>Permisos Globales y Caducidades</h3>
                <p className={styles.helpText}>Añade los permisos globales. Aparecerán en el banner diario y cambiarán de color si están próximos a caducar.</p>

                {calendar.globalPermits && calendar.globalPermits.length > 0 ? (
                  <ul className={styles.list}>
                    {calendar.globalPermits.map(permit => (
                      <li key={permit.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{permit.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                            Caduca el {new Date(permit.expirationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button onClick={() => handleDeletePermit(permit.id)} disabled={loading} className={styles.iconBtn} title="Eliminar permiso">🗑️</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>No hay permisos globales añadidos.</p>
                )}

                <h3 style={{ marginTop: '2rem' }}>Añadir Permiso</h3>
                <form onSubmit={handleAddPermit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    value={newPermitName} 
                    onChange={e => setNewPermitName(e.target.value)} 
                    placeholder="Nombre (ej: Permiso ENAIRE)..."
                    className={styles.input}
                    style={{ flex: 2, margin: 0 }}
                  />
                  <input
                    type="date"
                    value={newPermitDate}
                    onChange={e => setNewPermitDate(e.target.value)}
                    className={styles.input}
                    style={{ flex: 1, margin: 0 }}
                  />
                  <button type="submit" disabled={loading || !newPermitName.trim() || !newPermitDate} className={styles.primaryBtn}>
                    Añadir Permiso
                  </button>
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
    </div>
  );
}
