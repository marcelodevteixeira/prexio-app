import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import Scanner from '@/components/Scanner';
import { ShoppingList, ListItem, Product, PriceRecord, UserProfile } from '@/lib/types';
import { formatCurrency, calculateItemTotal, cn } from '@/utils';
import { addPoints, POINTS } from '@/lib/gamification';
import EconomyMission from '@/components/EconomyMission';
import RadarScreen from '@/components/RadarScreen';
import { trackProduct, detectPromotion } from '@/services/radarService';
import { 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Scan, 
  Barcode, 
  QrCode, 
  Trash2, 
  ArrowLeft,
  TrendingDown,
  Store,
  MapPin,
  List,
  User as UserIcon,
  Sparkles,
  Trophy,
  X,
  Radar,
  Camera,
  Star,
  Share2,
  Database
} from 'lucide-react';

import { MarketComparison } from '@/components/MarketComparison';
import { SmartBasketWidget } from '@/components/SmartBasketWidget';
import { updatePurchasePatterns } from '@/services/smartBasketService';
import { useToast } from '@/components/Toast';

import { SavingsCounter } from '@/components/SavingsCounter';
import { PromotionAlert } from '@/components/PromotionAlert';
import { ProductScanner } from '@/components/ProductScanner';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';

const CurrencyInput = ({ value, onChange, className }: { value: number, onChange: (val: number) => void, className?: string }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const num = parseInt(digits, 10);
    if (isNaN(num)) {
      onChange(0);
    } else {
      onChange(num / 100);
    }
  };

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={handleChange}
      className={className}
      placeholder="0,00"
    />
  );
};
import { motion, AnimatePresence } from 'motion/react';

// Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  }
}

async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Supabase Error (Demo Mode):', error);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.id,
      email: user?.email,
    },
    operationType,
    path
  }
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          if (parsed.error.includes('insufficient permissions')) {
            errorMessage = "Você não tem permissão para realizar esta ação. Verifique se está logado corretamente.";
          } else {
            errorMessage = `Erro no banco de dados: ${parsed.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
          <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl max-w-md w-full text-center border border-slate-800">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lists' | 'database' | 'economy' | 'profile' | 'radar'>('lists');
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [scannerMode, setScannerMode] = useState<'qr' | 'barcode' | 'ocr' | null>(null);
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [pointNotification, setPointNotification] = useState<{ points: number; reason: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Seed gamification data
  useEffect(() => {
    const seedData = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      try {
        const { data: missionsSnap } = await supabase.from('missions').select('*');
        if (!missionsSnap || missionsSnap.length === 0) {
          const initialMissions = [
            { title: 'Escanear 3 notas fiscais', description: 'Contribua com dados de compras reais', goal: 3, reward_points: 50, type: 'receipt' },
            { title: 'Registrar 10 preços', description: 'Ajude a comunidade a encontrar o melhor preço', goal: 10, reward_points: 100, type: 'price' },
            { title: 'Encontrar 3 promoções', description: 'Registre preços mais baratos que o atual', goal: 3, reward_points: 80, type: 'promotion' },
          ];
          for (const m of initialMissions) {
            await supabase.from('missions').insert([m]);
          }
        }

        const { data: badgesSnap } = await supabase.from('badges').select('*');
        if (!badgesSnap || badgesSnap.length === 0) {
          const initialBadges = [
            { id: 'b1', name: 'Iniciante', description: 'Ganhou seus primeiros 100 pontos', icon: 'award' },
            { id: 'b2', name: 'Explorador', description: 'Atingiu 1000 pontos', icon: 'map' },
            { id: 'b3', name: 'Mestre', description: 'Atingiu 5000 pontos', icon: 'trophy' },
          ];
          for (const b of initialBadges) {
            await supabase.from('badges').upsert([b]);
          }
        }

        const { data: pricesSnap } = await supabase.from('prices').select('*');
        if (!pricesSnap || pricesSnap.length === 0) {
          const mockPrices = [
            { product_id: 'arroz 5kg', price: 18.00, market: 'Assaí', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'arroz 5kg', price: 19.50, market: 'Atacadão', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'arroz 5kg', price: 21.00, market: 'Carrefour', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            
            { product_id: 'leite 1l', price: 4.20, market: 'Assaí', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'leite 1l', price: 4.50, market: 'Atacadão', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'leite 1l', price: 4.80, market: 'Carrefour', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            
            { product_id: 'café 500g', price: 11.00, market: 'Assaí', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'café 500g', price: 11.50, market: 'Atacadão', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'café 500g', price: 12.00, market: 'Carrefour', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            
            { product_id: 'frango 1kg', price: 14.00, market: 'Assaí', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'frango 1kg', price: 13.50, market: 'Atacadão', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
            { product_id: 'frango 1kg', price: 15.00, market: 'Carrefour', city: 'São Paulo', date: new Date().toISOString(), user_id: 'system' },
          ];
          for (const p of mockPrices) {
            await supabase.from('prices').insert([p]);
          }
        }
      } catch (e) {
        console.error("Failed to seed data:", e);
      }
    };
    seedData();
  }, []);

  // Auth Listener
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Demo mode
      setUser({ id: 'demo-user', email: 'demo@example.com', user_metadata: { full_name: 'Demo User' } } as any);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // User Profile Listener
  useEffect(() => {
    if (!user) return;
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Demo mode profile
      setUserProfile({
        uid: user.id,
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || 'Demo User',
        photo_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
        points_total: 1500,
        level: 'Explorador',
        city: 'São Paulo',
        role: 'user',
        favoriteItems: ['Arroz 5kg', 'Feijão 1kg'],
        itemFrequencies: { 'Arroz 5kg': 5, 'Feijão 1kg': 3 }
      } as any);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data: profile, error } = await supabase.from('users').select('*').eq('id', user.id).single();
        
        if (profile) {
          setUserProfile({ uid: profile.id, ...profile } as any);
        } else if (error && error.code === 'PGRST116') {
          // Initialize profile
          const newProfile = {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || 'Usuário',
            photo_url: user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
            points_total: 0,
            level: 'Explorador',
            city: 'São Paulo',
            role: 'user'
          };
          await supabase.from('users').insert([newProfile]);
          setUserProfile({ uid: user.id, ...newProfile } as any);

          // Initialize user missions
          try {
            const { data: missionsSnap } = await supabase.from('missions').select('*');
            if (missionsSnap) {
              for (const mDoc of missionsSnap) {
                await supabase.from('user_missions').insert([{
                  user_id: user.id,
                  mission_id: mDoc.id,
                  progress: 0,
                  completed: false,
                  last_updated: new Date().toISOString()
                }]);
              }
            }
          } catch (e) {
            handleSupabaseError(e, OperationType.WRITE, 'user_missions');
          }
        }
      } catch (e) {
        handleSupabaseError(e, OperationType.GET, `users/${user.id}`);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase.channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, fetchProfile)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Notifications Listener
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('opened', false)
          .order('created_at', { ascending: false })
          .limit(5);
        if (data) setNotifications(data);
      } catch (e) {
        handleSupabaseError(e, OperationType.GET, 'user_notifications');
      }
    };
    
    fetchNotifications();
    
    const channel = supabase.channel('public:user_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Validate connection to Supabase
  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) throw error;
      } catch (error) {
        console.error("Please check your Supabase configuration.", error);
      }
    }
    testConnection();
  }, []);

  // Lists Listener
  useEffect(() => {
    if (!user) return;
    
    const fetchLists = async () => {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setLists(data as any);
    };
    
    fetchLists();
    
    const channel = supabase.channel('public:lists')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `user_id=eq.${user.id}` }, fetchLists)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // List Items Listener
  useEffect(() => {
    if (!selectedList) {
      setListItems([]);
      return;
    }
    
    const fetchItems = async () => {
      const { data } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', selectedList.id);
      if (data) setListItems(data as any);
    };
    
    fetchItems();
    
    const channel = supabase.channel(`public:list_items:${selectedList.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${selectedList.id}` }, fetchItems)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [selectedList]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newListName.trim()) return;

    try {
      await supabase.from('lists').insert([{
        user_id: user.id,
        name: newListName,
        created_at: new Date().toISOString(),
        item_count: 0,
        estimated_total: 0
      }]);
      setNewListName('');
      setIsAddingList(false);
    } catch (error) {
      handleSupabaseError(error, OperationType.CREATE, 'lists');
    }
  };

  const notifyPoints = (points: number, reason: string) => {
    setPointNotification({ points, reason });
    setTimeout(() => setPointNotification(null), 4000);
  };

  const handleAddItem = async (name: string, price?: number, quantity: number = 1) => {
    if (!selectedList || !user) return;
    try {
      await supabase.from('list_items').insert([{
        list_id: selectedList.id,
        name,
        quantity,
        price: price || 0,
        is_bought: false
      }]);
      
      if (userProfile) {
        const currentFreq = userProfile.itemFrequencies?.[name] || 0;
        await supabase.from('users').update({
          item_frequencies: { ...(userProfile.itemFrequencies || {}), [name]: currentFreq + 1 }
        }).eq('id', user.id);
      }
      
      const result = await addPoints(user.id, POINTS.NEW_PRODUCT, 'Novo produto adicionado');
      if (result) notifyPoints(POINTS.NEW_PRODUCT, 'Novo produto adicionado');
    } catch (error) {
      handleSupabaseError(error, OperationType.CREATE, `list_items`);
    }
  };

  const toggleItemBought = async (item: ListItem) => {
    if (!selectedList || !user) return;
    try {
      const newIsBought = !item.isBought;
      
      let savingsToAdd = 0;
      let savingsToSubtract = 0;

      if (newIsBought && item.price > 0 && !item.savingsApplied) {
        let productId = item.productId;
        if (!productId) {
          // Look up product by name
          const { data: snap } = await supabase.from('products').select('id').eq('name', item.name).limit(1);
          if (snap && snap.length > 0) {
            productId = snap[0].id;
          }
        }

        if (productId) {
          // Calculate savings
          const { data: pricesSnap } = await supabase
            .from('prices')
            .select('price')
            .eq('product_id', productId)
            .order('date', { ascending: false })
            .limit(20);
            
          if (pricesSnap && pricesSnap.length > 0) {
            const prices = pricesSnap.map(d => d.price);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const savings = (avgPrice - item.price) * item.quantity;
            if (savings > 0) {
              savingsToAdd = savings;
            }
          }
        }
      } else if (!newIsBought && item.savingsApplied) {
        savingsToSubtract = item.savingsApplied;
      }

      const updateData: any = {
        is_bought: newIsBought
      };

      if (savingsToAdd > 0) {
        updateData.savings_applied = savingsToAdd;
      } else if (savingsToSubtract > 0) {
        updateData.savings_applied = 0;
      }

      await supabase.from('list_items').update(updateData).eq('id', item.id);

      if (savingsToAdd > 0) {
        import('@/services/savingsService').then(({ addSavings }) => {
          addSavings(user.id, savingsToAdd);
        });
      } else if (savingsToSubtract > 0) {
        import('@/services/savingsService').then(({ addSavings }) => {
          addSavings(user.id, -savingsToSubtract);
        });
      }
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `list_items/${item.id}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!selectedList) return;
    try {
      await supabase.from('list_items').delete().eq('id', itemId);
    } catch (error) {
      handleSupabaseError(error, OperationType.DELETE, `list_items/${itemId}`);
    }
  };

  const updateItemPrice = async (itemId: string, price: number) => {
    if (!selectedList || !user) return;
    try {
      await supabase.from('list_items').update({ price }).eq('id', itemId);
      
      // Get the item name to create a price record
      const item = listItems.find(i => i.id === itemId);
      if (item && price > 0) {
        const markets = ['Assaí', 'Atacadão', 'Carrefour'];
        const randomMarket = markets[Math.floor(Math.random() * markets.length)];
        
        let productId = item.productId;
        if (!productId) {
          // Look up product by name
          const { data: snap } = await supabase.from('products').select('id').eq('name', item.name).limit(1);
          if (snap && snap.length > 0) {
            productId = snap[0].id;
          } else {
            // Create product
            const { data: newProduct } = await supabase.from('products').insert([{
              name: item.name,
              category: 'Geral'
            }]).select().single();
            productId = newProduct?.id;
          }
          // Update item with productId
          await supabase.from('list_items').update({ product_id: productId }).eq('id', item.id);
        }

        const priceRecord: any = {
          product_id: productId,
          price,
          market: randomMarket, // Mock market for now
          city: userProfile?.city || 'São Paulo',
          date: new Date().toISOString(),
          user_id: user.id
        };
        
        const { data: docRef } = await supabase.from('prices').insert([priceRecord]).select().single();
        if (docRef) priceRecord.id = docRef.id;
        
        // Detect promotion
        import('@/services/radarService').then(({ detectPromotion }) => {
          detectPromotion(priceRecord);
        });
      }

      const result = await addPoints(user.id, POINTS.REGISTER_PRICE, 'Preço registrado');
      if (result) notifyPoints(POINTS.REGISTER_PRICE, 'Preço registrado');
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `list_items/${itemId}`);
    }
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!selectedList || quantity < 1) return;
    try {
      await supabase.from('list_items').update({ quantity }).eq('id', itemId);
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `list_items/${itemId}`);
    }
  };

  const toggleFavorite = async (itemName: string) => {
    if (!user || !userProfile) return;
    try {
      const currentFavorites = userProfile.favoriteItems || [];
      const isFavorite = currentFavorites.includes(itemName);
      const newFavorites = isFavorite 
        ? currentFavorites.filter(name => name !== itemName)
        : [...currentFavorites, itemName];
        
      await supabase.from('users').update({ favorite_items: newFavorites }).eq('id', user.id);

      if (!isFavorite) {
        import('@/services/radarService').then(({ trackProduct }) => {
          trackProduct(user.id, itemName.toLowerCase(), 'favorite');
        });
      } else {
        // Untrack product
        await supabase.from('user_tracked_products')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', itemName.toLowerCase());
      }
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleScanResult = async (result: string, type: 'qr' | 'barcode' | 'ocr') => {
    console.log(`Scanned ${type}:`, result);
    if (!user) return;

    if (type === 'ocr' && scanningItemId) {
      const price = parseFloat(result.replace(',', '.'));
      if (!isNaN(price)) {
        updateItemPrice(scanningItemId, price);
      }
      setScanningItemId(null);
    } else if (type === 'barcode') {
      handleAddItem(`Produto ${result}`);
    } else if (type === 'qr') {
      try {
        showToast('Enviando Nota Fiscal para processamento...', 'info');
        const response = await fetch('/api/nfce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCodeUrl: result })
        });
        
        if (response.ok) {
          const { job_id } = await response.json();
          showToast('Nota Fiscal na fila. Aguarde...', 'info');
          
          // Poll the jobs table for completion
          const pollJob = async () => {
            const { data: job, error } = await supabase
              .from('jobs')
              .select('*')
              .eq('id', job_id)
              .single();
              
            if (error) {
              console.error("Error polling job:", error);
              showToast('Erro ao verificar status da Nota Fiscal.', 'error');
              return;
            }
            
            if (job.status === 'completed') {
              const data = job.result;
              showToast(`Nota Fiscal processada: ${data.market} - Total: ${formatCurrency(data.total)}`, 'success');
              
              // Add items to the list
              data.items.forEach((item: any) => {
                handleAddItem(item.name, item.price, item.quantity);
              });
              
              const res = await addPoints(user.id, POINTS.SCAN_RECEIPT, 'Nota fiscal escaneada');
              if (res) notifyPoints(POINTS.SCAN_RECEIPT, 'Nota fiscal escaneada');
            } else if (job.status === 'failed') {
              showToast(`Erro no processamento: ${job.error}`, 'error');
            } else {
              // Still pending or processing, poll again in 2 seconds
              setTimeout(pollJob, 2000);
            }
          };
          
          pollJob();
        } else {
          showToast('Erro ao enviar Nota Fiscal.', 'error');
        }
      } catch (error) {
        console.error("Error processing NFCe:", error);
        showToast('Erro ao processar Nota Fiscal.', 'error');
      }
    }
  };

  const handleUpdateLocation = async () => {
    if (!user || !userProfile) return;
    setIsUpdatingLocation(true);

    if (!navigator.geolocation) {
      showToast('Geolocalização não é suportada pelo seu navegador.', 'error');
      setIsUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using OpenStreetMap Nominatim
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality || 'Desconhecida';
          
          await supabase.from('users').update({ city }).eq('id', user.id);
          showToast(`Localização atualizada para: ${city}`, 'success');
        } catch (error) {
          console.error('Erro ao buscar cidade:', error);
          showToast('Erro ao buscar sua cidade. Tente novamente.', 'error');
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error);
        showToast('Não foi possível acessar sua localização. Verifique as permissões do navegador.', 'error');
        setIsUpdatingLocation(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth onDemoLogin={() => {
    setUser({ id: 'demo-user', email: 'demo@example.com', user_metadata: { full_name: 'Demo User' } } as any);
    setUserProfile({
      uid: 'demo-user',
      id: 'demo-user',
      email: 'demo@example.com',
      display_name: 'Demo User',
      photo_url: '',
      created_at: new Date().toISOString(),
      points_total: 1500,
      level: 'Explorador',
      city: 'São Paulo',
      role: 'user',
      favoriteItems: ['Arroz 5kg', 'Feijão 1kg'],
      itemFrequencies: { 'Arroz 5kg': 5, 'Feijão 1kg': 3 }
    } as any);
  }} />;

  const totalBought = listItems
    .filter(i => i.isBought)
    .reduce((acc, i) => acc + calculateItemTotal(i), 0);
  
  const totalRemaining = listItems
    .filter(i => !i.isBought)
    .reduce((acc, i) => acc + calculateItemTotal(i), 0);

  const itemsBoughtCount = listItems.filter(i => i.isBought).length;

  const handleShareList = async () => {
    if (!selectedList) return;
    
    let text = `🛒 Lista de Compras: ${selectedList.name}\n\n`;
    listItems.forEach(item => {
      text += `${item.isBought ? '✅' : '⬜'} ${item.quantity}x ${item.name}`;
      if (item.price && item.price > 0) {
        text += ` - ${formatCurrency(item.price)}`;
      }
      text += '\n';
    });
    
    const total = listItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    text += `\n💰 Total Estimado: ${formatCurrency(total)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lista: ${selectedList.name}`,
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(text);
      showToast('Lista copiada para a área de transferência!', 'success');
    }
  };

  const handleDownloadData = async () => {
    if (!user || !userProfile) return;
    try {
      const data = {
        profile: userProfile,
        lists: lists,
        items: listItems
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus_dados_lelo_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await supabase.rpc('delete_user');
      await supabase.auth.signOut();
      // Auth state change will handle redirect
    } catch (error: any) {
      console.error("Error deleting account:", error);
      showToast("Erro ao deletar conta.", 'error');
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
      
      <PromotionAlert notifications={notifications} />

      {isScannerOpen && (
        <ProductScanner 
          onClose={() => setIsScannerOpen(false)} 
          user={user} 
          userProfile={userProfile}
          notifyPoints={notifyPoints}
        />
      )}

      {/* Point Notification */}
      <AnimatePresence>
        {pointNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 backdrop-blur-md"
          >
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">{pointNotification.reason}</p>
              <p className="text-lg font-bold">+{pointNotification.points} Pontos!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedList ? (
          <motion.div
            key="list-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-32"
          >
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => {
                  setSelectedList(null);
                  setShowComparison(false);
                }}
                className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h2 className="text-xl font-bold text-white">{selectedList.name}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShareList}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                  title="Compartilhar Lista"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>

            {showComparison ? (
              <MarketComparison list={selectedList} />
            ) : (
              <>
                {/* Quick Add */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Adicionar produto..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-[24px] py-4 pl-6 pr-12 shadow-sm focus:outline-none focus:border-blue-500/50 text-white transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value) {
                        handleAddItem(input.value);
                        input.value = '';
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowFavoritesModal(true)}
                  className="bg-slate-900 text-yellow-500 px-4 rounded-[24px] border border-slate-800 shadow-sm hover:border-yellow-500/50 transition-colors flex items-center justify-center flex-shrink-0"
                  title="Meus Favoritos"
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              </div>

              {/* Favorites Quick Add (Top 3) */}
              {userProfile?.favoriteItems && userProfile.favoriteItems.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                  {[...userProfile.favoriteItems]
                    .sort((a, b) => (userProfile.itemFrequencies?.[b] || 0) - (userProfile.itemFrequencies?.[a] || 0))
                    .slice(0, 3)
                    .map((favName) => (
                    <button
                      key={favName}
                      onClick={() => handleAddItem(favName)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-slate-900 text-slate-300 px-4 py-2 rounded-full text-sm font-medium border border-slate-800 hover:border-blue-500/50 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      {favName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {listItems.map((item) => {
                const isFavorite = userProfile?.favoriteItems?.includes(item.name);
                return (
                <motion.div
                  key={item.id}
                  layout
                  className={cn(
                    "bg-slate-900 p-4 rounded-3xl shadow-sm border transition-all flex flex-col gap-3",
                    item.isBought ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleItemBought(item)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {item.isBought ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-600" />
                        )}
                      </button>
                      <h3 className={cn("font-medium truncate text-base text-white", item.isBought && "line-through text-slate-500")}>
                        {item.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleFavorite(item.name)}
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          isFavorite 
                            ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" 
                            : "bg-slate-800 text-slate-500 hover:text-yellow-500"
                        )}
                        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
                      </button>
                      <button 
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-blue-500 transition-colors"
                        title="Ver histórico de preços"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-9">
                    <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <button 
                        onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                        <span className="text-xs text-slate-500 font-medium">R$</span>
                        <CurrencyInput
                          value={item.price || 0}
                          onChange={(val) => updateItemPrice(item.id, val)}
                          className="w-16 bg-transparent text-sm font-bold focus:outline-none text-right text-white"
                        />
                        <button
                          onClick={() => {
                            setScanningItemId(item.id);
                            setScannerMode('ocr');
                          }}
                          className="ml-1 p-1 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Escanear preço"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-500 mt-1 font-medium">
                          Total: {formatCurrency(calculateItemTotal(item))}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {expandedItemId === item.id && item.productId && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <PriceHistoryChart productId={item.productId} />
                    </div>
                  )}
                  {expandedItemId === item.id && !item.productId && (
                    <div className="mt-4 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
                      Adicione um preço para gerar o histórico.
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>

            {/* Summary Bar / Compare Action */}
            <div className="fixed bottom-24 left-6 right-6 bg-slate-900 p-4 rounded-[32px] shadow-2xl flex flex-col gap-3 z-40 border border-slate-800">
              <div className="flex items-center justify-between px-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Total Estimado</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalRemaining + totalBought)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Itens</p>
                  <p className="text-lg font-semibold text-white">{listItems.length}</p>
                </div>
              </div>
              <button
                onClick={() => setShowComparison(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Store className="w-6 h-6" />
                Comparar preços dessa lista
              </button>
            </div>

            {/* Favorites Modal */}
            <AnimatePresence>
              {showFavoritesModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-800"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Star className="text-yellow-500 fill-current w-6 h-6" />
                        Meus Favoritos
                      </h3>
                      <button 
                        onClick={() => setShowFavoritesModal(false)}
                        className="p-2 bg-slate-800 rounded-full text-slate-400 hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                      {userProfile?.favoriteItems && userProfile.favoriteItems.length > 0 ? (
                        [...userProfile.favoriteItems]
                          .sort((a, b) => (userProfile.itemFrequencies?.[b] || 0) - (userProfile.itemFrequencies?.[a] || 0))
                          .map((favName) => (
                          <div key={favName} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <span className="font-medium text-slate-200">{favName}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  handleAddItem(favName);
                                  setShowFavoritesModal(false);
                                }} 
                                className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                                title="Adicionar à lista"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => toggleFavorite(favName)} 
                                className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                title="Remover dos favoritos"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                          <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">Nenhum favorito ainda.</p>
                          <p className="text-sm text-gray-400 mt-1">Marque a estrela nos itens da sua lista para adicioná-los aqui.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            </>
            )}
          </motion.div>
        ) : activeTab === 'economy' ? (
          <motion.div
            key="economy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {userProfile && <EconomyMission user={userProfile} />}
          </motion.div>
        ) : activeTab === 'lists' ? (
          <motion.div
            key="lists-home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Highlight Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[32px] p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <p className="text-blue-100 font-medium mb-1">Você economizou</p>
              <h2 className="text-4xl font-bold tracking-tight mb-2">R$ 124,50</h2>
              <p className="text-blue-100 text-sm">este mês usando o Prixio</p>
            </div>

            {/* Primary CTA */}
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
              Criar lista de compras
            </button>

            {/* Secondary Section */}
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-4">Suas listas</h3>
              
              {/* Empty State */}
              {lists.length === 0 && !isAddingList && (
                <div className="bg-slate-900 p-8 rounded-[32px] text-center border border-slate-800 shadow-sm">
                  <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <List className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Nenhuma lista ainda</h3>
                  <p className="text-slate-400 text-sm">Comece criando uma lista para suas compras.</p>
                </div>
              )}

              {/* Lists Grid */}
              <div className="grid gap-3">
                {lists.map((list) => (
                  <motion.button
                    key={list.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedList(list)}
                    className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-sm text-left flex items-center justify-between group transition-all hover:border-blue-500/50"
                  >
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">{list.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{list.itemCount || 0} itens</span>
                        <span>•</span>
                        <span>{formatCurrency(list.estimatedTotal || 0)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'database' ? (
          <motion.div
            key="database"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white">Preços</h2>
            
            <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-2xl">
                <TrendingDown className="w-8 h-8 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-emerald-100">Onde economizar?</h4>
                  <p className="text-xs text-emerald-400">O Atacadão está com os melhores preços em Brasília hoje.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-widest text-slate-500">Produtos Populares</h3>
                <PriceItem name="Arroz 5kg" price={21.90} market="Atacadão" />
                <PriceItem name="Café 500g" price={14.50} market="Assaí" />
                <PriceItem name="Leite 1L" price={4.89} market="Carrefour" />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl border border-slate-800">
              <h3 className="text-xl font-bold mb-4">Banco Coletivo</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Já registramos mais de 1.240 preços hoje em sua cidade. Continue escaneando para ajudar a comunidade!
              </p>
              <div className="grid gap-3">
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Barcode className="w-5 h-5" />
                  Escanear Produto
                </button>
                <button 
                  onClick={() => setScannerMode('qr')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-700"
                >
                  <QrCode className="w-5 h-5" />
                  Enviar Nota Fiscal
                </button>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 text-center"
          >
            <div className="flex justify-between items-start">
              <div className="w-10" /> {/* Spacer */}
              <div className="relative inline-block">
                <img 
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name}`} 
                  className="w-32 h-32 rounded-[40px] object-cover border-4 border-slate-800 shadow-xl"
                  alt="Profile"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-500 p-3 rounded-2xl text-white shadow-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
              <div className="w-10" /> {/* Spacer */}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{userProfile?.displayName || user.user_metadata?.full_name}</h2>
              <p className="text-slate-400">{user.email}</p>
              {userProfile && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                    {userProfile.level}
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Trophy className="w-4 h-4" />
                    <span>{userProfile.pointsTotal} Pontos</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 text-left">
              <SavingsCounter userId={user.id} />
              
              <ProfileButton 
                icon={<Trophy className="w-5 h-5" />} 
                label="Ver Minhas Conquistas" 
                onClick={() => setActiveTab('economy')}
              />
              <ProfileButton 
                icon={<Radar className="w-5 h-5" />} 
                label="Radar de Ofertas" 
                onClick={() => setActiveTab('radar')}
              />
              <ProfileButton 
                icon={isUpdatingLocation ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <MapPin className="w-5 h-5" />} 
                label={isUpdatingLocation ? 'Buscando localização...' : `Minha Cidade: ${userProfile?.city || 'Desconhecida'}`} 
                onClick={handleUpdateLocation}
              />
              
              <div className="pt-4 mt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-widest">Privacidade e Dados (LGPD)</h3>
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl mb-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-400" />
                    <div className="text-left">
                      <p className="font-semibold text-white">Compartilhar dados anonimizados</p>
                      <p className="text-xs text-slate-500">Ajuda a melhorar os preços para todos</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await supabase.from('users').update({
                          share_anonymized_data: !(userProfile?.shareAnonymizedData ?? true)
                        }).eq('id', user.id);
                      } catch (err) {
                        console.error("Error updating privacy settings:", err);
                      }
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      (userProfile?.shareAnonymizedData ?? true) ? "bg-blue-500" : "bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      (userProfile?.shareAnonymizedData ?? true) ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                <ProfileButton 
                  icon={<Share2 className="w-5 h-5" />} 
                  label="Baixar Meus Dados" 
                  onClick={handleDownloadData}
                />
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-500/10 text-red-500 py-4 px-6 rounded-2xl font-bold flex items-center justify-between mt-4 transition-colors hover:bg-red-500/20 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    Excluir Minha Conta
                  </div>
                </button>
              </div>
            </div>

            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-red-500 font-semibold mt-8"
            >
              Sair da conta
            </button>

            {/* Delete Account Modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-800"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">Excluir Conta</h3>
                    <p className="text-slate-400 mb-6">
                      Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão apagados permanentemente.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
                      >
                        Sim, Excluir
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : activeTab === 'radar' ? (
          <motion.div
            key="radar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RadarScreen user={user} userProfile={userProfile} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isAddingList && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingList(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 w-full max-w-sm p-8 rounded-[40px] shadow-2xl relative z-70 border border-slate-800"
            >
              <h3 className="text-2xl font-bold mb-6 text-white">Nova Lista</h3>
              <form onSubmit={handleCreateList} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Mercado do mês"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-6 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="flex-1 py-4 font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/20"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {scannerMode && (
          <Scanner 
            mode={scannerMode} 
            onScanResult={handleScanResult} 
            onClose={() => setScannerMode(null)} 
          />
        )}
      </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
}

function QuickActionCard({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-sm text-center flex flex-col items-center gap-3 active:scale-95 transition-all hover:border-slate-700"
    >
      <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-400">{label}</span>
    </button>
  );
}

function PriceItem({ name, price, market }: { name: string; price: number; market: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <div>
        <p className="font-medium text-white">{name}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{market}</p>
      </div>
      <p className="font-bold text-emerald-400">{formatCurrency(price)}</p>
    </div>
  );
}

function ProfileButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-500/50"
    >
      <div className="flex items-center gap-4">
        <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
          {icon}
        </div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
    </button>
  );
}
