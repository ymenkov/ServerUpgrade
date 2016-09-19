var CELLS_COUNT = [12,20];
const CELL_WIDTH = 50;
const CELL_HEIGTH = 50;
const WIDTH = CELLS_COUNT[1] * CELL_WIDTH + 6 * CELLS_COUNT[1] + 1;
const HEIGTH = CELLS_COUNT[0] * CELL_WIDTH + 6 * CELLS_COUNT[0] + 1;
const RENDER_INTERVAL = 25;
const FRAMES_PER_SECOND = 10;
const PIXEL_PER_RENDER = CELL_WIDTH / FRAMES_PER_SECOND;

////
var selectForControl = {id: undefined,idNow:undefined};
////

var GImg = {};
var GMap = document.getElementById("canvas").getContext('2d');
var GObjects = [];
var GAnimationCount = 0;
var GCreateObject = null;

var socket = new WebSocket("ws://" + window.location.host.split(':')[0] + ":8081");
var player_id = window.location.pathname.split('game/')[1];

var images = {
	'ORK': 'photo.jpg',
	'TOWER': 'tower.png',
	'HUNTER': 'hunter.jpg',
	'CASTLE': 'castle.png',
	'TROLL': 'troll.png',
	'ST': 'st.png',
	'WALL': 'wall.png',
	'WALLKILLER': 'WALLKILLER.png',
	'BANK': 'BANK.png',
	'KAMIKADZE': 'KAMIKADZE.png',
	'HEALMAN': 'healman.png',
	'spawnerOrks': "spawnerOrks.png",
	"TITAN": "titan.jpg",
	"BOMB":"bomb.png"
};

function loadImages() {
	for (var key in images) {
		var img = document.createElement("img");
		img.setAttribute("src", images[key]);
		img.setAttribute("visible", 'false');
		img.setAttribute("id", key);
		document.getElementById("results").appendChild(img).style.visibility="hidden";

		var img = new Image();
		//img.style.visibility="hidden";
		img.src = images[key];
		GImg[key] = img;
	}
}

var colors = [
	'#4250CD', '#CD4742', '#CCCD42', '#CD42B3', '#42CCCD',
	'#42CD4E', '#FFFFFF', '#000000'
];

function findProp(objects, property, findvalue) {
	for (var i = 0; i < objects.length; i++) {
		if (objects[i][property] == findvalue) return objects[i];
	}
	return null;
}

/*
 ** && return TRUE IF id EXISTS in GObjects, else FALSE &&
 */
function findId(id, obj_array) {
	for (var i = 0; i < obj_array.length; i++) {
		if (obj_array[i].id == id)
			return i;
	}
	return -1;
}

function updatePlayerInfo(obj) {
	if (obj != null) {
		document.getElementById("Gold").innerHTML = "Gold : " + Math.floor(obj.gold);

		var player = document.getElementById("player");
		document.getElementById("player").innerHTML = "Имя: " + obj.player_name;
		player_id = obj.player_id;
	}
}

function updateCastleInfo(obj) {
	if (obj != null) {
		if (obj.player_id == player_id) {
			document.getElementById("castle").innerHTML = "Здоровье замка: " + obj.hp;
		}
	}
}

function razn(coord_1, coord_2) {
	if (coord_1[0] != coord_2[0]) {
		return [0, coord_2[0] - coord_1[0], 0];
	}
	else if (coord_1[1] != coord_2[1]) {
		return [1, coord_2[1] - coord_1[1], 0];
	}
}

function pixelToCellX(x) {
	var r = 0;
	while (x > CELL_WIDTH) {
		x = x - CELL_WIDTH - 6;
		r++;
	}
	return r;
}

function onClick() {
	var x = event.pageX - document.body.style.marginLeft;
	var y = event.pageY - document.body.style.marginTop;
	var Ids = checkCoord(x, y);

	if (Ids.length) {
		selectForControl.id = Ids[Ids.length - 1];
		return;
	}

	if (GCreateObject != null) {
		var nObr = new Obr("create", GCreateObject, [pixelToCellX(y), pixelToCellX(x)], player_id);		//----- FIX cX to cY if CELL_HEIGHT != CELL_WIDTH
		send(nObr);
		GCreateObject = null;
		return;
	}


}

function rightClick() {
	if (!selectForControl.id)return;
	var x = event.pageX - document.body.style.marginLeft;
	var y = event.pageY - document.body.style.marginTop;
	send({
		make: "control",
		status: "hand",
		id: selectForControl.id,
		coord: [pixelToCellX(y), pixelToCellX(x)],
		player_id: player_id
	});
	document.oncontextmenu = function () {
		return false
	};
}

function send(sender) {
	socket.send(JSON.stringify(sender));
}

function checkCoord(x, y) {
	var AIds = [], oX, oY;

	//debugger;
	for (var i = 0; i < GObjects.length - 1; i++) {
		oX = X(GObjects[i]);
		oY = Y(GObjects[i]);
		if (x >= oX && x <= oX + CELL_WIDTH && y >= oY && y <= oY + CELL_HEIGTH) {
			AIds.push(GObjects[i].id);
		}
	}
	//alert(AIds);
	return AIds;
}

function Obr(make, type, coord, player_id) {
	this.make = make;
	this.type = type;
	this.coord = coord;
	this.player_id = player_id;
}

function priceObjects(config) {
	for (var i = 0; i < config.length; i++) {
		if (config[i].price != 0) {
			var element = document.getElementById("controller");
			var element2 = document.createElement("input");
			element2.value = config[i].type + " за " + config[i].price;
			element2.type = "button";
			element2.onclick = tt.bind(config[i]);

			function tt() {
				if ((this.block == true) || (this.type == "PLACE")) {
					GCreateObject = this.type;
				}
				else if ((this.block === false) && (this.type != "PLACE")) {  //:(
					var newOBB = new Obr("create", this.type, select, player_id);
					send(newOBB);
					return;
				}

				select = {type: this.type, id: this.id};
				//console.log(select);

			}

			element.appendChild(element2);
		}
	}
}

function getObjectsInfo(_response) {
	var propObj;
	var index;

	propObj = findProp(_response, 'type', 'PLAYER');
	updatePlayerInfo(propObj);

	propObj = findProp(_response, 'type', 'CASTLE')
	updateCastleInfo(propObj);

	for (var i = 0; i < _response.length; i++) {

		/// вывод инфы
		if ((_response[i].id)&&(selectForControl.id) && (_response[i].id==selectForControl.id)){
			document.getElementById('hero').src=images[_response[i].type];
			var elemSkills = document.getElementById('skills');
			if ((_response[i].skills)&&(selectForControl.idNow!=_response[i].id)){
				elemSkills.innerHTML="";
				selectForControl.idNow=_response[i].id;
				for (var k=0;k<_response[i].skills.length;k++) {
					var buttonSkills = document.createElement("input");
					switch (_response[i].skills[k].type){
						case "passive":
							buttonSkills.style.background="green";
							buttonSkills.disabled = true;
							break;
						case "active":
						//	buttonSkills.style.background="linear-gradient(to right, black 50%, red 50%)";
							break;
					}
					buttonSkills.className = "menu1";
					buttonSkills.type = "button";
					buttonSkills.value=_response[i].skills[k].skill;
					buttonSkills.onclick=useSkill.bind(_response[i].skills[k].skill);
					function useSkill(){
						socket.send(JSON.stringify({make:"useSkill",skill:this,id:selectForControl.idNow,player_id:player_id}));
					}
					elemSkills.appendChild(buttonSkills);

				}
			}
		}
		///вывод инфы end

		if (_response[i].type != 'PLACE' && _response[i].type != 'CASTLE' && _response[i].type != 'BLOCK' && _response[i].type != 'PLAYER') {
			//debugger;
			index = findId(_response[i].id, GObjects);
			if (index != -1) {
				//console.log("Новые координаты : ... " + _response[i].coord + '| Старые координаты : ... +' + GObjects[index].coord);
				//console.log("IFFER " + (_response[i].coord[0] != GObjects[index].coord[0] || _response[i].coord[1] != GObjects[index].coord[1]));
				//console.log(_response[i].coord);
				//console.log(GObjects[index].coord);
				if (_response[i].coord[0] != GObjects[index].coord[0] || _response[i].coord[1] != GObjects[index].coord[1]) {	// Если координаты изменились
					if (GObjects[index].razn != undefined) {
						//	console.log("Координаты изменились, но разность была ... " + GObjects[index].razn + '| Старые координаты GObjects[index] ... '
						//		+ GObjects[index].coord + '| Новые _response[i].moveAnimation ... ' + _response[i].moveAnimation[0] );
						GObjects[index].coord = _response[i].moveAnimation[0];
					}
					_response[i].razn = razn(GObjects[index].coord, _response[i].coord);
					//	console.log("Установили новую разность : ... " + _response[i].razn);

					//console.log("Установили новые координаты, GObjects[index] : ... " + GObjects[index].coord + '| _response: ... '+_response[i].coord);
					_response[i].coord = GObjects[index].coord;
				}
				else {
					//console.log("Устанавливаем старую разность : ... " + GObjects[index].razn);
					_response[i].razn = GObjects[index].razn;
				}
			}
		}
	}

	GObjects = _response;
}

function start_game() {
	console.log("START_GAME");
	send({make: "start"});
}

function renderMap() {
	clear();
	drawMap();
	for (var i = 0; i < GObjects.length - 1; i++) {
		if (GObjects[i].razn != undefined) {
			if (GObjects[i].razn[2] < FRAMES_PER_SECOND) {
				if (GObjects[i].type == 'ORK') {
					//console.log("OBJECT.RAZN === " + GObjects[i]["razn"] + '|' + GObjects[i].id + '|RAZN / FPS = ' + PIXEL_PER_RENDER);
					//console.log(GObjects[i]);
				}
				//GObjects[i].coord[GObjects[i].razn[0]] += round(GObjects[i].razn[1] * PIXEL_PER_RENDER);
				GObjects[i].razn[2]++;
			}
			else {
				GObjects[i].coord = GObjects[i].moveAnimation[1];
				GObjects[i].razn = undefined;
				//GObjects[i].coord[GObjects[i].razn[0]] = Math.round(GObjects[i].coord[GObjects[i].razn[0]]);
			}
		}
		draw(GObjects[i]);
	}
}

function start() {		// Start rendering map cycle
	var Interval = setInterval(function () {
		renderMap();
		GAnimationCount++;
		/*if (GAnimationCount == FRAMES_PER_SECOND){
		 clearAnimation();
		 flag_interval = false;
		 clearInterval(Interval);
		 GAnimationCount = 0;
		 //debugger;
		 } */
	}, RENDER_INTERVAL);
}

function clear() {
	GMap.clearRect(0, 0, WIDTH, HEIGTH);
}

function Y(gObj) {
	if (gObj.razn != undefined && gObj.razn[0] == 0) {
		return gObj.coord[0] * CELL_HEIGTH + 6 * gObj.coord[0] + 1 + gObj.razn[2] * gObj.razn[1] * PIXEL_PER_RENDER;
	}
	return gObj.coord[0] * CELL_WIDTH + 6 * gObj.coord[0] + 1;
}

function X(gObj) {
	if (gObj.razn != undefined && gObj.razn[0] == 1) {
		return a = gObj.coord[1] * CELL_HEIGTH + 6 * gObj.coord[1] + 1 + gObj.razn[2] * gObj.razn[1] * PIXEL_PER_RENDER;
	}
	return gObj.coord[1] * CELL_HEIGTH + 6 * gObj.coord[1] + 1;
}


// ************ DRAW OBJECT FUNCTIONS *********************
function draw(game_object) {
	if (game_object.type == "PLACE") {
		GMap.strokeStyle = colors[game_object.player_id];
		GMap.strokeRect(X(game_object), Y(game_object), CELL_WIDTH, CELL_HEIGTH);
	}
	else if (game_object.type == "BLOCK") {
		GMap.fillStyle = "#000000";
		GMap.fillRect(X(game_object), Y(game_object), CELL_WIDTH, CELL_HEIGTH);
		GMap.strokeStyle = "#979291";
		GMap.strokeRect(X(game_object), Y(game_object), CELL_WIDTH, CELL_HEIGTH);
	}
	else {
		drawImg(game_object);
		drawHP(game_object);
	}
}

function drawImg(_gObj) {
	GMap.strokeStyle = colors[_gObj.player_id];
	var img = document.getElementById(_gObj.type);
	try {
		GMap.drawImage(img, X(_gObj) + 1, Y(_gObj) + 1, CELL_WIDTH - 2, CELL_HEIGTH - 2);
	}
	catch (e) {
		console.log(img + '|' + _gObj.type);
	}
	GMap.strokeRect(X(_gObj), Y(_gObj), CELL_WIDTH, CELL_HEIGTH);
	GMap.strokeRect(X(_gObj), Y(_gObj), CELL_WIDTH, CELL_HEIGTH);
	GMap.strokeStyle = "#000000";
}

function drawMap() {
	for (var i = 0; i < CELLS_COUNT[1]; i++) {
		for (var j = 0; j < CELLS_COUNT[0]; j++) {
			GMap.strokeStyle = "#808080";
			GMap.strokeRect(Y({coord: [i]}), X({coord: [0, j]}), CELL_WIDTH, CELL_HEIGTH);
		}
	}
}

function drawHP(game_object) {
	var x = X(game_object);
	var y = Y(game_object);
	var yPos = y + CELL_HEIGTH - 8;

	GMap.strokeRect(x + 4, yPos, CELL_WIDTH - 8, 4);

	GMap.fillStyle = "#ff0000";
	GMap.fillRect(x + 4, yPos, CELL_WIDTH - 8, 4);

	var HP = (game_object.hp / game_object.maxHp) * (CELL_WIDTH - 8);
	GMap.fillStyle = "#00ff40";
	GMap.fillRect(x + 4, yPos, HP, 4);
	//GMap.strokeRect(x + 4, yPos, CELL_WIDTH - 8, 4)
}
function testSkill(){
	socket.send(JSON.stringify({make:"useSkill",skill:"spawnMob",id:selectForControl.id,player_id:player_id}));
}


// ************** END DRAW OBJECT FUNCTIONS **********************
