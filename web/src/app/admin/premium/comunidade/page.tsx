'use client';

import PageTitle from '@/components/seo/PageTitle';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, ArrowLeft, Loader2, MessageCircle, ChevronUp, Pin, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ComunidadeTopico } from '@/lib/supabase';

export default function AdminComunidadePage() {
  const [topicos, setTopicos] = useState<ComunidadeTopico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('comunidade_topicos')
      .select('*, autor:profiles(nome, foto_url)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTopicos(data as unknown as ComunidadeTopico[]);
        setLoading(false);
      });
  }, []);

  const fixarTopico = async (id: string, atual: boolean) => {
    await supabase.from('comunidade_topicos').update({ fixado: !atual }).eq('id', id);
    setTopicos((prev) => prev.map((t) => (t.id === id ? { ...t, fixado: !atual } : t)));
  };

  const desativarTopico = async (id: string) => {
    await supabase.from('comunidade_topicos').update({ ativo: false }).eq('id', id);
    setTopicos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Comunidade" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="w-6 h-6" /> Moderação da Comunidade
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie tópicos, fixe avisos e remova conteúdo inadequado</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : topicos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum tópico na comunidade ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topicos.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {t.fixado && <Pin className="w-4 h-4 text-accent shrink-0" />}
                  <h3 className="font-bold text-primary text-sm truncate">{t.titulo}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>{t.autor?.nome || 'Desconhecido'}</span>
                  <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" /> {t.total_votos}</span>
                  <span>{t.total_respostas} respostas</span>
                  <span>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => fixarTopico(t.id, t.fixado)} className={`p-2 rounded-lg transition-colors ${t.fixado ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <Pin className="w-4 h-4" />
                </button>
                <button onClick={() => desativarTopico(t.id)} className="p-2 rounded-lg text-accent2 hover:bg-accent2/10 transition-colors">
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
