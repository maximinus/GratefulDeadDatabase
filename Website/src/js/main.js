class OptionsStorage {
    constructor() {
        this.show_choices = [];
		this.urls_added = false;
		this.current_tab = null;
		// tabs leave their current url here

		this.tab_url = {[SONGS_TAB]: '', [SHOWS_TAB]: '', [VENUES_TAB]: '', [YEARS_TAB]: '', [ABOUT_TAB]: '#about'};
    };
};

let db_store = new OptionsStorage();


function updateSearchInputOptions() {
	// clear any current list
	document.getElementById('choose-search').innerHTML = '';
	let list = document.getElementById('choose-search');
	// add all songs
	for(let i of store.songs) {
		let song_option = document.createElement('option');
		// add a non-visible space at the end:
   		song_option.value = i.concat(INVISIBLE_SPACE);
   		list.appendChild(song_option);
	}
	for(let i of store.venues) {
		// as above
		let venue_option = document.createElement('option');
		venue_option.value = i.venue.concat(INVISIBLE_SPACE);
		list.appendChild(venue_option);
	}
};

function selectMultipleShow(multiple_shows) {
	// we want date and number, i.e. 13th Feb 1970 Show 1
	db_store.show_choices = multiple_shows;
	let date_text = convertDate(multiple_shows[0].date);
	let data = {'show-info-1': `${date_text} Early Show`,
				'show-info-2': `${date_text} Late Show`};
	let template = document.getElementById('choose-show-template').innerHTML;
	let new_html = Mustache.render(template, data);
    document.getElementById('select-song-choice').innerHTML = new_html;
	// modal 'choose a show' buttons
	document.getElementById('choose-show-one').addEventListener('click', chooseShowOne);
	document.getElementById('choose-show-two').addEventListener('click', chooseShowTwo);
	$('#select-song-dialog').modal();
};

function chooseShowOne() {
	$('#select-song-dialog').modal('hide');
	if(db_store.show_choices.length == 0) {
		console.log(logger('Error: Choose show called with no shows'));
		return;
	}
	// goto this show
	let show = db_store.show_choices[0];
	db_store.show_choices = [];
	updateShowTab(show);
	$(SHOWS_TAB).tab('show');
};

function chooseShowTwo() {
	$('#select-song-dialog').modal('hide');
	if(db_store.show_choices.length == 0) {
		console.log(logger('Error: Choose show called with no shows'));
		return;
	}
	let show = db_store.show_choices[1];
	db_store.show_choices = [];
	updateShowTab(show);
	$(SHOWS_TAB).tab('show');
};

function checkShowInput(text_input) {
	// return [date, show_index] or null, depending on if it was a date
	let actual_date = convertDateOptionFormat(text_input);
	if(actual_date == null) {
		console.log(logger('No show match'));
		return null;
	}
	// we have a date, the next thing is to decide if there's a show on this date
	let show_day = convertFromDate(actual_date);
	// iterate over all dates and store as a list the difference
	let date_diffs = [];
	for(let single_show of store.shows) {
		date_diffs.push([single_show, Math.abs(single_show.date - show_day)]);
	}
	date_diffs.sort((a, b) => (a[1] > b[1]) ? 1 : -1);
	// Find all shows with same date
	let date_matches = [];
	for(let single_diff of date_diffs) {
		if(single_diff[1] == 0) {
			date_matches.push(single_diff[0]);
		} else {
			break;
		}
	}
	if(date_matches.length == 1) {
		// easy, one single match
		return [date_matches[0], 0];
	}
	if(date_matches.length > 1) {
		// TODO: Pick multiple dates
		selectMultipleShow(date_matches);
		return [date_matches[0], 0];
	}
	// otherwise, no match
	return null;
};

function checkSearchInput(text_input) {
	text_input = text_input.toLowerCase();
	// is this a year?
	let int_value = parseInt(text_input);
	if(isNaN(int_value) === false) {
		// could be a year
		if((int_value >= START_YEAR) && (int_value <= END_YEAR)) {
			updateURL(getYearUrl(int_value));
			return;
		}
	}
	let matched_show = checkShowInput(text_input);
	if(matched_show !== null) {
		updateURL(getShowUrl(matched_show));
		return;
	};
	// is this a song?
	for(let s of store.songs) {
		if(s.toLowerCase() == text_input) {
			updateURL(getSongUrl(s));
			return;
		}
	}
	for(let s of store.venues) {
		if(s.venue.toLowerCase() == text_input) {
			updateURL(getVenueUrl(s.venue))
			return;
		}
	}
	console.log(logger(`Could not find reference ${text_input}`));
};

function checkNewSong(event) {
	if(event.keyCode == 13) {
		// enter key has been pressed
		// check if song is valid, else do nothing
		let text_input = document.getElementById('search-input').value;
		checkSearchInput(text_input);
		// do not process the form
		return false;
	}
	return true;
};

function checkInput(event) {
	// get last character. Is it the space? Then update and remove
	let input_text = document.getElementById('search-input').value;
	let last_char = input_text.charAt(input_text.length-1);
	if(last_char == INVISIBLE_SPACE) {
		// update the input
		let real_input = input_text.slice(0,-1);
		checkSearchInput(real_input);
		// this will cause this function to fire again, but since there
		// is no space, nothing should happen
		document.getElementById('search-input').value = real_input;
	}
};


function interceptClickEvent(event) {
	// this will only handle clicks on links
	// so it will be called for clicks on tabs, but be ignored
	let href;
    let target = event.target || event.srcElement;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
		if(href.startsWith('#')) {
			updateURL(href);
			actOnValidUrl();
			// tell the browser not to act on this
           	event.preventDefault();
        }
    }
};

function addCallbacks() {
	let song_element = document.getElementById('search-input');
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong;
	song_element.addEventListener('input', checkInput);
	// not a fan of the jquery but it works
	// this is to update the data format on the search bar
	$('.dropdown-menu a.dropdown-item').on('click', function(){
		let selected = $(this).text();
		document.getElementById('data-format-dropdown').textContent = selected;
		if(selected == 'MM-DD-YY') {
			store.options.date_format = DATE_FORMAT_MMDDYY;
			return;
		}
		if(selected == 'DD-MM-YY') {
			store.options.date_format = DATE_FORMAT_DDMMYY;
			return;
		}
		if(selected == 'YY-MM-DD') {
			store.options.date_format = DATE_FORMAT_YYMMDD;
		}
	});
	// intercept all clicks, to catch link clicks
	if (document.addEventListener) {
    	document.addEventListener('click', interceptClickEvent);
	} else if (document.attachEvent) {
    	document.attachEvent('onclick', interceptClickEvent);
	}

	// intercept all browser forward / back events
	window.onpopstate = function(event) {
		// we add a new item on the history every time we go somewhere new
		if(event.state) {
			let state = event.state;
			console.log(logger(`Navigating back to ${state}`));
			actOnValidUrl();
		}
	};

	// add all tab callbacks
	// this is to check to update them on a click if they are empty
	// these will all add to the window state history
	$(SONGS_TAB).on('click', {tab:SONGS_TAB}, switchTabs);
	$(SHOWS_TAB).on('click', {tab:SHOWS_TAB}, switchTabs);
	$(YEARS_TAB).on('click', {tab:YEARS_TAB}, switchTabs);
	$(VENUES_TAB).on('click', {tab:VENUES_TAB}, switchTabs);
	$(ABOUT_TAB).on('click', {tab:ABOUT_TAB}, switchTabs);
};

function switchTabs(event) {
	if(event.data.tab == db_store.current_tab) {
		return;
	}
	if(!(event.data.tab in db_store.tab_url)) {
		console.log(logger(`Error: Tab ${event.data.tab} does not exist`));
		return;
	}
	// might be a link from a popout; no harm in hiding if already hidden
	hidePopOut();
	// also need to go to the top of the page
	window.scrollTo(0,0);
	$(event.data.tab).tab('show');
	// we did switch a tab
	updateURL(db_store.tab_url[event.data.tab]);
	db_store.current_tab = event.data.tab;
	event.preventDefault();
};

function setSongDropdown() {
	updateSearchInputOptions();
	// the other datalist is in the combos tab
	let list = document.getElementById('choose-song-search');
	for(let i of store.songs) {
		let song_option = document.createElement('option');
   		list.appendChild(song_option);
	}
};

function showNewTab(named_tab) {
	if(db_store.tab == named_tab) {
		// already viewing
		return;
	}
	// might be a link from a popout; no harm in hiding if already hidden
	hidePopOut();
	// also need to go to the top of the page
	window.scrollTo(0,0);
	$(named_tab).tab('show');
};

// these action url should also update the current url
function actionSongUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return null;
	}
	// the data should be a slugged song name
	let song_name = slugToText(url_data[1]);
	// find the song with that name
	if(song_name in store.song_data) {
		// we can now update the page
		updateSongTab(song_name);
		showNewTab(SONGS_TAB);
		return db_store.tab_url[SONGS_TAB];
	}
	// no key, no song, invalid url
	return null;
};

function actionShowUrl(url_data) {
	// the data should have 3 parts
	if(url_data.length != 3) {
		return null;
	}
	// the second part should be a valid date
	let show_date = slugToDate(url_data[1]);
	if(show_date === null) {
		console.log(logger(`Error: Invalid date slug ${show_date}`));
		return null;
	}
	// the third part should be a valid single digit number
	let show_number = Number(url_data[2]);
	if(isNaN(show_number)) {
		return null;
	}
	// all correct, so try and get the show
	let real_show = showDateExists(show_date);
	if(real_show === null) {
		console.log(logger(`Error: Date ${show_date} does not exist`));
		return null;
	}
	updateShowTab(real_show);
	showNewTab(SHOWS_TAB);
	return db_store.tab_url[SHOWS_TAB];
};

function actionVenueUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return null;
	}
	// the venue name must exist
	let venue_name = slugToText(url_data[1]);
	let venue = getVenueFromName(venue_name);
	if(venue === null) {
		return null;
	}
	updateVenueTab(venue);
	showNewTab(VENUES_TAB);
	return db_store.tab_url[VENUES_TAB];
};

function actionYearUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return null;
	}
	// the year must be valid
	let year = Number(url_data[1]);
	if(isNaN(year)) {
		return null;
	}
	if((year < START_YEAR) || (year > END_YEAR)) {
		return null;
	}
	updateYearTab(year);
	showNewTab(YEARS_TAB);
	return db_store.tab_url[YEARS_TAB];
};

function actionAboutUrl(url_data) {
	// should be 2 entries
	if(url_data.length != 2) {
		return null;
	}
	showNewTab(ABOUT_TAB);
	return '#about';
};

function actOnValidUrl() {
	// take the current URL and update the page is needed.
	// Returns null if no action was taken, otherwise returns the URL

	// remove empty strings if we have any
	let fragment = new URL(window.location).hash;
	if(fragment.length == 0) {
		return null;
	}
	console.log(logger(`URL changed to ${fragment}`));
	let split_url = fragment.split(':').filter(e => e);
	if(split_url.length == 0) {
		return null;
	}
	// the first value indicates what sort of data we have (and what data follows)
	if(split_url[0] == '#song') {
		return actionSongUrl(split_url);
	}
	if(split_url[0] == '#show') {
		return actionShowUrl(split_url);
	}
	if(split_url[0] == '#venue') {
		return actionVenueUrl(split_url);
	}
	if(split_url[0] == '#year') {
		return actionYearUrl(split_url);
	}

	if(split_url[0] == '#about') {
		return actionAboutUrl(split_url);
	}
	return null;
};

function updateURL(new_url) {
	if(db_store.urls_added === false) {
		// nothing has been added, so this is the root page
		window.history.replaceState(new_url, null, new_url);
		db_store.urls_added = true;
	} else {
		window.history.pushState(new_url, null, new_url);
	}
};

function allDataLoaded() {
	// add events
	addCallbacks();
	setSongDropdown();
	initComboTab();
	// update everything at start
	updateShowTab(getShowFromId(DEFAULT_SHOW));
	updateSongTab(DEFAULT_SONG);
	updateVenueTab(store.venues[DEFAULT_VENUE]);
	updateYearTab(DEFAULT_YEAR);
	// we may have a state already, in which case deal with it
	let new_url = actOnValidUrl();
	if(new_url != null) {
		updateURL(new_url);
	} else {
		// otherwise update the page with the default
		updateURL(getSongUrl(DEFAULT_SONG));
	}
};

document.addEventListener('DOMContentLoaded', function(){
    console.log(logger('Starting GD Database'));
    store.callback = allDataLoaded;
	getData();
});
