import { useState } from 'react';
import { AppProvider } from './store';
import { ProjectDuration } from './components/ProjectDuration';
import { ProjectTimeline } from './components/ProjectTimeline';
import { ScopeItems } from './components/ScopeItems';
import { GenericEstimation } from './components/GenericEstimation';
import { TeamAndCosts } from './components/TeamAndCosts';
import { Rasci } from './components/Rasci';
import { ScenarioManager } from './components/ScenarioManager';
import { ProjectSummary } from './components/ProjectSummary';
import { Database, Link, FileText, Calculator } from 'lucide-react';

const TABS = [
  { id: 'duration', label: '1. Projektlaufzeit' },
  { id: 'scope', label: '2. BPC Scope' },
  { id: 'data', label: '3. Daten' },
  { id: 'integration', label: '4. Integration' },
  { id: 'forms', label: '5. Formulare' },
  { id: 'rasci', label: '6. RASCI' },
  { id: 'team', label: '7. Team & Kosten' },
  { id: 'summary', label: '8. Übersicht' },
] as const;

type TabId = typeof TABS[number]['id'];

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('duration');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 shadow-sm shadow-slate-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20 flex items-center justify-center">
               <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden md:block">SAP S/4HANA Public Cloud Presales Estimation</h1>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:hidden">S/4HANA Kalkulator</h1>
          </div>
          <ScenarioManager />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto hide-scrollbar py-3 gap-2 border-t border-slate-100">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'duration' && (
          <>
            <ProjectDuration />
            <ProjectTimeline />
          </>
        )}
        
        {activeTab === 'scope' && <ScopeItems />}
        
        {activeTab === 'data' && (
          <GenericEstimation 
            sectionKey="dataMigration"
            title="3. Datenmigration"
            description="Einschätzung des Aufwands für die Datenmigration basierend auf Volumen und Qualität."
            icon={Database}
            typeLabel="Datentypen"
          />
        )}

        {activeTab === 'integration' && (
          <GenericEstimation 
            sectionKey="integrations"
            title="4. Integrationsanforderungen"
            description="Anzahl und Typ der anzubindenden Fremdsysteme."
            icon={Link}
            typeLabel="Systemtyp"
          />
        )}

        {activeTab === 'forms' && (
          <GenericEstimation 
            sectionKey="forms"
            title="5. Formulare & Labels"
            description="Aufwandsschätzung für Belege, Formulare und Etiketten."
            icon={FileText}
            typeLabel="Formular-Typ"
          />
        )}

        {activeTab === 'rasci' && <Rasci />}
        {activeTab === 'team' && <TeamAndCosts />}
        {activeTab === 'summary' && <ProjectSummary />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

