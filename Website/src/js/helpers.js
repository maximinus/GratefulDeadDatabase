// common helpers to extract data from data, change data, ask questions and so
// this is used by all display code

// helper functions for pulling data from the db

function getShowFromDate(show_date) {
    // TODO: convert into what the date should be
    // remove by adding real date to show
    console.log('TODO');
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
}

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

function displayPopOut(title, data) {
    var table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setSimpleTablePopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = title;
    // display the modal
    $('#table-dialog').modal();
};
