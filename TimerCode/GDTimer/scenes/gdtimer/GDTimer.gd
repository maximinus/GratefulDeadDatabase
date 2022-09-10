extends Node2D

const SCREEN_WIDTH: float = 1024.0
const LEFT_CLICK = 1
const MIDDLE_CLICK = 3
# sort this out
const BAR_MOVE_RATIO = 4.427611421

var ratio: float
var song_length: float = 540.472
var pressed: bool = false
var current_time_selection: int = 0
var playing: bool = false
var length_played: float = 0
var bar_play_start: float = 0


func _ready():
	# get sizes for scrollbar
	ratio = SCREEN_WIDTH / $WavImage.texture.get_width()
	$AudioDisplay.set_bar(ratio)


func _process(delta):
	if playing:
		length_played += delta
		# move bar
		$Bar.offset.x = bar_play_start + (BAR_MOVE_RATIO * length_played)
		update_all_times()


func get_minutes(seconds):
	var millis = round((seconds - floor(seconds)) * 100)
	var secs = int(floor(seconds)) % 60
	var minutes = floor(floor(seconds) / 60.0)
	return [minutes, secs, millis]


func _on_AudioDisplay_move_wav(xpos):
	$WavImage.position.x = -xpos / ratio
	$Bar.position.x = -xpos / ratio


func update_all_times():
	# calculate the difference between the bar and the sound image
	# wav image pos is 0 or negative
	var bar_ratio = float(($Bar.offset.x - $Bar.position.x) + $WavImage.global_position.x)
	# divide by the size of the bar
	var ratio_of_music = bar_ratio / float($WavImage.texture.get_width())
	# now we just multiply by the number of seconds in the music
	var total_seconds = song_length * ratio_of_music
	current_time_selection = total_seconds
	var t_array = get_minutes(total_seconds)
	$AudioDisplay.set_times(t_array)


func _on_Area2D_input_event(_viewport, event, _shape_idx):
	if(event is InputEventMouseButton && event.pressed):
		$Bar.offset.x = event.position.x - $WavImage.global_position.x
		#$Bar.position.x = event.position.x
		update_all_times()
		pressed = true
	elif (event is InputEventMouseButton):
		if pressed:
			$Bar.offset.x = event.position.x - $WavImage.global_position.x
			update_all_times()
			pressed = false
	if pressed:
		$Bar.offset.x = event.position.x - $WavImage.global_position.x
		update_all_times()


func _on_AudioDisplay_play_song():
	playing = true
	length_played = 0
	bar_play_start = $Bar.offset.x
	$WaveFile.play(current_time_selection)


func _on_AudioDisplay_stop_song():
	playing = false
	$WaveFile.stop()
