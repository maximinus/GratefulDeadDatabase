import os.path
import sys
import json

output = 'output/cleaned_venues.json'


def get_json_data(file_path):
    if not os.path.exists(file_path):
        # none found
        return []
    with open(file_path) as json_file:
        json_data = json.load(json_file)
        return json_data


def save_venues(venues):
    with open(output, 'w', encoding='utf-8') as json_file:
        json.dump(venues, json_file, ensure_ascii=False, indent=4)


def input_text(name, default=None):
    if default is not None:
        cursor = f'  > {name} (enter for {default}): '
    else:
        cursor = f'  > {name}: '
    while True:
        try:
            data = input(cursor)
            if len(data) == 0:
                return default
            if data == 'quit':
                raise InterruptedError
            value = str(data)
            return value
        except (KeyboardInterrupt, ValueError):
            print('* Error: Expected a text value')


def input_long_lat():
    while True:
        try:
            data = input(f'  > long/lat: ')
            if data == 'quit':
                raise InterruptedError
            data = [round(float(x.strip()), 3) for x in data.split(',')]
            # returns as latitude, longitude
            return data[0], data[1]
        except (KeyboardInterrupt, ValueError):
            print('* Error: Expected a float value')


def input_venue_details(venue):
    # return a dict of the new data
    name = venue['venue_name']
    location_from_yaml = venue['name']
    dates = venue['dates']
    try:
        latitude, longitude = input_long_lat()
        city = input_text('city')
        state = input_text('state')
        country = input_text('country', 'USA')
    except InterruptedError:
        return
    return {'name': name,
            'location_from_yaml': location_from_yaml,
            'dates': dates,
            'latitude': latitude,
            'longitude': longitude,
            'city': city,
            'state': state,
            'country': country}


def edit_venue_data():
    venues = get_json_data('../output/all_venues.json')
    existing_data = get_json_data(output)
    existing_venues = [x['location_from_yaml'] for x in existing_data]
    new_data = []
    index = 1
    for i in venues:
        # if the name exists already, ignore it and say so
        if i['name'] in existing_venues:
            print(f'Already entered {i["name"]}')
            index += 1
            continue
        print(f'Name: {i["name"]} (#{index} of {len(venues)})')
        print(f'Dates: {i["dates"]}')
        values = input_venue_details(i)
        if values is None:
            sys.exit()
        # save all data
        new_data.append(values)
        total_data = existing_data.copy()
        total_data.extend(new_data)
        save_venues(total_data)
        index += 1


if __name__ == '__main__':
    edit_venue_data()
