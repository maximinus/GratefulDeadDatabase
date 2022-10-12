import os
import json
from pathlib import Path

from json_objects import Show, PlayedSong, GDSet, Venue

JSON_DIR = Path(os.getcwd()) / 'output' / 'years'


# load from json, should be easy
def load_all_shows():
    all_data = []
    for i in range(65, 96):
        filename = JSON_DIR / f'19{i}.json'
        print(f'Loading {filename}')
        with open(filename) as fd:
            json_data = json.load(fd)
        for j in json_data:
            all_data.append(Show(j))
    return all_data


def load_all_songs():
    pass


def load_all_venues():
    with open('output/venues.json') as f:
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


def check_song_names():
    pass


def get_next_weather():
    # search a year and get the next weather report required
    # For this we need the shows venue to not have nulls on latitude and longitude
    pass


if __name__ == '__main__':
    all_venues = load_all_venues()
    check_venue_data(all_venues)
