import os
import json
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


def get_next_weather():
    # search a year and get the next weather report required
    # For this we need the shows venue to not have nulls on latitude and longitude
    pass


def check_data():
    #all_venues = load_all_venues()
    #check_venue_data(all_venues)
    shows = load_all_shows()
    songs = load_all_songs()
    check_song_names(shows, songs)


if __name__ == '__main__':
    check_data()
