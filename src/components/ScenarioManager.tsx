import React, { useState, useRef } from 'react';
import { useAppContext } from '../store';
import { Save, Trash2, Download, Upload } from 'lucide-react';
import { Input } from './ui';

export function ScenarioManager() {
  const { state, scenarios, saveScenario, loadScenario, deleteScenario, importScenario, currentScenarioName } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = () => {
    if (newScenarioName.trim()) {
      saveScenario(newScenarioName.trim());
      setNewScenarioName('');
      setIsCreating(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${currentScenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scenario.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData && importedData.projectDuration && importedData.teamAndCosts) {
           let scenarioName = file.name.replace('.json', '');
           // Ensure unique name if exists
           if (scenarios[scenarioName] || scenarioName === 'Standard') {
             scenarioName = `${scenarioName} (Importiert ${new Date().toLocaleTimeString()})`;
           }
           importScenario(scenarioName, importedData);
        } else {
           alert("Ungültige Szenario-Datei.");
        }
      } catch (error) {
        alert("Fehler beim Importieren der Datei.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Szenario:</span>
        <select
          className="block w-40 sm:w-48 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
          value={currentScenarioName}
          onChange={(e) => loadScenario(e.target.value)}
        >
          <option value="Standard" disabled={currentScenarioName !== 'Standard' && !scenarios['Standard']}>
            {currentScenarioName === 'Standard' ? 'Aktuell (Ungespeichert)' : 'Standard'}
          </option>
          {Object.keys(scenarios).map(name => (
             <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {isCreating ? (
        <div className="flex items-center gap-2">
          <Input 
            value={newScenarioName} 
            onChange={e => setNewScenarioName(e.target.value)} 
            placeholder="Name (z.B. Optimistisch)"
            className="w-40 sm:w-48 !py-1"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-800 p-1" title="Szenario speichern">
            <Save className="w-5 h-5" />
          </button>
          <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 p-1 text-sm font-medium">Abbrechen</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button 
             onClick={() => {
                const name = currentScenarioName !== 'Standard' ? currentScenarioName : 'Neues Szenario';
                setNewScenarioName(name);
                setIsCreating(true);
             }}
             className="flex items-center gap-1 text-sm font-medium bg-white text-indigo-600 px-3 py-1.5 rounded-md border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
          >
             <Save className="w-4 h-4" /> <span className="hidden sm:inline">Speichern</span>
          </button>
          
          {currentScenarioName !== 'Standard' && scenarios[currentScenarioName] && (
            <button 
              onClick={() => deleteScenario(currentScenarioName)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md border border-transparent transition-colors"
              title="Aktuelles Szenario löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
          
          <button 
            onClick={handleExport}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-transparent transition-colors flex items-center gap-1"
            title="Szenario exportieren"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-transparent transition-colors flex items-center gap-1"
            title="Szenario importieren"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
}
