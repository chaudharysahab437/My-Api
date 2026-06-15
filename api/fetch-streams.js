import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 1. Headers nikalna
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  const host = req.headers['host'] || '';
  
  // 2. Strict Domain URL (Bina slash ke aur slash ke sath dono check karenge)
  const allowedDomain = 'https://chaudhary-player.netlify.app';

  // 🚨 SECURITY LAYER 1: Agar request direct browser ki address bar se aayi hai (No Referer & No Origin)
  if (!referer && !origin) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "Direct browser access is strictly prohibited!" 
    });
  }

  // 🚨 SECURITY LAYER 2: Agar Referer hai, toh check karo ki kya wo tumhari Netlify site se hi shuru ho raha hai
  if (referer && !referer.startsWith(allowedDomain)) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "Unauthorized domain source!" 
    });
  }

  // 🚨 SECURITY LAYER 3: Agar Origin header hai (jo fetch requests me hota hai), toh wo exact match hona chahiye
  if (origin && origin !== allowedDomain) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ 
      error: "Access Denied", 
      message: "CORS Violation!" 
    });
  }

  // ==========================================
  // 🔥 AGAR SARE CHECK PASS HUYE, TOH HI DATA FETCH HOGA
  // ==========================================
  
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
        const url = item ? `${config.base_url}${item}&_ts=${ts}` : `${config.base_url}&_ts=${ts}`;
        
        const response = await fetch(url, { headers: config.headers, timeout: 10000 });
        const data = await response.json();

        if (config.type === "bulk") {
          master_list[source_name] = data;
        } else {
          master_list[item] = data;
        }
      } catch (e) {
        console.error(`Error fetching ${source_name}:`, e);
      }
    }
  }

  // Keval tumhari website ko response read karne ki ijaajat dena
  // ❌ Purani Cache-Control line ko hatao aur ye 3 lines lagao:
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.setHeader('Access-Control-Allow-Origin', allowedDomain);
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json(master_list);
}
