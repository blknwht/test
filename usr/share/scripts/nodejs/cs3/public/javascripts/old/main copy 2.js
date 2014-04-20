function cl(dat){return console.log(dat);}
function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;} return str;}
function hm2ts(hrmin) { var ts = new Date(); ts.setHours(parseInt(hrmin/60)); ts.setMinutes( (hrmin % 60) + (ts.getTimezoneOffset() * -1)); ts.setSeconds(0); return ts.toISOString().replace(/T/, ' ').replace(/\..+/, '');}
function urlVar(name) {return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;}
function month(d) {var mn=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return d.getDate()+' '+mn[d.getMonth()];}
function msDate(os){var tod = new Date();tod.setHours(0,0,0,0);return tod.getTime() + (os * 24 * 60 * 60 * 1000);}

function ts2str(ts,hd){
	var ts = ts.split(/[- :]/);
	var tso = new Date(ts[0],ts[1]-1,ts[2],ts[3],ts[4],ts[5]);
	if(hd=='hm') return pad(tso.getHours(),2) + ':' + pad(tso.getMinutes(),2);
	if(hd=='h') return tso.getHours() + (tso.getMinutes()/60);
	if(hd=='t') return tso.getTime();	// Miliseconds.
}

function setDialog(head,content){
	if(head) $('#popupDialog > div > h1').text(head);
	if(content) $('#popupDialog > div[data-role=content] > p').html(content);
}

/*
$( document ).on('pagebeforecreate', function() { });	
$( document ).delegate("#page", "pageinit", function() { alert('A page with an id of "aboutPage" was just created by jQuery Mobile!');});
*/

function print(el){
	w=window.open();
	w.document.write($(el).html());
	w.print();
	w.close();
}




function report(par,fp){
	var sql = "select * from schedule ORDER BY hr ASC, min ASC";
	$.ajax({url:"/db/?mode=get&sql="+sql}).done(function(data) { 
		data = JSON.parse(data);
		//cl(data);		
		// Build schedule with empty slots for every day / schedules
		var days = Math.ceil((fp[fp.length-1][0] - fp[0][0]) / 86400000);
		var tdw = ((100 / days) + 1)+'%';
		cl(tdw);
		
		var sch = {}; for(var i in data) {
			sch[ (data[i].hr * 60) + data[i].min ] = [pad(data[i].hr,2)+':'+pad(data[i].min,2)];
			for(var d=0; d<days;d++){ sch[ (data[i].hr * 60) + data[i].min ].push('-');}
		}

		// Add the Samples where available
		var th = $("<thead />"); var td = $("<td />"); th.append(td.text('Time'));
		var d = new Date(); var dmino; var day=1;
		d.setTime(parseInt(fp[0][0])); var date = d.getDate();
		for(var x in fp) {
			d.setTime(parseInt(fp[x][0]));
			var dmin = (d.getHours()*60) + d.getMinutes();
			//if(dmin < dmino) {th.append("<td>"+date+"</td>"); day ++;} else date = d.getDate();
			if(dmin < dmino) {th.append("<td>"+date+"</td>"); day ++;} else date = d.getDate();
			
			if(typeof sch[dmin] != 'undefined') sch[dmin][day] = fp[x][1];
			dmino=dmin;
		}	
		
		th.append("<td>"+date+"</td>"); var tb = $("<table />"); 
		for(var hr in sch) {
			var tr = $("<tr />");
			for(var temp in sch[hr]){
				if(temp == 0 || sch[hr][temp]=='-') var tval = sch[hr][temp]; else var tval = sch[hr][temp].toFixed(1);
				tr.append("<td>"+tval+"</td>");
			}
			tb.append(tr);
			
			
		}
		tb.append(th);
		par.empty();
		par.append(tb);
	});
	
}

// Load The Home Charts
function charts(did){
	var from = 0; var to = 1; var now = new Date(); var now1 = new Date(); 
var fpsp = false;	
	var when = $("input[type='radio'][name='when']:checked").val(); if(!when) when = 'd.0';	
	when = when.split('.');
	if(when[0]=='d'){
		if(when[1] == 0) {from=msDate(0); to=msDate(+1);}
		if(when[1] == 1) {from=msDate(-1); to=msDate(1); }
		if(when[1] == 7) {from=msDate(-7); to=msDate(1); }		
	}	

	if(when[0]=='m'){
		if(when[1] == 0) {from = msDate(-now.getDate()+1); to=msDate(1);}
		else {
			now.setMonth(parseInt(when[1]-1)); now.setDate(1); now.setHours(0,0,0,0); from = now.getTime();
			now1.setMonth(parseInt(parseInt(when[1]))); now1.setDate(1); now1.setHours(0,0,0,0); to = now1.getTime();
		}
		var fpsp = false;			
	}	

	var sql = "SELECT * FROM sensors WHERE active = 'true' ORDER BY macid ASC,id ASC";

	$.ajax({url:"/db/?mode=get&sql="+sql}).done(function(sensdat) { 	
		sensdat = JSON.parse(sensdat);
cl(sensdat);		
		//if(did) var sql = "SELECT * FROM data WHERE macid = '"+did.split('_')[0]+"' AND deviceid = '"+did.split('_')[1]+"' AND stamp > "+from+" AND stamp < "+to+" ORDER BY deviceid ASC, macid ASC, stamp ASC";
		
		if(did) var sql = "SELECT data.rowid as 'rowid', data.macid as 'macid', data.deviceid as 'deviceid', data.stamp as 'stamp',data.temp as 'temp' FROM data LEFT JOIN sensors ON (data.macid=sensors.macid) WHERE data.temp < 85 and data.deviceid=sensors.id AND sensors.active='true' AND data.macid = '"+did.split('_')[0]+"' AND data.deviceid = '"+did.split('_')[1]+"' AND stamp > "+from+" AND stamp < "+to+" ORDER BY deviceid ASC, macid ASC, stamp ASC";
		
		//else var sql = "SELECT * FROM data WHERE stamp > "+from+" AND stamp < "+to+" ORDER BY deviceid ASC, macid ASC, stamp ASC";
		else var sql = sql = "SELECT data.rowid as 'rowid', data.macid as 'macid', data.deviceid as 'deviceid', data.stamp as 'stamp',data.temp as 'temp' FROM data LEFT JOIN sensors ON (data.macid=sensors.macid) WHERE data.temp < 85 and data.deviceid=sensors.id AND sensors.active='true' AND stamp > "+from+" AND stamp < "+to+" ORDER BY deviceid ASC, macid ASC, stamp ASC";

		
cl(sql);
		$.ajax({url:"/db/?mode=get&sql="+sql}).done(function(data) {
			$('.chart').empty();
			if(data.length===2) return;	
			data = arrSplit(JSON.parse(data));
		
			var i=1;
			for(var sens in data) {
				var fp = []; var at = []; var did = data[sens][0].macid+data[sens][0].deviceid;
				for(var s in sensdat) {if(sensdat[s].macid+sensdat[s].id == did){var sensor=sensdat[s];break;}}
				if(sensor===undefined) continue;
				for(var time in data[sens]){
					var item = data[sens][time];
					fp.push([item.stamp,item.temp]);
					at.push([item.stamp,sensor.altemp]);
				}
				if(when[0] == 'd' && when[1] == 0){
					fp.push([msDate(),sensdat[s].temp]);
					at.push([msDate(),sensor.altemp]);
				}
				
				var chid='#chart'+i;
				var chwr = $(chid); var ch = chwr.find('div.chart'); var h3 = chwr.find('h3'); var a = chwr.find('a');  
				//a.attr('href',"sensor?did="+did);
cl(sensor.temp);	
				if(sensor.temp > sensor.altemp) h3.html('S'+sensor.id+'.'+sensor.info + " [ <span class='hot'>"+sensor.temp+"</span> ]"); 
				//if(sensor.temp > sensor.altemp) h3.html('S'+sensor.id+'.'+sensor.info + " [ <span class='hot'>"+sensor.temp.toFixed(2)+"</span> ]"); 
				else h3.html('S'+sensor.id+'.'+sensor.info + " [ <span class='cool'>"+sensor.temp+"</span> ]");
//cl(at[0][1]+':'+);
//cl(ch.className);
//var ch = $('<div/>',{});
//ch.appendTo('.chart-container');
				$.plot(ch,[{data:fp,threshold: {below:parseInt(at[0][1]),color:'#6699CC'},color:'red',points:{show:fpsp},lines:{show:true}},{data:at,color:'orange'}],{xaxis: {mode: "time",timezone: "browser"} });
				//$.plot(ch,[{data:fp,color:'#6699CC',points:{show:fpsp},lines:{show:true}},{data:at,color:'orange'}],{xaxis: {mode: "time",timezone: "browser"} });

//cl(fp);
//report($('#report'),fp);
				
				i++;
			}				
		});
	
	});

}


/*## RELOAD ##*/
function reLoad(){
	$.mobile.changePage(window.location.href, {
    	allowSamePageTransition: true,
		transition: 'none',
		reloadPage: true
	});	
}

/*## GLOBAL VARIABLES ##*/
var g_form;


//## AFTER PAGE LOAD
$(document).on('pageshow', function() {
	
});

$(document).delegate("#Sensor", "pageshow", function(e,ui) {
	cl('Sensor Show');
	var d = new Date().getMonth()+1;
	$('#m'+d).attr('checked',true);
	var did = urlVar('did');
	$("input[type='radio']").bind("change", function(event, ui) {charts(did);});
	charts(did);
});


/*## ON PAGE LOAD ##*/
$(document).on('pageinit', function(event){

    $('.print').click(function(event){
        $('#report').show().jqprint();
        $('#report').hide();
        return;
        
        
        var print_window = window.open(),
        print_document = $('#report').clone();
        print_document.find('a').each(replace);
        print_window.document.open();
        print_window.document.write(print_document.html());
        print_window.document.close();
        print_window.print();
        print_window.close();
    });


	$('.spage').click(function(e){
		//e.preventDefault();
		//$.mobile.loadPage("sensors.htm");
		//$.glob.sid = 'xxx';
	});

	/*## ADD SCHEDULE ##*/
	$('a[data-icon=add]').click(function(e){
		$('ul#add').slideDown(); 
	});


	$('a#now').click(function(e){
		$.ajax({url:"/db/?mode=now"}).done(function(data) {});
	});

	$('a#save').click(function(e){
		var data = $('form#schedule_add');
		var sql = "INSERT INTO schedule (hr,min) VALUES('"+ data[0].hr.value +"','"+ data[0].min.value +"')";
		$.ajax({url:"/db/?mode=put&sql="+sql}).done(function(data) {
			reLoad();
		});
	});

	$('a#cancel').click(function(e){
		$('ul#add').slideUp(); 
	});

  	
  	/*## EXPAND/COLLAPSE ##*/
	$(document).on("expand", ".custom-collapsible", function(){
	   $('.custom-collapsible').not(this).trigger('collapse');
	   
	}).on('collapse',function(){
		//cl('close');
		
	});


  	/*## EXPAND/COLLAPSE ##*/
	$(document).on("expand", "div[data-role=collapsible-set] div[data-role=collapsible]", function(){
	   g_form = $(this).find('form');
	}).on('collapse',function(){g_form=false;});

	/*## RELOAD BUTTON ##*/
	$('div > a[data-icon=refresh]').click(function(e){
		e.preventDefault();
		reLoad(); 
	});  

	/*## SENSOR RECORD SAVE ##*/
	$('div > a[data-icon=check]').click(function(){
		if(!g_form) return;
		var bits = g_form.attr('id').split('.');
		var id = bits[1];
		var macid = bits[0];
		
		var data = g_form.serializeArray();
		var sql = "UPDATE sensors SET "
		$.each(data, function(i,item) { 
			sql += item.name+"='"+item.value+"',";
		});
		sql = sql.slice(0,-1) + " WHERE macid='"+macid+"' and id='"+id+"'";
		console.log(sql);
		$.ajax({url:"/db/?mode=put&sql="+sql}).done(function(data) {
			reLoad();
		});
		
	});


	/*## SENSOR RECORD DELETE ##*/
	$('div > a[data-icon=delete]').click(function(){
		if(!g_form) return;
		var bits = g_form.attr('id').split('.');
		var id = bits[1];
		var macid = bits[0];
		var sql = "DELETE FROM sensors WHERE macid='"+macid+"' and id='"+id+"'";
		console.log(sql);
		$.ajax({url:"/db/?mode=put&sql="+sql}).done(function(data) {reLoad();});
	});


});

$(document).on("pagebeforechange", function(e, secondparameter) {
 // cl(secondparameter.options.link.context.search);
  cl('xxx');
});
