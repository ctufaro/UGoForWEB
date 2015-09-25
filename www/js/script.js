//Page Module - all page events and functions
var Page = (function () {

    var loaded = false;
    var imageContainer = $('#imagecontainer');

    var initHTML = "";

    var init = function () {

        $(window).on('hashchange', function () {
            render(window.location.hash);
        });

        // Render default page
        renderSignOrLogPage();

        // Redner UI Events
        renderUIEvents();
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
            $(document).ajaxStart(function () {
                if ($(".ui-ios-overlay").length) {
                    $(".ui-ios-overlay").css("display", "block");
                }
                else {
                    //iosOverlay.js
                    createLoadingSpinner();
                }
            });

            $(document).ajaxComplete(function () {
                //$(".posts").css("display", "block");
                //$(".ui-ios-overlay").css("display", "none");
            });

            $.ajax({
                type: "GET",
                url: "http://ugoforapi.azurewebsites.net/api/posts",
                error: function (xhr, statusText) { alert("Error: " + statusText); },
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

            var success = function (status) {
                alert('Message: ' + status);
            }

            var error = function (status) {
                alert('Error: ' + status);
            }

            window.cache.clear(success, error);
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
                    "PostID": 1, "ProfilePicURL": "xxx", "SmallComment": $("#txtSmallComment").val(),
                    "TimePosted": "xxx", "PostedImage": "xxx", "BigComment": $("#txtBigComment").val(),
                    "Location": coordinates
                },
                global: false,
                error: function (xhr, error) {
                    console.debug(xhr); console.debug(error);
                },
                success: function (data) {
                    appendMe = appendMe.replace("{profileurl}", data.ProfilePicURL);
                    appendMe = appendMe.replace("{profilename}", data.Username);
                    appendMe = appendMe.replace("{littlecomment}", data.SmallComment);
                    appendMe = appendMe.replace("{day}", data.TimePosted);
                    appendMe = appendMe.replace("{foodurl}", data.PostedImage);
                    appendMe = appendMe.replace("{bigcomment}", data.BigComment);
                    $('.posts').prepend($(appendMe).hide().fadeIn(1000));
                    $('#btnCancel').trigger('click');
                    //append the newly saved post
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
    };

    return { init: init };

})();

//Phone Gap Plugins Module - all Phone Gap API calls
var PGPlugins = (function () {

    var gpscoordinates = "";
    var pictureSource;   // picture source
    var destinationType; // sets the format of returned value
    var retries = 0;

    var init = function () {

    };

    var onPGDeviceReady = function () {
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
    };

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

    //capture success
    var onPhotoDataSuccess = function (imageData) {
        var smallImage = document.getElementById('profileImage');
        smallImage.style.display = 'block';
        smallImage.src = "data:image/jpeg;base64," + imageData;
        imageUpload(smallImage.src);
    }

    //gallery success
    var onPhotoURISuccess = function (imageURI) {
        var smallImage = document.getElementById('profileImage');
        smallImage.style.display = 'block';
        smallImage.src = imageURI;
        imageUpload(imageURI);
    }

    var imageUpload = function (imageURI) {
        var win = function (r) {
            clearCache();
            retries = 0;
            alert('Done!');
            console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);
        }

        var fail = function (error) {
            if (retries == 0) {
                retries++
                setTimeout(function () {
                    onPhotoURISuccess(imageURI)
                }, 1000)
            } else {
                retries = 0;
                clearCache();
                alert("An error has occurred: Code = " + error.code);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            }
        }

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        var params = new Object();
        options.params = params;
        options.chunkedMode = false;
        var ft = new FileTransfer();
        ft.upload(imageURI, "http://localhost:26684/api/posts", win, fail, options);

    }

    var clearCache = function() {
        navigator.camera.cleanup();
    }

    //using the camera
    var capturePhoto = function (qual) {
        navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
            quality: 10, allowEdit: true,
            targetWidth: 175,
            targetHeight: 175,
            destinationType: destinationType.DATA_URL
        });
    }

    //using the gallery
    var getPhoto = function (source, qual) {
        navigator.camera.getPicture(onPhotoURISuccess, onFail, {
            quality: 10, allowEdit: true,
            targetWidth: 175,
            targetHeight: 175,
            destinationType: destinationType.FILE_URI,
            sourceType: source
        });
    }

    var onFail = function (message) {
        console.log(message);
    }
       
    var confirmPhoto = function (buttonIndex) {

        if (buttonIndex == 1) {
            getPhoto(pictureSource.PHOTOLIBRARY,10);
        }
        else if (buttonIndex == 2) {
            capturePhoto(10);
        }
        else {

        }
    };

    return { onPGDeviceReady: onPGDeviceReady, getGPSCoordinates: getGPSCoordinates, confirmPhoto: confirmPhoto };

})();

//Main Module - initializes all the modules
var Main = (function () {

    // Wait for device API libraries to load   
    $(document).ready(function () { document.addEventListener("deviceready", PGPlugins.onPGDeviceReady, false); });

    ////Main Entry point
    Page.init();

})();




