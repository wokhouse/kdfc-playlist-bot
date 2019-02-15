const index = require('./index');
const fs = require('fs');
const songRef = require('../bin/songsref.js');

// mock node-fetch
const mockPlaylistDOM = fs.readFileSync('./bin/playlist-test.html', 'utf8');
jest.mock('node-fetch', () => {
  return jest.fn(async () => {
    return {
      text: async () => mockPlaylistDOM,
    }
  });
});

// mock twitter
jest.mock('twitter', () => {
  return jest.fn(() => {
    return {
      post: async (endpoint, options, callback) => {
        const res = [
          null, // err
          options.status, // tweet
          { ok: true }, // res
        ]
        // throw error if endpoint is not for posting a tweet
        if (endpoint !== 'statuses/update') res[0] = new Error('what... are you doing');
        // throw error if no tweet is supplied
        if (!options.status) res[0] = new Error('no tweet body supplied');
        if (typeof callback === 'function') return callback(res[0], res[1], res[2]);
        return(res[1]);
      }
    };
  });
});

it('getPlaylist() should return DOM of kdfc.com/playlist as string', (done) => {
  index.getPlaylist()
    .then((playlistDOM) => {
      expect(playlistDOM).toEqual(mockPlaylistDOM);
      done();
    })
});
it('extractSong() should return latest soong', (done) => {
  index.extractSong(mockPlaylistDOM)
    .then((song) => {
      expect(song).toEqual(songRef);
      done();
    });
});
it('postLatestSong() should post tweet w/ song if song has not yet been tweeted', (done) => {
  fs.unlink('latestsong.txt', () => {
    index.postLatestSong(songRef)
      .then((res) => {
        const { title, composer, performers } = songRef
        const status = `${title} by ${composer} performed by ${performers}`;
        expect(res).toEqual(status)
        done();
    });
  });
});
it('postLatestSong() should not post if song has already been tweeted', async (done) => {
  await index.postLatestSong(songRef)
  await index.postLatestSong(songRef)
    .then(async (res) => {
      expect(res).toEqual("song has already been posted");
      done();
    });

});
