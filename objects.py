A4 = 440
C0 = A4*pow(2, -4.75)
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
WHOLE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']

NOTES_PER_STRING = {
    'e': ['E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5'],
    'B': ['B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4'],
    'G': ['G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4'],
    'D': ['D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4'],
    'A': ['A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3'],
    'E': ['E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3']
}

INTERVALS = {
    'perfect unison': '1',
    'minor second': 'b2',
    'major second': '2',
    'minor third': 'b3',
    'major third': '3',
    'perfect fourth': '4',
    'diminished fifth': 'b5',
    'perfect fifth': '5',
    'minor sixth': 'b6',
    'major sixth': '6',
    'minor seventh': 'b7',
    'major seventh': '7',
    'perfect octave': '8'
    }

SCALES = {
    'major': 2212221,
    'natural_minor': 2122122,
    'augmented': 313131,
    'blues': 321132,
    'major_pentatonic': 22323,
    'minor_pentatonic': 32232,
    'phrygian_dominant': 1312122
}

INTERVALS_2 = {
    '1': 'perfect unison',
    'b2': 'minor second',
    '2': 'major second',
    'b3': 'minor third',
    '3': 'major third',
    '4': 'perfect fourth',
    'b5': 'diminished fifth',
    '5': 'perfect fifth',
    'b6': 'minor sixth',
    '6': 'major sixth',
    'b7': 'minor seventh',
    '7': 'major seventh',
    '8': 'perfect octave'
    }


STEPS = {
    'W': 2,
    'H': 1
}

MODES = {
    'ionian': 0,
    'dorian': 1,
    'phrygian': 2,
    'lydian': 3,
    'mixolydian': 4,
    'aeolian': 5,
    'locrian': 6
}

class Note():
    def __init__(self, name):
        self.name = name
        self.note_index = 0

class Interval():
    def __init__(self, name, tonic):
        self.name = name
        self.name_lower = name.lower()
        self.tonic = tonic.upper()
        self.interval_note = self.get_interval_note()

    def get_interval_note(self):
        half_steps = list(INTERVALS.keys()).index(self.name)
        notes_list = NOTE_NAMES[NOTE_NAMES.index(self.tonic):]
        notes_list.extend(NOTE_NAMES)
        interval_note = notes_list[half_steps]
        return interval_note
        

class Scale():
    def __init__(self, name, tonic, mode='ionian', add_root_as_last=True):
        self.name = name.lower()
        self.tonic = tonic.upper()
        self.mode = mode.lower()
        self.add_root_as_last = add_root_as_last
        self.notes = self.get_notes()
    
    def get_notes(self):

        notes = [self.tonic]
        scale_intervals_offset_by_mode = self._get_scale_offset_by_mode()
        
        full_notes_list = NOTE_NAMES[NOTE_NAMES.index(self.tonic):]
        full_notes_list.extend(NOTE_NAMES)
        full_notes_list.extend(NOTE_NAMES)

        for index, note in enumerate(scale_intervals_offset_by_mode):

            full_notes_list = full_notes_list[int(note):]
            note_to_append = full_notes_list[0]
            notes_stripped = [x[0] for x in notes]

            '''
            if index > 0 and note_to_append[0] in notes_stripped:
                try:
                    note_before = WHOLE_NOTES[WHOLE_NOTES.index(note_to_append[0]) - 1]
                except IndexError:
                    note_before = WHOLE_NOTES[-1]
                print(f'sharpening note: {note_before}\n-------')
                notes.append(note_before + '#')    
            else:
            '''
            notes.append(full_notes_list[0])
        
        if self.add_root_as_last:
            notes.append(self.tonic)

        return notes
    
    def yield_notes(self):

        for note in self.notes:
            yield note

    def _get_scale_offset_by_mode(self):

        mode_offset_num = MODES[self.mode]
        scale_intervals = str(SCALES[self.name])
        scale_length = len(scale_intervals)
        scale_intervals += scale_intervals
        scale_offset_by_mode = scale_intervals[mode_offset_num:scale_length + (mode_offset_num - 1)]
        return scale_offset_by_mode


def _get_num_steps(interval):
    if '#' in interval:
        num_steps = int(interval.replace('#', ''))
    elif 'b' in interval:
        num_steps = int(interval.replace('b', '')) - 2
    else:
        num_steps = int(interval) - 1