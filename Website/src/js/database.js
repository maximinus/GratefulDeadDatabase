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

function checkSearchInput(text_input) {
	text_input = text_input.toLowerCase();
	// is this a year?
	var int_value = parseInt(text_input);
	if(int_value != NaN) {
		// could be a year
		if((int_value >= START_YEAR) && (int_value <= END_YEAR)) {
			log(`Displaying year ${int_value}`);
			return;
		}
	}
	// TODO: Is this a show?
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
