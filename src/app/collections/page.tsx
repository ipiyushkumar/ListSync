'use client';

import { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, X, ChevronDown, ChevronRight, Search, GripVertical, FolderOpen } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  category: string;
  posterUrl?: string;
  rating?: number;
  status: string;
}

interface CollectionItem {
  id: string;
  mediaId: string;
  media: MediaItem;
  addedAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  items: CollectionItem[];
  createdAt: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCollections();
    fetchMedia();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setAllMedia(data);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDescription, color: newColor }),
      });
      if (res.ok) {
        const collection = await res.json();
        setCollections([collection, ...collections]);
        setNewName('');
        setNewDescription('');
        setNewColor('#6366f1');
        setShowCreate(false);
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const res = await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections(collections.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const addToCollection = async (collectionId: string, mediaId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });
      if (res.ok) {
        const item = await res.json();
        setCollections(collections.map(c => {
          if (c.id === collectionId) {
            return { ...c, items: [...c.items, item] };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const removeFromCollection = async (collectionId: string, mediaId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/items?mediaId=${mediaId}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections(collections.map(c => {
          if (c.id === collectionId) {
            return { ...c, items: c.items.filter(i => i.mediaId !== mediaId) };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

  const filteredMedia = allMedia.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = collections.reduce((sum, c) => sum + c.items.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Folder className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Collections</h1>
              <p className="text-sm text-gray-500">Organize your media into custom lists</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{collections.length}</div>
            <div className="text-sm text-gray-500">Collections</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{totalItems}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{allMedia.length}</div>
            <div className="text-sm text-gray-500">Available Media</div>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Collection</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
                autoFocus
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
              />
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createCollection}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDescription(''); }}
                  className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collections List */}
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No collections yet</h3>
            <p className="text-gray-600 mb-6">Create your first collection to organize your media</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Collection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {collections.map(collection => (
              <div key={collection.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => setExpandedId(expandedId === collection.id ? null : collection.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: collection.color }} />
                    {expandedId === collection.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-white">{collection.name}</div>
                      {collection.description && (
                        <div className="text-xs text-gray-500">{collection.description}</div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                      {collection.items.length} items
                    </span>
                    <button
                      onClick={() => setShowAddModal(showAddModal === collection.id ? null : collection.id)}
                      className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${collection.name}"?`)) {
                          deleteCollection(collection.id);
                        }
                      }}
                      className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Items */}
                {expandedId === collection.id && (
                  <div className="border-t border-gray-800 px-4 pb-4">
                    {collection.items.length === 0 ? (
                      <p className="text-gray-600 text-sm py-4 text-center">No items yet. Click + to add media.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
                        {collection.items.map(item => (
                          <div key={item.id} className="relative group">
                            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                              {item.media.posterUrl ? (
                                <img
                                  src={item.media.posterUrl}
                                  alt={item.media.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Folder className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5">
                              <div className="text-xs text-white truncate">{item.media.title}</div>
                              <div className="text-[10px] text-gray-500 capitalize">{item.media.category}</div>
                            </div>
                            <button
                              onClick={() => removeFromCollection(collection.id, item.mediaId)}
                              className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-gray-300" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Add Media Modal */}
                {showAddModal === collection.id && (
                  <div className="border-t border-gray-800 px-4 pb-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search media to add..."
                        className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                      {filteredMedia.map(media => {
                        const inCollection = collection.items.some(i => i.mediaId === media.id);
                        return (
                          <button
                            key={media.id}
                            onClick={() => !inCollection && addToCollection(collection.id, media.id)}
                            disabled={inCollection}
                            className={`text-left p-2 rounded-lg transition-colors ${inCollection ? 'bg-gray-800/50 opacity-50 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'}`}
                          >
                            <div className="text-xs text-white truncate">{media.title}</div>
                            <div className="text-[10px] text-gray-500 capitalize">
                              {inCollection ? 'Added' : media.category}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
