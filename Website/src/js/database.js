// Holds the storage type, which holds all the data, and the functions to move data to and from it

class Options {
    constructor() {
        this.date_format = DATE_FORMAT_MMDDYY;
    }
};

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
        this.callback = null;
    }
};

// the singleton for others to use
let store = new Storage();

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
            console.log(logger('Error: Venue data missing data'));
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
    };
};

class Song {
    // a Song is stored in a ShowSet
    constructor(song_index, seconds, sequed) {
        this.song = song_index;
        this.seconds = seconds;
        this.sequed = sequed;
        if(song_index > 1000) {
            console.log(logger('Error: ', song_index));
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
        let json_songs = [];
        for(let song of this.songs) {
            json_songs.push(song.getJsonData());
        }
        return json_songs;
    };

    static fromJsonData(data) {
        let new_songs = [];
        // data is the array
        for(let song of data) {
            new_songs.push(Song.fromJsonData(song));
        }
        return new ShowSet(new_songs);
    };
};

class Show {
    constructor(show_sets, date, venue_id, show_id) {
        this.id = show_id;
        this.sets = show_sets;
        this.date = date;
        // date is a number of days since 1950, so convert this
        this.js_date = getRealDate(date);
        this.venue = venue_id;
    };

    getJsonData() {
        let json_sets = [];
        for(let show_set of this.sets) {
            json_sets.push(show_set.getJsonData());
        }
        return {'date':this.date, 'sets':json_sets, 'id':this.id, 'venue':this.venue_id};
    };

    getAllSongs() {
        let all_songs = [];
        for(let i of this.sets) {
            for(let j of i.songs) {
                all_songs.push(j);
            }
        }
        return all_songs;
    };

    getLength() {
        // length of all songs, in seconds
        let total_time = 0;
        for(let i of this.sets) {
            for(let j of i.songs) {
                total_time += j.seconds;
            }
        }
        return total_time;
    };

    getAllUniqueSongs() {
        let all_songs = this.getAllSongs();
        // turn to set and then back to list
        return [...new Set(all_songs)];
    };

    getAllUniqueSongsBySet() {
        let sets_by_song = []
        for(let i of this.sets) {
            let songs_in_set = [];
            for(let j of i.songs) {
                songs_in_set.push(j);
            }
            sets_by_song.push([...new Set(songs_in_set)]);
        }
        return sets_by_song;
    };

    static fromJsonData(data) {
        let show_sets = [];
        for(let show_set of data.sets) {
            show_sets.push(ShowSet.fromJsonData(show_set));
        }
        return new Show(show_sets, data.date, data.venue_id, data.id);
    };
};


function storageAvailable() {
    // taken from 
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    let storage;
    try {
        storage = window.localStorage;
        let x = '__storage_test__';
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
    console.log(logger('Loading finished'));
    store.loaded = true;
    if(store.callback == null) {
        console.log(logger('Error: No callback on loaded data'));
    } else {
        store.callback();
    }
};

function parseSongs(binary_data) {
    // zero terminated strings stored in bytes
    store.songs = [];
    // there is no ID = 0 for songs, so we add a null string
    store.songs.push('');
    let next_title = '';
    for(let i = 0; i < binary_data.byteLength; i++) {
        if(binary_data[i] != 0) {
            next_title += String.fromCharCode(binary_data[i]);
        }
        else {
            store.songs.push(next_title);
            next_title = '';
            // a zero after the zero (a double termination) is the end
            if(binary_data[i+1] == 0) {
                break;
            }
        }
    }
    console.log(logger(`Got ${store.songs.length} songs`));
    store.load_counter += 1;
    checkFinish();
};

function getSingleSet(binary_data, i) {
    // Since we can't store a zero, the song_index is the real index + 1
    // If a song seques, then add 32768 to the index
    // Each set ends with a zero
    // If a set STARTS with a zero, that means we are at the end of the show
    // (i.e. put a zero at the end so we get a double zero)
    let set_songs = [];
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of this set
            return [new ShowSet(set_songs), i + 2];
        }
        // we store song indexes with +1 so as not to hit the set marker
        // here we reset so that the index is correct
        let index = getWord(binary_data, i);
        i += 2;
        let length = getWord(binary_data, i);
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
    let new_sets = [];
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of these sets
            i += 2;
            return [new_sets, i];
        }
        let new_set_data = getSingleSet(binary_data, i);
        new_sets.push(new_set_data[0]);
        i = new_set_data[1];
    }
};

function getWord(binary, index) {
    let low_byte = binary[index];
    let high_byte = binary[index + 1];
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
    let index = 0;
    while(true) {
        // traverse over each show until we meet 0
        if(getWord(binary_data, index) == 0) {
            break;
        }
        let date = getWord(binary_data, index);
        index += 2;
        let venue_id = getWord(binary_data, index);
        index += 2;
        let show_id = getWord(binary_data, index);
        index += 2;
        // traverse sets, waiting for a 0 byte
        let new_sets_data = getSets(binary_data, index);
        index = new_sets_data[1];
        // save the show
        store.shows.push(new Show(new_sets_data[0], date, venue_id, show_id));
    }
    // we cannot sort shows by ID as there may be missing values
    console.log(logger(`Got ${store.shows.length} shows`));
    store.load_counter += 1;
    checkFinish();
};

function parseWeather(binary_data) {
    store.weather = {};
    // all 16 bit data
    // [show_id, [temp, feels_like] * 24], i.e. 49 * 2 = 98 bytes each
    // precipitation true/false is held as the high bit in feels_like
    let index = 0;
    while(true) {
        let show_id = getWord(binary_data, index);
        index += 2;
        let temps = [];
        let feels = [];
        let precip = [];
        for(let i = 0; i < 24; i++) {
            temps.push(getWord(binary_data, index));
            index += 2;
            feels.push(getWord(binary_data, index));
            index += 2;
            precip.push(getWord(binary_data, index));
            index += 2;
        }
        store.weather[show_id] = new Weather(show_id, temps, feels, precip);
        // should be a zero to verify the end
        if(getWord(binary_data, index) != 0) {
            console.log(('Error parsing weather'));
            return;
        }
        index +=2;
        // really at the end?
        if(getWord(binary_data, index) == 0) {
            console.log(logger(`Got ${Object.keys(store.weather).length} days of weather`));
            store.load_counter += 1;
            checkFinish();
            return;
        }
    }
};

function parseVenues(binary_data) {
    store.venues = [];
    // just 8 strings, grab them all
    let index = 0;
    while(true) {
        let details = [];
        for (let i = 0; i < 8; i++) {
            let next_title = '';
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
            console.log(logger(`Got ${store.venues.length} venues`));
            store.load_counter += 1;
            checkFinish();
            return;
        }
    }
};

// functions to load thew data

function storeData() {
    // store the contents of the songs and shows, if we can
    if(storageAvailable() === false) {
        return;
    }
    // create an array of shows
    let all_shows = [];
    for(let single_show of store.shows) {
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
    let current_date = new Date();
    localStorage.setItem(LAST_UPDATE, JSON.stringify(current_date));
    console.log(logger('Data stored for future use'));
};

function fetchBinaryData() {
    let song_request = new XMLHttpRequest();
    song_request.open('GET', SONGS_FILE, true);
    song_request.responseType = 'arraybuffer';
    song_request.send();

    song_request.onload = function(event) {
        let arrayBuffer = song_request.response;
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer);
            parseSongs(byteArray);
        }
    }

    let show_request = new XMLHttpRequest();
    show_request.open('GET', SHOWS_FILE, true);
    show_request.responseType = 'arraybuffer';
    show_request.send();

    show_request.onload = function(event) {
        let arrayBuffer = show_request.response;
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer);
            parseShows(byteArray);
        }
    }

    let venue_request = new XMLHttpRequest();
    venue_request.open('GET', VENUES_FILE, true);
    venue_request.responseType = 'arraybuffer';
    venue_request.send();

    venue_request.onload = function(event) {
        let arrayBuffer = venue_request.response;
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer);
            parseVenues(byteArray);
        }
    }

    let weather_request = new XMLHttpRequest();
    weather_request.open('GET', WEATHER_FILE, true);
    weather_request.responseType = 'arraybuffer';
    weather_request.send();

    weather_request.onload = function(event) {
        let arrayBuffer = weather_request.response;
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer);
            parseWeather(byteArray);
        }
    }
};

function updateRequired() {
    // last_update contains valid data
    let update_date = new Date(JSON.parse(store.last_update));
    let today = new Date();
    // calculate day difference between the 2 dates
    // yes, this code ignore timezones and so on, but it's good enough
    let delta_time = today - update_date;
    let delta_days = delta_time / (1000 * 60 * 60 * 24);
    return delta_days >= NEXT_UPDATE;
};

function convertLocalData(loaded_songs, loaded_shows, loaded_venues, loaded_weather) {
    try {
        store.songs = JSON.parse(loaded_songs);
        store.venues = JSON.parse(loaded_venues);
        store.weather = JSON.parse(loaded_weather);
        // convert back to shows
        let json_shows = JSON.parse(loaded_shows);
        store.shows = [];
        for(let i of json_shows) {
            store.shows.push(Show.fromJsonData(i));
        }
    } catch(error) {
        console.log(logger(`Error: ${error}`));
        console.log(logger('Malformed data in local storage'));
        return false;
    }
    return true;
};

function getFromLocalStorage() {
    // return true if this was possible
    // storage exists, we must check before this function
    // do we have our data here?
    let loaded_shows = localStorage.getItem(SHOW_DATA);
    let loaded_songs = localStorage.getItem(SONG_DATA);
    let loaded_venues = localStorage.getItem(VENUE_DATA);
    let loaded_weather = localStorage.getItem(WEATHER_DATA);
    store.last_update = localStorage.getItem(LAST_UPDATE);
    if(loaded_shows == null || loaded_songs == null || loaded_venues == null || store.last_update == null || loaded_weather == null) {
        console.log(logger('Local data missing'));
        // we need to reload
        return false;
    }
    // check we don't need to refresh the data
    if(updateRequired() === true) {
        console.log(logger('Local update needs refreshing'));
        return false;
    }
    // we are not complete, we need to convert the data
    if(convertLocalData(loaded_songs, loaded_shows, loaded_venues, loaded_weather) === false) {
        return false;
    }
    console.log(logger(`Got ${store.songs.length} songs`));
    console.log(logger(`Got ${store.shows.length} shows`));
    console.log(logger(`Got ${store.venues.length} venues`));
    console.log(logger(`Got ${store.weather.size} days of weather`));
    return true;
};

function getSongData() {
    // we now have all the shows, so collate song data
    // this means we want to produce a map of song -> song instances
    // this is why they have a date and a time
    // we often search by song, this makes things a lot quicker
    console.log(logger('Getting song data from database'));
    store.song_data = {}
    for(let show of store.shows) {
        for(let i of show.getAllSongs()) {
            let song_title = store.songs[i.song];
            let new_song_data = new SongData(show.id, i.seconds);
            if(song_title in store.song_data) {
                store.song_data[song_title].push(new_song_data);
            } else {
                store.song_data[song_title] = [new_song_data];
            }
        }
    }
    console.log(logger('Calculated song data'));
};

function checkLocalStorage() {    
    if(storageAvailable() === false) {
        console.log(logger('No local storage on this browser'));
        return false;
    }
    if(getFromLocalStorage() === true) {
        console.log(logger('Loaded data from local storage'));
        return true;
    }
    return false;
};

function getData() {
    if(FORCE_UPDATE === true) {
        console.log(logger('Update forced'));
    }
    else if(checkLocalStorage() === true) {
        getSongData();
        store.loaded = true;
        updateTabs();
        return;
    }
    console.log(logger('Loading data from network'));
    fetchBinaryData();
};
