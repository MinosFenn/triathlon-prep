# Exemple de logique pour générer le plan hebdomadaire
def generer_plan_hebdomadaire(semaine):
    # Récupérer les données de la semaine depuis triathlon_12weeks_plan.json
    plan_semaine = get_semaine_from_json(semaine)

    # Générer le template Markdown
    template = f"""
    ---
    ### **📅 Semaine {semaine} – Plan d’Entraînement (Du {plan_semaine['date_debut']} au {plan_semaine['date_fin']})**
    **Objectif de la semaine :** {plan_semaine['objectif']}

    {generer_seances(plan_semaine['seances'])}

    ### **🍽️ Nutrition de la Semaine**
    [Voir la liste de plats et courses](lien_vers_triathlon_nutrition.md)

    ### **🧘‍♂️ Étirements & Préparation Mentale**
    - **Étirements :** [Voir la routine](lien_vers_triathlon_stretching.md)
    - **Respiration :** [Voir les techniques](lien_vers_triathlon_mental.md)
    - **Renforcement :** {extraire_seances_renfo(plan_semaine['semaine'])}

    ### **💊 Compléments Alimentaires**
    {extraire_complements(semaine)}

    ### **💡 Conseils de la Semaine**
    {plan_semaine['conseils']}
    ---
    """

    return template

# Fonction pour extraire les séances de renforcement
def extraire_seances_renfo(semaine):
    if semaine % 2 == 0:
        return "Lundi : Jambes + Gainage | Jeudi : Haut du Corps + Gainage"
    else:
        return "Mardi : Jambes + Gainage | Vendredi : Haut du Corps + Gainage"

# Fonction pour extraire les compléments
def extraire_complements(semaine):
    if semaine <= 4:
        return "Magnésium (300–400 mg le soir) + Zinc (15 mg le midi)."
    elif semaine <= 8:
        return "Magnésium + Zinc + Oméga-3 (1 g le midi) + Créatine (5 g post-entraînement)."
    else:
        return "Magnésium + Zinc + Oméga-3 + Créatine + Vitamine D (1000 UI le matin)."