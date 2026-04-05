import { useSettings } from '../../hooks/useSettings';
import { Skeleton } from '../../components/ui/Skeleton';

export function MentionsLegales() {
  const { data: s, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentions Légales</h1>
      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Éditeur du site</h2>
          <p className="text-slate-600">
            Le site {s?.company_name || 'Formalia'} est édité par la société <strong>{s?.company_name || 'Formalia'}</strong>, 
            au capital de {s?.capital} euros, immatriculée au Registre du Commerce 
            et des Sociétés de {s?.rcs_city} sous le numéro {s?.siren}.
          </p>
          <p className="text-slate-600 mt-2">
            Siège social : {s?.address}<br />
            N° de TVA intracommunautaire : {s?.tva_number}<br />
            Email : <a href={`mailto:${s?.email_contact}`} className="text-primary">
              {s?.email_contact}
            </a><br />
            Téléphone : {s?.phone_contact}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            2. Directeur de la publication
          </h2>
          <p className="text-slate-600">
            Le directeur de la publication est {s?.director_name}, en sa qualité de Président.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Hébergement</h2>
          <p className="text-slate-600">
            Ce site est hébergé par {s?.hosting_provider}.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            4. Propriété intellectuelle
          </h2>
          <p className="text-slate-600">
            L'ensemble de ce site relève de la législation française et internationale 
            sur le droit d'auteur et la propriété intellectuelle. Tous les droits 
            de reproduction sont réservés.
          </p>
        </section>
      </div>
    </div>
  );
}
