from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.floatlayout import FloatLayout
from kivy.clock import Clock
from cli_functions import detect_note 

class TestApp(App):
    def build(self):
        return Button(text='Hello World')

class Hello(FloatLayout):
    def __init__(self, **kwargs):
        super(Hello, self).__init__(**kwargs)

        self.

TestApp().run()