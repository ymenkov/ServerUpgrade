var MAP= require('./gameMap');

var gameObjects = require('./gameConfig');

function World(width, height){

    this.setAllObj=function(){
        return all_obj;
    }

    this.setPlayers=function(){
        return players;
    }

    var me = this;
    var event = [];
    var all_obj = [];
    var players = [];
   // var playerId = 0;
    var timerId = null;
    var id = 0;
    var thrones=[[1,1],[width-2,height-2],[1,height-2],[width-2,1]]

    me.gameObjects = gameObjects;
    me.gameMap = new MAP.GameMap(width, height);

    me.getAll = function(playerid){
        var player= findObjectInArray(players, 'id', playerid);
        var rez= all_obj.filter(function(obj){ return obj.hp != 'del' }).map(function(obj){
            return {
                type: obj.type,
                id: obj.id,
                coord: obj.coord,
                player_id: obj.playerId,
                hp: obj.hp,
                attackTarget: obj.attackTarget,
                moveAnimation: obj.moveAnimation,
                lvlInfo: obj.lvlInfo
            }
        })

        rez.push({
            type: 'PLAYER',
            gold: player.gold,
            player_name: player.name,
            player_id: player.id
        });

        return rez;
    }

    me.getPlayers = function(){ return players }

    me.createPlayer = function(name, player_id){
        var new_player = {
            type: "PLAYER",
            die: false,
            id: player_id,
            name: name,
            coord:thrones[player_id],
            tow:2,
            place:2,
            wall:3,
            gold:3000,
        };

        players.push(new_player);
        me.createObject('CASTLE', new_player.id, thrones[new_player.id]);
        this.buildCastle(thrones[new_player.id],new_player.id);
    };

    this.buildCastle=function(coord,player_id){
        for (var i=0;i<width;i++){
            for(var j=0;j<height;j++){
                if ((Math.abs((i-coord[0]))<3)&&(Math.abs((j-coord[1])))<3){
                    if ((i==coord[0])&&(j==coord[1])){}else{
                        var config = findObjectInArray(gameObjects, 'type', "PLACE");
                        me.createObject("PLACE", player_id, [i,j], config);						}

                }
            }
        }
    }



    me.createOrks=function(player_id){
        this.spawn -= 100;
        if(!this.spawn){
            this.spawn = this.spawnInterval*100;
            var config = findObjectInArray(gameObjects, 'type', "ORK");
            me.createObject("ORK", player_id, this.coord, config);
        }
    }

    function cloneObject(me, arr){
        for(var i=0; i<arr.length; i++){
            var clone = arr[i];
            for(param in clone){
                if(clone.hasOwnProperty(param)) {
                    if( (typeof clone[param]) == 'object') {
                        me[param] = clone[param].length? []: {};
                        cloneObject(me[param], [clone[param]]);
                    } else {
                        if (me[param] == undefined)
                            me[param] = clone[param];
                    }
                }
            }
        }
    }

    function gameObject(id, type, playerId, coordinate, config){
        this.id=id;
        this.type=type; // тип объекта
        this.coord=coordinate; // координаты объекта
        this.playerId = playerId;
        this.attackTarget = false;
        cloneObject(this, [config]);
        if (!this.attackOrHeal){this.attackOrHeal=false;}
        this.maxHp=this.hp;

        // this.hp=config.hp;
        // this.moveTargets=config.moveTargets;
        // this.attackTargets=config.attackTargets || [];
        // this.damage=config.damage;
        // this.moveSpeed=config.moveSpeed;
        // this.attackSpeed=config.attackSpeed;
        // this.attackRadius = config.attackRadius;
        // this.attackTarget = false;
        // this.block=config.block;
        // this.spawnInterval = config.spawnInterval || 0;
        // this.price = config.price;
        // this.lvlInfo=config.lvlInfo;



        this.attackCoolDown = (1000/this.attackSpeed).toFixed(0);
        this.moveCoolDown = (1000/this.moveSpeed).toFixed(0);


        this.move = function(all_obj){
            if(!this.moveTargets) return;
            var gameObj = this;
            this.moveCoolDown -= 100;
            if(!this.moveCoolDown){
                this.moveCoolDown = (1000/this.moveSpeed).toFixed(0);

                var targets = this.getMoveTargets(all_obj);
                if(targets.length){
                    targets = targets.map(function(t){
                        return { coord: t.coord, path: me.gameMap.findPathToCoordinate(gameObj.coord, t.coord,all_obj)}
                    });
                    targets.sort(function(a,b){ return a.path.length > b.path.length });

                    if(targets[0].path.length>2) //TODO - надо подумать как сделать красивее
                        var newCoordinate = targets[0].path[1];
                    else
                        var newCoordinate = this.coord;

                    this.moveAnimation = [ this.coord, newCoordinate ];
                    this.coord = newCoordinate;
                    delete targets;
                }
            }
        }


        this.getMoveTargets = function(all_obj){
            var targets = [];
            if(!this.moveTargets)return [];
            for(var i =0; i<all_obj.length; i++) {
                if (~this.moveTargets.indexOf(all_obj[i].type) && ((this.playerId != all_obj[i].playerId) != this.attackOrHeal)) {
                    if ((this.attackOrHeal==true)&&(all_obj[i].hp>=all_obj[i].maxHp)){}else{
                        targets.push({coord: all_obj[i].coord, hp: all_obj[i].hp});
                    }
                }

            }
            return targets.filter(function(target){
                return target.hp!="del";
            });
        }

        this.attack = function(all_obj){
            var gameObj = this;
            this.attackCoolDown -= 100;
            if(!this.attackCoolDown){
                this.attackCoolDown = (1000/this.attackSpeed).toFixed(0);
                var attackTargets=gameObj.getAttackTarget(all_obj,gameObj.attackTargets,gameObj.attackRadius,1,gameObj.coord);

                attackTargets.forEach(function(target){

                    //heal


                     if ((target.hp>=target.maxHp) && (this.attackOrHeal)){
                         target.hp=target.maxHp;
                         gameObj.attackTarget=false;
                         return;
                     }else if(target.hp=="del"){
                         gameObj.attackTarget=false;
                         return;
                     }
                    gameObj.attackTarget = target.id;
                    target.hp-=gameObj.damage;


                     //heal end


                    if ((target.hp<=0)&&(this.attackOrHeal==false)){
                        //if (target.type=="CASTLE") {dieAllObject(target.player_id);}
                        target.hp="del";
                        var kar=0;
                        for (var i=0;i<=all_obj.length-1;i++){
                            if ((all_obj.type=="CASTLE")&&(all_obj[i].playerId==target.playerId) && (target.hp!="del")){
                                kar=1;
                            }
                        }

                        if ((target.type=="CASTLE") && (kar!=1)){
                            me.delObjectsById(target.playerId);
                           // event.push({event:"die",type:"CASTLE",player:target.name});
                            me.createObject('CASTLE', this.playerId, target.coord);
                        }

                        var player = findObjectInArray(players, 'id', gameObj.playerId);
                        if (player) player.gold += target.price/4;
                    }


                }.bind(this));
                delete attackTargets;

            }


        }
        this.spawn=this.spawnInterval;
        this.spawnObjects=function(all_obj){
            if (!this.spawnInterval){return;}
            if (this.spawn==this.spawnInterval) {
                me.createObject(this.spawnType, this.playerId, this.coord);
                this.spawn=0;
                return;
            }
            this.spawn++;
        }

        this.craft=function(all_obj){
            if (!this.passiveGold){return;}
            for (var i=0;i<this.passiveGold.length;i++) {
                var player = findObjectInArray(players, 'id', this.playerId);
                player[this.passiveGold[i].type] = player[this.passiveGold[i].type] + this.passiveGold[i].amount;
            }
        }



        this.getAttackTarget = function(all_obj,attackTypes,radius,targetNumb,coord){
            var gameObj = this;

            if(!attackTypes.indexOf)return [];

            targets = all_obj.filter(function(target){
                return ~attackTypes.indexOf(target.type);
            })
            targets = targets.filter(function(target){
                if (((Math.abs(target.coord[0]-coord[0]))<radius)&&((Math.abs(target.coord[1]-coord[1]))<radius)){
                    return true;
                }
                return false;
            })
            targets = targets.filter(function(target){
                if ((gameObj.attackOrHeal==true)&&(gameObj.hp>=gameObj.maxHp)){
                    return [];
                }
                return (target.hp!="del" && ((target.playerId!=gameObj.playerId)!=gameObj.attackOrHeal));
            })
            return targets.slice(0,targetNumb);
        }


    }

    me.buyObject = function(type, playerId, coord){
        var coordinate=coord;
        var config = findObjectInArray(gameObjects, 'type', type);
        var player = findObjectInArray(players, 'id', playerId);
        if ((config.block==false)&&(config.type!="PLACE")){
           coordinate= thrones[playerId];
        }
        if( config && player && me.gameMap.checkPointToFree(coordinate,all_obj,config.block,type,playerId)){

            if(player.gold >= config.price){
                player.gold -= config.price;
                me.createObject(type, playerId, coordinate, config);
            }
        }
    };

    me.createObject = function(type, playerId, coordinate, conf){
        var config = conf || findObjectInArray(gameObjects, 'type', type);
        if(config){
            var new_obj = all_obj.push(new gameObject(++id, type, playerId, coordinate, config));
            return new_obj;
        }
        return false;
    };

    function worldInterval(){
        all_obj.forEach(function(game_Object){
            if(game_Object.hp!='del') {
                game_Object.move.call(game_Object, all_obj);
                game_Object.attack.call(game_Object, all_obj);
                game_Object.spawnObjects.call(game_Object, all_obj);
                game_Object.craft.call(game_Object, all_obj)
            }
        });
    }
    me.delObjectsById = function(player_id){
        for (var i=0;i<=all_obj.length-1;i++){
            if (all_obj[i].playerId==player_id){
                all_obj[i].hp="del";
            }
        }
    }


    function randomBlocks(num){
        var all_castle = findObjectsInArray(all_obj, 'type', 'CASTLE');
        var all_place = findObjectsInArray(all_obj, 'type', 'PLACE');
        var block_array = [];
        var i = 0,
            wL = height- 1,
            hL = width-1;
        while (i<num) {
            var x = (Math.random()*wL).toFixed(0);
            var y = (Math.random()*hL).toFixed(0);

            if(all_castle.every(function (cc){ return cc.coord[0]!==y && cc.coord[1]!=x }))
                if(all_place.every(function (cc){ return cc.coord[0]!==y && cc.coord[1]!=x })) {
                    if(~!block_array.indexOf(''+x+''+y)) {
                        block_array.push('' + x + '' + y);
                        me.createObject("BLOCK", 999, [y, x]);
                        i++;
                    } else console.log('repeat');
                }
        }
    }

    me.startWorld = function(){
        if(!me.worldStart) randomBlocks(20);

        timerId = setInterval( worldInterval.bind(me), 100 );
        me.worldStart = true;
    }

    me.pauseWorld = function(){
        clearInterval(timerId);
    }



    me.upLvl=function(mes){
        var player = findObjectInArray(players, 'id', mes.player_id);
        var object = findObjectInArray(all_obj, 'id', mes.id);
        if (mes.player_id!=object.playerId){return;}
        var number = findObjectInArray(object.lvlInfo, "upgrade", mes.upgrade);
        if (!object.lvlInfo){return;}
        if ((number.lvl<number.maxLvl) && (player.gold >= number.price)){
            player.gold-=number.price;
            number.lvl=number.lvl+1;

            if (mes.upgrade=="hp"){object["maxHp"]=object["maxHp"]+number.step;} //говноКод

            object[mes.upgrade]=object[mes.upgrade]+number.step;
            console.log(object.id)
        }

    }

    /////////////////////////
    // other functions

    function findObjectInArray(array, param, value){
        for(var i=0; i<array.length; i++)
            if(array[i][param]==value)
                return array[i];
        return false;
    }

    function findObjectsInArray(array, param, value){
        var reaz = [];
        for(var i=0; i<array.length; i++)
            if(array[i][param]==value)
                reaz.push(array[i]);
        return reaz;
    }
}

module.exports.World = World;