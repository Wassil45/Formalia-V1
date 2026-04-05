import React, { useState } from 'react';
import { X, Mail, Phone, Calendar, Clock, Building, MapPin, Edit, MoreVertical, Shield, User, FileText, Activity, Settings, RefreshCw, LogOut, Trash2, CheckCircle2, AlertTriangle, FolderOpen } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUpdateUser, useChangeUserRole, useToggleUserStatus, useResendInvite, useUserAuditLogs, useRevokeSessions } from '../../hooks/useAdminUsers';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface UserDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    siret?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    role: 'client' | 'admin';
    is_active: boolean;
    created_at?: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  } | null;
  dossiers: { id: string; status: string; price?: number; reference?: string; formalite?: { title?: string }; created_at: string }[];
  onEdit: () => void;
  onDelete: () => void;
}

export function UserDetailPanel({ isOpen, onClose, user, dossiers, onEdit, onDelete }: UserDetailPanelProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profil' | 'dossiers' | 'activite' | 'parametres'>('profil');
  const [notes, setNotes] = useState(user?.notes || '');
  const updateUserMutation = useUpdateUser(user?.id || '');
  const changeRoleMutation = useChangeUserRole();
  const toggleStatusMutation = useToggleUserStatus();
  const resendInviteMutation = useResendInvite();
  const revokeSessionsMutation = useRevokeSessions();
  const { data: auditLogs, isLoading: isLoadingAudit } = useUserAuditLogs(user?.id || '');

  if (!isOpen || !user) return null;

  const handleNotesBlur = () => {
    if (notes !== user.notes) {
      updateUserMutation.mutate({ notes }, {
        onSuccess: () => toast.success('Notes enregistrées')
      });
    }
  };

  const handleRoleChange = () => {
    if (user.id === currentUser?.id) {
      alert("Vous ne pouvez pas modifier votre propre rôle depuis cette interface. Allez dans Mon profil.");
      return;
    }
    const newRole = user.role === 'admin' ? 'client' : 'admin';
    if (newRole === 'admin') {
      if (!window.confirm(`Promouvoir ${user.first_name} en administrateur ? Il aura accès à toutes les données et fonctions admin.`)) {
        return;
      }
    }
    changeRoleMutation.mutate({ id: user.id, role: newRole }, {
      onSuccess: () => toast.success(`Rôle modifié en ${newRole}`)
    });
  };

  const handleStatusToggle = () => {
    if (user.id === currentUser?.id) {
      alert("Vous ne pouvez pas désactiver votre propre compte depuis cette interface. Allez dans Mon profil.");
      return;
    }
    if (user.is_active) {
      if (!window.confirm('Le client sera déconnecté de toutes ses sessions. Confirmer ?')) {
        return;
      }
    }
    toggleStatusMutation.mutate({ id: user.id, is_active: !user.is_active }, {
      onSuccess: () => toast.success(`Compte ${!user.is_active ? 'activé' : 'désactivé'}`)
    });
  };

  const handleResendInvite = () => {
    resendInviteMutation.mutate(user.id);
  };

  const totalSpent = dossiers.reduce((sum, d) => sum + (d.price || 0), 0);
  const activeDossiers = dossiers.filter(d => d.status !== 'completed' && d.status !== 'rejected').length;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-[500px] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-white/20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* PANEL HEADER */}
        <div className="p-6 border-b border-slate-200/50 bg-slate-50/50 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-5">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
              {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-2xl font-bold text-slate-900 font-display leading-tight">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                  {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {user.role === 'admin' ? 'Admin' : 'Client'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                  {user.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-6">
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-sm font-medium transition-all shadow-sm">
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors shadow-sm">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200/50 px-6 bg-slate-50/30 overflow-x-auto custom-scrollbar">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'dossiers', label: 'Dossiers', icon: FolderOpen },
            { id: 'activite', label: 'Activité', icon: Activity },
            { id: 'parametres', label: 'Paramètres', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profil' | 'dossiers' | 'activite' | 'parametres')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
          
          {/* TAB: PROFIL */}
          {activeTab === 'profil' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informations personnelles</h4>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Téléphone</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {user.phone || '—'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Date d'inscription</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {user.created_at ? format(new Date(user.created_at), 'dd MMMM yyyy', { locale: fr }) : '—'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Dernier accès</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true, locale: fr }) : 'Jamais connecté'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Statut email</div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {user.email_confirmed_at ? (
                        <span className="text-green-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Confirmé</span>
                      ) : (
                        <span className="text-orange-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Non confirmé</span>
                      )}
                    </div>
                    {!user.email_confirmed_at && (
                      <button 
                        onClick={handleResendInvite}
                        disabled={resendInviteMutation.isPending}
                        className="text-xs text-blue-600 hover:underline mt-1 disabled:opacity-50"
                      >
                        {resendInviteMutation.isPending ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informations professionnelles</h4>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Société</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Building className="w-4 h-4 text-slate-400" />
                      {user.company_name || '—'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">SIRET</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {user.siret || '—'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Adresse</div>
                    <div className="flex items-start gap-2 text-sm font-medium text-slate-900">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div>{user.address || '—'}</div>
                        {(user.postal_code || user.city) && (
                          <div>{user.postal_code} {user.city}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="pt-6 border-t border-slate-200/50">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes internes (non visible par le client)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm"
                    placeholder="Ajoutez des notes sur ce client..."
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">Sauvegarde automatique</div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DOSSIERS */}
          {activeTab === 'dossiers' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-sm text-slate-500">Total</div>
                  <div className="text-xl font-bold text-slate-900">{dossiers.length} dossiers</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="text-sm text-slate-500">En cours</div>
                  <div className="text-xl font-bold text-blue-600">{activeDossiers}</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="text-sm text-slate-500">Dépensé</div>
                  <div className="text-xl font-bold text-slate-900">{totalSpent}€</div>
                </div>
              </div>

              <div className="space-y-3">
                {dossiers.slice(0, 10).map(dossier => (
                  <div key={dossier.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors shadow-sm cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{dossier.reference}</span>
                      <span className="text-sm font-bold text-slate-900">{dossier.price}€</span>
                    </div>
                    <div className="font-medium text-slate-900 text-sm mb-2">{dossier.formalite?.title || 'Formalité'}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{format(new Date(dossier.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{dossier.status}</span>
                    </div>
                  </div>
                ))}
                {dossiers.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">Aucun dossier pour ce client.</div>
                )}
                {dossiers.length > 10 && (
                  <button className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    Voir tous les dossiers →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: ACTIVITÉ */}
          {activeTab === 'activite' && (
            <div className="animate-in fade-in duration-300">
              <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Historique des modifications admin</h4>
              
              {isLoadingAudit ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                  {auditLogs.map((log: { id: string; action: string; admin?: { first_name?: string; last_name?: string }; created_at: string; details?: Record<string, unknown> }) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
                      <div className="text-sm font-medium text-slate-900">
                        {log.action === 'user_created' && 'Compte créé'}
                        {log.action === 'user_updated' && 'Profil mis à jour'}
                        {log.action === 'role_changed' && 'Rôle modifié'}
                        {log.action === 'status_toggled' && 'Statut modifié'}
                        {log.action === 'password_reset_sent' && 'Email de réinitialisation envoyé'}
                        {log.action === 'sessions_revoked' && 'Sessions révoquées'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Par {log.admin?.first_name} {log.admin?.last_name} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">Aucun historique disponible.</div>
              )}
            </div>
          )}

          {/* TAB: PARAMÈTRES */}
          {activeTab === 'parametres' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Rôle et accès</h4>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-slate-900">Rôle actuel</div>
                      <div className="text-sm text-slate-500">{user.role === 'admin' ? 'Administrateur complet' : 'Client standard'}</div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'admin' ? 'ADMIN' : 'CLIENT'}
                    </span>
                  </div>
                  <button 
                    onClick={handleRoleChange}
                    disabled={changeRoleMutation.isPending}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    {changeRoleMutation.isPending ? 'Modification...' : `Changer en ${user.role === 'admin' ? 'Client' : 'Administrateur'}`}
                  </button>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Statut du compte</h4>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Accès à la plateforme</div>
                    <div className="text-sm text-slate-500">{user.is_active ? 'Le compte est actif' : 'Le compte est désactivé'}</div>
                  </div>
                  <button
                    onClick={handleStatusToggle}
                    disabled={toggleStatusMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${user.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Sécurité</h4>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <button 
                    onClick={() => {
                      if (window.confirm('Voulez-vous vraiment révoquer toutes les sessions de cet utilisateur ? Il devra se reconnecter.')) {
                        revokeSessionsMutation.mutate(user.id);
                      }
                    }}
                    disabled={revokeSessionsMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {revokeSessionsMutation.isPending ? 'Révocation...' : 'Révoquer toutes les sessions'}
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                    <Mail className="w-4 h-4" />
                    Envoyer un lien de réinitialisation
                  </button>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-red-600 mb-4 uppercase tracking-wider">Zone dangereuse</h4>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <p className="text-sm text-red-800 mb-4">
                    La suppression du compte est irréversible. Les données personnelles seront anonymisées.
                  </p>
                  <button 
                    onClick={onDelete}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer le compte
                  </button>
                </div>
              </section>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
