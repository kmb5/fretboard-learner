#! /usr/bin/env python3
import sys
import time
from random import choice
import pyaudio
import numpy as np
from aubio import notes, pitch
from helpers import pitch2note, NOTES_PER_STRING

CHUNK = 1024
FORMAT = pyaudio.paFloat32
CHANNELS = 1
RATE = 44100
RECORD_SECONDS = 5000

'''TODO:
- Only whole notes or only half notes or both
- Only 1 string or multiple strings
- implement the groups from here: https://medium.com/@aslushnikov/memorizing-fretboard-a9f4f28dbf03
    (eg. lvl 1, only E string, lvl 2, those group notes, etc.)
- Select notes from multiple string (and maybe identify what is the string that is playing)
'''

# Pitch
tolerance = 0.8
downsample = 1
win_s = 4096 // downsample # fft size
hop_s = 1024  // downsample # hop size
#notes_o = notes("default", win_s, hop_s, RATE)
pitch_o = pitch("yinfft", win_s, hop_s, RATE)
pitch_o.set_unit("Hz")
pitch_o.set_silence(-40)
pitch_o.set_tolerance(tolerance)


def detect_note():

    p = pyaudio.PyAudio()

    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    #print("* recording")

    frames = []
    notes_list = []

    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        buffer = stream.read(CHUNK)
        frames.append(buffer)

        signal = np.frombuffer(buffer, dtype=np.float32)

        #new_note = notes_o(signal) # we get note from pitch as it is more accurate
        pitch_of_note = pitch_o(signal)[0]
        #confidence = pitch_o.get_confidence()
        if pitch_of_note != 0:
            note_played = pitch2note(pitch_of_note)
            notes_list.append(note_played[:-1]) # we append only note and not number (eg. E and not E2)

            if len(notes_list) == 10:
                # We listen for 10 signals and then select the most frequent note in the list
                # This is because when you pluck a note the frequency can deviate as you pluck it strongly
                most_likely_note = max(notes_list, key=notes_list.count)

                stream.stop_stream()
                stream.close()
                p.terminate()
                return most_likely_note


def main():

    while True:
    
        inp = input('Which string?\n')

        if inp not in('EADGBe'):
            print('Need to select from EADGBe')
            continue
        else:
            break

    prev_note_choice = None
        
    while True:

        note_choice = choice(NOTES_PER_STRING[inp])
        if prev_note_choice == note_choice:
            continue
        else:
            prev_note_choice = note_choice

        note_choice_without_number = note_choice[:-1]
        print(f'Play this note: {note_choice_without_number}')

        note_played = None
        while note_played != note_choice_without_number:
            note_played = detect_note()
            print(f'\rYou played {note_played}    ')
        print('Good job!')
        time.sleep(1)
        

if __name__ == "__main__":
    main()