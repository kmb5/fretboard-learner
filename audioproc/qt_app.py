import sys 
from PyQt5.QtWidgets import QApplication, QWidget 
from PyQt5.QtWidgets import QVBoxLayout, QLabel 
from PyQt5.QtGui import QFont 
from PyQt5.QtCore import QTimer, QTime, Qt 
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
  
class Window(QWidget): 
  
    def __init__(self): 
        super().__init__() 
  
        # setting geometry of main window 
        self.setGeometry(100, 100, 800, 400) 
  
        # creating a vertical layout 
        layout = QVBoxLayout() 
  
        # creating font object 
        font = QFont('Arial', 120, QFont.Bold) 
  
        # creating a label object 
        self.label = QLabel() 
  
        # setting centre alignment to the label 
        self.label.setAlignment(Qt.AlignCenter) 
  
        # setting font to the label 
        self.label.setFont(font) 
  
        # adding label to the layout 
        layout.addWidget(self.label) 
  
        # setting the layout to main window 
        self.setLayout(layout) 
  
        # creating a timer object 
        timer = QTimer(self) 
  
        # adding action to timer 
        timer.timeout.connect(self.getNote) 
  
        # update the timer every 5ms 
        timer.start(5) 

    def 

    
    def getNote(self):

        p = pyaudio.PyAudio()

        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        frames_per_buffer=CHUNK)

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
                    
                    self.label.setText(most_likely_note)
                    return most_likely_note

  
  
# create pyqt5 app 
App = QApplication(sys.argv) 
  
# create the instance of our Window 
window = Window() 
  
# showing all the widgets 
window.show() 
  
# start the app 
App.exit(App.exec_()) 