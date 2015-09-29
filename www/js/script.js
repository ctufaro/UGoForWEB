//Page Module - all page events and functions
var Page = (function () {

    var loaded = false;
    var imageContainer = $('#imagecontainer');
    var userId;

    var initHTML = "";

    var init = function () {

        //fastclick load
        $(function () { FastClick.attach(document.body); });

        //hashchange event
        $(window).on('hashchange', function () {
            render(window.location.hash);
        });

        // Render default page
        renderSignOrLogPage();

        // Render UI Events
        renderUIEvents();
    }

    var initUser = function (newUserId) {
        userId = newUserId;
    }

    var clearCache = function () {
        var success = function (status) {
            //alert('Cache Cleared!');
        }

        var error = function (status) {
            alert('Oh Snap! ' + status);
        }

        window.cache.clear(success, error);
    }

    var render = function (url) {
        // Get the keyword from the url.
        switch (url.split('/')[0]) {
            case '#signOrLogin':
                renderSignOrLogPage();
                break;
            case '#signUp':
                renderSignUpPage();
                break;
            case '#login':
                renderLoginPage();
                break;
            case '#main-screen':
                renderMainScreenPage();
                break;
            default:
                //error
        }
    }

    var renderSignOrLogPage = function () {
        //if remember me is checked renderMainScreenPage() else
        renderSelect("#signOrLogin");
    }

    var renderSignUpPage = function () {
        renderSelect("#signUp");
    }

    var renderLoginPage = function () {
        renderSelect("#login");
    }

    var renderMainScreenPage = function () {

        renderSelect("#main-screen");

        if (!loaded) {

            //wire up wait calls
            //$(document).ajaxStart(function () {
                renderSpinner("Loading Feed");
            //});

            $(document).ajaxComplete(function () {
                //$(".posts").css("display", "block");
                //$(".ui-ios-overlay").css("display", "none");
            });

            $.ajax({
                type: "GET",
                url: "http://ugoforapi.azurewebsites.net/api/posts",
                error: function (xhr, statusText) { alert("Oh Snap! " + statusText); },
                success: function (data) {
                    var directive = {
                        'article': {
                            'post<-': { //for each entry in posts name the element 'post'
                                '.avatar@src': 'post.ProfilePicURL', //the dot selector, means the current node (here a LI),
                                '.avatar-profilename': 'post.Username',
                                '+.arrow_box': 'post.SmallComment',
                                '.cover@src': 'post.PostedImage',
                                '.day': 'post.TimePosted',
                                '.big-comment p': 'post.BigComment'
                            }
                        }
                    };
                    $p('.posts').render(data, directive);                   
                    imageContainer.imagesLoaded().always(function () {
                        //http://desandro.github.io/imagesloaded/
                        $(".posts").css("display", "block");
                        $(".ui-ios-overlay").css("display", "none");
                    });
                       
                }
            });

            //prevent loading twice
            loaded = true;
        }
    }

    var renderSelect = function (page) {
        var pages = ["#signOrLogin", "#signUp", "#login", "#main-screen"];
        jQuery.each(pages, function (index, value) {
            if (page != value) {
                $(value).hide();
            }
            else {
                $(value).show();
            }
        });
    }

    var renderErrorPage = function () {
        // Shows the error page.
    }

    var renderSpinner = function (newText) {
        if ($(".ui-ios-overlay").length) {
            $(".ui-ios-overlay").css("display", "block");
        }
        else {
            //iosOverlay.js
            createLoadingSpinner();
        }

        $('.ui-ios-overlay').parent().find('.title').text(newText);
    }

    var renderUIEvents = function () {

        //do something with these
        var appendMe = "<article id='post'><img class='avatar' style='float: left' src='{profileurl}'><div class='avatar-profilename'>{profilename}</div><div class='arrow_box'>{littlecomment}<span class='day pull-right'>{day}</span> </div> <img class='cover' src='{foodurl}'> <div class='big-comment'> <p>{bigcomment}</p> <select class='post-icons' style='display: none;'> <option value='1'>Share</option> <option value='2'>Sweet</option> <option value='3'>Heart</option> </select><ul class='touchMultiSelect pull-right'><li class='noneButton '>None</li><li class='icon-share'>Share</li><li class='icon-sweet'>Sweet</li><li class='icon-heart'>Heart</li></ul> </div> </article>";
        var postsNonPure = "<article id='post'><img class='avatar' style='float: left' src=''><div class='avatar-profilename'></div><div class='arrow_box'><span class='day pull-right'></span> </div> <img class='cover' src=''> <div class='big-comment'> <p></p> <select class='post-icons' style='display: none;'> <option value='1'>Share</option> <option value='2'>Sweet</option> <option value='3'>Heart</option> </select><ul class='touchMultiSelect pull-right'><li class='noneButton '>None</li><li class='icon-share'>Share</li><li class='icon-sweet'>Sweet</li><li class='icon-heart'>Heart</li></ul> </div> </article>";

        $("#profileImage").click(function () {
            navigator.notification.confirm(
                'from the following:', 
                PGPlugins.confirmPhoto,           
                'Select A Profile Image',
                ['Photo Gallery', 'Take a Photo', 'Cancel']        
            );
        });

        $("#mainLogomage").click(function () {
            clearCache();
        });

        $('.popup-modal').magnificPopup({type: 'inline',preloader: false,focus: '#username', modal: true});

        $(".popup-modal-dismiss").click(function (e) {
            e.preventDefault();
            $.magnificPopup.close();
        });

        $("#btnPost").click(function () {

            var coordinates = "NULL";

            if (PGPlugins.getGPSCoordinates().length > 0) {
                coordinates = PGPlugins.getGPSCoordinates();
            }

            $.ajax
            ({
                type: "POST",
                url: "http://ugoforapi.azurewebsites.net/api/posts",
                async: false,
                data: {
                    "UserId": userId, "PostID": 1, "ProfilePicURL": "xxx", "SmallComment": $("#txtSmallComment").val(),
                    "TimePosted": "xxx", "PostedImage": "xxx", "BigComment": $("#txtBigComment").val(),
                    "Location": coordinates
                },
                global: false,
                error: function (xhr, error) {
                    console.debug(xhr); console.debug(error);
                },
                success: function (data) {
                    var newAppend = appendMe
                    newAppend = newAppend.replace("{profileurl}", data.ProfilePicURL);
                    newAppend = newAppend.replace("{profilename}", data.Username);
                    newAppend = newAppend.replace("{littlecomment}", data.SmallComment);
                    newAppend = newAppend.replace("{day}", data.TimePosted);
                    newAppend = newAppend.replace("{foodurl}", data.PostedImage);
                    newAppend = newAppend.replace("{bigcomment}", data.BigComment);
                    $('.posts').prepend($(newAppend).hide().fadeIn(1000));
                    $('#btnCancel').trigger('click');
                    $('#txtBigComment').val('');
                    $('#txtSmallComment').val('');
                    //append the newly saved post and clear fields
                }
            })
        });

        $("#btnRefresh").click(function () {
            $(".posts").css("display", "none");
            $(".posts").html(postsNonPure);
            loaded = false;
            renderMainScreenPage();
            console.log("loaded");
        });

        $("#signUpNewUser").click(function () {
            //hack - fix this, I had to manually check this, abide sucks
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            var emailValid = re.test($('#signEmail').val());
            if ($('#signUsername').val().length > 0 && emailValid && $('#signPassword').val().length > 0) {
                try{
                    PGPlugins.imageUpload();
                }
                catch (err) {
                    alert("Oh Snap! " +err.message);
                }
            }
        });
    };

    return { init: init, renderSpinner: renderSpinner, renderMainScreenPage: renderMainScreenPage, initUser: initUser, clearCache: clearCache };

})();

//Phone Gap Plugins Module - all Phone Gap API calls
var PGPlugins = (function () {

    var gpscoordinates = "";
    var pictureSource;   // picture source
    var destinationType; // sets the format of returned value
    var retries = 0;
    var mainImageURI = "";

    var init = function () {

    };

    var onPGDeviceReady = function () {
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
    };

    //GPS METHODS
    var getGPSCoordinates = function () {
        return gpscoordinates;
    };

    var onGPSSuccess = function (position) {
        gpscoordinates = ("Latitude: " + position.coords.latitude +
        " Longitude: " + position.coords.longitude);
    };

    var onGPSError = function (error){
        gpscoordinates = "";
    };

    //CAMERA METHODS
    var onPhotoDataSuccess = function (imageURI) {
        var smallImage = document.getElementById('profileImage');
        smallImage.style.display = 'block';
        mainImageURI = imageURI;
        smallImage.src = imageURI + "?guid=" + guid();
    }

    //main upload method
    var imageUpload = function () {

        Page.renderSpinner("Registering");

        var win = function (r) {
            //Getting the new userid from the response
            $(".ui-ios-overlay").css("display", "none");
            navigator.camera.cleanup();
            retries = 0;
            console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);
            var str = JSON.stringify(eval("(" + r.response.replace(']', '').replace('[', '') + ")"));
            var userId = $.parseJSON(str).CustomData;
            Page.clearCache();
            Page.initUser(userId);
            Page.renderMainScreenPage();
        }

        var fail = function (error) {
            if (retries == 0) {
                retries++
                setTimeout(function () {
                    onPhotoDataSuccess(imageURI)
                }, 1000)
            } else {
                retries = 0;
                navigator.camera.cleanup();
                alert("Oh Snap! Code = " + error.code);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            }
        }

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = guid() + "_" + mainImageURI.substr(mainImageURI.lastIndexOf('/') + 1);

        options.mimeType = "image/jpeg";
        var params = new Object();
        params['uname-' + $('#signUsername').val()] = 'value';
        params['email-' + $('#signEmail').val()] = 'value';
        params['pass-' + $('#signPassword').val()] = 'value';
        options.params = params;
        options.chunkedMode = false;
        options.headers = {
            Connection: "close"
        };
        var ft = new FileTransfer();

        //ft.upload(mainImageURI, "http://192.168.1.2:26684/blobs/upload", win, fail, options);
        ft.upload(mainImageURI, "http://ugoforapi.azurewebsites.net/blobs/upload", win, fail, options);

    }

    var getPhoto = function (source, qual) {
        navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
            quality: qual, allowEdit: true,
            //targetWidth: 175,
            //targetHeight: 175,
            destinationType: destinationType.FILE_URI,
            sourceType: source
        });
    }

    var onFail = function (message) {
        console.log(message);
    }
       
    var confirmPhoto = function (buttonIndex) {

        if (buttonIndex == 1) {
            getPhoto(pictureSource.PHOTOLIBRARY, 50);
        }
        else if (buttonIndex == 2) {
            getPhoto(pictureSource.CAMERA, 50);
        }
        else {}
    };

    var guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
    }

    return { onPGDeviceReady: onPGDeviceReady, getGPSCoordinates: getGPSCoordinates, confirmPhoto: confirmPhoto, imageUpload: imageUpload };

})();

//Main Module - initializes all the modules
var Main = (function () {

    // Wait for device API libraries to load   
    $(document).ready(function () { document.addEventListener("deviceready", PGPlugins.onPGDeviceReady, false); });

    ////Main Entry point
    Page.init();

})();




