'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  HeartPulse,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Phone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BeneficioParceiro, ParceiroSaude } from '@/lib/supabase';

export default function AdminBeneficiosPage() {
  const [aba, setAba] = useState<'beneficios' | 'saude'>('beneficios');
  const [beneficios, setBeneficios] = useState<BeneficioParceiro[]>([]);
  const [saude, setSaude] = useState<ParceiroSaude[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      supabase.from('beneficios_parceiros').select('*').order('ordem', { ascending: true }).then(({ data }) => data && setBeneficios(data as BeneficioParceiro[])),
      supabase.from('parceiros_saude').select('*').order('ordem', { ascending: true }).then(({ data }) => data && setSaude(data as ParceiroSaude[])),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleBeneficio = async (id: string, atual: boolean) => {
    await supabase.from('beneficios_parceiros').update({ ativo: !atual }).eq('id', id);
    setBeneficios((prev) => prev.map((b) => (b.id === id ? { ...b, ativo: !atual } : b)));
  };

  const toggleSaude = async (id: string, atual: boolean) => {
    await supabase.from('parceiros_saude').update({ ativo: !atual }).eq('id', id);
    setSaude((prev) => prev.map((s) => (s.id === id ? { ...s, ativo: !atual } : s)));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Benefícios e Saúde" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> Benefícios & Saúde
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie parceiros e convênios</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAba('beneficios')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${aba === 'beneficios' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <Sparkles className="w-4 h-4 inline mr-1" /> Benefícios ({beneficios.length})
        </button>
        <button
          onClick={() => setAba('saude')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${aba === 'saude' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          <HeartPulse className="w-4 h-4 inline mr-1" /> Saúde ({saude.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : aba === 'beneficios' ? (
        beneficios.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum benefício cadastrado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Desconto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cidade</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {beneficios.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">{b.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{b.categoria}</td>
                    <td className="px-4 py-3 text-secondary font-medium">{b.desconto_descricao}</td>
                    <td className="px-4 py-3 text-gray-500">{b.cidade}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleBeneficio(b.id, b.ativo)}>
                        {b.ativo ? <ToggleRight className="w-7 h-7 text-secondary inline" /> : <ToggleLeft className="w-7 h-7 text-gray-300 inline" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        saude.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum parceiro de saúde cadastrado.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {saude.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-primary">{s.nome}</h3>
                    <p className="text-xs text-gray-400">{s.tipo}</p>
                  </div>
                  <button onClick={() => toggleSaude(s.id, s.ativo)}>
                    {s.ativo ? <ToggleRight className="w-7 h-7 text-secondary" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                  </button>
                </div>
                {s.desconto_descricao && (
                  <p className="text-sm text-secondary font-medium mb-1">{s.desconto_descricao}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.cidade}</span>
                  {s.atendimento_online && <span className="text-primary">Online</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
