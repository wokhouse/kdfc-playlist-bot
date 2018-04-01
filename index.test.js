const index = require('./index');
const fs = require('fs');
const songsRef = require('./bin/songsref.js');

// mock node-fetch
const mockPlaylistDOM = fs.readFileSync('./bin/playlist-test.html', 'utf8');
jest.mock('node-fetch', () => {
  return jest.fn(async () => {
    return {
      text: async () => mockPlaylistDOM,
    }
  });
});


it('getPlaylist() should return DOM of kdfc.com/playlist as string', (done) => {
  index.getPlaylist()
    .then((playlistDOM) => {
      expect(playlistDOM).toEqual(mockPlaylistDOM);
      done();
    })
});
it('extractSongs() should return array of songs', (done) => {
  index.extractSongs(mockPlaylistDOM)
    .then((songs) => {
      expect(songs).toEqual(songsRef);
      done();
    });
});
it('postLatestSong() should post tweet w/ song if song has not yet been tweeted');
