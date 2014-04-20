function cl(dat){return console.log(dat);}
function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;}return str;}

function getSchedules(){
	$.ajax({ 
		url: "/db/?mode=get&sql=SELECT * FROM schedule ORDER BY hr ASC, min ASC" 
		}).done(function(data) { 
			data = $.parseJSON(data);
			$.each(data, function(i,item) { 
				var time = parseInt(item.hr);
				if(time > 12) time = time % 12;
				time = pad(time,2) + ':' + pad(item.min,2);
				if(parseInt(item.hr) > 11) time += ' PM'; else time += ' AM';
				$('#schedule_lv').append('<li><a href="#test">'+ time +'</a> <a href="#dialogPage" data-rel="dialog" data-position-to="window" data-transition="pop">Delete</a></li>');
			});
			//$('#schedule_lv').listview('refresh');
			/*
			$('#schedule_lv li a').click(function(e){
				e.click();
				//e.preventDefault();
				alert('xxx');
			});
			*/
		});
}

function loadMenus(){	
	$.ajax({ 
		url: "/db/?mode=get&sql=SELECT * FROM sensors" 
		}).done(function(data) { 
			data = $.parseJSON(data);
			$.each(data, function(i, item) { 
				if($('#navpanel ul li#'+item.macid+item.id).length == 0) $('#nav-panel ul').append('<li id="'+item.macid+item.id+'"><a href="test.htm">'+item.info+'</a></li>');
			});
			$('.nav-search').listview('refresh');
			
			$('#nav-panel li a').click(function(e){
				e.preventDefault();
				//e.stopPropagation()
				$('div[data-role=collapsible]').trigger('collapse');
				$('h1.ui-title').text(this.text);
				$( "#nav-panel" ).panel( "close");	
				if(this.href.indexOf("#")===-1) getContent(this);
				else loadContent(this);
			});
		});
}

//## Load Div with Cached Content
function loadContent(elob){
	cl('loadContent()');
	var did = elob.href.split('#')[1];
	$('#contentDiv').html($('#'+did).html());
	$('#contentDiv').trigger("create");
	/*
	$('#contentDiv a').click(function(e){
		cl('xxx');
		//return null;
		 
		//getContent(this);
	});
	*/
}

//## Load The Content DIV ##
function getContent(elob){ 
	cl('getContent()');
	$.get(elob.href,function (data) {
		$('#contentDiv').html(data).trigger("create");
		/*
		$('#contentDiv a').click(function(e){
			e.preventDefault(); 
			getContent(this);
		});
		*/
	});
}

$( document ).on('pagebeforecreate', function() {
	
	cl("pageCreate()");
	//getSchedules();
	//loadMenus();
	//if ( $(window).width() > 1024) { $('.ui-mobile [data-role="page"],.ui-mobile .ui-header, .ui-mobile .ui-footer').css('width','1204px');}
	
});
	
$( document ).delegate("#page", "pageinit", function() { alert('A page with an id of "aboutPage" was just created by jQuery Mobile!');});

$(document).on('pageinit', function(event){
  	cl("pageInit()");
	$('#dialogPage').dialog();
	
	$.mobile.changePage('#dialogPage', {transition: 'pop', role: 'dialog'});   
			
	$( "#popup" ).popup({ corners:true});
	//$( "#popup" ).popup( "open" )
	
	//$('#contentDiv a').click(function(e){e.preventDefault(); alert('xxx');});  
 
  
  

	/*
  //$("#footerDiv").load('./php/pac.php', function(){$(this).trigger("create")});
   $('#contentDiv').swipe(function () {
        //$.mobile.changePage("#page1", { transition: "slide" });
        //alert('swipe');
        $.get('./php/joblist.php?type=R&page=2',function (data) {
			$('#contentDiv').html(data).trigger("create");
			//$('#contentDiv').html(data).animate({width:'toggle'},350);
			//$('#contentDiv').trigger("create");
			//$(this).show("slide", { direction: "left" }, 1000);
	});
        
    });
    */
	
});