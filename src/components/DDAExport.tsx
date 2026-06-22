import React, { useRef, useState } from 'react';
import { useAppContext } from '../store';
import { Card, CardHeader, CardContent, Input } from './ui';
import { FileUp, Trash2, Plus, Send } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { translations, Language, TranslationKey } from '../i18n';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const EXPECTED_HEADERS = [
  "LOB",
  "BA",
  "Code",
  "Name",
  "Priority",
  "Phase",
  "Countries",
  "Solution Scenario ID",
  "Release"
];

export function DDAExport() {
  const { state, updateState } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const processData = (data: any[][]) => {
    if (!data || data.length === 0) return;
    
    // Attempt header mapping
    const rawHeaders = (data[0] || []).map(String);
    const headerIndices = EXPECTED_HEADERS.map(expected => {
      return rawHeaders.findIndex(h => h.toLowerCase().includes(expected.toLowerCase()));
    });

    const mappedRows: any[][] = [EXPECTED_HEADERS];

    for (let i = 1; i < data.length; i++) {
      const sourceRow = data[i];
      if (!sourceRow || sourceRow.length === 0) continue;
      
      const newRow = EXPECTED_HEADERS.map((_, idx) => {
        const sourceIdx = headerIndices[idx];
        if (sourceIdx !== -1) {
          return sourceRow[sourceIdx] || '';
        }
        return sourceRow[idx] || ''; // Fallback
      });
      
      // Only push if row has at least some content
      if (newRow.some(val => val !== '')) {
        mappedRows.push(newRow);
      }
    }
    updateState('ddaExport', mappedRows);
  };

  const extractPdfText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allRows: any[][] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // A naive approach: group by Y coordinate to form rows
      let items = content.items.map((item: any) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5]
      }));
      
      // Sort primarily by Y (descending) and secondarily by X (ascending)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // rough threshold for same line
        return a.x - b.x;
      });

      let currentY = -1;
      let currentRow: string[] = [];
      
      items.forEach(item => {
        if (item.str.trim() === '') return;
        
        if (currentY === -1 || Math.abs(currentY - item.y) > 5) {
          if (currentRow.length > 0) {
            allRows.push(currentRow);
          }
          currentRow = [item.str];
          currentY = item.y;
        } else {
          currentRow.push(item.str);
        }
      });
      if (currentRow.length > 0) allRows.push(currentRow);
    }
    return allRows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const rows = await extractPdfText(file);
        processData(rows);
      } else {
        const fileData = await file.arrayBuffer();
        const wb = XLSX.read(fileData, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        processData(data);
      }
    } catch (err) {
      console.error('File reading failed', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...state.ddaExport];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    updateState('ddaExport', newData);
  };

  const handleAddRow = () => {
    const newData = [...state.ddaExport];
    const numCols = EXPECTED_HEADERS.length;
    newData.push(new Array(numCols).fill(''));
    updateState('ddaExport', newData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = [...state.ddaExport];
    newData.splice(rowIndex, 1);
    updateState('ddaExport', newData);
  };

  const clearData = () => {
    updateState('ddaExport', []);
  };

  const handleTransferToScope = () => {
    if (!state.ddaExport || state.ddaExport.length < 2) return;
    
    const headerRow = state.ddaExport[0];
    const lobIndex = headerRow.findIndex((h: string) => typeof h === 'string' && h.toLowerCase() === 'lob');
    const codeIndex = headerRow.findIndex((h: string) => typeof h === 'string' && h.toLowerCase() === 'code');

    if (lobIndex === -1 || codeIndex === -1) {
      alert("Die Spalten 'LOB' und/oder 'Code' wurden nicht gefunden.");
      return;
    }

    const counts: Record<string, Set<string>> = {};
    
    for (let i = 1; i < state.ddaExport.length; i++) {
      const row = state.ddaExport[i];
      const lob = (row[lobIndex] || '').toString().trim();
      const code = (row[codeIndex] || '').toString().trim();
      
      if (lob && code) {
        if (!counts[lob]) {
          counts[lob] = new Set<string>();
        }
        counts[lob].add(code);
      }
    }

    const newScopeItems = { ...state.scopeItems, items: { ...state.scopeItems.items } };
    let updated = false;

    // Reset all totals to 0 first? Optional, but typical to avoid old data lingering.
    // We will just update what's in the DDA plus set missing to 0 for a fresh load.
    for (const key of Object.keys(newScopeItems.items)) {
       newScopeItems.items[key] = { ...newScopeItems.items[key], total: 0 };
    }

    for (const [lob, codes] of Object.entries(counts)) {
      if (newScopeItems.items[lob]) {
        newScopeItems.items[lob] = { 
          ...newScopeItems.items[lob], 
          total: codes.size 
        };
        updated = true;
      } else {
        // If there's an LOB in DDA that does not exist exactly in our CATEGORIES, we might try to find a partial match or ignore.
        // E.g., "Finance" vs "Finance "
        const exactMatch = Object.keys(newScopeItems.items).find(k => k.toLowerCase() === lob.toLowerCase());
        if (exactMatch) {
          newScopeItems.items[exactMatch] = { 
            ...newScopeItems.items[exactMatch], 
            total: codes.size 
          };
          updated = true;
        }
      }
    }

    if (updated) {
      updateState('scopeItems', newScopeItems);
      alert("Anzahl erfolgreich an BPC Scope übertragen.");
    } else {
      alert("Es konnten keine übereinstimmenden LOBs in BPC Scope gefunden werden.");
    }
  };

  const lang = (state.language || 'de') as Language;
  const t = (key: TranslationKey) => translations[lang]?.[key] || translations['de'][key] || key;

  const summaryCounts: Record<string, Set<string>> = {};
  if (state.ddaExport && state.ddaExport.length > 1) {
    const headerRow = state.ddaExport[0];
    const lobIndex = headerRow.findIndex((h: string) => typeof h === 'string' && h.toLowerCase() === 'lob');
    const codeIndex = headerRow.findIndex((h: string) => typeof h === 'string' && h.toLowerCase() === 'code');
    if (lobIndex !== -1 && codeIndex !== -1) {
      for (let i = 1; i < state.ddaExport.length; i++) {
        const row = state.ddaExport[i];
        const lob = (row[lobIndex] || '').toString().trim();
        const code = (row[codeIndex] || '').toString().trim();
        if (lob && code) {
          if (!summaryCounts[lob]) {
            summaryCounts[lob] = new Set<string>();
          }
          summaryCounts[lob].add(code);
        }
      }
    }
  }
  const summaryEntries = Object.entries(summaryCounts).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Card>
      <CardHeader 
        title={t('tab.dda' as TranslationKey)}
        description="Fügen Sie einen DDA-Import (.xlsx, .csv oder .pdf) hinzu, um Daten einzulesen und zu bearbeiten."
        icon={FileUp}
        action={
          state.ddaExport?.length > 0 && (
            <button
              onClick={clearData}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
              title="Daten löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        }
      />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 py-20 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            Lade Daten...
          </div>
        ) : !state.ddaExport || state.ddaExport.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <FileUp className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-sm font-medium text-slate-900 mb-1">Datei hochladen</h3>
            <p className="text-sm text-slate-500 mb-4">Wählen Sie einen DDA-Import (.xlsx, .csv, .pdf) aus.</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 text-sm cursor-pointer"
            >
              Datei auswählen
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {summaryEntries.length > 0 && (
              <div className="ring-1 ring-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-medium text-slate-800 text-sm">Zusammenfassung</h3>
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">LOB</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Anzahl Codes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {summaryEntries.map(([lob, codes]) => (
                      <tr key={lob} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-sm text-slate-900">{lob}</td>
                        <td className="px-4 py-2 text-sm text-slate-700 text-right font-medium">{codes.size}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                      <td className="px-4 py-2 text-sm text-slate-900">Gesamt</td>
                      <td className="px-4 py-2 text-sm text-slate-900 text-right">
                        {summaryEntries.reduce((acc, [_, codes]) => acc + codes.size, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {state.ddaExport[0]?.map((header: any, i: number) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100">
                      {header}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 w-16">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {state.ddaExport.slice(1).map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-slate-50/50">
                    {state.ddaExport[0]?.map((_, colIndex: number) => (
                      <td key={colIndex} className="px-3 py-1 whitespace-nowrap">
                        <Input 
                          value={row[colIndex] || ''} 
                          onChange={(e) => handleCellChange(rowIndex + 1, colIndex, e.target.value)} 
                          className="w-full min-w-[120px] bg-white border-slate-300" 
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteRow(rowIndex + 1)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Zeile löschen"
                      >
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Zeile hinzufügen
              </button>
              
              <button
                onClick={handleTransferToScope}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                Anzahl Codes an BPC Scope übertragen
              </button>
            </div>
          </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
