// display a venue

class VenueStorage {
    constructor() {
        this.current_venue = null;
    };
};

// can't call this now as store may or may not be setup
var venue_store = new ShowStorage();

function updateVenueDetails(venue_id, all_shows) {
    // get the venue
    var single_venue = getVenue(venue_id);
    var shows_total_text = '';
    if(all_shows.length == 1) {
        shows_total_text = `There was 1 show played at ${single_venue.venue}, on ${convertDate(all_shows[0].date)}.`;
    } else {
        var dates = `${convertDate(all_shows[all_shows.length - 1])} to ${convertDate(all_shows[0].date)}`;
        shows_total_text = `There were ${all_shows.length} shows played at ${single_venue.venue}, from ${dates}.`;
    }
    data = {'venue-name': single_venue.getVenueName(),
            'venue-title': single_venue.venue,
            'latitude': single_venue.latitude.toString(),
            'longitude': single_venue.longitude.toString(),
            'link': getGoogleMapsLink(single_venue),
            'total': shows_total_text};
    
    var template = document.getElementById('venue-info-template').innerHTML;
    var new_html = Mustache.render(template, data);
    document.getElementById('venue-title-render').innerHTML = new_html;
};

function updateShowsList(all_shows) {
    // go through all shows and put into year buckets
    var all_years = {};
    for(var single_show of all_shows) {
        var show_year = single_show.js_date.getFullYear();
        if(show_year in all_years) {
            all_years[show_year].push(single_show);
        } else {
            all_years[show_year] = [single_show];
        }
    }
    // sort buckets into a list of the years
    var years_sorted = [];
    for(var key in all_years) {
        years_sorted.push([key, all_years[key]]);
    }
    all_shows.sort((a, b) => (a[0] < b[0]) ? 1 : -1);
    // finally, produce a full list
    var final = [];
    for(var year_data of years_sorted) {
        var show_data = [];
        for(var venue_show of year_data[1]) {
            var show_date = convertDate(venue_show.date);
            show_data.push(convertToLink(show_date, `show-${venue_show.id}`));
        }
        final.push({'year': year_data[0].toString(), 'shows': show_data.reverse().join(', ')});
    }
    var data = {'years': final};
    var template = document.getElementById('venue-shows-template').innerHTML;
    var new_html = Mustache.render(template, data);
    document.getElementById('venue-shows-render').innerHTML = new_html;
};

function updateVenueTab(venue_id) {
    venue_store.current_venue = venue_id;
    var all_shows = getAllShowsInVenue(venue_id);
    // sort shows by date
    all_shows.sort((a, b) => (a.date < b.date) ? 1 : -1);
    updateVenueDetails(venue_id, all_shows);
    updateShowsList(all_shows);
};

function displayVenue(venue_index) {
    updateVenueTab(venue_index);
};