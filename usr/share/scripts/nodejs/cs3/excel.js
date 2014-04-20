	var x = require('./excel.json');
	var excelbuilder = require('msexcel-builder');
	var workbook = excelbuilder.createWorkbook('./', 'sample.xlsx')
	var cols = x.colhead.length +5, rows = x.rowhead.length +10;
	var sht = workbook.createSheet('Sensor',cols,rows);

	// Titles
	sht.set(1,1,"Fridge / Freezer Diary Report"); sht.font(1,1,{sz:16});
	sht.set(1,2,"Downende House"); sht.font(1,2,{sz:16});
	sht.set(1,3, new Date().toString()); sht.font(1,3,{sz:16});

	// Header Row
	var row = 6; var col = 1;
	sht.set(col,row,"Time/Date"); sht.font(col,row,{bold:true});
	for(var c in x.colhead) {
		var sc = parseInt(c)+1+col
		sht.set(sc,row,x.colhead[c]);
		//sht.fill(sc,row,{type:'solid',bgColor:'64',fgColor:'8'});
		//sht.fill(sc,row,{type:'solid',fgColor:'8',bgColor:'64'});
	}
	
	for(var r in x.rows) {for(var c in x.rows[r]) {var cell = x.rows[r][c];sht.set(parseInt(c)+1,parseInt(r)+1+row,cell);}}
	
	workbook.save(function(ok){
		if (!ok) workbook.cancel();
		else console.log('congratulations, your workbook created');
	});