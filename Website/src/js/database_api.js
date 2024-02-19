function showDateExists() {
    let show_time = show_date.getTime();
    for(let single_show of store.shows) {
        if(show_time === single_show.js_date.getTime()) {
            return single_show;
        }
    }
    return null;    
};

function getShowFromDate(show_date) {
    let show_time = show_date.getTime();
    for(let single_show of store.shows) {
        if(show_time === single_show.js_date.getTime()) {
            return single_show;
        }
    }
    // no such date
    console.log(logger(`Error: No such date ${show_date}`));
    return store.shows[0];
};

function getShowFromId(show_id) {
    for(let single_show of store.shows) {
        if(single_show.id == show_id) {
            return single_show;
        }
    }
    console.log(logger(`Error: No such show ID ${show_id}`));
    return store.shows[0];
};

function getAllShowsInYear(year) {
    let all_shows_in_year = [];
    for(let single_show of store.shows) {
        if(single_show.js_date.getFullYear() == year) {
            all_shows_in_year.push(single_show);
        }
    }
    return all_shows_in_year;
};

function getAllShowsInVenue(venue) {
    let all_shows_in_venue = [];
    for(let single_show of store.shows) {
        if( single_show.venue == venue.id) {
            all_shows_in_venue.push(single_show);
        }
    }
    return all_shows_in_venue;
};

function getIndexOfSong(song_title) {
    // what's the index of song text x in the array songs?
    return store.songs.indexOf(song_title);
};

function findAllSongsStartingWith(text) {
    // compare all as lowercase
    text = text.toLowerCase()
    let matches = [];
    for(const [key, value] of Object.entries(song_counts)) {
        if(key.toLowerCase().startsWith(text)) {
            matches.push([key, value]);
        }
    }
    return matches;
};

function getVenueFromName(venue_name) {
    for(let venue of store.venues) {
        if(venue.venue == venue_name) {
            return venue;
        }
    }
    return null;
};

function getVenue(venue_id) {
    // the venues are not sorted, so get this way
    for(let venue of store.venues) {
        if(venue_id == venue.id) {
            // return this
            return venue;
        }
    }
    // venue not found
    console.log(logger(`Error: no such venue ${venue_id}`));
    return store.venues[0];
};
