import React, { useState } from 'react';
import { Download, ExternalLink, Plus, ShieldBan, Pencil, Save, Trash2, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FocusBlockedSite } from '../hooks/useAppLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FocusBlocklistManagerProps {
  blockedSites: FocusBlockedSite[];
  blocklistLoading: boolean;
  addBlockedSite: (domain: string) => Promise<boolean>;
  updateBlockedSite: (id: string, domain: string) => Promise<boolean>;
  removeBlockedSite: (id: string) => Promise<boolean>;
}

export function FocusBlocklistManager({
  blockedSites,
  blocklistLoading,
  addBlockedSite,
  updateBlockedSite,
  removeBlockedSite,
}: FocusBlocklistManagerProps) {
  const extensionStoreUrl = import.meta.env.VITE_EXTENSION_STORE_URL as string | undefined;
  const [newBlockedSite, setNewBlockedSite] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState('');
  const [sitePendingDelete, setSitePendingDelete] = useState<FocusBlockedSite | null>(null);

  const handleAddBlockedSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addBlockedSite(newBlockedSite);
    if (created) {
      setNewBlockedSite('');
    }
  };

  const startEditingSite = (site: FocusBlockedSite) => {
    setEditingSiteId(site.id);
    setEditingDomain(site.domain);
  };

  const cancelEditingSite = () => {
    setEditingSiteId(null);
    setEditingDomain('');
  };

  const saveEditingSite = async (siteId: string) => {
    const updated = await updateBlockedSite(siteId, editingDomain);
    if (updated) {
      cancelEditingSite();
    }
  };

  const confirmDeleteSite = async () => {
    if (!sitePendingDelete) return;
    const removed = await removeBlockedSite(sitePendingDelete.id);
    if (removed) {
      setSitePendingDelete(null);
    }
  };

  return (
    <>
      <div className="w-full space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyber-red/15 border border-cyber-red/20 flex items-center justify-center">
            <ShieldBan size={16} className="text-cyber-red" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Blindagem de Sites</p>
            <p className="text-xs text-white/60">A extensão usa essa lista durante o modo foco.</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-cyber-red/20 bg-cyber-red/10 text-cyber-red whitespace-nowrap">
          {blockedSites.length} bloqueado{blockedSites.length === 1 ? '' : 's'}
        </span>
      </div>

      <form onSubmit={handleAddBlockedSite} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        <input
          type="text"
          value={newBlockedSite}
          onChange={(event) => setNewBlockedSite(event.target.value)}
          placeholder="Adicionar domínio ex: youtube.com"
          className="w-full min-h-12 glass-input border-white/10 text-base sm:text-sm placeholder:text-white/25 px-4"
        />
        <button type="submit" className="w-full md:w-auto px-5 py-3 btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
          <Plus size={16} />
          Bloquear
        </button>
      </form>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {blocklistLoading ? (
          <div className="py-6 text-center text-white/20 animate-pulse">Carregando blindagem...</div>
        ) : blockedSites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/35">
            Nenhum site protegido ainda. Adicione domínios para a extensão bloquear quando o foco ativar.
          </div>
        ) : (
          blockedSites.map((site) => {
            const isEditing = editingSiteId === site.id;

            return (
              <div
                key={site.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editingDomain}
                    onChange={(event) => setEditingDomain(event.target.value)}
                    className="w-full glass-input border-white/10 text-sm"
                    autoFocus
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{site.domain}</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/25">Ativo na próxima sessão sincronizada</p>
                  </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEditingSite(site.id)}
                        className="p-2 rounded-lg text-cyber-red bg-cyber-red/10 hover:bg-cyber-red/15 transition-colors"
                        title="Salvar"
                      >
                        <Save size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingSite}
                        className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-colors"
                        title="Cancelar"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditingSite(site)}
                        className="p-2 rounded-lg text-white/35 hover:text-cyber-red hover:bg-cyber-red/5 transition-colors"
                        title="Editar domínio"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSitePendingDelete(site)}
                        className="p-2 rounded-lg text-white/35 hover:text-cyber-red hover:bg-cyber-red/5 transition-colors"
                        title="Remover domínio"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-white/70">
          <Download size={16} className="text-cyber-red" />
          <p className="text-[11px] font-bold uppercase tracking-widest">Extensão do Navegador</p>
        </div>
        <p className="mt-2 text-xs text-white/45 leading-relaxed">
          Novo operador? Instale a extensão e faça login com a mesma conta para ativar o bloqueio automático durante o foco.
        </p>
        <a
          href={extensionStoreUrl || '#'}
          target={extensionStoreUrl ? "_blank" : "_self"}
          rel="noreferrer"
          className={cn(
            "mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm",
            extensionStoreUrl 
              ? "border-cyber-red/20 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20" 
              : "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!extensionStoreUrl) {
              e.preventDefault();
              alert("A extensão RedLine está em processo de homologação na loja oficial. Você pode instalá-la manualmente seguindo o guia de produção!");
            }
          }}
        >
          {extensionStoreUrl ? 'Abrir página da extensão' : 'Extensão em Homologação'}
          <ExternalLink size={14} />
        </a>
        {!extensionStoreUrl && (
          <p className="mt-2 text-[10px] text-white/20 italic">
            Configuração pendente: VITE_EXTENSION_STORE_URL
          </p>
        )}
      </div>
      </div>

      {sitePendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyber-red/20 bg-[#0A0203] p-6">
            <h3 className="text-lg font-display font-bold text-white">Remover domínio bloqueado?</h3>
            <p className="mt-2 text-sm text-white/50">
              O domínio <span className="text-white font-semibold">{sitePendingDelete.domain}</span> deixará de ser bloqueado no modo foco.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSitePendingDelete(null)}
                className="px-4 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteSite()}
                className="px-4 py-2 rounded-lg bg-cyber-red/20 border border-cyber-red/35 text-cyber-red hover:bg-cyber-red/30 transition-colors"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}