import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export interface CompanyInfo {
  denomination?: string;
  sigle?: string;
  objetSocial?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  capitalSocial?: number;
  nombreAssocies?: number;
  [key: string]: any;
}

export interface WizardDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface WizardData {
  formaliteId: string | null;
  formaliteName: string | null;
  formaliteType: string | null;
  formalitePriceHT: number | null;
  formaliteTvaRate: number | null;
  companyInfo: CompanyInfo | null;
  documents: WizardDocument[];
  dossierId: string | null;
}

interface WizardContextType {
  data: WizardData;
  setFormalite: (formalite: {
    id: string; name: string; type: string; 
    price_ht: number; tva_rate: number;
  }) => void;
  setCompanyInfo: (info: CompanyInfo) => void;
  addDocument: (doc: WizardDocument) => void;
  removeDocument: (id: string) => void;
  setDocuments: (docs: WizardDocument[]) => void;
  setDossierId: (id: string) => void;
  resetWizard: () => void;
  canProceedToStep: (step: number) => boolean;
}

const initialData: WizardData = {
  formaliteId: null, formaliteName: null, formaliteType: null,
  formalitePriceHT: null, formaliteTvaRate: null,
  companyInfo: null, documents: [], dossierId: null,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const WIZARD_STORAGE_KEY = 'formalia_wizard';

function useWizardPersistence(initialState: WizardData) {
  const [data, setData] = useState<WizardData>(() => {
    try {
      const stored = sessionStorage.getItem(WIZARD_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialState;
    } catch (e) {
      console.error('Failed to parse wizard data from sessionStorage', e);
      return initialState;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return [data, setData] as const;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useWizardPersistence(initialData);

  const setFormalite = useCallback((f: { id: string; name: string; type: string; price_ht: number; tva_rate: number }) =>
    setData(prev => ({ 
      ...prev, formaliteId: f.id, formaliteName: f.name, 
      formaliteType: f.type, formalitePriceHT: f.price_ht, formaliteTvaRate: f.tva_rate 
    })), [setData]);

  const setCompanyInfo = useCallback((info: CompanyInfo) =>
    setData(prev => ({ ...prev, companyInfo: info })), [setData]);

  const addDocument = useCallback((doc: WizardDocument) =>
    setData(prev => ({ ...prev, documents: [...prev.documents, doc] })), [setData]);

  const removeDocument = useCallback((id: string) =>
    setData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) })), [setData]);

  const setDocuments = useCallback((docs: WizardDocument[]) =>
    setData(prev => ({ ...prev, documents: docs })), [setData]);

  const setDossierId = useCallback((id: string) =>
    setData(prev => ({ ...prev, dossierId: id })), [setData]);

  const resetWizard = useCallback(() => {
    setData(initialData);
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  }, [setData]);

  const canProceedToStep = useCallback((step: number) => {
    if (step <= 1) return true;
    if (step === 2) return !!data.formaliteId;
    if (step === 3) return !!data.companyInfo;
    if (step === 4) return data.documents.length > 0;
    return false;
  }, [data]);

  return (
    <WizardContext.Provider value={{
      data, setFormalite, setCompanyInfo, addDocument,
      removeDocument, setDocuments, setDossierId, resetWizard, canProceedToStep
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
