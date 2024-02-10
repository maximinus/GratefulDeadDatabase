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
let year_store = new YearStorage();


function getUniqueSongsStartEndYear(year_start, year_end) {
    let played_songs = [];
    for(let single_year=year_start; single_year <= year_end; single_year++) {
        // go over all years UP to this year
        for(let year_show of getAllShowsInYear(single_year)) {
            for(let single_song of year_show.getAllUniqueSongs()) {
                if(played_songs.includes(single_song.song) === false) {
                    played_songs.push(single_song.song);
                }
            }
        }
    }
    return played_songs;
};

function getTotalPlayed(song) {
    return store.song_data[song].length;
};

function getFirstTimePlayed(song) {
    return store.song_data[song][0];
}

function getLastTimePlayed(song) {
    let array_length = store.song_data[song].length;
    return store.song_data[song][array_length - 1];
};

function getUniqueStartEnd(year) {
    // get all songs from the year
    let all_songs_in_year = [];
    for(let single_show of getAllShowsInYear(year)) {
        for(let single_song of single_show.getAllUniqueSongs()) {
            if(all_songs_in_year.includes(single_song.song) === false) {
                all_songs_in_year.push(single_song.song);
            }
        }
    }
    // now we simply iterate over the rest of the years
    let played_before = [];
    if(year != START_YEAR) {
        played_before = getUniqueSongsStartEndYear(START_YEAR, year - 1);
    }
    let played_after = [];
    if(year != END_YEAR) {
        played_after = getUniqueSongsStartEndYear(year + 1, END_YEAR);
    }

    // uniques: in all_songs but NOT in played_before and played_after
    // first_played: in all_songs but NOT in played_before
    // never_played_again: in all_songs but NOT in played_after
    let uniques = [];
    let first_played = [];
    let never_again = [];
    for(let single_song of all_songs_in_year) {
        let song_name = getSongName(single_song);
        let played_after_this_year = played_after.includes(single_song);
        if(played_before.includes(single_song) === false) {
            first_played.push([song_name, '']);
            if(played_after_this_year === false) {
                uniques.push([song_name, '']);
                // also need to add to never again, because it fails in the logic otherwise
                never_again.push([song_name, '']);
            }
        } else if(played_after_this_year === false) {
            // i.e., played before is true
            never_again.push([song_name, '']);
        }
    }

    // we don't have the total played
    // "never played again" should last date played
    // "new songs" should be sorted by the date first played
    // "only played this year" sorted by total times played
    // currently this sorting does nothing
    // we'll need to do this manually
    for(const element of uniques) {
        element[1] = getTotalPlayed(element[0]);
    }
    for(const element of first_played) {
        let first_show = getShowFromId(getFirstTimePlayed(element[0]).show_id);
        element[1] = first_show;
    }
    for(const element of never_again) {
        let last_show = getShowFromId(getLastTimePlayed(element[0]).show_id);
        element[1] = last_show;
    }

    // sort by total played
    uniques.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    first_played.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    never_again.sort((a, b) => (a[1].id < b[1].id) ? 1 : -1);

    // remove the values, they are not needed
    for(let i of uniques) {
        // we need the total of uniques for this year
        if(i[1] > 1) {
            year_store.uniques.push([convertToLink(i[0], `song-${i[0]}`), `Played ${i[1]} times`]);
        } else {
            year_store.uniques.push([convertToLink(i[0], `song-${i[0]}`), 'Played once']);
        }   
    }
    for(let i of first_played) {
        let show_link = convertToLink(convertDate(i[1].date), `show-${i[1].id}`);
        year_store.first_played.push([convertToLink(i[0], `song-${i[0]}`), show_link]);
    }
    for(let i of never_again) {
        let show_link = convertToLink(convertDate(i[1].date), `show-${i[1].id}`);
        year_store.never_again.push([convertToLink(i[0], `song-${i[0]}`), show_link]);
    }
    return [year_store.uniques.slice(0, TABLE_ENTRIES),
            year_store.first_played.slice(0, TABLE_ENTRIES),
            year_store.never_again.slice(0, TABLE_ENTRIES)];
};

function getMostCommonYearSongs(year) {
    // build the most common and the most common combos
    let all_songs = {};
    let all_combos = {};
    for(let single_show of getAllShowsInYear(year)) {
        // first all the songs
        for(let single_song of single_show.getAllSongs()) {
            if (single_song.song in all_songs === false) {
                all_songs[single_song.song] = 1;
            } else {
                all_songs[single_song.song] += 1;
            }
        }
        // now get all combos
        for(let single_set of single_show.sets) {
            if(single_set.songs.length < 2) {
                continue;
            }
            for(let index=0; index < single_set.songs.length - 1; index++) {
                let key = `${single_set.songs[index].song}-${single_set.songs[index + 1].song}`
                if(key in all_combos === false) {
                    all_combos[key] = 1;
                } else {
                    all_combos[key] += 1;
                }
            }
        }
    }
    let common_songs = [];
    for(let key in all_songs) {
        common_songs.push([key, all_songs[key]]);
    }
    let common_combos = []
    for(let key in all_combos) {
        common_combos.push([key, all_combos[key]]);
    }
    common_songs.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    common_combos.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    // add the names and links here
    for(const element of common_songs) {
        let name1 = getSongName(element[0]);
        element[0] = convertToLink(name1, `song-${name1}`);
    }
    for(const element of common_combos) {
        // combo names a bit harder
        let two_songs = element[0].split("-");
        let name1 = getSongName(parseInt(two_songs[0]));
        let name2 = getSongName(parseInt(two_songs[1]));
        let link1 = convertToLink(name1, `song-${name1}`);
        let link2 = convertToLink(name2, `song-${name2}`);
        element[0] = `${link1} / ${link2}`;
    }

    // store and slice
    year_store.common_songs = common_songs;
    year_store.common_combos = common_combos;
    return [common_songs.slice(0, TABLE_ENTRIES), common_combos.slice(0, TABLE_ENTRIES)];
};

function getCommonVenues(year) {
    let venue_ids = {};
    for(let single_show of getAllShowsInYear(year)) {
        if(single_show.venue in venue_ids) {
            venue_ids[single_show.venue] += 1;
        } else {
            venue_ids[single_show.venue] = 1;
        }
    }
    let venue_details = [];
    for(let single_venue in venue_ids) {
        let v = getVenue(single_venue);
        venue_details.push([convertToLink(v.venue, `venue-${v.id}`), venue_ids[single_venue]]);
    }
    venue_details.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    year_store.all_venues = venue_details;
    return venue_details.slice(0, TABLE_ENTRIES);
};

function getYearWeatherData(year) {
    // TODO: No weather before 1970: check weather exists before displaying this
    // for each of these, get the weather
    let show_weather = [];
    for(let single_show of getAllShowsInYear(year)) {
        let weather = store.weather[single_show.id];
        let max_temp = Math.max(...weather.temps);
        let min_temp = Math.min(...weather.temps.filter(x => x > 6));
        // for rain, get the total precipitation over the 24 hrs
        let total_rain = 0
        for(let i of weather.precip) {
            total_rain += i;
        }
        total_rain = convertPrecip(total_rain);
        let date_text = convertDate(single_show.date);
        let date_link = convertToLink(date_text, `show-${single_show.id}`);
        show_weather.push([date_link, max_temp, min_temp, total_rain]);
    }
    // sort all of these and store for later
    show_weather.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    for(let i of show_weather) {
        year_store.hottest.push([i[0], `${convertTemp(i[1]).toFixed(1)}°F`]);
    }
    show_weather.sort((a, b) => (a[2] > b[2]) ? 1 : -1);
    for(let i of show_weather) {
        year_store.coldest.push([i[0], `${convertTemp(i[2]).toFixed(1)}°F`]);
    }
    show_weather.sort((a, b) => (a[3] < b[3]) ? 1 : -1);
    // remove all days with no rain
    for(let i of show_weather) {
        if(i[3] <= 0) {
            break;
        }
        year_store.wettest.push([i[0], `${i[3]} inches`]);
    }

    // slice and return
    return [year_store.wettest.slice(0, TABLE_ENTRIES),
            year_store.hottest.slice(0, TABLE_ENTRIES),
            year_store.coldest.slice(0, TABLE_ENTRIES)];
};

function getYearLongestShortest(year) {
    let song_lengths = [];
    let show_lengths = [];
    for(let single_show of getAllShowsInYear(year)) {
        let total_length = single_show.getLength();
        if(total_length != 0) {
            let show_link = convertToLink(convertDate(single_show.date), `show-${single_show.id}`);
            show_lengths.push([show_link, single_show.getLength()]);
        }
        for(let single_song of single_show.getAllSongs()) {
            // store the song and the date
            song_lengths.push([getSongName(single_song.song), single_show, single_song.seconds]);
        }
    }
    // now sort as per usual
    song_lengths.sort((a, b) => (a[2] < b[2]) ? 1 : -1);
    show_lengths.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    // only top 100 longest, otherwise list will be crazy
    for(let i of song_lengths.slice(0, 100)) {
        // we need to show the double link: song / date
        let song_link = convertToLink(i[0], `song-${i[0]}`);
        let show_link = convertToLink(convertDate(i[1].date), `show-${i[1].id}`);
        year_store.longest_songs.push([`${song_link}, ${show_link}`, convertTime(i[2])]);
    }
    for(let i of show_lengths) {
        year_store.longest_shows.push([i[0], convertTime(i[1])]);
    }
    return [year_store.longest_songs.slice(0, TABLE_ENTRIES),
            year_store.longest_shows.slice(0, TABLE_ENTRIES),
            [...year_store.longest_shows].reverse().slice(0, TABLE_ENTRIES)];
};

function buildYearCommon(year) {
    let data = getMostCommonYearSongs(year);
    // already sliced to correct size
    let table_songs = data[0];
    let table_combos = data[1];
    let index = 0;
    let table = document.getElementById('year-common-songs');
    // data is in format [song-name, total]
    for(let row of table.children) {
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
    table = document.getElementById('year-common-combos');
    // data is in format [song-name, total]
    for(let row of table.children) {
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

function buildYearAverageLength(year, chart_id) {
    // for all shows, get average song length for songs that are timed
    let avg_lengths = [];
    for(let single_show of getAllShowsInYear(year)) {
        let total_time = 0;
        let total_songs = 0;
        for(let single_song of single_show.getAllSongs()) {
            if(single_song.seconds != 0) {
                total_time += single_song.seconds;
                total_songs += 1;
            }
        }
        if(total_time == 0) {
            avg_lengths.push(0);
        } else {
            // to the nearest second
            avg_lengths.push(Math.round(total_time / total_songs));
        }
    }
    Highcharts.chart(chart_id, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        legend: {
            enabled: true,
            layout: "horizontal",
            align: "right",
            verticalAlign: "top",
            floating: true,
            itemStyle: {
                color: '#000000',
                fontWeight: 'bold',
                fontSize: 8,
            },
            borderWidth: 1
        },
        xAxis: {
            title: {
                text: 'Shows in year'
            }
        },
        yAxis: {
            title: {
                text: 'Average song length'
            }
        },
        credits: {
            enabled: false
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2,
            formatter: function () {
                let show_number = `${this.x + 1}${nth(this.x + 1)} show of the year:<br >`;
                if(this.y == 0) {
                    return `${show_number}Data not avaliable`;
                }
                let avg_length = `Average song length was ${convertTime(this.y)}`;
                return `${show_number}${avg_length}`;
            },
        },
        series: [{
            name: 'Average Song Length',
            showInLegend: true,
            pointStart: 0,
            color: '#88cc88',
            data: avg_lengths
        }]
    });
};

function buildYearLengthBuckets(year, chart_id) {
    let longest = 0;
    let length_buckets = {};
    for(let single_show of getAllShowsInYear(year)) {
        for(let single_song of single_show.getAllSongs()) {
            if(single_song.seconds != 0) {
                // round to nearest minute
                let bucket = Math.round(single_song.seconds / 60.0);
                if(longest < bucket) {
                    longest = bucket;
                }
                if(bucket in length_buckets) {
                    length_buckets[bucket] += 1;
                } else {
                    length_buckets[bucket] = 1;
                }
            }
        }
    }
    // start at 0, since 0 = 0s -> 60s long
    let length_values = [];
    for(let i=0; i<=longest; i++) {
        if(i in length_buckets) {
            length_values.push(length_buckets[i]);
        } else {
            // none of that value
            length_values.push(0);
        }
    }
    // great, we now have an array with the number of songs in that time bucket
    Highcharts.chart(chart_id, {
        chart: {
            type: 'column'
        },
        title: {
            text: null
        },
        xAxis: {
            title: {
                text: 'Length / minutes'
            }
        },
        yAxis: {
            title: {
                text: 'Total songs'
            }
        },
        tooltip: {
            formatter: function () {
                return `${this.y} songs that were ${this.x}-${this.x+1} minutes long`;
            },
        },
        plotOptions: {
            column: {
                pointPadding: 0.0,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Total songs by length',
            showInLegend: true,
            pointStart: 0,
            color: '#88cc88',
            data: length_values
        }]
    });
};

function buildYearUniques(year) {
    let data = getUniqueStartEnd(year);
    // already sliced to correct size
    let uniques = data[0];
    let first_played = data[1];
    let never_played = data[2];

    if(uniques.length == 0) {
        uniques = [['No unique songs', '']]
        document.getElementById('pop-year-unique').removeEventListener('click', popOutYearUnique);
    } else {
        document.getElementById('pop-year-unique').addEventListener('click', popOutYearUnique);
    }
    let index = 0;
    let table = document.getElementById('year-unique-songs');
    // data is in format [song-name, total]
    for(let row of table.children) {
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
    table = document.getElementById('year-new-songs');
    // data is in format [song-name, total]
    for(let row of table.children) {
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
    table = document.getElementById('year-never-played');
    // data is in format [song-name, total]
    for(let row of table.children) {
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
    let year_venues = getCommonVenues(year);
    let index = 0;
    let table = document.getElementById('year-common-venues');
    // data is in format [venue name, total]
    for(let row of table.children) {
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
    let index = 0;
    let table = document.getElementById(table_id);
    for(let row of table.children) {
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
    let data = getYearLongestShortest(year);
    updateBasicTable('year-longest-songs', data[0]);
    updateBasicTable('year-longest-shows', data[1]);
    updateBasicTable('year-shortest-shows', data[2]);
};

function buildWeatherData(year) {
    let weather_data = getYearWeatherData(year);
    updateBasicTable('year-weather-wettest', weather_data[0]);
    updateBasicTable('year-weather-hottest', weather_data[1]);
    updateBasicTable('year-weather-coldest', weather_data[2]);
};

function buildRecommendedShows(year) {
    let recs = [];
    for(let single_date of BEST_SHOWS[year]) {
        // it's in format DD-MM, convert to a date
        let date_split = single_date.split('-');
        let link_txt = convertDateStringFromDate(new Date(year, parseInt(date_split[1]) - 1, parseInt(date_split[0])));
        recs.push([convertToLink(link_txt, `show-${year}/${date_split[1]}/${date_split[0]}`), '']);
    }
    updateBasicTable('year-recommended-shows', recs);
};

function buildYearTitle(year) {
    let total_time = 0;
    let total_songs = 0;
    let countable_songs = 0;
    let venues = [];
    let all_shows_in_year = getAllShowsInYear(year);
    for(let single_show of all_shows_in_year) {
        if(venues.includes(single_show.venue) === false) {
            venues.push(single_show.venue);
        }
        for(let single_song of single_show.getAllSongs()) {
            total_songs += 1;
            if(single_song.seconds != 0) {
                countable_songs += 1;
                total_time += single_song.seconds;
            }
        }
    }
    let data = {'year': year.toString(),
                'total-shows': all_shows_in_year.length,
                'total-venues': venues.length,
                'total-songs': makePrettyNumber(total_songs),
                'average-total-songs': (total_songs / all_shows_in_year.length).toFixed(2),
                'average-song-length': convertTime(Math.round(total_time / countable_songs))
    };
    let template = document.getElementById('year-title-template').innerHTML;
    let new_html = Mustache.render(template, data);
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

function popOutSongLength() {
    // clear current chart data
    let table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Song Length Over Year';
    // set chart
    buildYearAverageLength(year_store.current_year, 'pop-up-charts')
    // display
    $('#chart-dialog').modal();
};

function popOutTotalSongs() {
    // clear current chart data
    let table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Song Length Over Year';
    // set chart
    buildYearLengthBuckets(year_store.current_year, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
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
    // and graphs
    document.getElementById('pop-year-song-length').addEventListener('click', popOutSongLength);
    document.getElementById('pop-year-total-songs').addEventListener('click', popOutTotalSongs);
};

function updateYear(year) {
    // reset at start
    year_store = new YearStorage();
    year_store.current_year = year;
    log(`Rendering year ${year}`);
    buildYearAverageLength(year, 'year-total-length-chart');
    buildYearLengthBuckets(year, 'year-length-songs-chart');
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
