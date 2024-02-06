import sys
from datetime import date
from enum import Enum

from pathlib import Path
from Levenshtein import distance

from src.database_helpers import get_all_songs, get_single_show


def get_pauls_songs():
    with open('./database/pauls_data/converted_songs.txt') as file:
        lines = [line.rstrip() for line in file]
    return [x.split(',') for x in lines]


class MatchedSong:
    def __init__(self, pname, song):
        self.pname = pname
        self.song = song


def get_all_matched_songs():
    psongs = get_pauls_songs()
    db_songs = get_all_songs()
    matched = []
    for i in psongs:
        for j in db_songs:
            if i[2] == j.name:
                matched.append(i[0], j)
    return matched


MATCHED_SONGS = get_all_matched_songs()


def get_single_song(pname):
    for i in MATCHED_SONGS:
        if i.pname == pname:
            return i
    return None


def get_closest_name(name_list, wanted):
    best_score = 50000
    best_match = ''
    for i in name_list:
        dist = distance(i.name, wanted)
        if dist < best_score:
            best_score = dist
            best_match = i
    return [best_match, best_score]


def match_all_names(names):
    my_names = get_all_songs()
    all_matches = []
    for name in names:
        pauls_name = name[1]
        best_match = get_closest_name(my_names, pauls_name)
        all_matches.append([name[0], pauls_name, best_match[0], best_match[1]])
    return all_matches


def get_all_names():
    lines = []
    with open(Path.cwd() / 'database' / 'pauls_data' / 'songnames.txt') as file:
        lines = [line.rstrip() for line in file]
    titles = []
    for i in lines:
        split_data = [i[:5].strip(), i[5:]]
        if split_data[0] != 'info':
            titles.append(split_data)
    return titles


def convert():
    names = get_all_names()
    matches = match_all_names(names)
    return matches

#----
# code to get the shows
#----


def error(message):
    print(f'Error: {message}')
    sys.exit(False)


def get_date(date_text):
    try:
        year = int(date_text[0:2]) + 1900
        month = int(date_text[2:4])
        day = int(date_text[4:6])
        return date(year, month, day)
    except ValueError:
        error(f'{date_text} in invalid date')


def get_show_index(index):
    if index == ' ':
        return 0
    # must be a letter, from a onwards?
    return ord(index.lower()) - ord('a')


def get_song(song_text):
    return song_text.rstrip()


def get_transition(trans_text):
    if trans_text == ' ':
        return False
    if trans_text == '>':
        return True
    error(f'Transition type {trans_text} unknown')


def get_length(length_text):
    # if empty, there is no time: return -1
    if length_text == '     ':
        return -1
    data = length_text.split(':')
    if len(data) != 2:
        error(f'Time of {length_text} is invalid')
    try:
        minutes = int(data[0])
        seconds = int(data[1])
        return (minutes * 60) + seconds
    except ValueError:
        error(f'Time of {length_text} is invalid')


class CutType(Enum):
    NO_CUT = 0
    PARTIAL_CUT = 1
    MAJOR_CUT = 2


def get_cut_details(cut_text):
    # 'P' partial=minor cut in song; 'X' major cut in song
    if cut_text == 'P':
        return CutType.PARTIAL_CUT
    if cut_text == 'X':
        return CutType.MAJOR_CUT
    return CutType.NO_CUT


class SingleSong:
    def __init__(self, line, line_number):
        # format is this, minus 6 since we start at YYMMDD
        # 6-11 YYMMDD space
        # 12 alphabetic sequence within day if more than one show
        # 13-14 set within show
        # 15-18  song
        # 19 ' ' or ' >' transition to next song
        # 20-24 length of sound file, MM:SS
        # 25 'P' partial=minor cut in song; 'X' major cut in song
        # 26 'O' on official release
        # 27 'Δ' in .odt gets converted to '?' by python extract, Donna alert
        # 28 'G' guest artist
        self.date = get_date(line[0:6])
        self.show_index = get_show_index(line[6])
        self.set_index = int(line[7])
        self.song = get_song(line[10:14])
        self.song_index = line_number
        self.transition = get_transition(line[14])
        self.length_in_seconds = get_length(line[15:20])
        self.cut = get_cut_details(line[21])
        #self.official_release
        #self.donna
        #self.guest

    def __repr__(self):
        return f'{self.date.isoformat()}, Show #{self.show_index}, Set#{self.set_index}, {self.song}'


class SingleSet:
    def __init__(self, songs):
        # order songs by index
        songs.sort(key=lambda x: x.song_index)
        self.songs = songs

    def display(self):
        for i in self.songs:
            print(f'  {i.song}')

    def __repr__(self):
        song_texts = [x.song for x in self.songs]
        return ' / '.join(song_texts)


class SingleShow:
    def __init__(self, all_songs):
        # sort into sets. No show has more than 5 sets
        self.date = all_songs[0].date
        self.show_sets = self.get_sets(all_songs)

    def get_sets(self, all_songs):
        all_sets = []
        for i in range(10):
            all_sets.append([])
        for i in all_songs:
            all_sets[i.set_index].append(i)
        # remove all empty sets
        all_sets = filter(lambda x: (len(x) != 0), all_sets)
        return [SingleSet(x) for x in all_sets]

    def display(self):
        index = 1
        print(self.date.isoformat())
        for i in self.show_sets:
            print(f'Set #{index}: {i}')
            index += 1


def load_file(filename):
    data = []
    with open(filename, 'r') as f:
        line_number = 0
        for line in f:
            # ignore if not GD
            line = line.rstrip()
            if line.endswith('GD'):
                data.append(SingleSong(line, line_number))
            line_number += 1
    return data


def sort_into_dates(song_data):
    show_buckets = {}
    for i in song_data:
        if i.date in show_buckets:
            show_buckets[i.date].append(i)
        else:
            show_buckets[i.date] = [i]
    all_shows = []
    for _, value in show_buckets.items():
        all_shows.append(SingleShow(value))
    return all_shows


def match_single_show(pshow):
    # pshow is a SingleShow
    matched_show = get_single_show(pshow.date)
    # this is some list
    if len(matched_show) < 1:
        print(f'No match for {pshow.date}')
        return False
    return True


if __name__ == '__main__':
    psongs = get_pauls_songs()
    line_data = load_file('./database/pauls_data/XREF20FILE.txt')
    shows = sort_into_dates(line_data)
    total_matched = 0
    for i in shows:
        if match_single_show(i) is True:
            total_matched += 1
        else:
            i.display()
