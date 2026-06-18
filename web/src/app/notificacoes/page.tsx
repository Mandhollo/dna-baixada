'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase, type Notificacao } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import PageTitle from '@/components/seo/PageTitle';

export default function NotificacoesPage() {
  const { user, loading: authLoading } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotificacoes(data as Notificacao[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotificacoes().finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchNotificacoes]);

  const handleMarcarLida = async (id: string) => {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  const handleMarcarTodas = async () => {
    if (!user) return;
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', user.id).eq('lida', false);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const handleDeletar = async (id: string) => {
    await supabase.from('notificacoes').delete().eq('id', id);
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTitle title="Notificações — DNA Baixada" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          {notificacoes.some((n) => !n.lida) && (
            <button
              onClick={handleMarcarTodas}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
            >
              <Check className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notificações
        </h1>

        {notificacoes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma notificação ainda</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.lida
                    ? 'bg-white border-gray-100'
                    : 'bg-primary/[0.03] border-primary/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {!n.lida && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#F5A623] mb-1" />
                  )}
                  <p className="font-semibold text-primary text-sm">{n.titulo}</p>
                  {n.mensagem && (
                    <p className="text-sm text-gray-600 mt-0.5">{n.mensagem}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.lida && (
                    <button
                      onClick={() => handleMarcarLida(n.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletar(n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#E84855] hover:bg-[#E84855]/10 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
