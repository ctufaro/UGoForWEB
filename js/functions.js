var coordinates;
var savedHtml;

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
}

function showPosition(position) {
    coordinates = ("Latitude: " + position.coords.latitude +
    " Longitude: " + position.coords.longitude);
}

function ajaxit(snapHtml) {
    savedHtml = snapHtml;

    $.ajax({
        type: "GET",
        url: "http://ugoforapi.azurewebsites.net/api/posts",
        error: function (xhr, statusText) { alert("Error: " + statusText); },
        success: function (msg) { runit(msg); }
        }
    );
}

function runit(data) {
    var directive = {
        'article': {
            'post<-': { //for each entry in posts name the element 'post'
                '.avatar@src': 'post.ProfilePicURL', //the dot selector, means the current node (here a LI),
                '+.arrow_box': 'post.SmallComment',
                '.cover@src': 'post.PostedImage',
                '.day': 'post.TimePosted',
                '.big-comment p': 'post.BigComment'
            }
        }
    };
    $p('.posts').render(data, directive);
}

function sendPost(smallComment, bigComment) { //
    $.ajax
        ({
            type: "POST",
            url: "http://ugoforapi.azurewebsites.net/api/posts",
            dataType: 'Content-Type: application/json',
            async: false,
            data: {
                "PostID": 1, "ProfilePicURL": "xxx", "SmallComment": smallComment,
                "TimePosted": "xxx", "PostedImage": "xxx", "BigComment": bigComment,
                "Location": coordinates
            },
            success: function () {
                $('#btnCancel').trigger('click');
                $('.posts').html(savedHtml);
                ajaxit(savedHtml, '.posts');
            }
        })
}

function createLoadingSpinner(){
		var opts = {
		lines: 13, // The number of lines to draw
		length: 11, // The length of each line
		width: 5, // The line thickness
		radius: 17, // The radius of the inner circle
		corners: 1, // Corner roundness (0..1)
		rotate: 0, // The rotation offset
		color: '#FFF', // #rgb or #rrggbb
		speed: 1, // Rounds per second
		trail: 60, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	};
	var target = document.createElement("div");
	document.body.appendChild(target);
	var spinner = new Spinner(opts).spin(target);
	iosOverlay({
		text: "Loading",
		spinner: spinner
	});
	return false;
}


function wireUpWait(){
	$(document).ajaxStart(function(){
		if ($(".ui-ios-overlay").length) { 
			$(".ui-ios-overlay").css("display", "block");
		}
		else {
			createLoadingSpinner();	
		}		
	});

	$(document).ajaxComplete(function(){
		$(".posts").css("display", "block");
		$(".ui-ios-overlay").css("display", "none");
	});	
}

function wireUpPosting(){
	$('.popup-modal').magnificPopup({
		type: 'inline',
		preloader: false,
		focus: '#username',
		modal: true
	});
	
	$(document).on('click', '.popup-modal-dismiss', function (e) {
		e.preventDefault();
		$.magnificPopup.close();
	});
	
	$("#btnPost").click(function () {
		sendPost($("#txtSmallComment").val(),$("#txtBigComment").val());
	});  	
}