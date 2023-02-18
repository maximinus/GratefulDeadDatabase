// test storage code
QUnit.module('StorageTests');

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
};

function getRandomSong() {
    var index = getRandomInt(25);
    var seconds = getRandomInt(25);
    return new Song(index, seconds);
};

function getRandomSetlist(total_songs) {
    var new_songs = [];
    for(var i = 0; i < total_songs; i++) {
        new_songs.push(getRandomSong());
    }
    return new_songs;
};

function getRandomShow(total_sets, total_songs) {
    var new_sets = [];
    for(var i = 0; i < total_sets; i++) {
        new_sets.push(new ShowSet(getRandomSetlist(total_songs)));
    }
    return new Show(new_sets, getRandomInt(10000));
};

function assertSetSame(assert, set1, set2, total_songs) {
    assert.strictEqual(set1.songs.length, set2.songs.length);
    for(var i = 0; i < total_songs; i++) {
        assert.strictEqual(set1.songs[i].song, set2.songs[i].song);
        assert.strictEqual(set2.songs[i].seconds, set2.songs[i].seconds);
    }
};

QUnit.test('Song is same', function(assert) {
    var new_song = new Song(50, 25);
    var json_data = new_song.getJsonData();
    var copy_song = Song.fromJsonData(json_data);
    assert.strictEqual(new_song.song, copy_song.song);
    assert.strictEqual(new_song.seconds, copy_song.seconds);
});

QUnit.test('Set is same', function(assert) {
    // collect some songs
    var total_songs = 5;
    var new_songs = getRandomSetlist(total_songs);
    var single_set = new ShowSet(new_songs);
    var json_data = single_set.getJsonData();
    var copy_set = ShowSet.fromJsonData(json_data);
    assertSetSame(assert, single_set, copy_set, total_songs);
    assert.strictEqual(single_set.songs.length, copy_set.songs.length);
});

QUnit.test('Show is same', function(assert) {
    var new_show = getRandomShow(3, 8);
    var json_data = new_show.getJsonData();
    var copy_show = Show.fromJsonData(json_data);
    assert.strictEqual(new_show.sets.length, copy_show.sets.length);
    for(var i = 0; i < 3; i++) {
        assertSetSame(assert, new_show.sets[i], copy_show.sets[i]);
    }
});
