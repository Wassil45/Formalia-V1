import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { 
  Users, Search, Filter, Shield, ShieldOff, Mail,
  MoreVertical, UserX, UserCheck, ChevronDown, X,
  Eye, Calendar, Phone, CheckCircle2, AlertCircle
} from 'lucide-react';

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', color: 'text-red-700', bg: 'bg-red-100', icon: Shield },
  client: { label: 'Client', color: 'text-blue-700', bg: 'bg-blue-100', icon: Users },
};

export function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // Fetch profiles (contient email + role + infos perso)
  const { data: users, isLoading, isError } = useQuery<any[]>({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch dossiers count par user
  const { data: dossierCounts } = useQuery({
    queryKey: ['admin_users_dossier_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('client_id');
      if (error) return {};
      const counts: Record<string, number> = {};
      data?.forEach(d => {
        counts[d.client_id] = (counts[d.client_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  // Mutation : changer le rôle
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'client' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast('success', 'Rôle mis à jour', 
        role === 'admin' ? 'L\'utilisateur est maintenant administrateur' 
          : 'L\'utilisateur est repassé en client');
      setSelectedUser(null);
    },
    onError: (err: any) => toast('error', 'Erreur', err.message),
  });

  // Filtered users
  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q 
        || u.email?.toLowerCase().includes(q)
        || u.first_name?.toLowerCase().includes(q)
        || u.last_name?.toLowerCase().includes(q)
        || u.phone?.includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users?.length ?? 0,
    admins: users?.filter(u => u.role === 'admin').length ?? 0,
    clients: users?.filter(u => u.role === 'client').length ?? 0,
    recent: users?.filter(u => {
      const created = new Date(u.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo;
    }).length ?? 0,
  }), [users]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
            <p className="text-sm text-slate-500">{stats.total} comptes enregistrés</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-52 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 
                  rounded-xl text-sm focus:outline-none focus:border-primary 
                  focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm 
                  font-medium border transition-all ${
                  roleFilter 
                    ? 'border-primary/30 bg-primary/8 text-primary' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {roleFilter === 'admin' ? 'Admins' 
                   : roleFilter === 'client' ? 'Clients' : 'Filtrer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl 
                  border border-slate-100 overflow-hidden z-20 animate-scale-in">
                  {[null, 'client', 'admin'].map(role => (
                    <button
                      key={String(role)}
                      onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        roleFilter === role 
                          ? 'bg-primary/8 text-primary font-medium' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {role === null ? 'Tous' : role === 'admin' ? 'Admins' : 'Clients'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/8' },
            { label: 'Clients', value: stats.clients, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Cette semaine', value: stats.recent, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm">
              <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Tableau responsive */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {['Utilisateur', 'Rôle', 'Dossiers', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="px-4 md:px-6 py-3.5 text-xs font-semibold 
                      text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                      <p className="text-sm text-red-600 font-medium">
                        Impossible de charger les utilisateurs
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Vérifiez la configuration Supabase et les politiques RLS
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => {
                    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];
                    const RoleIcon = roleConfig?.icon ?? Users;
                    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center 
                              justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                              {initials || user.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.email}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                            rounded-lg text-xs font-semibold 
                            ${roleConfig?.bg} ${roleConfig?.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig?.label}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {dossierCounts?.[user.id] ?? 0}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {new Date(user.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-1 opacity-0 
                            group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 rounded-lg text-slate-400 hover:text-primary 
                                hover:bg-primary/8 transition-all"
                              title="Voir le profil"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateRole.mutate({ 
                                userId: user.id, 
                                role: user.role === 'admin' ? 'client' : 'admin' 
                              })}
                              className={`p-2 rounded-lg transition-all ${
                                user.role === 'admin'
                                  ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title={user.role === 'admin' 
                                ? 'Retirer les droits admin' 
                                : 'Promouvoir admin'}
                            >
                              {user.role === 'admin' 
                                ? <ShieldOff className="w-4 h-4" /> 
                                : <Shield className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer profil utilisateur */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={() => setSelectedUser(null)} />
          <div className="relative bg-white w-full max-w-sm h-full shadow-2xl 
            overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 
              flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Profil utilisateur</h2>
              <button onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center 
                  justify-center text-white text-xl font-bold shadow-lg">
                  {`${selectedUser.first_name?.[0] ?? ''}${selectedUser.last_name?.[0] ?? ''}`.toUpperCase() 
                    || selectedUser.email?.[0]?.toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${ROLE_CONFIG[selectedUser.role as keyof typeof ROLE_CONFIG]?.bg}
                  ${ROLE_CONFIG[selectedUser.role as keyof typeof ROLE_CONFIG]?.color}`}>
                  {ROLE_CONFIG[selectedUser.role as keyof typeof ROLE_CONFIG]?.label}
                </span>
              </div>

              {/* Infos */}
              {[
                { icon: Mail, label: 'Email', value: selectedUser.email },
                { icon: Phone, label: 'Téléphone', value: selectedUser.phone || '—' },
                { icon: Calendar, label: 'Inscrit le', value: new Date(selectedUser.created_at)
                    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                { icon: Users, label: 'Dossiers', value: `${dossierCounts?.[selectedUser.id] ?? 0} dossier(s)` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center 
                    justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => updateRole.mutate({
                    userId: selectedUser.id,
                    role: selectedUser.role === 'admin' ? 'client' : 'admin'
                  })}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl 
                    text-sm font-semibold transition-all ${
                    selectedUser.role === 'admin'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {selectedUser.role === 'admin' 
                    ? <><ShieldOff className="w-4 h-4" /> Retirer les droits admin</>
                    : <><Shield className="w-4 h-4" /> Promouvoir administrateur</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
