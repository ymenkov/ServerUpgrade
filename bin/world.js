var MAP= require('./gameMap');

var gameObjects = require('./gameConfig');

function World(width, height){

    var me = this;
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
                lvlInfo: obj.lvlInfo,
                maxHp:obj.maxHp,
                skills : obj.skills,
                control : obj.control
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

    me.createPlayer = function(name, player_id,hero){
        var new_player = {
            type: "PLAYER",
            die: false,
            id: player_id,
            name: name,
            coord:thrones[player_id],
            gold:3000,
        };
        players.push(new_player);
        me.createObject('CASTLE', new_player.id, thrones[new_player.id]);
      // me.createObject(hero, new_player.id, thrones[new_player.id]);
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
        this.attackTarget = false; // id атакуемого объекта
        cloneObject(this, [config]);
        if (!this.attackOrHeal){this.attackOrHeal=false;} // объект либо хилит, либо дамажит. По умолчанию дамажит
        if (!this.capture){this.capture=[{target:"CASTLE",change:"CASTLE"}];} // по умолчанию только на месте разрушенного замка появляется новый замок
        if (!this.control){this.control={status:"auto",coord:[],radius:this.attackRadius};} // объект двигается автоматически
        if (!this.skills){this.skills=false;}
        if (!this.targetNumb){this.targetNumb=1;}
        this.maxHp=this.hp; // Максимальное hp введено из-за up lvl

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
                        var k = me.gameMap.findPathToCoordinate(gameObj.coord, t.coord,all_obj);
                     if (k.length!=0){
                         return {coord: t.coord, path: k}
                     }
                    });

                    targets = targets.filter(function(target){
                        return target!==undefined;                  // ГОВНОКОД
                    });

                        for (var i = 0; i < targets.length; i++) {
                            if ((targets[i]) && (targets[0].path.length > targets[i].path.length)) {
                                targets[0].path = targets[i].path;
                            }
                        }

                    if((targets[0])&&(targets[0].path.length>this.control.radius)) { //TODO - надо подумать как сделать красивее
                        var newCoordinate = targets[0].path[1];
                    }
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
            if (this.control.status=="hand"){
                targets.push({coord: this.control.coord, hp: 1});
               if (targets[0].coord===false){return [];}
                return targets;
            }
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
                var attackTargets=gameObj.getAttackTarget(all_obj,gameObj.attackTargets,gameObj.attackRadius,this.targetNumb,gameObj.coord,this.attackOrHeal);

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


                    if ((target.hp<=0)&&(!this.attackOrHeal)){
                        var swap = findObjectInArray(this.capture, "target", target.type);
                        target.hp="del";
                        var kar=0;

                        switch (swap.target) {
                            case "CASTLE" : // Уничтожение замка - main событие в игре, так что это не говнокод
                                for (var i = 0; i <= all_obj.length - 1; i++) {
                                    if ((all_obj.type == swap.target) && (all_obj[i].playerId == target.playerId) && (target.hp != "del")) {
                                        kar = 1;
                                    }
                                }

                                if ((target.type == swap.target) && (kar != 1)) {
                                    me.delObjectsById(target.playerId);
                                    me.createObject(swap.change, this.playerId, target.coord);
                                }
                                break;

                            default:
                                me.createObject(swap.change, this.playerId, target.coord);
                                break;
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


// **************SKILLS************************
        this.skillsCoolDown=function(all_obj){
            if (this.skills==false){return;}
            for (var i=0;i<this.skills.length;i++){
                if ((this.skills[i].type=="active")&&(this.skills[i].nowCoolDown<this.skills[i].coolDown)){
                    this.skills[i].nowCoolDown+=1;
                }
                if (this.skills[i].type=="passive"){
                    me.useSkill({id:this.id,skill:this.skills[i].skill});
                }
            }
        }


        this.vortex=function(skill){ // Активируемая способность, атакует всех противников в радиусе
            if (!this.skills) {return;}
            var gameObj = this;
            var attackTargets=gameObj.getAttackTarget(all_obj,gameObj.attackTargets,skill.radius,"all",gameObj.coord,false);
            attackTargets.forEach(function(target){
                if (target.hp!="del") {
                    target.hp -= skill.damage;
                }
                if (target.hp<=0){
                    target.hp="del";
                }
            }.bind(this));
        }

        this.radiance=function(skill){ // // Пассивная способность, атакует всех противников в радиусе
            if (!this.skills) {return;}
            var gameObj = this;
            var attackTargets=gameObj.getAttackTarget(all_obj,gameObj.attackTargets,skill.radius,"all",gameObj.coord,false);
            attackTargets.forEach(function(target){
                if (target.hp!="del") {
                    target.hp -= skill.damage;
                }
                if (target.hp<=0){
                    target.hp="del";
                }
            }.bind(this));
        }

        this.forceStaff=function(skill){ // Активируемая способность, ускоряет объект
            if (!this.skills) {return;}
            for (var i=0;i<skill.speed;i++) {
                this.moveCoolDown = 100;
                this.move(all_obj);
            }
        }

        this.mine=function(skill){
            if (!this.skills) {return;}
            var gameObj = this;
            var attackTargets=gameObj.getAttackTarget(all_obj,gameObj.attackTargets,skill.radius,"all",gameObj.coord,false);
            attackTargets.forEach(function(target){
                if (target.hp!="del") {
                    target.hp -= skill.damage;
                    gameObj.hp="del";
                }
                if (target.hp<=0){
                    target.hp="del";
                }
            }.bind(this));
        }

        this.spawnMob=function(skill){
            if (!this.skills) {return;}
            me.createObject(skill.object, this.playerId, this.coord);
        }



// **************SKILLS END************************

        this.getAttackTarget = function(all_obj,attackTypes,radius,targetNumb,coord,attackOrHeal){
            var gameObj = this;

            if(!attackTypes.indexOf)return [];

            targets = all_obj.filter(function(target){
                return ~attackTypes.indexOf(target.type);
            })
            ///
            // if ((this.control.status=="hand")&&(this.control.target!=false)){
            //     var object = findObjectInArray(all_obj, 'id', this.control.target);
            //     targets[0]=object;
            // }
            ///
            targets = targets.filter(function(target){
                if (((Math.abs(target.coord[0]-coord[0]))<radius)&&((Math.abs(target.coord[1]-coord[1]))<radius)){
                    return true;
                }
                return false;
            })
            targets = targets.filter(function(target){
                return (target.hp!="del" && ((target.playerId!=gameObj.playerId)!=attackOrHeal));
            })
            if (targetNumb=="all"){return targets;}
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
                game_Object.skillsCoolDown.call(game_Object, all_obj);
            }
        });
    }
    me.delObjectsById = function(playerId){
        for (var i=0;i<=all_obj.length-1;i++){
            if (all_obj[i].playerId==playerId){
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
        }

    }

    me.changeControl=function(mes){
        var object = findObjectInArray(all_obj, 'id', mes.id);
        if (mes.player_id!=object.playerId){return;}
        if (object.control.status==mes.status){
            object.control.radius = 1;
            object.control.coord = mes.coord;
        }
    }

    me.useSkill=function(mes){
        var object = findObjectInArray(all_obj, 'id', mes.id);
        var skill = findObjectInArray(object.skills, "skill", mes.skill);
        if (skill.nowCoolDown==skill.coolDown){
            object[mes.skill](skill);
            skill.nowCoolDown=0;
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