var coordinates;
var savedHtml;
var pictureSource;  
var destinationType;

function onDeviceReady() {
    pictureSource = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;
}

function onPhotoDataSuccess(imageData) {
    var smallImage = document.getElementById('profileImage');
    smallImage.style.display = 'block';
    smallImage.src = "data:image/jpeg;base64," + imageData;
}

function onPhotoURISuccess(imageURI) {
    //var largeImage = document.getElementById('largeImage');
    //largeImage.style.display = 'block';
    //largeImage.src = imageURI;
}

function capturePhoto() {
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
        quality: 50,
        destinationType: destinationType.DATA_URL
    });
}


function capturePhotoEdit() {
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
        quality: 20, allowEdit: true,
        destinationType: destinationType.DATA_URL
    });
}

function getPhoto(source) {
    navigator.camera.getPicture(onPhotoURISuccess, onFail, {
        quality: 50,
        destinationType: destinationType.FILE_URI,
        sourceType: source
    });
}

function onFail(message) {
    alert('Failed because: ' + message);
}


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
	else {
		coordinates = "";
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

function wireUpControlEvents() {
    $("#profileImage").click(function () {
        testShareSheet();
    });
}

function generateAllPosts(data) {

    // This function is called only once on page load.
    // Grab the template script
    var theTemplateScript = $("#posts-template").html();

    // Compile the template
    var theTemplate = Handlebars.compile(theTemplateScript);

    // Pass our data to the template
    var theCompiledHtml = theTemplate(data);

    $('#allposts').html(theCompiledHtml);

}


var callback = function (buttonIndex) {
    setTimeout(function () {
        alert('button index clicked: ' + buttonIndex);
    });
};
function testShareSheet() {
    var options = {
        'title': 'Where do you want to take the picture from?',
        'buttonLabels': ['Camera', 'Photo Library'],
        'addCancelButtonWithLabel': 'Cancel',
        'androidEnableCancelButton': true,
        'winphoneEnableCancelButton': true
    };
    window.plugins.actionsheet.show(options, callback);
}
