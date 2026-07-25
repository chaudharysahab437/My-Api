const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS enable for iframes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Stream URL query param se read karein
  const streamUrl = req.query.streamUrl;

  // Akamai Player ka target URL build karein
  let targetUrl = 'https://players.akamai.com/players/hlsjs';
  if (streamUrl) {
    targetUrl += `?streamUrl=${encodeURIComponent(streamUrl)}`;
  }

  try {
    // 1. Target page fetch karein
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://players.akamai.com/'
      }
    });

    // 2. HTML load karein manipulation ke liye
    const $ = cheerio.load(response.data);

    // 3. Subhi unwanted HTML elements ko completely remove karein
    $('h1').remove();                                  // Player Testing Heading
    $('.navbar-brand').remove();                       // Akamai Logo
    $('.navbar-toggler').remove();                     // Mobile Menu Toggle Button
    $('#navbarSupportedContent').remove();             // Navigation Bar (Players, Stream Validator)
    $('.footer-copyright').remove();                   // Footer links
    $('app-stat-viewer').remove();                     // HTML5 & Advanced Statistics graphs
    $('app-player-info').remove();                     // Player Info Box
    $('app-general-stats').remove();                   // General Statistics Box
    $('.stats').remove();                              // Extra Stats Wrapper Div

    // 4. Clean layout styling inject karein (Pure Player Viewport)
    $('head').append(`
      <style>
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #000 !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
        }
        app-root {
          display: block;
          width: 100vw;
          height: 100vh;
        }
        /* Player ko full screen/iframe cover karwane ke liye */
        video, .video-js, app-hlsjs-player {
          width: 100% !important;
          height: 100% !important;
          max-height: 100vh !important;
        }
      </style>
    `);

    // 5. Cleaned HTML response bhejein
    return res.status(200).send($.html());

  } catch (error) {
    console.error('HTML Proxy Error:', error.message);
    return res.status(500).send(`<h2>Error loading clean player page: ${error.message}</h2>`);
  }
};
