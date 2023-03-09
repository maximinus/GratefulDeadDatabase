const SONGS_FILE = 'data/songs.bin';
const SHOWS_FILE = 'data/shows.bin';
const VENUES_FILE = 'data/venues.bin';
const WEATHER_FILE = 'data/weather.bin'
const FILES_TO_LOAD = 4;

const LOGGING_ON = true;

const SONGS_TAB = '#songs-tab';
const SHOWS_TAB = '#shows-tab';
const YEARS_TAB = '#years-tab';
const VENUES_TAB = '#venues-tab';
const ABOUT_TAB = '#about-tab';

const SONG_DATA = 'songs';
const SHOW_DATA = 'shows';
const VENUE_DATA = 'venues';
const WEATHER_DATA = 'weather';
const LAST_UPDATE = 'update-data';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TABLE_ENTRIES = 6;
const YEAR_OFFSET = 65;
const YEARS_PLAYED = 31;

// used when debugging
const FORCE_UPDATE = true;
// how often to check the update, in number of days
const NEXT_UPDATE = 365;
const DEFAULT_SONG = 'Playing In The Band';
const DEFAULT_SHOW = 478;
const DEFAULT_YEAR = 1978;
const DEFAULT_VENUE = 1;

const START_YEAR = 1965;
const END_YEAR = 1995;
