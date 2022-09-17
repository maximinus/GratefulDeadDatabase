import json
from enum import Enum

from gdshowsdb_yaml_extract import extract_year
from jerrybase_csv_extract import sort_into_shows, CompleteShow

ALL_SONGS = []
with open('output/matched_songs.json', 'r') as f:
    ALL_SONGS = json.load(f)


class TResult(Enum):
    SET_MISMATCH = 1
    SONG_MISMATCH = 2
    LENGTH_MISMATCH = 3
    OK = 4


def get_cvs_song(song_title):
    for i in ALL_SONGS:
        if i[1] == song_title:
            return i


def get_same_date(main_date, shows):
    for i in shows:
        if main_date == i.date:
            return i


def compare_shows(year):
    yml_shows = extract_year(year)
    all_csv = sort_into_shows()

    csv_shows = []
    for i in all_csv:
        if i.date.year == year:
            csv_shows.append(i)

    # now match the shows. They should have the same date
    matched = []
    unmatched = []
    for i in yml_shows:
        m = get_same_date(i.date, csv_shows)
        if m is not None:
            matched.append([i, CompleteShow(m)])
        else:
            unmatched.append(i)

    # get the shows that didn't match
    csv_unmatched_shows = []
    for i in csv_shows:
        m = get_same_date(i.date, yml_shows)
        if m is None:
            csv_unmatched_shows.append(i)

    if len(unmatched) != 0:
        print('Yaml shows not in CSV:')
        for i in unmatched:
            print(f'  {i.date}')

    if len(csv_unmatched_shows) != 0:
        print('CSV shows not in Yaml:')
        for i in csv_unmatched_shows:
            print(f'  {i.date}')

    return matched


def songs_equal(yml_text, csv_text):
    for i in ALL_SONGS:
        if yml_text == i[0]:
            if csv_text == i[1]:
                return True
            return False
    return False


def yml_song_exists(song_name):
    for i in ALL_SONGS:
        if i[0] == song_name:
            return True
    return False


def csv_song_exists(song_name):
    for i in ALL_SONGS:
        if i[1] == song_name:
            return True
    return False


def confirm_all_songs(yml_clean, csv_clean):
    for i in yml_clean:
        if not yml_song_exists(i[1]):
            print(f'No song {i} in YAML data')
            raise ValueError
    for i in csv_clean:
        if not csv_song_exists(i[1]):
            print(f'No song {i} in CSV data')
            raise ValueError


def shows_are_equal(yml_show, csv_show):
    # get in a nice format
    clean_yml = yml_show.get_ordered()
    clean_csv = csv_show.get_ordered()
    # same length?
    if len(clean_yml) != len(clean_csv):
        print('Different length')
        return TResult.LENGTH_MISMATCH
    # so go down both at the same time
    index = 0
    for y, c in zip(clean_yml, clean_csv):
        # sets are the same?
        if y[0] != c[0]:
            print(f'Set mis-match at {index}: {y[0]}, {c[0]}')
            return TResult.SET_MISMATCH
        if not songs_equal(y[1], c[1]):
            print(f'Song {index} not the same: "{y[1]}", "{c[1]}"')
            return TResult.SONG_MISMATCH
        index += 1
    print(f'All matched, {len(clean_yml)} songs')
    return TResult.OK


def get_matched_song_from_yml(song_name):
    for i in ALL_SONGS:
        if i[0] == song_name:
            return i
    # this should never happen
    print(f'Failed to find {song_name} in yml')
    raise ValueError


def solve_song_mismatch(last, yml_clean, csv_clean, i):
    # ask the user what to do
    # maybe prefer manual, because speed was not too slow and easier to spot mistakes
    print(f'       {last}')
    print(f'Error: Y: {yml_clean[i][1]} : C: {csv_clean[i][1]}')
    print('Solve by:')
    print('  1: Yaml is correct')
    print('  2: Csv is correct')
    answer = -1
    while answer < 0:
        answer = input('> ')
        try:
            answer = int(answer)
            if answer < 1 or answer > 2:
                print('* Error')
                answer = -1
        except ValueError:
            answer = -1
            print('* Error')
    if answer == 1:
        pass
    if answer == 2:
        pass


def show_len_mismatch(yml_clean, csv_clean):
    # go through the list and show where they do not m1atch
    max_length = min(len(yml_clean), len(csv_clean))
    # we've already checked the songs exist, so just find the mismatch
    last = 'Start : Start'
    for i in range(max_length):
        # the songs should be the same
        songs = get_matched_song_from_yml(yml_clean[i][1])
        if songs[1] != csv_clean[i][1]:
            # the match is not correct
            # solve_song_mismatch(last, yml_clean, csv_clean, i)
            print(f'       {last}')
            print(f'Error: Y: {yml_clean[i][1]} : C: {csv_clean[i][1]}')
            raise ValueError
        else:
            last = f'Y: {songs[0]} : C: {songs[1]}'


def confirm_songs_match(yml_clean, csv_clean):
    # the lengths are equal
    for y, c in zip(yml_clean, csv_clean):
        yml_song = get_matched_song_from_yml(y[1])
        if yml_song[1] != c[1]:
            print(f'Mis-match in songs: {y}, {c}')
            raise ValueError


def confirm_sets_match(yml_clean, csv_clean):
    for y, c in zip(yml_clean, csv_clean):
        # just check values are equal
        if y[0] != c[0]:
            print(f'Set mis-match: {y}, {c}')
            raise ValueError


def fix_yaml_show(yml_show, csv_show):
    # is yml empty and csv not?
    # WE NEED EDIT THE ORIGINAL FILES ON EVERY ITERATION
    # We always seek to edit the yaml files, that is the goal to improve
    # Therefore, we need to be able to export out as yaml at some point

    # we need the originals to fully build new yaml
    yml_clean = yml_show.get_ordered()
    csv_clean = csv_show.get_ordered()

    # confirm all songs exist
    confirm_all_songs(yml_clean, csv_clean)

    if (len(yml_clean) + len(csv_clean)) == 0:
        # both shows empty, so the yml is fine
        return yml_show

    if len(yml_clean) == 0 and len(csv_clean) != 0:
        # Empty YAML and non-empty CSV, so convert
        yml_show.songs_from_csv_clean(csv_clean, ALL_SONGS)
        print('  Converted empty sets')
        return yml_show

    if yml_show.check_drums_space(csv_clean):
        yml_clean = yml_show.get_ordered()

    # an error of length that is NOT zero cannot be fixed automatically
    # however we should show the show, area and real texts found
    if len(yml_clean) != len(csv_clean):
        # show the data before and after the error
        show_len_mismatch(yml_clean, csv_clean)

    # if sets mismatch, we accept that the csv is correct and edit the yaml
    # We should warn if >3 sets in either entry and solve manually
    # always warn if yaml data shows more sets
    # confirm the sets
    if confirm_songs_match(yml_clean, csv_clean):
        confirm_sets_match(yml_clean, csv_clean)

    return yml_show


if __name__ == '__main__':
    matched_shows = []
    years = [1977, 1978, 1994, 1995]
    for i in years:
        matched_shows.extend(compare_shows(i))

    # put into lists of [set_index, name]
    # parse lists side by side to check they match

    # WRITE THE RESULTS TO THE YAML
    # The DB will come after the yaml is complete
    #   -- else we risk never using it

    # can also .print() all of these
    # Note matched_shows[0][1] is a CompleteShow object (from cvs)
    #      matched_shows[0][0] is a GdShow object (from yaml)

    # Errors found:
    #   Man Smart on 1995/03/24 not named correctly in Jerrybase

    final_yml = []
    for i in matched_shows:
        print(f'Show: {i[0].text_date}')
        final_yml.append(fix_yaml_show(i[0], i[1]))

    # The output is a list of GDShow objects
    print(f'Total shows: {len(final_yml)}')