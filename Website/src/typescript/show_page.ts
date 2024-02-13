import { $ } from 'jquery'
import { Mustache } from 'mustache'
import { Highcharts } from 'Highcharts'

import { logger } from './logger'
import { Show, store } from './database'
import * as gd from './constants'
import * as api from './store_api'
import * as helpers from './helpers'
import * as html_helpers from './html_helpers'

// build the show tab details

class ShowStorage {
    // a class to store all the data for this tab
    current_show: Show
    rarest_combos: [string, number][]
    rarest_combos_year: [string, number][]
    rarest_songs: [string, number][]
    rarest_songs_year: [string, number][]
    // this is the highchart instance
    weather_chart: any

    constructor() {
        this.current_show = null
        this.rarest_combos = []
        this.rarest_combos_year = []
        this.rarest_songs = []
        this.rarest_songs_year = []
        this.weather_chart = null
    }
}

// can't call this now as store may or may not be setup
let show_store = new ShowStorage();

function getRealTemps(temps: number[]) {
    // convert the temps from the actual values to the real data
    // from the original Python code to write the data:
    // Temp is done as:
    //   Take the temp and add 50.0              73.4  -> 113.4
    //   Multiply by 10 and drop the fraction:   113.4 -> 1134
    //   Add 1
    // so the reverse:
    let new_data = []
    for(let t of temps) {
        // if zero, then null
        // TODO: can we avoid storing null here?
        if(t == 0) {
            new_data.push(null)
        } else {
            new_data.push(helpers.convertTemp(t))
        }
    }
    return new_data
}

function getRealPrecipitation(precips: number[]): number[] {
    // convert precipitation
    // take the value, subtract 1 and divide by 10000
    let new_data = []
    for(let p of precips) {
        new_data.push(helpers.convertPrecip(p))
    }
    return new_data
}

function getRarestSongs(): [any[], any[]] {
    // TODO: add interface for this
    let year_of_show = show_store.current_show.js_date.getFullYear()
    // first we need get all songs and remove duplicates
    // then get the total times played for each song
    // then sort and take the first X
    let all_songs = show_store.current_show.getAllUniqueSongs();
    let results = [];
    let buckets: {[key:number]: number} = {}
    for(let song of all_songs) {
        let name = helpers.getSongName(song.song_index);
        results.push([helpers.convertToLink(name, `song-${name}`), store.song_data[name].length])
        buckets[song.song_index] = 0
    }
    for(let show of api.getAllShowsInYear(year_of_show)) {
        for(let played_song of show.getAllSongs()) {
            if(buckets.hasOwnProperty(played_song.song)) {
                buckets[played_song.song] += 1
            }
        }
    }
    // put buckets into a list, add names and sort
    let year_list = []
    for(let key in buckets) {
        let song_name = helpers.getSongName(parseInt(key))
        year_list.push([helpers.convertToLink(song_name, `song-${song_name}`), buckets[key]])
    }
    year_list.sort((a, b) => (a[1] > b[1]) ? 1 : -1)
    results.sort((a, b) => (a[1] > b[1]) ? 1 : -1)

    show_store.rarest_songs = results
    show_store.rarest_songs_year = year_list
    return [results.slice(0, gd.TABLE_ENTRIES), year_list.slice(0, gd.TABLE_ENTRIES)]
}

function getRarestCombos(): [any[], any[]] {
    // TODO: Interface this
    let year_of_show = show_store.current_show.js_date.getFullYear()
    // so for this, first we get all songs and remove dups
    // then we merge ones next to each other in pairs
    // so if we have A-B-C-D we get A-B, B-C, C-D. We split totally over set-breaks
    // then we go along each one and find instances of the first of the pair
    // we count these instances
    // sort by this count and then take the first X
    let all_sets = show_store.current_show.getAllUniqueSongsBySet()
    let combos = []
    for(let single_set of all_sets) {
        if(single_set.length < 2) {
            continue;
        }
        for(let i=0; i < single_set.length - 1; i++) {
            // holds scores for all time and this year
            combos.push([single_set[i].song_index, single_set[i+1].song_index, 0, 0])
        }
    }
    // now we have a list of all combos
    // Iterate over all shows
    for(let single_show of store.shows) {
        // get all songs
        let all_songs = single_show.getAllSongs()
        if(all_songs.length < 2) {
            continue;
        }
        // iterate over from up to penultimate
        for(let i=0; i < all_songs.length - 1; i++) {
            // over all combos
            for(let test_combo of combos) {
                if((test_combo[0] == all_songs[i].song_index) && (test_combo[1] == all_songs[i+1].song_index)) {
                    // a match, count
                    test_combo[2] += 1
                    // this year?
                    if(single_show.js_date.getFullYear() == year_of_show) {
                        test_combo[3] += 1
                    }
                }
            }
        }
    }

    // sort, build lists for popouts and return sliced data
    combos.sort((a, b) => (a[2] > b[2]) ? 1 : -1)
    show_store.rarest_combos = []
    for(let single_combo of combos) {
        // build links here as well
        let name1 = helpers.getSongName(single_combo[0])
        let name2 = helpers.getSongName(single_combo[1])
        let text1 = helpers.convertToLink(name1, `song-${name1}`)
        let text2 = helpers.convertToLink(name2, `song-${name2}`)
        show_store.rarest_combos.push([`${text1} / ${text2}`, single_combo[2]])
    }

    combos.sort((a, b) => (a[3] > b[3]) ? 1 : -1)
    show_store.rarest_combos_year = []
    for(let single_combo of combos) {
        let name1 = helpers.getSongName(single_combo[0])
        let name2 = helpers.getSongName(single_combo[1])
        let text1 = helpers.convertToLink(name1, `song-${name1}`)
        let text2 = helpers.convertToLink(name2, `song-${name2}`)
        show_store.rarest_combos_year.push([`${text1} / ${text2}`, single_combo[3]])
    }
    return [show_store.rarest_combos.slice(0, gd.TABLE_ENTRIES), show_store.rarest_combos_year.slice(0, gd.TABLE_ENTRIES)]
}

function showNoWeather() {
    document.getElementById('weather-results-title').innerHTML = 'No Weather Data'
    // clear any chart if it exists
    if(show_store.weather_chart != null) {
        show_store.weather_chart.destroy()
    }
}

function getWeatherTimeString(value: number): string {
    if(value == 24) {
        value = 0
    }
    let time_text = `${value} AM`
    if(value > 12) {
        time_text = `${value - 12} PM`
    }
    return time_text
};

function renderWeatherChart(chart_id: string): void {
    let show_id = show_store.current_show.id
    if((show_id in store.weather) === false) {
        showNoWeather()
        return
    } else {
        document.getElementById('weather-results-title').innerHTML = 'Weather'
    }
    let temps = getRealTemps(store.weather[show_id].temperatures)
    let feels = getRealTemps(store.weather[show_id].feels_like)
    let rain = getRealPrecipitation(store.weather[show_id].rainfall)

    // if the sum of the temps is zero, we also have no weather
    if(temps.reduce((a, b) => a + b, 0) == 0) {
        // also no weather
        showNoWeather()
        return;
    }

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
            itemStyle: {
              color: '#000000',
              fontWeight: 'bold',
              fontSize: 8,
            },
            borderWidth: 1
        },
        xAxis: {
            title: {
                text: 'Time'
            },
            labels: {
                formatter: function() {
                    let label = this.axis.defaultLabelFormatter.call(this);
                    if (parseInt(label) > 12) {
                        return `${label - 12}pm`
                    } else {
                        return `${label}am`
                    }
                }
            }
        },
        yAxis: [
            {
                title: {
                    text: 'Fahrenheit'
                },
                labels: {
                    formatter: function() {
                        let label = this.axis.defaultLabelFormatter.call(this)
                        return `${label}°`
                    }
                }
            },
            {
                title: {
                    text: 'Inchs of rainfall'
                },
                labels: {
                    formatter: function() {
                        let label = this.axis.defaultLabelFormatter.call(this)
                        return `${label}`
                    }
                },
                opposite: true
            }
        ],
        credits: {
            enabled: false
        },
        tooltip: {
            // only show 2 decimal places on tooltip
            valueDecimals: 2,
            formatter: function () {
                // different for rain, as there are 2 lines
                if(this.series.name == 'Rain') {
                    let start_time = getWeatherTimeString(this.x)
                    let end_time = getWeatherTimeString(this.x + 1)
                    if(this.y <= 0) {
                        return `From ${start_time}-${end_time}, there was no rain`
                    }
                    return `From ${start_time}-${end_time}, ${this.y} inches of rain`
                }
                let time_text = `${this.x} AM`
                if(this.x > 12) {
                    time_text = `${this.x} PM`
                }
                let celcius = (this.y - 32.0) * (5.0/9.0)
                return `At ${time_text}, it was ${this.y.toFixed(1)}°F / ${celcius.toFixed(1)}°C`
            },
        },
        series: [{
            name: 'Real Temp',
            showInLegend: true,
            pointStart: 0,
            color: '#88cc88',
            data: temps,
            yAxis: 0
        },
        {
            name: 'Feels Like',
            showInLegend: true,
            pointStart: 0,
            color: '#66666688',
            data: feels,
            yAxis: 0
        },
        {
            name: 'Rain',
            showInLegend: true,
            pointStart: 0,
            color: '#8888cc',
            data: rain,
            yAxis: 1
        }],
    });
    show_store.weather_chart = chart
}

function buildCombos(): void {
    let data = getRarestCombos()
    // already sliced to correct size
    let table_all_data = data[0]
    let table_year_data = data[1]
    // these entries are of the form [name,total]
    // scroll through the children of the table and vist them all
    let index = 0
    let table = document.getElementById('show-rarest-combos')
    for(let row of table.children) {
        if(index >= table_all_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            row.children[1].innerHTML = table_all_data[index][0]
            row.children[2].innerHTML = table_all_data[index][1].toString()
        }
        index += 1
    }
    // scroll through the children of the table and vist them all
    index = 0
    table = document.getElementById('show-rarest-combos-year')
    for(let row of table.children) {
        if(index >= table_year_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            row.children[1].innerHTML = table_year_data[index][0]
            row.children[2].innerHTML = table_year_data[index][1].toString()
        }
        index += 1
    }
}

function buildRarestSongs(): void {
    let data = getRarestSongs()
    // already sliced to correct size
    let table_all_data = data[0]
    let table_year_data = data[1]
    let index = 0
    let table = document.getElementById('show-rarest-songs')
    // data is in format [song-name, total]
    for(let row of table.children) {
        if(index >= table_all_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            row.children[1].innerHTML = table_all_data[index][0]
            row.children[2].innerHTML = table_all_data[index][1]
        }
        index += 1
    }
    index = 0
    table = document.getElementById('show-rarest-songs-year')
    // data is in format [song-name, total]
    for(let row of table.children) {
        if(index >= table_year_data.length) {
            row.children[1].innerHTML = ''
            row.children[2].innerHTML = ''
        } else {
            row.children[1].innerHTML = table_year_data[index][0]
            row.children[2].innerHTML = table_year_data[index][1]
        }
        index += 1
    }
}

function getShowRenderData(): {} {
    let show_sets = []
    for(let single_set of show_store.current_show.sets) {
        let new_set = []
        for(let single_song of single_set.songs) {
            let song_data = {}
            song_data['name'] = helpers.getSongName(single_song.song_index)
            if(single_song.length == 0) {
                song_data['time'] = '???'
            } else {
                song_data['time'] = helpers.convertTime(single_song.length)
            }
            if(single_song.seques_out === true) {
                song_data['trans'] = '>'
            } else {
                song_data['trans'] = '/'
            }
            new_set.push(song_data)
        }
        show_sets.push(new_set)
    }
    let sets_all_data = []
    let index = 1
    // TODO: explain
    // a bit complicated, hopefully not too crazy
    for(let single_set of show_sets) {
        let set_data = {'set-name': `Set ${index}`}
        let final_song = single_set.pop()
        if(single_set.length == 0) {
            set_data['songs'] = []
        } else {
            set_data['songs'] = single_set
        }
        set_data['final_song'] = final_song['name']
        set_data['final_time'] = final_song['time']
        sets_all_data.push(set_data)
        index += 1
    }
    let this_venue = api.getVenue(show_store.current_show.venue)
    return {'show-day': helpers.getActualDay(helpers.getRealDate(show_store.current_show.date)),
            'show-date': helpers.convertDateLong(show_store.current_show.date),
            'show-venue': this_venue.getVenueName(),
            'sets': sets_all_data}
}

function displayVenueInformation(): void {
    let this_show_date = show_store.current_show.date
    let this_venue = api.getVenue(show_store.current_show.venue)
    let venue_id = show_store.current_show.venue
    // work through shows. These ARE in order
    let total_shows = 0
    let total_before = 0
    for(let single_show of store.shows) {
        // look for the venue
        if(single_show.venue == venue_id) {
            total_shows += 1
            if(single_show.date == this_show_date) {
                total_before = total_shows
            }
        }
    }
    let total_text = ''
    if(total_shows == 1) {
        total_text = 'Only show played here'
    } else {
        total_text = `${total_shows} shows played here. This was the ${total_before}${helpers.nth(total_before)} time.`
    }
    // Now we can get all the data
    let venue_data = {'venue': helpers.convertToLink(this_venue.venue_name, `venue-${venue_id}`),
                      'city': this_venue.city,
                      'state': `${this_venue.state}, ${this_venue.country}`,
                      'location': `Lat: ${this_venue.latitude}, Long: ${this_venue.longitude}`,
                      'link': this_venue.getGoogleMapsLink(),
                      'total': total_text}
    let template = document.getElementById('venue-template').innerHTML
    // clear out show-render and place the template
    let new_html = Mustache.render(template, venue_data)
    document.getElementById('show-venue-information').innerHTML = new_html
}

function  popOutShowRarestCombos(): void {
    html_helpers.displayPopOut('Rarest Combos', show_store.rarest_combos)
}

function  popOutShowRarestCombosYear(): void {
    html_helpers.displayPopOut('Rarest Combos This Year', show_store.rarest_combos_year)
}

function  popOutShowRarestSongs(): void {
    html_helpers.displayPopOut('Rarest Songs', show_store.rarest_songs)
}

function  popOutShowRarestSongsYear(): void {
    html_helpers.displayPopOut('Rarest Songs This Year', show_store.rarest_songs_year)
}

function popOutWeather(): void {
    // clear current chart data
    let table = document.getElementById('pop-up-charts')
    table.replaceChildren()
    // set title
    document.getElementById('dialog-chart-title').innerHTML = 'Weather For the Day'
    // set chart
    renderWeatherChart('pop-up-charts')
    // display
    $('#chart-dialog').modal()
}

function addShowPopouts(): void {
    document.getElementById('pop-show-rarest-combos').addEventListener('click', popOutShowRarestCombos)
    document.getElementById('pop-show-rarest-combos-year').addEventListener('click', popOutShowRarestCombosYear)
    document.getElementById('pop-show-rarest-songs').addEventListener('click', popOutShowRarestSongs)
    document.getElementById('pop-show-rarest-songs-year').addEventListener('click', popOutShowRarestSongsYear)
    document.getElementById('pop-show-weather').addEventListener('click', popOutWeather)
}

export function updateShowTab(single_show: Show): void {
    // TODO: Fix the mess of 2 ways of updating
    show_store.current_show = single_show
    logger(`Rendering show ${show_store.current_show.js_date.toDateString()}`)
    // get the template and render
    let template = document.getElementById('show-template').innerHTML
    // clear out show-render and place the template
    let new_html = Mustache.render(template, getShowRenderData())
    document.getElementById('show-render').innerHTML = new_html
    renderWeatherChart('weather-chart')
    buildCombos()
    buildRarestSongs()
    displayVenueInformation()
}

function displayShow(show_index: number): void {
    updateShowTab(store.shows[show_index])
    addShowPopouts()
}
