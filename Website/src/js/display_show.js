// display a show
current_shown_show = shows[1000];

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
//            * rarest ever
//            * rarest combos this year
//            * rarest combos ever
//            most similar shows
//            weather for the show
//            encore nearest in total
//            Venue information
//              Next time played / last time played / total played
//            longest songs
//            shortest songs

function getRarestSongs() {
    year_of_show = current_shown_show.year
    // first we need get all songs and remove duplicates
    // then get the total times played for each song
    // then sort and take the first X
    var all_songs = current_shown_show.getAllUniqueSongs();
    results = {};
    for(var song of all_songs) {
        results.append([song, song_map[song].length]);
    }
    for(show of get_all_shows_in_year(year_of_show)) {
        show.getAll
    }
    data.sort((a, b) => (a[1] < b[1]) ? 1 : -1);
    return data.slice(0, TABLE_ENTRIES);
};


function getRarestCombos() {
    year_of_show = current_shown_show.year
    // so for this, first we get all songs and remove dups
    // then we merge ones next to each other in pairs
    // so if we have A-B-C-D we get A-B, B-C, C-D. We split totally over set-breaks
    // then we go along each one and find instances of the first of the pair
    // we count these instances
    // sort by this count and then take the first X
    var all_sets = selected_show.getAllUniqueSongsBySet();
    var combos = []
    var year_combos = []
    for(var single_set of all_sets) {
        if(single_set.length < 2) {
            continue;
        }
        for(var i=0; i < single_set.length - 1; i++) {
            // holds scores for all time and this year
            combos.push([single_set[index], single_set[index+1], 0, 0]);
        }
    }
    // now we have a list of all combos
    // Iterate over all shows
    for(var single_show of shows) {
        // get all songs
        var all_songs = single_show.get_all_songs();
        if(all_songs.length < 2) {
            continue;
        }
        // iterate over from up to penultimate
        for(var i=0; i < single_set.length - 1; i++) {
            // over all combos
            for(var test_combo of combos) {
                if((test_combo[0] == single_set[index]) && (test_combo[1] == single_set[index+1])) {
                    // a match, count
                    test_combo[2] += 1;
                    // this year?
                    if(single_show.year == year_of_show) {
                        test_combo[3] += 1;
                    }
                }
            }
        }
    }
    combos.sort((a, b) => (a[2] < b[2]) ? 1 : -1);
    var all_time_combos = data.slice(0, TABLE_ENTRIES);
    combos.sort((a, b) => (a[3] < b[3]) ? 1 : -1);
    var this_year_combos = data.slice(0, TABLE_ENTRIES);
    return [all_time_combos. this_year_combos]
};


function getRarestCombosYear() {
    // as above, but only for this year
};


function renderWeatherChart(farenheit) {
    var temps = getRealTemps(weather[1000].temps);
    var feels = getRealTemps(weather[1000].feels);
    var chart = Highcharts.chart('show-weather-chart', {
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

function displayShow(show_date) {
    // demo: Show 31/12/78
    // in the div id of show-render
    // using the mustache div of show-template
    log("Rendering show");
    // the data should look like
    var example_data = {'show-date': '31st December 1978',
                        'show-venue': 'Winterland Arena, San Francisco, CA',
                        'sets': [{'set-name': 'Set 1', 'songs': "Sugar Magnolia > Scarlet Begonias > Fire on the Mountain / Me and My Uncle / Big River / Friend of the Devil / It's All Over Now / Stagger Lee / From the Heart of Me / Sunshine Daydream"},
                                 {'set-name': 'Set 2', 'songs': "Samson and Delilah / Ramble on Rose / I Need a Miracle / Terrapin Station > Playin' in the Band > Drums > Not Fade Away > Around and Around"},
                                 {'set-name': 'Set 3', 'songs': "Dark Star > The Other One > Dark Star > Wharf Rat > St. Stephen > Good Lovin'"},
                                 {'set-name': 'Encore 1', 'songs': "Casey Jones / Johnny B. Goode"},
                                 {'set-name': 'Encore 1', 'songs': "We Bid You Goodnight"}]};
    // get the template and render
    var template = document.getElementById('show-template').innerHTML;
    // clear out show-render and place the template
    var new_html = Mustache.render(template, example_data);
    document.getElementById('show-render').innerHTML = new_html;
    renderWeatherChart(true);
};
