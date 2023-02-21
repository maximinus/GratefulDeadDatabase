// display a show

class ShowStorage {
    constructor() {
        var current_show = null;
    };
};

// can't call this now as store may or may not be setup
var show_store = new ShowStorage();


function getRealTemps(temps) {
    // convert the temps from the actual values to the real data
    // from the original Python code to write the data:
    // Temp is done as:
    //   Take the temp and add 50.0              73.4  -> 113.4
    //   Multiply by 10 and drop the fraction:   113.4 -> 1134
    //   Add 1
    // so the reverse:
    new_data = []
    for(var t of temps) {
        // if zero, then null
        if(t == 0) {
            new_data.push(null);
        } else {
            // subtract 1
            var real_t = t - 1.0;
            // divide by 10
            real_t = real_t / 10.0;
            // subtract 50
            real_t -= 50.0;
            new_data.push(real_t);
        }
    }
    return new_data;
};

// functions: * rarest this year
//            * rarest combos this year
//            * rarest combos ever
//            most similar shows
//            store.weather for the show
//            encore nearest in total
//            Venue information
//              Next time played / last time played / total played
//            longest songs
//            shortest songs

function getRarestSongs() {
    year_of_show = show_store.current_show.js_date.getFullYear()
    // first we need get all songs and remove duplicates
    // then get the total times played for each song
    // then sort and take the first X
    var all_songs = show_store.current_show.getAllUniqueSongs();
    var results = [];
    var buckets = {}
    for(var song of all_songs) {
        var name = getSongName(song.song);
        results.push([name, store.song_data[name].length]);
        buckets[song.song] = 0;
    }
    for(show of getAllShowsInYear(year_of_show)) {
        for(played_song of show.getAllSongs()) {
            if(buckets.hasOwnProperty(played_song.song)) {
                buckets[played_song.song] += 1;
            }
        }
    }
    // put buckets into a list, add names and sort
    var year_list = []
    for (var key in buckets) {
        year_list.push([getSongName(key), buckets[key]]);
    }
    year_list.sort((a, b) => (a[1] > b[1]) ? 1 : -1);
    results.sort((a, b) => (a[1] > b[1]) ? 1 : -1);
    return [results.slice(0, TABLE_ENTRIES), year_list.slice(0, TABLE_ENTRIES)];
};


function getRarestCombos() {
    year_of_show = show_store.current_show.js_date.getFullYear();
    // so for this, first we get all songs and remove dups
    // then we merge ones next to each other in pairs
    // so if we have A-B-C-D we get A-B, B-C, C-D. We split totally over set-breaks
    // then we go along each one and find instances of the first of the pair
    // we count these instances
    // sort by this count and then take the first X
    var all_sets = show_store.current_show.getAllUniqueSongsBySet();
    var combos = []
    var year_combos = []
    for(var single_set of all_sets) {
        if(single_set.length < 2) {
            continue;
        }
        for(var i=0; i < single_set.length - 1; i++) {
            // holds scores for all time and this year
            combos.push([single_set[i].song, single_set[i+1].song, 0, 0]);
        }
    }
    // now we have a list of all combos
    // Iterate over all shows
    for(var single_show of store.shows) {
        // get all songs
        var all_songs = single_show.getAllSongs();
        if(all_songs.length < 2) {
            continue;
        }
        // iterate over from up to penultimate
        for(var i=0; i < all_songs.length - 1; i++) {
            // over all combos
            for(var test_combo of combos) {
                if((test_combo[0] == all_songs[i].song) && (test_combo[1] == all_songs[i+1].song)) {
                    // a match, count
                    test_combo[2] += 1;
                    // this year?
                    if(single_show.js_date.getFullYear() == year_of_show) {
                        test_combo[3] += 1;
                    }
                }
            }
        }
    }

    combos.sort((a, b) => (a[2] > b[2]) ? 1 : -1);
    var all_time_combos = combos.slice(0, TABLE_ENTRIES);
    combos.sort((a, b) => (a[3] > b[3]) ? 1 : -1);
    var this_year_combos = combos.slice(0, TABLE_ENTRIES);
    return [all_time_combos, this_year_combos]
};


function renderWeatherChart() {
    var temps = getRealTemps(store.weather[1000].temps);
    var feels = getRealTemps(store.weather[1000].feels);
    var chart = Highcharts.chart('weather-chart', {
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
        },
        yAxis: {
        },
        credits: {
            enabled: false
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2
        },
        series: [{
            name: 'Real Temp',
            showInLegend: true,
            pointStart: 0,
            color: '#88cc88',
            data: temps
        },
        {
            name: 'Feels Like',
            showInLegend: true,
            pointStart: 0,
            color: '#66666688',
            data: feels
        }],
    });
};

function buildCombos() {
    var data = getRarestCombos();
    // already sliced to correct size
    var table_all_data = data[0];
    var table_year_data = data[1];
    // these entries are of the form [cb1, cb2, total, year_total]
    // scroll through the children of the table and vist them all
    var index = 0;
    var table = document.getElementById('show-rarest-combos');
    for(var row of table.children) {
        if(index >= table_all_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var cname = `${getSongName(table_all_data[index][0])} / ${getSongName(table_all_data[index][1])}`
            row.children[1].innerHTML = cname;
            row.children[2].innerHTML = table_all_data[index][2].toString();
        }
        index += 1;
    }
    // scroll through the children of the table and vist them all
    var index = 0;
    var table = document.getElementById('show-rarest-combos-year');
    for(var row of table.children) {
        if(index >= table_year_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var cname = `${getSongName(table_year_data[index][0])} / ${getSongName(table_year_data[index][1])}`
            row.children[1].innerHTML = cname;
            row.children[2].innerHTML = table_year_data[index][3].toString();
        }
        index += 1;
    }
};

function buildRarestSongs() {
    var data = getRarestSongs();;
    // already sliced to correct size
    var table_all_data = data[0];
    var table_year_data = data[1];
    var index = 0;
    var table = document.getElementById('show-rarest-songs');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= table_all_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = table_all_data[index][0];
            row.children[2].innerHTML = table_all_data[index][1].toString();
        }
        index += 1;
    }
    index = 0;
    var table = document.getElementById('show-rarest-songs-year');
    // data is in format [song-name, total]
    for(var row of table.children) {
        if(index >= table_year_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = table_year_data[index][0];
            row.children[2].innerHTML = table_year_data[index][1].toString();
        }
        index += 1;
    }
};

function getShowRenderData() {
    var show_data = {};
    var show_sets = [];
    for(var single_set of show_store.current_show.sets) {
        var new_set = '';
        for(var single_song of single_set.songs) {
            new_set = new_set.concat(getSongName(single_song.song));
            if(single_song.sequed == true) {
                new_set = new_set.concat(' > ');
            } else {
                new_set = new_set.concat(' / ');
            }
        }
        // remove last sequed result
        new_set = new_set.substring(0, new_set.length - 3);
        show_sets.push(new_set);
    }
    sets_all_data = [];
    index = 1;
    for(var single_set of show_sets) {
        sets_all_data.push({'set-name': `Set ${index}`, 'songs': single_set});
        index += 1;
    }
    this_venue = getVenue(store.venues[show_store.current_show.venue])
    return {'show-date': convertDateLong(show_store.current_show.date),
            'show-venue': this_venue.getVenueName(),
            'sets': sets_all_data};
};

function displayShow(show_index) {
    show_store.current_show = store.shows[show_index];
    // in the div id of show-render
    // using the mustache div of show-template
    log(`Rendering show ${store.shows[show_index].js_date.toDateString()}`);
    // get the template and render
    var template = document.getElementById('show-template').innerHTML;
    // clear out show-render and place the template
    var new_html = Mustache.render(template, getShowRenderData());
    document.getElementById('show-render').innerHTML = new_html;
    renderWeatherChart();
    buildCombos();
    buildRarestSongs();
};
