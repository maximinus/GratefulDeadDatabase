// this code should handle displaying and updating the input box

function updateSongInputOptions(options) {
	// clear any current list
	document.getElementById('choose-search').innerHTML = '';
	// add the new options
	var list = document.getElementById('choose-search');
	for (var i of options) {
		var new_option = document.createElement('option');
   		new_option.value = i;
   		list.appendChild(new_option);
	}
};

function checkNewSong(event) {
	if(event.keyCode == 13) {
		// check if song is valid, else do nothing
		var song_name = document.getElementById('search-input').value;
		song_name = song_name.toLowerCase();
		// check this exists
		for(var s of store.songs) {
			if(s.toLowerCase() == song_name) {
				// update the song selection
				log(`Displaying ${s}`);
				updateVisualData(s);
				// make sure the form is not processed
				return false;
			}
		}
		// do not update on bad match
		log(`Could not find song ${s}`);
		return false;
	}
	return true;
};

function addCallbacks() {
	var song_element = document.getElementById('search-input');
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong;
	// not a fan of the jquerym but it works
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
