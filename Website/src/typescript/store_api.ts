import { logger } from "./logger";
import { SongData, store } from "./database";

import * as helpers from './helpers'
import * as gd from './constants'

// this file includes all of the functions that obtain data from the store
// it should have no functions relating to updating the front end

export function getShowFromDate(show_date) {
    let show_time = show_date.getTime();
    for(let single_show of store.shows) {
        if(show_time === single_show.js_date.getTime()) {
            return single_show;
        }
    }
    // no such date
    logger(`Error: No such date ${show_date}`);
    return store.shows[0];
};

export function getShowFromId(show_id) {
    for(let single_show of store.shows) {
        if(single_show.id == show_id) {
            return single_show;
        }
    }
    logger(`Error: No such show ID ${show_id}`);
    return store.shows[0];
};

export function getAllShowsInYear(year) {
    let all_shows_in_year = [];
    for(let single_show of store.shows) {
        if(single_show.js_date.getFullYear() == year) {
            all_shows_in_year.push(single_show);
        }
    }
    return all_shows_in_year;
};

export function getAllShowsInVenue(venue_id) {
    let all_shows_in_venue = [];
    for(let single_show of store.shows) {
        if( single_show.venue == venue_id) {
            all_shows_in_venue.push(single_show);
        }
    }
    return all_shows_in_venue;
};

export function getIndexOfSong(song_title) {
    // what's the index of song text x in the array songs?
    return store.songs.indexOf(song_title);
};

export function getVenue(venue_id) {
    // the venues are not sorted, so get this way
    for(let venue of store.venues) {
        if(venue_id == venue.id) {
            // return this
            return venue;
        }
    }
    // venue not found
    logger(`Error: no such venue ${venue_id}`);
    return store.venues[0];
};

export function getTotalPlayed(song: string) {
    return store.song_data[song].length
}

export function getFirstTimePlayed(song: string): SongData {
    return store.song_data[song][0]
}

export function getLastTimePlayed(song: string): SongData {
    let array_length = store.song_data[song].length
    return store.song_data[song][array_length - 1]
}

export function getAllTimesPlayed(song_title: string): [number[], number] {
    // create new array
    // returns an array of [[% of all songs per year], avg_per_year]
    let years = new Array(gd.YEARS_PLAYED)
    let percent = new Array(gd.YEARS_PLAYED)
    years.fill(0)
    percent.fill(0)
    let index = getIndexOfSong(song_title)
    for(let show of store.shows) {
        // how many matches
        let matches = show.getAllSongs().filter(x => x.song_index == index).length
        let year_index = helpers.getYear(show.date) - gd.YEAR_OFFSET
        if(matches != 0) {
            // get the year
            years[year_index] += 1
        }
        // count the shows
        percent[year_index] += 1
    }
    // avg per year is applied for all years that song was played
    // this means we add nulls for the years it was not played
    let avg_per_year = 0
    let total = 0
    let total_years = 0
    // recalculate the %
    for(let i = 0; i < percent.length; i++) {
        if (years[i] != 0) {
            // i.e. some shows that year
            total_years += 1
            total += years[i]
        }
        percent[i] = (years[i] / percent[i]) * 100
    }
    // reduce to 2 d.p. as well
    avg_per_year = Math.round((total / total_years) * 100.0) / 100.0
    return [percent, avg_per_year]
}
