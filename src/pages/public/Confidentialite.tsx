export function Confidentialite() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Politique de Confidentialité</h1>
      
      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Collecte des données</h2>
          <p className="text-slate-600">
            Dans le cadre de nos services, nous collectons les données suivantes : nom, prénom, adresse email, numéro de téléphone, et les informations relatives à votre entreprise nécessaires à l'accomplissement des formalités.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Finalités du traitement</h2>
          <p className="text-slate-600">
            Vos données sont traitées pour les finalités suivantes :
          </p>
          <ul className="list-disc pl-5 mt-2 text-slate-600">
            <li>Exécution des formalités juridiques commandées</li>
            <li>Gestion de la relation client et facturation</li>
            <li>Amélioration de nos services</li>
            <li>Respect de nos obligations légales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Durée de conservation (Notice d'information)</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md my-4">
            <p className="text-blue-800 font-medium">
              Vos données sont conservées 7 ans conformément aux obligations légales et comptables françaises.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Vos droits (RGPD)</h2>
          <p className="text-slate-600">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-5 mt-2 text-slate-600">
            <li>Droit d'accès et de portabilité (Art. 20) : Vous pouvez télécharger l'ensemble de vos données depuis votre espace client.</li>
            <li>Droit d'effacement / Droit à l'oubli (Art. 17) : Vous pouvez demander la suppression de votre compte depuis les paramètres de votre espace client.</li>
            <li>Droit de rectification : Vous pouvez modifier vos informations depuis votre profil.</li>
          </ul>
          <p className="text-slate-600 mt-4">
            Pour exercer ces droits, vous pouvez utiliser les fonctionnalités de votre espace client ou nous contacter à dpo@formalia.fr.
          </p>
        </section>
      </div>
    </div>
  );
}
