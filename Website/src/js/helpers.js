// helper functions for transforming data or helping with the DOM

function getYear(days) {
    // get the year of a show date as an integer
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    let year = new_date.getFullYear().toString().slice(2,4);
    return parseInt(year);
};

function nth(n) { 
    return['st', 'nd', 'rd'][((n+90)%100-10)%10-1]||'th';
};

function convertDate(days) {
    // convert to date format "13th Oct 73" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    let day = new_date.getDate();
    let month = new_date.toLocaleString('default', { month: 'short' });
    let year = new_date.getFullYear().toString().slice(2,4);
    // calculate st/nd/rd/th
    let day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertDateLong(days) {
    // convert to date format "13th October 1973" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    let day = new_date.getDate();
    let month = new_date.toLocaleString('default', { month: 'long' });
    let year = new_date.getFullYear().toString();
    // calculate st/nd/rd/th
    let day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertDateStringFromDate(single_date) {
    let day = single_date.getDate();
    let month = single_date.toLocaleString('default', { month: 'long' });
    let year = single_date.getFullYear().toString();
    // calculate st/nd/rd/th
    let day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertToHTMLLink(text, url) {
    // The url is the link we point to
    // The text is the string that we display to the user
    return `<a href="${url}">${text}</a>`;
};

function getRealDate(days) {
    // force to UTC
    let new_date = new Date(Date.UTC(1950, 0, 1, 0, 0, 0, 0));
    new_date.setDate(new_date.getDate() + days);
    // adding days screws up the UTC
    let utc_date = new Date(Date.UTC(new_date.getYear(), new_date.getMonth(), new_date.getDate(), 0, 0, 0, 0));
    return utc_date;
};

function convertFromDate(show_date) {
    // do the opposite of above
    let new_date = new Date(Date.UTC(1950, 0, 1, 0, 0, 0, 0));
    let diff = show_date.getTime() - new_date.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
};

function getActualDay(show_date) {
    // given a real date, find out what day it really was
    return WEEKDAYS[show_date.getDay()];
};

function convertTime(total_time) {
    // convert to some time in format "4m 17s"
    // argument is an integer in seconds
    // return hours if they exist - this is for show length
    let hours = 0;
    if(total_time > 3600) {
        hours = Math.floor(total_time / 3600);
        total_time -= hours * 3600;
    }
    let minutes = Math.floor(total_time / 60);
    let seconds = total_time - (minutes * 60);
    if(hours != 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    if(minutes == 0) {
        return `${seconds}s`
    }
    return `${minutes}m ${seconds}s`;
};

function makePrettyNumber(value) {
    // return as a string, and of the form 1,000 if needed
    if(value > 999) {
        let txt = value.toString();
        return `${txt.slice(0, -3)},${txt.slice(-3)}`; 
    }
    // just as normal
    return value.toString();
};

function dayDays(delta) {
    if(delta < 2) {
        return `${delta} day`;
    }
    return `${delta} days`;
};

function getSetName(index) {
    let names = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    return names[index];
};

function getSongName(index) {
    // get the name of the song at this index, check for errors
    if(index >= store.songs.length) {
        return "Index too high";
    }
    return store.songs[index];
};

function songNametoSlug(song_name) {
    // song_name is a string, adjust
    return song_name.replaceAll(' ', '_');
};

function dateToSlug(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getYear() + 1900;
    if(day < 10) {
        day = `0${day}`;
    }
    if(month < 10) {
        month = `0${month}`;
    }
    return `${year}_${month}_${day}`;
};

function venueToSlug(venue_id) {
    let venue = getVenue(venue_id);
    return venue.venue.replaceAll(' ', '_'); 
};

function slugToText(slug) {
    return slug.replaceAll('_', ' ');
};

function slugToDate(slug) {
    // returns null if not possible
    let date_values = slug.split('_');
    if(date_values.length != 3) {
        return null;
    }
    for(let i=0; i<3; i++) {
        date_values[i] = parseInt(date_values[i]);
        if(isNaN(date_values[i])) {
            return null;
        }
    }
    // don't use the Date constructor
    let final_date = new Date(Date.UTC(date_values[0], date_values[1] - 1, date_values[2], 0, 0, 0, 0));
    if(isNaN(final_date)) {
        return null;
    }
    return final_date;
};

function dateDifference(startingDate, endingDate) {
    let startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
    if (!endingDate) {
        endingDate = new Date().toISOString().substr(0, 10);
    }
    let endDate = new Date(endingDate);
    if (startDate > endDate) {
        let swap = startDate;
        startDate = endDate;
        endDate = swap;
    }
    let startYear = startDate.getFullYear();
    let february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
    let daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let yearDiff = endDate.getFullYear() - startYear;
    let monthDiff = endDate.getMonth() - startDate.getMonth();
    if (monthDiff < 0) {
        yearDiff--;
        monthDiff += 12;
    }
    let dayDiff = endDate.getDate() - startDate.getDate();
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

function convertTemp(t) {
    // convert from the format in the binary
    // subtract 1
    let real_t = t - 1.0;
    // divide by 10
    real_t = real_t / 10.0;
    // subtract 50
    real_t -= 50.0;
    return real_t;
};

function convertPrecip(p) {
    let float_precip = (p - 1.0) / 10000.0;
    return float_precip;
};

function convertDateOptionFormat(date_text) {
    // given this text input, does it match with a real date?
    // If so, return the date, else return null
    // check it also exists within the years
    let date_split = date_text.split('-');
    if(date_split.length != 3) {
        return null;
    };
    // check we can parse the ints
    if(!date_split.some(x => !Number.isInteger(x))) {
        // something wasn't an integer
        return null;
    }
    let date_array = date_split.map(x => parseInt(x));
    // assume DATE_FORMAT_DDMMYY
    let day = date_array[0];
    let month = date_array[1];
    let year = date_array[2];
    if(store.options.date_format == DATE_FORMAT_MMDDYY) {
        day = date_array[1];
        month = date_array[0];
    }
    if(store.options.date_format == DATE_FORMAT_YYMMDD) {
        year = date_array[0];
        day = date_array[2];
    }
    // now try and get a date - default format is "MM/DD/YYYY"
    // we'll need to try with adding the "19" part ourself
    let this_extended_date = new Date(year + 1900, month - 1, day);
    if(this_extended_date.toString() != "Invalid Date") {
        // check in range
        let year_value = this_extended_date.getFullYear();
        if((year_value >= START_YEAR) && (year_value <= END_YEAR)) {
            return this_extended_date;
        }
    }
    // try the same, but don't add the 18
    let this_date = new Date(year, month - 1, day);
    if(this_date.toString() != "Invalid Date") {
        let year_value = this_date.getFullYear();
        if((year_value >= START_YEAR) && (year_value <= END_YEAR)) {
            return this_date;
        }
    }
    // no dates matched
    return null;
};

function replaceSpacesWithUnderscores(text) {
    return text.split(' ').join('_');
};

function getGoogleMapsLink(venue) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
};

function resetTableScroll() {
    // for some reason we need to set a timer. a known issue in many browsers
    window.setTimeout(function() {
        document.getElementById('table-entry-scroll').scrollTop = 0;
    }, 0);
};

function displayPopOut(title, data) {
    resetTableScroll();
    let table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setSimpleTablePopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = title;
    // display the modal
    $('#table-dialog').modal();
};

function hidePopOut() {
    $('#table-dialog').modal('hide');
};

function logger(message) {
    // get a text message for logging
    // get local time
    let local_time = new Date();
    let minutes = local_time.getMinutes().toString().padStart(2, '0');
    let time_string = `${local_time.getHours()}:${minutes}.${local_time.getSeconds()}`;
    return `${time_string}: ${message}`
};


function getShowUrl(show) {
    let show_date = show.js_date;
    let url_show_name = dateToSlug(show_date);
    // TODO: Include data to decide if show 1/2 etc
    return `#show:${url_show_name}:1`;
};

function getVenueUrl(venue_name) {
    let url_venue = replaceSpacesWithUnderscores(venue_name);
    return `#venue:${url_venue}`;
};

function getSongUrl(song_name) {
    let song_url_name = replaceSpacesWithUnderscores(song_name);
    return `#song:${song_url_name}`;
};

function getYearUrl(year) {
    return `#year:${year}`;
};
