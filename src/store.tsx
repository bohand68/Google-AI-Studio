import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState } from './types';
import { INITIAL_STATE } from './constants';

interface AppContextType {
  state: AppState;
  updateState: (section: keyof AppState, data: any) => void;
  scenarios: Record<string, AppState>;
  saveScenario: (name: string) => void;
  loadScenario: (name: string) => void;
  deleteScenario: (name: string) => void;
  importScenario: (name: string, data: AppState) => void;
  currentScenarioName: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('sap-estimation-state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [scenarios, setScenarios] = useState<Record<string, AppState>>(() => {
    const saved = localStorage.getItem('sap-estimation-scenarios');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentScenarioName, setCurrentScenarioName] = useState<string>(() => {
    return localStorage.getItem('sap-estimation-current-scenario') || 'Standard';
  });

  useEffect(() => {
    localStorage.setItem('sap-estimation-state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('sap-estimation-scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    localStorage.setItem('sap-estimation-current-scenario', currentScenarioName);
  }, [currentScenarioName]);

  const updateState = (section: keyof AppState, data: any) => {
    setState((prev) => ({
      ...prev,
      [section]: typeof data === 'function' ? data(prev[section]) : data
    }));
  };

  const saveScenario = (name: string) => {
    setScenarios(prev => ({ ...prev, [name]: JSON.parse(JSON.stringify(state)) }));
    setCurrentScenarioName(name);
  };

  const loadScenario = (name: string) => {
    if (scenarios[name]) {
      setState(JSON.parse(JSON.stringify(scenarios[name])));
      setCurrentScenarioName(name);
    } else if (name === 'Standard') {
      // Allow switching back to empty/standard state if desired, or just renaming current
      setCurrentScenarioName(name);
    }
  };

  const deleteScenario = (name: string) => {
    setScenarios(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (currentScenarioName === name) {
      setCurrentScenarioName('Standard');
    }
  };

  const importScenario = (name: string, data: AppState) => {
    setScenarios(prev => ({ ...prev, [name]: data }));
    setState(data);
    setCurrentScenarioName(name);
  };

  return (
    <AppContext.Provider value={{ state, updateState, scenarios, saveScenario, loadScenario, deleteScenario, importScenario, currentScenarioName }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
