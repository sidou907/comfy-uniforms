# COMFY UNIFORMS — site e-commerce statique

Site en HTML / CSS / JavaScript pur : **aucune installation, aucun serveur, aucune base de données**.
Il suffit d'ouvrir `index.html` dans un navigateur, ou de déposer le dossier chez un hébergeur.

---

## 1. Les 3 réglages indispensables

Tout se passe dans **`assets/js/data.js`**, tout en haut du fichier :

```js
const SHOP = {
  whatsapp: '213773747389',   // ← LE NUMÉRO QUI REÇOIT LES COMMANDES (déjà configuré)
  phoneDisplay: '0773 74 73 89',
  email: 'contact@comfyuniforms.dz',
  deliveryFee: 600,           // frais de livraison en DA
  freeDeliveryFrom: 15000     // livraison offerte à partir de ce montant (0 = jamais)
};
```

> ⚠️ Le numéro WhatsApp s'écrit **au format international, sans `+` ni espaces**.
> `0773 74 73 89` devient `213773747389`.
>
> Il reste à personnaliser : l'`email`, et les liens Facebook / Instagram
> (juste en dessous dans le même bloc `SHOP`).

---

## 2. Comment fonctionne une commande

1. Le client choisit taille + couleur et clique « Ajouter au panier ».
2. Le panier est conservé dans le navigateur (`localStorage`) — il survit à la fermeture de l'onglet.
3. Sur `panier.html`, le client saisit nom / téléphone / wilaya.
4. Le bouton vert ouvre **WhatsApp avec la commande déjà rédigée** :

```
🩺 Nouvelle commande — COMFY UNIFORMS
────────────────────
👤 Nom : Amina Belkacem
📞 Téléphone : 0770 12 34 56
📍 Wilaya : 16 Alger
🏠 Adresse : Cité des Annassers
────────────────────
🛒 Détail de la commande :

1. Tunique Radiologie « Cobalt »
   Taille : M  |  Couleur : Vert émeraude
   2 × 6 900 DA = 13 800 DA
────────────────────
Sous-total : 13 800 DA
Livraison : 600 DA
💰 TOTAL : 14 400 DA
```

Il ne reste plus qu'à appuyer sur « Envoyer ». Aucun paiement en ligne, aucun compte à créer.

---

## 3. Ajouter les vraies photos

Les cadres gris rayés sont des **emplacements de secours** : dès qu'une image existe au bon
chemin, elle s'affiche automatiquement. Aucun code à modifier.

| Image | Chemin à respecter | Format conseillé |
|---|---|---|
| Logo | `assets/img/logo.png` | PNG fond transparent |
| Photo d'accueil | `assets/img/hero.jpg` | vertical 4/5, 1200 px de large |
| Showroom (contact) | `assets/img/showroom.jpg` | paysage |
| Catégorie | `assets/img/cat-radiologie.jpg`, `cat-blouses.jpg`, `cat-homme.jpg`, `cat-femme.jpg`, `cat-accessoires.jpg` | vertical 3/4 |
| Produit (principale) | `assets/img/products/<id-du-produit>.jpg` | 1000 × 1000 px |
| Produit (galerie) | `assets/img/products/<id>-1.jpg` … `-4.jpg` | mêmes dimensions |

L'`<id-du-produit>` est le champ `id` dans `data.js` : par exemple `radio-cobalt.jpg`,
`ens-nour.jpg`, `blouse-classique.jpg`.

💡 Compressez les photos avant de les mettre en ligne (viser < 200 Ko par image).

---

## 4. Ajouter ou modifier un produit

### La méthode simple : `admin.html` (aucune connaissance technique requise)

Ouvrez **`admin.html`** dans votre navigateur (double-clic sur le fichier). C'est un outil
privé qui tourne sur votre ordinateur : rien n'est envoyé sur internet.

| Onglet | À quoi il sert |
|---|---|
| **Produits** | Ajouter, modifier, dupliquer, supprimer, réordonner. Aperçu de la fiche en direct. |
| **Ma boutique** | Numéro WhatsApp, e-mail, réseaux sociaux, frais de livraison. |
| **Publier** | Les 5 étapes pour mettre les changements en ligne + la liste des photos manquantes. |

Le déroulé habituel :

1. **+ Nouveau** → remplir le nom, le prix, la catégorie, choisir les coloris et les tailles.
   L'identifiant et le nom de fichier de la photo se calculent tout seuls.
2. **Enregistrer le produit** → il apparaît dans la liste de gauche.
3. Copier la photo dans `assets/img/products/` avec **exactement** le nom affiché par l'outil
   (bouton ⧉ pour copier le chemin).
4. **⬇ Télécharger data.js** → remplacer `assets/js/data.js` par le fichier téléchargé.
5. Redéployer sur Cloudflare Pages (voir §6).

> Le travail en cours est conservé dans le navigateur : vous pouvez fermer la page et
> reprendre plus tard. Rien n'est visible en ligne tant que `data.js` n'a pas été remplacé.
>
> Ne mettez pas `admin.html` en ligne — c'est un outil local, il n'a rien à faire sur le site
> public. Si vous le déployez quand même, il ne présente aucun risque pour les données :
> il ne sait que générer un fichier à télécharger.

### La méthode manuelle (pour le développeur)

Dans `assets/js/data.js`, copiez un bloc existant du tableau `PRODUCTS` :

```js
{
  id: 'mon-produit',              // identifiant unique, sert aussi au nom de la photo
  name: 'Nom en français',
  name_ar: 'الاسم بالعربية',
  cat: 'blouses',                 // radiologie | blouses | homme | femme | accessoires
  price: 5900,                    // en DA, sans espace ni symbole
  oldPrice: null,                 // prix barré, ou null
  rating: 4.8, reviews: 42,
  tag: 'Nouveau', tag_ar: 'جديد', // badge sur la photo, ou null
  featured: true,                 // true = apparaît sur la page d'accueil
  colors: [C.vert, C.navy],       // couleurs prédéfinies en haut du fichier
  sizes: SIZES_STD,               // ou ['S','M','L'] / SIZES_ACC
  img: 'assets/img/products/mon-produit.jpg',
  desc: 'Description en français.',
  desc_ar: 'الوصف بالعربية.',
  fabric: 'Polycoton 65/35',  fabric_ar: 'بوليستر/قطن 65/35',
  care: 'Lavable à 60 °C',    care_ar: 'يُغسل على 60 °م'
}
```

Le produit apparaît aussitôt dans le catalogue, les filtres, la recherche et le compteur
de la page d'accueil — rien d'autre à toucher.

---

## 5. Bilingue français / arabe

Le sélecteur en haut à droite bascule toute l'interface, y compris le sens de lecture
(RTL) et le message WhatsApp. Le choix est mémorisé.

- Textes fixes : attribut `data-ar="…"` directement dans le HTML.
- Textes du catalogue : champs `_ar` dans `data.js`.
- Textes générés par le code : dictionnaire `T` en haut de `assets/js/app.js`.

---

## 6. Mettre le site en ligne sur Cloudflare Pages

Le site est **100 % statique** : Cloudflare Pages l'héberge gratuitement, sans limite de
trafic, avec HTTPS automatique.

### Méthode A — glisser-déposer (la plus simple, aucun outil à installer)

1. Se connecter sur <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   onglet **Pages** → **Upload assets**.
2. Donner un nom au projet, par exemple `comfy-uniforms`.
3. Glisser-déposer le **contenu du dossier `site`** (pas le dossier lui-même : `index.html`
   doit se retrouver à la racine).
4. **Deploy**. Le site est en ligne sur `https://comfy-uniforms.pages.dev`.

Pour chaque mise à jour (nouveau produit, nouvelle photo) : revenir sur le projet →
**Create new deployment** → redéposer les fichiers.

### Méthode B — via Git (recommandée si vous modifiez souvent)

1. Mettre le dossier `site` sur GitHub.
2. Cloudflare Pages → **Connect to Git** → choisir le dépôt.
3. Réglages de build :
   - **Framework preset** : `None`
   - **Build command** : *(laisser vide)*
   - **Build output directory** : `/` (ou `site` si le dépôt contient tout le projet)
4. Chaque `git push` redéploie le site automatiquement.

### Nom de domaine

Dans le projet Pages → **Custom domains** → **Set up a domain**. Si le domaine est déjà
géré par Cloudflare, le rattachement prend une minute. Un `.dz` s'achète auprès du NIC-DZ
(ou passer par un `.com` / `.store` chez un registrar international).

### Le fichier `_headers`

À la racine du site, `_headers` est lu automatiquement par Cloudflare Pages : il fixe la
durée de cache (photos = 30 jours, code = 5 minutes) et quelques en-têtes de sécurité.
**Ne pas le supprimer ni le renommer.** Grâce au cache court sur le code, un changement de
prix dans `data.js` est visible par tout le monde en quelques minutes.

> Le site fonctionne aussi tel quel sur Netlify, Vercel, GitHub Pages ou un hébergement FTP
> classique — mais `_headers` n'est interprété que par Cloudflare Pages et Netlify.

---

## 7. Structure des fichiers

```
site/
├── index.html          Accueil : héro, catégories, best-sellers, FAQ, contact
├── produits.html       Catalogue complet : filtres, recherche, tri
├── produit.html        Fiche produit (?id=…)
├── panier.html         Panier + formulaire de commande WhatsApp
├── admin.html          ⭐ Outil local de gestion des produits (ne pas déployer)
├── _headers            Règles de cache Cloudflare Pages
├── README.md           Ce fichier
└── assets/
    ├── css/
    │   ├── styles.css  Toute la mise en forme du site
    │   └── admin.css   Mise en forme de l'outil de gestion
    ├── img/            Photos (voir §3)
    └── js/
        ├── data.js     ⭐ Boutique, catégories, produits, wilayas
        ├── cart.js     Panier persistant
        ├── app.js      Langue, formatage, en-tête, WhatsApp
        ├── ui.js       Carte produit réutilisable
        ├── home.js     Page d'accueil
        ├── produits.js Page catalogue
        ├── produit.js  Fiche produit
        ├── panier.js   Page panier
        └── admin.js    Outil de gestion + générateur de data.js
```

---

## 8. Pistes pour la suite

- Guide des tailles détaillé (tableau cm) en fenêtre modale.
- Formulaire de devis dédié aux commandes en gros (cliniques, hôpitaux).
- Suivi des visites avec Google Analytics ou Plausible.
- Fiches produits illustrées par des photos portées, en situation.
