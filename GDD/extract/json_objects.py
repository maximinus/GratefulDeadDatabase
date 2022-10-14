from datetime import date


class Song:
    def __init__(self, data):
        self.name = data['name']
        self.full_name = data['full_name']
        self.short_name = data['short_name']
        self.writers = data['writers']

    def __repr__(self):
        return self.name


class PlayedSong:
    def __init__(self, data):
        self.name = data['name']
        self.segued = data['segued']
        self.length = -1
        self.notes = None

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
        # convert sets
        self.sets = [GDSet(x) for x in data['sets']]
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
                'sets': [x.to_json() for x in self.sets],
                'show_index': self.show_index}
        return data


class GDSet:
    def __init__(self, data):
        self.songs = [PlayedSong(x) for x in data['songs']]
        self.encore = data['encore']

    def to_json(self):
        data = {'songs': [x.to_json() for x in self.songs],
                'encore': self.encore}
        return data

    def __repr__(self):
        return '\n'.join([str(x) for x in self.songs])


class Venue:
    def __init__(self, data):
        self.name = data['name']
        self.latitude = data['latitude']
        self.longitude = data['longitude']
        self.city = data['city']
        self.state = data['state']
        self.country = data['country']

    def to_json(self):
        data = {'name': self.name,
                'city': self.city,
                'state': self.state,
                'country': self.country,
                'latitude': self.latitude,
                'longitude': self.longitude}
        return data

    def __repr__(self):
        return f'{self.name},{self.city},{self.state},{self.country}'


class Weather:
    def __init__(self):
        pass
