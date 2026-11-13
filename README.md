# Covoit Collègues 🚗

Application mobile (iOS + Android) de covoiturage **entre collègues uniquement** — 100 % gratuit, aucune transaction.

## Fonctionnalités

- **Comptes** : inscription réservée aux emails autorisés (liste blanche), connexion email/mot de passe
- **Le premier compte créé devient administrateur**
- **Publier un trajet** : départ, arrivée, date, heure, places, précisions
- **Chercher et réserver** : liste des trajets à venir, filtre par ville de départ, réservation en 1 tap
- **Détail du trajet** : conducteur (téléphone cliquable), voiture, passagers, messages entre participants
- **Mes trajets** : onglets « Je conduis » / « Je suis passager », historique complet
- **Administration** : gestion de la liste des emails autorisés, liste des utilisateurs
- **Intégration Grist (optionnelle)** : la liste des collègues autorisés peut être gérée dans un tableur Grist et synchronisée dans l'app

## Structure

```
backend/   API Node.js/Express + SQLite (JWT)
mobile/    Appli Expo (React Native + TypeScript)
```

## Démarrer en local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # renseigne JWT_SECRET
npm start              # API sur http://localhost:3000
```

### 2. Appli mobile

```bash
cd mobile
npm install
npm start              # puis scanne le QR code avec Expo Go (iOS/Android)
```

Sur téléphone réel, modifie `apiUrl` dans `mobile/app.json` avec l'IP locale de ton ordinateur
(ex : `http://192.168.1.42:3000`), puis relance `npm start`.

## Gérer les personnes autorisées

Deux méthodes, cumulables :

1. **Depuis l'app** (écran Profil > Gestion des accès, en tant qu'admin) : ajouter/retirer des emails un par un.
2. **Depuis Grist** :
   - crée un document Grist avec un tableau nommé `Autorisations` contenant une colonne `Email` (optionnel : `Nom`, `Actif`) ;
   - crée une clé API dans Grist (Paramètres du compte > Clés API) ;
   - renseigne `GRIST_API_KEY`, `GRIST_DOC_ID` (l'id est dans l'URL du document) dans `backend/.env` ;
   - redémarre le backend, puis appuie sur « Synchroniser depuis Grist » dans l'écran admin.
   - Les emails retirés du tableau Grist sont retirés de la liste blanche à chaque synchro.

## Hébergement (quand tu seras prêt)

- **Backend** : n'importe quel hébergeur Node (Render, Railway, Fly.io, VPS…). SQLite = un simple fichier, pense à un volume persistant. Renseigne `JWT_SECRET` et `PORT` sur l'hébergeur.
- **Appli** : `apiUrl` pointera vers l'URL publique du backend. Distribution :
  - la plus simple : **Expo Go** ou un build de développement partagé (pas de store) ;
  - pour une vraie distribution : `eas build` (comptes Apple Developer / Google Play requis).

## Sécurité

- Mots de passe hachés (bcrypt), sessions par token JWT (30 jours)
- Seuls les emails de la liste blanche peuvent créer un compte
- Les routes d'administration sont réservées aux admins
