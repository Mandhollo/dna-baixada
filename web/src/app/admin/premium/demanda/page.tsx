'use client';

import PageTitle from '@/components/seo/PageTitle';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, Plus, Loader2, Calendar, TrendingUp, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DemandaRegiao, DemandaEvento } from '@/lib/supabase';

export default function AdminDemandaPage() {
  const [regioes, setRegioes] = useState<DemandaRegiao[]>([]);
  const [eventos, setEventos] = useState<DemandaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'regioes' | 'eventos'>('regioes');

  useEffect(() => {
    Promise.allSettled([
      supabase.from('demanda_regioes').select('*').order('nivel_demanda', { ascending: false }).then(({ data }) => data && setRegioes(data as DemandaRegiao[])),
      supabase.from('demanda_eventos').select('*').order('data_inicio', { ascending: true }).then(({ data }) => data && setEventos(data as DemandaEvento[])),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Demanda" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <MapPin className="w-6 h-6" /> Previsão de Demanda
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie regiões e eventos de demanda</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary-dark">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setAba('regioes')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${aba === 'regioes' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          <MapPin className="w-4 h-4 inline mr-1" /> Regiões ({regioes.length})
        </button>
        <button onClick={() => setAba('eventos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${aba === 'eventos' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          <Calendar className="w-4 h-4 inline mr-1" /> Eventos ({eventos.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : aba === 'regioes' ? (
        <div className="space-y-3">
          {regioes.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-primary">{r.nome}</h3>
                <p className="text-xs text-gray-400">{r.cidade} {r.bairro ? `· ${r.bairro}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.nivel_demanda}%`, backgroundColor: r.cor_hex }} />
                </div>
                <span className="text-sm font-bold w-10" style={{ color: r.cor_hex }}>{r.nivel_demanda}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {eventos.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-primary">{e.nome}</h3>
                <span className="text-xs bg-accent2/10 text-accent2 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{e.aumento_demanda_percentual}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{e.cidade} · {new Date(e.data_inicio).toLocaleDateString('pt-BR')}</p>
              {e.recomendacao && (
                <div className="flex items-start gap-2 text-xs text-accent-dark bg-accent/5 rounded-lg p-2 mt-2">
                  <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {e.recomendacao}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
