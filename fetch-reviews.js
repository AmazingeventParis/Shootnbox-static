const https = require('https');
const fs = require('fs');

// Load from .env file
const envFile = require('fs').readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});
const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://shootnbox.swipego.app/oauth-callback.html';
const TOKEN_FILE = 'google-tokens.json';

function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  }).toString();

  const result = await httpsRequest({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, body);

  if (result.error) {
    console.error('Token exchange error:', result);
    process.exit(1);
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(result, null, 2));
  console.log('Tokens saved to', TOKEN_FILE);
  return result;
}

async function refreshToken() {
  const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  if (!tokens.refresh_token) {
    console.error('No refresh_token found. Re-authorize.');
    process.exit(1);
  }

  const body = new URLSearchParams({
    refresh_token: tokens.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token'
  }).toString();

  const result = await httpsRequest({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, body);

  if (result.error) {
    console.error('Refresh error:', result);
    process.exit(1);
  }

  tokens.access_token = result.access_token;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  return tokens.access_token;
}

async function apiGet(path, accessToken) {
  return httpsRequest({
    hostname: 'mybusinessbusinessinformation.googleapis.com',
    path,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

async function getAccounts(accessToken) {
  return httpsRequest({
    hostname: 'mybusinessaccountmanagement.googleapis.com',
    path: '/v1/accounts',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

async function getLocations(accountName, accessToken) {
  return apiGet(`/v1/${accountName}/locations?readMask=name,title`, accessToken);
}

async function getReviews(locationName, accessToken, pageToken) {
  let path = `/v1/${locationName}/reviews?pageSize=50`;
  if (pageToken) path += '&pageToken=' + pageToken;
  return httpsRequest({
    hostname: 'mybusiness.googleapis.com',
    path,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

async function fetchAllReviews(locationName, accessToken) {
  let allReviews = [];
  let pageToken = null;
  do {
    const result = await getReviews(locationName, accessToken, pageToken);
    if (result.error) {
      console.error('Reviews error:', result);
      break;
    }
    if (result.reviews) allReviews = allReviews.concat(result.reviews);
    pageToken = result.nextPageToken;
    console.log(`Fetched ${allReviews.length} reviews...`);
  } while (pageToken);
  return allReviews;
}

function starRating(rating) {
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[rating] || 5;
}

function generateHTML(reviews) {
  const colors = [
    'linear-gradient(135deg,#E51981,#c0137a)',
    'linear-gradient(135deg,#0250FF,#0140cc)',
    'linear-gradient(135deg,#FF7A00,#e06800)',
    'linear-gradient(135deg,#7828C8,#6020a0)',
    'linear-gradient(135deg,#0891B2,#067a96)',
    'linear-gradient(135deg,#16A34A,#128a3e)'
  ];

  let html = '';
  reviews.forEach((review, i) => {
    const name = review.reviewer?.displayName || 'Anonyme';
    const initial = name.charAt(0).toUpperCase();
    const text = review.comment || '';
    const stars = starRating(review.starRating);
    const color = colors[i % colors.length];
    const starsSvg = Array(stars).fill('<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#FBBC04" stroke="#FBBC04" stroke-width="1"/></svg>').join('');

    html += `<div class="avis-card">
        <div class="avis-header">
          <div class="avis-avatar" style="background:${color}"><span class="initials">${initial}</span></div>
          <span class="avis-name">${name}</span>
          <svg class="avis-google" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        </div>
        <div class="avis-stars">${starsSvg}</div>
        <p class="avis-text">${text}</p>
      </div>\n`;
  });

  return html;
}

async function main() {
  const args = process.argv.slice(2);

  // Step 1: Exchange code for tokens
  if (args[0] === 'auth' && args[1]) {
    const tokens = await exchangeCode(args[1]);
    console.log('Access token:', tokens.access_token?.substring(0, 30) + '...');
    return;
  }

  // Step 2+: Use existing tokens
  if (!fs.existsSync(TOKEN_FILE)) {
    console.log('No tokens found. First authorize:');
    console.log('1. Go to https://shootnbox.swipego.app/oauth-callback.html');
    console.log('2. Authorize with your Google account');
    console.log('3. Copy the code from the page');
    console.log('4. Run: node fetch-reviews.js auth <CODE>');
    return;
  }

  const accessToken = await refreshToken();
  console.log('Token refreshed');

  // Get accounts
  const accounts = await getAccounts(accessToken);
  console.log('Accounts:', JSON.stringify(accounts, null, 2));

  if (!accounts.accounts || accounts.accounts.length === 0) {
    console.error('No accounts found');
    return;
  }

  const accountName = accounts.accounts[0].name;
  console.log('Using account:', accountName);

  // Get locations
  const locations = await getLocations(accountName, accessToken);
  console.log('Locations:', JSON.stringify(locations, null, 2));

  if (!locations.locations || locations.locations.length === 0) {
    console.error('No locations found');
    return;
  }

  // Find Shootnbox location or use first one
  const location = locations.locations.find(l => l.title && l.title.toLowerCase().includes('shootn')) || locations.locations[0];
  console.log('Using location:', location.name, '-', location.title);

  // Fetch all reviews
  const reviews = await fetchAllReviews(location.name, accessToken);
  console.log(`Total reviews: ${reviews.length}`);

  // Filter 4+ stars reviews
  const goodReviews = reviews.filter(r => starRating(r.starRating) >= 4);
  console.log(`Reviews 4+ stars: ${goodReviews.length}`);

  // Generate HTML
  const cardsHtml = generateHTML(goodReviews);
  fs.writeFileSync('reviews-cards.html', cardsHtml, 'utf8');
  console.log('Saved to reviews-cards.html');

  // Save raw data
  fs.writeFileSync('reviews-data.json', JSON.stringify(goodReviews, null, 2), 'utf8');
  console.log('Raw data saved to reviews-data.json');
}

main().catch(console.error);
