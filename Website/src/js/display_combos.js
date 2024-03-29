// these need to be namespaced

class ComboStorage {
    constructor() {
        this.sorted_by_date = [];
        this.sorted_by_length = [];
        this.current_songs = [];
        this.matches = [];
        this.played_chart = null;
        this.average_chart = null;
    };
};

let combo_store = new ChartsStorage();

function updateComboTable(table_id, table_data) {
    let index = 0;
    let table = document.getElementById(table_id);
    for(let row of table.children) {
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

function updateComboPlayed(matches, chart_id) {
    // we need to calculate how many times played per year
    // this means for each year: (total_played / total_shows) * 100
    let years = new Array(YEARS_PLAYED);
    let percent = new Array(YEARS_PLAYED);
    let total_shows = new Array(YEARS_PLAYED);
    years.fill(0);
    percent.fill(0);
    total_shows.fill(0);

    for(let single_match of matches) {
        let year_index = getYear(single_match[0].date) - YEAR_OFFSET;
        years[year_index] += 1;
    }
    for(let single_show of store.shows) {
        let year_index = getYear(single_show.date) - YEAR_OFFSET;
        total_shows[year_index] += 1;
    }

    let total = 0;
    let total_years = 0;
    for(let i = 0; i < percent.length; i++) {
        if (years[i] == 0) {
            percent[i] = null;
        } else {
            percent[i] = (years[i] / total_shows[i]) * 100;
            total += years[i];
            total_years += 1;
        }
    }

    // calculate global average: sum of average / divided by years
    let averages = new Array(YEARS_PLAYED);
    let total_average = 0;
    if(total_years != 0) {
        total_average = Math.round((total / total_years) * 100.0) / 100.0;
    } else {
        total_average = 0;
    }
    averages.fill(total_average);

    let min_y_value = Math.floor(Math.min(...percent));
    let max_y_value = Math.ceil(Math.max(...percent));

    let chart = Highcharts.chart(chart_id, {
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
              return `Avg when played: ${total_average} %`;
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
    return chart;
};

function updateComboAverage(matches, chart_id) {
    if(combo_store.average_chart != null) {
        // delete old chart if needed
        combo_store.average_chart.destroy();
    }

    let total_played = new Array(YEARS_PLAYED);
    let total_lengths = new Array(YEARS_PLAYED);
    let averages = new Array(YEARS_PLAYED);
    total_played.fill(0);
    total_lengths.fill(0);
    averages.fill(0);
    let global_total = 0;
    let global_time = 0;
    for(let single_match of matches) {
        let year_index = getYear(single_match[0].date) - YEAR_OFFSET;
        total_played[year_index] += 1;
        total_lengths[year_index] += single_match[1];
        global_total += 1;
        global_time += single_match[1];
    }

    for(let i = 0; i < total_played.length; i++) {
        if (total_played[i] == 0) {
            averages[i] = null;
        } else {
            averages[i] = (total_lengths[i] / total_played[i]) / 60.0;
        }
    }

    // we need a set of data the same length as lengths
    let average_global = new Array(YEARS_PLAYED);
    let average_global_text = 'No matches found';
    if(global_total == 0) {
        average_global.fill(0);
    } else {
        let global_average = global_time / global_total;
        average_global.fill(global_average);
        average_global_text = convertTime(Math.round(global_average));
    }

    let min_y_value = Math.floor(Math.min(...averages));
    let max_y_value = Math.ceil(Math.max(...averages));
    let chart = Highcharts.chart(chart_id, {
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
              return `Avg: ${average_global_text}`;
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
            title: {text: 'Average Length / mins'},
            min: min_y_value,
            max: max_y_value,
            plotLines: [{
                color: '#666666aa',
                width: 2,
                value: averages
            }]
        },
        credits: {
            enabled: false
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2,
            formatter: function () {
                let time_length = convertTime(Math.round(this.y * 60.0));
                return `${this.x}: ${time_length}`;
            }
        },
        series: [{
            name: 'Average Length',
            showInLegend: false,
            pointStart: 1965,
            color: '#88cc88',
            data: averages
        },
        {
            name: 'Global Average',
            showInLegend: true,
            pointStart: 1965,
            color: '#66666688',
            allowPointSelect: false,
            enableMouseTracking: false,
            marker: {
                enabled: false
            },
            data: average_global
        }],
    });
    return chart;
};

function updateAllData(songs, matches) {
    // matches is an array of [show, length]
    combo_store.current_songs = songs;
    // sort by length and store
    matches.sort((a, b) => (a[0].date > b[0].date ? 1 : -1));
    combo_store.sorted_by_date = [];
    for(let single_match of matches) {
        // the url i
        let link = convertToHTMLLink(convertDate(single_match[0].date), getShowUrl(getShowFromId(single_match[0].id)));
        combo_store.sorted_by_date.push([link, '']);
    }
    
    matches.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    combo_store.sorted_by_length = [];
    for(let single_match of matches) {
        if(single_match[1] != 0) {
            let link = convertToHTMLLink(convertDate(single_match[0].date), getShowUrl(getShowFromId(single_match[0].id)));
            combo_store.sorted_by_length.push([link, convertTime(single_match[1])]);
        }
    }

    combo_store.matches = matches;

    // update charts
    if(combo_store.played_chart != null) {
        // delete old chart if needed
        combo_store.played_chart.destroy();
    }
    updateComboPlayed(matches, 'combo-played-chart');
    if(combo_store.average_chart != null) {
        // delete old chart if needed
        combo_store.average_chart.destroy();
    }
    updateComboAverage(matches, 'combo-length-chart');
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
    let matches = [];
    for(let single_show of store.shows) {
        let song_index = 0;
        let total_length = 0;
        for(let single_song of single_show.getAllSongs()) {
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
    let songs = [document.getElementById('combo-input1').value,
                 document.getElementById('combo-input2').value,
                 document.getElementById('combo-input3').value];
    // remove all empty strings
    songs = songs.filter((text) => text != '');

    // TODO: validate these songs or show an error

    // turn songs into indexes
    let song_ids = [];
    for(let single_song of songs) {
        song_ids.push(getIndexOfSong(single_song));
    }

    let allow_songs_inbetween = document.getElementById('combo-between-songs-check').checked;
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
    let selected = parseInt(document.getElementById('combo-default').value);
    let songs_selected = [];
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

function setComboPopOutTable(data, title) {
    resetTableScroll();
    let table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setLengthTablePopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = title;
    // display the modal
    $('#table-dialog').modal();
};

function popOutComboLongest() {
    setComboPopOutTable(combo_store.sorted_by_length, 'Longest Versions');
};

function popOutComboShortest() {
    setComboPopOutTable(combo_store.sorted_by_length.toReversed(), 'Shortest Versions');
};

function popOutComboFirst() {
    setComboPopOutTable(combo_store.sorted_by_date, 'First Versions');
};

function popOutComboLast() {
    setComboPopOutTable(combo_store.sorted_by_date.reverse(), 'Last Versions');
};

function popOutComboPlayed() {
    // clear current chart data
    let table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Played Per Year';
    // set chart
    updateComboPlayed(combo_store.matches, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function popOutComboAverage() {
    // clear current chart data
    let table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length Per Year';
    // set chart
    updateComboAverage(combo_store.matches, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function checkComboSongInput(event) {
    let target = event.target;
    // get the value, check it's a song
    let song_name = target.value.toLowerCase();

	for(let s of store.songs) {
		if(s.toLowerCase() == song_name) {
            // it's valid, set border and we are done
        }
    }
    // input was not valid, set border
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
    // when a song has been entered, check it exists
    //document.getElementById('combo-input1').input.addEventListener('input', checkComboSongInput);
};
