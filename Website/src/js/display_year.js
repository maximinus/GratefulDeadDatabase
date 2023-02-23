// display a year

class YearStorage {
    constructor() {
        var current_year = null;
    };
};

// can't call this now as store may or may not be setup
var year_store = new YearStorage();


function getUniqueSongsStartEndYear(year_start, year_end) {
    var played_songs = [];
    for(var single_year=START_YEAR; single_year<year_end; single_year++) {
        // go over all years UP to this year
        for(var year_show of getAllShowsInYear(single_year)) {
            for(var single_song of year_show.getAllUniqueSongs()) {
                if(played_songs.includes(single_song.song) == false) {
                    played_songs.push(single_song.song);
                }
            }
        }
    }
    return played_songs;
};

function getUniqueStartEnd(year) {
    // get all songs from the year
    var all_songs = [];
    for(var single_show of getAllShowsInYear(year)) {
        for(var single_song of single_show.getAllUniqueSongs()) {
            if(all_songs.includes(single_song.song) == false) {
                all_songs.push(single_song.song);
            }
        }
    }
    // now we simply iterate over the rest of the years
    var played_before = [];
    if(year != 1965) {
        played_before = getUniqueSongsStartEndYear(START_YEAR, year - 1);
    }
    var played_after = [];
    if(year != END_YEAR) {
        played_after = getUniqueSongsStartEndYear(year + 1, END_YEAR);
    }

    // uniques: in all_songs but NOT in played_before and played_after
    // first_played: in all_songs but NOT in played_before
    // never_played_again: in all_songs but NOT in played_after
    var uniques = [];
    var first_played = [];
    var never_again = [];
    for(var single_song of all_songs) {
        var song_name = getSongName(single_song);
        var played_after_this_year = played_after.includes(single_song);
        if(played_before.includes(single_song) == false) {
            first_played.push([song_name, store.song_data[song_name].length]);
            if(played_after_this_year == false) {
                uniques.push([song_name, store.song_data[song_name].length]);
            }
        } else {
            if(played_after_this_year == false) {
                never_again.push([song_name, store.song_data[song_name].length]);
            }
        }
    }
    // sort by total played
    uniques.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    first_played.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    never_again.sort((a, b) => (a[1] < b[1]) ? 1 : -1);

    uniques = uniques.slice(0, TABLE_ENTRIES);
    first_played = first_played.slice(0, TABLE_ENTRIES)
    never_again = never_again.slice(0, TABLE_ENTRIES)

    return [uniques, first_played, never_again];
};


function getMostCommonYearSongs(year) {
    var shows = getAllShowsInYear(year);
    // build the most common and the most common combos
    var all_songs = {};
    var all_combos = {};
    for(var single_show of getAllShowsInYear(year)) {
        // first all the songs
        for(var single_song of single_show.getAllSongs()) {
            if (single_song.song in all_songs == false) {
                all_songs[single_song.song] = 1;
            } else {
                all_songs[single_song.song] += 1;
            }
        }
        // now get all combos
        for(var single_set of single_show.sets) {
            if(single_set.songs.length < 2) {
                continue;
            }
            for(var index=0; index < single_set.songs.length - 1; index++) {
                var key = `${single_set.songs[index].song}-${single_set.songs[index + 1].song}`
                if(key in all_combos == false) {
                    all_combos[key] = 1;
                } else {
                    all_combos[key] += 1;
                }
            }
        }
    }
    var common_songs = [];
    for(var key in all_songs) {
        common_songs.push([key, all_songs[key]]);
    }
    var common_combos = []
    for(var key in all_combos) {
        common_combos.push([key, all_combos[key]]);
    }
    common_songs.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    common_combos.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    // add the names
    common_songs = common_songs.slice(0, TABLE_ENTRIES);
    common_combos = common_combos.slice(0, TABLE_ENTRIES)
    for(var i=0; i<TABLE_ENTRIES; i++) {
        common_songs[i][0] = getSongName(common_songs[i][0]);
        // combo names a bit harder
        var two_songs = common_combos[i][0].split("-");
        common_combos[i][0] = `${getSongName(parseInt(two_songs[0]))} / ${getSongName(parseInt(two_songs[1]))}`;
    }
    return [common_songs, common_combos];
};

function buildYearCommon(year) {
    var data = getMostCommonYearSongs(year);
    // already sliced to correct size
    var table_songs = data[0];
    var table_combos = data[1];
    var index = 0;
    var table = document.getElementById('year-common-songs');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= table_songs.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = table_songs[index][0];
            row.children[2].innerHTML = table_songs[index][1].toString();
        }
        index += 1;
    }
    index = 0;
    var table = document.getElementById('year-common-combos');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= table_combos.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = table_combos[index][0];
            row.children[2].innerHTML = table_combos[index][1].toString();
        }
        index += 1;
    }
};

function buildYearUniques(year) {
    var data = getUniqueStartEnd(year);
    // already sliced to correct size
    var uniques = data[0];
    var first_played = data[1];
    var never_played = data[2];

    if(uniques.length == 0) {
        uniques = [['No unique songs', '']]
    }
    var index = 0;
    var table = document.getElementById('year-unique-songs');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= uniques.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = uniques[index][0];
            row.children[2].innerHTML = uniques[index][1].toString();
        }
        index += 1;
    }
    index = 0;
    if(first_played.length == 0) {
        first_played = [['No new songs', '']]
    }
    var table = document.getElementById('year-new-songs');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= first_played.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = first_played[index][0];
            row.children[2].innerHTML = first_played[index][1].toString();
        }
        index += 1;
    }
    if(never_played.length == 0) {
        never_played = [['No dropped songs', '']]
    }
    index = 0;
    var table = document.getElementById('year-never-played');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= never_played.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = never_played[index][0];
            row.children[2].innerHTML = never_played[index][1].toString();
        }
        index += 1;
    }
};

function displayYear(year) {
    year_store.current_year = year;
    buildYearCommon(year);
    buildYearUniques(year);
};
