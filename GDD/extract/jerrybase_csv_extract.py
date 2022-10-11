import csv
from tqdm import tqdm
from datetime import date


DATA_FOLDER = 'jerrybase'
JB_DATA = f'{DATA_FOLDER}/jerrybase_copy.csv'


class JBSong:
    def __init__(self, row):
        # row comes in as a list
        self.original = row
        # as YYYY-MM-DD
        self.event_date = row[1]
        # gives us an int
        self.show_number = int(row[2].split('-')[-1]) - 1
        self.song_name = row[6]
        self.song_id = row[7]
        self.sequence_number = int(row[8])
        self.set_name = row[4]
        self.set_sequence_number = int(row[5])

    def resequence(self):
        # build the original row with new data
        # used for creating the original csv for a diff
        self.original[1] = self.event_date
        self.original[5] = str(self.set_sequence_number)
        self.original[6] = self.song_name
        self.original[7] = self.song_id
        self.original[8] = str(self.sequence_number)
        return ','.join(self.original)

    def as_json(self):
        data = {'original':self.original,
                'event_date':self.event_date,
                'song_name':self.song_name,
                'song_id':self.song_id,
                'sequence_number':self.sequence_number,
                'set_name':self.set_name,
                'set_sequence_number':self.set_sequence_number}
        return data

    @staticmethod
    def from_json(self, data):
        original = data.original
        return JBSong(original)

    def __repr__(self):
        return f'<JBSong: {self.song_name}>'


class JBShow:
    def __init__(self, show_date, songs):
        # show_date is something like 1970-01-02:0
        sh = show_date.split(':')
        times = [int(x) for x in sh[0].split('-')]
        self.date = date(times[0], times[1], times[2])
        self.show_number = int(sh[1])
        self.text_date = show_date
        self.songs = songs

    def __repr__(self):
        return f'<JBShow: {self.text_date}>'


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
        for key, value in all_sets.items():
            songs_sorted = sorted(value, key=lambda x: x.sequence_number, reverse=False)
            final_order[key] = songs_sorted
        return final_order

    def print(self):
        for key, value in self.sets.items():
            print(f'Set #{key}:')
            for s in value:
                print(f'  {s.song_name}')

    def get_ordered(self):
        # return a list of objects [set_number, song] in song order
        new_order = []
        key_list = list(self.sets.keys())
        key_list.sort()
        # force sets to go 1, 2, 3 etc
        set_index = 1
        for set_key in key_list:
            for new_song in self.sets[set_key]:
                new_order.append([set_index, new_song.song_name])
            set_index += 1
        return(new_order)


def extract_data() -> list:
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
        # add show number to form a string
        show_entry = f'{i.event_date}:{i.show_number}'
        if show_entry in shows:
            shows[show_entry].append(i)
        else:
            shows[show_entry] = [i]
    all_shows = []
    for key, value in shows.items():
        all_shows.append(JBShow(key, value))
    return all_shows


def store_as_json():
    # TODO: Really needed? manual was quite fast
    # easier with json for machine editing
    # a JBSong() (we get a list from extract_data()) can rebuild a row
    all_data = extract_data()
    as_json = [x.as_json() for x in all_data]
    for i in as_json:
        print(i)


if __name__ == '__main__':
    store_as_json()
    #gd_shows = sort_into_shows()
    #for i in gd_shows:
    #    print(i)
    #print(len(gd_shows))
