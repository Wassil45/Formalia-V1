export function MentionsLegales() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentions Légales</h1>
      
      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Éditeur du site</h2>
          <p className="text-slate-600">
            Le site Formalia est édité par la société Formalia SAS, au capital de 10 000 euros, 
            immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 123 456 789.
          </p>
          <p className="text-slate-600 mt-2">
            Siège social : 123 rue de la République, 75001 Paris<br />
            N° de TVA intracommunautaire : FR 12 123456789<br />
            Email : contact@formalia.fr<br />
            Téléphone : 01 23 45 67 89
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Directeur de la publication</h2>
          <p className="text-slate-600">
            Le directeur de la publication est M. Jean Dupont, en sa qualité de Président.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Hébergement</h2>
          <p className="text-slate-600">
            Ce site est hébergé par Google Cloud Platform (GCP).<br />
            Google Ireland Limited<br />
            Gordon House, Barrow Street<br />
            Dublin 4, Irlande
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Propriété intellectuelle</h2>
          <p className="text-slate-600">
            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
        </section>
      </div>
    </div>
  );
}
