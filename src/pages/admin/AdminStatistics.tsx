import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, FileText, Clock, Percent } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdmin';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AdminStatistics() {
  const [dateRange, setDateRange] = useState('30days');
  const { data: stats, isLoading } = useAdminStats();

  const caData = stats?.caData || [];
  const typeData = stats?.typeData || [];
  const topFormalitesData = stats?.topFormalitesData || [];
  const timeData = stats?.timeData || [];

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Statistiques & Performances</h2>
          <p className="text-slate-500 mt-1 text-sm">Analysez l'activité et les revenus de la plateforme.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: '7days', label: '7 jours' },
            { id: '30days', label: '30 jours' },
            { id: 'month', label: 'Ce mois' },
            { id: 'year', label: 'Année' },
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +12.5%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">CA Généré</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : `${stats?.ca?.toLocaleString('fr-FR')} €`}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +8.2%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Dossiers traités</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : stats?.dossiers}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingDown className="w-3 h-3" /> -1.5j
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Délai moyen</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : `${stats?.delai} jours`}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Percent className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +0.0%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Taux de conversion</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : `${stats?.conversion}%`}
          </h3>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Row 1: Line chart (large) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-6">Évolution du Chiffre d'Affaires</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={caData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} tickFormatter={(value) => `${value}€`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} €`, 'CA']}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Donut chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-6">Répartition par type</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Bar chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-6">Top 5 des formalités les plus vendues</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={topFormalitesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={120} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Line chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-6">Temps de traitement moyen (jours)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} jours`, 'Délai']}
                />
                <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
