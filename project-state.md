# Project State - Shootnbox (mars 2026)

## NOUVEAU : Site Statique sur Coolify (shootnbox.swipego.app)

### Infos deploiement
- **Site live** : https://shootnbox.swipego.app/
- **Repo GitHub** : https://github.com/AmazingeventParis/Shootnbox-static
- **Dossier local** : `C:\Users\asche\Downloads\claude\Shootnbox-static`
- **Coolify App UUID** : `qgwc8s84k84gskgkwk04s0wk`
- **Deploy API** : `curl -s -H "Authorization: Bearer 1|FNcssp3CipkrPNVSQyv3IboYwGsP8sjPskoBG3ux98e5a576" "http://217.182.89.133:8000/api/v1/deploy?uuid=qgwc8s84k84gskgkwk04s0wk&force=true"`

### Architecture
- Site statique nginx:alpine (Dockerfile)
- `build.js` : assemble `public/sections/*.html` en `public/index.html` (~288KB)
- Auth basique via `.htpasswd`

### Ordre des sections (build.js)
1. header
2. hero
3. trust
4. bento
5. bornes
6. stats
7. avis
8. equipe
9. savoirfaire
10. mur
11. **carte-france**
12. blog
13. footer

### Workflow de deploiement
1. Modifier `public/sections/<nom>.html`
2. `node build.js` (regenere index.html)
3. `git add + commit + push`
4. Declencher deploy Coolify via API

---

## Probleme carte-france (RECURENT - 6 mars 2026)

### Symptome
La carte de France ne s'affiche pas sur le site live.

### Cause racine
- `.carte-bg` (position:absolute, height:100%) flottait hors de sa section
- Pas de div wrapper avec `position:relative` autour de la section
- La section `.snb-mur` avant a `z-index:100` qui pouvait couvrir la carte

### Fix applique
- Ajout wrapper `.carte-wrapper` autour de tout (bg + section + closing)
  - `position: relative; overflow: hidden; z-index: 2; background: #fff;`
- Script dans le `<script>` final hors du wrapper

### Z-index importants
- `.snb-mur` : z-index: 100
- `.carte-wrapper` : z-index: 2
- `.carte-section` : z-index: 1
- `.carte-bg` : z-index: 0

### NUCLEAR FIX dans avis
- La section avis a un JS qui force `overflow:visible` sur tous les parents
- Peut interferer avec d'autres sections si mal contenu
- A surveiller

---

## Ancien site WordPress (shootnbox.fr/home-v2)

### Scripts de deploiement (dossier SEO)
- `deploy_equipe_v2.js`, `deploy_savoirfaire.js`, `deploy_blog.js`, etc.
- WordPress API: page ID 1028385
- Ces scripts NE SONT PLUS utilises pour le site statique

### Module Equipe v2
- 3 cartes polaroid colorees (rose, marron, violet)
- Badges avec fleches SVG (viewBox 0 0 70 80, stroke 3.5)
- Hover: badges suivent la carte (position absolute inside)

### Module Savoir-faire
- Grid 2 colonnes, 9 images uploadees
- SVG wave + margin-top:-60px pour raccord
