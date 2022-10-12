import json
import os
from pathlib import Path

from extract.json_objects import PlayedSong, Show, GDSet, Venue

OUTPUT = Path(os.getcwd())
OUTPUT_YEAR_FOLDER =  OUTPUT / 'output' / 'years'


# also need to create all the songs and all the venues
def create_venues():
    pass


def create_songs():
    # load the current songs
    # grab the first
    # sort
    # add song details to dict
    # export
    pass


# The structure of the file is simple, it's a list of shows
def create(year, yml_shows):
    # given a list of yml shows, create the dataset
    venues = {}
    all_shows = []

    file_name = OUTPUT_YEAR_FOLDER / f'{year}.json'

    # convert empty strings into nulls
    for show in yml_shows:
        show.convert_nulls()

    for show in yml_shows:
        # generate the show data
        all_sets = []
        for dead_set in show.sets:
            # this is a yaml.PlayedSong, has self.name and self.segue
            # yes the song class names are the same
            # this will go away when the code is finished
            new_songs = [PlayedSong({'name': x.name, 'segued': x.segue}) for x in dead_set.songs]
            all_sets.append(GDSet({'songs': new_songs, 'encore': False}))
        # construct the show
        data = {'venue': show.full_location, 'weather': None, 'date':show.date.isoformat(),
                'start_time': None, 'end_time': None, 'sets': all_sets, 'show_index': show.show_number}
        all_shows.append(Show(data))

    json_shows = [x.to_json() for x in all_shows]

    # output the json
    filepath = OUTPUT_YEAR_FOLDER / f'{year}.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(json_shows, f, ensure_ascii=False, indent=4)
    print(f'Dumped JSON as {filepath}')


def get_all_venues(yml_shows):
    all_venues = []
    for i in yml_shows:
        if i.full_location not in all_venues:
            all_venues.append(i.full_location)
    # having obtained all venues, we now need create the venue details
    all_venues = []
    for show in all_venues:
        xd = show.split(',')
        venue_data = {'name': xd[0] if xd[0] != '-' else None,
                      'city': xd[1] if xd[1] != '-' else None,
                      'state': xd[2] if xd[2] != '-' else None,
                      'country': xd[3] if xd[3] != '-' else None,
                      'latitude': None,
                      'longitude': None}
        all_venues.append(Venue(venue_data))
