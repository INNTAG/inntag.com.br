import { useState, useEffect } from 'react';
import { Zap, Link2, Unlink } from 'lucide-react';

interface UnifilarItem {
  id: number;
  item_key: string;
  name: string;
  description: string;
  product_id: number | null;
  product_name?: string;
  product_slug?: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
}

export default function ConfigUnifilar() {
  const [items, setItems] = useState<UnifilarItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([
        fetch('/api/public/unifilar'),
        fetch('/api/public/products')
      ]);
      
      const itemsData = await itemsRes.json();
      const productsData = await productsRes.json();
      
      setItems(itemsData.items || []);
      setProducts(productsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (itemId: number, productId: number | null) => {
    setSaving(itemId);
    const token = sessionStorage.getItem('admin_session');
    
    try {
      const res = await fetch(`/api/admin/unifilar/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      
      if (res.ok) {
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                product_id: productId,
                product_name: products.find(p => p.id === productId)?.title,
                product_slug: products.find(p => p.id === productId)?.slug
              }
            : item
        ));
      }
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group items by category
  const categories = {
    'Subestação': items.filter(i => i.item_key.includes('subestacao')),
    'Cubículos MT': items.filter(i => i.item_key.includes('cubiculo')),
    'Transformadores': items.filter(i => i.item_key.includes('trafo')),
    'QGBTs': items.filter(i => i.item_key.includes('qgbt')),
    'CCM': items.filter(i => i.item_key.includes('ccm')),
    'Quadros de Distribuição': items.filter(i => i.item_key.includes('qdf') || i.item_key.includes('qdl')),
    'TIE / QTA': items.filter(i => i.item_key.includes('tie_') || i.item_key === 'qta'),
    'Banco de Capacitores': items.filter(i => i.item_key.includes('banco_capacitor')),
    'Cogeração': items.filter(i => ['gerador', 'excitacao', 'protecao', 'sincronismo'].includes(i.item_key)),
    'Cargas': items.filter(i => ['motores', 'fornos', 'iluminacao'].includes(i.item_key)),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Diagrama Unifilar</h1>
          <p className="text-neutral-500 mt-1">Vincule produtos aos elementos do diagrama</p>
        </div>
        <a 
          href="/unifilar" 
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ver Diagrama
        </a>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {Object.entries(categories).map(([category, categoryItems]) => (
          categoryItems.length > 0 && (
            <div key={category} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                <h2 className="font-semibold text-neutral-900">{category}</h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {categoryItems.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">{item.name}</h3>
                      <p className="text-sm text-neutral-500">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {item.product_id ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                          <Link2 className="w-3.5 h-3.5" />
                          Vinculado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-500 rounded-full text-sm">
                          <Unlink className="w-3.5 h-3.5" />
                          Não vinculado
                        </span>
                      )}
                      
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => handleProductChange(item.id, e.target.value ? Number(e.target.value) : null)}
                        disabled={saving === item.id}
                        className="w-64 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                      >
                        <option value="">Selecionar produto...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.title}
                          </option>
                        ))}
                      </select>
                      
                      {saving === item.id && (
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
