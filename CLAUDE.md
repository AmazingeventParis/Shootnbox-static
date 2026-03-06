# Shootnbox Static Site

## Architecture
- Site statique assemblé par `build.js` (Node.js) → `public/index.html`
- 13 sections HTML dans `public/sections/` assemblées dans l'ordre
- Previews standalone générées par `generate-previews.js` → `previews/`
- Déployé sur Coolify (nginx:alpine) à `shootnbox.swipego.app`
- Site WordPress source : `shootnbox.fr/home-v2/`

## Sections (ordre dans build.js)
header, hero, trust, bento, bornes, stats, avis, equipe, savoirfaire, mur, carte-france, blog, footer

## Commandes
```bash
node build.js              # Assemble public/index.html
node generate-previews.js  # Génère previews/ (standalone par section)
```

## Images
- Images locales dans `public/images/` (servies depuis `/images/`)
- Images blog depuis WordPress (`shootnbox.fr/wp-content/uploads/`)
- Previews corrigent les chemins : `/images/` → `../public/images/`
- `generate-previews.js` gère aussi `url('/images/` (avec quotes, pour CSS background)

## Blog Navigation
- JS encodé en base64 dans `blog.html` (Elementor strip les `<script>` avec chevrons)
- Pointe vers `https://shootnbox.fr/wp-json/wp/v2/posts` (URL absolue, pas relative)
- Flèches cachées sur mobile

## Module Équipe
- Badges flottants sous les cartes avec flèches PNG courbées (`/images/arrow-hand.png`)
- Couleur via CSS filter, orientation via transform scaleX/rotate
- Ordre HTML : `<img arrow>` puis `<span label>`
- Masqués en mobile (< 680px)

## Module Savoir-faire
- Images dans `/public/images/savoirfaire/`
- 3 strips bornes : sf-borne-basicfit-15.jpg, sf-borne-creditmutuel.jpg, sf-borne-perso.jpg
- Grande photo NRJ : sf-nrj-7.jpg
- 3 galerie (PARIS/BORD DE MER/ÉVÉNEMENT) : sf-paris-15-scaled.jpg, sf-borddemer-15.jpg, sf-evenement-15.jpg
- 3 bottom (MARIAGE/GALA/SOIRÉE) : sf-mariage.png, sf-gala.png, sf-soiree.png (aspect-ratio 1/1 carré)
- object-position personnalisé par photo (25%, 43%, 44% pour le bas)
- Layout editor : `layout-savoirfaire.html` (sliders pour positionner les images)

## État des modules (validés en local)
- header, hero, bornes, equipe, savoirfaire, mur, carte-france, blog, footer
- Restent : trust, bento, stats, avis

## Problèmes connus
- Carte-france ne s'affiche PAS sur le site live (fonctionne en local, bug non résolu)
- Ouvrir les previews depuis `previews/` PAS `public/sections/` (chemins images cassés sinon)
