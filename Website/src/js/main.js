// this code should handle displaying and updating the input box
class DatabaseStorage {
    constructor() {
        this.show_choices = [];
    };
};

let db_store = new DatabaseStorage();


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
	// return true / false if it was a date
	let actual_date = convertDateOptionFormat(text_input);
	if(actual_date == null) {
		console.log(logger('No show match'));
		return false;
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
		changeTabView(SHOWS_TAB, date_matches[0]);
		return true;
	}
	if(date_matches.length > 1) {
		selectMultipleShow(date_matches);
		return true;
	}
	// otherwise, no match
	return false;
};

function checkSearchInput(text_input) {
	text_input = text_input.toLowerCase();
	// is this a year?
	let int_value = parseInt(text_input);
	if(isNaN(int_value) === false) {
		// could be a year
		if((int_value >= START_YEAR) && (int_value <= END_YEAR)) {
			changeTabView(YEARS_TAB, int_value);
			return;
		}
	}
	if(checkShowInput(text_input) === true) {
		// tab is updated in above function
		return;
	};
	// is this a song?
	for(let s of store.songs) {
		if(s.toLowerCase() == text_input) {
			changeTabView(SONGS_TAB, s);
			return;
		}
	}
	for(let s of store.venues) {
		if(s.venue.toLowerCase() == text_input) {
			changeTabView(VENUES_TAB, s.id);
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

function handleLink(link_txt) {
	// also check the link is valid
	let link_data = link_txt.split('-');
	let link_tab = link_data[0];
	link_data = link_data[1];
	if(link_tab == 'show') {
		// it's either a date in the format YYYY/MM/DD, or a single value, the show id
		let show_id = link_data.split('/');
		if(show_id.length == 1) {
			changeTabView(SHOWS_TAB, getShowFromId(show_id));
			return;
		}
		// must be in a date format
		let show_date = new Date(parseInt(show_id[0]), parseInt(show_id[1]) - 1, parseInt(show_id[2]));
		changeTabView(SHOWS_TAB, getShowFromDate(show_date));
		return;
	}
	if(link_tab == 'song') {
		changeTabView(SONGS_TAB, link_data);
		return;
	}
	if(link_tab == 'venue') {
		changeTabView(VENUES_TAB, link_data);
		return;
	}
	if(link_tab == 'year') {
		changeTabView(YEARS_TAB, link_data);
		return;
	}
	if(link_tab == 'about') {
		changeTabView(ABOUT_TAB, '');
	}
};

function interceptClickEvent(event) {
	let href;
    let target = event.target || event.srcElement;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
		if(href.startsWith('#gdd')) {
			handleLink(href.slice(5));
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

	// intercept all browser back events
	window.onpopstate = function(event) {
		if(event.state) {
			let state = event.state;
			console.log(logger(`Navigating back to ${state}`));
			handleLink(state);
		}
	};

	// add all tab callbacks
	// this is to check to update them on a click if they are empty
	$(SONGS_TAB).on('click', switchToSongTab);
	$(SHOWS_TAB).on('click', switchToShowTab);
	$(YEARS_TAB).on('click', switchToYearTab);
	$(VENUES_TAB).on('click', switchToVenueTab);
	$(ABOUT_TAB).on('click', function(event) {
		window.history.pushState('/about', null, '/about');
	});
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

function changeTabView(data_type, data) {
	let url_string = '';
	switch(data_type) {
		case SONGS_TAB:
			updateSongTab(data);
			url_string = `/song/${songNametoSlug(data)}`;
			break;
		case SHOWS_TAB:
			updateShowTab(data);
			url_string = `/show/${dateToSlug(data.js_date)}`;
			break;
		case YEARS_TAB:
			updateYear(data);
			url_string = `/year/${data}`;
			break;
		case VENUES_TAB:
			updateVenueTab(data);
			url_string = `/venue/${venueToSlug(data)}`;
			break;
		case ABOUT_TAB:
			url_string = '/about'
			break;
		default:
			console.log(logger(`Invalid tab to go to: ${data_type} with data ${data}`));
			return;
	}
	// set state for history back button
	window.history.pushState(url_string, null, url_string);
	// might be a link from a popout; no harm in hiding if already hidden
	hidePopOut();
	// also need to go to the top of the page
	window.scrollTo(0,0);
	$(data_type).tab('show');
};

function actionSongUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return false;
	}
	// the data should be a slugged song name
	let song_name = slugToText(url_data[1]);
	// find the song with that name
	if(song_name in store.song_data) {
		// we can now update the page
		updateSongTab(song_name);
		$(SONGS_TAB).tab('show');
		return true;
	}
	// no key, no song, invalid url
	return false;
};

function actionShowUrl(url_data) {
	// the data should have 3 parts
	if(url_data.length != 3) {
		return false;
	}
	// the second part should be a valid date
	let show_date = slugToDate(url_data[1]);
	if(show_date === null) {
		return false;
	}
	// the third part should be a valid single digit number
	let show_number = Number(url_data[2]);
	if(isNaN(show_number)) {
		return false;
	}
	// all correct, so try and get the show
	let real_show = showDateExists(show_date);
	if(real_show === null) {
		return false;
	}
	updateShowTab(real_show);
	$(SHOWS_TAB).tab('show');
	return true;
};

function actionVenueUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return false;
	}
	// the venue name must exist
	let venue_name = slugToText(url_data[1]);
	let venue = getVenueFromName(venue_name);
	if(venue === null) {
		return false;
	}
	updateVenueTab(venue);
	$(VENUES_TAB).tab('show');
	return true;
};

function actionYearUrl(url_data) {
	// the data should have 2 parts
	if(url_data.length != 2) {
		return false;
	}
	// the year must be valid
	let year = Number(url_data[1]);
	if(isNaN(year)) {
		return false;
	}
	if((year < START_YEAR) || (year > END_YEAR)) {
		return false;
	}
	updateYearTab(year);
	$(YEARS_TAB).tab('show');
	return true;
};

function actionAboutUrl(url_data) {
	// should be 2 entries
	if(url_data.length != 2) {
		return false;
	}
	$(ABOUT_TAB).tab('show');
	return true;
};

function actOnValidUrl() {
	// take the current URL and update the page is needed. Returns true if an update was actioned
	// remove empty strings if we have any
	let fragment = new URL(window.location).hash;
	if(fragment.length == 0) {
		return false;
	}
	let split_url = fragment.split(':').filter(e => e);

	console.log(split_url);

	if(split_url.length == 0) {
		return false;
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
	return false;
};

function updateURL(new_url) {
	window.history.pushState(new_url, null, new_url);
	actOnValidUrl();
};

function allDataLoaded() {
	// add events
	addCallbacks();
	setSongDropdown();
	initComboTab();
	// we may have a state already, in which case deal with it
	if(actOnValidUrl()) {
		return;
	}
	updateURL(getSongUrl(DEFAULT_SONG));
};

document.addEventListener('DOMContentLoaded', function(){
    console.log(logger('Starting GD Database'));
    store.callback = allDataLoaded;
	getData();
});
