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
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
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
  const [latestPrices, setLatestPrices] = useState<any[]>([]);

  // Seed gamification data
  useEffect(() => {
    // Removed seedData to ensure new accounts start empty
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
        setLists([]);
        setSelectedList(null);
        setListItems([]);
        setNotifications([]);
        setLatestPrices([]);
        setScanningItemId(null);
        setExpandedItemId(null);
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
          setUserProfile({ 
            uid: profile.id, 
            ...profile,
            favoriteItems: profile.favorite_items || [],
            itemFrequencies: profile.item_frequencies || {}
          } as any);
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
            favorite_items: [],
            item_frequencies: {}
          };
          const { error: insertError } = await supabase.from('users').insert([newProfile]);
          if (insertError) {
            console.error("Error inserting new user profile:", insertError);
            showToast(`Erro ao criar perfil: ${insertError.message}`, 'error');
          } else {
            setUserProfile({ 
              uid: user.id, 
              ...newProfile,
              favoriteItems: [],
              itemFrequencies: {}
            } as any);
          }

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

  // Fetch latest prices
  useEffect(() => {
    if (!user) return;
    const fetchLatestPrices = async () => {
      try {
        const { data } = await supabase
          .from('prices')
          .select('*')
          .order('date', { ascending: false })
          .limit(5);
        if (data) setLatestPrices(data);
      } catch (e) {
        handleSupabaseError(e, OperationType.GET, 'prices');
      }
    };
    fetchLatestPrices();
    const channel = supabase.channel('public:prices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prices' }, fetchLatestPrices)
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
      if (data) {
        setLists(data as any);
        setSelectedList(current => {
          if (!current) return null;
          const exists = data.find(l => l.id === current.id);
          return exists ? (exists as any) : null;
        });
      }
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
      const { error } = await supabase.from('lists').insert([{
        user_id: user.id,
        name: newListName,
        created_at: new Date().toISOString(),
        item_count: 0,
        estimated_total: 0
      }]);
      if (error) {
        console.error("Supabase Insert Error:", error);
        showToast(`Erro ao criar lista: ${error.message}`, 'error');
        throw error;
      }
      
      setNewListName('');
      setIsAddingList(false);
      showToast('Lista criada com sucesso!', 'success');
      
      // Fetch lists again to update UI
      const { data } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setLists(data as any);
      }
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
          market: 'Mercado Local', // Mercado genérico até termos UI para selecionar
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
      setUserProfile({ ...userProfile, favoriteItems: newFavorites } as any);

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
        showToast('Processando Nota Fiscal...', 'info');
        
        // Em um ambiente real, aqui faríamos a chamada para a API da Sefaz
        // para extrair os itens da nota fiscal a partir da URL do QR Code.
        setTimeout(() => {
          showToast('Integração com a Sefaz necessária para ler itens reais.', 'error');
        }, 1500);

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

  if (!user) return <Auth />;

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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 backdrop-blur-md"
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
                className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedList.name}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShareList}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-gray-600 dark:text-zinc-400"
                  title="Compartilhar Lista"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowComparison(!showComparison)}
                  className={`p-2 rounded-full transition-colors ${showComparison ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-zinc-400'}`}
                  title="Comparar Mercados"
                >
                  <Store className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
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
                    placeholder="Adicionar item..."
                    className="w-full bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-6 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Plus className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                </div>
                <button
                  onClick={() => setShowFavoritesModal(true)}
                  className="bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 px-4 rounded-2xl border border-yellow-100 dark:border-yellow-500/20 shadow-sm hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors flex items-center justify-center flex-shrink-0"
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
                      className="flex-shrink-0 flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full text-sm font-medium border border-yellow-100 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
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
                    "bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border transition-all flex flex-col gap-3",
                    item.isBought ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/10" : "border-black/5 dark:border-white/5"
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
                          <Circle className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
                        )}
                      </button>
                      <h3 className={cn("font-medium truncate text-base text-gray-900 dark:text-white", item.isBought && "line-through text-gray-500 dark:text-zinc-500")}>
                        {item.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleFavorite(item.name)}
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          isFavorite 
                            ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/20" 
                            : "bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-zinc-500 hover:text-yellow-500 dark:hover:text-yellow-400"
                        )}
                        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
                      </button>
                      <button 
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors"
                        title="Ver histórico de preços"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-9">
                    <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-xl p-1 border border-gray-100 dark:border-white/5">
                      <button 
                        onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-white/5 focus-within:border-emerald-500/30 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">R$</span>
                        <CurrencyInput
                          value={item.price || 0}
                          onChange={(val) => updateItemPrice(item.id, val)}
                          className="w-16 bg-transparent text-sm font-bold focus:outline-none text-right text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => {
                            setScanningItemId(item.id);
                            setScannerMode('ocr');
                          }}
                          className="ml-1 p-1 text-gray-400 hover:text-emerald-500 transition-colors"
                          title="Escanear preço"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 font-medium">
                          Total: {formatCurrency(calculateItemTotal(item))}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {expandedItemId === item.id && item.productId && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                      <PriceHistoryChart productId={item.productId} />
                    </div>
                  )}
                  {expandedItemId === item.id && !item.productId && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 text-center text-sm text-gray-400">
                      Adicione um preço para gerar o histórico.
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>

            {/* Summary Bar */}
            <div className="fixed bottom-24 left-6 right-6 bg-black dark:bg-zinc-900 text-white p-6 rounded-[32px] shadow-2xl flex items-center justify-between z-40 border border-white/5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Total Comprado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBought)}</p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Itens</p>
                  <p className="text-lg font-semibold">{itemsBoughtCount} / {listItems.length}</p>
                </div>
                {itemsBoughtCount === listItems.length && listItems.length > 0 && !selectedList?.completed && (
                  <button
                    onClick={async () => {
                      if (!user || !selectedList) return;
                      try {
                        await supabase.from('lists').update({ completed: true }).eq('id', selectedList.id);
                        const res = await addPoints(user.id, POINTS.COMPLETE_LIST, 'Lista finalizada');
                        if (res) notifyPoints(POINTS.COMPLETE_LIST, 'Lista finalizada');
                        
                        // Update smart basket patterns
                        await updatePurchasePatterns(user.id, listItems);
                        
                        showToast('Compra finalizada com sucesso! Você ganhou pontos.', 'success');
                      } catch (error) {
                        console.error("Error completing list:", error);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    Finalizar
                  </button>
                )}
                {selectedList?.completed && (
                  <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Finalizada
                  </div>
                )}
              </div>
            </div>

            {/* Favorites Modal */}
            <AnimatePresence>
              {showFavoritesModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-black/5 dark:border-white/5"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Star className="text-yellow-500 fill-current w-6 h-6" />
                        Meus Favoritos
                      </h3>
                      <button 
                        onClick={() => setShowFavoritesModal(false)}
                        className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                      {userProfile?.favoriteItems && userProfile.favoriteItems.length > 0 ? (
                        [...userProfile.favoriteItems]
                          .sort((a, b) => (userProfile.itemFrequencies?.[b] || 0) - (userProfile.itemFrequencies?.[a] || 0))
                          .map((favName) => (
                          <div key={favName} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <span className="font-medium text-gray-800 dark:text-zinc-200">{favName}</span>
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
            {user && userProfile?.city && (
              <SmartBasketWidget userId={user.id} city={userProfile.city} />
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Minhas Listas</h2>
              <button 
                onClick={() => setIsAddingList(true)}
                className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Empty State */}
            {lists.length === 0 && !isAddingList && (
              <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] text-center border border-black/5 dark:border-white/5 shadow-sm">
                <div className="bg-gray-50 dark:bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <List className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Nenhuma lista ainda</h3>
                <p className="text-gray-400 text-sm mb-8">Comece criando uma lista para suas compras.</p>
                <button 
                  onClick={() => setIsAddingList(true)}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold"
                >
                  Criar minha primeira lista
                </button>
              </div>
            )}

            {/* Lists Grid */}
            <div className="grid gap-4">
              {lists.map((list) => (
                <motion.button
                  key={list.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedList(list)}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm text-left flex items-center justify-between group transition-all hover:shadow-md"
                >
                  <div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-gray-900 dark:text-white">{list.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{list.itemCount || 0} itens</span>
                      <span>•</span>
                      <span>{formatCurrency(list.estimatedTotal || 0)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-zinc-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <QuickActionCard 
                icon={<QrCode className="w-6 h-6" />}
                label="Escanear Nota"
                onClick={() => setScannerMode('qr')}
                color="bg-blue-500"
              />
              <QuickActionCard 
                icon={<Barcode className="w-6 h-6" />}
                label="Novo Produto"
                onClick={() => setScannerMode('barcode')}
                color="bg-purple-500"
              />
            </div>
          </motion.div>
        ) : activeTab === 'database' ? (
          <motion.div
            key="database"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold tracking-tight">Preços</h2>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                <TrendingDown className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-100">Onde economizar?</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">O Atacadão está com os melhores preços em Brasília hoje.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-widest text-gray-400">Últimos Preços Registrados</h3>
                {latestPrices.length > 0 ? (
                  latestPrices.map(price => (
                    <PriceItem key={price.id} name={price.product_id} price={price.price} market={price.market} />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum preço registrado ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-black dark:bg-zinc-900 text-white p-8 rounded-[40px] shadow-xl border border-white/5">
              <h3 className="text-xl font-bold mb-4">Banco Coletivo</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Já registramos mais de 1.240 preços hoje em sua cidade. Continue escaneando para ajudar a comunidade!
              </p>
              <div className="grid gap-3">
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Barcode className="w-5 h-5" />
                  Escanear Produto
                </button>
                <button 
                  onClick={() => setScannerMode('qr')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10"
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
                  className="w-32 h-32 rounded-[40px] object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
                  alt="Profile"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-2xl text-white shadow-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
              <div className="w-10" /> {/* Spacer */}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile?.displayName || user.user_metadata?.full_name}</h2>
              <p className="text-gray-400">{user.email}</p>
              {userProfile && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                    {userProfile.level}
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
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
                icon={isUpdatingLocation ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <MapPin className="w-5 h-5" />} 
                label={isUpdatingLocation ? 'Buscando localização...' : `Minha Cidade: ${userProfile?.city || 'Desconhecida'}`} 
                onClick={handleUpdateLocation}
              />
              
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">Privacidade e Dados (LGPD)</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl mb-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">Compartilhar dados anonimizados</p>
                      <p className="text-xs text-gray-500">Ajuda a melhorar os preços para todos</p>
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
                      (userProfile?.shareAnonymizedData ?? true) ? "bg-emerald-500" : "bg-gray-200 dark:bg-zinc-700"
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
                  className="w-full bg-red-50 dark:bg-red-500/10 text-red-500 py-4 px-6 rounded-2xl font-bold flex items-center justify-between mt-4 transition-colors hover:bg-red-100 dark:hover:bg-red-500/20"
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
                    className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-black/5 dark:border-white/5"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Excluir Conta</h3>
                    <p className="text-gray-600 dark:text-zinc-400 mb-6">
                      Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão apagados permanentemente.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white py-3 rounded-xl font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold"
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl relative z-70 border border-black/5"
            >
              <h3 className="text-2xl font-bold mb-6">Nova Lista</h3>
              <form onSubmit={handleCreateList} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Mercado do mês"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="flex-1 py-4 font-semibold text-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-500/20"
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
      className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm text-center flex flex-col items-center gap-3 active:scale-95 transition-all"
    >
      <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">{label}</span>
    </button>
  );
}

function PriceItem({ name, price, market }: { name: string; price: number; market: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/5 last:border-0">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{market}</p>
      </div>
      <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(price)}</p>
    </div>
  );
}

function ProfileButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
          {icon}
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
    </button>
  );
}
