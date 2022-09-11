import sys
import csv
from tqdm import tqdm
from datetime import date


DATA_FOLDER = 'jerrybase'
JB_DATA = f'{DATA_FOLDER}/jerrybase.csv'


class JBSong:
    def __init__(self, row):
        # as YYYY-MM-DD
        self.event_date = row[1]
        self.song_name = row[6]
        self.song_id = row[7]
        self.sequence_number = int(row[8])
        self.set_name = row[4]
        self.set_sequence_number = int(row[5])

    #def __repr__(self):
    #    return self.song_name


class JBShow:
    def __init__(self, show_date, songs):
        times = [int(x) for x in show_date.split('-')]
        self.date = date(times[0], times[1], times[2])
        self.text_date = show_date
        self.songs = songs

    #def __repr__(self):
    #    return self.text_date


class CompleteShow:
    # break down a JBShow into sets in the right order etc...
    # we need a date, a list of sets and then the songs in the sets
    def __init__(self, jb_show):
        self.sets = self.sort_sets(jb_show)

    def sort_sets(self, jb_show):
        all_sets = {}
        for i in jb_show.songs:
            if i.set_sequence_number in all_sets:
                all_sets[i.set_sequence_number].append(i)
            else:
                all_sets[i.set_sequence_number] = [i]

        # sort all inner sets by song order
        final_order = {}
        for key, value in  all_sets.items():
            print([x.sequence_number for x in value])
            songs_sorted = sorted(value, key=lambda x: x.sequence_number, reverse=False)
            final_order[key] = songs_sorted
        return final_order

    def print(self):
        for key, value in self.sets.items():
            print(f'Set #{key}:')
            for s in value:
                print(f'  {s.song_name}')


def extract_data():
    songs = []
    with open(JB_DATA, 'r') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        first = True
        for row in tqdm(csv_reader):
            if first:
                names = row
                first = False
            else:
                if 'grateful dead' in row[0].lower():
                    # ignore non-show tunes
                    if row[4].lower() not in ['session', 'soundcheck']:
                        songs.append(JBSong(row))
    return songs


def get_songs(songs):
    song_names = []
    for i in songs:
        if i.song_name not in song_names:
            song_names.append(i.song_name)
    song_names.sort()
    return song_names


def sort_into_shows():
    songs = extract_data()
    # sort into buckets
    shows = {}
    for i in songs:
        if i.event_date in shows:
            shows[i.event_date].append(i)
        else:
            shows[i.event_date] = [i]
    all_shows = []
    for key, value in shows.items():
        all_shows.append(JBShow(key, value))
    return all_shows


if __name__ == '__main__':
    gd_shows = sort_into_shows()
    for i in gd_shows:
        print(i)
    print(len(gd_shows))
