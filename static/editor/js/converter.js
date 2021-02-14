function proc_ffmpeg(dtype){
	if(!g_lastdata2 || !g_lastdata2.blob)return;
	var arr=[];
	var output=_getid("enc_output").value;
	var samplerate=_getid("enc_samplerate").value;
	var ext=getextension(g_lastdata2.blob.name);
	let video_path = document.getElementsByName('video_path')[0].value;
	if ( ! video_path.endsWith('\\') ){
	    video_path += '\\';
	}
	scale=0;


	var s1,s2;
	var ts = (time_start?time_start.toFixed(2):0);
	var te = (time_end?time_end.toFixed(2):0);
	//g_lastdata2.blob.name.replace(/\"/g,'\\"')
	var s = 'ffmpeg.exe -ss '+ts+' -i "' + video_path + g_lastdata2.blob.name + '" -movflags faststart -t ' + (te-ts).toFixed(4) + ' ';
	var d = new Date()
	datets = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + '-' + d.getHours() + d.getMinutes() + d.getSeconds();
	if(output=='m4a' || output=='aac' || output=='ogg' || output=='wma'){
		if(samplerate) s+='-b:a '+samplerate+' ';
		s+='-vn "' + video_path + datets + '.' + output + '"';
	}else if(output=='merge'){
		s1='';
		if(inputdata2) s1=inputdata2.name || '';
		s='ffmpeg.exe -i "' + video_path + g_lastdata2.blob.name + '" -i "'+s1+'" -c copy "' + video_path + datets + '.'+ ext + '"';
	}else{
		arr=[];
		if(arr.length>0) s+='-vf "'+arr.join(',')+'" ';

		if(output=='gif' || output=='png' || output=='jpg'){
			s+='';
		}else{
			//if(ext=='mp4' && output=='mp4'){
				//s+='-c:a copy ';
			if(samplerate) s+='-b:a '+samplerate+' ';
		}
		s += '"' + video_path + datets + '.'+output + '"';
	}
	_getid('ffmpeg').value=s;
	if(dtype==1)return;

	function fixscale(scale2, w, h){
		if((scale2 % 2)!=0) scale2++;
		/*if(!(output=='mp4' || output=='mov')) return scale2;
		var h2; var k=0;
		while(true){
			k++; if(k>50)break;
			if((scale2 % 2)!=0) scale2++;
			h2=Math.floor(scale2*h/w) % 2;
			if(h2==0){
				break;
			}
			scale2++;
		}*/
		return scale2;
	}

	var s = '-ss '+ts+' -i "' + video_path + g_lastdata2.blob.name + '" -movflags faststart -t '+(te-ts).toFixed(4)+' ';
	if(ext=='gif') s='-i "' + video_path + g_lastdata2.blob.name + '" ';
	if(output=='m4a' || output=='aac' || output=='ogg' || output=='wma'){
		if(output=='ogg') s+='-c:a vorbis ';
		if(samplerate) s+='-b:a '+samplerate+' ';
		s+='-vn -strict -2  "' + video_path + datets + '.'+ output + '"';
	}else{
		var cropstr='';

		arr=[];
        if(arr.length>0) s+='-vf "'+arr.join(',')+'" ';

		if(output=='gif' || output=='png' || output=='jpg'){
			s+='';
		}else{
			if(samplerate) s+='-b:a '+samplerate+' ';
		}
		s += '"' + video_path + datets + '.' + output + '"';
	}
	_getid('ffmpeg2').value=s;
}

function getmimetype(s1){
	if(!s1)return;
	for(var i = 0; i < g_outputtype.length; i++){
		if(g_outputtype[i][0].indexOf(s1+",")>=0){
			return g_outputtype[i][1];
		}
	}
}
var gmemory=256;
var gmemorych=false;
function proc_gmemory(){
	if(isworkerrun){
		alert('Encoding is working... Please try again later.');return;
	}
	var mem=prompt('Please enter the maximum memory to use. (Default: 256 M)\nInput range: 128, 256, 304, 480, 512, 640, 1024 M',gmemory);
	mem=parseInt(mem);
	if(mem && !isNaN(mem)){
		if(mem>1024) mem=1024;
		if(mem<128) mem=128
		gmemory=mem;
		if(gworker){
			gworker.terminate();gworker=null;
		}
		show_message('Total Memory: '+getsize(gmemory*1024*1024));
		gmemorych=true;
	}
}
function proc_convert(){
	if(!window.URL || !window.Worker){
		alert('Not supported on this browser. Please upgrade your browser.');	return;
	}
	if(isworkerrun){
		alert('Encoding is working... Please try again later.');return;
	}
	if(!g_lastdata2 || !g_lastdata2.blob){
		alert('Please select a file first.');return;
	}
	if(!gworkerloaded){
		var c=_getid('gd_progress4');
		if(!c){
			_getid('msg4').innerHTML="<table cellspacing=0><tr><td><img src='/static/editor/images/wait.gif' align='absmiddle'><td><td><div id='gd_progress4'></div></div>";
			c=_getid('gd_progress4');
		}
		if(c) c.innerHTML='Downloading library... Please wait...';
		clearTimeout(gworkerloadedtimer);
		gworkerloadedtimer=setTimeout(proc_convert, 1000);
		return;
	}else{
		_getid('msg4').innerHTML="";
	}

	if(g_lastdata2.blob.size>1*1024*1024*1024){
		alert('The file size is too large to load. (1 GB limit)');return;
	}
	if(g_lastdata2.blob.size==0){
		alert('File size is zero. or File not found.');return;
	}
	var s=trim(_getid('ffmpeg2').value);
	if(!s){
		alert('Please enter a command first.');return;
	}
	/*if(s.indexOf('"')>=0 || s.indexOf("'")>=0){
		alert("\" or ' Characters are not allowed.");return;
	}*/
	/*if(s.indexOf("{$input}")<0){
		alert('{$input} variable does not exist. Please add the {$input} variable.');return;
	}*/
	/*var p1=s.indexOf('ffmpeg.exe -i "');
	if(p1!==0){
		alert('1');return;
	}
	s=s.substr(p1+'ffmpeg.exe -i "'.length, s.length);
	p1=s.indexOf('"');
	if(p1<0){
		alert('2');return;
	}
	s=s.substr(p1+1,s.length);*/

	var output_mimetype='application/octet-stream';
	var arr=s.split(" ");
	//var output_filename=arr[arr.length-1] || 'No Name';
	var s1=getextension(arr[arr.length-1] || '');
	if(!s1) s1='bin';
	var output_mimetype=getmimetype(s1) || 'application/octet-stream';
	var output_filename=getfilename(g_lastdata2.blob.name)+'.'+s1;
	var output_filename2=getfilename(g_lastdata2.blob.name);
	//var output_filename=g_lastdata2.blob.name+'.'+s1;
	/*var s2=getfilename(g_lastdata2.blob.name);
	arr=s2.split('_');
	if(arr[arr.length-1]!='edit') s2+='_edit';
	var output_filename=s2+'.'+s1;*/

	commands=s;

	console.log(commands);

	//check merge
	if(_getid('enc_output').value=='merge' || commands.indexOf("{$input2}")>=0){
		if(!inputdata2){
			alert('Please select a second media/audio file.');return;
		}
		if(g_lastdata2.blob.size>1*1024*1024*1024){
			alert('The file size is too large to load. (Merge video and audio, 1 GB limit)');return;
		}
	}

	function proc_error(s){
		proc_log('log1', s, 'error');
	}
	function _end(){
		_getid('player').setAttribute('style', '');
		_getid('btn_cstop').disabled=true;
		_getid('btn_cstart').disabled=false;
		_getid('msg4').innerHTML='';
		update(); //restart
	}
	function go2(){
		proc_log('log1', 'Reading the file...', 'welcome');
        var reader = new FileReader();
		reader.onerror = function(e) {
			proc_log('log1', 'Error. Reading the file.', 'error');
			isworkerrun=false;
			_end();
		};
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
			var files=[{"name": g_lastdata2.blob.name, "data": data}];
			if(commands.indexOf("{$input2}")>=0 && inputdata2 && inputdata2.data){
				files.push({"name": inputdata2.name, "data": inputdata2.data});
			}
		    gworker.postMessage({
			    type: "command", memsize: gmemory,
				commands: commands,
				files: files
			});
			var c=_getid('btn_cstop');
			c.disabled=false;
			c.onclick=function(){
				gworker.terminate();
				gworker=null;
				isworkerrun=false;
				_end();
				this.disabled=true;
			}
        };
        reader.readAsArrayBuffer(g_lastdata2.blob);
	}

	var isnew=false;
	if(!gworker){
		isnew=true;
		gworker=new Worker("../static/editor/js/worker3.js");
	}
		gworker.onerror = function(err){
			isworkerrun=false;
			var s='';
			if(err && (typeof err === 'string' || err instanceof String)) s+=err;
			else if(err && err.message) s+=err.message;
			proc_error("Error. "+s);
			_end();gworker.terminate();gworker=null;
		}
		var decodelog=[];
		var fouputstate=false;
		var logcount=0;
		var logs=[]; var logs2=[];
		var memoryerr=false;
		var err1count=0; var err2count=0;
		gworker.onmessage = function(event) {
			var message = event.data;
			if(message.type === "ready"){
				//console.log('worker loaded.');
				if(isnew) go2();
			}else if(message.type === "progress"){
				//console.log(message.data);
				var c=_getid('gd_progress4');
				if(c) c.innerHTML=message.data || '';

			}else if(message.type == "stdout"){
				var s=henc(message.data).replace(/  /g,' &nbsp;');
				s='<font class="uploaded">'+s+'</font>';
				/*if(gmemorych && /^(Total Memory:)/.test(trim(message.data))){
					s+=' &nbsp;<a href="#" onclick="proc_gmemory();return false">Adjust Memory</a>';
				}*/
				if(logcount<150) logs2.push(s);
				proc_log('log1', '', '', s);
			}else if(message.type == "stderr"){
				//console.log(message.data);
				if(/(concealing |damaged | message repeated|overread, skip|Press \[q\] to stop|bad header|missing function\: madvise|incorrect timestamps in the output file)/.test(message.data)){
				}else{
					if(!message.data)message.data=''; message.data+='';
					var s=henc(message.data);
					s=s.replace(/  /g,' &nbsp;');
					if(/(not divisible by 2|Error while opening encoder|Encoder \(codec none\) not found)/.test(message.data)){
						if(/(not divisible by 2)/.test(message.data)){
							decodelog.push('**Change the scale or width/height value.');
							s+='<br>'+decodelog[decodelog.length-1];
						}
						s='<font class="error">'+s+'</font>';
					}else if(/^(Unknown encoder)/.test(trim(message.data))){
						s='<font class="error">'+s+'</font>';
					}else if(/(mono,|Duration: )/.test(message.data)){
						s='<font class="uploaded">'+s+'</font>';
					}else if(/^(Input \#|Output \#)/.test(trim(message.data))){
						//fouputstate=true;
						s='<font class="uploaded">'+s+'</font>';
					}else if(/^(Stream \#)/.test(trim(message.data))){
						s='<font class="welcome">'+s+'</font>';
					}else if(/(Cannot enlarge memory arrays)/.test(message.data)){
						memoryerr=true;
					}else if(/(Invalid data found when processing input|Invalid frame dimensions)/.test(message.data)){
						if(err1count>400)return;
						err1count++;
					}else if(/(packet|skip )/.test(message.data)){
						if(err2count>400)return;
						err2count++;
					}
					if(logcount<150) logs.push(s);
					if(logcount>2500){
						_getid('log1').innerHTML='';
						for(var i = 0; i < logs2.length; i++) proc_log('log1', '', '', logs2[i]);
						for(var i = 0; i < logs.length; i++) proc_log('log1', '', '', logs[i]);
						logcount=0;
					}
					proc_log('log1', '', '', s);
					logcount++;
				}
			}else if(message.type == "done"){
				//console.log(message);
				isworkerrun=false;
				_end();
				if(message.error){
					proc_error("Error. "+(message.error+'').replace(/(http|https):\/\/(.*?)\.js/g,'asm.js').substr(0,250));
					if(memoryerr){
						proc_log('log1', '', '', '<button onclick="proc_gmemory()" style="margin-top:5px;margin-top:5px">Enlarge Memory Manually</button>');
						_getid('agmemory').style.display='';
					}
				}else{
					var result=message.data[0];
					if(!result || !result.data){
						if(decodelog.length>0) proc_error(decodelog.join('<br>'));
						proc_error("Error. Encoding failed. Please check the log or command line options.");
						return;
					}
					var blob;

	function _zip(){
		proc_log('log1', '', '', '<font class="welcome">Zip the output files... <span id="zip_progress"></span></font>');
		var c;
		try{
			var zip = new JSZip();
			for(var i = 0; i < message.data.length; i++){
				if(!message.data[i].name) message.data[i].name=i+'';
				zip.file(message.data[i].name, message.data[i].data, {binary: true});
				c=_getid('zip_progress');
				if(c) c.innerHTML='['+(i+1)+'/'+message.data.length+'] '+henc(message.data[i].name);
			}
			zip.generateAsync({type:"blob", compression:"STORE"}).then(function(blob2) { //DEFLATE
				output_mimetype='application/zip';
				output_filename=output_filename2+'.zip';
				blob = new Blob([blob2], {type: output_mimetype});
				_complete();
			});
		}catch(err){
			proc_error("Error. "+err);
		}
	}
	function _complete(){
		if(blob.size==0){
			if(decodelog.length>0) proc_error(decodelog.join('<br>'));
			proc_error("Error. Encoding failed. Please check the log or command line options.");
		}else{
			if(gbloburl2) window.URL.revokeObjectURL(gbloburl2);
			gbloburl2=window.URL.createObjectURL(blob);
			var filename=output_filename;
			blob.name=filename;

	var s='<a href="#" id="encodedown">Download</a>';
	s+=' &nbsp;<a href="#" onclick="proc_gview(\''+gbloburl2+'\');return false">View</a> ('+getsize(blob.size)+')';
	s+=' &nbsp;<a href="'+gbloburl2+'" target="_blank" title="View this file in a new window">New</a>';
	s+=' &nbsp;<a href="#" id="savegdrive" title="Save this file to Google Drive">Save to Drive</a> &nbsp;<a href="#" id="loadconverted">Load this converted file to edit</a>';
	_getid('msg4').innerHTML=s;
	var blobLink=_getid('encodedown');
	if(blobLink){
		blobLink.title=filename;
		blobLink.onclick=function(){
			if(navigator.msSaveBlob){
				navigator.msSaveBlob(blob, filename);
				return false;
			}else{
				blobLink.download = filename;
				if(issafari){
					window.open(gbloburl2);
					return false;
				}else{
					blobLink.target='_blank';
					blobLink.href=gbloburl2;
				}
			}
		}
	}
	var a=_getid('savegdrive');
	if(a){
		a.onclick=function(){
			proc_saver(filename, gbloburl2, output_mimetype);
			return false;
		}
	}
	var a=_getid('loadconverted');
	if(a){
		a.title=filename;
		a.onclick=function(){
			var s1=prompt('Please enter a name to be displayed.',filename);
			if(!s1)return false;
			var resp={};
			resp.id=(new Date()).getTime();
			resp.title=s1;
			resp.islocal=false;
			proc_loadmedia(blob, resp, false);
			return false;
		}
	}
		}//if

	}
					if(message.data.length>1){ //(output_mimetype=='image/jpeg' || output_mimetype=='image/png')
						var fmax=300;
						if(result.data.byteLength*message.data.length<fmax*1024*1024){
							_zip();
						}else{
							proc_log('log1', 'The output files ('+message.data.length+' files, '+(message.data[0].name || 'No Name')+'..) can not be zipped. ('+fmax+' MB limit)', 'welcome');
							blob = new Blob([result.data], {type: output_mimetype});
							_complete();
						}
					}else{
						blob = new Blob([result.data], {type: output_mimetype});
						_complete();
					}

				}
			}

		}

	isworkerrun=true;
	if(!video1.paused) proc_toggle();
	_getid('btn_cstart').disabled=true;
	_getid('player').setAttribute('style', 'pointer-events: none; user-select: none; opacity: 0.5; background: #CCC;');
	_getid('log1').innerHTML='';
	_getid('log1').style.display='';
	_getid('msg4').innerHTML="<table cellspacing=0><tr><td><img src='/static/editor/images/wait.gif' align='absmiddle'><td><td><div id='gd_progress4'>Working...</div></div>";
	if(!isnew) go2();
	else proc_log('log1', 'Triggering FFmpeg Encoding... Please wait...', 'welcome');
}

function vphistory_onchange(f){
	if(!f.value)return;
	for(var i = 0; i < g_lastdata.length; i++){
		if(g_lastdata[i].id==f.value){
			proc_loadmedia(g_lastdata[i].blob, g_lastdata[i].resp, true);
			break;
		}
	}
}

var g_lastdata2;
var g_lastdata=[];
function proc_loadmedia(blob, resp, ishistory){
	if(isworkerrun){
		alert('Encoding is working... Please try again later.');return;
	}
	g_lastdata2={};
	g_lastdata2.blob=blob;
	g_lastdata2.resp=resp;
	console.log(g_lastdata);
	console.log(g_lastdata2);

	if(!ishistory){
		for(var i = 0; i < g_lastdata.length; i++){
			if(g_lastdata[i].resp.id==resp.id){
				g_lastdata[i].blob='';
				g_lastdata.splice(i,1);
				break;
			}
		}
		var a={};
		a.id=(new Date()).getTime();
		a.blob=blob;
		a.resp=resp;
		g_lastdata.push(a);

		var tot=0;
		for(var i=g_lastdata.length-1;i>=0;i--){
			if(g_lastdata[i].resp.islocal) continue;
			tot=tot+g_lastdata[i].blob.size;
			if(tot>350*1024*1204){
				g_lastdata[i].blob='';
				g_lastdata.splice(i,1);
			}
		}
		if(g_lastdata.length>5){
			g_lastdata[0].blob=''; g_lastdata.splice(0,1);
		}
		var s='<select onchange="vphistory_onchange(this)" style="width:300px">';
		for(var i=g_lastdata.length-1;i>=0;i--){
			s+='<option value="'+g_lastdata[i].id+'">'+henc(g_lastdata[i].resp.title || 'No Name');
			if(g_lastdata[i].resp.islocal) s+=' (Local)';
		}
		s+='</select>';
		_getid('vphistory').innerHTML=s;
	}

	_getid('msg1').innerHTML=henc(blob.name);
	proc_play();
}