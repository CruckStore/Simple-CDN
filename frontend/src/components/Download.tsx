import React, { useEffect, useState } from 'react';

type FileData = {
  id: string;
  filename: string;
  name: string;
  size: number;
  date: string;
};

type SortField = 'id' | 'name' | 'size' | 'date';

type SortConfig = {
  field: SortField;
  order: 'asc' | 'desc';
};

const Download: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/files')
      .then(response => response.json())
      .then(data => setFiles(data));
  }, []);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => Math.min(prev + 50, filteredFiles.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredFiles]);

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const sortFiles = (field: SortField, order: 'asc' | 'desc') => {
    const sorted = [...files].sort((a, b) => {
      let result = 0;
      if (field === 'id') {
        result = a.id.localeCompare(b.id);
      } else if (field === 'size') {
        result = a.size - b.size;
      } else if (field === 'date') {
        result = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        result = a.name.localeCompare(b.name);
      }
      return order === 'asc' ? result : -result;
    });
    setFiles(sorted);
  };

  const handleSort = (field: SortField) => {
    let newOrder: 'asc' | 'desc';
    if (sortConfig && sortConfig.field === field) {
      newOrder = sortConfig.order === 'asc' ? 'desc' : 'asc';
    } else {
      newOrder = field === 'date' ? 'desc' : 'asc';
    }
    setSortConfig({ field, order: newOrder });
    sortFiles(field, newOrder);
  };

  const getSortIndicator = (field: SortField) => {
    if (sortConfig?.field === field) {
      return sortConfig.order === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  const isPreviewable = (fileName: string) => {
    const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'mp4', 'webm', 'ogg', 'mp3', 'wav'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? previewableExtensions.includes(ext) : false;
  };

  const handleFileClick = (file: FileData) => {
    const url = `http://localhost:3000/uploads/${file.filename}`;
    if (!isPreviewable(file.filename)) {
      if (!window.confirm(`C'est un fichier de ${formatBytes(file.size)}. Voulez-vous le télécharger ?`)) {
        return;
      }
    }
    window.open(url, '_blank');
  };

  const handleCopy = (file: FileData) => {
    const url = `http://localhost:3000/uploads/${file.filename}`;
    navigator.clipboard.writeText(url)
      .then(() => alert('Lien copié dans le presse-papiers !'))
      .catch(() => alert('Erreur lors de la copie du lien.'));
  };

  const handleDelete = (file: FileData) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
      fetch(`http://localhost:3000/api/files/${file.filename}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setFiles(prev => prev.filter(f => f.filename !== file.filename));
            alert('Fichier supprimé !');
          } else {
            alert("Erreur lors de la suppression");
          }
        })
        .catch(() => alert("Erreur lors de la suppression"));
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = () => {
    const visibleIds = filteredFiles.slice(0, visibleCount).map(file => file.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const truncateId = (id: string, maxLength = 12): string => {
    return id.length > maxLength ? id.substring(0, maxLength) + '...' : id;
  };

  return (
    <div>
      <h2>Liste des fichiers</h2>
      <input
        type="text"
        placeholder="Rechercher par nom..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ padding: '10px', width: '80%', fontSize: '1em', marginBottom: '20px' }}
      />
      <button onClick={handleSelectAll} style={{ marginBottom: '20px' }}>
        Sélectionner/Désélectionner tous
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Sélection</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('id')}>
              ID {getSortIndicator('id')}
            </th>
            <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('name')}>
              Nom {getSortIndicator('name')}
            </th>
            <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('size')}>
              Taille {getSortIndicator('size')}
            </th>
            <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('date')}>
              Date {getSortIndicator('date')}
            </th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Lien</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.slice(0, visibleCount).map((file) => (
            <tr key={file.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(file.id)}
                  onChange={(e) => handleSelect(file.id, e.target.checked)}
                />
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{truncateId(file.id)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{file.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatBytes(file.size)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(file.date).toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <a href="#!" onClick={() => handleFileClick(file)}>
                  Voir
                </a>
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                <span style={{ cursor: 'pointer', marginRight: '10px' }} onClick={() => handleCopy(file)}>
                  📋
                </span>
                <span style={{ cursor: 'pointer' }} onClick={() => handleDelete(file)}>
                  🗑️
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Download;