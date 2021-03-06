;(function(){
	var tetris=function(a){
		var _this=this;
		this.settings={
			dom:"",
			side_length:25,//方块边长
			row:20,//行数
			col:15,//列数
			v_dowm:10,
			side_width:1//分隔线条宽度默认为1
		};
		
		var k=this.extend(a,this.settings);
		var dom=document.getElementById(this.settings.dom);
		var fall_2=undefined;//用于判断快速下落
		var score=0;//分数
		
		this.p_dom(dom,"初始级别:");
		this.p_dom(dom,"分数:","score");
		var score_dom=dom.getElementsByClassName("score")[0];
		score_dom.style.cssText="position:absolute;left: 0;right: 0;top: 30px;margin: auto auto;text-align: center;";
		var score_num=document.createElement("span");
		score_num.className="score_num";
		score_num.style.cssText="color:gold;font-size: 30px;";
		score_num.innerText=score;
		score_dom.appendChild(score_num);
		this.input_dom(dom,4);
		
		var start_con=false;//是否开始游戏
		var shape =shape_collection;//各种形状,这是一种思路,也很利于以后形状的添加
		var shape_key=_this.obj_list(shape);//[s1,s2,s3,s4,s5,s6,s7]
		var color=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];//颜色
		var cube_arr=[];//用来装建造区域小方块
		var cube_arr_s=[];//用来装提示图形区域小方块
		var shape_arr={//用来表示下落的滑块
			shape_solo:undefined,//s1——s7中某一个的某一个图形
			solo_key:undefined,//shape_solo的key值
			mo_list:undefined,//绘制的图形在数组shape_solo的下标,变换图形的时候用到
			serial:[],//小方块坐标集合，默认为空，不绘制小块。绘制小方块的参考，重要参数
			re_point_x:(_this.settings.col/2)|0,//以第几个为初始参考X坐标(用于左右移动)
			re_point_y:0,//y坐标参考。（不要在serial里面修改值，serial总在4X4里面，容易做参考）
			width:_this.settings.side_length,//小方块的宽度
			v:_this.settings.side_length+_this.settings.side_width,//每次移动的距离等于方块边长+grid线宽
			collision_l:false,//与左边是否碰撞
			collision_r:false,//与右边是否碰撞
			collision_d:false,//与下边是否碰撞
			draw:function(a){//绘制小方块函数,写在这里，才是这个对象的私有方法，而_proto_的写法是所有对象都拥有
					var se=this.serial;
					//console.log(se)
					for(var i=0;i<se.length;i++){
						a.beginPath();
						a.fillStyle=se[0][2];//this指向这个对象.第三个参数是颜色
						a.fillRect(this.v*(this.re_point_x+se[i][0]),this.v*(this.re_point_y+se[i][1]),this.width,this.width);
					}
				}
		};
		//创建提示图形
		var ts="ts";//提示图形ID；
		this.canvas_dom(dom,this.settings.side_length,4,4,this.settings.side_width);
		var canvas_s=dom.getElementsByTagName("canvas")[0];
		canvas_s.setAttribute("style","position: absolute;right: 130px;border:3px solid goldenrod;top: 82px;")
		var ctx_s=canvas_s.getContext("2d");
		var cube_obj_s=_this.cube_obj_arr(ctx_s,this.settings.side_length,4,4,this.settings.side_width,cube_arr_s);
		var shape_arr_s=this.clone_obj(this.draw_shape(ts,shape,shape_arr,shape_key,_this.make_color(color)));//因为返回的是shape_arr，所以这里导致了shape_arr_s和shape_arr有关联，也就是说以后的代码中，其中一个改变的话，另一个也会跟着改变，用clone方法去掉关联
		cube_obj_s.forEach(function(e){
			e.draw(ctx_s);
		});
		shape_arr_s.draw(ctx_s);
		
		//创建堆砌图形
		var dq="dq";//堆砌图形ID；
		this.canvas_dom(dom,this.settings.side_length,this.settings.row,this.settings.col,this.settings.side_width);
		var canvas=dom.getElementsByTagName("canvas")[1];
		var ctx=canvas.getContext("2d");
		var cube_obj=_this.cube_obj_arr(ctx,this.settings.side_length,this.settings.row,this.settings.col,this.settings.side_width,cube_arr);
		//this.grid(ctx,this.settings.side_length,this.settings.row,this.settings.col,this.settings.side_width);//网格
		//console.log(cube_obj);
		cube_obj.forEach(function(e){
			e.draw(ctx);
		});
		var shape_arr_t=this.clone_obj(this.draw_shape(ctx,shape,shape_arr,shape_key,_this.make_color(color)));
		//console.log(shape_arr);
		shape_arr_t.draw(ctx);
		
		//鼠标事件
		window.onkeydown=function(e){
			switch (e.keyCode){
				case 87://up
					up();
					break;
				case 83://down
					//down();
					break;
				case 65://left
					left();
					break;	
				case 68://right
					right()
					break;
				case 32://workspace
					//up();
					break;	
				case 13://enter
					enter();
					break;	
				default:
					break;
			}
		};
		
		window.onkeypress=function(e){//onkeypress和onkeydown，即使按下的是同一个按键，e.keyCode也不一样
			if(start_con){		
				switch (e.keyCode){
					case 115:
						if(fall_2==undefined){//做这个判断是为了防止快速的点击S键时，出现的多次fall_2事件，因为50ms之后，fall_2的值才变成undefined
							fall_2=setInterval(fall,10);//clearInterval返回的值是undefined，而setInterval返回的值是一个整数
							setTimeout(function(){
								fall_2=clearInterval(fall_2);//重置fall_2的值为undefined
							},50);
						}
						break;
					default:
						break;
				}
			}
		}
		
		function up(){//shape和shape_arr的关系要弄清楚，这里判断有点复杂
			if(start_con){
				ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
				cube_obj.forEach(function(e){//重新绘制虚拟小方块
					e.draw(ctx);
				})
				var l=shape[shape_arr_t["solo_key"]].length-1;//数组长度减1
				var i_list=shape_arr_t["mo_list"];//对应数组的key
				var re_point_x=shape_arr_t["re_point_x"];
				var con_l=shape_arr_t["shape_solo"].l;
				var con_r=shape_arr_t["shape_solo"].r;
				
				var con_l_l=false;//用于判断左右是否有con为1的虚拟滑块，不仅仅要判断是否碰到边上，还要判断这个
				var con_r_r=false;
				var con_suxian=false;//竖线
				
				var arr_se=[];
				var k_uni=shape_arr_t["serial"].length;
				for(var i_uni=0;i_uni<k_uni;i_uni++){//取出图形所有小块的横坐标,这里有两个for循环，相同的变量会互相影响，所有设置成i_uni
					arr_se.push(shape_arr_t["serial"][i_uni][0]);
				}
				var min_coor=Math.min.apply(null,arr_se);
				var max_coor=Math.max.apply(null,arr_se);
					
				for(var i_y_a=0;i_y_a<k_uni;i_y_a++){
					var c_x_1=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i_y_a][0];
					var c_y_1=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i_y_a][1];
					if(cube_obj[c_y_1*_this.settings.col+c_x_1+1]!==undefined&&cube_obj[c_y_1*_this.settings.col+c_x_1+1].con==1){//任意滑块con==1的时候
						con_r_r=true;
						break;
					}
				}
				
				for(var i_y_b=0;i_y_b<k_uni;i_y_b++){//其实左右可以合并成一个判断，省掉一些代码
					var c_x_2=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i_y_b][0];
					var c_y_2=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i_y_b][1];
					if(cube_obj[c_y_2*_this.settings.col+c_x_2-1].con==1){//任意滑块con==1的时候
						con_l_l=true;
						break;
					}
				}
				
				if(shape_arr_t["solo_key"]==="s1"){//竖线情况特殊，单独处理，其实应该写一个函数来统一判断，不应该出现特殊图形，不然特殊图形增加的话，要增加很多判读			
					if(i_list==1){//如果是竖线的话
						for(var i_y_c=0;i_y_c<k_uni;i_y_c++){//如果是竖线的话，则右边2格处虚拟方块的con是1，也不能变形,这里到下一行的情况也能适应
							var c_x_3=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i_y_c][0];
							var c_y_3=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i_y_c][1];
							if(cube_obj[c_y_3*_this.settings.col+c_x_3+2]!==undefined&&cube_obj[c_y_3*_this.settings.col+c_x_3+2].con==1||cube_obj[c_y_3*_this.settings.col+c_x_3-1].con==1){//任意滑块con==1的时候
								con_suxian=true;
								break;
							}
						}
						if(re_point_x+max_coor<_this.settings.col-2&&re_point_x>(0- min_coor)&&!con_suxian){
							shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][0];
							shape_arr_t["mo_list"]=0;//序号为0
						}
					}else{
						shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][i_list+1];
						shape_arr_t["mo_list"]+=1;//序号加1
					}
				}else{
					if(re_point_x+max_coor>=(_this.settings.col-1)||con_r_r){//靠近右边或者右边有con为1的方快（实体方块）
						if(con_r){
							if(i_list<l){
								shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][i_list+1];
								shape_arr_t["mo_list"]+=1;//序号加1
							}else{
								shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][0];
								shape_arr_t["mo_list"]=0;//序号为0
							}
						}
					}else if(re_point_x<=(0-min_coor)||con_l_l){//靠近左边或者左边有con=1的方块
						if(con_l){
							if(i_list<l){
								shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][i_list+1];
								shape_arr_t["mo_list"]+=1;//序号加1
							}else{
								shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][0];
								shape_arr_t["mo_list"]=0;//序号为0
							}
						}
					}else{
						if(i_list<l){
							shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][i_list+1];
							shape_arr_t["mo_list"]+=1;//序号加1
						}else{
							shape_arr_t["shape_solo"]=shape[shape_arr_t["solo_key"]][0];
							shape_arr_t["mo_list"]=0;//序号为0
						}
					}
				}
				
				var s_cube=shape_arr_t["shape_solo"];//图形变换，根据shape
				var s_mo=s_cube["mo"];//图形元素
				var k=s_mo.length;
				var color=shape_arr_t["serial"][0][2];//取出颜色
				//console.log(color)
				shape_arr_t["serial"].length=0;//数组置空
				//console.log(shape_arr["serial"])
				for(var i=0;i<k;i++){//这里的长度是4
					for(var j=0;j<k;j++){//这里的长度是4
						if(s_mo[i][j]){//如果等于1的话
							shape_arr_t["serial"].push([j,i,color])//需要绘制小块的坐标,所有小方块颜色一样，如果想变成不一样，则在for循环内部执行生成颜色函数,j,i才能对应图形
						}
					}
				}
				//console.log(shape_arr)
				shape_arr_t.draw(ctx);//重新绘制
			};
		}
		function left(){
			if(start_con){
				ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
				cube_obj.forEach(function(e){//重新绘制虚拟小方块
					e.draw(ctx);
				})
				var arr_se=[];
				var con=true;
				var k=shape_arr_t["serial"].length;
				for(var i_uni=0;i_uni<k;i_uni++){//取出图形所有小块的横坐标
					arr_se.push(shape_arr_t["serial"][i_uni][0]);
				}
				var min_coor=Math.min.apply(null,arr_se);//取出最小的，其实这里除了竖线那个图形之外，最小的值都是0，但是这里这样写，有利于拓展以后可能出现的其他情况
				if(shape_arr_t["re_point_x"]<=(0- min_coor)){//碰到边界的时候
					con=false;
				}
				for(var i=0;i<k;i++){//判断所有小块左边的虚拟方块的con是否都是0
					var c_x=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i][0];
					var c_y=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i][1];
					if(cube_obj[c_y*_this.settings.col+c_x-1].con==1){//任意滑块con==1的时候。住：加1减一的时候，有可能到上一行下一行，但是这种情况就靠边了，所以这样判断还是对的
						con=false;
						break;
					}
				}
				if(con){
					shape_arr_t["re_point_x"]-=1;	
				}
				shape_arr_t.draw(ctx);//重新绘制
			}
		};
		
		function right(){
			if(start_con){
				ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
				cube_obj.forEach(function(e){//重新绘制虚拟小方块
					e.draw(ctx);
				})
				var con=true;
				var arr_se=[];
				var k=shape_arr_t["serial"].length;
				for(var i_uni=0;i_uni<k;i_uni++){//取出图形所有小块的横坐标
					arr_se.push(shape_arr_t["serial"][i_uni][0]);
				}
				var max_coor=Math.max.apply(null,arr_se);//取出最大的
				if(shape_arr_t["re_point_x"]+max_coor>=(_this.settings.col-1)){//靠边的话
					con=false;
				}
				for(var i=0;i<k;i++){//判断所有小块右边的虚拟方块的con是否都是0
					var c_x=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i][0];
					var c_y=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i][1];
					if(cube_obj[c_y*_this.settings.col+c_x+1]!==undefined&&cube_obj[c_y*_this.settings.col+c_x+1].con==1){//任意滑块con==1的时候
						con=false;
						break;
					}
				}
				if(con){
					shape_arr_t["re_point_x"]+=1;	
				}
				shape_arr_t.draw(ctx);//重新绘制
			}
		};
		
		function down(){
			
		};
		
		function enter(){
			var radio_arr=document.getElementsByClassName("level");
			if(!start_con){//如果还没开始的话，则开始(//设置条件判断。不停的点击enter的时候，只执行一次)
				Array.prototype.forEach.call(radio_arr,function(e){
					if(e.checked==true){
						k_t=e.value;//用于级别增加
						level_t=e.value;
					}
					e.setAttribute("disabled",true);
				})
				fall_1=setInterval(fall,_this.settings.v_dowm/level_t)//全局变量，用于domn函数的清除，但是这样就不能避免外部的污染了
				start_con=true;
			}
		};
		
		function get_score(){//得分机制，写了很多for循环，感觉应该有更好的判断
			var lose_row=[];//消失的行数
			var clear_con=false;//是否当前需要重绘
			for(var i=0;i<_this.settings.row;i++){
				var all_con=true;//默认当前行所有滑块的con都是1
				for(var j=0;j<_this.settings.col;j++){
					if(cube_obj[i*_this.settings.col+j]["con"]!==1){
						all_con=false;
						break;
					}
				}
				if(all_con){
					lose_row.push(i)
				}	
			}//以下代码在没有消除的行的时候，都不执行
			if(lose_row.length>0){//计算分数
				switch (lose_row.length){
					case 1:
						score+=10;
						break;
					case 2:
						score+=30;
						break;
					case 3:
						score+=60
						break;
					case 4:
						score+=100;
						break;	
					default:
						break;
				}
			}
			for(var i_sc=0;i_sc<lose_row.length;i_sc++){//把需要消除行的con变为0，用于消除，length为0的时候，表示没有需要消除的行
				for(var j_sc=0;j_sc<_this.settings.col;j_sc++){
					cube_obj[lose_row[i_sc]*_this.settings.col+j_sc]["con"]=0;//重置为虚拟
					cube_obj[lose_row[i_sc]*_this.settings.col+j_sc]["fillStyle"]="pink"//颜色重新变成粉红，这是0的标示
				}
				clear_con=true;//只要有需要消除的行，就要重绘
			}
			
			if(clear_con){
				ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
				cube_obj.forEach(function(e){//重新绘制虚拟小方块，移除消除的行
					e.draw(ctx);
				})
				score_num.innerText=score;//重新计算分数
			}
			
			for(var i_sc=0;i_sc<lose_row.length;i_sc++){//con为1的滑块往下移动
				var con_one=[];//用来存储所有con为1的虚拟滑块
				for(var i_v=0;i_v<_this.settings.row*_this.settings.col;i_v++){
					if(cube_obj[i_v]["con"]==1){
						con_one.push(cube_obj[i_v]);
					}
				}
				for(var i_l=con_one.length-1;i_l>=0;i_l--){//
					if(con_one[i_l]["row"]<lose_row[i_sc]){//如果位置在消失的滑块上方
						var fillStyle=con_one[i_l]["fillStyle"];//取出渲染颜色
						var row=con_one[i_l]["row"];//取出当前行数
						var col=con_one[i_l]["col"];//取出当前列数
						con_one[i_l]["con"]=0;//重置为虚拟
						con_one[i_l]["fillStyle"]="pink";
						var k=lose_row.length-i_sc;//往下移动多少行;
						cube_obj[(row+k)*_this.settings.col+col]["fillStyle"]=fillStyle;//移动之后变色	
						cube_obj[(row+k)*_this.settings.col+col]["con"]=1;
					}
				}
			}
			if(clear_con){//绘制
				clearInterval(fall_1);//fall函数停止执行
				setTimeout(function(){//xxms之后重绘，给人消失的效果，为了做成这种效果，造成了fall函数和get_score函数的嵌套，应该有更好的思路
					ctx_s.clearRect(0,0,canvas_s.width,canvas_s.height);//提示屏清除
					cube_obj_s.forEach(function(e){//提示屏虚拟方块重新绘制
						e.draw(ctx_s);
					});
					ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
					cube_obj.forEach(function(e){//重新绘制虚拟小方块
						e.draw(ctx);
					})
					shape_arr_t=_this.clone_obj(shape_arr_s);;//注“这里不能用var 声明变量，否则函数内部shape_arr的值会是undefined。
					shape_arr_t.re_point_x=(_this.settings.col/2)|0;//初始坐标做变化
					shape_arr_t.re_point_y=0;
					shape_arr_s=_this.draw_shape(ts,shape,shape_arr,shape_key,_this.make_color(color));
					shape_arr_s.draw(ctx_s);//重绘提示滑块
					if(score>=10&&score<20){//分数变化的话，则加速
						level_t=parseInt(k_t)+1;
					}else if(score>=20&&score<30){
						level_t=parseInt(k_t)+2;
					}else if(score>=30&&score<40){
						level_t=parseInt(k_t)+3;
					}else if(score>=40){
						level_t=parseInt(k_t)+4;
					}
					fall_1=setInterval(fall,_this.settings.v_dowm/level_t)//重新启动fall函数
				},250)
			}
			
			return clear_con;//用于判断后续作图
		};
		
		function fall(){//下落函数
			var arr_se=[];
			var con=true;
			var k=shape_arr_t["serial"].length;
//			for(var i=0;i<k;i++){//取出图形所有小块的纵坐标坐标
//				arr_se.push(shape_arr["serial"][i][1]);
//			}
//			var max_coor=Math.max.apply(null,arr_se);//取出最大的
			for(var i_que=0;i_que<k;i_que++){//判断所有小块下方的虚拟方块的con是否都是0
				var c_x_1=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i_que][0];
				var c_y_1=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i_que][1];
				//cube_obj[(c_y_1+1)*_this.settings.col+c_x_1]==undefined这种方法判断是否靠近底边
				if(cube_obj[(c_y_1+1)*_this.settings.col+c_x_1]==undefined||cube_obj[(c_y_1+1)*_this.settings.col+c_x_1].con==1){//到达底部或者下方任意滑块con==1的时候
					con=false;
					break;
				}
			}
			if(con){//不靠低边并且所有小块下方的虚拟方块的con都是0
				ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
				shape_arr_t["re_point_y"]+=1;	
				cube_obj.forEach(function(e){//重新绘制虚拟小方块
					e.draw(ctx);
				})
				shape_arr_t.draw(ctx);//重绘滑块
			}else{
				end();
				for(var i_uni=0;i_uni<k;i_uni++){
					var c_x_2=shape_arr_t["re_point_x"]+shape_arr_t["serial"][i_uni][0];
					var c_y_2=shape_arr_t["re_point_y"]+shape_arr_t["serial"][i_uni][1];
					var c_color=shape_arr_t["serial"][i_uni][2];
					cube_obj[c_y_2*_this.settings.col+c_x_2].fillStyle=c_color;//修改对应虚拟方块颜色
					cube_obj[c_y_2*_this.settings.col+c_x_2].con=1;//修改对应虚拟方块con
				}	
				con_s=get_score();
				if(!con_s){//没有消除行的话
					ctx.clearRect(0,0,canvas.width,canvas.height);//清屏
					ctx_s.clearRect(0,0,canvas_s.width,canvas_s.height);//提示屏清除
					cube_obj_s.forEach(function(e){//提示屏虚拟方块重新绘制
						e.draw(ctx_s);
					});
					cube_obj.forEach(function(e){//重新绘制虚拟小方块
						e.draw(ctx);
					})
//					shape_arr=shape_arr_s;//注“这里不能用var 声明变量，否则函数内部shape_arr的值会是undefined。
//					shape_arr_s=_this.draw_shape(ts,shape,shape_arr,shape_key,_this.make_color(color));
//					shape_arr一个对象，因而是引用类型值，所以执行shape_arr=shape_arr_s的时候，只是做了指针的重新指向，shape_arr会随着shape_arr_s的改变而改变
					shape_arr_t=_this.clone_obj(shape_arr_s);
					shape_arr_t.re_point_x=(_this.settings.col/2)|0;//初始坐标做变化
					shape_arr_t.re_point_y=0;
					shape_arr_s=_this.draw_shape(ts,shape,shape_arr,shape_key,_this.make_color(color));
					shape_arr_s.draw(ctx_s);//重绘提示滑块
					shape_arr_t.draw(ctx);//重绘滑块
				}
			}
		};
		
		function end(){//判断游戏结束
			var con_end=false;
			for(var i=0;i<_this.settings.col;i++){
				if(cube_obj[i]["con"]==1){
					alert("到顶了，你好菜");
					con_end=true;
					break;
				}
			}
			if(con_end){
				location.reload();
			}
		}
	}
	
	tetris.prototype={//constructor将不在指向原函数，指向这个对象，如果需要，则写明
		extend:function(a,b){
			for(var key in a){
				if(a[key]!==undefined){
					b[key]=a[key];
				}
			}
			return b;
		},
		
		clone_obj:function(myObj){//克隆对象
		  	if(typeof(myObj) != 'object') return myObj; 
		  	if(myObj == null) return myObj;  
		    
		    if(myObj instanceof Array){//如果是数组的话，则创建新数组
		    	var myNewObj=new Array();
		    	for(var i=0;i<myObj.length;i++){
		    		myNewObj[i]=arguments.callee(myObj[i]);
		    	}
		    }else{
		    	var myNewObj = new Object(); 
		    	for(var i in myObj)  
		   	 	myNewObj[i] = arguments.callee(myObj[i]);//递归。把所有的子对象都clone
		    }
		  	return myNewObj;  
		},
		
		p_dom:function(a,b,c){//创建p标签
			var p=document.createElement("p");
			p.style.cssText="font-size: 20px;";
			p.className=c;
			p.innerText=b;
			a.appendChild(p);
		},
		
		input_dom:function(a,b){//创建input标签
			for(var i=1;i<=b;i++){
				if(i==1){
					var ch="checked";
				}else{
					ch="";
				}
				var label_d=document.createElement("label");
				var str='<input type="radio" name="level" value="'+i+'" '+ch+' class="level">级别'+i;
				label_d.innerHTML=str;
				a.appendChild(label_d);
			}
		},
		
		canvas_dom:function(a,b,c,d,e){//创建canvas标签
			var canvas=document.createElement("canvas");
			canvas.style.cssText="border:3px solid #333333;display: block;margin: 0 auto;";
			canvas.setAttribute("width",d*(b+e)-e);
			canvas.setAttribute("height",c*(b+e)-e);
			a.appendChild(canvas);
		},
		
		cube_obj_arr:function(a,b,c,d,e,f){//创建小方块集合,从左往右，从上往下,虚拟的，这里可以不画出来
			for(var i=0;i<c;i++){
				for(var j=0;j<d;j++){
					var cube_obj={
						x_start:(b+e)*j,
						y_start:(b+e)*i,
						col:j,//第几烈
						row:i,//第几行
						fillStyle:"pink",//默认颜色
						side_width:b,
						con:0,
						draw:function(a){
							a.beginPath();
							a.fillStyle=this.fillStyle;//this指向这个对象
							a.fillRect(this.x_start,this.y_start,this.side_width,this.side_width)
						}
					};//条件以后按需添加
					f.push(cube_obj);
				}
			}
			return f;
		},
		
		grid:function(a,b,c,d,e){//画网格
			for(var i=1;i<c;i++){//行数
				a.beginPath();
				a.moveTo(0,i*(b+e)-e);
				a.lineTo(d*(b+e)-e,i*(b+e)-e);
				a.lineWidth=e;
				a.stroke();
			}
			for(var i=1;i<d;i++){
				a.beginPath();
				a.moveTo(i*(b+e)-e,0);
				a.lineTo(i*(b+e)-e,c*(b+e)-e);
				a.lineWidth=e;
				a.stroke();
			}
		},
		
		make_color:function(a){//生成随机颜色
			var color_true="#";
			for(var i=0;i<6;i++){
				color_true+=a[Math.round(Math.random()*15)];
			}
			return color_true;
		},
		
		obj_list:function(a){//for...in 循环只遍历可枚举属性。像 Array 和 Object 使用内置构造函数所创建的对象都会继承自 Object.prototype 和 String.prototype 的不可枚举属性
			var key_arr=[];
			for(var key in a){
				key_arr.push(key);
			}
			return key_arr;
		},
		
		draw_shape:function(a,b,c,d,e){//生成下落滑块//ctx,shape,shape_arr,shape_key,_this.make_color(color)
			if(a=="ts"){
				c["re_point_x"]=0;
				c["re_point_y"]=0;
			}else{
				c["re_point_x"]=(this.settings.col/2)|0;//重置
				c["re_point_y"]=0;//重置
			}
			c["serial"].length=0;//重置
			var shape_list=d[Math.round(Math.random()*(d.length-1))];//对象中的任意值
			c["solo_key"]=shape_list;
			var b_length=b[shape_list].length;
			var mo_list=Math.round(Math.random()*(b_length-1));
			c["mo_list"]=mo_list;
			var s_cube=b[shape_list][mo_list];//任一一个图形集合，包裹l，r
			c["shape_solo"]=s_cube//s1-s7中的某一个中的某一个图形
			var s_mo=s_cube["mo"];//图形元素
			var k=s_mo.length;
			for(var i=0;i<k;i++){//这里的长度是4
				for(var j=0;j<k;j++){//这里的长度是4
					if(s_mo[i][j]){//如果等于1的话
						c["serial"].push([j,i,e])//需要绘制小块的坐标,所有小方块颜色一样，如果想变成不一样，则在for循环内部执行生成颜色函数,j,i才能对应图形
					}
				}
			}
			return c;
		}
	}
	
	window.tetris=tetris;
})()

