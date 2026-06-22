import { AppState, Phase, Complexity, StandardComplexity } from './types';

export const PHASES: Phase[] = ['Discover', 'Prepare', 'Explore', 'Realize', 'Deploy', 'Run+Hypercare'];
export const ESTIMATION_PHASES: Phase[] = ['Prepare', 'Explore', 'Realize', 'Deploy']; // Discover and Run+Hypercare usually excluded from these distributions

export const CATEGORIES = [
  'Sourcing and Procurement', 'Asset Management', 'R&D/Engineering', 'Manufacturing',
  'Supply Chain', 'Sales', 'Service', 'Human Resources', 'Finance', 'Controlling',
  'Database and Data Mngt.', 'App. Platf. and Infrastr.', 'Sol. for Specific Industries',
  'IT Management', 'SAP BTP Use Cases', 'Bus. Transformation Mgmt.', 'Sustainability Management',
  'Deprecated Best Practises'
];

export const PHASE_COLORS = {
  'Discover': '#94a3b8',
  'Prepare': '#3b82f6',
  'Explore': '#8b5cf6',
  'Realize': '#10b981',
  'Deploy': '#f59e0b',
  'Run+Hypercare': '#14b8a6'
};

export const INITIAL_STATE: AppState = {
  language: 'de',
  ddaExport: [],
  projectDuration: {
    startDate: '',
    endDate: '',
    netWeeks: 100,
    runHypercareWeeks: 0,
    phaseDistributions: {
      'Discover': 0,
      'Prepare': 5,
      'Explore': 30,
      'Realize': 60,
      'Deploy': 5,
      'Run+Hypercare': 0
    },
    phaseDetails: [
      { id: '1', phase: 'Prepare', content: 'Project Preparation', percentage: 50 },
      { id: '2', phase: 'Prepare', content: 'Fiori Launchpad Look&Feel + Sample Process', percentage: 50 },
      { id: '3', phase: 'Explore', content: 'Baseline Build', percentage: 10 },
      { id: '4', phase: 'Explore', content: 'Fit-2-Standard Workshops', percentage: 80 },
      { id: '5', phase: 'Explore', content: 'Type-B Workshops', percentage: 10 },
    ]
  },
  scopeItems: {
    items: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: { total: 0, low: 0, medium: 0, high: 0, veryHigh: 0 } }), {}),
    complexityMatrix: {
      'Discover': { Low: 0, Medium: 0, High: 0, 'Very High': 0 },
      'Prepare': { Low: 0.25, Medium: 2, High: 4, 'Very High': 7 },
      'Explore': { Low: 0.25, Medium: 2, High: 4, 'Very High': 7 },
      'Realize': { Low: 0.25, Medium: 2, High: 4, 'Very High': 7 },
      'Deploy': { Low: 0.25, Medium: 2, High: 4, 'Very High': 7 },
      'Run+Hypercare': { Low: 0, Medium: 0, High: 0, 'Very High': 0 }
    }
  },
  dataMigration: {
    setup: {
      'Stammdaten': { Low: 1, Medium: 3, High: 5 },
      'Bewegungsdaten': { Low: 1, Medium: 2, High: 4 }
    },
    inputs: {
      'Stammdaten': { total: 20, low: 4, medium: 6, high: 10 },
      'Bewegungsdaten': { total: 0, low: 0, medium: 0, high: 0 }
    },
    distribution: {
      'Stammdaten': { Discover: 0, Prepare: 0, Explore: 10, Realize: 80, Deploy: 10, 'Run+Hypercare': 0 },
      'Bewegungsdaten': { Discover: 0, Prepare: 0, Explore: 10, Realize: 80, Deploy: 10, 'Run+Hypercare': 0 }
    }
  },
  integrations: {
    setup: {
      'Standard API': { Low: 1, Medium: 3, High: 5 },
      'Middleware': { Low: 2, Medium: 5, High: 8 },
      'Individuelle Schnittstelle': { Low: 3, Medium: 7, High: 12 }
    },
    inputs: {
      'Standard API': { total: 0, low: 0, medium: 0, high: 0 },
      'Middleware': { total: 0, low: 0, medium: 0, high: 0 },
      'Individuelle Schnittstelle': { total: 0, low: 0, medium: 0, high: 0 }
    },
    distribution: {
      'Standard API': { Discover: 0, Prepare: 0, Explore: 20, Realize: 70, Deploy: 10, 'Run+Hypercare': 0 },
      'Middleware': { Discover: 0, Prepare: 0, Explore: 20, Realize: 70, Deploy: 10, 'Run+Hypercare': 0 },
      'Individuelle Schnittstelle': { Discover: 0, Prepare: 0, Explore: 20, Realize: 70, Deploy: 10, 'Run+Hypercare': 0 }
    }
  },
  forms: {
    setup: {
      'Standard': { Low: 0.5, Medium: 1, High: 2 },
      'Angepasst': { Low: 1, Medium: 2, High: 3 },
      'Kundenspezifisch': { Low: 2, Medium: 4, High: 6 }
    },
    inputs: {
      'Standard': { total: 0, low: 0, medium: 0, high: 0 },
      'Angepasst': { total: 0, low: 0, medium: 0, high: 0 },
      'Kundenspezifisch': { total: 0, low: 0, medium: 0, high: 0 }
    },
    distribution: {
      'Standard': { Discover: 0, Prepare: 0, Explore: 10, Realize: 80, Deploy: 10, 'Run+Hypercare': 0 },
      'Angepasst': { Discover: 0, Prepare: 0, Explore: 10, Realize: 80, Deploy: 10, 'Run+Hypercare': 0 },
      'Kundenspezifisch': { Discover: 0, Prepare: 0, Explore: 10, Realize: 80, Deploy: 10, 'Run+Hypercare': 0 }
    }
  },
  teamAndCosts: {
    teamFTE: {
      'Steering Committee': 1,
      'Projektmanagement': 1,
      'Solution Architect': 0,
      'PMO': 1,
      'Master Data / Data Migration': 1,
      'Berechtigungungskonzept / Authority': 1,
      'Sourcing and Procurement': 1,
      'Asset Management': 0.5,
      'R&D/Engineering': 0.5,
      'Manufacturing': 1,
      'Supply Chain': 1,
      'Sales': 1,
      'Service': 0,
      'Human Ressources': 0,
      'Finance': 1,
      'Controlling': 1,
      'Database and Data Mngt.': 0,
      'App. Platf. and Infrastr.': 0,
      'Sol. for Specific Industries': 0,
      'IT Management': 0,
      'SAP BTP Use Cases': 0,
      'Bus. Transformation Mgmt.': 0,
      'Deprecated Best Practises': 0,
    },
    dailyRates: {
      'PL-BPC': 1400.00,
      'SC-BPC': 1320.00,
      'C-BPC': 1280.00,
      'JC-BPC': 840.00,
      'SC-TEC': 1280.00,
      'C-TEC': 1200.00,
      'J-TEC': 800.00,
      'PMO': 800.00
    },
    rolePercent: {
      'PL-BPC': 15,
      'SC-BPC': 20,
      'C-BPC': 20,
      'JC-BPC': 5,
      'SC-TEC': 15,
      'C-TEC': 10,
      'J-TEC': 5,
      'PMO': 10
    },
    roleDaysOverride: {},
    runHypercareDays: {
      'PL-BPC': 0,
      'SC-BPC': 0,
      'C-BPC': 0,
      'JC-BPC': 0,
      'SC-TEC': 0,
      'C-TEC': 0,
      'J-TEC': 0,
      'PMO': 0
    },
    pmPersons: 1,
    pmDaysPerWeek: 0.125,
    meetingPersons: 1,
    meetingDaysPerWeek: 0.125,
    complexityFactor: 0,
    steeringFactor: 0,
    currency: 'EUR',
    exchangeRates: {
      USD: 1.05,
      CNY: 7.7,
      GBP: 0.85
    }
  }
};
