import { $ } from 'jquery'
import { Mustache } from 'mustache'

import { updateSongTab } from './song_page'
import { updateShowTab } from './show_page'
import { updateYear } from './year_page'
import { updateVenueTab } from './venue_page';
import { store, getData } from "./database";
import { logger } from './logger';

import * as gd from './constants'
import * as api from './store_api'
import * as helpers from './helpers'
import * as html_helpers from './html_helpers'


// script where code is first run

const INVISIBLE_SPACE = '\u200b';


function updateSearchInputOptions(): void {
	// clear any current list
	document.getElementById('choose-search').innerHTML = ''
	let list = document.getElementById('choose-search')
	// add all songs
	for(let i of store.songs) {
		let song_option = document.createElement('option')
		// add a non-visible space at the end:
   		song_option.value = i.concat(INVISIBLE_SPACE)
   		list.appendChild(song_option)
	}
	for(let i of store.venues) {
		// as above
		let venue_option = document.createElement('option')
		venue_option.value = i.venue_name.concat(INVISIBLE_SPACE)
		list.appendChild(venue_option)
	}
}

function changeTabView(data_type: string, data: any): void {
	// TODO: THIS FUNCTION SHOULD BE DELETED
	// we instead change the state of the url and catch it in the callback
	let url_string = ''
	switch(data_type) {
		case gd.SONGS_TAB:
			updateSongTab(data)
			url_string = `#song-${helpers.songNametoSlug(data)}`
			break
		case gd.SHOWS_TAB:
			updateShowTab(data)
			url_string = `#show-${helpers.dateToSlug(data.js_date)}`
			break
		case gd.YEARS_TAB:
			updateYear(data)
			url_string = `#year-${data}`
			break
		case gd.VENUES_TAB: {
			updateVenueTab(data)
			let venue = api.getVenue(data)
			url_string = `#venue-${venue.getSlug()}`
			break
		}
		case gd.ABOUT_TAB:
			url_string = '#about'
			break
		default:
			logger(`Invalid tab to go to: ${data_type} with data ${data}`)
			return
	}
	// set state for history back button
	window.history.pushState(url_string, null, url_string)
	// might be a link from a popout; no harm in hiding if already hidden
	html_helpers.hidePopOut()
	// also need to go to the top of the page
	window.scrollTo(0,0)
	$(data_type).tab('show')
}

function selectMultipleShow(multiple_shows: any): void {
	// we want date and number, i.e. 13th Feb 1970 Show 1
	store.show_choices = multiple_shows;
	let date_text = helpers.convertDate(multiple_shows[0].date)
	let data = {'show-info-1': `${date_text} Early Show`,
				'show-info-2': `${date_text} Late Show`}
	let template = document.getElementById('choose-show-template').innerHTML
	let new_html = Mustache.render(template, data)
    document.getElementById('select-song-choice').innerHTML = new_html
	// modal "choose a show" buttons
	document.getElementById('choose-show-one').addEventListener("click", chooseShowOne)
	document.getElementById('choose-show-two').addEventListener("click", chooseShowTwo)
	$('#select-song-dialog').modal()
}

function chooseShowOne(): void {
	$('#select-song-dialog').modal('hide');
	if(store.show_choices.length == 0) {
		logger('Error: Choose show called with no shows')
		return
	}
	// goto this show
	let show = store.show_choices[0]
	store.show_choices = []
	updateShowTab(show)
	$(gd.SHOWS_TAB).tab('show')
}

function chooseShowTwo(): void {
	$('#select-song-dialog').modal('hide')
	if(store.show_choices.length == 0) {
		logger('Error: Choose show called with no shows')
		return
	}
	let show = store.show_choices[1]
	store.show_choices = []
	updateShowTab(show)
	$(gd.SHOWS_TAB).tab('show')
}

function checkShowInput(text_input: string): boolean {
	// return true / false if it was a date
	let actual_date = helpers.convertDateOptionFormat(text_input);
	if(actual_date == null) {
		logger('No show match')
		return false
	}
	// we have a date, the next thing is to decide if there's a show on this date
	let show_day = helpers.convertFromDate(actual_date)
	// iterate over all dates and store as a list the difference
	let date_diffs = []
	for(let single_show of store.shows) {
		date_diffs.push([single_show, Math.abs(single_show.date - show_day)])
	}
	date_diffs.sort((a, b) => (a[1] > b[1]) ? 1 : -1)
	// Find all shows with same date
	let date_matches = []
	for(let single_diff of date_diffs) {
		if(single_diff[1] == 0) {
			date_matches.push(single_diff[0])
		} else {
			break
		}
	}
	if(date_matches.length == 1) {
		// easy, one single match
		changeTabView(gd.SHOWS_TAB, date_matches[0])
		return true;
	}
	if(date_matches.length > 1) {
		selectMultipleShow(date_matches)
		return true
	}
	// otherwise, no match
	return false
}

function checkSearchInput(text_input: string): void {
	text_input = text_input.toLowerCase()
	// is this a year?
	let int_value = parseInt(text_input)
	if(isNaN(int_value) === false) {
		// could be a year
		if((int_value >= gd.START_YEAR) && (int_value <= gd.END_YEAR)) {
			changeTabView(gd.YEARS_TAB, int_value)
			return
		}
	}
	if(checkShowInput(text_input) === true) {
		// tab is updated in above function
		return
	}
	// is this a song?
	for(let s of store.songs) {
		if(s.toLowerCase() == text_input) {
			changeTabView(gd.SONGS_TAB, s)
			return;
		}
	}
	for(let s of store.venues) {
		if(s.venue_name.toLowerCase() == text_input) {
			changeTabView(gd.VENUES_TAB, s.id)
			return
		}
	}
	logger(`Could not find reference ${text_input}`);
}

function checkNewSong(event: KeyboardEvent) {
	if(event.keyCode == 13) {
		// enter key has been pressed
		// check if song is valid, else do nothing
		let text_input = (<HTMLInputElement>document.getElementById('search-input')).value
		checkSearchInput(text_input)
		// do not process the form
		return false
	}
	return true
}

function checkInput(event: KeyboardEvent): void {
	// get last character. Is it the space? Then update and remove
	let input_text = (<HTMLInputElement>document.getElementById('search-input')).value
	let last_char = input_text.charAt(input_text.length-1)
	if(last_char == INVISIBLE_SPACE) {
		// update the input
		let real_input = input_text.slice(0,-1)
		// TODO: Understand this error
		checkSearchInput(real_input)
		// this will cause this function to fire again, but since there
		// is no space, nothing should happen
		(<HTMLInputElement>document.getElementById('search-input')).value = real_input
	}
}

function handleLink(link_txt: string): void {
	// this is function that is called whenever we want to navigate or update
	// the link_txt has several forms:
	// #song-{song_name_slug}
	// #venue-{venue_name_slug}
	// #year-{year_as_YYYY}
	// #show-{show_date_slug}/{number}
	// #about
	console.log(`Going to ${link_txt}`)
	// also check the link is valid
	let link_data = link_txt.split('-')
	if(link_data.length < 2) {
		logger(`Link error. Got ${link_txt}`)
		return
	}
	let link_tab = link_data[0]
	let link_data_string = link_data[1]
	if(link_tab == 'show') {
		// it's either a date in the format YYYY/MM/DD, or a single value, the show id
		let show_id = link_data_string.split('/')
		if(show_id.length == 1) {
			changeTabView(gd.SHOWS_TAB, api.getShowFromId(show_id))
			return
		}
		// must be in a date format
		let show_date = new Date(parseInt(show_id[0]), parseInt(show_id[1]) - 1, parseInt(show_id[2]))
		changeTabView(gd.SHOWS_TAB, api.getShowFromDate(show_date))
		return
	}
	if(link_tab == 'song') {
		changeTabView(gd.SONGS_TAB, link_data_string)
		return
	}
	if(link_tab == 'venue') {
		changeTabView(gd.VENUES_TAB, link_data_string)
		return
	}
	if(link_tab == 'year') {
		changeTabView(gd.YEARS_TAB, link_data)
		return
	}
	if(link_tab == 'about') {
		changeTabView(gd.ABOUT_TAB, '')
	}
}

function interceptClickEvent(event: any): void {
    let target = event.target || event.srcElement
    if (target.tagName === 'A') {
        let href = target.getAttribute('href')
		if(href.startsWith('#gdd')) {
			handleLink(href.slice(5))
			// tell the browser not to act on this
           	event.preventDefault()
        }
    }
}

function addCallbacks(): void {
	let song_element = document.getElementById('search-input')
	// prevent enter key when song selection is not complete
	song_element.onkeydown = checkNewSong
	song_element.addEventListener('input', checkInput)
	// not a fan of the jquery but it works
	// this is to update the data format on the search bar
	$('.dropdown-menu a.dropdown-item').on('click', function() {
		let selected = $(this).text()
		document.getElementById('data-format-dropdown').textContent = selected
		if(selected == 'MM-DD-YY') {
			store.options.date_format = gd.DATE_FORMAT_MMDDYY
			return
		}
		if(selected == 'DD-MM-YY') {
			store.options.date_format = gd.DATE_FORMAT_DDMMYY
			return
		}
		if(selected == 'YY-MM-DD') {
			store.options.date_format = gd.DATE_FORMAT_YYMMDD
		}
	})
	// intercept all clicks, to catch link clicks
	if (document.addEventListener) {
    	document.addEventListener('click', interceptClickEvent)
	} else if (document.attachEvent) {
    	document.attachEvent('onclick', interceptClickEvent)
	}
	// intercept all browser back events
	window.onpopstate = function (event) {
		if(event.state) {
			let state = event.state
			logger(`Navigating back to ${state}`)
			handleLink(state)
		}
	}
}

function setSongDropdown(): void {
	updateSearchInputOptions()
	// the other datalist is in the combos tab
	let list = document.getElementById('choose-song-search')
	for(let _i of store.songs) {
		let song_option = document.createElement('option')
   		list.appendChild(song_option)
	}
}

document.addEventListener('DOMContentLoaded', function(){
	getData();
	// add events
	addCallbacks();
	// we may have a state already, in which case deal with it
	// add our first state, which is here
	let start_url = `#songs-tab-${helpers.songNametoSlug(gd.DEFAULT_SONG)}`
	window.history.pushState(start_url, null, start_url);
})
