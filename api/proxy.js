const axios = require('axios');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URL parameter missing');
  }

  try {
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://players.akamai.com/',
        'Origin': 'https://players.akamai.com'
      }
    });

    const contentType = response.headers['content-type'] || '';
    const isM3u8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('apple');

    if (isM3u8) {
      let content = response.data.toString('utf-8');
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Re-write m3u8 internal relative paths to pass through this Vercel proxy
      const host = req.headers['host'];
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const proxyBase = `${protocol}://${host}/proxy?url=`;

      content = content.replace(/^(?!#)(.+)$/gm, (line) => {
        line = line.trim();
        if (!line) return line;
        
        let absoluteUrl = line;
        if (!line.startsWith('http://') && !line.startsWith('https://')) {
          absoluteUrl = baseUrl + line;
        }
        return proxyBase + encodeURIComponent(absoluteUrl);
      });

      res.setHeader('Content-Type', 'application/x-mpegURL');
      return res.status(200).send(content);
    }

    // Binary streams (.ts segments / audio chunks)
    res.setHeader('Content-Type', contentType || 'video/MP2T');
    return res.status(200).send(response.data);

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return res.status(500).send('Proxy Error: ' + error.message);
  }
};
