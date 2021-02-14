function trim(str) {
	if (!str || !str.replace) str='';
  	return str.replace(/^\s*|\s*$/g,"");
}
function getValue(s,s_find,s_end){
  s_find=s_find.toLowerCase();
  s_end=s_end.toLowerCase();

  ss=s.toLowerCase();
  p1=ss.indexOf(s_find);
  if (p1<0) return;
  s1=s.substr(p1+s_find.length,s.length);

  ss=s1.toLowerCase();
  p1=ss.indexOf(s_end);
  if (p1<0) return;
  s1=s1.substr(0,p1);
  return s1;
}
function getsize(fileSize){
	if(!fileSize) return 'Unknown';
	function humanFileSize(bytes){
		var thresh = 1024;
		if(bytes < thresh) return bytes + ' B';
		var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
		var u = -1;
		do {
			bytes /= thresh;
			++u;
		} while(bytes >= thresh);
		return bytes.toFixed(1)+' '+units[u];
	}
	return humanFileSize(fileSize);
}

var duration, durationstr, errormsg;
function print(text) {
    postMessage({
        'type' : 'stdout',
        'data' : text+''
    });
}

function printErr(text) {
	var s=(text || '')+'';
	if(durationstr && s.indexOf("size=")>=0 && s.indexOf("time=")>=0){
		var s1=getValue(s,'time=',' ');
		if(s1){
			var s2=s1.split('.')[0] || '';
			if(s2.indexOf('-')<0){
				s1='Processed Media Time: '+s2;
				//if(durationstr) s1+='/'+durationstr;
				postMessage({'type' : 'progress', 'data': s1});
			}
			return;
		}
	}
    postMessage({
        'type' : 'stderr',
        'data' : s
    });
	if(s.indexOf('Duration: ')>=0){
		var arr=s.split('Duration: ');
		arr=arr[1].split(',');
		arr=arr[0].split('.');
		durationstr=arr[0];
		arr=arr[0].split(':');
		if(arr.length==3){
			var hour=parseInt(arr[0]);
			var min=parseInt(arr[1]);
			var sec=parseInt(arr[2]);
			var secs=(hour*60*60)+(min*60)+sec;
			if(!isNaN(secs)){
				duration=secs;
			}
		}
	}else if(s.indexOf('maybe incorrect parameters such as bit_rate')>=0){
		errormsg=s;
	}
/*
Duration: 00:06:36.23, start: 0.000000, bitrate: 251 kb/s

amr,ac3,gsm,qcp,voc
(index):1608   Stream #0:0 -> #0:0 (amrnb -> aac)
(index):1608 Error while opening encoder for output stream #0:0 - maybe incorrect parameters such as bit_rate, rate, width or height

flv,m4v
Encoder (codec none) not found for output stream #0:0

example.mmf: Not yet implemented in FFmpeg, patches welcome
example.rta: could not find codec parameters
*/
}

var self2=self;

function go(){
importScripts('gzip/ffmpeg-all-codecs.js');
self2.addEventListener('message', function(event) {
    var message = event.data;
    if (message.type === "command") {
		var s1,s2,s3,arr,arguments,result;
		var TOTAL_MEMORY=256*1024*1024; //33554432=32*1024*1024 x16 //268435456
		if(message.memsize) TOTAL_MEMORY=message.memsize*1024*1024;
		postMessage({'type' : 'stdout', 'data' : 'Total Memory: '+getsize(TOTAL_MEMORY)});

        postMessage({'type' : 'start'});

		//arguments=['-i', message.files[0].name];
		arguments=['-hide_banner'];
		s1=message.commands || '';

		//s1='-ss 5.92 -movflags faststart -t 4.8500 -filter:v "crop= 163:217:116:2" -c:a copy out.mp4';
		arr=s1.split(' ');
		var found='';
		for(var i = 0; i <= arr.length-1; i++){
			s2=trim(arr[i]);
			if(!s2)continue;
			if(/(^(\"|\'))/i.test(s2) && !found){
				found=s2;
				if(s2.length>1 && /(^\"(.*?)\"$)/i.test(s2)){
					found=found.replace(/\"/gi,'');
					arguments.push(found);
					found='';
				}else if(s2.length>1 && /(^\'(.*?)\'$)/i.test(s2)){
					found=found.replace(/\'/gi,'');
					arguments.push(found);
					found='';
				}
			}else if(/(\"$)/i.test(s2) && found){
				found+=' '+s2;
				found=found.replace(/\"/gi,'');
				arguments.push(found);
				found='';
			}else if(/(\'$)/i.test(s2) && found){
				found+=' '+s2;
				found=found.replace(/\'/gi,'');
				arguments.push(found);
				found='';
			}else if(!found){
				if(s2=='{$input}'){
					arguments.push('-i');
					arguments.push(message.files[0].name);
				}else if(s2.indexOf('{$input')==0){
					s3=parseInt(getValue(s2,'{$input','}'));
					if(s3 && !isNaN(s3) && message.files[s3-1]){
						arguments.push('-i');
						arguments.push(message.files[s3-1].name);
					}
				}else{
					arguments.push(s2);
				}
			}else if(found){
				found+=' '+s2;
			}
		}
		//console.log(arguments);

		var Module = {
            print: print, printErr: printErr, files: message.files || [], arguments: arguments || [],
			TOTAL_MEMORY: TOTAL_MEMORY
        };
        postMessage({'type' : 'stdout', 'data' : 'Received command: ' + Module.arguments.join(" ")});

        var time = Date.now();
		result='';
		try{
			result = ffmpeg_run(Module);
		}catch(err){
			postMessage({
				'type': 'done',
				'error': ''+err
			});
			return;
		}
		var totalTime = Date.now() - time;

		s1='Finished processing (' + totalTime + 'ms)';
		if(durationstr) s1+=', This media duration: '+durationstr;
        postMessage({
            'type' : 'stdout',
            'data' : s1
        });

        postMessage({
            'type' : 'done',
            'data' : result
        }); //,buffers
    }
}, false);

postMessage({'type' : 'ready'});
}

function number_format(number, decimals, dec_point, thousands_sep) {
  number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.round(n * k) / k;
    };
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

go();