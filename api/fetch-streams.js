import fetch from 'node-fetch';

const SECRET_KEY = "ChaudharyPlayerPremiumKey_2026!@#";

function xorEncryptDecrypt(input, key) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return output;
}

function encodeToCustomString(obj) {
  const jsonString = JSON.stringify(obj);
  const xorString = xorEncryptDecrypt(jsonString, SECRET_KEY);
  return Buffer.from(xorString, 'binary').toString('base64');
}

export default async function handler(req, res) {
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  const allowedDomain = 'https://chaudhary-player.netlify.app';

  if (!referer && !origin) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "Direct browser access is strictly prohibited!" 
    });
  }

  if (referer && !referer.startsWith(allowedDomain)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "Unauthorized domain source!" 
    });
  }

  if (origin && origin !== allowedDomain) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "CORS Violation!" 
    });
  }

  const USER_AGENT = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36";
  
  const SOURCES = {
    "cricfusion": {
      "base_url": "https://newwwwapiiiiii.vercel.app/main?id=",
      "items": ["cazeamzn", "h", "u", "fs1"],
      "type": "individual",
      "headers": { "Referer": "https://newwwwapiiiiii.vercel.app", "Origin": "https://cricboost.pages.dev", "User-Agent": USER_AGENT }
    },
    "footapi_new": {
      "base_url": "https://footapi-psi.vercel.app/main?id=",
      "items": ["cazeios", "unite8sports1hd", "unite8sports2hd"],
      "type": "individual",
      "headers": { "Referer": "https://footapi-psi.vercel.app/", "Origin": "https://footsterss.pages.dev", "User-Agent": USER_AGENT }
    },
    "fifa26": {
      "base_url": "https://footballapi-delta.vercel.app/api/events?play=1",
      "items": [null],
      "type": "bulk",
      "headers": { "Origin": "https://fifa26-live.pages.dev", "User-Agent": USER_AGENT }
    }
  };

  let master_list = {};

  for (const [source_name, config] of Object.entries(SOURCES)) {
    for (const item of config.items) {
      try {
        const ts = Date.now();
        const url = item ? `${config.base_url}${item}&_ts=${ts}` : `${config.base_url}${config.items.indexOf(item) !== -1 ? '' : ''}&_ts=${ts}`;
        const response = await fetch(url, { headers: config.headers, timeout: 10000 });
        const data = await response.json();

        if (config.type === "bulk") {
          master_list[source_name] = data;
        } else {
          master_list[item] = data;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  let finalSecureResponse = {};
  for (const [key, val] of Object.entries(master_list)) {
    finalSecureResponse[key] = encodeToCustomString(val);
  }

  res.setHeader('Cache-Control', 's-maxage=1200, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', allowedDomain);
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json(finalSecureResponse);
}
