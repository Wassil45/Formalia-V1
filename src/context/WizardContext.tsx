import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>(initialData);

  const setFormalite = useCallback((f: { id: string; name: string; type: string; price_ht: number; tva_rate: number }) =>
    setData(prev => ({ 
      ...prev, formaliteId: f.id, formaliteName: f.name, 
      formaliteType: f.type, formalitePriceHT: f.price_ht, formaliteTvaRate: f.tva_rate 
    })), []);

  const setCompanyInfo = useCallback((info: CompanyInfo) =>
    setData(prev => ({ ...prev, companyInfo: info })), []);

  const addDocument = useCallback((doc: WizardDocument) =>
    setData(prev => ({ ...prev, documents: [...prev.documents, doc] })), []);

  const removeDocument = useCallback((id: string) =>
    setData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) })), []);

  const setDocuments = useCallback((docs: WizardDocument[]) =>
    setData(prev => ({ ...prev, documents: docs })), []);

  const setDossierId = useCallback((id: string) =>
    setData(prev => ({ ...prev, dossierId: id })), []);

  const resetWizard = useCallback(() => setData(initialData), []);

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
