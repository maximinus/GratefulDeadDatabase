import { $ } from 'jquery'
import { Mustache } from 'mustache'
import { Highcharts } from 'highcharts'

import * as gd from './constants'
import * as api from './store_api'
import * as helpers from './helpers'
import * as html_helpers from './html_helpers'
import { logger } from "./logger"
import { store } from './database'

// TODO: As this is some of the earliest code, it builds up HTML manually in parts
// Switch to using mustache


export class SongStorage {
    // TODO: fix these types
    // an array of arrays: each element being [link, time]
    sorted_by_length: [string, string][]
    played_before: any
    played_after: any
    current_song_title: string

    constructor() {
        this.sorted_by_length = []
        this.played_before = []
        this.played_after = []
        this.current_song_title = ''
    }
}

let song_store = new SongStorage();


function buildPlayed(song_title: string, element_name: string): void {
    let data = api.getAllTimesPlayed(song_title)
    let played = data[0]
    let averages = new Array(played.length)
    averages.fill(data[1]);
    let min_y_value = Math.floor(Math.min(...played))
    let max_y_value = Math.ceil(Math.max(...played))
    Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'right',
            verticalAlign: 'top',
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
    })
}

function getAverageLength(song_title: string): [number[], number] {
    // return an array of [[results_every_year], global_time]
    let averages = new Array(gd.YEARS_PLAYED)
    for(let i = 0; i < averages.length; i++) {
        averages[i] = [0,0]
    }
    let index = api.getIndexOfSong(song_title)
    // calculate the "global average"
    let times_played = 0;
    let total_time = 0;
    // add together the sum and total for all years
    for(let show of store.shows) {
        let year_index = helpers.getYear(show.date) - gd.YEAR_OFFSET;
        for(let song of show.getAllSongs()) {
            if(song.song_index == index) {
                // it's a match, add if we have timings
                if(song.length != 65535) {
                    averages[year_index][0] += 1
                    averages[year_index][1] += song.length
                    times_played += 1
                    total_time += song.length
                }
            }
        }
    }

    // calculate the global average
    let global_average = 0
    if (times_played != 0 && total_time != 0) {
        // we want average in minutes
        global_average = (total_time / times_played) / 60.0
    }

    // now we can calculate the averages
    let final_results = new Array(gd.YEARS_PLAYED)
    final_results.fill(0)
    for(let i = 0; i < averages.length; i++) {
        if(averages[i][0] != 0) {
            final_results[i] = averages[i][1] / averages[i][0]
            // give as minutes
            final_results[i] = final_results[i] / 60.0
        } else {
            final_results[i] = null
        }
    }
    return [final_results, global_average]
}

function buildLength(song_title: string, element_name: string): void {
    let all_data = getAverageLength(song_title)
    let lengths = all_data[0]
    let average = all_data[1]
    // we need a set of data the same length as lengths
    let average_global = new Array(lengths.length)
    average_global.fill(average)
    // roll back to seconds to get as time string
    // ensure conversion to integer otherwise the times go wrong
    let average_global_text = helpers.convertTime(Math.round(average * 60.0))
    // sort out the y axis range
    // we need to take the original and remove all nulls from it
    let values = lengths.filter(Number) 
    let min_y_value = Math.floor(Math.min(...values))
    let max_y_value = Math.ceil(Math.max(...values))
    Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'right',
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
                let time_length = helpers.convertTime(Math.round(this.y * 60.0));
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
    })
}

function getAveragePosition(song_title: string): [number[], number] {
    // oh boy!
    // For every set, we count from 0 (the first number) to (1 / total_songs) * index (starts at 0)
    // we add the set number (set 1 = 0, set 2 = 1 etc)
    // we calculate all results and place in buckets
    // then calculate the average of all the buckets
    let years = new Array(gd.YEARS_PLAYED);
    for(let i = 0; i < years.length; i++) {
        years[i] = []
    }
    let index = api.getIndexOfSong(song_title)
    for(let show of store.shows) {
        let year_index = helpers.getYear(show.date) - gd.YEAR_OFFSET
        let set_index = 1
        for(let single_set of show.sets) {
            // calculate rising offset
            let offset = 1.0 / single_set.songs.length;
            let set_place = set_index;
            for(let song of single_set.songs) {
                if(song.song_index == index) {
                    years[year_index].push(set_place)
                }
                set_place += offset
            }
            set_index += 1
        }
    }
    // now we have a list for every year, so calculate the average
    let final_results = new Array(gd.YEARS_PLAYED)
    let global_total = 0
    let global_length = 0
    for(let i = 0; i < years.length; i++) {
        if(years[i].length != 0) {
            // we have some data. Add up set positions and divide by total
            let year_sum = years[i].reduce((a, b) => a + b, 0)
            final_results[i] = year_sum / years[i].length
            global_total += year_sum
            global_length += years[i].length
        } else {
            final_results[i] = null
        }
    }
    let global_average = Math.round((global_total / global_length) * 100) / 100
    return [final_results, global_average]
}

function buildPosition(song_title: string, element_name: string) {
    let data = getAveragePosition(song_title)
    let positions = data[0]
    let average_pos = new Array(positions.length)
    for(let i = 0; i < positions.length; i++) {
        average_pos[i] = data[1]
    }
    Highcharts.chart(element_name, {
        chart: {
            type: 'line'
        },
        title: {
            text: null
        },
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'right',
            verticalAlign: 'top',
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
    })
}

function buildCharts(song_title: string): void {
    buildPlayed(song_title, 'played-chart')
    buildLength(song_title, 'length-chart')
    buildPosition(song_title, 'position-chart')
}

function buildLengthVersions(song_title: string) {
    // get the versions first
    // get the songs, and sort by length
    // create a new list with the 65535 and zero times stripped out
    let data = store.song_data[song_title].filter(x => (x.length != 65535 && x.length != 0))
    data.sort((a, b) => (a.length < b.length) ? 1 : -1)
    let length_versions = []
    for(let single_song of data) {
        let date_int = api.getShowFromId(single_song.show_id).date
        let date_text = helpers.convertDate(date_int)
        let link = helpers.convertToLink(date_text, `show-${single_song.show_id}`)
        let time_length = helpers.convertTime(single_song.length)
        length_versions.push([link, time_length])
    }
    // get the first 5
    let table_data = length_versions.slice(0, gd.TABLE_ENTRIES)
    // scroll through the children of the table and vist them all
    let index = 0
    let table = document.getElementById('longest-versions')
    for(let row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            
            row.children[1].innerHTML = table_data[index][0]
            row.children[2].innerHTML = table_data[index][1]
        }
        index += 1
    }
    
    // invert the list and go again
    length_versions.reverse();
    table_data = length_versions.slice(0, gd.TABLE_ENTRIES)
    index = 0
    table = document.getElementById('shortest-versions')
    for(let row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            row.children[1].innerHTML = table_data[index][0]
            row.children[2].innerHTML = table_data[index][1]
        }
        index += 1
    }
    // make sure default data is the right order
    length_versions.reverse()
    song_store.sorted_by_length = length_versions
}

function buildFirstLastVersions(song_title: string): void {
    let data = store.song_data[song_title]
    let table_data = data.slice(0, gd.TABLE_ENTRIES)
    // scroll through the children of the table and visit them all
    let index = 0;
    let last = api.getShowFromId(table_data[0].show_id).date
    let table = document.getElementById('first-played')
    for(let row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            let row_date = api.getShowFromId(table_data[index].show_id).date
            row.children[1].innerHTML = helpers.convertToLink(helpers.convertDate(row_date), `show-${table_data[index].show_id}`)
            // if 0, will be first version
            if(index != 0) {
                let delta = row_date - last;
                row.children[2].innerHTML = `<i>${helpers.dayDays(delta)} after first</i>`
            } else {
                row.children[2].innerHTML = '<i>First time played</i>'
            }
        }
        index += 1
    }
    // invert the list and go again
    data.reverse()
    table_data = data.slice(0, gd.TABLE_ENTRIES)
    index = 0
    last = api.getShowFromId(table_data[0].show_id).date
    table = document.getElementById('last-played')
    for(let row of table.children) {
        if(index >= table_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            let row_date = api.getShowFromId(table_data[index].show_id).date
            row.children[1].innerHTML = helpers.convertToLink(helpers.convertDate(row_date), `show-${table_data[index].show_id}`)
            if(index != 0) {
                let delta = last - row_date
                row.children[2].innerHTML = `<i>${helpers.dayDays(delta)} until next</i>`
            } else {
                row.children[2].innerHTML = '<i>Last time played</i>'
            }
        }
        index += 1
    }
    // preserve correct order
    data.reverse()
}

function buildBeforeAfterSongs(song_name: string): void {
    // be careful here, only the numbers are stored, and we have the name
    let song_title = api.getIndexOfSong(song_name)

    // we need to cycle over all the shows
    let songs_before = {}
    let songs_after = {}
    for(let show of store.shows) {
        let set_number = 0
        for(let single_set of show.sets) {
            let index = 0
            for(let single_song of single_set.songs) {
                // found a match?
                if(single_song.song_index == song_title) {
                    // get the song before, and the song
                    let song_before = ''
                    let song_after = ''
                    if(index == 0) {
                        song_before = `${helpers.getSetName(set_number)} set opener`
                    } else {
                        song_before = store.songs[single_set.songs[index - 1].song_index]
                    }
                    if(index < (single_set.songs.length - 1)) {
                        song_after = store.songs[single_set.songs[index + 1].song_index]
                    } else {
                        song_after = `${helpers.getSetName(set_number)} set closer`
                    }
                    // add to buckets
                    if(song_before in songs_before) {
                        songs_before[song_before] += 1
                    } else {
                        songs_before[song_before] = 1
                    }

                    if(song_after in songs_after) {
                        songs_after[song_after] += 1
                    } else {
                        songs_after[song_after] = 1
                    }
                }                
                index += 1
            }
            set_number += 1
        }
    }

    // all of the sets are in buckets, we need to sort them
    let sbefore = Object.keys(songs_before).map(function(key) {
        return [key, songs_before[key]]
    })

    // Sort the array based on the second element
    sbefore.sort(function(first, second) {
        return second[1] - first[1]
    })

    // save the data
    song_store.played_before = sbefore

    // Create a new array with only the first 5 items
    sbefore = sbefore.slice(0, gd.TABLE_ENTRIES)
    // add empty lines if we need to    
    while(sbefore.length <  gd.TABLE_ENTRIES) {
        sbefore.push(['', ''])
    }

    // repeat
    let safter = Object.keys(songs_after).map(function(key) {
        return [key, songs_after[key]]
    })
    // Sort the array based on the second element
    safter.sort(function(first, second) {
        return second[1] - first[1]
    })

    song_store.played_after = safter;

    // Create a new array with only the first 5 items
    safter = safter.slice(0, gd.TABLE_ENTRIES)
    // add empty lines if we need to
    while(safter.length <  gd.TABLE_ENTRIES) {
        safter.push(['', ''])
    }

    // now update the page
    let index = 0;
    let table = document.getElementById('songs-before')
    for(let row of table.children) {
        row.children[1].innerHTML = helpers.convertToLink(sbefore[index][0], `song-${sbefore[index][0]}`)
        row.children[2].innerHTML = sbefore[index][1]
        index += 1
    }

    index = 0
    table = document.getElementById('songs-after')
    for(let row of table.children) {
        row.children[1].innerHTML = helpers.convertToLink(safter[index][0], `song-${safter[index][0]}`)
        row.children[2].innerHTML = safter[index][1]
        index += 1
    }
}

export function setLengthTablePopupList(table_data: any, element: Node): void {
    let row_index = 1
    for(let song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        let row = document.createElement('tr')
        let header = document.createElement('th')
        header.setAttribute('scope', 'row')
        header.innerHTML = row_index.toString()
        let column1 = document.createElement('td')
        let column2 = document.createElement('td')
        column1.innerHTML = song[0]
        column2.innerHTML = song[1]
        row.appendChild(header)
        row.appendChild(column1)
        row.appendChild(column2)
        element.appendChild(row)
        row_index += 1
    }
}

function setOrderTablePopupList(table_data: any, element: Node, message: string, header_text: string): void {
    let row_index = 1
    let last = -1
    for(let song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        let row = document.createElement('tr')
        let header = document.createElement('th')
        header.setAttribute('scope', 'row')
        header.innerHTML = row_index.toString()
        let column1 = document.createElement('td')
        let column2 = document.createElement('td')
        let song_date = api.getShowFromId(song.show_id).date;
        column1.innerHTML = helpers.convertToLink(helpers.convertDate(song_date), `show-${song.show_id}`)
        if(last < 0) {
            column2.innerHTML = header_text
        } else {
            // calculate time difference
            let time_delta = Math.abs(song_date - last)
            column2.innerHTML = `${helpers.dayDays(time_delta)} ${message}`
        }
        last = song_date
        row.appendChild(header)
        row.appendChild(column1)
        row.appendChild(column2)
        element.appendChild(row)
        row_index += 1
    }
}

function setBeforeAfterPopupList(table_data: any, element: Node): void {
    let row_index = 1
    for(let song of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        let row = document.createElement('tr')
        let header = document.createElement('th')
        header.setAttribute('scope', 'row')
        header.innerHTML = row_index.toString()
        let column1 = document.createElement('td')
        let column2 = document.createElement('td')
        column1.innerHTML = helpers.convertToLink(song[0], `song-${song[0]}`)
        column2.innerHTML = song[1]
        row.appendChild(header)
        row.appendChild(column1)
        row.appendChild(column2)
        element.appendChild(row)
        row_index += 1
    }
}

function buildTables(song_title: string): void {
    buildLengthVersions(song_title)
    buildFirstLastVersions(song_title)
    buildBeforeAfterSongs(song_title)
};

function buildSongText(song_title: string): void {
    // pieces of information we need:
    // How many times played; First time, last time, length of this time
    // what song # it is, what show # played at
    // Example: Played 352 times, from 14th Apr 71 to 6th July 95 (24 years 204 days).<br />
    //          It was the 49th different song played and first played at the 672nd recorded show.
    let data = store.song_data[song_title]
    let total_times_played = data.length
    let first_played = api.getShowFromId(data[0].show_id)
    let last_played = api.getShowFromId(data[data.length - 1].show_id)

    // get the time delta
    let start_date = new Date(1950, 0, 1)
    start_date.setDate(start_date.getDate() + first_played.date)
    let end_date = new Date(1950, 0, 1)
    end_date.setDate(end_date.getDate() + last_played.date)
    let time_delta = helpers.dateDifference(start_date, end_date)

    // now we calculate shows
    let song_index = api.getIndexOfSong(song_title)
    let first = null
    let last = null
    let show_count = 0
    let uniques = []
    for(let show of store.shows) {
        if(first == null) {
            show_count += 1
        }
        for(let i of show.getAllSongs()) {
            if(!uniques.includes(i.song_index) && (first == null)) {
                uniques.push(i.song_index)
            }
            if(i.song_index == song_index) {
                // found the song
                if(first == null) {
                    first = show.date
                }
                last = show.date
            }
        }
    }

    // now we have all the data
    let render_data = {'song-title': song_title}
    if(total_times_played == 1) {
        let show_text1 = `Played once on ${helpers.convertDate(first)}.`
        let sn = uniques.length
        let show_text2 = `It was the ${sn}${helpers.nth(sn)} different song played and first played at the ${show_count}${helpers.nth(show_count)} recorded show.`
        render_data['first-text'] = show_text1
        render_data['second-text'] = show_text2
    } else {
        let show_text1 = `Played ${total_times_played} times, from ${helpers.convertDate(first)} to ${helpers.convertDate(last)} (${time_delta}).`
        let sn = uniques.length
        let show_text2 = `It was the ${sn}${helpers.nth(sn)} different song played and first played at the ${show_count}${helpers.nth(show_count)} recorded show.`
        render_data['first-text'] = show_text1
        render_data['second-text'] = show_text2
    }
    // set the text
    let template = document.getElementById('single-song-template').innerHTML
    // clear out show-render and place the template
    let new_html = Mustache.render(template, render_data)
    document.getElementById('single-song-render').innerHTML = new_html
}


function popOutFirst(): void {
    html_helpers.resetTableScroll()
    let data = store.song_data[song_store.current_song_title]
    let table = document.getElementById('table-entry')
    table.replaceChildren()
    setOrderTablePopupList(data, table, 'after previous', 'First time played')
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: First Versions`
    $('#table-dialog').modal()
}

function popOutLast(): void {
    html_helpers.resetTableScroll()
    let data = store.song_data[song_store.current_song_title];
    data.reverse()
    let table = document.getElementById('table-entry')
    table.replaceChildren()
    setOrderTablePopupList(data, table, 'until next', 'Last time played')
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: Last Versions`
    data.reverse()
    $('#table-dialog').modal()
}


function popOutBefore(): void {
    html_helpers.resetTableScroll();
    let data = song_store.played_before
    let table = document.getElementById('table-entry')
    table.replaceChildren()
    setBeforeAfterPopupList(data, table)
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: Songs Before`
    $('#table-dialog').modal()
}

function popOutAfter(): void {
    html_helpers.resetTableScroll()
    let data = song_store.played_after
    let table = document.getElementById('table-entry')
    table.replaceChildren()
    setBeforeAfterPopupList(data, table)
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: Songs After`
    $('#table-dialog').modal()
}

// Code to draw the pop-out charts
function popOutPlayed(): void {
    html_helpers.resetTableScroll()
    // clear current chart data
    let table = document.getElementById('pop-up-charts')
    table.replaceChildren()
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Played Per Year'
    // set chart
    buildPlayed(song_store.current_song_title, 'pop-up-charts')
    // display
    $('#chart-dialog').modal()
}

function popOutAverage(): void {
    html_helpers.resetTableScroll()
    // clear current chart data
    let table = document.getElementById('pop-up-charts')
    table.replaceChildren()
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Length Per Year'
    // set chart
    buildLength(song_store.current_song_title, 'pop-up-charts')
    // display
    $('#chart-dialog').modal()
}

function popOutPosition(): void {
    html_helpers.resetTableScroll()
    let table = document.getElementById('pop-up-charts')
    table.replaceChildren()
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Average Set Position'
    buildPosition(song_store.current_song_title, 'pop-up-charts')
    $('#chart-dialog').modal()
}

function popOutLongest(): void {
    html_helpers.resetTableScroll()
    let table = document.getElementById('table-entry')
    // clear any children of this element
    table.replaceChildren()
    setLengthTablePopupList(song_store.sorted_by_length, table)
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: Longest Versions`
    // display the modal
    $('#table-dialog').modal()
}

function popOutShortest(): void {
    html_helpers.resetTableScroll();
    // same as above function, just in reverse
    song_store.sorted_by_length.reverse();
    let table = document.getElementById('table-entry')
    // clear any children of this element
    table.replaceChildren()
    setLengthTablePopupList(song_store.sorted_by_length, table)
    document.getElementById('dialog-table-title').innerHTML = `${song_store.current_song_title}: Shortest Versions`
    // restore data
    song_store.sorted_by_length.reverse()
    $('#table-dialog').modal()
}

function updateSongData(song_title: string) {
    updateSongTab(song_title)
    // add the callbacks; first tables
    document.getElementById('pop-longest').addEventListener('click', popOutLongest)
    document.getElementById('pop-shortest').addEventListener('click', popOutShortest)
    document.getElementById('pop-first').addEventListener('click', popOutFirst)
    document.getElementById('pop-last').addEventListener('click', popOutLast)
    document.getElementById('pop-before').addEventListener('click', popOutBefore)
    document.getElementById('pop-after').addEventListener('click', popOutAfter)
    // then charts
    document.getElementById('pop-played').addEventListener('click', popOutPlayed)
    document.getElementById('pop-average').addEventListener('click', popOutAverage)
    document.getElementById('pop-position').addEventListener('click', popOutPosition)
}

export function updateSongTab(song_title: string) {
    song_store.current_song_title = song_title
    logger(`Updating charts and tables: ${song_title}`)
    buildTables(song_title)
    buildCharts(song_title)
    buildSongText(song_title)
}
