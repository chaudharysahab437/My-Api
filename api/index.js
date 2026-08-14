const axios = require('axios');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Origin': 'https://classplusapp.com',
    'Referer': 'https://classplusapp.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
};

module.exports = async (req, res) => {
    const url = req.query.url;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (!url) {
        res.status(200).json({
            status: "active",
            service: "Classplus Video Proxy",
            usage: "/api?url=YOUR_CLASSPLUS_URL",
            example: "/api?url=https://akamai-cdn.classplusapp.com/gcs/..."
        });
        return;
    }
    
    try {
        const response = await axios.get(url, {
            headers: HEADERS,
            responseType: 'arraybuffer',
            maxRedirects: 5,
            timeout: 10000,
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            }
        });
        
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        
        // m3u8 playlist handle karo
        if (url.includes('.m3u8') && contentType.includes('mpegurl')) {
            let content = response.data.toString('utf8');
            
            if (content.includes('#EXTM3U')) {
                const lines = content.split('\n');
                const newLines = [];
                const baseUrl = url.substring(0, url.lastIndexOf('/'));
                
                for (let line of lines) {
                    line = line.trim();
                    if (line && !line.startsWith('#')) {
                        let segUrl;
                        if (line.startsWith('http')) {
                            segUrl = line;
                        } else {
                            segUrl = `${baseUrl}/${line}`;
                        }
                        const encodedUrl = encodeURIComponent(segUrl);
                        newLines.push(`/api?url=${encodedUrl}`);
                    } else {
                        newLines.push(line);
                    }
                }
                
                content = newLines.join('\n');
                res.send(Buffer.from(content));
            } else {
                res.send(response.data);
            }
        } else {
            // Direct video/segment stream
            res.send(response.data);
        }
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
