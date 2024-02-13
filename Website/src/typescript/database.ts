import * as gd from './constants'
import { logger } from './logger';

// This file should import nothing at all.
// It holds the class definitions for the storage item, and exports one storage item by itself
// it also includes functions to load and parse the data

class Options {
    date_format: number;

    constructor() {
        this.date_format = gd.DATE_FORMAT_MMDDYY;
    }
};

export class Weather {
    date: number;
    temperatures: number[]
    feels_like: number[]
    rainfall: number[]

    constructor(idate: number, temps: number[], feels: number[], rain: number[]) {
        this.date = idate
        this.temperatures = temps
        this.feels_like = feels
        this.rainfall = rain
    }

    static fromJsonData(data: string): Weather {
        let idata = JSON.parse(data)
        return new Weather(idata['date'], idata['temps'], idata['feels'], idata['rain'])
    }

    getJsonData(): string {
        return JSON.stringify({'date':this.date,
                               'temps':this.temperatures,
                               'feels':this.feels_like,
                               'rain': this.rainfall})
    }
}

export class Venue {
    id: number
    venue_name: string
    college: string
    city: string
    state: string
    country: string
    latitude: number
    longitude: number

    constructor(venue_data: string[]) {
        this.id = parseInt(venue_data[0])
        this.venue_name = venue_data[1]
        this.college = venue_data[2]
        this.city = venue_data[3]
        this.state = venue_data[4]
        this.country = venue_data[5]
        this.latitude = parseFloat(venue_data[6])
        this.longitude = parseFloat(venue_data[7])
    }

    static fromJsonData(data: string): Venue {
        let d = JSON.parse(data);
        return new Venue([d.id.toString(), d.venue, d.college, d.city, d.state, d.country, d.latitude, d.longitude])
    }

    getVenueName(): string {
        return `${this.venue_name}, ${this.city}, ${this.state}, ${this.country}`
    }

    getSlug(): string {
        return this.venue_name.split(' ').join('-')
    }

    getGoogleMapsLink(): string {
        return `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`
    }
    
}

export class Song {
    song_index: number
    length: number
    seques_out: boolean

    constructor(index: number, seconds: number, sequed: boolean) {
        this.song_index = index
        this.length = seconds
        this.seques_out = sequed
    }

    getJsonData(): string {
        return JSON.stringify({'song':this.song_index, 'seconds':this.length, 'sequed': this.seques_out})
    }

    static fromJsonData(data: string) {
        let d = JSON.parse(data);
        return new Song(d.song, d.seconds, d.sequed)
    }
}


export class SongData {
    show_id: number
    length: number

    constructor(id: number, seconds: number) {
        this.show_id = id
        this.length = seconds
    }
}

export class ShowSet {
    songs: Song[]

    constructor(set_songs: Song[]) {
        this.songs = set_songs
    }

    getJsonData(): string[] {
        let json_songs: string[] = []
        for(let song of this.songs) {
            json_songs.push(song.getJsonData())
        }
        return json_songs
    }

    static fromJsonData(data: string[]): ShowSet {
        let new_songs: Song[] = []
        // data is the array
        for(let song of data) {
            new_songs.push(Song.fromJsonData(song))
        }
        return new ShowSet(new_songs)
    }
}

function getRealDate(days: number) {
    // converted
    let new_date = new Date(1950, 0, 1)
    new_date.setDate(new_date.getDate() + days)
    return new_date
}

export class Show {
    id: number
    sets: ShowSet[]
    date: number
    js_date: Date
    venue: number

    constructor(sets: ShowSet[], date: number, venue: number, show: number) {
        this.id = show
        this.venue = venue
        this.date = date
        this.js_date = getRealDate(date)
        this.sets = sets
    }

    getJsonData() {
        let json_sets: string[][] = []
        for(let show_set of this.sets) {
            json_sets.push(show_set.getJsonData())
        }
        return {'date':this.date, 'sets':json_sets, 'id':this.id, 'venue':this.venue}
    }

    getAllSongs(): Song[] {
        let all_songs: Song[] = []
        for(let i of this.sets) {
            for(let j of i.songs) {
                all_songs.push(j)
            }
        }
        return all_songs
    }

    getLength(): number {
        // length of all songs, in seconds
        let total_time: number = 0
        for(let i of this.sets) {
            for(let j of i.songs) {
                total_time += j.length
            }
        }
        return total_time
    }

    getAllUniqueSongs(): Song[] {
        let all_songs: Song[] = this.getAllSongs()
        // turn to set and then back to list
        return [...new Set(all_songs)]
    }

    getAllUniqueSongsBySet(): Song[][] {
        // returns a list of lists of songs
        let sets_by_song: Song[][] = []
        for(let i of this.sets) {
            let songs_in_set = []
            for(let j of i.songs) {
                songs_in_set.push(j)
            }
            sets_by_song.push([...new Set(songs_in_set)])
        }
        return sets_by_song
    }
}

export class GDStorage {
    loaded: boolean
    options: Options
    shows: Show[]
    songs: string[]
    venues: Venue[]
    weather: {[key: number]: Weather}
    // {song_title: [[show_id, length]...]} for all songs
    song_data: {[key: string]: SongData[]}
    last_update: string;
    load_counter: number
    // TODO: fix this
    show_choices: any
}

// the singleton for others to use
export const store = new GDStorage();

// functions to load and parse the data

function checkFinish(): void {
    if(store.load_counter < gd.FILES_TO_LOAD) {
        // not done yet
        return
    }
    dataLoaded()
}

function dataLoaded(): void {
    // callback for when we have all data from network load
    // store for next time
    storeData()
    getSongData()
    logger('Loading finished')
    store.loaded = true
    // TODO: fix this
    //updateTabs();
};

function parseSongs(binary_data: Uint8Array): void {
    // zero terminated strings stored in bytes
    store.songs = []
    // there is no ID = 0 for songs, so we add a null string
    store.songs.push('')
    let next_title = ''
    for(let i = 0; i < binary_data.byteLength; i++) {
        if(binary_data[i] != 0) {
            next_title += String.fromCharCode(binary_data[i]);
        }
        else {
            store.songs.push(next_title);
            next_title = ''
            // a zero after the zero (a double termination) is the end
            if(binary_data[i+1] == 0) {
                break
            }
        }
    }
    logger(`Got ${store.songs.length} songs`)
    store.load_counter += 1
    checkFinish()
};

function getSingleSet(binary_data: Uint8Array, i: number): [ShowSet, number] {
    // Since we can't store a zero, the song_index is the real index + 1
    // If a song seques, then add 32768 to the index
    // Each set ends with a zero
    // If a set STARTS with a zero, that means we are at the end of the show
    // (i.e. put a zero at the end so we get a double zero)
    let set_songs = []
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of this set
            return [new ShowSet(set_songs), i + 2]
        }
        // we store song indexes with +1 so as not to hit the set marker
        // here we reset so that the index is correct
        let index = getWord(binary_data, i)
        i += 2
        let length = getWord(binary_data, i)
        i += 2
        if(length == 65535) {
            // 0 means "we don't have this"
            length = 0
        }
        if(index > 32767) {
            index -= 32768
            // sequed
            set_songs.push(new Song(index, length, true))
        } else {
            set_songs.push(new Song(index, length, false))
        }
    }
}

function getSets(binary_data: Uint8Array, i: number): [ShowSet[] ,number] {
    // keep going until we hit the zero
    let new_sets = []
    while(true) {
        if(getWord(binary_data, i) == 0) {
            // end of these sets
            i += 2
            return [new_sets, i]
        }
        let new_set_data = getSingleSet(binary_data, i)
        new_sets.push(new_set_data[0])
        i = new_set_data[1]
    }
}

function getWord(binary: Uint8Array, index: number): number {
    let low_byte = binary[index]
    let high_byte = binary[index + 1]
    return (high_byte * 256) + low_byte
}

function parseShows(binary_data: Uint8Array): void {
    // get the show data
    // the data format is unsigned 16-bit array
    // First 2 bytes are the date, represented as number of days since 1st Jan 1950
    // 3rd and 4th bytes are the venue id
    // 5th and 6th bytes are the show id
    // Then we have a set, constructed as a list of [song_index, length]
    store.shows = []
    // All +2 are to move a word in the byte array
    let index = 0
    while(true) {
        // traverse over each show until we meet 0
        if(getWord(binary_data, index) == 0) {
            break
        }
        let date = getWord(binary_data, index)
        index += 2
        let venue_id = getWord(binary_data, index)
        index += 2
        let show_id = getWord(binary_data, index)
        index += 2
        // traverse sets, waiting for a 0 byte
        let new_sets_data = getSets(binary_data, index)
        index = new_sets_data[1]
        // save the show
        store.shows.push(new Show(new_sets_data[0], date, venue_id, show_id))
    }
    // we cannot sort shows by ID as there may be missing values
    logger(`Got ${store.shows.length} shows`)
    store.load_counter += 1
    checkFinish()
}

function parseWeather(binary_data: Uint8Array): void {
    store.weather = {}
    // all 16 bit data
    // [show_id, [temp, feels_like] * 24], i.e. 49 * 2 = 98 bytes each
    // precipitation true/false is held as the high bit in feels_like
    let index = 0
    while(true) {
        let show_id = getWord(binary_data, index)
        index += 2
        let temps = []
        let feels = []
        let precip = []
        for(let i = 0; i < 24; i++) {
            temps.push(getWord(binary_data, index))
            index += 2
            feels.push(getWord(binary_data, index))
            index += 2
            precip.push(getWord(binary_data, index))
            index += 2
        }
        store.weather[show_id] = new Weather(show_id, temps, feels, precip)
        // should be a zero to verify the end
        if(getWord(binary_data, index) != 0) {
            logger('Error parsing weather')
            return
        }
        index +=2
        // really at the end?
        if(getWord(binary_data, index) == 0) {
            logger(`Got ${Object.keys(store.weather).length} days of weather`)
            store.load_counter += 1
            checkFinish()
            return
        }
    }
}

function parseVenues(binary_data: Uint8Array): void {
    store.venues = []
    // just 8 strings, grab them all
    let index = 0
    while(true) {
        let details = []
        for (let i = 0; i < 8; i++) {
            let next_title = ''
            while(binary_data[index] != 0) {
                next_title += String.fromCharCode(binary_data[index])
                index += 1
            }
            // move past zero marker
            index += 1
            details.push(next_title)
        }
        store.venues.push(new Venue(details))
        // now we've collected them all, is there a zero at the end?
        if(binary_data[index] == 0) {
            logger(`Got ${store.venues.length} venues`)
            store.load_counter += 1
            checkFinish()
            return
        }
    }
}

function storageAvailable(): boolean {
    // taken from 
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    // TODO: update this with a library maybe?
    let storage
    try {
        storage = window.localStorage
        let x = '__storage_test__'
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
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
            (storage && storage.length !== 0)
    }
}

function updateRequired(): boolean {
    // last_update contains valid data
    let update_date = new Date(JSON.parse(store.last_update))
    let today = new Date()
    // calculate day difference between the 2 dates
    // yes, this code ignore timezones and so on, but it's good enough
    let delta_time = today.getTime() - update_date.getTime()
    let delta_days = delta_time / (1000 * 60 * 60 * 24)
    return delta_days >= gd.NEXT_UPDATE
}

function convertLocalData(loaded_songs: string, loaded_shows: string, loaded_venues: string, loaded_weather: string): boolean {
    try {
        store.songs = JSON.parse(loaded_songs)
        store.venues = JSON.parse(loaded_venues)
        store.weather = JSON.parse(loaded_weather)
        // convert back to shows
        //let json_shows = JSON.parse(loaded_shows)
        store.shows = []
        // TODO: fix this
        //for(let i of json_shows) {
        //    store.shows.push(Show.fromJsonData(i))
        //}
    } catch(error) {
        logger(`Error: ${error}`)
        logger('Malformed data in local storage')
        return false
    }
    return true
}

function getFromLocalStorage(): boolean {
    // return true if this was possible
    // storage exists, we must check before this function
    // do we have our data here?
    let loaded_shows = localStorage.getItem(gd.SHOW_DATA)
    let loaded_songs = localStorage.getItem(gd.SONG_DATA)
    let loaded_venues = localStorage.getItem(gd.VENUE_DATA)
    let loaded_weather = localStorage.getItem(gd.WEATHER_DATA)
    store.last_update = localStorage.getItem(gd.LAST_UPDATE)
    if(loaded_shows == null || loaded_songs == null || loaded_venues == null || store.last_update == null || loaded_weather == null) {
        logger('No local data found')
        // we need to reload
        return false
    }
    // check we don't need to refresh the data
    if(updateRequired() === true) {
        logger('Local update needs refreshing')
        return false
    }
    // we are not complete, we need to convert the data
    if(!convertLocalData(loaded_songs, loaded_shows, loaded_venues, loaded_weather)) {
        return false
    }
    logger(`Got ${store.songs.length} songs`)
    logger(`Got ${store.shows.length} shows`)
    logger(`Got ${store.venues.length} venues`)
    logger(`Got ${Object.keys(store.weather).length} days of weather`)
    return true
}

function checkLocalStorage(): boolean {    
    if(storageAvailable() === false) {
        logger('No local storage on this browser')
    }
    else if(getFromLocalStorage() === true) {
        logger('Loaded data from local storage')
        return true
    }
    return false
}

function getSongData(): void {
    // we now have all the shows, so collate song data
    // this means we want to produce a map of song -> song instances
    // this is why they have a date and a time
    // we often search by song, this makes things a lot quicker
    logger('Getting song data from database')
    store.song_data = {}
    for(let show of store.shows) {
        for(let i of show.getAllSongs()) {
            let song_title = store.songs[i.song_index]
            let new_song_data = new SongData(show.id, i.length)
            if(song_title in store.song_data) {
                store.song_data[song_title].push(new_song_data)
            } else {
                store.song_data[song_title] = [new_song_data]
            }
        }
    }
    logger('Calculated song data')
}

function storeData(): void {
    // store the contents of the songs and shows, if we can
    if(storageAvailable() === false) {
        return
    }
    // create an array of shows
    let all_shows = []
    for(let single_show of store.shows) {
        all_shows.push(single_show.getJsonData())
    }
    localStorage.setItem(gd.SHOW_DATA, JSON.stringify(all_shows))
    // repeat for all songs
    localStorage.setItem(gd.SONG_DATA, JSON.stringify(store.songs))
    // and venues
    localStorage.setItem(gd.VENUE_DATA, JSON.stringify(store.venues))
    // finally, weather
    localStorage.setItem(gd.WEATHER_DATA, JSON.stringify(store.weather))
    // now we need store the current date
    let current_date = new Date()
    localStorage.setItem(gd.LAST_UPDATE, JSON.stringify(current_date))
    logger('Data stored for future use')
}

function fetchBinaryData(): void {
    let song_request = new XMLHttpRequest()
    song_request.open('GET', gd.SONGS_FILE, true)
    song_request.responseType = 'arraybuffer'
    song_request.send()

    song_request.onload = function(event) {
        let arrayBuffer = song_request.response
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer)
            parseSongs(byteArray)
        }
    }

    let show_request = new XMLHttpRequest()
    show_request.open('GET', gd.SHOWS_FILE, true)
    show_request.responseType = 'arraybuffer'
    show_request.send()

    show_request.onload = function(event) {
        let arrayBuffer = show_request.response
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer)
            parseShows(byteArray)
        }
    }

    let venue_request = new XMLHttpRequest()
    venue_request.open('GET', gd.VENUES_FILE, true)
    venue_request.responseType = 'arraybuffer'
    venue_request.send()

    venue_request.onload = function(event) {
        let arrayBuffer = venue_request.response
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer)
            parseVenues(byteArray)
        }
    }

    let weather_request = new XMLHttpRequest()
    weather_request.open('GET', gd.WEATHER_FILE, true)
    weather_request.responseType = 'arraybuffer'
    weather_request.send()

    weather_request.onload = function(event) {
        let arrayBuffer = weather_request.response
        if(arrayBuffer) {
            let byteArray = new Uint8Array(arrayBuffer)
            parseWeather(byteArray)
        }
    }
}

export function getData(): void {
    if(gd.FORCE_UPDATE === true) {
        logger('Update forced')
    }
    else if(checkLocalStorage() === true) {
        getSongData()
        store.loaded = true
        // need to do this from the caller
        //updateTabs()
        return
    }
    logger('Loading data from network')
    fetchBinaryData()
}
