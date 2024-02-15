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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

const DATE_FORMAT_MMDDYY = 0;
const DATE_FORMAT_DDMMYY = 1;
const DATE_FORMAT_YYMMDD = 2;

// used in search input for invisible checking
const INVISIBLE_SPACE = '\u200b';

// best shows per year, 6 only
// store as DD-MM, unwrap in code

const BEST_SHOWS = {
    1965: [],
    1966: ['12-2', '9-3', '25-3', '15-6', '16-7', '4-12'],
    1967: ['18-3', '5-5', '18-6', '4-8', '11-10', '22-10'],
    1968: ['17-1', '22-8', '2-9', '12-10', '13-10', '20-10'],
    1969: ['11-2', '28-2', '1-3', '22-4', '2-5', '23-8'],
    1970: ['17-1', '23-1', '13-2', '14-2', '2-5', '19-9'],
    1971: ['18-2', '14-4', '28-4', '14-11', '15-11', '15-12'],
    1972: ['8-4', '17-4', '7-5', '24-5', '27-8', '18-10'],
    1973: ['28-2', '2-4', '1-7', '1-8', '23-10', '18-12'],
    1974: ['24-2', '18-6', '28-6', '6-8', '10-9', '20-9'],
    1975: ['23-3', '13-8', '28-9'],
    1976: ['13-7', '28-9', '1-10', '9-10', '10-10', '31-12'],
    1977: ['26-2', '22-4', '25-4', '30-4', '8-5', '29-10'],
    1978: ['22-1', '3-2', '15-4', '8-7', '18-11', '31-12'],
    1979: ['17-2', '4-8', '2-9', '6-9', '2-11', '28-12'],
    1980: ['1-4', '8-5', '12-5', '12-6', '9-10', '14-12'],
    1981: ['9-3', '6-5', '12-9', '8-10', '19-10', '26-12'],
    1982: ['17-2', '6-4', '19-4', '27-7', '7-8', '15-9'],
    1983: ['23-4', '15-5', '18-6', '30-8', '18-9', '21-10'],
    1984: ['31-3', '9-6', '24-6', '27-6', '30-6', '13-7'],
    1985: ['21-3', '31-10', '8-11', '10-11', '20-11', '21-11'],
    1986: ['12-2', '24-3', '28-3', '19-4', '4-5', '27-12'],
    1987: ['26-3', '6-4', '15-8', '12-9', '16-9', '27-12'],
    1988: ['16-3', '5-4', '13-4', '29-7', '31-7', '28-12'],
    1989: ['31-3', '9-7', '9-10', '20-10', '26-10', '31-12'],
    1990: ['14-3', '24-3', '29-3', '11-9', '16-9', '20-9'],
    1991: ['21-2', '20-3', '23-3', '22-6', '10-9', '31-10'],
    1992: ['23-2', '20-3', '26-6', '6-12', '12-12', '16-12'],
    1993: ['11-3', '16-5', '26-5', '23-6', '26-6', '22-9'],
    1994: ['21-3', '19-7', '26-7', '5-10', '17-10', '16-12'],
    1995: ['21-2', '26-3', '27-3', '2-4', '2-6', '5-7']
};
