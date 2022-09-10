extends HBoxContainer


func _ready():
	pass


func set_range(t):
	if t < 0 or t > 99:
		return  'EE'
	if t < 10:
		return '0' + str(t)
	return str(t)


func set_time(new_time):
	# ensure between 0-99, or show EE
	$Minutes.text = set_range(new_time[0])
	$Seconds.text = set_range(new_time[1])
	$Millis.text = set_range(new_time[2])
