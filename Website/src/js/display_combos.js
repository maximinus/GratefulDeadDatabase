// these need to be namespaced

class ComboStorage {
    constructor() {
        this.sorted_by_length = [];
        this.played_before = [];
        this.played_after = [];
        this.current_song_title = '';
    };
};

var combo_store = new ChartsStorage();

function updateWithSandwich(song_id, allow_set_split) {

};

function updateAllowSongsBetween(song_ids, allow_set_split) {

};

function updateNoSongsBetween(song_ids, allow_set_split) {
    for(var single_show of store.shows) {
        var test_songs = [];
        if(allow_set_split == false) {
            test_songs.push(single_show.getAllSongs());
        } else {
            test_songs = single_show.sets;
        }
        // look for the match in these
        for(var single_group of test_songs) {

        }
    }
};

function updateComboTab() {
    // actually perform the search
    var songs = [document.getElementById('combo-input1').value,
                 document.getElementById('combo-input2').value,
                 document.getElementById('combo-input3').value];
    // remove all empty strings
    songs = songs.filter((text) => text != '');

    // TODO: validate these songs or show an error

    // turn songs into indexes
    var song_ids = [];
    for(var single_song of songs) {
        song_ids.push(getIndexOfSong(single_song));
    }

    var allow_songs_inbetween = document.getElementById('combo-between-songs-check').checked;
    var allow_set_split = document.getElementById('combo-allow-over-sets').checked;
    if(songs.length == 1) {
        updateWithSandwich(song_ids[0], allow_set_split);
    }
    if(allow_songs_inbetween == true) {
        updateAllowSongsBetween(song_ids, allow_set_split);
    } else {
        updateNoSongsBetween(song_ids, allow_set_split);
    }
};

function comboDefaultChanged() {
    var selected = parseInt(document.getElementById('combo-default').value);
    var songs_selected = [];
    switch(selected) {
        case 1:
            // User switched back to "custom", probably do nothing?
            break;
        case 2:
            songs_selected = ['Scarlet Begonias', 'Fire On The Mountain'];
            break;
        case 3:
            songs_selected = ['China Cat Sunflower', 'I Know You Rider'];
            break;
        case 4:
            songs_selected = ['Help On The Way', 'Slipknot!', "Franklin's Tower"];
            break;
        case 5:
            songs_selected = ['Playing In The Band'];
            break;
        case 6:
            songs_selected = ['Dark Star'];
            break;
        case 7:
            songs_selected = ['The Other One'];
            break;
    }
    if(songs_selected.length == 0) {
        return;
    }
    // place the songs selected into the input boxes
    document.getElementById('combo-input1').value = songs_selected[0];
    if(songs_selected.length > 1) {
        document.getElementById('combo-input2').value = songs_selected[1];
    } else {
        document.getElementById('combo-input2').value = '';
    }
    if(songs_selected.length > 2) {
        document.getElementById('combo-input3').value = songs_selected[2];
    } else {
        document.getElementById('combo-input3').value = '';
    }
    // if only one selected, then it must be a sandwich
    if(songs_selected.length == 1) {
        document.getElementById('combo-between-songs-check').checked = true;
    } else {
        document.getElementById('combo-between-songs-check').checked = false;
    }
    updateComboTab();
};

function popOutComboLongest() {
};

function popOutComboShortest() {
};

function popOutComboFirst() {
};

function popOutComboLast() {
};

function popOutComboBefore() {
};

function popOutComboAfter() {
};

function popOutComboPosition() {
};

function popOutComboPlayed() {
};

function popOutComboAverage() {
};

function initComboTab(song_title) {
    // setup callbacks
    document.getElementById('pop-combo-longest').addEventListener('click', popOutComboLongest);
    document.getElementById('pop-combo-shortest').addEventListener('click', popOutComboShortest);
    document.getElementById('pop-combo-first').addEventListener('click', popOutComboFirst);
    document.getElementById('pop-combo-last').addEventListener('click', popOutComboLast);
    document.getElementById('pop-combo-before').addEventListener('click', popOutComboBefore);
    document.getElementById('pop-combo-after').addEventListener('click', popOutComboAfter);
    document.getElementById('pop-combo-hottest').addEventListener('click', popOutComboPosition);
    // then charts
    document.getElementById('pop-combo-played').addEventListener('click', popOutComboPlayed);
    document.getElementById('pop-combo-average').addEventListener('click', popOutComboAverage);
    // and then the form callbacks
    document.getElementById('combo-default').addEventListener('change', comboDefaultChanged)
};
