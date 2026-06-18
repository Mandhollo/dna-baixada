'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';
import type { Notificacao } from '@/lib/supabase';

/** Time ago helper */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notificacoes?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notificacoes ?? []);
      setUnreadCount(data.nao_lidas ?? 0);
    } catch {
      // Silently fail
    }
  }, []);

  // Poll on mount + every 30s when open
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Mark single as read ──
  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notificacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  // ── Mark all as read ──
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notificacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcar_todas: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold leading-none text-primary">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-primary-light/95 shadow-2xl shadow-black/40 backdrop-blur-xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#F5A623] transition-colors hover:bg-[#F5A623]/10 disabled:opacity-50"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/50">
                Nenhuma notificação ainda
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.lida) markAsRead(notif.id);
                    if (notif.link) {
                      window.location.href = notif.link;
                    }
                  }}
                  className={`group relative cursor-pointer border-b border-white/5 px-4 py-3 transition-colors ${
                    notif.lida
                      ? 'bg-transparent hover:bg-white/5'
                      : 'bg-[#F5A623]/5 hover:bg-[#F5A623]/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {notif.lida ? (
                        <div className="h-2 w-2 rounded-full bg-white/20" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-[#F5A623] shadow-sm shadow-[#F5A623]/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          notif.lida ? 'font-medium text-white/80' : 'font-semibold text-white'
                        }`}
                      >
                        {notif.titulo}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                        {notif.mensagem}
                      </p>
                      <span className="mt-1 inline-block text-[10px] text-white/30">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    {/* Mark as read button (unread only) */}
                    {!notif.lida && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="mt-1 flex-shrink-0 rounded p-1 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                        title="Marcar como lida"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                href="/notificacoes"
                className="block text-center text-xs font-medium text-[#F5A623] transition-colors hover:text-[#e6951a]"
              >
                Ver todas as notificações
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
