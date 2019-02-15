const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Twitter = require('twitter');
const fs = require('fs');
const moment = require('moment');

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
  extractSong: async (domstring) => {
    const $ = cheerio.load(domstring);
    const rows = $('table tbody tr');
    const songs = [];
    const rowData = rows.map((i) => {
      const thisRow = cheerio.load(rows[i]);
      const thisText = thisRow('td').text();
      const thisTime = thisRow('th').text();
      const thisLines = thisText.split('\n');
      // remove empty line at beginning
      thisLines.splice(0,1);
      // remove 'Buy' and extra lines at end
      thisLines.splice(4);
      const thisLinesTrimmed = thisLines.map(l => l.replace(/\s*$/,""));
      const songAttrs = {
        title: thisLinesTrimmed[0],
        composer: thisLinesTrimmed[1],
        performers: thisLinesTrimmed[2],
        label: thisLinesTrimmed[3].replace(/([0-9\-]+)/, ' $1'),
      };
      const thisTimestamp = moment(thisTime, 'hh:mm a').valueOf();
      songs.push({ timestamp: thisTimestamp, songAttrs });
    });
    console.log(`parsed ${songs.length} songs`);
    const sortedSongs = songs.sort((a,b) => (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0)); 
    const latestSong = sortedSongs[sortedSongs.length - 1].songAttrs;
    const { title, composer, performers } = latestSong;
    console.log(`latest songs is ${title} by ${composer} performed by ${performers}`);
    return latestSong;
  },
  postLatestSong: (song) => {
    return new Promise((resolve, reject) => {
      const { title, composer, performers } = song;
      const status = `${title} by ${composer} performed by ${performers}`;
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
      .then(({text}) => console.log(`tweeted: ${text}`))
      .catch(console.error);
  },
}

module.exports = { ...index };
