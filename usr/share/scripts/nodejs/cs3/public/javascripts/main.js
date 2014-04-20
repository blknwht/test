function cl(dat){return console.log(dat);}
function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;} return str;}
function hm2ts(hrmin) { var ts = new Date(); ts.setHours(parseInt(hrmin/60)); ts.setMinutes( (hrmin % 60) + (ts.getTimezoneOffset() * -1)); ts.setSeconds(0); return ts.toISOString().replace(/T/, ' ').replace(/\..+/, '');}
function urlVar(name) {return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;}
function month(d) {var mn=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return d.getDate()+' '+mn[d.getMonth()];}
function msDate(os){var tod = new Date();tod.setHours(0,0,0,0);return tod.getTime() + (os * 24 * 60 * 60 * 1000);}
function reLoad(){$.mobile.changePage(window.location.href, {allowSamePageTransition: true,transition: 'none',reloadPage: true});}
function tpad(temp){return pad(parseInt(temp),2)+'.'+pad(parseInt(temp%1*100),2);}
function nowms() {return new Date().getTime()}
function date2str(date){ date = new Date(date); return date.getDate()+'/'+ (date.getMonth()+1)+'/'+date.getFullYear();}
function cdheight(){var cd = $('#contentDiv'); return window.innerHeight-cd[0].offsetTop-parseInt(cd.css('paddingTop'))-parseInt(cd.css('paddingBottom'))}
function mdays(m,y){return /8|3|5|10/.test(--m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;}
function centre(el){var o=el.offset(), w=el.width(), h=el.height();return{x:o.left+w/2,y:o.top+h/2}}
function mydate(date){ return date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();}

function mystamp(date,mode){
	function p(x){if(x<10) return '0'+x; return x} 
	n = date || new Date();
	x=[n.getFullYear()-2000,p(n.getMonth()+1),p(n.getDate()),p(n.getHours()),p(n.getMinutes()),p(n.getSeconds())];
	switch (mode){case "min":x[5]='00';break;case "hr": x[4]='00'; x[5]='00';break; case "end":x[3]='23';x[4]='59';x[5]='59';break; case "zer":x[3]='00';x[4]='00';x[5]='00'} 
	return parseInt(x.join(''))
}

function fromto(os,dwm){
	var ft = {nd:new Date(),dwm:dwm,os:os}; ft.nd.setHours(0,0,0,0);ft.fdate = new Date(); ft.fdate.setHours(0,0,0,0); ft.tdate = new Date(); ft.tdate.setHours(23,59,59,999);
	if(dwm=='w'){ft.tdate.setDate(ft.nd.getDate()+(os*7)); ft.fdate.setDate(ft.nd.getDate()+(os*7)-6);} 
	else if(dwm=='m'){ft.fdate.setDate(1); ft.fdate.setMonth(ft.nd.getMonth()+os);ft.tdate.setDate(0); ft.tdate.setMonth(ft.nd.getMonth()+os);}
	else {ft.tdate.setDate(ft.nd.getDate()+os);ft.fdate.setDate(ft.nd.getDate()+os);}
	ft.fymd = mystamp(ft.fdate); ft.tymd = mystamp(ft.tdate);
	ft.fms=ft.fdate.getTime(); ft.tms=ft.tdate.getTime();
	return ft;	
}

// .fsave button
$(document).on('click','a.fsave', function(e) {
	e.preventDefault();
	var frm = $(this).closest('form');
	var fid = frm.attr('id');
	var karr = $(frm).find('input.key');
	var keys = "&_keys_="
	$.each(karr, function(key){ keys += karr[key].name+':'})
	var data = frm.serialize()+'&func=fput&form='+fid+keys.slice(0,-1);
	frm.addClass('ui-disabled');
	$.mobile.loading('show');
	$.ajax({url:"?"+data}).done(function(data) {
		setTimeout(function(){
			formfill(frm,data);
			$.mobile.loading('hide');
			frm.removeClass('ui-disabled'); 
		},500);
	});	
});


// Load a FORM
function formload(frm){
	if(!frm.hasClass('jsload-a')) return false;
	var key = $(frm).find('input.key').attr('name');
	var fdat = $(frm).serializeArray();
	var names = "&"; $.each(fdat, function(k){ if(fdat[k].name==key) names += fdat[k].name +"="+fdat[k].value+"&"; else names += fdat[k].name +"&";});
	var url = "/?func=fget&form="+frm.attr('id')+"&_keys_="+key+names.slice(0,-1);
	$.ajax({url:url}).done(function(data) {formfill(frm,data)})	
}

// Populate a form
function formfill(frm,data) {   
    frm[0].reset();
    $.each(data, function(key, value){  
	    var $ctrl = $('[name='+key+']', frm);     
	    var dt = $ctrl.attr("data-type");
	    if($ctrl.attr('multiple')) var type = "multi"; else if(dt=='range' || dt===undefined) var type="text"; else var type = $ctrl.attr("type");
	    switch(type){  
	        case "multi":
	        	$('select[name='+key+'] option').each(function(){
	        		if(value.indexOf(this.value)!==-1) {
	        			$(this).attr('selected','selected');
	        			console.log(this);
	        			} 
	        		else $(this).removeAttr('selected');
	        	}); 
	        	console.log($ctrl.selectmenu());
	        	$ctrl.selectmenu('refresh');
	        	break;
	        
	        case "password": case "text": case "hidden": case "textarea": 
	        	$ctrl.val(value);
	        	$('input[data-type="range"]').slider('refresh');
				break; 
	        	  
	        case "radio" : case "checkbox": $ctrl.each(function(){if($(this).attr('value') == value) $(this).attr("checked",value); }); break;
	        
	          
	    } 
    });
}

// Warning & Alert Popups
function infopop(msg){
	setTimeout(function(){
		$('#popinfo p').html(msg); 
		$('#popinfo p').listview().trigger("create").trigger('refresh');
		$("#popinfo").popup({ history: false }).popup('open');
	});
}

// Warning & Alert Popups
function msgpop(msg,vars,cb){
	vars.pto = vars.pto || 2500; vars.type = vars.type || 0;
	var mc = {0:["green","Success"],1:["red","ERROR"],2:["orange","! Warning"]}; 
	vars.title = vars.title|| mc[vars.type][1]; $('#poptitle').text(vars.title); 
	$('#popmsg').html(msg); $('#pophead').css('background',mc[vars.type][0]); $("#popup").popup({ history: false }).popup('open');
	setTimeout(function(){ $("#popup").popup('close'); if(typeof(cb)=="function") cb();},vars.pto);	
}

//131003000500
function my2ms(my){var p = my.toString().match(/.{1,2}/g);var d = new Date();d.setFullYear(parseInt(p[0])+2000);d.setMonth(parseInt(p[1])-1); d.setDate(p[2]);d.setHours(p[3],p[4],p[5]); return new Date(d).getTime()}

//## AFTER PAGE LOAD
$(document).on('pageshow', function() {
	var cdh = cdheight();
	$('a#nhome').trigger("click");
});

// New Page Handler
function page(data,cb){
	var pv={page:data.href.split('@')[1]};
	if(pv.page){
		if(!data.noloader) $.mobile.loading('show');
		$('#nav-panel').panel("close")
		setTimeout(function(){$('.ui-btn-active').removeClass('ui-btn-active');});
		$('.custom-collapsible').trigger('collapse'); $('#contentDiv > #'+pv.page).empty();
		pv.div = $('#contentDiv > #'+pv.page).empty(); pv.url = '/?page='+pv.page;
		$.ajax({url:pv.url}).done(function(data) {
			$('#contentDiv > *').hide();
			pv.div.html(data).trigger("create").find('ul[data-role=listview]').listview().trigger("create").trigger('refresh');
			formload(pv.div.find('form'));
			$('input[data-type="range"]').slider('refresh');
			pv.div.fadeIn('fast');
			if(typeof(cb)=="function") cb(pv.page,pv.div,pv.data);
			$.mobile.loading('hide');
			pv = null; data = null;
		});
	}	
}


/*## ON PAGE LOAD ##*/
$(document).on('pageinit', function(event){
	
	// Toggle Slider Disable
	$(document).on("change", "select.readonly", function(){
		var me = $(this);
		var ops = me.find('option');
		$.each(ops, function(key){ 
			if(ops[key].value != me.val()){
				setTimeout(function(){ 
					me.val(ops[key].value).slider('refresh');
				},400,me);
			}
		})
	})	
  	
  	/*## EXPAND/COLLAPSE ##*/
	$(document).on("expand", ".custom-collapsible", function(){
	   $('.custom-collapsible').not(this).trigger('collapse');	   
	}).on('collapse',function(){});

	// Nav panel Handler
	$('#custom-listview li a, a[data-icon=home]').click(function(e){
		e.preventDefault();
		page({href:this.href},function(page,div,data){				
			$('#header H1').text($('#panel').attr('data-location')+' - '+div.attr('title'));
			switch(page){	// post-load processor			
				case "home":
					div.html(data).trigger("create");
					home({loader:true});
					break;
			}
		
		});
	});

});

function getSensors(zid,cb){
	var sv = {};
	//if(zid=='*') sv.sql = "SELECT * FROM zones WHERE active = 'true' ORDER BY sid ASC";
	if(zid=='*') sv.sql = "SELECT rowid as 'zid',* FROM zones1 WHERE active > 0 ORDER BY sid ASC";
	//else sv.sql = "SELECT * FROM zones WHERE rowid = '"+zid+"'";
	else sv.sql = "SELECT rowid as zid,* FROM zones1 WHERE rowid = '"+zid+"'";	
	sv.url = "/?page=get&sql="+sv.sql;
	$.ajax({url:sv.url}).done(
		function(data) {
			cb(data);
			
	});
}

// Home Graph page
function home(v){
	v = v || {}; 	
	//if(v.loader) gLoader(v);
	$.mobile.loading('show');
	getSensors('*',function(sdata){
		v.ft = fromto(0,'d'); v.sdat={}; for(var key in sdata){ if(sdata[key].sid) v.sdat[sdata[key].sid] = sdata[key];};
		//v.sql = "SELECT zid as z, stamp as s, temp as t FROM data WHERE stamp > "+v.ft.fms+" AND stamp < "+v.ft.tms;		
		v.sql = "SELECT zid as z, mystamp as s, temp as t FROM data WHERE mystamp > "+v.ft.fymd+" AND mystamp < "+v.ft.tymd;
		v.sql += " AND substr(mystamp,7,2) || ':' || substr(mystamp,9,2) IN(select substr('00' || hr, -2, 2) || ':'||substr('00' || min, -2, 2) from schedule)";		
		v.url = "/?page=get&sql="+v.sql; v.zdat = {};
		$.ajax({url:v.url}).done( function(data) {
			
			for(var key in data){
				v.zone = data[key].z;
				if(v.zdat[v.zone]===undefined) v.zdat[v.zone] = [];
				//v.zdat[v.zone].push({s:data[key].s,t:data[key].t});
				v.zdat[v.zone].push({s:my2ms(data[key].s),t:data[key].t});
			}		
			//v.sql = "SELECT rowid,* FROM zones WHERE led > 0 ORDER BY led ASC";	v.url = "/?page=get&sql="+v.sql;
			v.sql = "SELECT rowid,* FROM zones1 WHERE active > 0 ORDER BY rowid ASC";	v.url = "/?page=get&sql="+v.sql;
			$.ajax({url:v.url}).done(
				function(zones) {
					v.i = 0;
					async.eachSeries(zones, function (zone,next){ 
						v.ch = $('#home #chart'+(v.i+1)); v.ch.attr('data-zid',zone.rowid);										
						graph(v.sdat[zone.sid],v.zdat[zone.rowid],{dbug:false,chart:v.ch,os:0,dwm:'d',sid:zone.rowid,loader:v.loader},function(){
							v.i++;					
							//if (v.i > 1) return;
							next();					
						});
					}, function(err){
						v=null; zones=null;data=null;sdata = null;
						$.mobile.loading('hide');
					});
			});
		});
	});
	
}

//function gLoader(opt){{$.mobile.loading('hide'); opt.ctr=centre(opt.chart); $('div.ui-loader').attr('style','left:'+opt.ctr.x+'px; top:'+opt.ctr.y+'px;'); $.mobile.loading('show',{text:'Loading Chart...',textVisible:true,theme:'c'});}}

// Get Graph Data & Then Plot it
function gData(opt){
	//if(opt.loader) gLoader();
	opt.ft = fromto(opt.os,opt.dwm);	
	getSensors(opt.zid,function(sdat){
		SAND = "";
		//if(!opt.dbug) SAND = " AND substr(mystamp,7,2) || ':' || substr(mystamp,9,2) IN(select substr('00' || hr, -2, 2) || ':'||substr('00' || min, -2, 2) from schedule)";
		if(!opt.dbug) SAND = " AND hrmin IN(select substr('00' || hr, -2, 2) || ':'||substr('00' || min, -2, 2) from schedule)";
		var sql = "SELECT stamp as s, temp as t FROM data WHERE zid = '"+opt.zid+"' AND stamp > "+opt.ft.fms+" AND stamp < "+opt.ft.tms+SAND; var url = "/?page=get&sql="+sql;
		$.ajax({url:url}).done( function(zdat) {graph(sdat,zdat,opt);});
	});	
}	

// Plot a Single Graph ( target needs to be div>div.chart )
function graph(sdat,zdat,opt,cb){
	//opt.dbug = true;	//## DEBUG MODE ##	
	opt.ft = fromto(opt.os,opt.dwm);	
	opt.dates = date2str(opt.ft.fdate) + " to "+date2str(opt.ft.tdate); //cl(zdat.length+' records '+opt.dates);
	if(zdat===undefined) opt.fp = [{}], opt.at = [{}]; else {opt.fp = [], opt.at = []; 

	///### DEBUG ###
	console.log(JSON.stringify(sdat)); 	// {"zid":4,"tstamp":"2013-11-19 07:43:55","info":"-OFF-","temp":-19,"altemp":-14,"active":1,"emailts":0,"alarmts":0,"algrace":15,"sid":"10-0008017f31d3","sends":0}
	console.log(JSON.stringify(zdat));	// [{"s":1386691201000,"t":21.44},{"s":1386694800000,"t":22.25},{"s":1386698400000,"t":21.69},{"s":1386702001000,"t":20.63},{"s":1386705600000,"t":20.69},{"s":1386709201000,"t":20.63},{"s":1386712800000,"t":20.63}]
	console.log(opt);
	
	
	for(var i in zdat){
		opt.fp.push([zdat[i].s,zdat[i].t]);}	
		if(sdat && opt.os==0) opt.fp.push([nowms(),sdat.temp]);	
		opt.at.push([opt.fp[0][0],sdat.altemp],[opt.fp[opt.fp.length-1][0],sdat.altemp]);
	}
	
	// Prepare Output
	opt.ch = opt.chart.find('div.chart'), opt.h3top = opt.chart.find('h3.top');
	if(sdat!==undefined){	
		var temp = pad(parseInt(sdat.temp),2)+'.'+pad(Math.abs(parseInt(sdat.temp%1*100)),2);

//if(nowms() - sdat.tstamp > 60000) opt.h3top.html('S'+sdat.led+'.'+sdat.info);
//if(sdat.temp < sdat.altemp) opt.h3top.html('S'+sdat.led+'.'+sdat.info + " <span class='cool'>"+temp+"</span>");
if(sdat.temp < sdat.altemp) opt.h3top.html('S'+sdat.zid+'.'+sdat.info + " <span class='cool'>"+temp+"</span>");
else opt.h3top.html('S'+sdat.zid+'.'+sdat.info + " <span class='hot'>"+temp+"</span>");



		opt.chart.find('h3.bot').html(opt.dates);
		if(opt.fp.length < 100) opt.points = true; else opt.points = false;
		$.plot(opt.ch,[{data:opt.fp,threshold:{below:sdat.altemp,color:'#6699CC'},color:'red',points:{show:opt.points},lines:{show:true}},{data:opt.at,color:'orange'}],{xaxis: {mode: "time",timezone: "browser"} });		
	}

	//if(opt.loader) {$.mobile.loading('hide'); $('div.ui-loader').removeAttr('style');}
	if(typeof(cb)=="function") cb();				
	opt=null;sdat=null;zdat=null;
};

