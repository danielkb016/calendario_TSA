'use client';

import React, { useState } from 'react';
import { addExternalWebLink, deleteExternalWebLink } from '@/app/actions';
import styles from './ExternalLinksHeader.module.css';

type ExternalWebLink = {
  id: number;
  title: string;
  url: string;
  imageUrl: string | null;
};

export default function ExternalLinksHeader({ initialLinks }: { initialLinks: ExternalWebLink[] }) {
  const [links, setLinks] = useState<ExternalWebLink[]>(initialLinks);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    
    setLoading(true);
    try {
      const added = await addExternalWebLink(newTitle, newUrl, newImageUrl || undefined);
      setLinks([...links, added]);
      setNewTitle('');
      setNewUrl('');
      setNewImageUrl('');
    } catch (error) {
      console.error('Error adding link', error);
      alert('Error al añadir el enlace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este enlace?')) return;
    
    setLoading(true);
    try {
      await deleteExternalWebLink(id);
      setLinks(links.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting link', error);
      alert('Error al eliminar el enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {links.map(link => (
        <a 
          key={link.id} 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.linkButton}
          title={link.title}
        >
          {link.imageUrl ? (
            <img 
              src={link.imageUrl} 
              alt="" 
              className={styles.linkIcon}
              onError={(e) => {
                // Si falla la carga de la imagen, mostrar el icono por defecto
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={link.imageUrl ? "hidden" : ""} style={{ fontSize: '1.2rem', display: link.imageUrl ? 'none' : 'block' }}>🌐</span>
          <span>{link.title}</span>
        </a>
      ))}
      
      <button 
        className={styles.addButton} 
        onClick={() => setShowModal(true)}
        title="Añadir nueva web externa"
      >
        +
      </button>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>Gestionar Webs Externas</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className={styles.content}>
              <form onSubmit={handleAdd}>
                <div className={styles.formGroup}>
                  <label>Título de la web</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className={styles.input}
                    placeholder="Ej: ENAIRE Drones"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>URL de la web</label>
                  <input 
                    type="url" 
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className={styles.input}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>URL de la imagen/logo (opcional)</label>
                  <input 
                    type="url" 
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    className={styles.input}
                    placeholder="https://.../logo.png"
                  />
                </div>
                <button type="submit" className={styles.btn} disabled={loading || !newTitle || !newUrl}>
                  Añadir Enlace
                </button>
              </form>

              {links.length > 0 && (
                <ul className={styles.linkList}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Enlaces Guardados:</p>
                  {links.map(link => (
                    <li key={link.id} className={styles.linkListItem}>
                      <div className={styles.linkItemInfo}>
                        {link.imageUrl ? (
                          <img src={link.imageUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        ) : (
                          <span>🌐</span>
                        )}
                        <span>{link.title}</span>
                      </div>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(link.id)}
                        disabled={loading}
                        title="Eliminar enlace"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
