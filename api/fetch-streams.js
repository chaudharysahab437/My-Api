import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 🛡️ Security: Sirf tumhari website se aane wali request allow hai
  const referer = req.headers.referer || '';
  if (!referer.startsWith('https://chaudhary-player.netlify.app/')) {
    return res.status(403).json({ error: "Access Denied!" });
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

  // 🔄 Fetch Logic for all 3 APIs
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

  // ✨ Caching & CORS Security
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30'); // 1 min cache
  res.setHeader('Access-Control-Allow-Origin', 'https://chaudhary-player.netlify.app');
  return res.status(200).json(master_list);
}
