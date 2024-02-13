import { Mustache } from 'mustache'

import { Show } from './database'
import * as api from './store_api'
import * as helpers from './helpers'


class VenueStorage {
    current_venue: any

    constructor() {
        this.current_venue = null;
    };
};

let venue_store = new VenueStorage();

function updateVenueDetails(venue_id: number, all_shows: any[]): void {
    // get the venue
    let single_venue = api.getVenue(venue_id)
    let shows_total_text = ''
    if(all_shows.length == 1) {
        shows_total_text = `There was 1 show played at ${single_venue.venue_name}, on ${helpers.convertDate(all_shows[0].date)}.`
    } else {
        let dates = `${helpers.convertDate(all_shows[all_shows.length - 1].date)} to ${helpers.convertDate(all_shows[0].date)}`
        shows_total_text = `There were ${all_shows.length} shows played at ${single_venue.venue_name}, from ${dates}.`
    }
    let data = {'venue-name': single_venue.getVenueName(),
                'venue-title': single_venue.venue_name,
                'latitude': single_venue.latitude.toString(),
                'longitude': single_venue.longitude.toString(),
                'link': single_venue.getGoogleMapsLink(),
                'total': shows_total_text}
    
    let template = document.getElementById('venue-info-template').innerHTML
    let new_html = Mustache.render(template, data)
    document.getElementById('venue-title-render').innerHTML = new_html
}

function updateShowsList(all_shows: Show[]): void {
    // go through all shows and put into year buckets
    let all_years = {}
    for(let single_show of all_shows) {
        let show_year = single_show.js_date.getFullYear()
        if(show_year in all_years) {
            all_years[show_year].push(single_show)
        } else {
            all_years[show_year] = [single_show]
        }
    }
    // sort buckets into a list of the years
    let years_sorted = []
    for(let key in all_years) {
        years_sorted.push([key, all_years[key]])
    }
    all_shows.sort((a, b) => (a[0] < b[0]) ? 1 : -1)
    // finally, produce a full list
    let final = []
    for(let year_data of years_sorted) {
        let show_data = []
        for(let venue_show of year_data[1]) {
            let show_date = helpers.convertDate(venue_show.date)
            show_data.push(helpers.convertToLink(show_date, `show-${venue_show.id}`))
        }
        final.push({'year': year_data[0].toString(), 'shows': show_data.reverse().join(', ')})
    }
    let data = {'years': final}
    let template = document.getElementById('venue-shows-template').innerHTML
    let new_html = Mustache.render(template, data)
    document.getElementById('venue-shows-render').innerHTML = new_html
}

export function updateVenueTab(venue_id: number) {
    venue_store.current_venue = venue_id
    let all_shows = api.getAllShowsInVenue(venue_id)
    // sort shows by date
    all_shows.sort((a, b) => (a.date < b.date) ? 1 : -1)
    updateVenueDetails(venue_id, all_shows)
    updateShowsList(all_shows)
}

export function displayVenue(venue_index: number) {
    updateVenueTab(venue_index)
}
