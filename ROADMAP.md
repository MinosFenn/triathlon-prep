# Roadmap — Prep Triathlon

Document de suivi des **fonctionnalités en cours**, **à développer**, **points de vigilance** et **évolutions futures**.

*Dernière mise à jour : 02/07/2026*

---

## État actuel (résumé)

| Domaine | Statut |
|---------|--------|
| Plan 12 semaines (markdown + JSON) | ✅ Opérationnel |
| Vue jour (séances, étirements, mental, renforcement, compléments) | ✅ Opérationnel |
| Points séances + bonus (checkboxes) | ✅ Opérationnel |
| Statistiques (empilées par sport, affûtage) | ✅ Opérationnel |
| Météo (Open-Meteo, conseils par sport) | 🟡 Phase 1 — Genève par défaut, sans lieux |
| Lieux / circuits / travail / créneaux | ❌ Planifié (voir §2) |
| Garmin Connect | 🟡 Code en place, **non validé en production** |
| Ajustement IA depuis les ressentis | ❌ Non implémenté (placeholder UI) |

---

## 1. Ajustement automatique par IA (ressentis)

### Situation actuelle

- Le champ **« Mes ressentis »** sur chaque séance sportive enregistre du texte libre dans le **localStorage** (`triathlon-notes-week-{N}`, clé `day-{index}.note`).
- Aucun appel API, aucun LLM, aucune modification automatique du plan.
- Le placeholder et la page Statistiques mentionnent un futur ajustement — **c’est une intention, pas une feature active**.
- Le type `TrainingSession.adjusted?` existe dans le code mais n’est pas utilisé.
- L’ancien champ « Ajustements » a été retiré de l’UI en attendant cette feature.

### Vision (alignée avec `global_information.md`)

Un agent coach (ex. Mistral) lirait : profil athlète, séance planifiée, ressenti saisi, historique récent (fatigue, mollet droit) → proposerait ou appliquerait une adaptation **sans casser la structure macro du plan** (`triathlon_12week_plan.json`).

---

### Phase 1 — Export & contexte agent (MVP documentation)

**Objectif :** rendre les ressentis exploitables hors app, sans LLM intégré.

| Tâche | Détail |
|-------|--------|
| Export JSON | Bouton ou route `/api/export/feedback` : semaine, jour, séance, ressenti, complété |
| Contexte structuré | Inclure discipline, zone, durée estimée, points, compléments bonus cochés |
| Prompt template | Fichier `prompts/adjust-session.md` réutilisable par un agent externe (Cursor, Mistral Le Chat, script Python) |
| Doc utilisateur | Mode d’emploi : copier-coller ressenti + séance dans l’agent |

**Livrable :** l’utilisateur peut faire des ajustements manuels assistés par IA **en dehors** de l’app.

---

### Phase 2 — API d’ajustement (proposition IA)

**Objectif :** l’app appelle un LLM et affiche une **proposition**, sans l’appliquer automatiquement.

| Tâche | Détail |
|-------|--------|
| Route `POST /api/adjust-session` | Entrée : `week`, `dayIndex`, `session`, `note`, profil |
| Intégration LLM | Mistral / OpenAI via variable d’env `LLM_API_KEY` |
| Réponse structurée | JSON : `{ summary, adjustedDetails, adjustedType?, warning?, confidence }` |
| UI | Bloc « Proposition IA » sous « Mes ressentis » + boutons *Accepter* / *Ignorer* |
| Garde-fous | Refuser si séance test / semaine race ; plafonner variation volume (ex. ±20 %) |

**Livrable :** suggestion visible dans l’app, validation humaine obligatoire.

---

### Phase 3 — Application & persistance des ajustements

**Objectif :** les modifications acceptées deviennent la séance « effective » du jour.

| Tâche | Détail |
|-------|--------|
| Stockage | `adjustedDetails`, `adjustedAt`, `adjustmentSource: "ai"` dans localStorage ou BDD |
| Affichage | Carte séance : badge « Ajustée » + diff planifié / appliqué |
| Recalcul | `enrichSessionMeta()` sur le texte ajusté → durée et points mis à jour |
| Historique | Journal des ajustements par semaine (audit, rollback) |
| Sync stats | Points basés sur séance ajustée si validée |

**Livrable :** boucle complète ressenti → IA → validation → plan du jour modifié.

---

### Variables d’environnement prévues (Phase 2+)

```env
LLM_PROVIDER=mistral          # ou openai
LLM_API_KEY=
LLM_MODEL=mistral-small-latest
```

---

---

## 2. Lieux, lieu de travail & plages horaires

Complément à la **météo** (déjà en place via Open-Meteo + `/api/weather`) : personnaliser *où* s’entraîner, *d’où* on part (travail / domicile), et *quand* c’est réaliste dans la journée.

### Situation actuelle (météo)

| Composant | Fichier / route |
|-----------|-----------------|
| API Open-Meteo (gratuit, sans clé) | `src/lib/weather/open-meteo.ts` |
| Route serveur + cache | `/api/weather` |
| Conseils par discipline | `src/lib/weather/recommendations.ts` |
| Bandeau vue jour | `DayWeatherBanner` dans `DayTab` |
| Coordonnées par défaut | `.env` → `WEATHER_DEFAULT_LAT/LON` (Genève) |

**Limite actuelle :** une seule position (Genève). Pas encore de circuits recommandés ni de lien avec le travail ou les horaires.

---

### Phase 1 — Fichier `locations.json` (circuits & spots)

**Objectif :** source de vérité éditable pour les lieux d’entraînement préconisés.

| Tâche | Détail |
|-------|--------|
| Fichier `locations.json` | Id, nom, `disciplines[]`, lat/lon, type (`pool`, `open_water`, `road`, `trail`, `indoor`) |
| Circuits vélo | Distance, D+, lien Strava/Komoot, notes (ex. Col de la Faucille, boucles lac) |
| Spots natation | Piscines, eau libre (Bains des Pâquis, etc.), seuil combinaison |
| Parcours course | Parcs, sentiers, surface |
| Fallback indoor | Home-trainer, tapis — lié aux alertes météo (pluie / vent) |
| Loader | `src/lib/data/load-locations.ts` → `loadAppData()` |
| UI | Carte lieu du jour sous le bandeau météo + lien Google Maps |
| API météo | `/api/weather?locationId=…` ou `lat`/`lon`/`label` par spot |

**Règles d’association séance ↔ lieu (progressif) :**

1. Par défaut : `sessionDefaults` dans JSON (ex. natation → piscine X)
2. Par jour / type : `bestFor` sur chaque lieu
3. (Optionnel) Colonne **Lieu** dans `training_semaine{N}.md`

---

### Phase 2 — Lieu de travail

**Objectif :** adapter les recommandations de lieu et de créneau au contexte pro (trajets, matériel sur place).

| Tâche | Détail |
|-------|--------|
| Entrée `workplace` | Dans `locations.json` ou section dédiée : adresse, lat/lon, nom employeur |
| Entrée `home` | Domicile (optionnel) pour calcul « depuis la maison » vs « depuis le bureau » |
| Météo multi-points | Météo domicile / bureau / spot séance si coords différentes |
| Contraintes | Jours télétravail vs bureau (ex. natation midi seulement si piscine proche bureau) |
| UI paramètres | `/parametres` : adresse travail, jours au bureau (localStorage ou `.env` perso) |
| Suggestions | « Séance vélo : départ bureau → boucle X → retour » |

**Variables d’environnement possibles :**

```env
WORKPLACE_LAT=
WORKPLACE_LON=
WORKPLACE_LABEL=Bureau
HOME_LAT=
HOME_LON=
```

---

### Phase 3 — Plages horaires d’entraînement

**Objectif :** croiser plan du jour, météo et disponibilités réelles pour proposer *quand* faire la séance.

| Tâche | Détail |
|-------|--------|
| Fichier ou config | `schedule-preferences.json` ou bloc dans `global_information.md` / paramètres |
| Créneaux préférés | Ex. matin 6h–8h, midi 12h–13h, soir 18h–20h |
| Créneaux bloqués | Réunions récurrentes, heures de bureau fixes |
| Lien timeline app | Mapper créneaux aux slots existants (`réveil`, `avant séance`, `séance`, `soir`) |
| Météo horaire | Open-Meteo `hourly` : pluie / vent prévus sur le créneau choisi |
| Recommandation | « Vélo 18h : vent 45 km/h → home-trainer ou décaler à 7h demain » |
| UI | Badge « Créneau suggéré : 7h00 » sur l’en-tête jour |

**Exemples de règles :**

- Natation midi uniquement si `workplace` à < 15 min d’une piscine
- Longue sortie vélo : samedi matin si météo OK entre 8h et 12h
- Brick : créneau minimum 2h30 libre consécutif

---

### Phase 4 — Synthèse « plan du jour intelligent »

| Entrée | Sortie |
|--------|--------|
| Séance planifiée (markdown) | Lieu recommandé + lien Maps |
| Météo (spot + horaire) | Alertes OK / Prudence / Attention |
| Travail + plages horaires | Créneau optimal + alternative indoor |
| (Futur) Garmin | Ajuster si séance déjà faite à un autre créneau |

---

### Priorité lieux / travail / horaires

1. **`locations.json` + affichage lieu du jour** (extension naturelle de la météo)
2. **Lieu de travail** dans paramètres (lat/lon suffisent)
3. **Plages horaires** + prévisions horaires Open-Meteo
4. **Colonne Lieu** dans les markdown semaine (optionnel, plus fin)

---

## 3. Garmin Connect — Activity API

Référence : [Garmin Connect Developer Program — Activity API](https://developer.garmin.com/gc-developer-program/activity-api/)

### Déjà implémenté (code)

| Composant | Fichier / route |
|-----------|-----------------|
| OAuth 2.0 PKCE | `/api/garmin/auth`, `/api/garmin/callback` |
| Webhook Push + Ping | `/api/garmin/webhook` |
| Statut / matchs / déconnexion | `/api/garmin/status`, `/matches`, `/disconnect` |
| Stockage tokens & activités | `src/lib/garmin/store.ts` (fichier local + Upstash Redis) |
| Matching date + sport | `src/lib/garmin/activity-matcher.ts` |
| Auto-validation séance | `useGarminMatches` + merge localStorage |
| UI paramètres | `/parametres` — `GarminConnectPanel` |
| Badge sur séance | `SessionCard` (durée / distance Garmin) |

### Reste à développer / valider

| Priorité | Tâche | Détail |
|----------|-------|--------|
| 🔴 Haute | **Accès Developer Program** | Demande d’approbation Garmin (Evaluation → Production) |
| 🔴 Haute | **Config production** | Variables `.env` sur Vercel + Upstash Redis obligatoire |
| 🔴 Haute | **Test E2E réel** | OAuth → sync montre → webhook → match → validation auto |
| 🟠 Moyenne | **Webhook en local** | Tunnel ngrok pour tester Push pendant le dev |
| 🟠 Moyenne | **Rafraîchissement UI** | Recharger les matchs après webhook sans recharger la page (SSE ou polling léger) |
| 🟠 Moyenne | **Pull / backfill** | Récupérer activités passées via API Tools (historique au premier connect) |
| 🟠 Moyenne | **Parsing FIT** | Exploiter fichiers `.FIT` pour segments réels vs estimation plan |
| 🟡 Basse | **Multi-utilisateurs** | Aujourd’hui : mono-athlète (`GARMIN_ATHLETE_ID`) |
| 🟡 Basse | **Match brick avancé** | Séparer vélo + course dans un même jour brick |
| 🟡 Basse | **Timezone explicite** | Matching strict Europe/Paris vs UTC webhook |

### Checklist mise en prod Garmin

1. [ ] Compte approuvé sur [developerportal.garmin.com](https://developerportal.garmin.com)
2. [ ] App Evaluation créée avec redirect URI production
3. [ ] Webhook Push : `https://{domaine}/api/garmin/webhook`
4. [ ] `GARMIN_*` + `UPSTASH_REDIS_*` sur Vercel
5. [ ] Test connexion depuis `/parametres`
6. [ ] Test sync activité vélo / course / natation
7. [ ] Passage Production après validation Garmin

---

## 4. Points de vigilance

### Données & persistance

- **localStorage uniquement** : notes, validation séances, bonus étirements/compléments — **perdues** si cache navigateur effacé ou changement d’appareil.
- **Pas d’authentification** : toute personne avec l’URL accède au plan et aux données locales du navigateur.
- **Garmin tokens** : en local dans `data/garmin/` (gitignored) ; en prod dépendent d’Upstash — sans Redis, tokens perdus à chaque cold start Vercel.

### Plan & contenu

- **Semaine 13** : pas de `training_semaine13.md` — séances générées par fallback code.
- **Durées séances** : estimées par heuristiques (`session-meta.ts`), pas par fichier FIT Garmin.
- **Compléments** : plan journalier filtré selon stack progressive ; le tableau `supplements.md` peut diverger du fallback si parsing échoue.
- **Dates** : ancrées sur `date_debut` du JSON ; vérifier cohérence après modification manuelle des markdown.

### Technique

- **Données serveur vs client** : tout fichier lu via `fs` doit passer par `loadAppData()` — jamais importé dans un Client Component (erreur `Can't resolve 'fs'`).
- **Boucles fetch** : éviter de lier `triathlon-tracking-update` à des refetch Garmin (corrigé une fois, à ne pas réintroduire).
- **Repo git** : le dépôt git peut être initialisé au mauvais niveau (parent `C:/Users/joach`) — risque de commits hors projet.

### Garmin / légal

- Consentement utilisateur OAuth Garmin requis.
- Respecter les limites du programme Developer (Evaluation vs Production).
- Données santé / activité : ne pas exposer publiquement les webhooks sans secret.

---

## 5. Améliorations recommandées (court terme)

| Domaine | Amélioration |
|---------|--------------|
| **UX** | Indicateur de sync Garmin « dernière activité reçue il y a X min » |
| **UX** | Total points bonus du jour visible en en-tête onglet jour |
| **Stats** | Inclure points bonus dans graphique hebdo empilé (couche violette) |
| **Données** | Export / import JSON backup (notes + bonus + semaine) |
| **Mobile** | PWA (manifest + service worker) pour usage post-entraînement |
| **Accessibilité** | Labels ARIA sur checkboxes bonus et validation séance |
| **Contenu** | Créer `training_semaine13.md` pour la race week |
| **Tests** | Tests unitaires sur `activity-matcher`, `session-meta`, `parseActivitySegments` |
| **Copy UI** | Remplacer « futur ajustement IA » par texte honnête tant que Phase 1 non livrée |

---

## 6. Futurs développements (moyen / long terme)

### Lieu & mobilité (après §2)

- Carte interactive (Leaflet / Mapbox) avec circuits vélo et spots natation.
- Import GPX des parcours favoris.
- Estimation temps trajet domicile / bureau → spot (API routing optionnelle).

### Coach agent (vision `global_information.md`)

- Agent Mistral hebdomadaire : lit JSON + markdown semaine → génère conseils, ajuste volumes si événement (mariage, taper).
- Intégration fichiers attachés automatique (comme `vibe_example.py`).
- Notifications : rappel compléments soir, séance du lendemain.

### Infrastructure

- Base de données (Supabase / Postgres) : utilisateurs, notes, ajustements IA, activités Garmin.
- Auth (NextAuth ou Clerk) pour Simon + éventuellement coach.
- Déploiement CI : build + tests sur chaque PR.

### Entraînement avancé

- Import TCX/GPX manuel si pas de Garmin.
- Courbes charge (TSS / points) sur 12 semaines.
- Intégration nutrition : checklist repas du jour selon type (intense / modéré / longue sortie).
- RPE (effort perçu) lié aux ressentis → input structuré en plus du texte libre.

### Social / course

- Compte à rebours J-XX vers M-Olympia.
- Checklist matériel jour J (depuis `training_semaine12.md` / CSV).
- Mode « Race Week » : UI simplifiée, taper visuel.

---

## 7. Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `global_information.md` | Contexte athlète + spec agent Mistral |
| `.env.example` | Variables Garmin, Redis, météo, app URL |
| `locations.json` *(à créer)* | Circuits, piscines, spots, fallback indoor |
| `src/lib/weather/` | Météo Open-Meteo + recommandations sport |
| `src/app/api/weather/route.ts` | API météo côté serveur |
| `src/lib/storage/tracking.ts` | Points séances + bonus |
| `src/lib/garmin/` | Intégration Garmin |
| `src/components/sessions/SessionCard.tsx` | Ressentis (placeholder IA) |
| `supplements.md` | Plan compléments + calendrier progressif |

---

## 8. Priorisation suggérée

1. **Garmin E2E en production** (valeur immédiate, sync auto séances)
2. **`locations.json` + lien météo par spot** (§2 Phase 1)
3. **Export ressentis (Phase IA 1)** — faible effort, utile tout de suite
4. **Backup localStorage** — sécuriser les données utilisateur
5. **Lieu de travail + plages horaires** (§2 Phases 2–3)
6. **API ajustement IA (Phase 2)** — quand clé LLM disponible
7. **BDD + auth** — avant multi-appareils ou multi-utilisateurs

---

*Ce document doit être mis à jour à chaque livraison majeure.*
