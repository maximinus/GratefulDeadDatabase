from django.db import models

# Create your models here.
class Song(models.Model):
    name = models.CharField(max_length=256)
    writers = models.ManyToManyField('people.Person')

    def __str__(self):
        return self.name
