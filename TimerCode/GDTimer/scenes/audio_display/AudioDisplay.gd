extends Control

signal move_wav
signal play_song
signal stop_song


func _ready():
	$MarginContainer/VBoxContainer/SetTime.set_phrases('Set start time', 'START')
	$MarginContainer/VBoxContainer/SetTime2.set_phrases('Set end time', 'END')


func set_bar(ratio: float):
	$MarginContainer/VBoxContainer/HScrollBar.page = ratio * 1024


func set_times(t):
	$MarginContainer/VBoxContainer/SetTime.update_time(t)
	$MarginContainer/VBoxContainer/SetTime2.update_time(t)


func _on_HScrollBar_value_changed(value):
	emit_signal('move_wav', value)


func _on_Play_pressed():
	$MarginContainer/VBoxContainer/HBoxContainer/Play.disabled = true
	$MarginContainer/VBoxContainer/HBoxContainer/Stop.disabled = false
	emit_signal('play_song')


func _on_Stop_pressed():
	$MarginContainer/VBoxContainer/HBoxContainer/Play.disabled = false
	$MarginContainer/VBoxContainer/HBoxContainer/Stop.disabled = true
	emit_signal('stop_song')
