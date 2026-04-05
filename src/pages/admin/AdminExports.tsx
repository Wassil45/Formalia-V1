import { useState } from 'react';
import { Download, FileText, FileArchive, FileSpreadsheet, Calendar, Filter } from 'lucide-react';

export function AdminExports() {
  const [dossierDateRange, setDossierDateRange] = useState('30days');
  const [dossierStatus, setDossierStatus] = useState('all');
  
  const [docDateRange, setDocDateRange] = useState('7days');
  
  const [reportMonth, setReportMonth] = useState('03');
  const [reportYear, setReportYear] = useState('2026');

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Exports & Rapports</h2>
        <p className="text-slate-500 mt-1 text-sm">Téléchargez les données et documents de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Export des dossiers (CSV) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Export des dossiers</h3>
            <p className="text-sm text-slate-500 mt-1">Téléchargez la liste des dossiers au format CSV pour Excel ou Google Sheets.</p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Période
              </label>
              <select 
                value={dossierDateRange}
                onChange={(e) => setDossierDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="today">Aujourd'hui</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="all">Depuis le début</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Filter className="w-4 h-4 text-slate-400" /> Statut
              </label>
              <select 
                value={dossierStatus}
                onChange={(e) => setDossierStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="received">Reçu</option>
                <option value="processing">En traitement</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            
            <button className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Télécharger .csv
            </button>
          </div>
        </div>

        {/* Card 2: Export des documents clients (ZIP) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileArchive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Documents clients</h3>
            <p className="text-sm text-slate-500 mt-1">Générez une archive ZIP contenant tous les documents téléchargés par les clients.</p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Période d'upload
              </label>
              <select 
                value={docDateRange}
                onChange={(e) => setDocDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="today">Aujourd'hui</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
              </select>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800">
                <strong>Note :</strong> La génération d'une archive volumineuse peut prendre quelques minutes. Un lien de téléchargement vous sera envoyé par email.
              </p>
            </div>
            
            <button className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Générer l'archive .zip
            </button>
          </div>
        </div>

        {/* Card 3: Rapports mensuels (PDF) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Rapports mensuels</h3>
            <p className="text-sm text-slate-500 mt-1">Téléchargez un rapport PDF détaillé de l'activité et des performances du mois.</p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mois</label>
                <select 
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="01">Janvier</option>
                  <option value="02">Février</option>
                  <option value="03">Mars</option>
                  <option value="04">Avril</option>
                  <option value="05">Mai</option>
                  <option value="06">Juin</option>
                  <option value="07">Juillet</option>
                  <option value="08">Août</option>
                  <option value="09">Septembre</option>
                  <option value="10">Octobre</option>
                  <option value="11">Novembre</option>
                  <option value="12">Décembre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Année</label>
                <select 
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
            
            <button className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Télécharger le rapport .pdf
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
