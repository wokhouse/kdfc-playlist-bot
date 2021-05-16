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
  getPlaying: async () => {
    const res = await fetch('https://schedule.kdfc.com/now/KDFC.json').then(r => r.json());
    return res;
  },
  formatSong: async (songObj) => {
    const { title, artist, Composer, Conductor, Orchestra } = songObj.extraInfo
    const titleString = `${title} by ${Composer || artist}`;
    const performanceString = `performed by ${Orchestra} under ${Conductor}`;
    const out = `${titleString}${(Orchestra.length > 0) ? ` ${performanceString}` : ''}`;
    console.log(out);
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
    const { getPlaying, formatSong, postLatestSong } = index;
    getPlaying()
      .then(formatSong)
      // .then(postLatestSong)
      // .then(({text}) => (text) ? console.log(`tweeted ${text}`) : undefined)
      .catch(console.error);
  },
}

module.exports = { ...index };
