// display a year

class YearStorage {
    constructor() {
        var current_year = null;
    };
};

// can't call this now as store may or may not be setup
var year_store = new YearStorage();


func getUniqueSongsStartEndYear(year_start, year_end) {
    var played_songs = [];
    for(var single_year=START_YEAR; single_year<year; single_year++) {
        // go over all years UP to this year
        for(var year_show of getAllShowsInYear(single_year)) {
            for(var single_song of single_show.getAllUniqueSongs()) {
                if(played_before.includes(single_song.song) == false) {
                    played_before.push(single_song.song);
                }
            }
        }
    }
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

    // do the same for played after
    var played_after = [];
    if(year != END_YEAR) {
        for(var single_year=START_YEAR; single_year<year; single_year++) {
            // go over all years UP to this year
            for(var year_show of getAllShowsInYear(single_year)) {
                for(var single_song of single_show.getAllUniqueSongs()) {
                    if(played_before.includes(single_song.song) == false) {
                        played_before.push(single_song.song);
                    }
                }
            }
        }
    }
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

function displayYear(year) {
    year_store.current_year = year;
    buildYearCommon(year);
};
