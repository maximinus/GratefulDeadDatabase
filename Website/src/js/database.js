// this code should handle displaying and updating the input box

const INVISIBLE_SPACE = '\u200b';

function updateSongInputOptions(options) {
	// clear any current list
	document.getElementById('choose-search').innerHTML = '';
	// add the new options
	var list = document.getElementById('choose-search');
	for (var i of options) {
		var new_option = document.createElement('option');
		// add a non-visible space at the end:
   		new_option.value = i.concat(INVISIBLE_SPACE);
   		list.appendChild(new_option);
	}
};

function updateAndGoShow(show) {
	// passed a show, update the tab and go to it
	updateShowTab(show);
	$('#shows-tab').tab('show');
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
		// easy, one single match, display it
		updateAndGoShow(date_matches[0]);
		return true;
	}
	if(date_matches.length > 1) {
		log('TODO: Allow user to choose between 2 shows');
		return true;
	}
	// otherwise, error
	return false;
};

function checkSearchInput(text_input) {
	text_input = text_input.toLowerCase();
	// is this a year?
	var int_value = parseInt(text_input);
	if(isNaN(int_value) == false) {
		// could be a year
		if((int_value >= START_YEAR) && (int_value <= END_YEAR)) {
			log(`Displaying year ${int_value}`);
			return;
		}
	}
	if(checkShowInput(text_input) == true) {
		return;
	};
	// is this a song?
	for(var s of store.songs) {
		if(s.toLowerCase() == text_input) {
			// update the song selection
			log(`Displaying song ${s}`);
			updateVisualData(s);
			return;
		}
	}
	// TODO: Is this a venue?
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

function addCallbacks() {
	var song_element = document.getElementById('search-input');
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong;
	song_element.addEventListener('input', checkInput);
	// not a fan of the jquery but it works
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
};

function setSongDropdown() {
	updateSongInputOptions(store.songs);
};

document.addEventListener("DOMContentLoaded", function(){
	getData();
	// add events
	addCallbacks();
});
