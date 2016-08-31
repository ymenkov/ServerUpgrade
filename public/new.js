function signIn(){
	var text = document.getElementById("username");
	var val = text.value;

	var xhr = new XMLHttpRequest();
	var body = 'username='+val;
	xhr.open("POST", 'http://' + window.location.host + '/game');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
	xhr.send(body);
	xhr.onload = function() {
		//alert(this.responseText);
		var path = 'http://' + window.location.host + '/game/' + this.responseText;
		document.location.href = path;
		console.log(path)
	}
}