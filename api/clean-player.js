const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const streamUrl = req.query.streamUrl;
  let targetUrl = 'https://players.akamai.com/players/hlsjs';
  if (streamUrl) {
    targetUrl += `?streamUrl=${encodeURIComponent(streamUrl)}`;
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://players.akamai.com/'
      }
    });

    const $ = cheerio.load(response.data);

    // 1. FIX JS & CSS PATHS: Saare relative URLs ko Akamai root domain par point karein
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
        // Agar path '/' se start nahi ho raha toh '/' add kar do
        const cleanSrc = src.startsWith('/') ? src : '/' + src;
        $(el).attr('src', `https://players.akamai.com${cleanSrc}`);
      }
    });

    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
        const cleanHref = href.startsWith('/') ? href : '/' + href;
        $(el).attr('href', `https://players.akamai.com${cleanHref}`);
      }
    });

    // 2. Unwanted elements remove karein
    $('h1').remove();
    $('.navbar-brand').remove();
    $('.navbar-toggler').remove();
    $('#navbarSupportedContent').remove();
    $('.footer-copyright').remove();
    $('app-stat-viewer').remove();
    $('app-player-info').remove();
    $('app-general-stats').remove();
    $('.stats').remove();

    // 3. Fullscreen layout CSS inject karein
    $('head').append(`
      <style>
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #000 !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        app-root {
          display: block;
          width: 100vw;
          height: 100vh;
        }
        video, .video-js, app-hlsjs-player {
          width: 100% !important;
          height: 100% !important;
          max-height: 100vh !important;
        }
      </style>
    `);

    return res.status(200).send($.html());

  } catch (error) {
    console.error('HTML Proxy Error:', error.message);
    return res.status(500).send(`<h2>Error loading player: ${error.message}</h2>`);
  }
};
