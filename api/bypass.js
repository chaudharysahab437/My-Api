// api/bypass.js (Vercel Serverless/Edge Function)

export default async function handler(req, res) {
    // CORS headers handle karne ke liye
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Query se target stream URL nikaalna
    const { stream_url } = req.query;

    if (!stream_url) {
        return res.status(400).json({ error: 'Missing stream_url parameter' });
    }

    try {
        // Stream provider ko fake browser headers ke sath request bhejna
        const response = await fetch(decodeURIComponent(stream_url), {
            headers: {
                'User-Agent': 'Mozilla/5.5 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const htmlContent = await response.text();

        // ❌ ANTI-FRAME HEADERS KO DELETE KARNA
        res.setHeader('X-Frame-Options', 'ALLOWALL'); 
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('content-security-policy');
        res.removeHeader('x-frame-options');

        // Sahi content type return karna taaki browser HTML ko execute kare
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        
        // Output return karna
        return res.status(200).send(htmlContent);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: 'Failed to fetch stream data structure' });
    }
}
