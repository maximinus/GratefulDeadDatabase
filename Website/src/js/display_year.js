// display a year

class YearStorage {
    constructor() {
        this.current_year = null;
        this.all_venues = [];
        this.common_songs = [];
        this.common_combos = [];
        this.uniques = [];
        this.first_played = [];
        this.never_again = [];
        this.wettest = [];
        this.hottest = [];
        this.coldest = [];
        this.longest_songs = [];
        this.longest_shows = [];
        this.shortest_shows = [];
    };
};

// can't call this now as store may or may not be setup
var year_store = new YearStorage();


function getUniqueSongsStartEndYear(year_start, year_end) {
    var played_songs = [];
    for(var single_year=year_start; single_year <= year_end; single_year++) {
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
    var all_songs_in_year = [];
    for(var single_show of getAllShowsInYear(year)) {
        for(var single_song of single_show.getAllUniqueSongs()) {
            if(all_songs_in_year.includes(single_song.song) == false) {
                all_songs_in_year.push(single_song.song);
            }
        }
    }
    // now we simply iterate over the rest of the years
    var played_before = [];
    if(year != START_YEAR) {
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
    for(var single_song of all_songs_in_year) {
        var song_name = getSongName(single_song);
        var played_after_this_year = played_after.includes(single_song);
        if(played_before.includes(single_song) == false) {
            first_played.push([song_name, '']);
            if(played_after_this_year == false) {
                uniques.push([song_name, '']);
            }
        } else {
            // i.e., played before is true
            if(played_after_this_year == false) {
                never_again.push([song_name, '']);
            }
        }
    }
    // sort by total played
    uniques.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    first_played.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    never_again.sort((a, b) => (a[1] < b[1]) ? 1 : -1);

    // remove the values, they are not needed
    for(var i of uniques) {
        year_store.uniques.push([convertToLink(i[0], `song-${i[0]}`), '']);
    }
    for(var i of first_played) {
        year_store.first_played.push([convertToLink(i[0], `song-${i[0]}`), '']);
    }
    for(var i of never_again) {
        year_store.never_again.push([convertToLink(i[0], `song-${i[0]}`), '']);
    }
    return [year_store.uniques.slice(0, TABLE_ENTRIES),
            year_store.first_played.slice(0, TABLE_ENTRIES),
            year_store.never_again.slice(0, TABLE_ENTRIES)];
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
    // add the names and links here
    for(var i=0; i<common_songs.length; i++) {
        var name1 = getSongName(common_songs[i][0]);
        common_songs[i][0] = convertToLink(name1, `song-${name1}`);
    }
    for(var i=0; i<common_combos.length; i++) {
        // combo names a bit harder
        var two_songs = common_combos[i][0].split("-");
        var name1 = getSongName(parseInt(two_songs[0]));
        var name2 = getSongName(parseInt(two_songs[1]));
        var link1 = convertToLink(name1, `song-${name1}`);
        var link2 = convertToLink(name2, `song-${name2}`);
        common_combos[i][0] = `${link1} / ${link2}`;
    }

    // store and slice
    year_store.common_songs = common_songs;
    year_store.common_combos = common_combos;
    return [common_songs.slice(0, TABLE_ENTRIES), common_combos.slice(0, TABLE_ENTRIES)];
};

function getCommonVenues(year) {
    var venue_ids = {};
    for(single_show of getAllShowsInYear(year)) {
        if(single_show.venue in venue_ids) {
            venue_ids[single_show.venue] += 1;
        } else {
            venue_ids[single_show.venue] = 1;
        }
    }
    var venue_details = [];
    for(var single_venue in venue_ids) {
        var v = getVenue(single_venue);
        venue_details.push([convertToLink(v.venue, `venue-${v.id}`), venue_ids[single_venue]]);
    }
    venue_details.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    year_store.all_venues = venue_details;
    return venue_details.slice(0, TABLE_ENTRIES);
};

function getYearWeatherData(year) {
    // TODO: No weather before 1970: check weather exists before displaying this
    // for each of these, get the weather
    var show_weather = [];
    for(var single_show of getAllShowsInYear(year)) {
        var weather = store.weather[single_show.id];
        var max_temp = Math.max(...weather.temps);
        var min_temp = Math.min(...weather.temps.filter(x => x > 6));
        var rain = weather.precip.filter(x => x === true).length;
        var date_text = convertDate(single_show.date);
        var date_link = convertToLink(date_text, `show-${single_show.id}`);
        show_weather.push([date_link, max_temp, min_temp, rain]);
    }
    // sort all of these and store for later
    show_weather.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    for(var i of show_weather) {
        year_store.hottest.push([i[0], `${convertTemp(i[1]).toFixed(1)}°F`]);
    }
    show_weather.sort((a, b) => (a[2] > b[2]) ? 1 : -1);
    for(var i of show_weather) {
        year_store.coldest.push([i[0], `${convertTemp(i[2]).toFixed(1)}°F`]);
    }
    show_weather.sort((a, b) => (a[3] < b[3]) ? 1 : -1);
    for(var i of show_weather) {
        year_store.wettest.push([i[0], `${i[3]}hrs rain`]);
    }

    // slice and return
    return [year_store.wettest.slice(0, TABLE_ENTRIES),
            year_store.hottest.slice(0, TABLE_ENTRIES),
            year_store.coldest.slice(0, TABLE_ENTRIES)];
};

function getYearLongestShortest(year) {
    var song_lengths = [];
    var show_lengths = [];
    for(var single_show of getAllShowsInYear(year)) {
        var total_length = single_show.getLength();
        if(total_length != 0) {
            var show_link = convertToLink(convertDate(single_show.date), `show-${single_show.id}`);
            show_lengths.push([show_link, single_show.getLength()]);
        }
        for(var single_song of single_show.getAllSongs()) {
            song_lengths.push([getSongName(single_song.song), single_song.seconds]);
        }
    }
    // now sort as per usual
    song_lengths.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    // only top 100 longest, otherwise list will be crazy
    for(var i of song_lengths.slice(0, 100)) {
        year_store.longest_songs.push([convertToLink(i[0], `song-${i[0]}`), convertTime(i[1])]);
    }
    for(var i of show_lengths) {
        year_store.longest_shows.push([i[0], convertTime(i[1])]);
    }
    return [year_store.longest_songs.slice(0, TABLE_ENTRIES),
            year_store.longest_shows.slice(0, TABLE_ENTRIES),
            [...year_store.longest_shows].reverse().slice(0, TABLE_ENTRIES)];
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
        document.getElementById('pop-year-unique').removeEventListener('click', popOutYearUnique);
    } else {
        document.getElementById('pop-year-unique').addEventListener('click', popOutYearUnique);
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
    if(first_played.length == 0) {
        first_played = [['No new songs', '']]
        document.getElementById('pop-year-new-songs').removeEventListener('click', popOutYearNewSongs);
    } else {
        document.getElementById('pop-year-new-songs').addEventListener('click', popOutYearNewSongs);
    }
    index = 0;
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
        document.getElementById('pop-year-never-played').removeEventListener('click', popOutYearNeverPlayed);
    } else {
        document.getElementById('pop-year-never-played').addEventListener('click', popOutYearNeverPlayed);
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

function buildCommonVenues(year) {
    var year_venues = getCommonVenues(year);
    var index = 0;
    var table = document.getElementById('year-common-venues');
    // data is in format [venue name, total]
    for(var row of table.children) {
        if(index >= year_venues.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = year_venues[index][0];
            row.children[2].innerHTML = year_venues[index][1].toString();
        }
        index += 1;
    }
};

function updateBasicTable(table_id, data) {
    var index = 0;
    var table = document.getElementById(table_id);
    for(var row of table.children) {
        if(index >= data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = data[index][0];
            row.children[2].innerHTML = data[index][1];
        }
        index += 1;
    }
};

function buildYearLongestShortest(year) {
    data = getYearLongestShortest(year);
    updateBasicTable('year-longest-songs', data[0]);
    updateBasicTable('year-longest-shows', data[1]);
    updateBasicTable('year-shortest-shows', data[2]);
};

function buildWeatherData(year) {
    var weather_data = getYearWeatherData(year);
    updateBasicTable('year-weather-wettest', weather_data[0]);
    updateBasicTable('year-weather-hottest', weather_data[1]);
    updateBasicTable('year-weather-coldest', weather_data[2]);
};

function buildRecommendedShows(year) {
    var recs = [];
    for(var single_date of BEST_SHOWS[year]) {
        // it's in format DD-MM, convert to a date
        var date_split = single_date.split('-');
        var link_txt = convertDateStringFromDate(new Date(year, parseInt(date_split[1]) - 1, parseInt(date_split[0])));
        recs.push([convertToLink(link_txt, `show-${year}/${date_split[1]}/${date_split[0]}`), '']);
    }
    updateBasicTable('year-recommended-shows', recs);
};

function buildYearTitle(year) {
    var total_time = 0;
    var total_songs = 0;
    var countable_songs = 0;
    var venues = [];
    var all_shows_in_year = getAllShowsInYear(year);
    for(var single_show of all_shows_in_year) {
        if(venues.includes(single_show.venue) == false) {
            venues.push(single_show.venue);
        }
        for(var single_song of single_show.getAllSongs()) {
            total_songs += 1;
            if(single_song.seconds != 0) {
                countable_songs += 1;
                total_time += single_song.seconds;
            }
        }
    }
    data = {'year': year.toString(),
            'total-shows': all_shows_in_year.length,
            'total-venues': venues.length,
            'total-songs': makePrettyNumber(total_songs),
            'average-total-songs': (total_songs / all_shows_in_year.length).toFixed(2),
            'average-song-length': convertTime(Math.round(total_time / countable_songs))
    };
    var template = document.getElementById('year-title-template').innerHTML;
    var new_html = Mustache.render(template, data);
    document.getElementById('year-title-render').innerHTML = new_html;
};

function popOutYearVenues() {
    displayPopOut('Most Common Venues', year_store.all_venues);
};

function popOutYearCommonSongs() {
    displayPopOut('Most Common Songs', year_store.common_songs);
};

function popOutYearCommonCombos() {
    displayPopOut('Most Common Combos', year_store.common_combos);
};

function popOutYearUnique() {
    displayPopOut('Unique Songs', year_store.uniques);
};

function popOutYearNewSongs() {
    displayPopOut('First Played', year_store.first_played);
};

function popOutYearNeverPlayed() {
    displayPopOut('Never Played After', year_store.never_again);
};

function popOutYearWettest() {
    displayPopOut('Wettest Shows', year_store.wettest);
};

function popOutYearHottest() {
    displayPopOut('Hottest Shows', year_store.hottest);
};

function popOutYearColdest() {
    displayPopOut('Coldest Shows', year_store.coldest);
};

function popOutYearLongestSongs() {
    displayPopOut('100 Longest Songs', year_store.longest_songs);
};

function popOutYearLongestShows() {
    displayPopOut('Longest Shows', year_store.longest_shows);
};

function popOutYearShortestShows() {
    displayPopOut('Shortest Shows', [...year_store.longest_shows].reverse());
};

function addYearPopouts() {
    document.getElementById('pop-common-venues').addEventListener('click', popOutYearVenues);
    document.getElementById('pop-year-common-songs').addEventListener('click', popOutYearCommonSongs);
    document.getElementById('pop-year-common-combos').addEventListener('click', popOutYearCommonCombos);
    document.getElementById('pop-year-wettest').addEventListener('click', popOutYearWettest);
    document.getElementById('pop-year-hottest').addEventListener('click', popOutYearHottest);
    document.getElementById('pop-year-coldest').addEventListener('click', popOutYearColdest);
    document.getElementById('pop-year-longest-songs').addEventListener('click', popOutYearLongestSongs);
    document.getElementById('pop-year-longest-shows').addEventListener('click', popOutYearLongestShows);
    document.getElementById('pop-year-shortest-shows').addEventListener('click', popOutYearShortestShows);
};

function updateYear(year) {
    // reset at start
    year_store = new YearStorage();
    year_store.current_year = year;
    log(`Rendering year ${year}`);
    buildYearCommon(year);
    buildYearUniques(year);
    buildCommonVenues(year);
    buildYearLongestShortest(year);
    buildWeatherData(year);
    buildRecommendedShows(year);
    buildYearTitle(year);
};

function displayYear(year) {
    updateYear(year);
    addYearPopouts();
};
