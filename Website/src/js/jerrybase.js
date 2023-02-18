// this code should handle displaying and updating the input box

function updateSongInputOptions(options) {
	// clear any current list
	document.getElementById('choose-song').innerHTML = '';
	// add the new options
	var list = document.getElementById('choose-song');
	for (var i of options) {
		var new_option = document.createElement('option');
   		new_option.value = i;
   		list.appendChild(new_option);
	}
};

function checkNewSong(event) {
	if(event.keyCode == 13) {
		// check if song is valid, else do nothing
		var song_name = document.getElementById('song-input').value;
		song_name = song_name.toLowerCase();
		// check this exists
		for(var s of songs) {
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
	var song_element = document.getElementById('song-input');
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong;
};

function setSongDropdown() {
	updateSongInputOptions(songs);
};

document.addEventListener("DOMContentLoaded", function(){
	// TODO: Confirm this waits until all JSON files are loaded
	getData();
	setSongDropdown();
	// add events
	addCallbacks();
});
