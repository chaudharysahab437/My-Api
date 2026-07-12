// api/bypass.js - Final Heavy Reverse Proxy Engine
export default async function handler(req, res) {
    // CORS headers enable karna
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { stream_url } = req.query;
    if (!stream_url) return res.status(400).send('Missing stream_url');

    try {
        const targetUrl = decodeURIComponent(stream_url);
        const urlObj = new URL(targetUrl);

        // Target server se fresh webpage request karna
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) return res.status(response.status).send('Stream provider error');

        let html = await response.text();

        // 🔥 CRITICAL FIX 1: Saare relative paths (/js, /css) ko absolute paths me badalna
        // Taaki iframe ke andar player ki saari scripts sahi se load ho sakein
        const origin = urlObj.origin;
        html = html.replace(/(href|src)=["'](?!\/\/|http)([^"']+)["']/g, `$1="${origin}$2"`);

        // 🔥 CRITICAL FIX 2: Frame-blocking scripts ko dhundh kar disable karna
        html = html.replace(/top\.location/g, 'self.location');
        html = html.replace(/parent\.location/g, 'self.location');

        // 🔥 CRITICAL FIX 3: Saare security headers ko override karna
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Security-Policy', "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval';");

        return res.status(200).send(html);

    } catch (error) {
        console.error("Proxy failure:", error);
        return res.status(500).send('Proxy internal crash');
    }
}
