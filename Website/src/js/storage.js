// functions for local data storage
// i.e, here is where we have all database functions, the functions being loading and parsing

const DATE_FORMAT_MMDDYY = 0;
const DATE_FORMAT_DDMMYY = 1;
const DATE_FORMAT_YYMMDD = 2;

class Options {
    constructor() {
        this.date_format = DATE_FORMAT_MMDDYY;
    }
};

// this should be a class just to not pollute the environment
class Storage {
    constructor() {
        // this will load and so on
        this.loaded = false;
        this.shows = [];
        this.songs = [];
        this.venues = [];
        this.weather = {};
        // {song_title: [[show_id, length]...]} for all songs
        this.song_data = {};
        this.last_update = '';
        this.load_counter = 0;
        this.options = new Options();
    }
};

// the singleton for others to use
var store = new Storage();

class Weather {
    constructor(weather_date, temps, feels, precip) {
        this.date = weather_date;
        this.temps = temps;
        this.feels = feels;
        this.precip = precip;
    };

    getJsonData() {
        return JSON.stringify({'date':this.date, 'temps':this.temps, 'feels':this.feels});
    };

    static fromJsonData(data) {
        data = JSON.parse(data);
        return new Weather(data['date'], data['temps'], data['feels']);
    };
};

class Venue {
    constructor(venue_data) {
        // venue data is just 8 strings, in this order
        // 1: Venue ID as string
        // 2: Venue name
        // 3: College name
        // 4: City name
        // 5: State name (or regional name) - this will be a code like CA if a US state
        // 6: Country name
        // 7: Latitude
        // 8: Longitude
        if(venue_data.length != 8) {
            console.log('Error: Venue data missing data')
        }
        this.id = parseInt(venue_data[0]);
        this.venue = venue_data[1];
        this.college = venue_data[2];
        this.city = venue_data[3];
        this.state = venue_data[4];
        this.country = venue_data[5];
        this.latitude = parseFloat(venue_data[6]);
        this.longitude = parseFloat(venue_data[7]);
    };

    getVenueName() {
        // return full name of venue
        return `${this.venue}, ${this.city}, ${this.state}, ${this.country}`;
    };

    getJsonData() {
        return JSON.stringify({'id':this.id, 'venue':this.venue,
                               'college':this.college, 'city':this.city,
                               'state':this.state, 'country':this.country,
                               'latitude':this.latitude, 'longitude':this.longitude});
    };

    static fromJsonData(data) {
        data = JSON.parse(data);
        return new Venue([data.id.toString(), data.venue, data.college, data.city, data.state, data.country, data.latitude, data.longitude]);
    }
};

class Song {
    // a Song is stored in a ShowSet
    constructor(song_index, seconds, sequed) {
        this.song = song_index;
        this.seconds = seconds;
        this.sequed = sequed;
        if(song_index > 1000) {
            console.log('Error: ', song_index)
        }
    };

    getJsonData() {
        return JSON.stringify({'song':this.song, 'seconds':this.seconds, 'sequed': this.sequed});
    };

    static fromJsonData(data) {
        data = JSON.parse(data);
        return new Song(data.song, data.seconds, data.sequed);
    };
};

class SongData {
    // SongData is stored in a map of songs -> [SongData]
    // we need to store the ID of the show, not the date
    constructor(id, seconds) {
        this.show_id = id;
        this.seconds = seconds;
    };
};

class ShowSet {
    constructor(set_songs) {
        // set songs is a list of Song instances
        this.songs = set_songs;
    };

    getJsonData() {
        var json_songs = [];
        for(var song of this.songs) {
            json_songs.push(song.getJsonData());
        }
        return json_songs;
    };

    static fromJsonData(data) {
        var new_songs = [];
        // data is the array
        for(var song of data) {
            new_songs.push(Song.fromJsonData(song));
        }
        return new ShowSet(new_songs);
    };
};

class Show {
    constructor(show_sets, date, venue_id, show_id) {
        this.id = show_id;
        this.sets = show_sets;
        this.date = date
        // date is a number of days since 1950, so convert this
        this.js_date = getRealDate(date);
        this.venue = venue_id;
    };

    getJsonData() {
        var json_sets = [];
        for(var show_set of this.sets) {
            json_sets.push(show_set.getJsonData());
        }
        return {'date':this.date, 'sets':json_sets, 'id':this.id, 'venue':this.venue_id};
    };

    getAllSongs() {
        var all_songs = [];
        for(var i of this.sets) {
            for(var j of i.songs) {
                all_songs.push(j);
            }
        }
        return all_songs;
    };

    getLength() {
        // length of all songs, in seconds
        var total_time = 0;
        for(var i of this.sets) {
            for(var j of i.songs) {
                total_time += j.seconds;
            }
        }
        return total_time;
    };

    getAllUniqueSongs() {
        var all_songs = this.getAllSongs();
        // turn to set and then back to list
        return [...new Set(all_songs)];
    }

    getAllUniqueSongsBySet() {
        var sets_by_song = []
        for(var i of this.sets) {
            var songs_in_set = [];
            for(var j of i.songs) {
                songs_in_set.push(j);
            }
            sets_by_song.push([...new Set(songs_in_set)]);
        }
        return sets_by_song;
    };

    printShow() {
        for(var i of this.sets) {
            console.log('SET:');
            for(var j of i.songs) {
                if(j.song in songs) {
                    console.log(songs[j.song]);
                } else {
                    console.log(j.song);
                }
            }
            console.log('----');
        }
    }

    static fromJsonData(data) {
        var show_sets = [];
        for(var show_set of data.sets) {
            show_sets.push(ShowSet.fromJsonData(show_set));
        }
        return new Show(show_sets, data.date, data.venue_id, data.id);
    };
};

// helper functions

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

function storageAvailable() {
    // taken from 
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    var storage;
    try {
        storage = window.localStorage;
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
};

function checkFinish() {
    if(store.load_counter < FILES_TO_LOAD) {
        // not done yet
        return;
    }
    dataLoaded();
};

function dataLoaded() {
    // callback for when we have all data from network load
    // store for next time
    storeData();
    getSongData();
    log('Loading finished');
    store.loaded = true;
    updateTabs();
};

function parseSongs(binary_data) {
    // zero terminated strings stored in bytes
    store.songs = [];
    // there is no ID = 0 for songs, so we add a null string
    store.songs.push('');
    var next_title = '';
    for(var i = 0; i < binary_data.byteLength; i++) {
        if(binary_data[i] != 0) {
            next_title += String.fromCharCode(binary_data[i]);
        }
        else {
            store.songs.push(next_title);
            next_title = '';
            // a zero after the zero (a double termination) is the end
            if(binary_data[i+1] == 0) {
                i += 2;
                break;
            }
        }
    }
    var total_songs = store.songs.length;
    log(`Got ${store.songs.length} songs`);
    store.load_counter += 1;
    checkFinish();
};

function getSingleSet(binary_data, i) {
    // Since we can't store a zero, the song_index is the real index + 1
    // If a song seques, then add 32768 to the index
    // Each set ends with a zero
    // If a set STARTS with a zero, that means we are at the end of the show
    // (i.e. put a zero at the end so we get a double zero)
    var set_songs = [];
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of this set
            return [new ShowSet(set_songs), i + 2];
        }
        // we store song indexes with +1 so as not to hit the set marker
        // here we reset so that the index is correct
        var index = getWord(binary_data, i);
        i += 2;
        var length = getWord(binary_data, i);
        i += 2;
        if(length == 65535) {
            // 0 means "we don't have this"
            length = 0;
        }
        if(index > 32767) {
            index -= 32768;
            // sequed
            set_songs.push(new Song(index, length, true));
        } else {
            set_songs.push(new Song(index, length, false));
        }
    }
};

function getSets(binary_data, i) {
    // keep going until we hit the zero
    var new_sets = [];
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of these sets
            i += 2;
            return [new_sets, i];
        }
        var new_set_data = getSingleSet(binary_data, i);
        new_sets.push(new_set_data[0]);
        i = new_set_data[1];
    }
};

function getWord(binary, index) {
    low_byte = binary[index];
    high_byte = binary[index + 1];
    return (high_byte * 256) + low_byte;
};

function parseShows(binary_data) {
    // get the show data
    // the data format is unsigned 16-bit array
    // First 2 bytes are the date, represented as number of days since 1st Jan 1950
    // 3rd and 4th bytes are the venue id
    // 5th and 6th bytes are the show id
    // Then we have a set, constructed as a list of [song_index, length]
    store.shows = [];
    // All +2 are to move a word in the byte array
    var index = 0;
    while(true) {
        // traverse over each show until we meet 0
        if(getWord(binary_data, index) == 0) {
            break;
        }
        var date = getWord(binary_data, index);
        index += 2;
        var venue_id = getWord(binary_data, index);
        index += 2;
        var show_id = getWord(binary_data, index);
        index += 2;
        // traverse sets, waiting for a 0 byte
        var new_sets_data = getSets(binary_data, index);
        index = new_sets_data[1];
        // save the show
        store.shows.push(new Show(new_sets_data[0], date, venue_id, show_id));
    }
    // we cannot sort shows by ID as there may be missing values
    log(`Got ${store.shows.length} shows`);
    store.load_counter += 1;
    checkFinish();
};

function parseWeather(binary_data) {
    store.weather = {};
    // all 16 bit data
    // [show_id, [temp, feels_like] * 24], i.e. 49 * 2 = 98 bytes each
    // precipitation true/false is held as the high bit in feels_like
    var index = 0;
    while(true) {
        var show_id = getWord(binary_data, index);
        index += 2;
        var temps = [];
        var feels = [];
        var precip = [];
        for(var i = 0; i < 24; i++) {
            temps.push(getWord(binary_data, index));
            index += 2;
            feels_tmp = getWord(binary_data, index);
            index += 2;
            if(feels_tmp > 32768) {
                feels_temp -= 32768;
                precip.push(true);
            } else {
                precip.push(false);
            }
            feels.push(feels_tmp);
        }
        store.weather[show_id] =new Weather(show_id, temps, feels, precip);
        // should be a zero to verify the end
        if(getWord(binary_data, index) != 0) {
            log('Error parsing weather');
            return;
        }
        index +=2;
        // really at the end?
        if(getWord(binary_data, index) == 0) {
            log(`Got ${store.weather.size} days of weather`);
            store.load_counter += 1;
            checkFinish();
            return;
        }
    }
};

function parseVenues(binary_data) {
    store.venues = [];
    // just 8 strings, grab them all
    var index = 0;
    while(true) {
        var details = [];
        for (var i = 0; i < 8; i++) {
            next_title = '';
            while(binary_data[index] != 0) {
                next_title += String.fromCharCode(binary_data[index]);
                index += 1;
            }
            // move past zero marker
            index += 1;
            details.push(next_title);
        }
        store.venues.push(new Venue(details))
        // now we've collected them all, is there a zero at the end?
        if(binary_data[index] == 0) {
            log(`Got ${store.venues.length} venues`);
            store.load_counter += 1;
            checkFinish();
            return;
        }
    }
};

function storeData() {
    // store the contents of the songs and shows, if we can
    if(storageAvailable() == false) {
        return;
    }
    // create an array of shows
    var all_shows = [];
    for(var single_show of store.shows) {
        all_shows.push(single_show.getJsonData());
    }
    localStorage.setItem(SHOW_DATA, JSON.stringify(all_shows));
    // repeat for all songs
    localStorage.setItem(SONG_DATA, JSON.stringify(store.songs));
    // and venues
    localStorage.setItem(VENUE_DATA, JSON.stringify(store.venues));
    // finally, weather
    localStorage.setItem(WEATHER_DATA, JSON.stringify(store.weather));
    // now we need store the current date
    var current_date = new Date();
    localStorage.setItem(LAST_UPDATE, JSON.stringify(current_date));
    log('Data stored for future use');
};

function fetchBinaryData() {
    var song_request = new XMLHttpRequest();
    song_request.open('GET', SONGS_FILE, true);
    song_request.responseType = 'arraybuffer';
    song_request.send();

    song_request.onload = function(event) {
        var arrayBuffer = song_request.response;
        if(arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            parseSongs(byteArray);
        }
    }

    var show_request = new XMLHttpRequest();
    show_request.open('GET', SHOWS_FILE, true);
    show_request.responseType = 'arraybuffer';
    show_request.send();

    show_request.onload = function(event) {
        var arrayBuffer = show_request.response;
        if(arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            parseShows(byteArray);
        }
    }

    var venue_request = new XMLHttpRequest();
    venue_request.open('GET', VENUES_FILE, true);
    venue_request.responseType = 'arraybuffer';
    venue_request.send();

    venue_request.onload = function(event) {
        var arrayBuffer = venue_request.response;
        if(arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            parseVenues(byteArray);
        }
    }

    var weather_request = new XMLHttpRequest();
    weather_request.open('GET', WEATHER_FILE, true);
    weather_request.responseType = 'arraybuffer';
    weather_request.send();

    weather_request.onload = function(event) {
        var arrayBuffer = weather_request.response;
        if(arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            parseWeather(byteArray);
        }
    }
};

function updateRequired() {
    // last_update contains valid data
    var update_date = new Date(JSON.parse(store.last_update));
    var today = new Date();
    // calculate day difference between the 2 dates
    // yes, this code ignore timezones and so on, but it's good enough
    var delta_time = today - update_date;
    var delta_days = delta_time / (1000 * 60 * 60 * 24);
    if(delta_days >= NEXT_UPDATE) {
        return true;
    }
    return false;
};

function convertLocalData(loaded_songs, loaded_shows, loaded_venues, loaded_weather) {
    try {
        store.songs = JSON.parse(loaded_songs);
        store.venues = JSON.parse(loaded_venues);
        store.weather = JSON.parse(loaded_weather);
        // convert back to shows
        var json_shows = JSON.parse(loaded_shows);
        store.shows = [];
        for(var i of json_shows) {
            store.shows.push(Show.fromJsonData(i));
        }
    } catch(error) {
        log(`Error: ${error}`);
        log('Malformed data in local storage');
        return false;
    }
    return true;
};

function getFromLocalStorage() {
    // return true if this was possible
    // storage exists, we must check before this function
    // do we have our data here?
    var loaded_shows = localStorage.getItem(SHOW_DATA);
    var loaded_songs = localStorage.getItem(SONG_DATA);
    var loaded_venues = localStorage.getItem(VENUE_DATA);
    var loaded_weather = localStorage.getItem(WEATHER_DATA);
    store.last_update = localStorage.getItem(LAST_UPDATE);
    if(loaded_shows == null || loaded_songs == null || loaded_venues == null || store.last_update == null || loaded_weather == null) {
        log('No local data found');
        // we need to reload
        return false;
    }
    // check we don't need to refresh the data
    if(updateRequired() == true) {
        log('Local update needs refreshing')
        return false;
    }
    // we are not complete, we need to convert the data
    if(convertLocalData(loaded_songs, loaded_shows, loaded_venues, loaded_weather) == false) {
        return false;
    }
    log(`Got ${store.songs.length} songs`);
    log(`Got ${store.shows.length} shows`);
    log(`Got ${store.venues.length} venues`);
    log(`Got ${store.weather.size} days of weather`);
    return true;
};

function getSongData() {
    // we now have all the shows, so collate song data
    // this means we want to produce a map of song -> song instances
    // this is why they have a date and a time
    // we often search by song, this makes things a lot quicker
    log('Getting song data from database');
    store.song_data = {}
    for(var show of store.shows) {
        for(var i of show.getAllSongs()) {
            var song_title = store.songs[i.song];
            var new_song_data = new SongData(show.id, i.seconds);
            if(song_title in store.song_data) {
                store.song_data[song_title].push(new_song_data);
            } else {
                store.song_data[song_title] = [new_song_data];
            }
        }
    }
    log('Calculated song data');
};

function checkLocalStorage() {    
    if(storageAvailable() == false) {
        log('No local storage on this browser');
    }
    else {
        if(getFromLocalStorage() == true) {
            log('Loaded data from local storage');
            return true;
        }
    }
    return false;
};

function updateTabs() {
	// data has been loaded by this point
	setSongDropdown();
	updateVisualData(DEFAULT_SONG);
    displayShow(DEFAULT_SHOW);
    displayYear(DEFAULT_YEAR);
    displayVenue(DEFAULT_VENUE);
};

function getData() {
    if(FORCE_UPDATE == true) {
        log('Update forced');
    }
    else {
        if(checkLocalStorage() == true) {
            getSongData();
            store.loaded = true;
            updateTabs();
            return;
        }
    }
    log('Loading data from network');
    fetchBinaryData();
};
