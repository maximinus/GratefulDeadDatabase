from peewee import *


db = SqliteDatabase('database/grateful_dead.db')


class BaseModel(Model):
    class Meta:
        database = db


class Venue(BaseModel):
    name = CharField()
    latitude = FloatField()
    longitude = FloatField()
    festival_name = CharField()
    # for unique names "Big Nigs" for example
    alternate_name = CharField()
    city_name = CharField()
    state_name = CharField()
    country_name = CharField()


class Show(BaseModel):
    venue = ForeignKeyField(Venue, backref='shows')
    date = DateTimeField()
    # possible >1 show per date
    start_index = IntegerField()


class ShowSet(BaseModel):
    show = ForeignKeyField(Show, backref='sets')
    index = IntegerField()


class Song(BaseModel):
    full_name = CharField()
    common_name = CharField()
    short_name = CharField()
    char4_name = CharField()
    cover = BooleanField()


class PlayedSong(BaseModel):
    song = ForeignKeyField(Song, backref='versions')
    show_set = ForeignKeyField(ShowSet, backref='songs')
    index = IntegerField()


class Weather(BaseModel):
    show = ForeignKeyField(Show, backref='weather')
    # in celcius
    temperature = FloatField()
    # in atm, so very close to 1
    pressure = FloatField()
    # what measure?
    percipitation = FloatField()
    # m/s
    wind_velocity = FloatField()
    # float 0-360, 0 is north, 90 is east etc
    wind_direction = FloatField()


if __name__ == '__main__':
    db.connect()
    db.create_tables([Venue, Show, ShowSet, Song, PlayedSong, Weather])
