extends HBoxContainer

var fixed = false
var phrase: String
var current_time: Array

func _ready():
	pass


func set_phrases(new_phrase, name):
	phrase = new_phrase
	$SetTime.text = phrase
	$PosLabel.text = name


func update_time(new_time):
	# new time is an array of min - sec - milli
	current_time = new_time
	if not fixed:
		$Timer.set_time(new_time)


func _on_SetTime_toggled(button_pressed):
	fixed = button_pressed
	if fixed:
		$SetTime.text = 'Done'
	else:
		$SetTime.text = phrase
		# also, update current time
		update_time(current_time)
