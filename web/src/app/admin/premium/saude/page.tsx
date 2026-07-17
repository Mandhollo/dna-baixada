'use client';

import PageTitle from '@/components/seo/PageTitle';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { HeartPulse, ArrowLeft, Plus, Loader2, MapPin, Video, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ParceiroSaude } from '@/lib/supabase';

export default function AdminSaudePage() {
  const [parceiros, setParceiros] = useState<ParceiroSaude[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('parceiros_saude').select('*').order('ordem', { ascending: true }).then(({ data }) => {
      if (data) setParceiros(data as ParceiroSaude[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Saúde" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <HeartPulse className="w-6 h-6" /> Parceiros de Saúde
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie psicólogos, nutricionistas, clínicas e mais</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary-dark">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : parceiros.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum parceiro de saúde cadastrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parceiros.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-primary mb-1">{p.nome}</h3>
              <p className="text-xs text-gray-400 mb-2">{p.tipo}</p>
              {p.desconto_descricao && <p className="text-sm text-secondary font-medium mb-2">{p.desconto_descricao}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3 h-3" /> {p.cidade}
                {p.atendimento_online && <span className="flex items-center gap-1 text-primary"><Video className="w-3 h-3" /> Online</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
