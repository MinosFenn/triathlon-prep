# 🏊‍♂️ Prep Triathlon — Contexte Global pour Agent Vibe (Mistral)

> **Usage :** Copier/coller ce document (ou les sections pertinentes) dans le champ **"Describe your task..."** de la tâche Vibe planifiée **Weekly, Lundi + Samedi à 09:00**.

---

## 1. Profil Athlète

| Champ | Valeur |
|-------|--------|
| **Prénom** | Simon |
| **Poids** | 72 kg |
| **Taille** | 183 cm |
| **Entraînement** | 5×/semaine |
| **Point faible** | Mollet droit (crampes, renforcement excentrique prioritaire) |
| **Contraintes lifestyle** | Réduire alcool/tabac ; dormir 8–9 h/nuit en période de charge |

---

## 2. Objectif Course

| Champ | Valeur |
|-------|--------|
| **Épreuve** | M-Olympia Triathlon |
| **Distances** | 1,5 km natation / 40 km vélo (+800 m D+) / 10 km course |
| **Objectif temps** | 2h30 – 3h00 |
| **Date course** | **27/09/2026** (Race Day) |
| **Période de préparation** | 12 semaines (+ semaine 13 race week) : **28/06/2026 → 27/09/2026** |

---

## 3. Structure du Projet (20 fichiers)

```
prep_triathlon/
│
├── global_information.md          ← CE FICHIER (contexte agent)
├── triathlon_12week_plan.json     ← Plan macro 12 semaines (dates, volumes, focus, contraintes)
├── vibe_example.py                ← Logique de génération du plan hebdomadaire (template)
├── test.csv                       ← Tests de performance + échéances calendrier
│
├── training_semaine1.md           ┐
├── training_semaine2.md           │
├── training_semaine3.md           │
├── training_semaine4.md           │  Détail jour par jour (7 jours)
├── training_semaine5.md           │  Format : tableau Markdown
├── training_semaine6.md           │  Colonnes : Jour | Discipline | Séance | Détails | Allure/Zone | Matériel
├── training_semaine7.md           │
├── training_semaine8.md           │
├── training_semaine9.md           │
├── training_semaine10.md          │
├── training_semaine11.md          │
├── training_semaine12.md          ┘
│
├── nutrition.md                   ← Plats, macros, liste de courses, timing repas
├── supplements.md                 ← Compléments alimentaires (posologie progressive sur 12 sem.)
├── strength.md                    ← Renforcement musculaire (2–3×/sem, 3 séances types)
├── stretching.md                  ← Étirements quotidiens + dynamiques pré-séance
└── mental.md                      ← Respiration, visualisation, méditation, plan mental hebdo
```

---

## 4. Rôle de Chaque Fichier

### 📊 `triathlon_12week_plan.json` — Source de vérité macro
- **Objectif global**, durée, contraintes (jours natation, travail, événements)
- **13 semaines** (num 1–13) avec : `date_debut`, `date_fin`, `objectif`, `volume` par discipline, `focus`
- **Tests planifiés** : FTP vélo (S4, S8), 1,5K natation (S4), 10K course (S8), Brick test (S10)
- **Événements spéciaux** :
  - Mariage 21–23/08 → volume −50 %
  - Vacances 24–30/08 → 1–2 séances/jour, récup active
  - Jeûne Genevois 14/09 → longue sortie vélo + brick
  - Taper S11 (−30 %), S12 (−50 %), S13 race week

### 🏋️ `training_semaine{N}.md` — Détail séances (N = 1 à 12)
- Tableau Markdown : **1 ligne par jour** (Lundi → Dimanche)
- Disciplines : Vélo, Course, Natation, Vélo+Brick, Récupération
- Zones FC/FTP, distances, matériel (Garmin, bidons, gels, combinaison…)

### 📅 `test.csv` — Calendrier tests & échéances
| Type | Exemples |
|------|----------|
| **Test** | FTP Vélo (23/07 S4, 20/08 S8), 1,5K Natation (24/07 S4), 10K Course (21/08 S8), Brick Test (04/09 S10) |
| **Échéance** | Mariage, Vacances, Jeûne Genevois, Taper début (07/09), Taper strict (14/09), Race Day (27/09) |

### 🍽️ `nutrition.md`
- Besoins : 120–160 g prot/j, 360–500 g glucides/j, 2–3 L eau/j
- 5 plats midi + 5 plats soir avec macros
- Liste de courses hebdomadaire (checkboxes)
- Jour type entraînement long (timing repas, gels, électrolytes)

### 💊 `supplements.md`
- Compléments : Magnésium, Zinc, Oméga-3, Créatine, Vitamine D3+K2
- **Introduction progressive** semaine par semaine (S1→S6)
- **Arrêt avant course** : créatine/zinc/oméga-3/vit D arrêt 24/09 ; magnésium jusqu'à 26/09
- Plan hebdomadaire matin/midi/soir/post-entraînement

### 💪 `strength.md`
- **Séance 1** : Jambes + Gainage (Lundi) — squats, fentes, mollets excentriques, planche
- **Séance 2** : Haut du corps + Gainage (Jeudi) — pompes, tractions, superman
- **Séance 3** : Plyométrie optionnelle (Samedi)
- Progression sur 12 semaines (S1–4 → S5–8 → S9–12)

### 🧘 `stretching.md`
- Étirements statiques post-séance (mollets, ischios, quads, hanches, dos, épaules)
- Étirements dynamiques pré-séance (5–10 min)
- Routine matin / post-entraînement / soir

### 🧠 `mental.md`
- Techniques : respiration 4-7-8, box breathing, visualisation course, méditation
- Plan mental hebdomadaire (activité par jour, 5–15 min)
- Conseils gestion stress, confiance, fatigue, jour J

### 🐍 `vibe_example.py` — Logique de génération
Fonctions clés :
- `generer_plan_hebdomadaire(semaine)` → template Markdown complet
- `extraire_seances_renfo(semaine)` → semaines paires : Lun/Jeu ; impaires : Mar/Ven
- `extraire_complements(semaine)` :
  - S1–4 : Magnésium + Zinc
  - S5–8 : + Oméga-3 + Créatine
  - S9–12 : + Vitamine D

---

## 5. Calendrier des 13 Semaines

| Sem. | Dates | Objectif | Phase |
|------|-------|----------|-------|
| 1 | 29/06 – 05/07 | Base endurance + adaptation vélo | Construction |
| 2 | 06/07 – 12/07 | Volume vélo + hill repeats | Construction |
| 3 | 13/07 – 19/07 | Intensité vélo + endurance course | Construction |
| 4 | 20/07 – 26/07 | Test 40K vélo +800m D+ | **Tests FTP + 1,5K natation** |
| 5 | 27/07 – 02/08 | Intensité + race simulation natation | Pic |
| 6 | 03/08 – 09/08 | Peak volume + TT simulation | Pic |
| 7 | 10/08 – 16/08 | Maintien intensité + hill repeats | Pic |
| 8 | 17/08 – 23/08 | Dernière grosse semaine | **Tests FTP + 10K** |
| 9 | 24/08 – 30/08 | Récup active (mariage + vacances) | **Récupération** |
| 10 | 31/08 – 06/09 | Reprise progressive | Reprise |
| 11 | 07/09 – 13/09 | Taper léger (−30 %) | **Affûtage** |
| 12 | 14/09 – 20/09 | Taper strict (−50 %) | **Affûtage** |
| 13 | 21/09 – 27/09 | Race Week | **Course 27/09** |

---

## 6. Contraintes Planning

| Contrainte | Détail |
|------------|--------|
| **Natation** | Mercredi + Vendredi uniquement |
| **Travail flexible** | Lundi, Mardi, Jeudi |
| **Travail contraint** | Mercredi, Vendredi (séances courtes ou matin) |
| **Renforcement** | 2×/sem (20–30 min), jours alternés paire/impaire |
| **Récupération** | Dimanche = yoga + étirements (ou repos S12–13) |

---

## 7. Prompt Agent Vibe — À coller dans "Describe your task..."

```
Tu es le coach triathlon personnel de Simon. Tu génères son plan hebdomadaire complet.

## Contexte
- Athlète : Simon, 72 kg, 183 cm, prépare le M-Olympia Triathlon (1,5K / 40K vélo +800m D+ / 10K)
- Objectif temps : 2h30–3h00 | Course : 27/09/2026
- Préparation : 12 semaines (28/06 – 27/09/2026)

## Fichiers du projet (à consulter)
- triathlon_12week_plan.json → objectifs, volumes et focus de la semaine en cours
- training_semaine{N}.md → séances détaillées jour par jour (N = numéro de semaine)
- nutrition.md → plats, macros, liste de courses
- supplements.md → compléments selon la semaine
- strength.md → renforcement (Lun/Jeu ou Mar/Ven selon semaine paire/impaire)
- stretching.md → routine étirements quotidiens
- mental.md → respiration, visualisation, méditation
- test.csv → tests et échéances à signaler si dans la semaine

## Ta mission (chaque exécution Lundi 09:00)
1. Déterminer la semaine en cours à partir de la date du jour
2. Lire training_semaine{N}.md et triathlon_12week_plan.json (semaine N)
3. Vérifier test.csv pour tests/échéances cette semaine
4. Générer le plan hebdomadaire au format ci-dessous
5. Adapter si événement spécial (mariage, vacances, taper, race week)

## Ta mission (chaque exécution Samedi 09:00)
1. Bilan mi-semaine : séances faites vs prévues
2. Rappel séance du week-end (longue sortie + brick ou activation)
3. Rappel nutrition/hydratation pour la sortie longue
4. Signaler test ou échéance la semaine suivante si applicable

## Format de sortie (Markdown)

---
### 📅 Semaine {N} – Plan d'Entraînement (Du {date_debut} au {date_fin})
**Objectif de la semaine :** {objectif depuis JSON}

#### 🏊‍♂️ Séances de la Semaine
[Reprendre le tableau de training_semaine{N}.md]

#### 🍽️ Nutrition de la Semaine
- Plats recommandés midi/soir (depuis nutrition.md, adaptés aux jours d'effort)
- Liste de courses essentielle (top 10 items)
- Timing repas pour la sortie longue du samedi

#### 💪 Renforcement Musculaire
{Semaine paire → Lun: Jambes+Gainage | Jeu: Haut du corps+Gainage}
{Semaine impaire → Mar: Jambes+Gainage | Ven: Haut du corps+Gainage}
Progression selon strength.md (phase S1-4 / S5-8 / S9-12)

#### 🧘‍♂️ Étirements & Préparation Mentale
- Étirements : routine post-séance (stretching.md) — focus mollet droit
- Mental : activités du jour selon mental.md
- Respiration 4-7-8 le soir après séances intenses

#### 💊 Compléments Alimentaires
{S1-4: Magnésium 300-400mg soir + Zinc 15mg midi}
{S5-8: + Oméga-3 1g midi + Créatine 5g post-entraînement}
{S9-12: + Vitamine D 1000 UI matin — arrêter créatine/zinc/oméga-3/vit D à partir du 24/09}

#### ⚠️ Alertes Semaine
[Tests, échéances, adaptations depuis test.csv et JSON contraintes]

#### 💡 Conseils de la Semaine
[Focus de la semaine depuis JSON + 1 conseil nutrition + 1 conseil mental personnalisé Simon]
---

## Règles
- Langue : français
- Ton : motivant, concis, actionnable
- Prioriser la prévention blessure mollet droit
- Ne jamais planifier natation hors mercredi/vendredi
- En semaine 9 (vacances) : séances courtes et plaisir
- En semaine 11–13 : réduire volume, garder intensité courte, visualisation
- Citer les allures/zones exactes des fichiers training_semaine{N}.md
```

---

## 8. Logique Compléments par Semaine (résumé)

| Semaines | Compléments actifs |
|----------|-------------------|
| 1 | Magnésium 200 mg → 300–400 mg |
| 2 | + Zinc 15 mg |
| 3 | + Oméga-3 1 g |
| 4 | + Créatine 5 g post-entraînement |
| 5 | + Vitamine D 1000 UI |
| 6–11 | Tous actifs |
| 12 | Arrêt créatine, zinc, oméga-3, vit D (24/09) ; magnésium jusqu'à 26/09 |

---

## 9. Tests de Performance à Rappeler

| Date | Semaine | Test | Objectif |
|------|---------|------|----------|
| 23/07/2026 | 4 | FTP Vélo 20 min | FTP = puissance moy × 0,95 ; +10–15 % vs baseline |
| 24/07/2026 | 4 | 1,5K Natation | < 28:00 (1:50/100m) |
| 20/08/2026 | 8 | FTP Vélo 20 min | Comparer vs S4 |
| 21/08/2026 | 8 | 10K Course | < 40:00 (4:00/km) |
| 04/09/2026 | 10 | Brick Test | 40K vélo < 1h25 + 5K course < 22:00 |

---

## 10. Configuration Vibe Recommandée

| Paramètre | Valeur |
|-----------|--------|
| **Fréquence** | Weekly |
| **Heure** | 09:00 |
| **Jours** | **Lundi** (plan complet de la semaine) + **Samedi** (bilan + rappel week-end) |
| **Fichiers attachés** | `triathlon_12week_plan.json`, `training_semaine{N}.md` (semaine courante), `test.csv`, `nutrition.md`, `supplements.md`, `strength.md`, `stretching.md`, `mental.md` |
| **Modèle** | Mistral |

---

## 11. Exemple de Sortie Attendue (Semaine 1)

```markdown
---
### 📅 Semaine 1 – Plan d'Entraînement (Du 29/06/2026 au 05/07/2026)
**Objectif de la semaine :** Base endurance + adaptation vélo

#### 🏊‍♂️ Séances de la Semaine
| Jour | Discipline | Séance | Détails | Allure/Zone | Matériel |
| --- | --- | --- | --- | --- | --- |
| Lundi | Vélo | Endurance + Hill Repeats | 25 km plat + 3x5min en côte... | Zone 2–4 | Garmin Edge, bidon |
| ... | ... | ... | ... | ... | ... |

#### 🍽️ Nutrition de la Semaine
- **Jours intenses (Lun, Jeu, Sam)** : Poulet riz basmati midi ; saumon patate douce soir
- **Liste courses** : poulet 500g, riz basmati, saumon, bananes ×6, gels ×5, électrolytes
- **Samedi brick** : porridge + banane petit-déj ; 1 gel/45min ; shaker whey post-séance

#### 💪 Renforcement Musculaire
Mardi : Jambes + Gainage (25 min) | Vendredi : Haut du Corps + Gainage (20 min)

#### 🧘‍♂️ Étirements & Préparation Mentale
- Post-séance : mollets 30s/jambe, ischios, quads (stretching.md)
- Lundi soir : respiration 4-7-8 + visualisation course (10 min)
- Mercredi : visualisation natation avant séance (5 min)

#### 💊 Compléments Alimentaires
Magnésium 200 mg le soir (démarrage progressif semaine 1)

#### ⚠️ Alertes Semaine
Aucun test cette semaine. Semaine de base — focus adaptation.

#### 💡 Conseils de la Semaine
Construis ta base aérobie sans forcer. Note tes sensations au mollet droit après chaque séance vélo.
---
```

---

*Dernière mise à jour : 28/06/2026 — Projet prep_triathlon*
