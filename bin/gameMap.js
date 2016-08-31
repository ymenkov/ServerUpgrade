var PF = require('pathfinding');

function GameMap(width, height){
	var me = this;
	me.width = width;
	me.height = height;

	allBlocks = [];

	me.addBlock = function(coordinate){

	}

	me.removeBlock = function(coordinate){
		
	}

	function findObjectsInArray(array, param, value){
		var reaz = [];
		for(var i=0; i<array.length; i++)
			if(array[i][param]==value)
				reaz.push(array[i]);
		return reaz;
	}

	me.findPathToCoordinate = function(from, to,all_obj){

		var grid = new PF.Grid(me.width, me.height); 
		var finder = new PF.AStarFinder();

		var objects = findObjectsInArray(all_obj, 'block', true);
		objects.forEach(function(obj){
			try {
				if ((obj && obj.coord != to ) && (obj.hp != "del"))
					grid.setWalkableAt(obj.coord[0], obj.coord[1], false);
			} catch(e){
				console.error(e.message);
			}
		});

		return finder.findPath(from[0], from[1], to[0], to[1], grid);
	}

	me.findFreeSpace = function(longAwayCoordinate){
		//TODO - need for find CASTLE long away coordinate
	}

	me.searchPlace=function(i,j,player_id,all){
		for (var k=0;k<=all.length-1;k++){
		//	alert(all[k].playerId)
			if ((all[k].type=="PLACE") && (all[k].coord[0]==i)&&(all[k].coord[1]==j)&&(all[k].playerId==player_id)){

				return true;
			}
		}
		return false;
	}

	me.checkPointToFree = function(coord,all_obj,config_block,type,player_id){
		var i = coord[0]; var j = coord[1];
		if ((type=="PLACE")&&(((j>0)&&(me.searchPlace(i,j-1,player_id,all_obj)))||((i>0)&&(me.searchPlace(i-1,j,player_id,all_obj)))||((j<height-1)&&(me.searchPlace(i,j+1,player_id,all_obj)))||((i<width-1)&&(me.searchPlace(i+1,j,player_id,all_obj))))){
			return true;
		} else if (type=="PLACE") {
			return false;
		}

		for (i=0;i<=all_obj.length-1;i++){
			if ((all_obj[i].coord[0]==coord[0]) && (all_obj[i].coord[1]==coord[1])&&(all_obj[i].playerId==player_id)){
				if((config_block==true) && (all_obj[i].type=="PLACE")){
					return true;
				}	//else {return false;}
			} 	else if(config_block==false){
				return true;

				}
			
		}
	}	
		
}

module.exports.GameMap = GameMap;