from gdshowsdb_yaml_extract import extract_year
from jerrybase_csv_extract import sort_into_shows, CompleteShow


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
            matched.append([i, m])
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


if __name__ == '__main__':
    matched_shows = compare_shows(1995)
    print(matched_shows[0][1])
    example_cvs = CompleteShow(matched_shows[0][1])
    example_cvs.print()

    # do the same for the yaml of this matched show
    example_yml = matched_shows[0][0]
    example_yml.print()

    # do they agree with number of sets?
    #   yes - just check all sets
    #   no - compare yml order with csv
    #        if order same, impose sets on yaml
    # in order, songs agree when the yml song string matches the csv one
    # If there is no match, we solve manually
    # work back from 1995
