import json

from datetime import date, time

# if in json, we would want to move from json to class
# so these classes need a way to move to and from json easily
# jsonStr = json.dumps(some_instance.__dict__) could be useful here

# start with the simplest thing

# Data is all one big yaml file from
# The structure of the file is simple, it's a list of shows


class Song:
    def __init__(self, data):
        self.name = data['name']
        self.segued = data['segued']
        self.length = -1
        self.notes = ''

    def to_json(self):
        data = {'name': self.name,
                'segued': self.segued,
                'length': self.length,
                'notes': self.notes}
        return data

    def __repr__(self):
        if self.segued:
            return f'{self.name} >'
        else:
            return self.name


class Show:
    def __init__(self, data):
        # where?
        self.venue = data['venue']
        # when?
        self.date = date.fromisoformat(data['date'])
        # when did it start?
        self.start_time = data['start_time']
        self.end_time = data['end_time']
        self.weather = data['weather']
        self.sets = data['sets']
        self.show_index = data['show_index']

    def to_json(self):
        weather = self.weather.to_json() if self.weather is not None else None
        start_time = self.start_time
        end_time = self.end_time
        show_date = self.date.isoformat()
        data = {'venue': self.venue,
                'date': show_date,
                'start_time': start_time,
                'end_time': end_time,
                'weather': weather,
                'sets': [x.to_json() for x in self.sets]}
        return data


class GDSet:
    def __init__(self, data):
        self.songs = data['songs']
        self.encore = data['encore']

    def to_json(self):
        data = {'songs': [x.to_json() for x in self.songs],
                'encore': self.encore}
        return data

    def __repr__(self):
        return '\n'.join([str(x) for x in self.songs])


class Venue:
    def __init__(self, data):
        self.index = data['index']
        self.name = data['name']
        self.latitude = data['latitude']
        self.longitude = data['longitude']
        self.city = data['city']
        self.state = data['state']
        self.country = data['country']

    def to_json(self):
        data = {'index': self.index,
                'name': self.name,
                'latitude': self.latitude,
                'longitude': self.longitude,
                'city': self.city,
                'state': self.state,
                'country': self.country}
        return data


class Weather:
    def __init__(self):
        pass


def create(yml_shows):
    # given a list of yml shows, create the dataset
    venues = {}
    all_shows = []
    for show in yml_shows:
        # for the venue, construct a string
        venue_string = f'{show.venue_name},{show.city},{show.state},{show.country}'
        if venue_string in venues:
            venues[venue_string].append(show.date)
        else:
            venues[venue_string] = [show.date]
        # generate the show data
        all_sets = []
        for dead_set in show.sets:
            # this is a PlayedSong, has self.name and self.segue
            new_songs = [Song({'name': x.name, 'segued': x.segue}) for x in dead_set.songs]
            all_sets.append(GDSet({'songs': new_songs, 'encore': False}))
        # construct the show
        data = {'venue': None, 'weather': None, 'date':show.date.isoformat(),
                'start_time': None, 'end_time': None, 'sets': all_sets, 'show_index': show.show_number}
        all_shows.append(Show(data))

    # having obtained all venues, we now need create the venue details
    all_venues = []
    index = 0
    for show, dates in venues.items():
        xd = show.split(',')
        venue_data = {'index': index,
                      'name': xd[0],
                      'city': xd[1],
                      'state': xd[2],
                      'country': xd[3],
                      'latitude': None,
                      'longitude': None}
        new_venue = Venue
        for show_date in dates:
            # find the show with this date
            for i in all_shows:
                if show_date == i.date:
                   i.venue = index
        index += 1
        all_venues.append(Venue(venue_data))

    # now we should have all venues combined with all shows
    print(json.dumps(all_shows[-1].to_json(), indent=4))


if __name__ == '__main__':
    foo = Song({'index': 1, 'name': 'China Cat'})
    json_data = json.dumps(foo.__dict__)
    dict_data = json.loads(json_data)
    print(Song(dict_data))
