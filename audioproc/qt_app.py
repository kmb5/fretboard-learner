import sys 
from PyQt5.QtWidgets import QApplication, QWidget 
from PyQt5.QtWidgets import QGridLayout, QLabel 
from PyQt5.QtGui import QFont 
from PyQt5.QtCore import QTimer, QTime, Qt 
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
        self.setupUI()

    def setupUI(self):
  
        # setting geometry of main window 
        self.setGeometry(100, 100, 800, 400) 
        
        note_font = QFont('Arial', 20, QFont.Bold) 
        labels_font = QFont('Arial', 20)
        # creating a vertical layout 
        layout = QGridLayout()

        # creating labels     
        self.choosen_string_label = QLabel('Choosen string: ')
        self.choosen_string = QLabel()
        self.note_detected_label = QLabel('Note played:')
        self.note_detected = QLabel()
        self.note_to_play_label = QLabel('Note to play:')
        self.note_to_play = QLabel()
        self.congrats_msg = QLabel()
  
        # setting font to the label 
        self.choosen_string_label.setFont(labels_font)
        self.choosen_string.setFont(labels_font)
        self.note_detected_label.setFont(labels_font)
        self.note_detected.setFont(note_font)
        self.note_to_play_label.setFont(labels_font) 
        self.note_to_play.setFont(note_font)
  
        # adding widgets to the layout 
        layout.addWidget(self.choosen_string_label, 1, 0)
        layout.addWidget(self.choosen_string, 1, 1)
        layout.addWidget(self.note_to_play_label, 2, 0)
        layout.addWidget(self.note_to_play, 2, 1)
        layout.addWidget(self.note_detected_label, 3, 0) 
        layout.addWidget(self.note_detected, 3, 1)
        layout.addWidget(self.congrats_msg, 4, 0)

  
        # setting the layout to main window 
        self.setLayout(layout) 
  
        # creating a timer object 
        timer = QTimer(self) 
  
        # adding action to timer 
        timer.timeout.connect(self.getNote) 
  
        # update the timer every 5ms 
        timer.start(33) 

    def getNoteTest(self):

        self.choosen_string.setText('E')
        self.note_to_play.setText('C')
        self.note_detected.setText('D')

    def getNote(self):

        string_to_play = 'E'
        note_to_play = choice(NOTES_PER_STRING[string_to_play])[:1]
        self.choosen_string.setText(string_to_play)
        self.note_to_play.setText(note_to_play)

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
                    
                    self.note_detected.setText(most_likely_note)

                    if most_likely_note == note_to_play:
                        self.congrats_msg.setText('Great job!!')
                    else:
                        self.congrats_msg.setText('')
                    QApplication.processEvents()
                    return most_likely_note

            QApplication.processEvents()

  
  
# create pyqt5 app 
App = QApplication(sys.argv) 
  
# create the instance of our Window 
window = Window() 
  
# showing all the widgets 
window.show() 
  
# start the app 
App.exit(App.exec_()) 