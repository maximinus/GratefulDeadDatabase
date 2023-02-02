// functions for local data storage
// i.e, here is where we have all database functions, the functions being loading and parsing

// TODO: get date of file from web and compare with ours
//       Handle case where not enough data for tables
//       Update header text and info
//       Make text song input work

const SONGS_FILE = 'songs.bin';
const SHOWS_FILE = 'shows.bin';
const VENUES_FILE = 'data/venues.bin';
const WEATHER_FILE = 'data/weather.bin'
const FILES_TO_LOAD = 4;

const LOGGING_ON = true;

const SONG_DATA = 'songs';
const SHOW_DATA = 'shows';
const VENUE_DATA = 'venues';
const WEATHER_DATA = 'weather';
const LAST_UPDATE = 'update-data';

// used when debugging
const FORCE_UPDATE = true;

// how often to check the update, in number of days
const NEXT_UPDATE = 365;

const DEFAULT_SONG = 'Playing In The Band';

// these is global data seens by all
var shows = [];
var songs = [];
var venues = [];
var weather = [];
// song data is a hash map of song_title: [(date, length), ...]
var song_data = {};
var last_update = '';
var load_counter = 0;
var data_loaded = false;

// start with the class definitions we need

// define the data endpoints
// we need to convert to this data from local storage if need be
class Weather {
    // data is an array of # array of: [weather_id, [temp, feels_like] * 24] for all weather data
    // TODO: should be a date, so we can match with the show, not a weather id
    constructor(weather_date, temps, feels) {
        this.date = weather_date;
        this.temps = temps;
        this.feels = feels;
    };

    getJsonData() {
        return JSON.stringify({'date':this.date, 'temps':this.temps, 'feels':this.feels});
    };

    static fromJsonData(data) {
        data = JSON.parse(data);
        return new Weather(data['date'], data['temps'], data['feels']);
    };
}

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
}

class Song {
    // a Song is stored in a ShowSet
    constructor(song_index, seconds) {
        this.song = song_index;
        this.seconds = seconds;
        if(song_index > 1000) {
            console.log('Error: ', song_index)
        }
    };

    getJsonData() {
        return JSON.stringify({'song':this.song, 'seconds':this.seconds});
    };

    static fromJsonData(data) {
        data = JSON.parse(data);
        return new Song(data.song, data.seconds);
    };
};

class SongData {
    // SongData is stored in a map of songs -> [SongData]
    constructor(date, seconds) {
        this.date = date;
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
    constructor(show_sets, date) {
        this.sets = show_sets;
        this.date = date;
    };

    getJsonData() {
        var json_sets = [];
        for(var show_set of this.sets) {
            json_sets.push(show_set.getJsonData());
        }
        return {'date':this.date, 'sets':json_sets};
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
        return new Show(show_sets, data.date);
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
    if(load_counter < FILES_TO_LOAD) {
        // not done yet
        return;
    }
    dataLoaded();
};

function dataLoaded() {
    // callback for when we have all data from network load
    log('Loading finished');
    // store for next time
    storeData();
    getSongData();
    updateVisualData(DEFAULT_SONG);
    data_loaded = true;
};

function parseSongs(binary_data) {
    // zero terminated strings stored in bytes
    var strings = [];
    var next_title = '';
    for(var i = 0; i < binary_data.byteLength; i++) {
        if(binary_data[i] != 0) {
            next_title += String.fromCharCode(binary_data[i]);
        }
        else {
            strings.push(next_title);
            next_title = '';
            // a zero after the zero (a double termination) is the end
            if(binary_data[i+1] == 0) {
                i += 2;
                break;
            }
        }
    }
    var total_songs = strings.length;
    log(`Got ${total_songs} songs`);
    songs = strings;
    load_counter += 1;
    checkFinish();
};

function getSingleSet(binary_data, i) {
    var set_songs = [];
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of this set
            return [new ShowSet(set_songs), i + 2];
        }
        // we store song indexes with +1 so as not to hit the set marker
        // here we reset so that the index is correct
        var index = getWord(binary_data, i) - 1;
        i += 2;
        var length = getWord(binary_data, i);
        i += 2;
        set_songs.push(new Song(index, length));
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
    var new_shows = [];
    // All +2 are to move a word in the byte array
    var i = 0;
    while(true) {
        // traverse over each show until we meet 0
        if(getWord(binary_data, i) == 0) {
            break;
        }
        // get the date
        var date = getWord(binary_data, i);
        i += 2;
        // traverse sets, waiting for a 0 byte
        var new_sets_data = getSets(binary_data, i);
        i = new_sets_data[1];
        // save the show
        new_shows.push(new Show(new_sets_data[0], date));
    }

    log(`Got ${new_shows.length} shows`);
    shows = new_shows;
    load_counter += 1;
    checkFinish();
};

function parseWeather(binary_data) {
    weather = [];
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
        weather.push(new Weather(show_id, temps, feels, precip));
        // should be a zero to verify the end
        if(getWord(binary_data, index) != 0) {
            log('Error parsing weather');
            return;
        }
        index +=2;
        // really at the end?
        if(getWord(binary_data, index) == 0) {
            log(`Got ${weather.length} days of weather`);
            load_counter += 1;
            checkFinish();
            return;
        }
    }
};

function parseVenues(binary_data) {
    venues = [];
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
        venues.push(new Venue(details))
        // now we've collected them all, is there a zero at the end?
        if(binary_data[index] == 0) {
            log(`Got ${venues.length} venues`);
            load_counter += 1;
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
    for(var single_show of shows) {
        all_shows.push(single_show.getJsonData());
    }
    localStorage.setItem(SHOW_DATA, JSON.stringify(all_shows));
    // repeat for all songs
    localStorage.setItem(SONG_DATA, JSON.stringify(songs));
    // and venues
    localStorage.setItem(VENUE_DATA, JSON.stringify(venues));
    // finally, weather
    localStorage.setItem(WEATHER_DATA, JSON.stringify(weather));
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
    var update_date = new Date(JSON.parse(last_update));
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
        songs = JSON.parse(loaded_songs);
        venues = JSON.parse(loaded_venues);
        weather = JSON.parse(loaded_weather);
        // convert back to shows
        var json_shows = JSON.parse(loaded_shows);
        shows = [];
        for(var i of json_shows) {
            shows.push(Show.fromJsonData(i));
        }
        venues = JSON.parse(loaded_venues);
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
    last_update = localStorage.getItem(LAST_UPDATE);
    if(loaded_shows == null || loaded_songs == null || loaded_venues == null || last_update == null || loaded_weather == null) {
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
    log(`Got ${songs.length} songs`);
    log(`Got ${shows.length} shows`);
    log(`Got ${venues.length} venues`);
    log(`Got ${weather.length} days of weather`);
    return true;
};

function getSongData() {
    // we now have all the shows, so collate song data
    // this means we want to produce a map of song -> song instances
    // this is why they have a date and a time
    // we often search by song, this makes things a lot quicker
    song_data = {}
    for(var show of shows) {
        for(var i of show.getAllSongs()) {
            var song_title = songs[i.song];
            var new_song_data = new SongData(show.date, i.seconds);
            if(song_title in song_data) {
                song_data[song_title].push(new_song_data);
            } else {
                song_data[song_title] = [new_song_data];
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

function getData() {
    if(FORCE_UPDATE == true) {
        log('Update forced');
    }
    else {
        if(checkLocalStorage() == true) {
            getSongData();
            data_loaded = true;
            updateVisualData(DEFAULT_SONG);
            return;
        }
    }
    log('Loading data from network');
    fetchBinaryData();
};
