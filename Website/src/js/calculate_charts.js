// these need to be namespaced

class ChartsStorage {
    constructor() {
        this.sorted_by_length = [];
        this.played_before = [];
        this.played_after = [];
        this.current_song_title = '';
    };
};

var charts_store = new ChartsStorage();

// only code to render, update and display the song charts should be here
// that DOES include data collection specific to the charts.
// getAllTimesPlayed() is a good example of this

function getAllTimesPlayed(song_title) {
    // create new array
    var years = new Array(YEARS_PLAYED);
    var percent = new Array(YEARS_PLAYED);
    years.fill(0);
    percent.fill(0);
    var index = getIndexOfSong(song_title);
    for(var show of store.shows) {
        // how many matches
        var matches = show.getAllSongs().filter(x => x.song == index).length;
        var year_index = getYear(show.date) - YEAR_OFFSET;
        if(matches != 0) {
            // get the year
            years[year_index] += 1;
        }
        // count the shows
        percent[year_index] += 1;
    }
    // avg per year is applied for all years that song was played
    // this means we add nulls for the years it was not played
    var avg_per_year = 0
    var total = 0
    var total_years = 0
    // recalculate the %
    for(var i = 0; i < percent.length; i++) {
        if (years[i] != 0) {
            // i.e. some shows that year
            total_years += 1;
            total += years[i];
        }
        percent[i] = (years[i] / percent[i]) * 100;
        if (percent[i] == 0) {
            percent[i] = null;
        }
    }
    // reduce to 2 d.p. as well
    avg_per_year = Math.round((total / total_years) * 100.0) / 100.0;
    return [percent, avg_per_year];
};

function buildPlayed(song_title, element_name) {
    var data = getAllTimesPlayed(song_title);
    var played = data[0];
    var averages = new Array(played.length);
    averages.fill(data[1]);
    var min_y_value = Math.floor(Math.min.apply(Math, played));
    var max_y_value = Math.ceil(Math.max.apply(Math, played));
    var chart = Highcharts.chart(element_name, {
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
            data: played,
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

function getAverageLength(song_title) {
    // return an arrayy of [results, global_time]
    var averages = new Array(YEARS_PLAYED);
    for(var i = 0; i < averages.length; i++) {
        averages[i] = [0,0];
    }
    var index = getIndexOfSong(song_title);
    // calculate the "global average"
    var times_played = 0;
    var total_time = 0;
    // add together the sum and total for all years
    for(var show of store.shows) {
        var year_index = getYear(show.date) - YEAR_OFFSET;
        for(var song of show.getAllSongs()) {
            if(song.song == index) {
                // it's a match, add if we have timings
                if(song.seconds != 65535) {
                    averages[year_index][0] += 1;
                    averages[year_index][1] += song.seconds;
                    times_played += 1;
                    total_time += song.seconds;
                }
            }
        }
    }

    // calculate the global average
    var global_average = 0;
    if (times_played != 0 && total_time != 0) {
        // we want average in minutes
        global_average = (total_time / times_played) / 60.0;
    }

    // now we can calculate the averages
    var final_results = new Array(YEARS_PLAYED);
    final_results.fill(0);
    for(var i = 0; i < averages.length; i++) {
        if(averages[i][0] != 0) {
            final_results[i] = averages[i][1] / averages[i][0];
            // give as minutes
            final_results[i] = final_results[i] / 60.0;
        } else {
            final_results[i] = null;
        }
    }
    return [final_results, global_average];
};

function buildLength(song_title, element_name) {
    var all_data = getAverageLength(song_title);
    var lengths = all_data[0];
    var average = all_data[1];
    // we need a set of data the same length as lengths
    var average_global = new Array(lengths.length);
    average_global.fill(average);
    // roll back to seconds to get as time string
    // ensure conversion to integer otherwise the times go wrong
    var average_global_text = convertTime(Math.round(average * 60.0));
    // sort out the y axis range
    // we need to take the original and remove all nulls from it
    var values = lengths.filter(Number) 
    var min_y_value = Math.floor(Math.min.apply(Math, values));
    var max_y_value = Math.ceil(Math.max.apply(Math, values));
    var chart = Highcharts.chart(element_name, {
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
                value: average
            }]
        },
        credits: {
            enabled: false
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2,
            formatter: function () {
                var time_length = convertTime(Math.round(this.y * 60.0));
                return `${this.x}: ${time_length}`;
            }
        },
        series: [{
            name: 'Average Length',
            showInLegend: false,
            pointStart: 1965,
            color: '#88cc88',
            data: lengths
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
};

function getAveragePosition(song_title) {
    // oh boy!
    // For every set, we count from 0 (the first number) to (1 / total_songs) * index (starts at 0)
    // we add the set number (set 1 = 0, set 2 = 1 etc)
    // we calculate all results and place in buckets
    // then calculate the average of all the buckets
    var years = new Array(YEARS_PLAYED);
    for(var i = 0; i < years.length; i++) {
        years[i] = [];
    }
    var index = getIndexOfSong(song_title);
    for(var show of store.shows) {
        var year_index = getYear(show.date) - YEAR_OFFSET;
        var set_index = 1;
        for(var single_set of show.sets) {
            // calculate rising offset
            var offset = 1.0 / single_set.songs.length;
            var set_place = set_index;
            for(var song of single_set.songs) {
                if(song.song == index) {
                    years[year_index].push(set_place);
                }
                set_place += offset;
            }
            set_index += 1;
        }
    }
    // now we have a list for every year, so calculate the average
    var final_results = new Array(YEARS_PLAYED);
    var global_total = 0;
    var global_length = 0;
    for(var i = 0; i < years.length; i++) {
        if(years[i].length != 0) {
            // we have some data. Add up set positions and divide by total
            var year_sum = years[i].reduce((a, b) => a + b, 0)
            final_results[i] = year_sum / years[i].length;
            global_total += year_sum
            global_length += years[i].length;
        } else {
            final_results[i] = null;
        }
    }
    var global_average = Math.round((global_total / global_length) * 100) / 100;
    return [final_results, global_average];
}

function buildPosition(song_title, element_name) {
    var data = getAveragePosition(song_title);
    var positions = data[0];
    var average_pos = new Array(positions.length);
    for(var i = 0; i < positions.length; i++) {
        if (positions[i] == null) {
            average_pos[i] = null;
        } else {
            average_pos[i] = data[1];
        }
    }
    var chart = Highcharts.chart(element_name, {
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
              return `Avg: ${data[1]}`;
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
            title: {text: 'Average Set Position'}
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
            valueDecimals: 2,
        },
        series: [{
            name: 'Average Set Position',
            showInLegend: false,
            pointStart: 1965,
            color: '#cc8888',
            data: positions
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
            data: average_pos
        }],
    });
};

function buildCharts(song_title) {
    buildPlayed(song_title, 'played-chart');
    buildLength(song_title, 'length-chart');
    buildPosition(song_title, 'position-chart');
};

function buildLengthVersions(song_title) {
    // get the versions first
    // get the songs, and sort by length
    // create a new list with the 65535 and zero times stripped out
    var data = store.song_data[song_title].filter(x => (x.seconds != 65535 && x.seconds != 0));
    data.sort((a, b) => (a.seconds < b.seconds) ? 1 : -1);
    // get the first 5
    var table_data = data.slice(0, TABLE_ENTRIES);
    // scroll through the children of the table and vist them all
    var index = 0;
    var table = document.getElementById('longest-versions');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var date_int = getShowFromId(table_data[index].show_id).date
            var date_text = convertDate(date_int);
            row.children[1].innerHTML = convertToLink(date_text, `show-${table_data[index].show_id}`);
            row.children[2].innerHTML = convertTime(table_data[index].seconds);
        }
        index += 1;
    }
    charts_store.sorted_by_length = data;

    // invert the list and go again
    data.reverse()
    var table_data = data.slice(0, TABLE_ENTRIES);
    var index = 0;
    var table = document.getElementById('shortest-versions');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var date_int = getShowFromId(table_data[index].show_id).date
            var date_text = convertDate(date_int);
            row.children[1].innerHTML = convertToLink(date_text, `show-${table_data[index].show_id}`);
            row.children[2].innerHTML = convertTime(table_data[index].seconds);
        }
        index += 1;   
    }
    // make sure default data is the right order
    charts_store.sorted_by_length.reverse()
};

function buildFirstLastVersions(song_title) {
    var data = store.song_data[song_title];
    var table_data = data.slice(0, TABLE_ENTRIES);
    // scroll through the children of the table and visit them all
    var index = 0;
    var last = getShowFromId(table_data[0].show_id).date;
    var table = document.getElementById('first-played');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var row_date = getShowFromId(table_data[index].show_id).date;
            row.children[1].innerHTML = convertToLink(convertDate(row_date), `show-${table_data[index].show_id}`);
            if(index != 0) {
                var delta = row_date - last;
                row.children[2].innerHTML = `<i>${dayDays(delta)} after first</i>`;
            }
        }
        index += 1;
    }
    // invert the list and go again
    data.reverse()
    var table_data = data.slice(0, TABLE_ENTRIES);
    var index = 0;
    var last = getShowFromId(table_data[0].show_id).date;
    var table = document.getElementById('last-played');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            var row_date = getShowFromId(table_data[index].show_id).date;
            row.children[1].innerHTML = convertToLink(convertDate(row_date), `show-${table_data[index].show_id}`);
            if(index != 0) {
                var delta = last - row_date;
                row.children[2].innerHTML = `<i>${dayDays(delta)} before last</i>`;
            }
        }
        index += 1;
    }
    // preserve correct order
    data.reverse();
};


function buildBeforeAfterSongs(song_title) {
    // be careful here, only the numbers are stores, and we have the name
    song_title = getIndexOfSong(song_title);

    // we need to cycle over all the shows
    var songs_before = {};
    var songs_after = {};
    for(var show of store.shows) {
        var set_number = 0;
        for(var single_set of show.sets) {
            var index = 0;
            for(var single_song of single_set.songs) {
                // found a match?
                if(single_song.song == song_title) {
                    // get the song before, and the song
                    var song_before = '';
                    var song_after = '';
                    if(index == 0) {
                        song_before = `${getSetName(set_number)} set opener`;
                    } else {
                        song_before = store.songs[single_set.songs[index - 1].song];
                    }
                    if(index < (single_set.songs.length - 1)) {
                        song_after = store.songs[single_set.songs[index + 1].song];
                    } else {
                        song_after = `${getSetName(set_number)} set closer`;
                    }
                    // add to buckets
                    if(song_before in songs_before) {
                        songs_before[song_before] += 1;
                    } else {
                        songs_before[song_before] = 1;
                    }

                    if(song_after in songs_after) {
                        songs_after[song_after] += 1;
                    } else {
                        songs_after[song_after] = 1;
                    }
                }                
                index += 1;
            }
            set_number += 1;
        }
    }

    // all of the sets are in buckets, we need to sort them
    var sbefore = Object.keys(songs_before).map(function(key) {
        return [key, songs_before[key]];
    });

    // Sort the array based on the second element
    sbefore.sort(function(first, second) {
        return second[1] - first[1];
    });

    // save the data
    charts_store.played_before = sbefore;

    // Create a new array with only the first 5 items
    sbefore = sbefore.slice(0, TABLE_ENTRIES);
    // add empty lines if we need to    
    while(sbefore.length <  TABLE_ENTRIES) {
        sbefore.push(['', '']);
    }

    // repeat
    var safter = Object.keys(songs_after).map(function(key) {
        return [key, songs_after[key]];
    });
    // Sort the array based on the second element
    safter.sort(function(first, second) {
        return second[1] - first[1];
    });

    charts_store.played_after = safter;

    // Create a new array with only the first 5 items
    safter = safter.slice(0, TABLE_ENTRIES);
    // add empty lines if we need to
    while(safter.length <  TABLE_ENTRIES) {
        safter.push(['', '']);
    }

    // now update the page
    var index = 0;
    var table = document.getElementById('songs-before');
    for(var row of table.children) {
        row.children[1].innerHTML = convertToLink(sbefore[index][0], `song-${sbefore[index][0]}`);
        row.children[2].innerHTML = sbefore[index][1];
        index += 1;   
    }

    var index = 0;
    var table = document.getElementById('songs-after');
    for(var row of table.children) {
        row.children[1].innerHTML = convertToLink(safter[index][0], `song-${safter[index][0]}`);
        row.children[2].innerHTML = safter[index][1];
        index += 1;   
    }
};

function setLengthTablePopupList(table_data, element) {
    var row_index = 1
    for(var song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        var row = document.createElement('tr');
        var header = document.createElement('th');
        header.setAttribute('scope', 'row');
        header.innerHTML = row_index.toString();
        var column1 = document.createElement('td');
        var column2 = document.createElement('td');
        column1.innerHTML = convertDate(song.date);
        column2.innerHTML = convertTime(song.seconds);
        row.appendChild(header);
        row.appendChild(column1);
        row.appendChild(column2);
        element.appendChild(row);
        row_index += 1;
    }
};

function popOutLongest() {
    resetTableScroll();
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setLengthTablePopupList(charts_store.sorted_by_length, table);
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: Longest Versions`;
    // display the modal
    $('#table-dialog').modal();
};

function popOutShortest() {
    resetTableScroll();
    // same as above function, just in reverse
    charts_store.sorted_by_length.reverse();
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setLengthTablePopupList(charts_store.sorted_by_length, table);
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: Shortest Versions`;
    // restore data
    charts_store.sorted_by_length.reverse();
    $('#table-dialog').modal();
};

function setOrderTablePopupList(table_data, element, message) {
    var row_index = 1;
    var last = -1;
    for(song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        var row = document.createElement('tr');
        var header = document.createElement('th');
        header.setAttribute('scope', 'row');
        header.innerHTML = row_index.toString();
        var column1 = document.createElement('td');
        var column2 = document.createElement('td');
        column1.innerHTML = convertDate(song.date);
        if(last < 0) {
            column2.innerHTML = '';
            
        } else {
            // calculate time difference
            var time_delta = Math.abs(song.date - last);
            column2.innerHTML = `${dayDays(time_delta)} ${message}`;
        }
        last = song.date;
        row.appendChild(header);
        row.appendChild(column1);
        row.appendChild(column2);
        element.appendChild(row);
        row_index += 1;
    }
};

function setSimpleTablePopupList(table_data, element) {
    // just do the list with data[0] and data[1].toString() raw
    var row_index = 1;
    for(data of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        var row = document.createElement('tr');
        var header = document.createElement('th');
        header.setAttribute('scope', 'row');
        header.innerHTML = row_index.toString();
        var column1 = document.createElement('td');
        var column2 = document.createElement('td');
        column1.innerHTML = data[0];
        column2.innerHTML = data[1].toString();
        row.appendChild(header);
        row.appendChild(column1);
        row.appendChild(column2);
        element.appendChild(row);
        row_index += 1;
    }
};

function popOutFirst() {
    resetTableScroll();
    var data = store.song_data[charts_store.current_song_title];
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setOrderTablePopupList(data, table, 'after previous');
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: First Versions`;
    $('#table-dialog').modal();
};

function popOutLast() {
    resetTableScroll();
    var data = store.song_data[charts_store.current_song_title];
    data.reverse();
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setOrderTablePopupList(data, table, 'before next');
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: Last Versions`;
    data.reverse();
    $('#table-dialog').modal();
};

function setBeforeAfterPopupList(table_data, element) {
    var row_index = 1
    for(var song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        var row = document.createElement('tr');
        var header = document.createElement('th');
        header.setAttribute('scope', 'row');
        header.innerHTML = row_index.toString();
        var column1 = document.createElement('td');
        var column2 = document.createElement('td');
        column1.innerHTML = song[0];
        column2.innerHTML = song[1];
        row.appendChild(header);
        row.appendChild(column1);
        row.appendChild(column2);
        element.appendChild(row);
        row_index += 1;
    }
};

function popOutBefore() {
    resetTableScroll();
    var data = charts_store.played_before;
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setBeforeAfterPopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: Songs Before`;
    $('#table-dialog').modal();
};

function popOutAfter() {
    resetTableScroll();
    var data = charts_store.played_after;
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setBeforeAfterPopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = `${charts_store.current_song_title}: Songs After`;
    $('#table-dialog').modal();
};

// Code to draw the pop-out charts
function popOutPlayed() {
    resetTableScroll();
    // clear current chart data
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Played Per Year';
    // set chart
    buildPlayed(charts_store.current_song_title, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function popOutAverage() {
    resetTableScroll();
    // clear current chart data
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length';
    // set chart
    buildLength(charts_store.current_song_title, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function popOutPosition() {
    resetTableScroll();
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length';
    buildPosition(charts_store.current_song_title, 'pop-up-charts');
    $('#chart-dialog').modal();
};

function buildTables(song_title) {
    buildLengthVersions(song_title);
    buildFirstLastVersions(song_title);
    buildBeforeAfterSongs(song_title);
};

function buildSongText(song_title) {
    // pieces of information we need:
    // How many times played; First time, last time, length of this time
    // what song # it is, what show # played at
    // Example: Played 352 times, from 14th Apr 71 to 6th July 95 (24 years 204 days).<br />
    //          It was the 49th different song played and first played at the 672nd recorded show.
    var data = store.song_data[song_title];
    var total_times_played = data.length;
    var first_played = getShowFromId(data[0].show_id);
    var last_played = getShowFromId(data[data.length - 1].show_id);

    // get the time delta
    var start_date = new Date(1950, 0, 1);
    start_date.setDate(start_date.getDate() + first_played.date);
    var end_date = new Date(1950, 0, 1);
    end_date.setDate(end_date.getDate() + last_played.date);
    var time_delta = dateDifference(start_date, end_date);

    // now we calculate shows
    var song_index = getIndexOfSong(song_title);
    var first = null;
    var last = null;
    var show_count = 0;
    var uniques = [];
    for(var show of store.shows) {
        if(first == null) {
            show_count += 1;
        }
        for(var i of show.getAllSongs()) {
            if(!uniques.includes(i.song) && (first == null)) {
                uniques.push(i.song);
            }
            if(i.song == song_index) {
                // found the song
                if(first == null) {
                    first = show.date;
                }
                last = show.date;
            }
        }
    }

    // now we have all the data
    data = {'song-title': song_title}
    if(total_times_played == 1) {
        var show_text1 = `Played once on ${convertDate(first)}.`
        var sn = uniques.length;
        var show_text2 = `It was the ${sn}${nth(sn)} different song played and first played at the ${show_count}${nth(show_count)} recorded show.`;
        data['first-text'] = show_text1;
        data['second-text'] = show_text2;
    } else {
        var show_text1 = `Played ${total_times_played} times, from ${convertDate(first)} to ${convertDate(last)} (${time_delta}).`;
        var sn = uniques.length;
        var show_text2 = `It was the ${sn}${nth(sn)} different song played and first played at the ${show_count}${nth(show_count)} recorded show.`;
        data['first-text'] = show_text1;
        data['second-text'] = show_text2;
    }
    // set the text
    var template = document.getElementById('single-song-template').innerHTML;
    // clear out show-render and place the template
    var new_html = Mustache.render(template, data);
    document.getElementById('single-song-render').innerHTML = new_html;
};

function updateSongTab(song_title) {
    charts_store.current_song_title = song_title;
    log(`Updating charts and tables: ${song_title}`)
    buildTables(song_title);
    buildCharts(song_title);
    buildSongText(song_title);
};

function updateVisualData(song_title) {
    updateSongTab(song_title);
    // add the callbacks; first tables
    document.getElementById('pop-longest').addEventListener('click', popOutLongest);
    document.getElementById('pop-shortest').addEventListener('click', popOutShortest);
    document.getElementById('pop-first').addEventListener('click', popOutFirst);
    document.getElementById('pop-last').addEventListener('click', popOutLast);
    document.getElementById('pop-before').addEventListener('click', popOutBefore);
    document.getElementById('pop-after').addEventListener('click', popOutAfter);
    // then charts
    document.getElementById('pop-played').addEventListener('click', popOutPlayed);
    document.getElementById('pop-average').addEventListener('click', popOutAverage);
    document.getElementById('pop-position').addEventListener('click', popOutPosition);
};
