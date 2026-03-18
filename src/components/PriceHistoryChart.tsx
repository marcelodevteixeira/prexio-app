import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PriceRecord } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  productId: string;
}

export function PriceHistoryChart({ productId }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!productId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: prices } = await supabase.from('prices').select('*').eq('product_id', productId).order('date', { ascending: true });
        
        // Format data for chart
        const chartData = prices.map(p => ({
          date: format(parseISO(p.date), 'dd/MM', { locale: ptBR }),
          price: p.price,
          market: p.market
        }));
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching price history:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [productId]);

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-slate-500">Carregando histórico...</div>;
  }

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-500">Sem histórico de preços.</div>;
  }

  const lowestPrice = Math.min(...data.map(d => d.price));
  const highestPrice = Math.max(...data.map(d => d.price));

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-slate-300">Histórico de Preços</h4>
        <div className="flex gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-slate-500">Menor</span>
            <span className="font-bold text-emerald-400">{formatCurrency(lowestPrice)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500">Maior</span>
            <span className="font-bold text-red-400">{formatCurrency(highestPrice)}</span>
          </div>
        </div>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [formatCurrency(value), props.payload.market || 'Preço']}
              labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} 
              activeDot={{ r: 5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
