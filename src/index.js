const fetch = require('node-fetch');
const Twitter = require('twitter');
const fs = require('fs');

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
    const out = songObj.summary
      .replace(/\n/g, ' / ')
      .replace(/\s\s+/g, ' ');
    console.log(out);
    return out;
  },
  postLatestSong: (song) => {
    return new Promise((resolve, reject) => {
      fs.readFile('latestsong.txt','utf8', (err, data) => {
        if (data !== song) {
          twitter.post('statuses/update', { status: song })
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
      .then(postLatestSong)
      .then(({text}) => (text) ? console.log(`tweeted ${text}`) : undefined)
      .catch(console.error);
  },
}

module.exports = { ...index };
