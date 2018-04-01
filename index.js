const fetch = require('node-fetch');
const cheerio = require('cheerio');

const index = {
  getPlaylist: () => {
    return new Promise((resolve, reject) => {
      fetch('https://kdfc.com/playlist/')
        .then(res => res.text())
        .then(body => resolve(body))
    });
  },
  extractSongs: async (domstring) => {
    const $ = cheerio.load(domstring);
    const rows = $('table tbody tr');
    const songs = []
    rows.map((i) => {
      const songAttrFields = cheerio.load(rows[i]);
      const songAttrText = songAttrFields('td').text();
      const songAttrLines = songAttrText.split('\n');
      // remove empty line at beginning
      songAttrLines.splice(0,1);
      // remove 'Buy' and extra lines at end
      songAttrLines.splice(4);
      const songAttrs = {
        title: songAttrLines[0],
        composer: songAttrLines[1],
        performers: songAttrLines[2],
        label: songAttrLines[3],
      };
      if (songAttrs.title !== 'Song data not yet available for this segment.') songs.push(songAttrs);
    })
    return songs;
  },
}

module.exports = { ...index };
