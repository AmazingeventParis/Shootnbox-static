# Shootnbox Static Site

## Design UI - Directive obligatoire
Avant de créer ou modifier toute page, composant, ou section du site Shootnbox, lis impérativement `.claude/skills/frontend-design.md` et applique les directives esthétiques.

**Identité Shootnbox :**
- Palette : Rose `#E51981`, Bleu `#0250FF`, Violet `#a855f7`, Orange `#FF7A00`, Vert `#16A34A`
- Police : Raleway (400-900, italic) - police principale pour tout le site
- Tone : Festif, événementiel, professionnel, premium
- Style : Neumorphism/clay pour les cartes, glassmorphism pour les panels, fonds pastels clairs
- Effets : Bordures neon colorees, icones glossy 3D, shimmer, sparkles, blobs pulses

## Architecture
- Site statique assemblé par `build.js` (Node.js) -> `public/index.html`
- **Source de vérité : `previews/`** (PAS `public/sections/` qui contient du contenu demo)
- `build.js` extrait le `<body>` des previews et corrige les chemins d'images
- Previews standalone générées par `generate-previews.js` -> `previews/`
- Déployé sur Coolify (nginx:alpine) a `shootnbox.swipego.app`
- Coolify App UUID : `qgwc8s84k84gskgkwk04s0wk`
- Site WordPress source : `shootnbox.fr/home-v2/`

## Pages
### Home (shootnbox.swipego.app)
- Sections : header, hero, trust, bento, bornes, stats, avis, equipe, savoirfaire, mur, carte-france, blog, footer
- Previews dans `previews/`

### Location Photobooth (shootnbox.swipego.app/location-photobooth/)
- Sections : hero, intro, bornes, avis, usages, service-v2, fabrication (+ header/footer partages)
- Previews dans `previews/location-photobooth/`
- `inlineAllCSS: true` dans build.js (tout le CSS inline)
- Module avis = copie de `previews/avis.html` avec H2 custom + carousel logos confiance ajoutes
- Module bornes = 4 cartes bornes + module tarifs integre (glassmorphism gauche + neumorphism droite)
- Module usages = "Un photobooth pour chaque occasion" (taille reduite)
- Module service-v2 = 5 etapes neumorphism + icones 3D SVG glossy + tilt JS + 2 cartes bottom (livraison/support) avec photos
- Module fabrication = Made in France (borne photo + glow bar + badge flottant + mini-cartes + layers tricolores + texte neumorphism)
- Ancien module etapes retire du build (remplace par service-v2)

## Commandes
```bash
node build.js              # Assemble public/index.html depuis previews/
node generate-previews.js  # Genere previews/ (standalone par section)
```

## Deploiement
```bash
# Build -> commit -> push -> deploy
node build.js
git add build.js public/index.html public/location-photobooth/index.html
git commit -m "message"
git push origin master
curl -s "http://217.182.89.133:8000/api/v1/deploy?uuid=qgwc8s84k84gskgkwk04s0wk&force=true" -H "Authorization: Bearer 1|FNcssp3CipkrPNVSQyv3IboYwGsP8sjPskoBG3ux98e5a576"
```

## Build.js - Comment ca marche
- Lit chaque preview dans `previews/*.html` (ou sous-dossier pour sous-pages)
- Extrait le contenu entre `<body>` et `</body>`
- Corrige les chemins : `../public/images/` et `../../public/images/` -> `/images/`
- `pages` array dans build.js = config par page (slug, sections, previewDir, inlineAllCSS)
- Post-processing : ajout width/height images, loading lazy, data-snb-edit pour admin inline
- Extraction CSS : critiques inline, non-critiques en fichier externe (sauf si inlineAllCSS)
- Scripts regroupes dans un fichier JS par page

## Images
- Images locales dans `public/images/` (servies depuis `/images/`)
- Images bornes dans `public/images/bornes/` (ring-1 a 6, vegas-1 a 5, miroir-1 a 3, spinner-1 + video)
- Logos confiance dans `public/images/logos/` (19 logos .webp)
- Images blog depuis WordPress (`shootnbox.fr/wp-content/uploads/`)
- Previews : chemins relatifs `../../public/images/` pour sous-pages, `../public/images/` pour home

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

## Module Tarifs (dans bornes location-photobooth)
- Split layout : gauche glassmorphism (H2, 4 checks, desc, CTA) + droite neumorphism (3 args)
- Neumorphism : fond lilas, inset shadows, bordures neon colorees, icones glossy 3D
- Glassmorphism : backdrop-filter blur, shimmer anime, sparkles
- Max-width: 1340px, responsive grid 1col < 900px

## Design System
### Couleurs
- Rose : `#E51981` / `#E51981 -> #ff6eb4`
- Bleu : `#0250FF` / `#0250FF -> #4d8bff`
- Violet : `#a855f7` / `#a855f7 -> #c084fc`
- Orange : `#FF7A00` / `#FF7A00 -> #ff9a3c`
- Vert : `#16A34A` / `#16A34A -> #4ade80`
- Texte fonce : `#1a0a22` ou `#2a1540`

### Boutons CTA
- `linear-gradient(135deg, #E51981, #ff3fac)` + blanc
- Shine hover : `::before` gradient blanc translateX(-100% -> 100%)
- Border-radius: 50px
- Exception: hero "Voir nos bornes" = outline blanc

## Module Service-v2 (dans location-photobooth)
- 5 cartes etapes neumorphism (fond degrade vers blanc, bordures neon colorees)
- Icones 3D SVG glossy avec float animation et ground shadow
- Tilt effect au mousemove (JS perspective transform)
- SVG gradient IDs prefixes : `s2` desktop, `m2` mobile (evite conflits)
- 2 cartes bottom : livraison (bleu) + support (fuchsia) avec photos
- Photos dans `public/images/agence/` et `public/images/`
- CTA principal gradient rose (#E51981 -> #ff3fac)
- Mobile : meme style neumorphism + icones 3D SVG (taille reduite)
- Watermarks masques (`display: none`)

## Module Fabrication francaise (dans location-photobooth)
- Layout 2-col grid (1fr 1.5fr), responsive 1-col < 768px
- **Gauche** : cadre neumorphism avec borne photo (220px max), glow bar rose au pied, badge Made in France SVG flottant, 3 mini-cartes flottantes (Usine Normandie bleu, Eco-responsable rose, Logiciel maison violet), 3 layers tricolores (bleu/blanc/rouge)
- **Droite** : cadre neumorphism avec barre tricolore en haut, H2 centre (24px), separateur tricolore, 2 paragraphes (14.5px), blockquote pastel violet/rose, 4 tags sur une ligne (10px), CTA centre
- Fond section : `linear-gradient(160deg, #e8d4f0, #dfc8e8, #e6d8f2)`
- Mini-cartes et layers masques en mobile
- Image borne : `public/images/borne-made-in-france.png`

## Etat du deploiement (shootnbox.swipego.app)
- **Home** : COMPLET - tous les 13 modules deployes
- **Location-photobooth** : hero, intro, bornes (avec tarifs), avis (avec logos), usages, service-v2, fabrication

## Bugs resolus - IMPORTANT
- **Mobile menu bloquait TOUS les touch events** : `.snb-mobile-menu` avait `display:block` + `position:fixed` + `width:100%` + `height:100vh` sur mobile, invisible (opacity:0) mais interceptait tout. Fix : `pointer-events:none` quand ferme, `pointer-events:auto` quand `.open`
- **Contenu demo dans public/sections/** : les fichiers source contenaient du contenu demo. Fix : build.js utilise maintenant les previews/ comme source
- **body overflow-x:hidden bloque le swipe iOS** : retire du body global, chaque section gere son propre overflow
- **Carte-france PNG ne s'affichait pas** : image en format PNG palette 4-bit (rare), navigateurs ne la rendaient pas. Fix : reconvertie en RGBA 8-bit standard via Python PIL
- **Images bornes 404** : photos pas commitees. Fix : ajout dans public/images/bornes/
- **Fond bornes trop sombre** : user a rejete le fond noir. Fix : pastel gradient matching intro/etapes

## Problemes connus
- Ouvrir les previews depuis `previews/` PAS `public/sections/` (chemins images casses sinon)

## Fichiers secrets (.gitignore)
- `.env` : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- `google-tokens.json` : OAuth tokens
- GitHub Push Protection active (bloque les secrets dans le code)

## Preferences utilisateur
- Prefere les fonds clairs/pastels (PAS sombre)
- Aime le style neumorphism/clay avec bordures neon
- Veut voir les previews en local avant deploiement
- Demande souvent des iterations visuelles (essayer plusieurs options)
- Veut des watermarks chiffres discrets (opacity basse)
- N'aime pas les fleches entre les cartes etapes

## Voir aussi
- `admin-seo-todo.md` : todo SEO detaille + suivi de tout ce qui a ete fait
