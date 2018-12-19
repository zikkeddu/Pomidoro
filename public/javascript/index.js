/* Frequently global used static paths to dom and variables */

var minutes_display = document.querySelector("#minutes_timer");
var seconds_display = document.querySelector("#seconds_timer");
var session_display = document.querySelector("#timer_session");
var curr_task_title_row = document.querySelector("#current_title_row");
var curr_task_progress_row = document.querySelector("#current_progress_row");
var current_title = document.querySelector("#current-title");
var page_title = document.querySelector("#page_title");
var timeJ = {};

//Global functions

function localeStorageFirstCharge() {
    /*
Local storage initialized if not present
For local persistence I use to storage records:
- one for current timer values
- one for category/task instances

If storages are not present I create it with default values.
All storage are json object converted in strings, cause locale storage accept only this kind of values.
They should be present before this execution of  the other dom ready functions.
*/
    if (!localStorage.time) {
        timeJ = {
            "clock": {"work": 25, "short": 5, "long": 15, "sec": 0, "display_min": "", "display_sec": ""},
            "count": {"work": 0, "short": 0, "long": 0},
            "state_of_art": {
                "session": "stopped",
                "clockrun": "",
                "progress": false,
                "current_title": "none",
                "current_task": "none",
                "current_cat": "none"
            }
        };

        localStorage.setItem("time", JSON.stringify(timeJ));
    }
    else {
        timeJ = JSON.parse(localStorage.time);
    }

    if (!localStorage.panel) {
        localStorage.setItem("panel", "");
    }
}
function popRefresh() {
    $("[data-toggle=popover]").each(function (i, obj) {
        /* this "for" cycle enable all popover into the dom */
        $(this).popover({
            html: true,
            content: function () {
                var id = $(this).attr('id')
                return $('#popover-content-' + id).html();
            }
        });
    });
}
function pophide(){
    /*
this function is used under dynamic creation event of some part of the dom to refresh popover
and hide the popover used for the creation.
All menus are, more or less, popover.
*/
    $("[data-toggle=popover]").each(function(i, obj) {
        $(this).popover('hide');
    });
    popRefresh();
}
function topFunction() {
    /* called when we want scroll to the top after some action */
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
function playSound() {
    /* play a sound charged on audio tag into the dom two times */
	var audio = document.querySelector("#audio");
	audio.play(); 
	setTimeout(function(){audio.play();},2000);
	setTimeout(function(){audio.play();},2000);
}
function ajaxRequest(url,id_data_string, direction, get_type) {
    /* It's a customized ajax Request function with multiple purposes explained below */
	var xhttp;
	var final_url = url; // this is normally the url, but it could change with some specitif call.
    if (window.XMLHttpRequest) {
        // code for modern browsers
        xhttp = new XMLHttpRequest();
    }
    else {
        // code for IE6, IE5
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
	xhttp.onreadystatechange = function() {
        /* this is a callback function that manage something from xhttp send action with a specific ready state */
		if (this.readyState == 4 && this.status == 200) {
		    if(direction === "get" && !get_type) {
		           /* default for get method without get_type spec. It put the response into a gived DIV tag */
                	document.getElementById(id_data_string).innerHTML = this.responseText;
		    }
           	else if(direction === "get" && get_type === "normal_get") {
           	    /* get data are only passed to the call function without do anything else. */
                return this.responseText;
            }
            else if(direction === "get" && get_type === "jsession"){
                /*
                    This get it's for data session stored on the server.
                    The there is a call to another function that merge this data with current local storage, if present.
                */
                console.log("response: " + this.responseText);
                merge(this.responseText);
            }
			else if(direction === "post" && this.responseText === "saved"){
			    /* when data are charged with a positive result on the server a popup show up */
			    pophide();
			    showPage("notify","up","Session saved on server!", false);
			}
            else if(direction === "post" && this.responseText !== "saved"){
                /* when data are not charged on the server a popup show up */
			    showPage("notify","up","Error saving data on the server!", false);
            }
            else {
                /* if anything match a specific console log it's generated */
                console.log("ajax request without scope");
            }
		}
	};
    if(get_type === "jsession" && direction !== "post") {
        /*
            For the get call of a session stored, file name is from an input and not nested in the call.
            Url should be with sintax expected by the get route defined on the server.
         */
        var name_file = $("#" + id_data_string).val();
        final_url = url + name_file ;
    }

    console.log(final_url); // log of url called
    xhttp.open(direction,final_url, true); // open the request connection. True parameter is for make the call async

    if(direction === "post") {
        /*
            For the post call of a session stored, file name is from an input and not nested in the call.
            A Request header  and a data string to post should be set and included into send request.
        */
        var name_file = $("#" + id_data_string).val();
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        string_to_post = "user=" + name_file + "&data=" + localStorage.panel;
        console.log(string_to_post);
        xhttp.send(string_to_post);
    }
    else{
        /* normal send call for get calls */
        xhttp.send();
    }
}
function addPageToDom(url, id, id_parent, media){
    /*

    */
    if(!media) {
        var spare_div1 = document.createElement('div');
        spare_div1.setAttribute('class', 'col-sm-2');
        var spare_div2 = document.createElement('div');
        spare_div2.setAttribute('class', 'col-sm-2');
        var row = document.createElement('div');
        row.setAttribute('class', 'row');
        var new_page_div = document.createElement('div');
        new_page_div.setAttribute('class', 'col-sm-8 flexbox');
        new_page_div.setAttribute('id', id);
        row.appendChild(spare_div1);
        row.appendChild(new_page_div);
        row.appendChild(spare_div2);
        $('#' + id_parent).append(row);
        ajaxRequest(url, id, "get");
    }
    else{
        var obj_tag = document.createElement('object');
        obj_tag.setAttribute('type', 'application/pdf');
        obj_tag.setAttribute('data', url);
        obj_tag.setAttribute('width', '100%');
        obj_tag.setAttribute('height', '800%');
        //$('#' + id_parent).append(obj_tag);
        $(body).append(obj_tag);
    }
}
function merge(data_get){
    /*
        Elaborate data session received by the get call to the jsession route on the server.
        If something is present on the local storage a merge is maked.
        If local storage is empty it do a simple charge.
    */
    console.log("received data: " + data_get);
    var panel_receiver = JSON.parse(data_get); // create a json object from the string received
    var merged = false; // default merge status. If there isn't a localstorage should be false.

    if("panel" in localStorage && localStorage.panel !== ""){ // Only if local panel storage is present
        console.log(localStorage.panel);
        var merged = true; // something is present.
        var panelJ = JSON.parse(localStorage.panel); // create a json object from the local storage string
        var cat,task; // instance of cat and task variables used below

        for(cat in panel_receiver){ // iterate cat list
       	    console.log("cat: " + cat);
       	    if (!panelJ[cat]) { // check if cat is present on local storage and merge if present
                console.log("aggiungo cat");
                panelJ[cat] = panel_receiver[cat];
                addCat("local", cat, "in"); // create cat panel
		    }
                
		    for(task in panel_receiver[cat]){ // iterate all tasks of category
                console.log("task: " + task);
		        if (!panelJ[cat][task]) { // check if task is present on local storage and merge if present
                    console.log("aggiungo task");
                    panelJ[cat][task] = panel_receiver[cat][task];
                    addTask(cat, "local", task); // add the task under category panel.
		        }
		    }
        }
        localStorage.setItem("panel", JSON.stringify(panelJ)); //delete actual local storage and write new merged one.
    }
    else{ // Else localstorage not present is populated directly with data received
	    localStorage.setItem("panel", JSON.stringify(panel_receiver));
        populateDomPanel(); // populate the dom with new sessions downloaded. similar to merge flow, but is all in one function
    }

    if(merged){ // put a popup message with charge result.
	showPage("notify","up","Requested session merged correctly with local session!", false);
    }
    else{
        showPage("notify","up","Requested session correctly added!", false);
    }
}
function unhide(id,side){
    /*
        This site act as a single page app.
        Does it means that all is charged locally and server calls are minimal.
        To do it, all is charged with first load and the DIV hidden.
        This function permit hide/unhide management of a generic DIV
    */
    var page_to_unhide = document.querySelector("#" + id);
    
    switch(side){
        case "up":
		    page_to_unhide.style.display = "inline";
		    break;
        case "down":
            page_to_unhide.style.display = "none";
            break;
    }
}
function showPage(id_up,id_down,text,music){
    if(id_down !=="up" && id_down !=="down"){
        unhide(id_up,"up");
        unhide(id_down,"down");
    }
    else{
		var page_to_show = document.querySelector("#" + id_up);
	
		switch(id_down){
			case "up":
				var pan = document.querySelector("#notify_pan");
				var button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.setAttribute('class', 'btn btn-xs btn-danger pull-right');
                button.setAttribute('onclick', 'showPage(\'notify\',\'down\')');
                button.innerText = "Close";
				pan.innerText = text;
				pan.appendChild(button);
				page_to_show.style.display = "inline";

				if(music){
				    playSound();
                }
				break;
			case "down":
				page_to_show.style.display = "none";
				break;
		}
    }
}
function erase(){
    if(window.confirm("You are loosing all your sessions. Are you sure?!")) {
        localStorage.clear();
        location.reload();
    }
}
function remove(id,cat){
	var id_rem = id.split(' ').join('_');
	id_class = document.getElementById(id_rem).className ;
      
	$('#' + id_rem).remove();

	if( id_class ==="panel panel-default"){
		var panelJ = JSON.parse(localStorage.panel);
		delete panelJ[id];
		localStorage.setItem("panel", JSON.stringify(panelJ));
		if(localStorage.panel === "{}"){
            showPage('first_access', 'null');
        }
	}

	if( id_class === "panel-body"){
		var panelJ = JSON.parse(localStorage.panel);
		delete panelJ[cat][id.split("£")[1]];
		localStorage.setItem("panel", JSON.stringify(panelJ));
	}
}
function addTask(element,source, local_task){
    if(source === "none"){
		var cat = element.id.split("£")[1];
		var task = $("#task_" + cat).val();
    }
    else{
        var cat = element ;
		var task = local_task ;
	}
			
    if (task) {
        var taskJ = {
            "name": task,
            "time": {
                "def_work": 25, "def_short": 5, "def_long": 15, "curr_phase": "", "curr_min": "",
                "curr_sec": "", "count_work": "", "count_short": "", "count_long": "", "done": ""
            },
            "progress": {
                "work1": 0, "short1": 0, "work2": 0, "short2": 0, "work3": 0,
                "short3": 0, "work4": 0, "long1": 0
            }
        };

        var task_concat = cat + "£" + task.split(' ').join('_');
        var task_id = cat + '£' + task;

        var task_bodypan = document.createElement('div');
        var progress_group = document.createElement('div');
        var row_up = document.createElement('div');
        var row_down = document.createElement('div');
        var div_left = document.createElement('div');
        var div_right = document.createElement('div');
        var div_under = document.createElement('div');
        var task_link = document.createElement('a');
        var task_button_done = document.createElement('button');
        var task_button_glyph_done = document.createElement('span');
        var task_button_rem = document.createElement('button');
        var task_button_glyph_rem = document.createElement('span');
        var set_span = document.createElement('span');
        var set_button = document.createElement('button');
        var set_button_glyph = document.createElement('span');
        var set_popover = document.createElement('div');

        var chunk_list = ["work1", "short1", "work2", "short2", "work3", "short3", "work4", "long1"], i;
        var set_list = {"work": 25, "short": 5, "long": 15}, j;

        var panelJ = JSON.parse(localStorage.panel);

        row_up.setAttribute('class', 'row');
        row_down.setAttribute('class', 'row');
        div_left.setAttribute('class', 'pull-left task_title');
        div_right.setAttribute('class', 'pull-right task_buttons');
        div_under.setAttribute('class', 'panel-body');
        task_bodypan.setAttribute('class', 'panel-body');
        task_bodypan.setAttribute('id', task_concat);
        task_link.setAttribute('data-placement', 'top');
        task_link.setAttribute('data-toggle', 'tooltip');
        task_link.setAttribute('title', 'Click to start di task timer');
        task_link.setAttribute('href', '#');
        task_link.setAttribute('onclick', 'run_session(this, \'' + cat + '\')');
        task_link.innerHTML = task;
        task_button_rem.setAttribute('type', 'button');
        task_button_rem.setAttribute('data-toggle', 'tooltip');
        task_button_rem.setAttribute('title', 'Remove this task');
        task_button_rem.setAttribute('data-placement', 'top');
        task_button_rem.setAttribute('class', 'btn btn-xs btn-danger');
        task_button_rem.setAttribute('onclick', 'remove(\'' + task_id + '\',\'' + cat + '\')');
        task_button_glyph_rem.setAttribute('class', 'glyphicon glyphicon-minus');
        task_button_rem.appendChild(task_button_glyph_rem);
        task_button_done.setAttribute('type', 'button');
        task_button_done.setAttribute('data-toggle', 'tooltip');
        task_button_done.setAttribute('title', 'Mark this task as done');
        task_button_done.setAttribute('data-placement', 'top');
        task_button_done.setAttribute('class', 'btn btn-xs btn-success');
        task_button_done.setAttribute('id', task_concat + '_doneButton');
        task_button_done.setAttribute('onclick', 'taskDone(\'' + task + '\', \'' + cat + '\', \'update\')');
        task_button_glyph_done.setAttribute('class', 'glyphicon glyphicon-ok');
        task_button_glyph_done.setAttribute('id', task_concat + '_doneGlyph');
        task_button_done.appendChild(task_button_glyph_done);
        progress_group.setAttribute('class', 'progress');
        progress_group.setAttribute('id', 'bar_' + task);

        for (i in chunk_list) {
            var progress_type;
            var type = chunk_list[i].slice(0, -1);
            var progress_chunk = document.createElement('div');

            switch (type) {
                case "work":
                    progress_type = "success";
                    break;
                case "short":
                    progress_type = "info";
                    break;
                case "long":
                    progress_type = "warning";
                    break;
            }

            progress_chunk.setAttribute('class', 'progress-bar progress-bar-' + progress_type);
            progress_chunk.setAttribute('role', 'progressbar');
            progress_chunk.setAttribute('style', 'width:0%');
            progress_chunk.setAttribute('id', task_concat + '_' + chunk_list[i]);
            progress_group.appendChild(progress_chunk);
        }

        set_span.setAttribute('data-toggle', 'tooltip');
        set_span.setAttribute('data-placement', 'top');
        set_span.setAttribute('title', 'Set Timers');
        set_button.setAttribute('id', 'set_' + task_concat);
        set_button.setAttribute('class', 'btn btn-xs btn-warning');
        set_button.setAttribute('data-toggle', 'popover');
        set_button.setAttribute('title', 'Set Timers');
        set_button.setAttribute('data-container', 'body');
        set_button.setAttribute('data-html', 'true');
        set_button.setAttribute('data-placement', 'bottom');
        set_button_glyph.setAttribute('class', 'glyphicon glyphicon-th-list');
        set_popover.setAttribute('class', 'hide');
        set_popover.setAttribute('id', 'popover-content-set_' + task_concat);

        for (j in set_list) {
            var set_popover_text = document.createElement('p');
            var set_popover_span_minus = document.createElement('span');
            var set_popover_span_num = document.createElement('span');
            var set_popover_span_plus = document.createElement('span');
            var set_popover_span_num_text = document.createElement('strong');
            var set_popover_span_minus_glyph = document.createElement('span');
            var set_popover_span_plus_glyph = document.createElement('span');
            var set_popover_span_minus_button = document.createElement('span');
            var set_popover_span_plus_button = document.createElement('span');
            if (!panelJ[cat][task]) {
                var t = ("0" + set_list[j]).slice(-2);
            }
            else {
                var t = ("0" + panelJ[cat][task]["time"]["def_" + j]).slice(-2);
            }

            if (j === "work") {
                var text_p = j.charAt(0).toUpperCase() + j.slice(1) + " Session";
            }
            else {
                var text_p = j.charAt(0).toUpperCase() + j.slice(1) + " Break";
            }

            var id_set = "set_" + j + "_" + task_concat;

            set_popover_span_minus_button.setAttribute('type', 'button');
            set_popover_span_minus_button.setAttribute('class', 'btn btn-xs btn-danger');
            set_popover_span_minus_button.setAttribute('onclick', 'setTime(\'' + id_set + '\',\'dec\', \'' + j + '\', \'' + task + '\',\'' + cat + '\')');
            set_popover_span_plus_button.setAttribute('type', 'button');
            set_popover_span_plus_button.setAttribute('class', 'btn btn-xs btn-success');
            set_popover_span_plus_button.setAttribute('onclick', 'setTime(\'' + id_set + '\',\'inc\', \'' + j + '\', \'' + task + '\',\'' + cat + '\')');
            set_popover_span_minus_glyph.setAttribute('class', 'glyphicon glyphicon-minus');
            set_popover_span_plus_glyph.setAttribute('class', 'glyphicon glyphicon-plus');
            set_popover_text.innerText = text_p;
            set_popover_span_num_text.setAttribute('id', id_set);
            set_popover_span_num_text.innerHTML = t;

            set_button.appendChild(set_button_glyph);
            set_span.appendChild(set_button);
            set_popover_span_minus_button.appendChild(set_popover_span_minus_glyph);
            set_popover_span_plus_button.appendChild(set_popover_span_plus_glyph);
            set_popover_span_minus.appendChild(set_popover_span_minus_button);
            set_popover_span_plus.appendChild(set_popover_span_plus_button);
            set_popover_span_num.appendChild(set_popover_span_num_text);
            set_popover.appendChild(set_popover_text);
            set_popover.appendChild(set_popover_span_minus);
            set_popover.appendChild(set_popover_span_num);
            set_popover.appendChild(set_popover_span_plus);
        }

        div_left.appendChild(task_link);
        div_right.appendChild(task_button_done);
        div_right.appendChild(set_span);
        div_right.appendChild(set_popover);
        div_right.appendChild(task_button_rem);
        div_under.appendChild(progress_group);
        row_up.appendChild(div_left);
        row_up.appendChild(div_right);
        row_down.appendChild(div_under);
        task_bodypan.appendChild(row_up);
        task_bodypan.appendChild(row_down);

        if (source === "none") {
            if (!panelJ[cat][task]) {
                $('#collapse_' + cat).append(task_bodypan);
                panelJ[cat][task] = taskJ;
                localStorage.setItem("panel", JSON.stringify(panelJ));
            }
            else {
                showPage("notify", "up", "Task already created! Please choose another name", false);
            }
        }
        else {
            $('#collapse_' + cat).append(task_bodypan);
        }

        pophide();
    }
}
function addCat(source, local_cat,collapse){
    if(source === "none"){
		var cat = $("#cat_name").val();	
                var collapse = "in";
	}
	else{
		var cat = local_cat ;
    }
	
	if (cat){
		var cat_pan = document.createElement('div');
		var cat_pan_heading = document.createElement('div');
		var cat_popover = document.createElement('div');
		var cat_collapse = document.createElement('div');
        var div_right = document.createElement('div');
		var cat_heading_link = document.createElement('a');
		var cat_button_rem = document.createElement('button');
		var cat_button_add = document.createElement('button');
		var popover_button_submit = document.createElement('button');
		var popover_input = document.createElement('input');
		var cat_button_glyph_rem = document.createElement('span');
		var cat_button_glyph_add = document.createElement('span');
		var add_task_tooltip = document.createElement('span');

        div_right.setAttribute('class', 'panel-title pull-right');

	    add_task_tooltip.setAttribute('data-toggle', 'tooltip');
	    add_task_tooltip.setAttribute('title', 'Add a task');
	    add_task_tooltip.setAttribute('data-placement', 'top');
		
		cat_pan.setAttribute('class', 'panel panel-default');
		cat_pan.setAttribute('id', cat);
		
		cat_pan_heading.setAttribute('class', 'panel-heading');
		
		cat_heading_link.setAttribute('class', 'panel-title');
		cat_heading_link.setAttribute('data-toggle', 'collapse');
		cat_heading_link.setAttribute('data-parent', '#pan_crew');
		cat_heading_link.setAttribute('href', '#collapse_' + cat);
		cat_heading_link.innerHTML="#" + cat;
		
		cat_button_rem.setAttribute('type', 'button');
		cat_button_rem.setAttribute('data-toggle', 'tooltip');
		cat_button_rem.setAttribute('title', 'Remove this category');
		cat_button_rem.setAttribute('data-placement', 'top');
		cat_button_rem.setAttribute('class', 'btn btn-xs btn-danger');
		cat_button_rem.setAttribute('onclick', 'remove(\'' + cat + '\')');
		
		cat_button_add.setAttribute('type', 'button');
		cat_button_add.setAttribute('data-toggle', 'popover');
		cat_button_add.setAttribute('data-original-title', 'Add a new task to this category');
		cat_button_add.setAttribute('data-placement', 'bottom');
		cat_button_add.setAttribute('class', 'btn btn-xs btn-success');
		cat_button_add.setAttribute('id', 'add_task_cat_' + cat);
		cat_button_add.setAttribute('data-html', 'true');
		
		cat_button_glyph_rem.setAttribute('class', 'glyphicon glyphicon-minus');
		cat_button_glyph_add.setAttribute('class', 'glyphicon glyphicon-plus');
		
		cat_popover.setAttribute('class', 'hide');
		cat_popover.setAttribute('id', 'popover-content-add_task_cat_' + cat);
		
		popover_input.setAttribute('placeholder' , 'Insert a taskname here!');
		popover_input.setAttribute('id' , 'task_' + cat);
		popover_input.setAttribute('type' , 'text');
		
		popover_button_submit.setAttribute('type', 'submit');
		popover_button_submit.setAttribute('id', 'button£' + cat);
		popover_button_submit.setAttribute('class', 'btn btn-primary');
		popover_button_submit.setAttribute('onclick', 'addTask(this,\'none\')');
		popover_button_submit.innerHTML = "Submit";
		
		cat_collapse.setAttribute('class', 'panel-collapse collapse ' + collapse);
		cat_collapse.setAttribute('id', 'collapse_' + cat);
		
		cat_popover.appendChild(popover_input);
		cat_popover.appendChild(popover_button_submit);
		cat_button_rem.appendChild(cat_button_glyph_rem);
		cat_button_add.appendChild(cat_button_glyph_add);
		add_task_tooltip.appendChild(cat_button_add);
		div_right.appendChild(add_task_tooltip);
		div_right.appendChild(cat_button_rem)
		cat_pan_heading.appendChild(cat_heading_link);
		cat_pan_heading.appendChild(div_right);
		cat_pan_heading.appendChild(cat_popover);
		cat_pan.appendChild(cat_pan_heading);
		cat_pan.appendChild(cat_collapse);

		if(source === "none" ){
			if(localStorage.panel === ""){
			    $('#pan_crew').append(cat_pan);
			    var panel_raw = {};
				panel_raw[cat] = {"name":cat} ;
				localStorage.setItem("panel", JSON.stringify(panel_raw));
			}
			else{
				var panelJ = JSON.parse(localStorage.panel);
				if(!panelJ[cat]){
					$('#pan_crew').append(cat_pan);
					panelJ[cat] = {"name":cat};
					localStorage.setItem("panel", JSON.stringify(panelJ));
				}
				else{
					showPage("notify","up","Category already created! Please choose another name", false);
				}
			}
		}
		else{
			$('#pan_crew').append(cat_pan);
		}
        pophide();
		unhide("first_access", "down");
	}
}
function populateDomPanel(){
    var local_panel = JSON.parse(localStorage.panel);
    var i,j,z,count=0;

    for (i in local_panel) {
        for(j in local_panel[i]){
            if(j === "name"){
                if(count > 0)
                    addCat("local", local_panel[i][j], "collapse");
                else{
                    addCat("local", local_panel[i][j], "in");
                }
                count ++;
            }
            else{
                addTask(i, "local", local_panel[i][j]["name"]);
                for (z in local_panel[i][j]["progress"]){
                    if(local_panel[i][j]["progress"][z] > 0){
                        var sub_task_bar = $('#' + i + '£' + j.split(' ').join('_') + '_' + z) ;
                        sub_task_bar.text(z);
                        sub_task_bar.width(local_panel[i][j]["progress"][z] + "%");

                        if(local_panel[i][j]["time"]["done"]){
                            taskDone(j, i, "no update");
                        }
                    }
                }
            }
        }
    }
}
function progressBarManager(task,cat){
	var bar_width_array = {"work":18, "short":6, "long":10};
		
		var set_min = Number(timeJ["clock"][timeJ.state_of_art.session.slice(0,-1)]);
		var min_now = Number(minutes_display.innerText);
		var sec_now = Number(seconds_display.innerText);
		var def_progress_percent = bar_width_array[timeJ.state_of_art.session.slice(0,-1)];
		var progress_width =(def_progress_percent/(set_min*60))*((set_min*60)-((min_now*60)+sec_now));
		var sub_bar = $('#current_' +  timeJ.state_of_art.session) ;
		var sub_task_bar = $('#' + cat + '£' + task.split(' ').join('_') + '_' + timeJ.state_of_art.session) ;
		sub_bar.text(timeJ.state_of_art.session);
		sub_bar.width(progress_width + "%");
		sub_task_bar.text(timeJ.state_of_art.session);
		sub_task_bar.width(progress_width + "%");
		
		return progress_width;
}
function button_set(id, status, text){
    var button_display = document.querySelector(id);
	if (status){
		button_display.classList.remove("btn-success") ;
		button_display.classList.add("btn-danger") ;
		button_display.innerHTML = text;
	}
	else{
		button_display.classList.remove("btn-danger") ;
		button_display.classList.add("btn-success") ;
		button_display.innerHTML = text;
	}
}
function updateLocaleStorage(task,cat,bar_width,task_panel){
	task_panel[cat][task]["time"]["curr_min"] = minutes_display.innerText ;
	task_panel[cat][task]["time"]["curr_sec"] = seconds_display.innerText ;
	task_panel[cat][task]["time"]["curr_phase"] = timeJ.state_of_art.session;
	task_panel[cat][task]["time"]["count_work"] = timeJ.count.work ;
	task_panel[cat][task]["time"]["count_short"] = timeJ.count.short ;
	task_panel[cat][task]["time"]["count_long"] = timeJ.count.long ;
	task_panel[cat][task]["progress"][timeJ.state_of_art.session] = bar_width ;
	localStorage.setItem("panel", JSON.stringify(task_panel));
	localStorage.setItem("time", JSON.stringify(timeJ));
}
function time_manager(min, sec, session_timer){
	if(sec == 0) {
        if(min == 0) {
			timeJ.state_of_art.session = "stopped"
			return ;
        }
        sec = 59;
        min --;
    } 	
	else {
		sec --;
	}
	timeJ.state_of_art.session = session_timer ;
	minutes_display.innerHTML = ("0" + min).slice(-2);
	seconds_display.innerHTML = ("0" + sec).slice(-2);
	session_display.innerHTML = timeJ.state_of_art.session;
    page_title.innerHTML = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2) + " " + timeJ.state_of_art.session + " " + "Pomidoro";
}
function time_session(task, cat){
	var task_panel = JSON.parse(localStorage.panel);
	
	if (timeJ.state_of_art.session === "stopped"){
		if(timeJ.count.long == 1){
			clearInterval(timeJ.state_of_art.clockrun);
			timeJ.state_of_art.clockrun = "" ;			
			timeJ.count.work = 0 ;
			timeJ.count.short = 0 ;
			timeJ.count.long = 0;
			session_display.innerHTML = "done";
            page_title.innerHTML = "Done Pomidoro";
			task_panel[cat][task]["time"]["done"] = true ;
			updateLocaleStorage(task,cat,bar_width,task_panel);
            showPage("notify","up","Well done! Task completed! We are ready for a new one!", true);
		}
		else if (timeJ.count.work == timeJ.count.short){
			timeJ.count.work ++ ;
			time_manager(timeJ.clock.work, timeJ.clock.sec, "work" + timeJ.count.work);
			if(timeJ.count.work > 1){
			showPage("notify","up","it's time to work my friend!", true);
			}
		}	
		else if (timeJ.count.work > timeJ.count.short && timeJ.count.short < 3){
			timeJ.count.short ++ ;
			time_manager(timeJ.clock.short, timeJ.clock.sec, "short" + timeJ.count.short);
			showPage("notify","up","Take a break my friend!", true);
		}
		else{
			timeJ.count.long ++ ;
			time_manager(timeJ.clock.long, timeJ.clock.sec, "long" + timeJ.count.long);
			showPage("notify","up","Task more or less completed! Take a long break, my friend!", true);
		}
	}	
	else{
		time_manager(minutes_display.innerText, seconds_display.innerText, timeJ.state_of_art.session);
		var bar_width = progressBarManager(task,cat);
		updateLocaleStorage(task,cat,bar_width,task_panel);
	}
}
function setTaskSession(task,cat){
	var title_task = task + " of category #" + cat ;
	var task_panel = JSON.parse(localStorage.panel);
	
	if(title_task !== timeJ.state_of_art.current_title){
		if(!task_panel[cat][task]["time"]["done"]){
			if(task_panel[cat][task]["time"]["curr_phase"] === ""){
				var sessions = ['work1', 'short1', 'work2', 'short2', 'work3', 'short3', 'work4', 'long1'];
				var y;
			    timeJ.count.work = 0 ;
				timeJ.count.short = 0 ;
				timeJ.count.long = 0;
				timeJ.state_of_art.session = "stopped";
				for(y in sessions){
                    var sub_bar = document.querySelector("#current_" + sessions[y]);
                    sub_bar.innerText = "";
                    sub_bar.style.width = "0%";
                }
			}
			else{
				timeJ.count.work = task_panel[cat][task]["time"]["count_work"] ;
				timeJ.count.short = task_panel[cat][task]["time"]["count_short"] ;
				timeJ.count.long = task_panel[cat][task]["time"]["count_long"];
				timeJ.state_of_art.session = task_panel[cat][task]["time"]["curr_phase"];
				minutes_display.innerHTML = task_panel[cat][task]["time"]["curr_min"];
				seconds_display.innerHTML = task_panel[cat][task]["time"]["curr_sec"];
				var i,j;

				for (i in task_panel[cat][task]["progress"]) {
					if( i !== "stopped") {
                        var tag = "";
                        var pro_with = 0 + "%";
                        var sub_bar = document.querySelector("#current_" + i);

                        if (task_panel[cat][task]["progress"][i] > 0 && i !== "done" && i !== "stopped") {
                            tag = i;
                            pro_with = task_panel[cat][task]["progress"][i] + "%";
                        }

                        sub_bar.innerText = tag;
                        sub_bar.style.width = pro_with;
                    }
				}
			}
		
			timeJ.state_of_art.current_title = title_task ;
			timeJ.state_of_art.current_task = task;
			timeJ.state_of_art.current_cat = cat ;
			timeJ.clock.work = task_panel[cat][task]["time"]["def_work"] ;
			timeJ.clock.short = task_panel[cat][task]["time"]["def_short"] ;
			timeJ.clock.long = task_panel[cat][task]["time"]["def_long"] ;
			curr_task_title_row.style.display = "inline";
			curr_task_progress_row.style.display = "inline";
			current_title.innerHTML = timeJ.state_of_art.current_title ;
            pophide();
			return true ;
		}
		else{
                        showPage("notify","up","Task just completed! Start another one!", false);
			return false;
		}
	}
	else{
		return false;
	}
}
function run_session(element, cat){
	if(element){
		var task = element.text ;
		if(setTaskSession(task,cat)){	
			clearInterval(timeJ.state_of_art.clockrun);
			timeJ.state_of_art.clockrun = "" ;
			timeJ.state_of_art.clockrun = setInterval(function(){time_session(task, cat);},1000);
			button_set("#timer_button", true, "pause");
			timeJ.state_of_art.progress = true;
            topFunction()
		}
	}
	else{
		if (!timeJ.state_of_art.progress){
			timeJ.state_of_art.progress = true;
			timeJ.state_of_art.clockrun = setInterval(function(){time_session(timeJ.state_of_art.current_task, timeJ.state_of_art.current_cat);},1000);
            button_set("#timer_button", true, "pause");
		} 	
		else {
			timeJ.state_of_art.progress = false ;
			clearInterval(timeJ.state_of_art.clockrun);
            button_set("#timer_button", false, "start");
		}
	}	
}
function setTime(id,action,session,task,cat){
    var task_panel = JSON.parse(localStorage.panel);
    var set_display = document.querySelector("#" + id);

    if (action === "inc" && task_panel[cat][task]["time"]["def_" + session] >= 0) {
        task_panel[cat][task]["time"]["def_" + session]++;
    }
    if (action === "dec" && task_panel[cat][task]["time"]["def_" + session] > 0){
        task_panel[cat][task]["time"]["def_" + session]--;
    }
    set_display.innerHTML = ("0" + task_panel[cat][task]["time"]["def_" + session]).slice(-2);
    $('#' + id.replace(session + "_", "")).popover("show");
    localStorage.setItem("panel", JSON.stringify(task_panel));
}
function taskDone(task, cat, store){
    var task_panel = JSON.parse(localStorage.panel);
    var done_glyph = $('#' + cat + '£' + task.split(' ').join('_') + '_doneGlyph');
    var done_button = $('#' + cat + '£' + task.split(' ').join('_') + '_doneButton');
    var color_bar = {work: "success", short: "info", long: "warning"};

    if(!task_panel[cat][task]["time"]["done"] || store === "no update") {
        if(!task_panel[cat][task]["time"]["done"] && store !== "no update" && timeJ.state_of_art.progress){
            run_session();
        }

        var nextSessionName = {
            'work1': 'short1',
            'short1': 'work2',
            'work2': 'short2',
            'short2': 'work3',
            'work3': 'short3',
            'short3': 'work4',
            'work4': 'long1'
        };
        var nextSession = nextSessionName[task_panel[cat][task]["time"]["curr_phase"]];
        var percentUsed = 0, i , progress_done;

        for (i in task_panel[cat][task]["progress"]) {
            percentUsed += Number(task_panel[cat][task]["progress"][i]);
        }

        progress_done = 100 - percentUsed;

        task_panel[cat][task]["time"]["done"] = true;
        var sub_task_bar = $('#' + cat + '£' + task.split(' ').join('_') + '_' + nextSession);
        sub_task_bar.text("Marked Done");
        sub_task_bar.width(progress_done + "%");
        sub_task_bar.removeClass("progress-bar-" + color_bar[nextSession]);
        sub_task_bar.addClass("progress-bar-danger");
        done_button.tooltip.title = "Restore this task as a working task" ;
        done_glyph.removeClass("glyphicon-ok");
        done_glyph.addClass("glyphicon-repeat");
    }
    else{
        var phase = "";
        var progress_width = 0;

        task_panel[cat][task]["time"]["done"] = false;

        done_button.tooltip.title = "Mark this task as done";
        done_glyph.removeClass("glyphicon-repeat");
        done_glyph.addClass("glyphicon-ok");

        for (phase in task_panel[cat][task]["progress"]){
            progress_width = task_panel[cat][task]["progress"][phase];
            var sub_task_bar = $('#' + cat + '£' + task.split(' ').join('_') + '_' + phase) ;
            if(progress_width > 0){
                sub_task_bar.text(phase);
            }
            else{
                sub_task_bar.text("");
            }
            sub_task_bar.width(progress_width + "%");

            sub_task_bar.removeClass("progress-bar-danger");
            sub_task_bar.addClass("progress-bar-" + color_bar[phase.slice(0,-1)]);
        }
    }
    if(store !== "no update"){
        localStorage.setItem("panel", JSON.stringify(task_panel));
    }
}

// back button intercept

window.onhashchange = function() {
    showPage('home_page','external_home');
}

// DOM variables initialization at the first load

$(document).ready(function () {
    localeStorageFirstCharge();
    addPageToDom("views/why.html", "why", "external_home")
    addPageToDom("views/first_access.html", "first_access", "newPages");
    if(localStorage.panel === "" || localStorage.panel === "{}"){
        unhide("first_access", "up");
    }

    timeJ.state_of_art.current_title = "none" ;
	timeJ.state_of_art.current_task = "none" ;
	timeJ.state_of_art.current_cat = "none" ;
    timeJ.state_of_art.progress = "false" ;
    timeJ.state_of_art.session = "stopped" ;
    minutes_display.innerHTML = ("0" + 0).slice(-2);
    seconds_display.innerHTML = ("0" + 0).slice(-2);
    session_display.innerHTML = timeJ.state_of_art.session;
    button_set("#timer_button", false, "start");
	localStorage.setItem("time", JSON.stringify(timeJ));

	if("panel" in localStorage && localStorage.panel !== ""){
        populateDomPanel();
	}
    if(localStorage.panel === "" || localStorage.panel === "{}"){
        unhide("first_access", "up");
    }
    popRefresh();
    $('[data-toggle="tooltip"]').tooltip();
});