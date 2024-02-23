// display a venue

class VenueStorage {
    constructor() {
        this.current_venue = null;
        this.is_setup = false;
    };
};

// can't call this now as store may or may not be setup
let venue_store = new ShowStorage();

function updateVenueDetails(single_venue, all_shows) {
    // get the venue
    let shows_total_text = '';
    if(all_shows.length == 1) {
        shows_total_text = `There was 1 show played at ${single_venue.venue}, on ${convertDate(all_shows[0].date)}.`;
    } else {
        let dates = `${convertDate(all_shows[all_shows.length - 1].date)} to ${convertDate(all_shows[0].date)}`;
        shows_total_text = `There were ${all_shows.length} shows played at ${single_venue.venue}, from ${dates}.`;
    }
    let data = {'venue-name': single_venue.getVenueName(),
                'venue-title': single_venue.venue,
                'latitude': single_venue.latitude.toString(),
                'longitude': single_venue.longitude.toString(),
                'link': getGoogleMapsLink(single_venue),
                'total': shows_total_text};
    
    let template = document.getElementById('venue-info-template').innerHTML;
    let new_html = Mustache.render(template, data);
    document.getElementById('venue-title-render').innerHTML = new_html;
};

function updateShowsList(all_shows) {
    // go through all shows and put into year buckets
    let all_years = {};
    for(let single_show of all_shows) {
        let show_year = single_show.js_date.getFullYear();
        if(show_year in all_years) {
            all_years[show_year].push(single_show);
        } else {
            all_years[show_year] = [single_show];
        }
    }
    // sort buckets into a list of the years
    let years_sorted = [];
    for(let key in all_years) {
        years_sorted.push([key, all_years[key]]);
    }
    all_shows.sort((a, b) => (a[0] < b[0]) ? 1 : -1);
    // finally, produce a full list
    let final = [];
    for(let year_data of years_sorted) {
        let show_data = [];
        for(let venue_show of year_data[1]) {
            let show_date = convertDate(venue_show.date);
            show_data.push(convertToHTMLLink(show_date, getShowUrl(getShowFromId(venue_show.id))));
        }
        final.push({'year': year_data[0].toString(), 'shows': show_data.toReversed().join(', ')});
    }
    let data = {'years': final};
    let template = document.getElementById('venue-shows-template').innerHTML;
    let new_html = Mustache.render(template, data);
    document.getElementById('venue-shows-render').innerHTML = new_html;
};

function updateVenueTab(venue) {
    venue_store.current_venue = venue;
    console.log(logger(`Updating venue: ${venue.venue}`));
    let all_shows = getAllShowsInVenue(venue);
    // sort shows by date
    all_shows.sort((a, b) => (a.date < b.date) ? 1 : -1);
    updateVenueDetails(venue, all_shows);
    updateShowsList(all_shows);
    db_store.tab_url[VENUES_TAB] = getVenueUrl(venue.venue);
};
