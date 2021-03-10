from pony import orm
from datetime import date, datetime

db = orm.Database()


class Note(db.Entity):
	text = orm.Required(str)


class Person(db.Entity):
	name = orm.Required(str)
	date_of_birth = orm.Optional(date)


class Song(db.Entity):
	long_name = orm.Required(str, unique=True)
	short_name = orm.Required(str, unique=True)
	writers = orm.Set(Person)


class SongInstance(db.Entity):
	order = orm.Optional(int, unique=True)
	length = orm.Required
	seque = orm.Required(int)
	notes = orm.Set(Note)
	guests = orm.Set(Person)
	length = orm.Optional(float)
	bpm = orm.Optional(float)


class SingleSet(db.Entity):
	order = orm.Required(int)
	songs = orm.Set(SongInstance)
	start_time = orm.Optional(datetime)
	end_time = orm.Optional(datetime)
	finish_time = orm.Optional(datetime)


class Venue(db.Entity):
	longitude = orm.Optional(float)
	latitude = orm.Optional(float)
	country = orm.Required(int)
	state = orm.Optional(int)
	city = orm.Optional(int)
	capacity = orm.Optional(int)
	name = orm.Required(str)


class Show(db.Entity):
	sets = orm.Set(SingleSet)
	date = orm.Required(datetime)
	venue = orm.Required(Venue)
	tickets_sold = orm.Optional(int)
	ticket_price = orm.Optional(int)


if __name__ == '__main__':
	pass
