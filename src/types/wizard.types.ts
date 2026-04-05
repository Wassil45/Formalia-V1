import { Database } from './database.types';

export type FormaliteCatalogue = Database['public']['Tables']['formalites_catalogue']['Row'];

export type WizardStep = number;

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  status: 'uploaded';
  uploadedAt: string;
}

export interface WizardState {
  currentStep: WizardStep;
  selectedFormaliteId: string | null;
  selectedFormalite: FormaliteCatalogue | null;
  formData: Record<string, any>;
  documents: Record<string, UploadedDocument>;
  isSaving: boolean;
  error: string | null;
  dossierId: string | null;
  reference: string | null;
}

export type WizardAction =
  | { type: 'SET_STEP'; payload: WizardStep }
  | { type: 'SELECT_FORMALITE'; payload: { formalite: FormaliteCatalogue; reference: string; dossierId: string; formData: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Record<string, any> }
  | { type: 'SET_DOCUMENTS'; payload: Record<string, UploadedDocument> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };
