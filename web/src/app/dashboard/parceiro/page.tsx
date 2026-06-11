'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Store, Star, Megaphone, TrendingUp, Settings,
  Plus, X, Edit3, CheckCircle, Clock, ExternalLink, Eye,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase, formatarBRL,
  type Estabelecimento, type CampanhaPromocional,
  ESTABELECIMENTO_CATEGORIA_LABELS, CAMPANHA_TIPO_LABELS,
  type CampanhaTipo,
} from '@/lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function ParceiroDashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [estab, setEstab] = useState<Estabelecimento | null>(null);
  const [campanhas, setCampanhas] = useState<CampanhaPromocional[]>([]);
  const [showEditEstab, setShowEditEstab] = useState(false);
  const [showNewCampanha, setShowNewCampanha] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state - estabelecimento
  const [editForm, setEditForm] = useState({ nome: '', descricao: '', telefone: '', whatsapp: '', site_url: '', instagram: '' });

  // Form state - campanha
  const [campForm, setCampForm] = useState({
    titulo: '', descricao: '', tipo: 'desconto' as CampanhaTipo,
    desconto_percentual: '', codigo_cupom: '', data_inicio: '', data_fim: '',
    uso_maximo: '',
  });

  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'parceiro') router.replace('/entrar');
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from('estabelecimentos').select('*').eq('parceiro_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const e = data as Estabelecimento;
          setEstab(e);
          setEditForm({
            nome: e.nome, descricao: e.descricao,
            telefone: e.telefone ?? '', whatsapp: e.whatsapp ?? '',
            site_url: e.site_url ?? '', instagram: e.instagram ?? '',
          });
        }
      });
  }, [user]);

  useEffect(() => {
    if (!estab) return;
    supabase.from('campanhas_promocionais').select('*').eq('estabelecimento_id', estab.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCampanhas(data as CampanhaPromocional[]); });
  }, [estab]);

  const saveEstab = async () => {
    if (!estab) return;
    setSaving(true);
    await supabase.from('estabelecimentos').update({
      nome: editForm.nome, descricao: editForm.descricao,
      telefone: editForm.telefone || null, whatsapp: editForm.whatsapp || null,
      site_url: editForm.site_url || null, instagram: editForm.instagram || null,
    }).eq('id', estab.id);
    setEstab({ ...estab, ...editForm, telefone: editForm.telefone || null, whatsapp: editForm.whatsapp || null, site_url: editForm.site_url || null, instagram: editForm.instagram || null });
    setShowEditEstab(false);
    setSaving(false);
  };

  const createCampanha = async () => {
    if (!estab) return;
    setSaving(true);
    const insert: Record<string, unknown> = {
      estabelecimento_id: estab.id,
      titulo: campForm.titulo,
      descricao: campForm.descricao,
      tipo: campForm.tipo,
      codigo_cupom: campForm.codigo_cupom || null,
      data_inicio: campForm.data_inicio,
      data_fim: campForm.data_fim,
      uso_maximo: campForm.uso_maximo ? parseInt(campForm.uso_maximo) : null,
    };
    if (campForm.tipo === 'desconto' && campForm.desconto_percentual) {
      insert.desconto_percentual = parseFloat(campForm.desconto_percentual);
    }
    const { data } = await supabase.from('campanhas_promocionais').insert(insert).select().single();
    if (data) setCampanhas([data as CampanhaPromocional, ...campanhas]);
    setShowNewCampanha(false);
    setCampForm({ titulo: '', descricao: '', tipo: 'desconto', desconto_percentual: '', codigo_cupom: '', data_inicio: '', data_fim: '', uso_maximo: '' });
    setSaving(false);
  };

  const toggleCampanha = async (id: string, ativo: boolean) => {
    await supabase.from('campanhas_promocionais').update({ ativo: !ativo }).eq('id', id);
    setCampanhas(campanhas.map(c => c.id === id ? { ...c, ativo: !ativo } : c));
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Painel do Parceiro' />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const firstName = profile.nome.split(' ')[0];
  const activeCampanhas = campanhas.filter(c => c.ativo);
  const catLabel = estab ? ESTABELECIMENTO_CATEGORIA_LABELS[estab.categoria] : null;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Parceiro · DNA Baixada</p>
            <h1 className="text-lg font-bold">Olá, {firstName}!</h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Estabelecimento" value={estab ? '1' : '0'} icon={<Store size={20} className="text-primary" />} />
          <StatCard label="Avaliação" value={estab?.avaliacao_media ? estab.avaliacao_media.toFixed(1) : '—'} icon={<Star size={20} className="text-accent-dark" />} />
          <StatCard label="Campanhas Ativas" value={String(activeCampanhas.length)} icon={<Megaphone size={20} className="text-secondary" />} />
          <StatCard label="Status" value={estab?.verificado ? 'Verificado' : 'Pendente'} icon={<CheckCircle size={20} className={estab?.verificado ? 'text-secondary' : 'text-accent-dark'} />} />
        </motion.div>

        {/* Meu Estabelecimento */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Meu Estabelecimento</h2>
            {estab && (
              <button onClick={() => setShowEditEstab(true)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <Edit3 size={12} /> Editar
              </button>
            )}
          </div>
          {estab ? (
            <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Store size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{estab.nome}</h3>
                    {estab.verificado && <CheckCircle size={14} className="text-secondary" />}
                  </div>
                  <p className="text-xs text-foreground-muted">{catLabel?.label} · {estab.bairro ?? estab.cidade}</p>
                  <p className="mt-1 text-sm text-foreground-secondary line-clamp-2">{estab.descricao}</p>
                  {estab.telefone && <p className="mt-1 text-xs text-foreground-muted">📞 {estab.telefone}</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`/parceiros/${estab.slug}`} className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                  <Eye size={12} /> Ver Página
                </a>
                <a href="/dashboard/parceiro/financeiro" className="flex items-center gap-1 rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-accent/20 transition">
                  <TrendingUp size={12} /> Financeiro
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
              <Store size={40} className="mx-auto text-foreground-muted/40" />
              <p className="mt-3 font-semibold text-foreground-secondary">Nenhum estabelecimento cadastrado</p>
              <p className="mt-1 text-sm text-foreground-muted">Entre em contato com o administrador.</p>
            </div>
          )}
        </motion.div>

        {/* Campanhas */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Campanhas Promocionais</h2>
            {estab && (
              <button onClick={() => setShowNewCampanha(true)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <Plus size={12} /> Nova Campanha
              </button>
            )}
          </div>
          {campanhas.length > 0 ? (
            <div className="space-y-3">
              {campanhas.map(c => {
                const cfg = CAMPANHA_TIPO_LABELS[c.tipo] ?? { label: c.tipo, color: '#0d2d73' };
                const isActive = c.ativo && new Date(c.data_fim) >= new Date();
                return (
                  <div key={c.id} className={`rounded-2xl border bg-surface-elevated p-4 shadow-sm ${isActive ? 'border-border' : 'border-border/50 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground">{c.titulo}</h4>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: cfg.color }}>
                            {cfg.label}
                          </span>
                          {!c.ativo && <span className="text-[10px] text-foreground-muted">Inativa</span>}
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">{c.descricao}</p>
                        <div className="flex gap-3 mt-1.5 text-xs text-foreground-muted">
                          {c.desconto_percentual && <span>{c.desconto_percentual}% off</span>}
                          {c.codigo_cupom && <span className="font-mono bg-background-tertiary px-1.5 py-0.5 rounded">{c.codigo_cupom}</span>}
                          <span className="flex items-center gap-1"><Clock size={10} /> {c.data_inicio} → {c.data_fim}</span>
                          <span>{c.usos_realizados}/{c.uso_maximo ?? '∞'} usos</span>
                        </div>
                      </div>
                      <button onClick={() => toggleCampanha(c.id, c.ativo)} className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${c.ativo ? 'bg-accent2/10 text-accent2 hover:bg-accent2/20' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}>
                        {c.ativo ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 text-center">
              <Megaphone size={32} className="mx-auto text-foreground-muted/40" />
              <p className="mt-2 text-sm text-foreground-muted">Nenhuma campanha criada</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Editar Estabelecimento */}
      <AnimatePresence>
        {showEditEstab && (
          <Modal onClose={() => setShowEditEstab(false)} title="Editar Estabelecimento">
            <Field label="Nome" value={editForm.nome} onChange={v => setEditForm({ ...editForm, nome: v })} />
            <Field label="Descrição" value={editForm.descricao} onChange={v => setEditForm({ ...editForm, descricao: v })} multiline />
            <Field label="Telefone" value={editForm.telefone} onChange={v => setEditForm({ ...editForm, telefone: v })} />
            <Field label="WhatsApp" value={editForm.whatsapp} onChange={v => setEditForm({ ...editForm, whatsapp: v })} />
            <Field label="Site" value={editForm.site_url} onChange={v => setEditForm({ ...editForm, site_url: v })} />
            <Field label="Instagram" value={editForm.instagram} onChange={v => setEditForm({ ...editForm, instagram: v })} />
            <button onClick={saveEstab} disabled={saving} className="mt-4 w-full rounded-xl bg-primary py-3 text-white font-bold transition hover:bg-primary-light disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Nova Campanha */}
      <AnimatePresence>
        {showNewCampanha && (
          <Modal onClose={() => setShowNewCampanha(false)} title="Nova Campanha">
            <Field label="Título" value={campForm.titulo} onChange={v => setCampForm({ ...campForm, titulo: v })} />
            <Field label="Descrição" value={campForm.descricao} onChange={v => setCampForm({ ...campForm, descricao: v })} multiline />
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-foreground-muted">Tipo</label>
              <select value={campForm.tipo} onChange={e => setCampForm({ ...campForm, tipo: e.target.value as CampanhaTipo })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
                {Object.entries(CAMPANHA_TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            {campForm.tipo === 'desconto' && (
              <Field label="Desconto (%)" value={campForm.desconto_percentual} onChange={v => setCampForm({ ...campForm, desconto_percentual: v })} />
            )}
            <Field label="Código do Cupom" value={campForm.codigo_cupom} onChange={v => setCampForm({ ...campForm, codigo_cupom: v })} />
            <Field label="Data Início" value={campForm.data_inicio} onChange={v => setCampForm({ ...campForm, data_inicio: v })} type="date" />
            <Field label="Data Fim" value={campForm.data_fim} onChange={v => setCampForm({ ...campForm, data_fim: v })} type="date" />
            <Field label="Uso Máximo" value={campForm.uso_maximo} onChange={v => setCampForm({ ...campForm, uso_maximo: v })} />
            <button onClick={createCampanha} disabled={saving} className="mt-4 w-full rounded-xl bg-secondary py-3 text-white font-bold transition hover:opacity-90 disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar Campanha'}
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Components ── */
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5">{icon}</div>
        <div>
          <p className="text-lg font-extrabold text-foreground">{value}</p>
          <p className="text-[11px] font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-elevated p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-background-tertiary"><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, multiline, type }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  const cls = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20';
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-foreground-muted">{label}</label>
      {multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls} /> : <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
