export function CGV() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Conditions Générales de Vente (CGV)</h1>
      
      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Objet</h2>
          <p className="text-slate-600">
            Les présentes Conditions Générales de Vente (CGV) ont pour objet de définir les conditions dans lesquelles la société Formalia SAS fournit ses services d'accompagnement aux formalités juridiques.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Services proposés</h2>
          <p className="text-slate-600">
            Formalia propose des services d'assistance pour la création, la modification et la fermeture d'entreprises. Ces services incluent la génération de documents, la vérification de dossiers et la transmission aux greffes compétents. Formalia n'est pas un cabinet d'avocats et ne fournit pas de conseil juridique personnalisé.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Tarifs et Paiement</h2>
          <p className="text-slate-600">
            Les prix de nos services sont indiqués en euros toutes taxes comprises (TTC). Le paiement est exigible immédiatement à la commande. Les paiements sont sécurisés par notre partenaire Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Droit de rétractation</h2>
          <p className="text-slate-600">
            Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de services pleinement exécutés avant la fin du délai de rétractation et dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.
          </p>
        </section>
      </div>
    </div>
  );
}
