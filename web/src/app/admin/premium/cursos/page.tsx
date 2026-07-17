'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Users,
  Award,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Curso } from '@/lib/supabase';

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cursos')
      .select('*')
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (data) setCursos(data as Curso[]);
        setLoading(false);
      });
  }, []);

  const toggleAtivo = async (id: string, atual: boolean) => {
    await supabase.from('cursos').update({ ativo: !atual }).eq('id', id);
    setCursos((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !atual } : c)));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle title="Admin — Cursos" />
      <Link href="/admin/premium" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Cursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os cursos disponíveis</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" /> Novo Curso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum curso cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cursos.map((curso) => (
            <div key={curso.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-primary">{curso.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{curso.categoria} · {curso.nivel}</p>
                </div>
                <button
                  onClick={() => toggleAtivo(curso.id, curso.ativo)}
                  className="shrink-0"
                >
                  {curso.ativo ? (
                    <ToggleRight className="w-8 h-8 text-secondary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{curso.descricao}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {curso.total_matriculas} matriculados
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> {curso.total_concluidos} concluídos
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-accent" /> {curso.pontos_recompensa} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
