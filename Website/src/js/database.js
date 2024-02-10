// this code should handle displaying and updating the input box
class DatabaseStorage {
    constructor() {
        this.show_choices = [];
    };
};

var db_store = new DatabaseStorage();

const INVISIBLE_SPACE = '\u200b';


function updateSearchInputOptions() {
	// clear any current list
	document.getElementById('choose-search').innerHTML = '';
	var list = document.getElementById('choose-search');
	// add all songs
	for(var i of store.songs) {
		var song_option = document.createElement('option');
		// add a non-visible space at the end:
   		song_option.value = i.concat(INVISIBLE_SPACE);
   		list.appendChild(song_option);
	}
	for(var i of store.venues) {
		// as above
		var venue_option = document.createElement('option');
		venue_option.value = i.venue.concat(INVISIBLE_SPACE);
		list.appendChild(venue_option);
	}
};

function changeTabView(data_type, data) {
	switch(data_type) {
		case SONGS_TAB:
			updateSongTab(data);
			break;
		case SHOWS_TAB:
			updateShowTab(data);
			break;
		case YEARS_TAB:
			updateYear(data);
			break;
		case VENUES_TAB:
			updateVenueTab(data);
			break;
		default:
			log(`Invalid tab to go to: ${data_type} with data ${data}`);
			return;
	}
	log(`Changing tab to ${data_type}`);
	// set state for history back button
	window.history.pushState(`${data_type}-${data}`, null, '');
	// might be a link from a popout; no harm in hiding if already hidden
	hidePopOut();
	// also need to go to the top of the page
	window.scrollTo(0,0);
	$(data_type).tab('show');
};

function selectMultipleShow(multiple_shows) {
	// we want date and number, i.e. 13th Feb 1970 Show 1
	db_store.show_choices = multiple_shows;
	var date_text = convertDate(multiple_shows[0].date);
	var data = {'show-info-1': `${date_text} Early Show`,
				'show-info-2': `${date_text} Late Show`};
	var template = document.getElementById('choose-show-template').innerHTML;
	var new_html = Mustache.render(template, data);
    document.getElementById('select-song-choice').innerHTML = new_html;
	// modal "choose a show" buttons
	document.getElementById('choose-show-one').addEventListener("click", chooseShowOne);
	document.getElementById('choose-show-two').addEventListener("click", chooseShowTwo);
	$('#select-song-dialog').modal();
};

function chooseShowOne() {
	$('#select-song-dialog').modal('hide');
	if(db_store.show_choices.length == 0) {
		log('Error: Choose show called with no shows');
		return;
	}
	// goto this show
	var show = db_store.show_choices[0];
	db_store.show_choices = [];
	updateShowTab(show);
	$(SHOWS_TAB).tab('show');
};

function chooseShowTwo() {
	$('#select-song-dialog').modal('hide');
	if(db_store.show_choices.length == 0) {
		log('Error: Choose show called with no shows');
		return;
	}
	var show = db_store.show_choices[1];
	db_store.show_choices = [];
	updateShowTab(show);
	$(SHOWS_TAB).tab('show');
};

function checkShowInput(text_input) {
	// return true / false if it was a date
	var actual_date = convertDateOptionFormat(text_input);
	if(actual_date == null) {
		log('No show match')
		return false;
	}
	// we have a date, the next thing is to decide if there's a show on this date
	var show_day = convertFromDate(actual_date);
	// iterate over all dates and store as a list the difference
	var date_diffs = [];
	for(var single_show of store.shows) {
		date_diffs.push([single_show, Math.abs(single_show.date - show_day)]);
	}
	date_diffs.sort((a, b) => (a[1] > b[1]) ? 1 : -1);
	// Find all shows with same date
	var date_matches = [];
	for(var single_diff of date_diffs) {
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
	var int_value = parseInt(text_input);
	if(isNaN(int_value) == false) {
		// could be a year
		if((int_value >= START_YEAR) && (int_value <= END_YEAR)) {
			changeTabView(YEARS_TAB, int_value);
			return;
		}
	}
	if(checkShowInput(text_input) == true) {
		// tab is updated in above function
		return;
	};
	// is this a song?
	for(var s of store.songs) {
		if(s.toLowerCase() == text_input) {
			changeTabView(SONGS_TAB, s);
			return;
		}
	}
	for(var s of store.venues) {
		if(s.venue.toLowerCase() == text_input) {
			changeTabView(VENUES_TAB, s.id);
			return;
		}
	}
	log(`Could not find reference ${text_input}`);
};

function checkNewSong(event) {
	if(event.keyCode == 13) {
		// enter key has been pressed
		// check if song is valid, else do nothing
		var text_input = document.getElementById('search-input').value;
		checkSearchInput(text_input);
		// do not process the form
		return false;
	}
	return true;
};

function checkInput(event) {
	// get last character. Is it the space? Then update and remove
	var input_text = document.getElementById('search-input').value;
	var last_char = input_text.charAt(input_text.length-1);
	if(last_char == INVISIBLE_SPACE) {
		// update the input
		var real_input = input_text.slice(0,-1);
		checkSearchInput(real_input);
		// this will cause this function to fire again, but since there
		// is no space, nothing should happen
		document.getElementById('search-input').value = real_input;
	}
};

function handleLink(link_txt) {
	log(`Going to ${link_txt}`);
	// also check the link is valid
	var link_data = link_txt.split('-');
	var link_tab = link_data[0];
	var link_data = link_data[1];
	if(link_tab == 'show') {
		// it's either a date in the format YYYY/MM/DD, or a single value, the show id
		show_id = link_data.split('/');
		if(show_id.length == 1) {
			changeTabView(SHOWS_TAB, getShowFromId(show_id));
			return;
		}
		// must be in a date format
		var show_date = new Date(parseInt(show_id[0]), parseInt(show_id[1]) - 1, parseInt(show_id[2]));
		changeTabView(SHOWS_TAB, getShowFromDate(show_date));
		return;
	}
	if(link_tab == 'song') {
		changeTabView(SONGS_TAB, link_data);
		return;
	}
	if(link_tab = 'venue') {
		changeTabView(VENUES_TAB, link_data);
	}
};

function interceptClickEvent(event) {
	var href;
    var target = event.target || event.srcElement;
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
	var song_element = document.getElementById('search-input');
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong;
	song_element.addEventListener('input', checkInput);
	// not a fan of the jquery but it works
	// this is to update the data format on the search bar
	$('.dropdown-menu a.dropdown-item').on('click', function(){
		var selected = $(this).text();
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
	window.onpopstate = function (event) {
		if(event.state) {
			var state = event.state;
			log(`Navigating back to ${state}`);
			handleLink(state);
		}
	};
};

function setSongDropdown() {
	updateSearchInputOptions();
	// the other datalist is in the combos tab
	var list = document.getElementById('choose-song-search');
	for(var i of store.songs) {
		var song_option = document.createElement('option');
   		list.appendChild(song_option);
	}
};

document.addEventListener('DOMContentLoaded', function(){
	getData();
	// add events
	addCallbacks();
	// add our first state, which is here
	window.history.pushState(`song-${DEFAULT_SONG}`, null, '');
});
