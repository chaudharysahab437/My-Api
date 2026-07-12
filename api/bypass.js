// api/bypass.js - Full Website Mirror Proxy Engine

export default async function handler(req, res) {
    // 1. SET THE TARGET MAIN WEBSITE DOMAIN HERE
    // Jis website par hamesha stream chalti hai, uska original URL yahan daalein (Bina trailing slash ke)
    const TARGET_MAIN_SITE = "https://streamcorner.foo/stream/fifa/8e1f00a6-5c96-5c0b-bfa7-6023dd8ff53d"; 

    // Enable basic cross-origin clearances
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Dynamic path configuration matching incoming proxy routes
        const currentPath = req.url.replace('/api/bypass', '') || '/';
        const finalTargetUrl = `${TARGET_MAIN_SITE}${currentPath}`;

        // 2. Spoof headers to pretend as a 100% organic direct tab user
        const response = await fetch(finalTargetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Mirror engine target error state: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // 3. Handle Streaming Data & Media Assets Separately
        if (!contentType.includes('text/html')) {
            const bufferPayload = await response.arrayBuffer();
            res.setHeader('Content-Type', contentType);
            return res.status(200).send(Buffer.from(bufferPayload));
        }

        // 4. Extract HTML core to patch relative scripts leaks
        let htmlText = await response.text();

        // Injecting the absolute targets to force chunks to load directly from main site
        htmlText = htmlText.replace(/(href|src)=["'](?!\/\/|http)([^"']+)["']/g, `$1="${TARGET_MAIN_SITE}$2"`);
        
        // Neutralize dynamic frame breakers breaking window layers
        htmlText = htmlText.replace(/top\.location/g, 'self.location');
        htmlText = htmlText.replace(/parent\.location/g, 'self.location');

        // Stripping anti-frame response configurations completely
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('content-security-policy');
        res.removeHeader('x-frame-options');

        return res.status(200).send(htmlText);

    } catch (err) {
        console.error("Mirror critical link resolution failure:", err);
        return res.status(500).send("Critical structure crash inside the proxy pipeline.");
    }
}
