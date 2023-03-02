// common helpers to extract data from data, change data, ask questions and so
// this is used by all display code

// helper functions for pulling data from the db

function getShowFromDate(show_date) {
    var show_time = show_date.getTime();
    for(var single_show of store.shows) {
        if(show_time === single_show.js_date.getTime()) {
            return single_show;
        }
    }
    // no such date
    log(`Error: No such date ${show_date}`);
    return store.shows[0];
};

function getAllShowsInYear(year) {
    var all_shows_in_year = [];
    for(var single_show of store.shows) {
        if(single_show.js_date.getFullYear() == year) {
            all_shows_in_year.push(single_show);
        }
    }
    return all_shows_in_year;
};

function getIndexOfSong(song_title) {
    // what's the index of song text x in the array songs?
    return store.songs.indexOf(song_title);
};

function getYear(days) {
    // get the year of a show date as an integer
    // the value sent is an int: number of days since 1st Jan 1950
    var new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    var year = new_date.getFullYear().toString().slice(2,4);
    return parseInt(year);
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

function convertDateLong(days) {
    // convert to date format "13th October 1973" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    var new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    // now convert to string and return
    var day = new_date.getDate();
    var month = new_date.toLocaleString('default', { month: 'long' });
    var year = new_date.getFullYear().toString();
    // calculate st/nd/rd/th
    var day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertDateStringFromDate(single_date) {
    var day = single_date.getDate();
    var month = single_date.toLocaleString('default', { month: 'long' });
    var year = single_date.getFullYear().toString();
    // calculate st/nd/rd/th
    var day_ending = nth(day);
    return `${day}${day_ending} ${month} ${year}`;
};

function convertToLink(string, url) {
    // convert given string to a link
    return `<a href="#gdd-${url}">${string}</a>`;
};

function getRealDate(days) {
    var new_date = new Date(1950, 0, 1);
    new_date.setDate(new_date.getDate() + days);
    return new_date;
};

function convertFromDate(show_date) {
    // do the opposite of above
    var new_date = new Date(1950, 0 ,1);
    var diff = show_date.getTime() - new_date.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
};

function getActualDay(show_date) {
    // given a real date, find out what day it really was
    return WEEKDAYS[show_date.getDay()];
};

function convertTime(total_time) {
    // convert to some time in format "4m 17s"
    // argument is an integer in seconds
    // return hours is they exist - this is for show length
    if(total_time > 3600) {
        var hours = Math.floor(total_time / 3600);
        total_time -= hours * 3600;
    } else {
        hours = 0;
    }
    var minutes = Math.floor(total_time / 60);
    var seconds = total_time - (minutes * 60);
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
        var txt = value.toString();
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
    var names = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    return names[index];
};

function getSongName(index) {
    // get the name of the song at this index, check for errors
    if(index >= store.songs.length) {
        return "Index too high";
    }
    return store.songs[index];
};

function getVenue(venue_id) {
    // the venues are not sorted, so get this way
    for(var venue of store.venues) {
        if(venue_id == venue.id) {
            // return this
            return venue;
        }
    }
    // venue not found
    return "Unknown Venue";
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
};

function log(message) {
    // log error messages etc to console
    if(LOGGING_ON == false) {
        return;
    }
    // get local time
    var local_time = new Date();
    var minutes = local_time.getMinutes().toString().padStart(2, '0');
    var time_string = `${local_time.getHours()}:${minutes}.${local_time.getSeconds()}`;
    console.log(`${time_string}: ${message}`);
};

function findAllSongsStartingWith(text) {
    // compare all as lowercase
    text = text.toLowerCase()
    var matches = [];
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
    var real_t = t - 1.0;
    // divide by 10
    real_t = real_t / 10.0;
    // subtract 50
    real_t -= 50.0;
    return real_t;
};

function convertDateOptionFormat(date_text) {
    // given this text input, does it match with a real date?
    // If so, return the date, else return null
    // check it also exists within the years
    var date_split = date_text.split('-');
    if(date_split.length != 3) {
        return null;
    };
    // check we can parse the ints
    if(!date_split.some(x => !Number.isInteger(x))) {
        // something wasn't an integer
        return null;
    }
    var date_array = date_split.map(x => parseInt(x));
    // assume DATE_FORMAT_DDMMYY
    var day = date_array[0];
    var month = date_array[1];
    var year = date_array[2];
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
    var this_extended_date = new Date(year + 1900, month - 1, day);
    if(this_extended_date.toString() != "Invalid Date") {
        // check in range
        var year_value = this_extended_date.getFullYear();
        if((year_value >= START_YEAR) && (year_value <= END_YEAR)) {
            return this_extended_date;
        }
    }
    // try the same, but don't add the 18
    var this_date = new Date(year, month - 1, day);
    if(this_date.toString() != "Invalid Date") {
        var year_value = this_date.getFullYear();
        if((year_value >= START_YEAR) && (year_value <= END_YEAR)) {
            return this_date;
        }
    }
    // no dates matched
    return null;
};

function resetTableScroll() {
    // TODO: for some reason this does not work
    //document.getElementById('table-entry-scroll').scrollTop = 0;
};

function displayPopOut(title, data) {
    resetTableScroll();
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setSimpleTablePopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = title;
    // display the modal
    $('#table-dialog').modal();
};
