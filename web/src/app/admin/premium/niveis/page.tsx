'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Crown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MotoristaNivel } from '@/lib/supabase';

const FALLBACK_NIVEIS: MotoristaNivel[] = [
  { id: '1', nome: 'Bronze', slug: 'bronze', ordem: 1, cor_hex: '#CD7F32', cor_gradiente: 'from-orange-700 to-amber-800', icone: 'shield', avaliacao_minima: 4.0, tempo_plataforma_meses: 0, corridas_minimas: 0, taxa_cancelamento_maxima: 100, treinamentos_minimos: 0, beneficios: ['Acesso à plataforma', 'Central de Benefícios básica'], comissao_percentual: 20, prioridade_corridas: 5, descricao: 'Início da jornada', ativo: true },
  { id: '2', nome: 'Prata', slug: 'prata', ordem: 2, cor_hex: '#C0C0C0', cor_gradiente: 'from-gray-400 to-gray-600', icone: 'shield-check', avaliacao_minima: 4.3, tempo_plataforma_meses: 1, corridas_minimas: 50, taxa_cancelamento_maxima: 15, treinamentos_minimos: 1, beneficios: ['Comissão 18%', 'Maior visibilidade'], comissao_percentual: 18, prioridade_corridas: 4, descricao: 'Motorista em evolução', ativo: true },
  { id: '3', nome: 'Ouro', slug: 'ouro', ordem: 3, cor_hex: '#FFD700', cor_gradiente: 'from-yellow-400 to-amber-600', icone: 'award', avaliacao_minima: 4.6, tempo_plataforma_meses: 3, corridas_minimas: 200, taxa_cancelamento_maxima: 10, treinamentos_minimos: 3, beneficios: ['Comissão 16%', 'Prioridade executivo'], comissao_percentual: 16, prioridade_corridas: 3, descricao: 'Excelência reconhecida', ativo: true },
  { id: '4', nome: 'Platinum', slug: 'platinum', ordem: 4, cor_hex: '#E5E4E2', cor_gradiente: 'from-slate-300 to-slate-500', icone: 'crown', avaliacao_minima: 4.8, tempo_plataforma_meses: 6, corridas_minimas: 500, taxa_cancelamento_maxima: 7, treinamentos_minimos: 5, beneficios: ['Comissão 14%', 'Transfer cruzeiros'], comissao_percentual: 14, prioridade_corridas: 2, descricao: 'Elite dos motoristas', ativo: true },
  { id: '5', nome: 'Elite', slug: 'elite', ordem: 5, cor_hex: '#00CEC9', cor_gradiente: 'from-cyan-400 to-teal-600', icone: 'gem', avaliacao_minima: 4.9, tempo_plataforma_meses: 12, corridas_minimas: 1000, taxa_cancelamento_maxima: 5, treinamentos_minimos: 8, beneficios: ['Comissão 12%', 'Máxima prioridade'], comissao_percentual: 12, prioridade_corridas: 1, descricao: 'O mais alto nível', ativo: true },
];

export default function AdminNiveisPage() {
  const [niveis, setNiveis] = useState<MotoristaNivel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('motorista_niveis')
      .select('*')
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setNiveis(data as MotoristaNivel[]);
        setLoading(false);
      });
  }, []);

  const niveisDisplay = niveis.length > 0 ? niveis : FALLBACK_NIVEIS;

  const toggleAtivo = async (id: string, atual: boolean) => {
    if (id.startsWith('1') || id.startsWith('2') || id.startsWith('3') || id.startsWith('4') || id.startsWith('5')) return;
    await supabase.from('motorista_niveis').update({ ativo: !atual }).eq('id', id);
    setNiveis((prev) => prev.map((n) => (n.id === id ? { ...n, ativo: !atual } : n)));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Níveis" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-6 h-6" /> Sistema de Níveis
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os níveis e seus critérios</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {niveisDisplay.map((nivel) => (
            <div key={nivel.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
              <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${nivel.cor_gradiente} flex items-center justify-center shadow-md`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-primary">{nivel.nome}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${nivel.cor_hex}15`, color: nivel.cor_hex }}>
                    Nível {nivel.ordem}
                  </span>
                  <span className="text-xs font-bold text-secondary">Comissão {nivel.comissao_percentual}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aval. ≥{nivel.avaliacao_minima} · {nivel.corridas_minimas} corridas · {nivel.tempo_plataforma_meses}+ meses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAtivo(nivel.id, nivel.ativo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${nivel.ativo ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400'}`}
                >
                  {nivel.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
