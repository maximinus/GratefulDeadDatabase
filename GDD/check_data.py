import os
import json

from datetime import date
from tqdm import tqdm
from pathlib import Path

from json_objects import Show, PlayedSong, GDSet, Venue, Song

YEARS_FOLDER = Path(os.getcwd()) / 'output' / 'years'
SONGS_FILE = Path(os.getcwd()) / 'output' / 'songs.json'
VENUES_FILE= Path(os.getcwd()) / 'output' / 'venues.json'


# load from json, should be easy
def load_all_shows():
    all_data = []
    print(f'Loading all shows')
    for i in tqdm(range(65, 96)):
        filename = YEARS_FOLDER / f'19{i}.json'
        with open(filename) as fd:
            json_data = json.load(fd)
        for j in json_data:
            all_data.append(Show(j))
    return all_data


def load_all_songs():
    with open(SONGS_FILE) as fd:
        json_data = json.load(fd)
    all_songs = [Song(x) for x in json_data['songs']]
    return all_songs


def load_all_venues():
    with open(VENUES_FILE) as f:
        venues = json.load(f)
    venues = [Venue(x) for x in venues]
    print(f'Loaded {len(venues)} venues')
    return venues


def check_venue_data(venues):
    # check strings are not '-' or of len <3 for name and city
    # check strings are not '-' or len 0 for state and country
    for i in venues:
        if i.name is not None:
            if i.name == '-' or len(i.name) < 3:
                print(f'Error in name: {i}')
                raise ValueError
        if i.city is not None:
            if i.city == '-' or len(i.city) < 3:
                print(f'Error in city: {i}')
                raise ValueError
        if i.state is not None:
            if i.state == '-':
                print(f'Error in state: {i}')
                raise ValueError
        if i.country is None:
            # this is not possible, since all non-US shows are accounted for
            print(f'Error in country: {i}')
            raise ValueError
    return


def check_song_names(shows, songs):
    # grab all string names and put into an array
    all_names = [x.name for x in songs]
    # make sure all of them are found
    count = 0
    for show in shows:
        for single_set in show.sets:
            for played in single_set.songs:
                count += 1
                # this is a PlayedSong
                if played.name not in all_names:
                    raise ValueError(f'Could not find song named {played.name}')
    print(f'All {count} songs ok')


def check_show_venues(venues, shows):
    # each show should have a venue that exists
    venue_names = [str(x) for x in venues]
    count = 0
    missing = 0
    for show in shows:
        if show.venue not in venue_names:
            if missing == 0:
                print('Shows with missing venues')
            print(f'  {show.date}, {show.venue}')
            missing += 1
        count += 1
    print(f'{count} shows, {missing} missing venues')


def check_all_venues_used(venues, shows):
    # check to ensure that all venues in the list of venues are used
    # let's get a list of all these venues in a hash, and mark as "unused"
    venues_used = {}
    for i in venues:
        venues_used[str(i)] = False
    for i in shows:
        if i.venue not in venues_used:
            print(f'  Error: Venue {i.venue} not found')
            return
        venues_used[i.venue] = True
    # grab all the false ones!
    unused_venues = []
    for key, used in venues_used.items():
        if not used:
            unused_venues.append(key)
    if len(unused_venues) == 0:
        print('  No unused venues')
        return
    print(f'{len(unused_venues)} unused venues')
    for i in unused_venues:
        print(i)


def get_next_weather():
    # search a year and get the next weather report required
    # For this we need the shows venue to not have nulls on latitude and longitude
    pass


def check_data():
    venues = load_all_venues()
    #check_venue_data(venues)
    shows = load_all_shows()
    #songs = load_all_songs()
    #check_song_names(shows, songs)
    check_show_venues(venues, shows)


def get_show_venue_string():
    venues = load_all_venues()
    while True:
        name = input('City name? ')
        if name == 'exit':
            return
        for i in venues:
            if i.city.lower() == name.lower():
                print(f'  {str(i)}')


def view_setlist():
    shows = load_all_shows()
    while True:
        print('Please enter a date as YY-MM-DD, or exit')
        chosen_date = input('? ')
        if chosen_date == 'exit':
            return
        try:
            actual_date = date.fromisoformat(f'19{chosen_date}')
            for i in shows:
                if i.date == actual_date:
                    print(f'{i}\n')
                    break
        except ValueError:
            print(f'  Error: Date {chosen_date} is not valid')


def check_venues():
    shows = load_all_shows()
    venues = load_all_venues()
    check_venue_data(venues)
    check_show_venues(venues, shows)
    check_all_venues_used(venues, shows)


def what_to_do():
    print('Please choose:')
    print('  1: See a setlist')
    print('  2: Check all venues match shows')
    print('  3: Get all venues in a city')
    print('  0: Exit')
    while True:
        answer = input('? ')
        try:
            answer = int(answer)
            if answer == 0:
                return
            if answer == 1:
                return view_setlist()
            elif answer == 2:
                return check_venues()
            elif answer == 3:
                return get_show_venue_string()
            print('Invalid answer, please enter a number')
        except ValueError:
            print('Answer must be a number')


if __name__ == '__main__':
    what_to_do()
