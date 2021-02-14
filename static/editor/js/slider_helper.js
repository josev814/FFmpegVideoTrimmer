function proc_shortcut(){
	var s='*Shortcut key that you can use after giving focus to the time input box.';
	s+='\nArrow Up: Increase the time by 0.5 seconds';
	s+='\nArrow Down: Decrease the time by 0.5 seconds';
	s+='\nEnter: Moves the playback position to the current value';
	s+='\nSpace: Toggle Play or Pause';
	alert(s);
}
function proc_log(name,s,state,s2){
	function go(name){
		var obj=_getid(name);
		if(!obj){
			return;
		}
		var a=document.createElement("div");
		a.setAttribute('style','display:block;');
		if(!state) state='';
		var s3='<font class="'+state+'">'+henc(s)+'</font>';
		if(s2) s3+=' '+s2;
		a.innerHTML=s3;
		obj.appendChild(a);
		obj.scrollTop=obj.scrollHeight;
	}
	go(name);
}

var ismsie=false;
if(navigator.appName!="Netscape"){
	if(navigator.userAgent.indexOf("MSIE")>=0) ismsie=true;
}
if(navigator.userAgent.match(/Trident\//)) ismsie=true;
var issafari=false;
var ua = navigator.userAgent.toLowerCase();
if(ua.indexOf('safari') != -1 && ua.indexOf('chrome') <0) issafari=true;

var gbloburl, gbloburl2, g_videointerval, inputdata2;
var video1=_getid('video1');
var canvas1=_getid('canvas1');
var ctx = canvas1.getContext("2d");
var drawing;
var crop=[];
var video_size={'w': 0, 'h': 0, 'duration':0};
var time_start = 0;
var time_end = 1;
var slider1;
var slidermoving;
var stopupdate=false;
var current_time2_focused=false;
var g_supportimgs='aac,ac3,aiff,aif,amr,ape,au,flac,m4a,mka,mp3,mpc,ogg,ra,rm,wv,wav,wave,wma,asf,3ga,3gp,caf,gsm,m4p,m4r,mp2,mpa,mpga,oma,opus,qcp,ram,aifc,oga,voc,vqf,mp4,swf,avi,flv,m4v,mkv,mov,mpe,mpeg,mpg,mts,m2ts,ts,vob,ogv,wmv,gif,';
var g_outputtype=[["aac,","audio/aac"],["m4a,","audio/mp4"],["mp1,mp2,mp3,mpg,mpeg,","audio/mpeg"],["oga,ogg,opus,","audio/ogg"],["wav,","audio/x-wav"],["mp4,m4v,","video/mp4"],["flv,","video/x-flv"],["ogv,","video/ogg"],["mkv,","video/x-matroska"],["mov,","video/mp4"],["flac,","audio/flac"],["wmv,","video/x-ms-wmv"],["avi,","video/avi"],["gif,","image/gif"],["png,","image/png"],["jpg,jpeg,","image/jpeg"],["bmp,","image/bmp"],["webp,","image/webp"]];

function chk_orgsize_onclick(){
	if(_getid('chk_orgsize').checked){
		var a=_getid('resizable');
		if(video_size.h==0 || video_size.w==0){
			a.style.width='720px';
			a.style.height='480px';
		}else{
			a.style.width=video_size.w+'px';
			a.style.height=video_size.h+'px';
		}
	}else{
		size_width_onchange();
	}
}
function size_width_onchange(f){
	var w=_getid('size_width').value;
	if(w<100)w=100;
	if(w>1280)w=1280;
	if(f){
		_getid('size_width_n').value=w;
	}
	var a=_getid('resizable');
	a.style.width=w+'px';
	var h=Math.floor(a.offsetWidth*video_size.h/video_size.w);
	if(video_size.h==0 || video_size.w==0) h=480;
	a.style.height=h+'px'
}
function size_width_n_onchange(f){
	var w=_getid('size_width_n').value;
	if(w<100)w=100;
	if(w>1280)w=1280;
	_getid('size_width').value=w;
	size_width_onchange();
}
function chk_mute_onclick(){
	if(_getid('chk_mute').checked) video1.muted=true;
	else video1.muted=false;
}
function start_onchange(){
	var start=parseFloat(_getid('start').value);
	var end=parseFloat(_getid('end').value);
	if(isNaN(start)) start=0;
	if(isNaN(end)) end=0;
	if(stopupdate){
		if(start>end)return;
		if(slider1) slider1.updateOptions({range: {'min': 0, 'max': end}});
	}else{
		if(slider1 && start<slider1.options.range.min){
			start=slider1.options.range.min;
			_getid('start').value=start;
		}
		if(slider1 && end>slider1.options.range.max){
			end=slider1.options.range.max;
			_getid('end').value=end;
		}
		if(start>end)return;
	}
	if(slider1) slider1.updateOptions({start: [start, end]});
}
function proc_toggle(){
	if(video1.paused){
		video1.play();
		_getid('btn_toggle').innerHTML='Pause';
	}else{
		video1.pause();
		_getid('btn_toggle').innerHTML='Play';
	}
}
function proc_play(){
	if(!g_lastdata2 || !g_lastdata2.blob)return;
	//init
	crop=[];
	video_size={'w': 0, 'h': 0, 'duration':0};
	time_start = 0;
	time_end = 1;
	if(slider1){
		slider1.updateOptions({
			start: [0, 1],
			range: {'min': 0, 'max': 1}
		});
	}
	stopupdate=true;
	ctx.clearRect(0, 0, canvas1.width, canvas1.height);
	chk_mute_onclick();
	_getid('btn_toggle').innerHTML='Play';
	if(!current_time2_focused) _getid('current_time2').value=0;


	if(gbloburl) window.URL.revokeObjectURL(gbloburl);
	gbloburl=window.URL.createObjectURL(g_lastdata2.blob);

/*
	if(!video1attached){
		video1attached=true;
		video1.addEventListener("loadedmetadata", function(){
			stopupdate=false;
			update();

			video_size={'w': this.videoWidth || 0, 'h': this.videoHeight || 0, 'duration':this.duration || 0};
			chk_orgsize_onclick();
			_getid('btn_toggle').disabled=false;

			if(slider1){
				slider1.updateOptions({
					start: [0, this.duration],
					range: {'min': 0,	'max': this.duration}
				});
			}
		});
	}
*/
	video1.onloadedmetadata=function(){
		stopupdate=false;
		update();

		video_size={'w': this.videoWidth || 0, 'h': this.videoHeight || 0, 'duration':this.duration || 0};
		chk_orgsize_onclick();
		_getid('btn_toggle').disabled=false;
		if(slider1){
			slider1.updateOptions({
				start: [0, this.duration],
				range: {'min': 0,	'max': this.duration}
			});
		}
	}
	clearInterval(g_videointerval);
	g_videointerval=setInterval(function(){
		var s='';
		var state=video1.networkState;
		if(state==1){
			s='Media is active.';
		}else if(state==2){
			s='Downloading data...';
		}else if(state==3){
			s='No Media source found, or Can not preview this media in the browser.';
		}else if(state==0){
			s='Media has not yet been initialized.';
		}
		if(s){
			s='('+samplesToTime(video_size.duration, 8)+', '+video_size.w+' X '+video_size.h+') '+s;
			_getid('msg1').innerHTML='<font style="color:green">'+s+'</font>';
		}
	},500);

	video1.src=gbloburl;
	video1.pause();
	if(g_lastdata2.blob.size==0){
		alert('File size is zero. or File not found.');
	}
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();

	var x1=evt.clientX;
	if(x1<rect.left) x1=rect.left;
	if(x1>rect.left+rect.width) x1=rect.left+rect.width;

	var y1=evt.clientY;
	if(y1<rect.top) y1=rect.top;
	if(y1>rect.top+rect.height) y1=rect.top+rect.height;

	return {
		x: (x1 - rect.left) / rect.width,
		y: (y1 - rect.top) / rect.height
	};
}
function crop_box(crop, in_width, in_height){
	var rect = {'width': in_width, 'height': in_height};
	var p1 = unscale(crop[0], rect), p2 = unscale(crop[1],rect);
	var x = Math.min(p1.x, p2.x);
	var y = Math.min(p1.y, p2.y);
	var w = Math.abs(p1.x - p2.x);
	var h = Math.abs(p1.y - p2.y);
	return {
		'x': Math.floor(x),
		'y': Math.floor(y),
		'w': Math.floor(w),
		'h': Math.floor(h)
	}
}
function unscale(coords, rect){
	return{
		'x': coords.x * rect.width,
		'y': coords.y * rect.height
	}
}
function samplesToTime(sec, len) {
	if(!len)len=11;
	try{
		if(!sec) sec=0;
		var msec=Math.floor(sec*1000);
		var date = new Date(null);
		//date.setSeconds(sec);
		date.setMilliseconds(msec);
		return date.toISOString().substr(11, len); //8
	}catch(err){
		return '00:00:00';
	}
}

function update(){
	if(stopupdate || isworkerrun)return;
    try{
        if(video1.currentTime < time_start) video1.currentTime = time_start;
        if(video1.currentTime > time_end) video1.currentTime = time_start;
        var complete_percent = 100 * (video1.currentTime / video1.duration);
        _getid('slider_time_pos').style.left=complete_percent + "%";
        _getid('current_time').innerHTML=samplesToTime(video1.currentTime); //video1.currentTime.toFixed(2)
        if(!current_time2_focused) _getid('current_time2').value=video1.currentTime.toFixed(2);

        if(canvas1.width!=video1.offsetWidth || canvas1.height!=video1.offsetHeight){
            canvas1.width = video1.offsetWidth;
            canvas1.height = video1.offsetHeight;
            ctx.clearRect(0, 0, canvas1.width, canvas1.height);
            //console.log('clear canvas');
        }
        if(video_size.w>0 && video_size.h>0){
            ctx.drawImage(video1, 0, 0, canvas1.width, canvas1.height);
        }

        if(crop[0] && crop[1]){
            var  rect = canvas1.getBoundingClientRect();
            var  box = crop_box(crop, rect.width, rect.height);
            ctx.strokeStyle="#FF0000";
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            if(video_size.w>0 && video_size.h>0 && box.w>0 && box.h>0){
                var box2 = crop_box(crop, video_size.w, video_size.h);
                var txt=box2.w+' X '+box2.h;
                ctx.fillStyle = "#FF0000";
                ctx.font="13px Arial";
                ctx.textBaseline = 'top';
                var width = ctx.measureText(txt).width;
                ctx.fillRect(box.x, box.y, width+3, parseInt(ctx.font, 10)+5);
                ctx.fillStyle = "white";
                ctx.fillText(txt, box.x, box.y+1);
            }
        }
    }catch(err){
    }
    if(ismsie && slidermoving){
    }else{
        requestAnimationFrame(update);
	}
}

function handleFileSelect(files){
	if(!window.FileReader || !window.XMLHttpRequest || !window.URL){
		alert("This browser does not support.");
		return;
	}
	if(!files || files.length==0) return;
	var f=files[0];
	console.log(URL.createObjectURL(f));
	var resp={};
	resp.id=(new Date()).getTime();
	resp.title=f.name;
	resp.islocal=true;
	proc_loadmedia(f, resp, false);
}

var gworker, isworkerrun, gworkerloaded, gworkerloadedtimer;
function init(){
	if(!gworker && window.Worker){
		gworkerloaded=false;
		gworker=new Worker("../static/editor/js/worker3.js");
		gworker.onerror = function(err){
			gworkerloaded=true;
			gworker.terminate();gworker=null;
		}
		gworker.onmessage = function(event) {
			var message = event.data;
			if(message.type === "ready"){
				gworkerloaded=true;
			}
		}
	}
	var a=_getid('fileload1');
	a.onchange=function(e){
		if(!e || !e.target){
			alert("This browser does not support.");
			return;
		}
		handleFileSelect(e.target.files);
	}
	var arr2=[];
	var arr=g_supportimgs.split(',');
	for(var i=0; i <= arr.length-1; i++){
		var s=trim(arr[i]);
		if(s){
			arr2.push('.'+s);
		}
	}
	a.setAttribute("accept",arr2.join(','));

	var holder = document;
	holder.ondragover = function (e) {
		try{var ua=navigator.userAgent;
			if(ua && ua.indexOf("Chrome")>=0){
				if(e.originalEvent) e = e.originalEvent;
				if(e.dataTransfer){
					var b = e.dataTransfer.effectAllowed;
					e.dataTransfer.dropEffect = ('move' === b || 'linkMove' === b) ? 'move' : 'copy';
				}
			}
		}catch(err){}
		return false;
	};
	holder.ondragend = function () { return false; };
	holder.ondrop = function (e) {
		if(!e)return false;
    	var b2;
		if(e.target) b2 = e.target;
		else if(e.srcElement) b2 = e.srcElement;
		if(b2 && b2.id=="fileload2"){
			alert('Please select a second media/audio file using file selector box.');
			return false;
		}
		e.preventDefault();
		handleFileSelect(e.dataTransfer.files);
		return false;
	};

	_getid('slider_time_pos').onmousedown=function(e){
		if(!video1.duration || isNaN(video1.duration))return;
		var ele = e.target;
		var last_pos = e.clientX;
		var last_left = ele.offsetLeft;
		var total_percent;
		slidermoving=true;
		//var lasttime = Date.now();

		function mup(e, ele){
			slidermoving=false;
			document.onmousemove = null;
			document.onmouseup = null;
			if(ismsie){
				if(total_percent){
					video1.currentTime = video1.duration * total_percent;
				}
				update();
			}
		}
		function mmov(e, ele){
			if(!slidermoving)return;
			var delta = e.clientX - last_pos;
			total_percent = (last_left+delta)/ele.parentElement.offsetWidth;
			//last_pos = e.clientX;
			//total_percent = (ele.offsetLeft+delta)/ele.parentElement.offsetWidth;
			if(ismsie){
				_getid('slider_time_pos').style.left=(total_percent*100) + "%";
			}else{
				video1.currentTime = video1.duration * total_percent;
				/*var now=Date.now();
				if((now - lasttime)>300){
				}*/
			}
		}
		document.onmousemove=function(e){
			mmov(e, ele)
		};
		document.onmouseup=function(e){
			mup(e, ele)
		};
	}

	document.onselectstart=function(){
		if(slidermoving || drawing) return false;
		else return true;
	}
	document.body.onselectstart=function(){
		if(slidermoving || drawing) return false;
		else return true;
	}
	document.addEventListener("keydown", function(e) {
		if(!e)return;
        if(e.keyCode==9 && isworkerrun){
    		if (e.preventDefault) {e.preventDefault(); e.stopPropagation();}
    		else {e.returnValue = false; e.cancelBubble = true;}
            return false;
        }else if(e.keyCode==27){
			proc_rssclose();
		}
    }, true);

	slider1=noUiSlider.create(slider, {
		start: [0, 1],
		connect: true,
		range: {'min': 0, 'max': 1}
	});
	slider.noUiSlider.on('update', function(range){
		if(!range || range.length<2) return;
		time_start = parseFloat(range[0]);
		time_end = parseFloat(range[1]);
		_getid('start').value=time_start;
		_getid('end').value=time_end;
		proc_ffmpeg();
	});

	var a=_getid('current_time2');
	a.onfocus=function(){
		current_time2_focused=true;
	}
	a.onblur=function(){
		current_time2_focused=false;
	}
	/*a.onchange=function(){
		var v=parseFloat(this.value);
		if(isNaN(v)) v=0;
		video1.currentTime=v;
	}*/
	a.onkeydown=function(e){
		//console.log(e);
		if(!e)return;
		var v=parseFloat(this.value);
		var flag=true;
		if(e.keyCode==38){ //up
			if(!isNaN(v)){
				v=v+0.5;
				this.value=v.toFixed(2);
				video1.currentTime=v;
			}
		}else if(e.keyCode==40){ //down
			if(!isNaN(v)){
				v=v-0.5;
				if(v<0) v=0;
				this.value=v.toFixed(2);
				video1.currentTime=v;
			}
		}else if(e.keyCode==13){
			if(!isNaN(v)){
				video1.currentTime=v;
			}
		}else if(e.keyCode==32){
			if(!_getid('btn_toggle').disabled) proc_toggle();
		}else{
			flag=false;
		}
		if(flag){
   			if (e.preventDefault) {e.preventDefault(); e.stopPropagation();}
	  		else {e.returnValue = false; e.cancelBubble = true;}
		}
	}
	document.documentElement.onmouseup=function(e){
		if(!e) e=event;
		if(e.button!=0 && e.button!=1)return;
		var w=getWindowWidth()-27;
		var h=getWindowHeight()-27;
		if(e.clientX>w || e.clientY>h) return;
    	var b2;
		if(e.target) b2 = e.target;
		else if(e.srcElement) b2 = e.srcElement;
		if(b2.tagName=='A' || b2.tagName=='SPAN')return;
    	while (b2) {
			if(b2.id=="rssviewer" || b2.id=="imgrss"){
				return;
			}
    		if (b2==document.body) break;
			if (b2.parentElement) b2=b2.parentElement;
			else b2=b2.parentNode;
    	}
		proc_rssclose();
	}
}
init();