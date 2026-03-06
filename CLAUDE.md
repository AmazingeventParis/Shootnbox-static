# Shootnbox Static Site

## Architecture
- Site statique assemblé par `build.js` (Node.js) -> `public/index.html`
- **Source de vérité : `previews/`** (PAS `public/sections/` qui contient du contenu demo)
- `build.js` extrait le `<body>` des previews et corrige les chemins d'images
- Previews standalone générées par `generate-previews.js` -> `previews/`
- Déployé sur Coolify (nginx:alpine) a `shootnbox.swipego.app`
- Coolify App UUID : `qgwc8s84k84gskgkwk04s0wk`
- Site WordPress source : `shootnbox.fr/home-v2/`

## Sections (ordre dans build.js)
header, hero, trust, bento, bornes, stats, avis, equipe, savoirfaire, mur, carte-france, blog, footer

## Commandes
```bash
node build.js              # Assemble public/index.html depuis previews/
node generate-previews.js  # Genere previews/ (standalone par section)
```

## Deploiement
```bash
# Build -> commit -> push -> deploy
node build.js
git add build.js public/index.html
git commit -m "message"
git push origin master
curl -s "http://217.182.89.133:8000/api/v1/deploy?uuid=qgwc8s84k84gskgkwk04s0wk&force=true" -H "Authorization: Bearer 1|FNcssp3CipkrPNVSQyv3IboYwGsP8sjPskoBG3ux98e5a576"
```

## Build.js - Comment ca marche
- Lit chaque preview dans `previews/*.html`
- Extrait le contenu entre `<body>` et `</body>`
- Corrige les chemins : `../public/images/` -> `/images/`, `../public/logo` -> `/logo`
- Liste `sections` dans build.js = modules actifs (ajouter un par un)
- Liste `allSections` = tous les 13 modules dans l'ordre

## Images
- Images locales dans `public/images/` (servies depuis `/images/`)
- Images blog depuis WordPress (`shootnbox.fr/wp-content/uploads/`)
- Previews corrigent les chemins : `/images/` -> `../public/images/`
- `generate-previews.js` gere aussi `url('/images/` (avec quotes, pour CSS background)

## Blog Navigation
- JS encode en base64 dans `blog.html` (Elementor strip les `<script>` avec chevrons)
- Pointe vers `https://shootnbox.fr/wp-json/wp/v2/posts` (URL absolue, pas relative)
- Fleches cachees sur mobile

## Module Equipe
- Badges flottants sous les cartes avec fleches PNG courbees (`/images/arrow-hand.png`)
- Couleur via CSS filter, orientation via transform scaleX/rotate
- Ordre HTML : `<img arrow>` puis `<span label>`
- Masques en mobile (< 680px)

## Module Savoir-faire
- Images dans `/public/images/savoirfaire/`
- 3 strips bornes : sf-borne-basicfit-15.jpg, sf-borne-creditmutuel.jpg, sf-borne-perso.jpg
- Grande photo NRJ : sf-nrj-7.jpg
- 3 galerie (PARIS/BORD DE MER/EVENEMENT) : sf-paris-15-scaled.jpg, sf-borddemer-15.jpg, sf-evenement-15.jpg
- 3 bottom (MARIAGE/GALA/SOIREE) : sf-mariage.png, sf-gala.png, sf-soiree.png (aspect-ratio 1/1 carre)
- object-position personnalise par photo (25%, 43%, 44% pour le bas)
- Layout editor : `layout-savoirfaire.html` (sliders pour positionner les images)

## Module Avis
- 31 vrais avis Google statiques en HTML (pas d'API Google)
- Carousel : 3 cards desktop, 2 tablet, 1 mobile
- Touch swipe JS (translateX + touchstart/touchmove/touchend) sur document level
- Detecte horizontal vs vertical swipe (ne bloque pas le scroll de page)
- Google Business Profile API necessite une demande d'acces (quota 0 par defaut)

## Etat du deploiement (shootnbox.swipego.app)
- Deployes et valides : header, hero, trust, bento, stats, avis, equipe, savoirfaire, mur, carte-france, blog, footer
- Reste a deployer : bornes

## Bugs resolus - IMPORTANT
- **Mobile menu bloquait TOUS les touch events** : `.snb-mobile-menu` avait `display:block` + `position:fixed` + `width:100%` + `height:100vh` sur mobile, invisible (opacity:0) mais interceptait tout. Fix : `pointer-events:none` quand ferme, `pointer-events:auto` quand `.open`
- **Contenu demo dans public/sections/** : les fichiers source contenaient du contenu demo. Fix : build.js utilise maintenant les previews/ comme source
- **body overflow-x:hidden bloque le swipe iOS** : retire du body global, chaque section gere son propre overflow
- **Carte-france PNG ne s'affichait pas** : image en format PNG palette 4-bit (rare), navigateurs ne la rendaient pas. Fix : reconvertie en RGBA 8-bit standard via Python PIL

## Problemes connus
- Ouvrir les previews depuis `previews/` PAS `public/sections/` (chemins images casses sinon)

## Boutons CTA - Style uniforme
- Tous les boutons CTA roses utilisent: `linear-gradient(135deg, #E51981, #ff3fac)` + texte blanc
- Effet shine au hover: `::before` avec gradient blanc qui glisse (left -100% -> 100%)
- Exception: hero "Voir nos bornes" = outline blanc (transparent + border blanc)
- Modules avec shine: hero, avis, equipe, mur, blog, carte-france, footer, header

## Fichiers secrets (.gitignore)
- `.env` : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- `google-tokens.json` : OAuth tokens
- GitHub Push Protection active (bloque les secrets dans le code)
