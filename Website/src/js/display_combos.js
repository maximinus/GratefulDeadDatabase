// these need to be namespaced

class ComboStorage {
    constructor() {
        this.sorted_by_date = [];
        this.sorted_by_length = [];
        this.current_songs = [];
        this.played_chart = null;
    };
};

var combo_store = new ChartsStorage();

function updateComboTable(table_id, table_data) {
    var index = 0;
    var table = document.getElementById(table_id);
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = table_data[index][0];
            row.children[2].innerHTML = table_data[index][1];
        }
        index += 1;
    }
};

function updateComboPlayed(matches) {
    if(combo_store.played_chart != null) {
        // delete old chart if needed
        combo_store.played_chart.destroy();
    }

    // we need to calculate how many times played per year
    // this means for each year: (total_played / total_shows) * 100
    var years = new Array(YEARS_PLAYED);
    var percent = new Array(YEARS_PLAYED);
    var total_shows = new Array(YEARS_PLAYED);
    years.fill(0);
    percent.fill(0);
    total_shows.fill(0);

    for(var single_match of matches) {
        var year_index = getYear(single_match[0].date) - YEAR_OFFSET;
        years[year_index] += 1;
    }
    for(var single_show of store.shows) {
        var year_index = getYear(single_show.date) - YEAR_OFFSET;
        total_shows[year_index] += 1;
    }

    console.log(total_shows);

    var total = 0;
    var total_years = 0;
    for(var i = 0; i < percent.length; i++) {
        if (years[i] == 0) {
            percent[i] = null;
        } else {
            percent[i] = (years[i] / total_shows[i]) * 100;
            total += years[i];
            total_years += 1;
        }
    }

    console.log(percent);

    // calculate global average: sum of average / divided by years
    var averages = new Array(YEARS_PLAYED);
    var total_average = 0;
    if(total_years != 0) {
        total_average = Math.round((total / total_years) * 100.0) / 100.0;
    } else {
        total_average = 0;
    }
    averages.fill(total_average);

    var min_y_value = Math.floor(Math.min.apply(Math, percent));
    var max_y_value = Math.ceil(Math.max.apply(Math, percent));

    combo_store.played_chart = Highcharts.chart('combo-played-chart', {
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
            labelFormatter: function() {
              return `Avg when played: ${data[1]} %`;
            },
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
            title: {text: '% Shows Played At'},
            min: min_y_value,
            max: max_y_value,
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 3
                }
            }
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2
        },
        series: [{
            name: '% shows played',
            showInLegend: false,
            pointStart: 1965,
            color: '#8888cc',
            data: percent,
        },
        {
            name: 'Average',
            showInLegend: true,
            pointStart: 1965,
            color: '#66666688',
            allowPointSelect: false,
            enableMouseTracking: false,
            marker: {
                enabled: false
            },
            data: averages
        }],
    });
};

function updateAllData(songs, matches) {
    // matches is an array of [show, length]
    combo_store.current_songs = songs;
    // sort by length and store
    matches.sort((a, b) => (a[0].date > b[0].date ? 1 : -1));
    combo_store.sorted_by_date = [];
    for(var single_match of matches) {
        var link = convertToLink(convertDate(single_match[0].date), `show-${single_match[0].id}`);
        combo_store.sorted_by_date.push([link, 'TBD']);
    }
    
    matches.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    combo_store.sorted_by_length = [];
    for(var single_match of matches) {
        if(single_match[1] != 0) {
            var link = convertToLink(convertDate(single_match[0].date), `show-${single_match[0].id}`);
            combo_store.sorted_by_length.push([link, convertTime(single_match[1])]);
        }
    }
    // update charts
    updateComboPlayed(matches);
    // update all tables
    updateComboTable('combo-longest-versions', combo_store.sorted_by_length.slice(0, TABLE_ENTRIES));
    updateComboTable('combo-shortest-versions', combo_store.sorted_by_length.slice(-TABLE_ENTRIES).reverse());
    updateComboTable('combo-first-played', combo_store.sorted_by_date.slice(0, TABLE_ENTRIES));
    updateComboTable('combo-last-played', combo_store.sorted_by_date.slice(-TABLE_ENTRIES).reverse());
};

function updateWithSandwich(song_id, allow_set_split) {
};

function updateAllowSongsBetween(song_ids, allow_set_split) {
};

function updateNoSongsBetween(song_ids) {
    var matches = [];
    for(var single_show of store.shows) {
        var song_index = 0;
        var total_length = 0;
        for(var single_song of single_show.getAllSongs()) {
            // looking for the first song?
            if(song_index == 0) {
                // found a match? Move to next songs
                if(single_song.song == song_ids[0]) {
                    song_index += 1;
                    if(single_song.seconds != 0) {
                        total_length += single_song.seconds;
                    } else {
                        total_length = -5000;
                    }
                }
            } else {
                // no song between allowed, so we must have a match
                if(single_song.song != song_ids[song_index]) {
                    // this means we have failed, so break this loop
                    break;
                } else {
                    // grab length
                    if(single_song.seconds != 0) {
                        total_length += single_song.seconds;
                    } else {
                        total_length = -5000;
                    }
                    // otherwise, onto next song
                    song_index += 1;
                    // have we done all songs?
                    if(song_index == song_ids.length) {
                        // yes, add this show - and the index, and break the loop
                        if(total_length < 0) {
                            total_length = 0;
                        }
                        matches.push([single_show, total_length]);
                        // move on to next show
                        break;
                    }
                }
            }
        }
    }
    updateAllData(songs, matches);
};

function updateComboTab() {
    // actually perform the search
    var songs = [document.getElementById('combo-input1').value,
                 document.getElementById('combo-input2').value,
                 document.getElementById('combo-input3').value];
    // remove all empty strings
    songs = songs.filter((text) => text != '');

    // TODO: validate these songs or show an error

    // turn songs into indexes
    var song_ids = [];
    for(var single_song of songs) {
        song_ids.push(getIndexOfSong(single_song));
    }

    var allow_songs_inbetween = document.getElementById('combo-between-songs-check').checked;
    if(songs.length == 1) {
        updateWithSandwich(song_ids[0]);
    }
    if(allow_songs_inbetween == true) {
        updateAllowSongsBetween(song_ids);
    } else {
        updateNoSongsBetween(song_ids);
    }
};

function comboDefaultChanged() {
    var selected = parseInt(document.getElementById('combo-default').value);
    var songs_selected = [];
    switch(selected) {
        case 1:
            // User switched back to "custom", probably do nothing?
            break;
        case 2:
            songs_selected = ['Scarlet Begonias', 'Fire On The Mountain'];
            break;
        case 3:
            songs_selected = ['China Cat Sunflower', 'I Know You Rider'];
            break;
        case 4:
            songs_selected = ['Help On The Way', 'Slipknot!', "Franklin's Tower"];
            break;
        case 5:
            songs_selected = ['Playing In The Band'];
            break;
        case 6:
            songs_selected = ['Dark Star'];
            break;
        case 7:
            songs_selected = ['The Other One'];
            break;
    }
    if(songs_selected.length == 0) {
        return;
    }
    // place the songs selected into the input boxes
    document.getElementById('combo-input1').value = songs_selected[0];
    if(songs_selected.length > 1) {
        document.getElementById('combo-input2').value = songs_selected[1];
    } else {
        document.getElementById('combo-input2').value = '';
    }
    if(songs_selected.length > 2) {
        document.getElementById('combo-input3').value = songs_selected[2];
    } else {
        document.getElementById('combo-input3').value = '';
    }
    // if only one selected, then it must be a sandwich
    if(songs_selected.length == 1) {
        document.getElementById('combo-between-songs-check').checked = true;
    } else {
        document.getElementById('combo-between-songs-check').checked = false;
    }
    updateComboTab();
};

function popOutComboLongest() {
};

function popOutComboShortest() {
};

function popOutComboFirst() {
};

function popOutComboLast() {
};

function popOutComboPlayed() {
};

function popOutComboAverage() {
};

function initComboTab(song_title) {
    // setup callbacks
    document.getElementById('pop-combo-longest').addEventListener('click', popOutComboLongest);
    document.getElementById('pop-combo-shortest').addEventListener('click', popOutComboShortest);
    document.getElementById('pop-combo-first').addEventListener('click', popOutComboFirst);
    document.getElementById('pop-combo-last').addEventListener('click', popOutComboLast);
    // then charts
    document.getElementById('pop-combo-played').addEventListener('click', popOutComboPlayed);
    document.getElementById('pop-combo-average').addEventListener('click', popOutComboAverage);
    // and then the form callbacks
    document.getElementById('combo-default').addEventListener('change', comboDefaultChanged)
};
