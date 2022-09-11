import sys

import json
import click
from gdshowsdb_yaml_extract import extract_songs
from jerrybase_csv_extract import extract_data, get_songs
from Levenshtein import distance as levenshtein_distance


def get_matched_songs(csv_songs, yml_songs):
    # we go through the yml songs because it's a smaller set
    # of the missing songs in the csv set, we order by levenstein distance and display in alphabetical order
    lower_csv = [[x.lower(), x] for x in csv_songs]
    lower_yml = [[x.name.lower(), x.name] for x in yml_songs]
    matched_songs = []
    unmatched_songs = []
    for i in lower_yml:
        found_match = False
        for j in lower_csv:
            if i[0] == j[0]:
                matched_songs.append([i[1], j[1]])
                found_match = True
                break
        if not found_match:
            # song that is in yml but not in cvs
            unmatched_songs.append(i[1])

    csv_unmatched = []
    for i in csv_songs:
        found_match = False
        for j in matched_songs:
            if i == j[0]:
                found_match = True
                break
        if not found_match:
            csv_unmatched.append(i)

    return  matched_songs, unmatched_songs, csv_unmatched


def build_songs_json():
    csv_songs = get_songs(extract_data())
    yml_songs = extract_songs()
    match, unmatch, csv_unmatch = get_matched_songs(csv_songs, yml_songs)

    # dump all this
    with open('output/matched_songs.json', 'w', encoding='utf-8') as f:
        json.dump(match, f, ensure_ascii=False, indent=4)
    with open('output/unmatched_songs.json', 'w', encoding='utf-8') as f:
        json.dump(unmatch, f, ensure_ascii=False, indent=4)
    with open('output/csv_unmatched_songs.json', 'w', encoding='utf-8') as f:
        json.dump(csv_unmatch, f, ensure_ascii=False, indent=4)


def load_unmatched():
    with open('output/unmatched_songs.json', 'r') as f:
        unmatched = json.load(f)
    with open('output/csv_unmatched_songs.json', 'r') as f:
        csv_unmatched = json.load(f)
    return unmatched, csv_unmatched


def first_pass():
    yml_songs = extract_songs()
    unmatched, csv_unmatch = load_unmatched()

    # now we use distance to find the unmatched
    # above code is to find cvs unmatched, for now we only want
    # to solve the yml unmatched
    scores = []
    for i in unmatched:
        # we go through ALL of csv songs
        best = [100, '', '']
        for s in csv_unmatch:
            new_dist = levenshtein_distance(str(i), str(s))
            if new_dist < best[0]:
                best = [new_dist, i, s]
        scores.append(best)

    # validate all
    all_valid = []
    for i in scores:
        if click.confirm(f'Agree: {i}?', default=False):
            # format should by yml, csv
            all_valid.append([i[1], i[2]])

    print('\nSaving:')
    for i in all_valid:
        print(f'  {i}')

    with open('output/first_pass.json', 'w', encoding='utf-8') as f:
        json.dump(all_valid, f, ensure_ascii=False, indent=4)



if __name__ == '__main__':
    sys.exit()

    scores = []
    for i in csv_unmatch:
        # we go through ALL of yml songs
        best = [100, '', '']
        for s in yml_songs:
            new_dist = levenshtein_distance(str(i), str(s))
            if new_dist < best[0]:
                best = [new_dist, i, s]
        scores.append(best)
    for i in scores:
        print(i)

    # validate all
    all_valid = []
    for i in scores:
        if click.confirm(f'Agree: {i}?', default=False):
            all_valid.append(i)
    for i in all_valid:
        print(i)

    # stitch it all together in a json file
    all_songs = []