#!/usr/bin/env python

import soundfile as sf
import pygame
import pygame.gfxdraw


X_SCALE = 500
Y_SCALE = 300
HEIGHT_OFFSET = Y_SCALE // 2
SOUNDS_PER_PIXEL = 11000


def get_bounds(audio_slice):
    all_sound = [x[0] for x in audio_slice]
    all_sound.extend([x[1] for x in audio_slice])
    amax = max(all_sound) * HEIGHT_OFFSET
    amin = (min(all_sound) * HEIGHT_OFFSET) * -1
    return [amin + HEIGHT_OFFSET, HEIGHT_OFFSET - amax]


def get_data(audio):
    # always 2 channels
    sound_data = []
    index = 0    
    while index < len(audio):
        audio_slice = audio[index:index + SOUNDS_PER_PIXEL]
        sound_data.append(get_bounds(audio_slice))
        index += SOUNDS_PER_PIXEL
    # get the leftovers
    audio_slice = audio[index - SOUNDS_PER_PIXEL:]
    sound_data.append(get_bounds(audio_slice))
    return sound_data, int(len(audio) / SOUNDS_PER_PIXEL)


def render(audio):
    line_data, xsize = get_data(audio)
    image = pygame.Surface((xsize, Y_SCALE), pygame.SRCALPHA, 32)
    for i in range(len(line_data)):
        # each line data has (miny, maxy)  which we use to draw a line
        pygame.gfxdraw.vline(image, i, int(line_data[i][0]), int(line_data[i][1]), (0, 0, 128))
    pygame.image.save(image, 'test.png')


if __name__ == '__main__':
    filename = '../audio/peggy_o_example.wav'
    sound = sf.read(filename)
    # It's an array of 2 items, just 1 item and not the full array
    render(sound[0])
