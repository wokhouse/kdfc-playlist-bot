const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Twitter = require('twitter');
const fs = require('fs');

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

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
  postLatestSong: (songs) => {
    return new Promise((resolve, reject) => {
      const { title, composer, performers } = songs[songs.length - 1];
      const status = `${title}by ${composer}performed by ${performers}`;
      fs.readFile('latestsong.txt','utf8', (err, data) => {
        if (data !== status) {
          twitter.post('statuses/update', {status})
            .then((tweet) => {
              // write latest tweet to file so we can make sure we don't tweet same song twice
              fs.writeFile('latestsong.txt', status, () => {
                return resolve(tweet)
              });
            })
            .catch((err) => reject(err));
        } else {
          resolve('song has already been posted');
        }
      });
    });
  },
  bot: () => {
    const { getPlaylist, extractSongs, postLatestSong } = index;
    getPlaylist()
      .then(extractSongs)
      .then(postLatestSong)
      .then(console.log)
      .catch(console.error);
  },
}

module.exports = { ...index };
