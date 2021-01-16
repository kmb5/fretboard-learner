import sounddevice as sd
import numpy as np
from aubio import pitch
from helpers import pitch2note
import sys
duration = 60  # seconds

RATE = 44100
tolerance = 0.8
downsample = 1
win_s = 4096 // downsample # fft size
hop_s = 1024  // downsample # hop size
pitch_o = pitch("yinfft", win_s, hop_s, RATE)
pitch_o.set_unit("Hz")
pitch_o.set_silence(-40)
pitch_o.set_tolerance(tolerance)

def callback(indata, outdata, frames, time, status):


    notes_list = []
    note_choice = 'G'
    most_likely_note = ''

    while most_likely_note != note_choice:

        if status:
            print(status)
        signal = np.frombuffer(indata, dtype=np.float32)
        #print(signal)
        pitch = pitch_o(signal)[0]
        if pitch != 0:
            note_played = pitch2note(pitch)
            notes_list.append(note_played[:-1])

            if len(notes_list) == 10:
                most_likely_note = max(notes_list, key=notes_list.count)
                sys.stdout.write(f'\rYou played: {most_likely_note}  ')
                sys.stdout.flush()
                if most_likely_note != note_choice:
                    notes_list = []


with sd.Stream(channels=1, callback=callback, blocksize=1024):
    sd.sleep(int(duration * 1000))