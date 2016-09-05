
var hw=50;
var marg=10;
// var player="Валерий";


 var player_id=window.location.pathname.split('game/')[1];

if(!player_id)
player_id = 999;

//alert(player_id)
//alert(player_id);
//alert(player_id)
//w.createPlace();
//arrAll = w.getAll();
var width = 12;
var height = 20;

var c = new CONTROLLER(width, height);

var masM = new Array(width);
for (var k=0; k<masM.length; k++)
	masM[k] = new Array(height);


var socket = new WebSocket("ws://" + window.location.host.split(':')[0] + ":8081");
var arrAll = [];



var v = new VIEW();
v.render();

socket.onmessage = function(event) {


	var kappaMes = JSON.parse(event.data);
    //
	 if (kappaMes.type=="EVENT"){
	 	alert(kappaMes.info);
		 return;
	}
	if ((kappaMes.type)&&(kappaMes.type=="INFO")){
		priceObjects(kappaMes.config);
		return;
	}
		arrAll = kappaMes;

//  v.objectInMap.bind(this);
};

function priceObjects(config){
	for (var i=0;i<=config.length-1;i++){
		switch (config[i].type){
			// case "TOWER":
			// 	var element=document.getElementById('0');
			// 	element.value="Купить башню за "+config[i].price;
			// 	break;
			// case "PLACE":
			// 	var element=document.getElementById('1');
			// 	element.value="Купить территорию за "+config[i].price;
			// 	break;
			default:
				if (config[i].price!==0) {
					var element = document.getElementById("controller");
					var element2 = document.createElement("input");
					element2.value = config[i].type+" за "+ config[i].price;
					element2.type = "button";
					element2.onclick = tt.bind(config[i]);

					function tt() {

						function Obr(make, type, coord, player_id) {
							this.make = make;
							this.type = type;
							this.coord = coord;
							this.player_id = player_id;
						}
						if ((this.block===false)&&(this.type!="PLACE")) {  //:(
							var newOBB = new Obr("create", this.type, select, player_id);
							socket.send(JSON.stringify(newOBB));
							return;
						}

						select={type:this.type,id:this.id};
						console.log(select);


					};
					element.appendChild(element2);
				}
				break;

		}

	}

}


function searchPlace(i,j){
	for (var k=0;k<=arrAll.length-1;k++){
		if ((arrAll[k].type=="PLACE") && (arrAll[k].coord[0]==i)&&(arrAll[k].coord[1]==j)){
			return true;
		}
	}
	return false;
}




function VIEW(){
	var allObject = [];
	var images = {
		'ORK' : 'photo.jpg',
		'TOWER' : 'tower.png',
		'HUNTER': 'hunter.jpg',
		'CASTLE' : 'castle.png',
		'TROLL': 'troll.png',
		'ST' : 'st.png',
		'WALL' : 'wall.png',
		'WALLKILLER': 'WALLKILLER.png',
		'BANK': 'BANK.png',
		'KAMIKADZE': 'KAMIKADZE.png',
		'HEALMAN':'healman.png',
		'spawnerOrks':"spawnerOrks.png",
		'SKELETON':'skeleton.png',
		'CHEN':'chen.png',
		'PIRATE':'pirate.png'
	};

	var colors = [
		'#4250CD', '#CD4742', '#CCCD42', '#CD42B3', '#42CCCD', 
		'#42CD4E', '#FFFFFF', '#000000'
	];

	this.render = function(){
		document.getElementById('test').innerHTML = "";
		for (var i=0;i<masM.length;i++){
			for (var j=0;j<masM[i].length;j++){
				var elem=document.createElement('div');
				elem.style.backgroundColor = "white";
				if (searchPlace(i,j)) {
					elem.style.backgroundColor = "rgb(128, 128, 128)";
				}
				
				elem.style.left = (j*hw + marg*j) + 'px';
				elem.style.top = (i*hw + marg*i) + 'px';
				elem.style.border = 'outset';
				masM[i][j] = elem;
				//document.getElementById('test')
				elem.onclick = c.kappa;
				//console.log(elem);
				document.getElementById('test').appendChild(elem);
			}
		}
	}

	function findObjectById(id, type){
		for(var i=0; i<allObject.length;i++){
			if(allObject[i].internalId == id)
				//if(allObject[i].type == type)
					return allObject[i];
		}
		return false;
	}

	function renderObjectHP(dom_element){
		var hp_strike = dom_element.getElementsByClassName('hp-strike')[0];
		if(!hp_strike){
			hp_strike = document.createElement('div');
			hp_strike.className='hp-strike';
			dom_element.appendChild(hp_strike);
		}
		hp_strike.innerHTML = '';

		if(dom_element.hp){
		    var max_hp = dom_element.max_hp;
			var hp = document.createElement('div');
			hp.style.width=((dom_element.hp/max_hp)*hp_strike.clientWidth).toFixed(0) + 'px'; 
			hp_strike.appendChild(hp);
		}
	}

	function generateColor(id){
		return colors[id] || 'white';
	}

	function renderObject(object, image){
		var renderElem = findObjectById(object.id, object.type); //ищем элемент среди созданных
		var x = object.coord[0];
		var y = object.coord[1];
		
		if(!renderElem){ //Если элемент не создан - добавляем
		 	renderElem = document.createElement('div');
		 	renderElem.className = 'game-object';
		 	renderElem.style.transition="all 1s";
				if (object.lvlInfo) {
					renderElem.onclick = upLVL.bind(object);
				}

			function upLVL(){
				selectForUpgrade={id:this.id};
				var elem=document.getElementById("listbox");
				elem.innerHTML="";
				for (var i=0;i<this.lvlInfo.length;i++){

					var elem1=document.createElement("option");
					elem1.innerHTML=this.lvlInfo[i].upgrade+' '+this.lvlInfo[i].lvl+'/'+this.lvlInfo[i].maxLvl;
					elem1.onclick=upgrade.bind(this.lvlInfo[i]);

					function upgrade(){
						function up(make, id,upgrade,player_id) {
							this.make = make;
							this.id = id;
							this.upgrade=upgrade;
							this.player_id=player_id
						}
						var newUp = new up("up",selectForUpgrade.id,this.upgrade,player_id);
						socket.send(JSON.stringify(newUp));
					}

					elem.appendChild(elem1);
				}

			}
		 	renderElem.internalId = object.id;
		 	renderElem.type=object.type;
		 	renderElem.max_hp=object.hp;


		 	if(object.player_id !== undefined){
		 		renderElem.style.backgroundColor = generateColor(object.player_id);
		 		renderElem.style.zIndex = 101;
		 	}

		 	document.getElementById('pic').appendChild(renderElem);
			allObject.push(renderElem);

			if(image){ //Если есть картинка - добавляем ее внутрь элемента
				var picture=document.createElement('img');
			 	picture.src=image;
			 	picture.style.visibility="visible";
			 	renderElem.appendChild(picture);
			}
		}

		//Далее двигаем наш элемент на карте
		renderElem.hp = object.hp;
		renderElem.coord = object.coord;
		renderElem.style.left=(y*hw + marg*y) + 'px';
		renderElem.style.top=(x*hw + marg*x) + 'px';

		renderObjectHP(renderElem);
	}

	function renderAttackAnimation(type, from, to){
		var shot=document.createElement('div');
		shot.setCoordinate = function(x,y){
			this.style.left = y*hw + y*marg+20 + 'px';
	 		this.style.top = x*hw + x*marg +25+ 'px';
	 	}

	 	var parent = document.getElementById('ololo');
	 	parent.appendChild(shot).setCoordinate(from[0], from[1]);

	 	setTimeout(shot.setCoordinate.bind(shot, to[0], to[1]), 100);
	 	setTimeout(parent.removeChild.bind(parent, shot), 1500);
	}

	function removeIfDie(arrAll, allObject){
		allObject.forEach(function(elem, num){
			for(var i=0; i<arrAll.length; i++){
				if(arrAll[i].id == elem.internalId && arrAll[i].type == elem.type) 
					return true;
			}
			//f(elem.type == 'ORK'){
				elem.parentNode.removeChild(elem);
				allObject.splice(num,1);
			//}
		});
	}

	this.objectInMap = function (){
		//arrAll = w.getAll(player_id);
		removeIfDie(arrAll, allObject);
		arrAll.forEach(function(object){
			if ((selectForUpgrade)&&(object.id==selectForUpgrade.id)){
				var elem=document.getElementById("listbox");
				for (var i=0;i<object.lvlInfo.length;i++) {
					elem.childNodes[i].innerHTML = object.lvlInfo[i].upgrade + ' ' + object.lvlInfo[i].lvl + '/' + object.lvlInfo[i].maxLvl;
				}
			}
			switch (object.type){
				case 'PLAYER':
					var t = document.getElementById("Gold");
					t.innerHTML = "Gold : "+Math.floor(object.gold);
					var t = document.getElementById("player");
					t.innerHTML = "Имя: "+object.player_name;
					t.style.backgroundColor = generateColor(object.player_id);
					player_id = object.player_id;
				break;

				case 'WALL' :
				//	masM[object.coord[0]][object.coord[1]].style.backgroundColor ="rgb(28, 28, 28)";
					rendO();
				break;

				case 'PLACE' :
					if (masM[object.coord[0]][object.coord[1]].style.backgroundColor!="black"){
						masM[object.coord[0]][object.coord[1]].style.backgroundColor = "rgb(128, 128, 128)";
						masM[object.coord[0]][object.coord[1]].style.borderColor=generateColor(object.player_id);
					}

					break;

				case 'BLOCK' :
					masM[object.coord[0]][object.coord[1]].style.backgroundColor="black";
				break;

				case 'CASTLE':
					if(object.player_id == player_id) {
						var t = document.getElementById("castle");
						t.innerHTML = "Здоровье замка: " + object.hp;
					}

					masM[object.coord[0]][object.coord[1]].style.backgroundColor = generateColor(object.player_id);//"black";
					rendO();
					break;

				default:
					rendO();
					break;

					function rendO(){
						renderObject(object, images[object.type]);
						if(object.attackTarget){
							var target_obj = findObjectById(object.attackTarget); //TODO - need target ID from server
							if(target_obj)
							renderAttackAnimation(object.type, object.coord, target_obj.coord);
						}
					}
			}

		});	
	}

	function Obr(make,type,coord,player_id){
		this.make=make;
		this.type=type;
		this.coord=coord;
		this.player_id=player_id;
	}

this.start_game=function(){
	var newTower = new Obr("start","TOWER",[1,1],23)
	socket.send(JSON.stringify(newTower));

}

this.buy_hunter=function(){
	var newTower = new Obr("create","HUNTER",[width/2,height/2],player_id)
	socket.send(JSON.stringify(newTower));
}

this.buy_troll=function(){
	var newTower = new Obr("create","TROLL",[width/2,height/2],player_id)
	socket.send(JSON.stringify(newTower));
}

	setInterval(this.objectInMap.bind(this), 100);
}

