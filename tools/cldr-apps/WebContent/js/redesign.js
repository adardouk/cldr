//startup fonction
$(function() {

    
    //for locale search
    $('body').on('click','#show-locked', {type:"lock"}, toggleLockedRead);
    $('body').on('click','#show-read', {type:"read"}, toggleLockedRead);
	$('#locale-info .local-search').keyup(filterAllLocale);
    setHelpContent('Welcome');
    $('#help-menu > a').click(interceptHelpLink);
    
    //local chooser intercept
    $('body').on('click','.locName',interceptLocale);
    
    //handle sidebar
    $('#left-sidebar').hover(function(){
    			$(this).addClass('active');
    			toggleOverlay();
    		}, 
    		function() {
    			if(surveyCurrentLocale) {
	    			$(this).removeClass('active');
	    			toggleOverlay();
    			}
    		});
    $('.refresh-search').click(searchRefresh);
   
    
    
    //help bootstrap -> close popup when click outside
    $('body').on('click', function (e) {
        $('[data-toggle="popover"]').each(function () {
            //the 'is' for buttons that trigger popups
            //the 'has' for icons within a button that triggers a popup
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
    });
    
    initFeedBack();
});

//this function is used in survey.js
var sentenceFilter;
//filter all the locale (first son, then parent so we can build the tree, and let the parent displayed if a son is matched)
function filterAllLocale(event) {
		if($(this).hasClass('local-search')) {
			$('input.local-search').val($(this).val());
			$('a.locName').removeClass('active');
			$('#locale-list,#locale-menu').removeClass('active');
		}
		sentenceFilter = $('input.local-search').val().toLowerCase();
		$('.subLocaleList .locName').each(filterLocale);//filtersublocale
		$('.topLocale .locName').each(filterLocale);//filtertolocale
}

//filter (locked and read-only) with locale
function toggleLockedRead(event) {
	var type = event.data.type;
	if($(this).is(':checked')) {
		if(type == "read")
			$('.locName:not(.canmodify):not(.locked)').parent().removeClass('hide');
		else
			$('.locName.locked').parent().removeClass('hide');
	}
	else {
		if(type == "read")
			$('.locName:not(.canmodify):not(.locked)').parent().addClass('hide');
		else
			$('.locName.locked').parent().addClass('hide');
	}
		
	filterAllLocale();
}

//hide/show the locale matching the pattern and the checkbox
function filterLocale() {
	var text = $(this).text().toLowerCase();
	var parent = $(this).parent();
	if(text.indexOf(sentenceFilter) == 0 && (checkLocaleShow($(this)))) {
		parent.removeClass('hide');
		if(parent.hasClass('topLocale')) {
			parent.parent().removeClass('hide');
			parent.next().children('div').removeClass('hide');
		}
	}
	else {
		if(parent.hasClass('topLocale')) {
			if(parent.next().children('div').not('.hide').length == 0) {
				parent.addClass('hide');
				parent.parent().addClass('hide');
			}
			else {
				parent.removeClass('hide');
				parent.parent().removeClass('hide');
				//parent.next().children('div').removeClass('hide');
			}
		}
		else
			parent.addClass('hide');
	}
};

//should we show this locale considering the checkbox ?
function checkLocaleShow(element) {
	if(element.hasClass('locked') && $('#show-locked').is(':checked'))
		return true;
	
	if((!element.hasClass('canmodify') && $('#show-read').is(':checked') && !element.hasClass('locked')) || element.hasClass('canmodify'))
		return true;
	
	return false;
} 

//intercept the click of the locale name ->
function interceptLocale() {
	var name = $(this).text();
	var source = $(this).attr('title');
	
	$('input.local-search').val(name);
	$('a.locName').removeClass('active');
	$(this).addClass('active');
	filterAllLocale();
	$('#locale-list').addClass('active');
	$('#locale-menu').addClass('active');
	
}

//sidebar constructor
var cachedJson; //use a cache cause the coverage can change, so we might need to update the menu
function unpackMenuSideBar(json) {
	if(json.menus) {
		cachedJson = json;
	}
	else {
		var lName = json["_v"];
		json = cachedJson;
		json.covlev_org = lName;
	}
	var menus = json.menus.sections;
	var levelName = json.covlev_org;
	var menuRoot = $('#locale-menu');
	var level = 0;
	var levels = json.menus.levels;
	
	//get the level number
	$.each(levels, function(index, element) {
		if(element.name == levelName)
			level = parseInt(element.level);
	});
	
	var html = '<ul>';
	if(!isVisitor)
		html += '<li class="list-unstyled" id="review-link"><div>Dashboard<span class="pull-right glyphicon glyphicon-home" style="position:relative;top:2px;right:3px;"></span></div></li>';
	html += '<li class="list-unstyled" id="forum-link"><div>Forum<span class="pull-right glyphicon glyphicon-comment" style="position:relative;top:2px;right:3px;"></span></div></li>';
	html += '</ul>';
	
	html += '<ul>';
	$.each(menus, function(index, element) {
		var menuName = element.name;
		html += '<li class="list-unstyled open-menu"><div>'+menuName+'<span class="pull-right glyphicon glyphicon-chevron-right"></span></div><ul class="second-level">';
		$.each(element.pages, function(index, element){
			var pageName = element.name;
			var pageId = element.id;
			$.each(element.levs, function(index, element){
				if(parseInt(element) <= level)
					html += '<li class="sidebar-chooser list-unstyled" id="'+pageId+'"><div>'+pageName+'</div></li>';
				
			});
		});
		html += '</ul></li>';
	});
	
	html += '</ul>';


	menuRoot.html(html);
	menuRoot.find('.second-level').hide();
	
	//dont slide up and down infinitely
	$('.second-level').click(function(event) {
		event.stopPropagation();
		event.preventDefault();
	});
	
	//slide down the menu
	$('.open-menu').click(function(){
		$('#locale-menu .second-level').slideUp();
		$('.open-menu .glyphicon').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
		
		$(this).children('ul').slideDown();
		$(this).find('.glyphicon').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
	});
	
	//menu
	$('.sidebar-chooser').click(function(){
		window.surveyCurrentPage = $(this).attr('id');
		window.surveyCurrentSpecial = '';
		reloadV();
		$('#left-sidebar').removeClass('active');
		toggleOverlay();
	});
	
	//review link 
	$('#review-link').click(function() {
		window.surveyCurrentSpecial = 'r_vetting_json';
		reloadV();
		$('#left-sidebar').removeClass('active');
		toggleOverlay();
	});
	
	//forum link 
	$('#forum-link').click(function() {
		window.open(contextPath + '/survey?forum='+surveyCurrentLocale.substr(0,2));
	});
	
	
	if(surveyCurrentLocale) {
		$('a[data-original-title="'+surveyCurrentLocale+'"]').click();
	}
}

//force to open the sidebar 
function forceSidebar() {
	searchRefresh();
	$('#left-sidebar').mouseenter();
}

//refresh the search field
function searchRefresh() {
	$('.local-search').val('');
	$('.local-search').keyup();
}

//toggle the overlay of the menu
var toToggleOverlay;
function toggleOverlay(){
	var overlay = $('#overlay');
	var sidebar = $('#left-sidebar');
	if(!sidebar.hasClass('active')) {
		overlay.removeClass('active');
		toToggleOverlay = true;

		setTimeout(function(){
			if(toToggleOverlay)
				overlay.css('z-index', '-10');
		},500);
	}
	else {
		toToggleOverlay = false;
		overlay.css('z-index','1000');
		overlay.addClass('active');
	}
}


//show the help popup in the center of the screen 
var oldTypePopup = '';
function popupAlert(type, content, head, aj, dur) {
	var ajax = (typeof aj === "undefined") ? "" : aj;
	var header = (typeof aj === "undefined") ? "" : head; 
	var duration = (typeof dur === "undefined") ? 3000 :dur; 
	var alert = $('#progress').closest('.alert');
	alert.removeClass('alert-warning').removeClass('alert-info').removeClass('alert-danger').removeClass('alert-success');
	alert.addClass('alert-'+type);
	$('#progress_oneword').html(content);
	$('#progress_ajax').html(ajax);
	$('#specialHeader').html(header);
	if(header != "")
		$('#specialHeader').show();
	else
		$('#specialHeader').hide();
	
	if(oldTypePopup != type) {
		if(!alert.is(':visible')) {
			alert.fadeIn();
			if(duration > 0)
				setTimeout(function() { alert.fadeOut();}, duration);
			
		}
		oldTypePopup = type;

	}
	
		
}
//set the content for the instruction menu
function setHelpContent(content) {
	$('#help-content').html(content);
}

//create/update the instruction popover
function interceptHelpLink(event) {
	$('#help-menu').popover('destroy').popover({placement:"bottom", html:true, content:$('#help-menu').find('ul').html(), trigger:"hover",delay:1500}).popover('show');

	event.preventDefault();
	event.stopPropagation();
}

//test if we are in the dashboard
function isDashboard() {
	return surveyCurrentSpecial == "r_vetting_json";
}

//handle new value submission
function addValueVote(td, tr, theRow, newValue, newButton) {
     	tr.inputTd = td; // cause the proposed item to show up in the right box
		handleWiredClick(tr,theRow,"",{value: newValue},newButton);
		setTimeout(function(){$(td).prev().click();},2000);
}

//transform input + submit button to the add button for the "add translation"
function toAddVoteButton(btn) {
	btn.className = "btn btn-primary";
	btn.title = "Add";
	btn.type = "submit";
	btn.innerHTML = '<span class="glyphicon glyphicon-plus"></span>';
	$(btn).tooltip();
	$(btn).closest('form').next('.subSpan').show();
	
	$(btn).parent().children('input, .vote-submit').remove();
}

//transform the add button to a submit + input
function toSubmitVoteButton(btn, input) {
	newBtn = document.createElement("div");
	newBtn.innerHTML = '<span class="glyphicon glyphicon-ok-circle"></span>';
	newBtn.className = "btn btn-success vote-submit";
	newBtn.title = "Submit";
	
	
	
	$(btn).parent().append(newBtn);
	$(btn).closest('form').next('.subSpan').hide();
	$(newBtn).tooltip();
	return newBtn;
}


//add some label with a tooltip to every icon 
function labelizeIcon() {
	
	var icons = [
	             {
	            	 selector:'.d-dr-approved',
	                 type:'success',
	                 text:'Approved',
	                 title:'The "Proposed" (winning) value will be in the release.'
	             },
	             {
	            	 selector:'.d-dr-contributed',
	                 type:'success',
	                 text:'Contributed',
	                 title:'The "Proposed" (winning) value will be in the release (with a slightly lower status).'
	             },
	             {
	            	 selector:'.d-dr-unconfirmed',
	                 type:'warning',
	                 text:'Unconfirmed',
	                 title:'There is a "Proposed" (winning) value, but it doesn\'t have enough votes.'
	             },
	             {
	            	 selector:'.d-dr-provisional',
	                 type:'warning',
	                 text:'Provisional',
	                 title:'There is a "Proposed" (winning) value, but it doesn\'t have enough votes.'
	             },
	             {
	            	 selector:'.d-dr-missing',
	                 type:'warning',
	                 text:'Missing',
	                 title:'There is no winning value. The inherited value will be used.'
	             },
	             {
	            	 selector:'.i-star',
	                 type:'primary',
	                 text:'Last Value',
	                 title:'The value from the last release.'
	             },
	             {
	            	 selector:'.i-vote',
	                 type:'default',
	                 text:'Voted',
	                 title:'This at least one vote for this value, but it is losing'
	             }
	             ]
	
		$.each(icons, function(index, element) {
			$(element.selector).each(function() {
				if($(this).next('.label').length !== 0)
					$(this).next().remove();
				$(this).after('<div class="label label-'+element.type+' label-icon">'+element.text+'</div>');
				$(this).next().tooltip({title:element.title});
			});		
		});
		
	

}

function initFeedBack() {
	var url = contextPath +'/feedback';
	$('#feedback > div').click(function(){
		$(this).hide();
		$(this).next().show();
		$('#feedback input').focus();
	});
	
	$('#closebutton').click(function() {
		var parent = $(this).parent();
		parent.hide();
		parent.prev().show();
		parent.prev().text('Feedback ?');
	});
	
	$('#feedback [type=submit]').click(function(event) {
		
		if($('#feedback textarea').val()) {
			$.post(url, $('#feedback form').serializeArray(),function(data) {
				$('#feedback textarea').val('');
				$('#feedback > div').text('Thank you !').show();
				$('#feedback > form').hide();
			});
		}
		event.stopPropagation();
		event.preventDefault();
		return false;
	});

}
