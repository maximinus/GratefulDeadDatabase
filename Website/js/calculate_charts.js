const TABLE_ENTRIES = 6;
const YEAR_OFFSET = 65;
const YEARS_PLAYED = 31;

var sorted_by_length = [];
var played_before = [];
var played_after = [];
var current_song_title = '';

function getIndexOfSong(song_title) {
    return songs.indexOf(song_title);
};

function getYear(days) {
    // get the year of the show as an integer
    // the value sent is an int: number of days since 1st Jan 1950
    var new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    var year = new_date.getFullYear().toString().slice(2,4);
    return parseInt(year);
};

function getAllTimesPlayed(song_title) {
    // create new array
    var years = new Array(YEARS_PLAYED);
    var percent = new Array(YEARS_PLAYED);
    years.fill(0);
    percent.fill(0);
    var index = getIndexOfSong(song_title);
    for(var show of shows) {
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
    // recalculate the %
    for(var i = 0; i < percent.length; i++) {
        percent[i] = (years[i] / percent[i]) * 100;
    }
    return percent;
};

function buildPlayed(song_title, element_name) {
    data = getAllTimesPlayed(song_title);
    var chart = Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        xAxis: {
        },
        yAxis: {
            title: {text: '% Shows Played At'}
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
        series: [{
            name: '% shows played',
            showInLegend: false,
            pointStart: 1965,
            color: '#8888cc',
            data: data
        }],
    });
};

function getAverageLength(song_title) {
    var averages = new Array(YEARS_PLAYED);
    for(var i = 0; i < averages.length; i++) {
        averages[i] = [0,0];
    }
    var index = getIndexOfSong(song_title);
    for(var show of shows) {
        var year_index = getYear(show.date) - YEAR_OFFSET;
        for(var song of show.getAllSongs()) {
            if(song.song == index) {
                // it's a match, add if we have timings
                if(song.seconds != 65535) {
                    averages[year_index][0] += 1;
                    averages[year_index][1] += song.seconds;
                }
            }
        }
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
    return final_results;
};

function buildLength(song_title, element_name) {
    data = getAverageLength(song_title);
    var chart = Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        xAxis: {
        },
        yAxis: {
            title: {text: 'Average Length / mins'}
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
        series: [{
            name: 'Average Length / s',
            showInLegend: false,
            pointStart: 1965,
            color: '#88cc88',
            data: data
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
    for(var show of shows) {
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
    for(var i = 0; i < years.length; i++) {
        if(years[i].length != 0) {
            // we have some data. Add up set positions and divide by total
            final_results[i] = years[i].reduce((a, b) => a + b, 0) / years[i].length;
        } else {
            final_results[i] = null;
        }
    }
    return final_results;
}

function buildPosition(song_title, element_name) {
    data = getAveragePosition(song_title);
    var chart = Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
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
        series: [{
            name: 'Average Set Position',
            showInLegend: false,
            pointStart: 1965,
            color: '#cc8888',
            data: data
        }],
    });
};

function buildCharts(song_title) {
    buildPlayed(song_title, 'played-chart');
    buildLength(song_title, 'length-chart');
    buildPosition(song_title, 'position-chart');
};


function nth(n) { 
    return['st', 'nd', 'rd'][((n+90)%100-10)%10-1]||'th';
};

function convertDate(days) {
    // convert to date format "13th Oct 73" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    var new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    var day = new_date.getDate();
    var month = new_date.toLocaleString('default', { month: 'short' });
    var year = new_date.getFullYear().toString().slice(2,4);
    // calculate st/nd/rd/th
    var day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertTime(total_time) {
    // convert to some time in format "4m 17s"
    // argument is an integer in seconds
    var minutes = Math.floor(total_time / 60);
    var seconds = total_time - (minutes * 60);
    if(minutes == 0) {
        return `${seconds}s`
    }
    return `${minutes}m ${seconds}s`;
};

function buildLengthVersions(song_title) {
    // get the versions first
    // get the songs, and sort by length
    var data = song_data[song_title].filter(x => x.seconds != 65535);
    // creata new list with the 65535 stripped out
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
            row.children[1].innerHTML = convertDate(table_data[index].date);
            row.children[2].innerHTML = convertTime(table_data[index].seconds);
        }
        index += 1;
    }
    sorted_by_length = data;

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
            row.children[1].innerHTML = convertDate(table_data[index].date);
            row.children[2].innerHTML = convertTime(table_data[index].seconds);
        }
        index += 1;   
    }
    // make sure default data is the right order
    sorted_by_length.reverse()
};

function dayDays(delta) {
    if(delta < 2) {
        return `${delta} day`;
    }
    return `${delta} days`;
};

function buildFirstLastVersions(song_title) {
    var data = song_data[song_title];
    var table_data = data.slice(0, TABLE_ENTRIES);
    // TODO: fill up the empties if they don't exist
    // scroll through the children of the table and visit them all
    var index = 0;
    var last = table_data[0].date;;
    var table = document.getElementById('first-played');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = convertDate(table_data[index].date);
            if(index != 0) {
                var delta = table_data[index].date - last;
                row.children[2].innerHTML = `<i>${dayDays(delta)} after first</i>`;
            }
        }
        index += 1;
    }
    // invert the list and go again
    data.reverse()
    var table_data = data.slice(0, TABLE_ENTRIES);
    var index = 0;
    var last = table_data[0].date;
    var table = document.getElementById('last-played');
    for(var row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = '';
            row.children[2].innerHTML = '';
        } else {
            row.children[1].innerHTML = convertDate(table_data[index].date);
            if(index != 0) {
                var delta = last - table_data[index].date;
                row.children[2].innerHTML = `<i>${dayDays(delta)} before last</i>`;
            }
        }
        index += 1;
    }
    // keep
    data.reverse();
};

function getSetName(index) {
    var names = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    return names[index];
};

function buildBeforeAfterSongs(song_title) {
    // be careful here, only the numbers are stores, and we have the name
    song_title = getIndexOfSong(song_title);

    // we need to cycle over all the shows
    var songs_before = {};
    var songs_after = {};
    for(var show of shows) {
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
                        song_before = songs[single_set.songs[index - 1].song];
                    }
                    if(index < (single_set.songs.length - 1)) {
                        song_after = songs[single_set.songs[index + 1].song];
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
    played_before = sbefore;

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

    played_after = safter;

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
        row.children[1].innerHTML = sbefore[index][0];
        row.children[2].innerHTML = sbefore[index][1];
        index += 1;   
    }

    var index = 0;
    var table = document.getElementById('songs-after');
    for(var row of table.children) {
        row.children[1].innerHTML = safter[index][0];
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
}

function popOutLongest() {
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setLengthTablePopupList(sorted_by_length, table);
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: Longest Versions`;
    // display the modal
    $('#table-dialog').modal();
};

function popOutShortest() {
    // same as above function, just in reverse
    sorted_by_length.reverse();
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setLengthTablePopupList(sorted_by_length, table);
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: Shortest Versions`;
    // restore data
    sorted_by_length.reverse();
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

function popOutFirst() {
    var data = song_data[current_song_title];
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setOrderTablePopupList(data, table, 'after previous');
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: First Versions`;
    $('#table-dialog').modal();
};

function popOutLast() {
    var data = song_data[current_song_title];
    data.reverse();
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setOrderTablePopupList(data, table, 'before next');
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: Last Versions`;
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
    var data = played_before;
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setBeforeAfterPopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: Songs Before`;
    $('#table-dialog').modal();
};

function popOutAfter() {
    var data = played_after;
    var table = document.getElementById('table-entry');
    table.replaceChildren();
    setBeforeAfterPopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = `${current_song_title}: Songs After`;
    $('#table-dialog').modal();
};

// Code to draw the pop-out charts
function popOutPlayed() {
    // clear current chart data
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Played Per Year';
    // set chart
    buildPlayed(current_song_title, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function popOutAverage() {
    // clear current chart data
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length';
    // set chart
    buildLength(current_song_title, 'pop-up-charts');
    // display
    $('#chart-dialog').modal();
};

function popOutPosition() {
    var table = document.getElementById('pop-up-charts');
    table.replaceChildren();
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length';
    buildPosition(current_song_title, 'pop-up-charts');
    $('#chart-dialog').modal();
};

function buildTables(song_title) {
    buildLengthVersions(song_title);
    buildFirstLastVersions(song_title);
    buildBeforeAfterSongs(song_title);
};

function dateDifference(startingDate, endingDate) {
    var startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
    if (!endingDate) {
        endingDate = new Date().toISOString().substr(0, 10);
    }
    var endDate = new Date(endingDate);
    if (startDate > endDate) {
        var swap = startDate;
        startDate = endDate;
        endDate = swap;
    }
    var startYear = startDate.getFullYear();
    var february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
    var daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var yearDiff = endDate.getFullYear() - startYear;
    var monthDiff = endDate.getMonth() - startDate.getMonth();
    if (monthDiff < 0) {
        yearDiff--;
        monthDiff += 12;
    }
    var dayDiff = endDate.getDate() - startDate.getDate();
    if (dayDiff < 0) {
        if (monthDiff > 0) {
            monthDiff--;
        } else {
            yearDiff--;
            monthDiff = 11;
        }
        dayDiff += daysInMonth[startDate.getMonth()];
    }
    return yearDiff + ' years, ' + monthDiff + ' months ' + dayDiff + ' days';
}

function buildSongText(song_title) {
    // pieces of information we need:
    // How many times played; First time, last time, length of this time
    // what song # it is, what show # played at
    // Example: Played 352 times, from 14th Apr 71 to 6th July 95 (24 years 204 days).<br />
    //          It was the 49th different song played and first played at the 672nd recorded show.
    var data = song_data[song_title];
    var total_times_played = data.length;
    var first_played = data[0];
    var last_played = data[data.length - 1];
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
    for(var show of shows) {
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
    var final_text = '';
    if(total_times_played == 1) {
        var show_text1 = `Played once on ${convertDate(first)}.<br />`
        var sn = uniques.length;
        var show_text2 = `It was the ${sn}${nth(sn)} different song played and first played at the ${show_count}${nth(show_count)} recorded show.`;
        final_text = `${show_text1}${show_text2}`;
    } else {
        var show_text1 = `Played ${total_times_played} times, from ${convertDate(first)} to ${convertDate(last)} (${time_delta}).<br />`;
        var sn = uniques.length;
        var show_text2 = `It was the ${sn}${nth(sn)} different song played and first played at the ${show_count}${nth(show_count)} recorded show.`;
        final_text = `${show_text1}${show_text2}`;
    }
    // set the text
    document.getElementById('song-title').innerHTML = song_title;
    document.getElementById('song-detail-text').innerHTML = final_text;
};

function updateVisualData(song_title) {
    // this needs to wait until data is loaded
    current_song_title = song_title;
    log(`Updating charts and tables: ${song_title}`)
    buildTables(song_title);
    buildCharts(song_title);
    buildSongText(song_title);
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