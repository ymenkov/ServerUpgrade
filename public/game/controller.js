var statusController=0;
var select;
var selectForUpgrade;

function CONTROLLER(width, height) {
	function Obr(make, type, coord, plyaer_id) {
		this.make = make;
		this.type = type;
		this.coord = coord;
		this.player_id = player_id;
	}

	var width = width;
	var height = height;

	var element = document.createElement("div");

	this.kappa = function (event) {

		for (var i = 0; i < width; i++) {
			for (var j = 0; j < height; j++) {
				if (masM[i][j] == event.target) {
					var newWall = new Obr("create", select.type, [i,j], player_id);
					socket.send(JSON.stringify(newWall));
				}
			}
		}


			//
			// 	if(statusController==0){
			// 		for (var i=0;i<width;i++){
			// 			for (var j=0;j<height;j++){
			// 				if (masM[i][j]==event.target) {
			// 					var newWall = new Obr("create","WALL",[i,j],player_id)
			// 					socket.send(JSON.stringify(newWall));
			// 				}
			// 			}
			//
			// 		}
			// 	}
			// 	if(statusController==1){
			// 		for (var i=0;i<width;i++){
			// 			for (var j=0;j<height;j++){
			// 				if (masM[i][j]==event.target) {
			// 					var newTower = new Obr("create","TOWER",[i,j],player_id)
			// 					socket.send(JSON.stringify(newTower));
			// 				}
			// 			}
			//
			// 		}
			// 	}
			//
			// 	if(statusController==2){
			// 		for (var i=0;i<width;i++){
			// 			for (var j=0;j<height;j++){
			// 				if (masM[i][j]==event.target) {
			// 					var newWall = new Obr("create","PLACE",[i,j],player_id)
			// 					socket.send(JSON.stringify(newWall));
			// 				}
			// 			}
			//
			// 		}
			// 	}
			// }

	}
}