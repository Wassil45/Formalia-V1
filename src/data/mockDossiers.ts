export const MOCK_DOSSIERS = [
  {
    id: 'mock-dossier-1',
    reference: 'DOS-A1B2C3',
    client_id: 'mock-user-1',
    formalite_id: 'mock-1',
    status: 'processing',
    form_data: {
      companyInfo: {
        name: 'Tech Solutions SAS',
        activity: 'Développement de logiciels',
        address: '123 Rue de la Tech, 75001 Paris'
      }
    },
    total_amount: 178.80,
    stripe_session_id: 'cs_test_123',
    stripe_payment_status: 'paid',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean.dupont@example.com'
    },
    formalites_catalogue: {
      name: 'Création SAS',
      type: 'immatriculation'
    }
  },
  {
    id: 'mock-dossier-2',
    reference: 'DOS-X9Y8Z7',
    client_id: 'mock-user-2',
    formalite_id: 'mock-3',
    status: 'pending_documents',
    form_data: {
      companyInfo: {
        name: 'Boulangerie Le Pain Doré',
        activity: 'Boulangerie artisanale',
        address: '45 Avenue du Pain, 69002 Lyon'
      }
    },
    total_amount: 106.80,
    stripe_session_id: 'cs_test_456',
    stripe_payment_status: 'paid',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'marie.martin@example.com'
    },
    formalites_catalogue: {
      name: 'Modification de statuts',
      type: 'modification'
    }
  },
  {
    id: 'mock-dossier-3',
    reference: 'DOS-L4M5N6',
    client_id: 'mock-user-3',
    formalite_id: 'mock-2',
    status: 'completed',
    form_data: {
      companyInfo: {
        name: 'Consulting Pro SASU',
        activity: 'Conseil en management',
        address: '8 Boulevard des Pros, 33000 Bordeaux'
      }
    },
    total_amount: 154.80,
    stripe_session_id: 'cs_test_789',
    stripe_payment_status: 'paid',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: {
      first_name: 'Paul',
      last_name: 'Durand',
      email: 'paul.durand@example.com'
    },
    formalites_catalogue: {
      name: 'Création SASU',
      type: 'immatriculation'
    }
  }
];
