/*
    Page Routing
*/
var Pages = function () {
    
    var Init = function () {        

        //hashchange event
        $(window).on('hashchange', function () { Render(window.location.hash); });

        // Render default page
        SignOrLogin.Render();
        
    }

    var Render = function (url) {
        switch (url.split('/')[0]) {
            case '#signOrLogin':
                SignOrLogin.Render();
                break;
            case '#signUp':
                SignUP.Render();
                break;
            case '#login':
                Login.Render();
                break;
            case '#feed':
                Feed.Render();
                Feed.LoadFeed();
                break;
            case '#yum':
                Yum.Render();
                break;
            case '#ugofor':
                UGoFor.Render();
                break;
            case '#follow':
                Follow.Render();
                break;
            case '#settings':
                Settings.Render();
                break;
            default:
                //error
        }
    }

    var RenderSelect = function (page) {
        jQuery.each(Constants.FullPages, function (index, value) {
            if (page != value) {
                $(value).hide();
            }
            else {
                $(value).show();
            }
        });
    }

    return { Init: Init, RenderSelect: RenderSelect };

}();

/*
    All Phonegap Components include within this section
*/
var PGPlugins = function () {

    var OnPGDeviceReady = function () {
        navigator.geolocation.getCurrentPosition(GPS.OnGPSSuccess, GPS.OnGPSError);
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
    };

    var GPS = function () {

        var Coordinates = "";

        var OnGPSSuccess = function (position) {
            gpscoordinates = ("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
        };

        var OnGPSError = function (error) {
            alert(error);
            Coordinates = "";
        };

        return { OnGPSSuccess: OnGPSSuccess, OnGPSError: OnGPSError, Coordinates: Coordinates }

    }();

    var Camera = function () {

        var pictureSource;   // picture source
        var destinationType; // sets the format of returned value
        var retries = 0;
        var mainImageURI = "";
        var onPhotoDataSuccess = function (imageURI) {
            var smallImage = document.getElementById('profileImage');
            smallImage.style.display = 'block';
            mainImageURI = imageURI;
            smallImage.src = imageURI + "?guid=" + guid();
        }

        //main upload method
        var imageUpload = function () {

            Pages.renderSpinner("Registering");

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
                Pages.clearCache();
                Pages.initUser(userId);
                Pages.renderMainScreenPage();
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

        var takePhoto = function (qual, htmlElem) {
            $('#imgYum').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
            navigator.camera.getPicture(function (imageURI) {
                Pages.renderYumPage();
                var smallImage = document.getElementById(htmlElem);
                smallImage.style.display = 'block';
                mainImageURI = imageURI;
                smallImage.src = imageURI + "?guid=" + guid();
            }, onFail, {
                quality: qual,
                destinationType: destinationType.FILE_URI,
                sourceType: pictureSource.CAMERA
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
            else { }
        };

        return {
            confirmPhoto: confirmPhoto, imageUpload: imageUpload, takePhoto: takePhoto
        }
    }

    return { OnPGDeviceReady: OnPGDeviceReady, GPS: GPS, Camera : Camera}; 

}();

/*
    All application pages
*/
var SignOrLogin = function () {

    var Render = function () {
        Pages.RenderSelect("#signOrLogin");
    }

    return { Render: Render }

}();

var SignUp = function () {

    var Render = function () {
        Pages.RenderSelect("#signUp");
    }

    var Events = function () {

        $("#profileImage").click(function () {
            navigator.notification.confirm(
                'from the following:',
                PGPlugins.confirmPhoto,
                'Select A Profile Image',
                ['Photo Gallery', 'Take a Photo', 'Cancel']
            );
        });

        $("#signUpNewUser").click(function () {
            //hack - fix this, I had to manually check this, abide sucks
            var emailValid = Utilities.RegEx(Constants.EmailRegEx, $('#signEmail').val())            
            if ($('#signUsername').val().length > 0 && emailValid && $('#signPassword').val().length > 0) {
                try {
                    PGPlugins.imageUpload();
                }
                catch (err) {
                    alert("Oh Snap! " + err.message);
                }
            }
        });

    }();

    return { Render: Render }

}();

var Login = function () {
    var Render = function () {
        Pages.RenderSelect("#login");
    }
    return { Render: Render }
}();

var Feed = function () {

    var loaded = false;

    var Render = function () {
        Pages.RenderSelect("#feed");
    }

    var LoadFeed = function () {
        if (!loaded) {

            Utilities.Spinner(true, "Loading Feed");

            $.ajax({
                type: "GET",
                url: Constants.RESTGet,
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
                        $(".posts").css("display", "block");
                        Utilities.Spinner(false, "Loading Feed");
                    });
                }
            });

            //prevent loading twice
            loaded = true;
        }
    }

    return { Render: Render, LoadFeed: LoadFeed
    }

}();

var Yum = function () {

    var Render = function () {
        Pages.RenderSelect("#yum");
    }

    var Events = function () {
        $("#btnYum").click(function () {
            PGPlugins.takePhoto(40, 'imgYum');
        });
    }();

    return { Render: Render }
}();

var UGoFor = function () {

    var Render = function () {
        Pages.RenderSelect("#ugofor");
    }

    var Events = function () {

        $('.popup-modal').magnificPopup({ type: 'inline', preloader: false, focus: '#username', modal: true });

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

    }();

    return { Render: Render }

}();

var Follow = function () {
    var Render = function () {
        Pages.RenderSelect("#follow");
    }
    return { Render: Render }
}();

var Profile = function () {
    var Render = function () {
        Pages.RenderSelect("#profile");
    }
    return { Render: Render }
}();

var Settings = function () {

    var Render = function () {
        Pages.RenderSelect("#settings");
    }

    var Events = function () {

        $("#btnSettingRefresh").click(function () {
            $(".posts").css("display", "none");
            $(".posts").html(postsNonPure);
            loaded = false;
            renderMainScreenPage();
            console.log("loaded");
        });

        $("#btnSettingCache").click(function () {
            Utilities.ClearCache();
        });

    }();

    return { Render: Render }

}();

/*
    User Session Local Storage
*/
var UserSession = function () {
    var GetUserID = function () {

    }
    var SetUserID = function () {

    }
    return { GetUserID: GetUserID, SetUserID: SetUserID }
}();

/*
    Utilities Class
*/
var Utilities = function () {

    var ClearCache = function () {
        var success = function (status) {alert('Cache Cleared!');}
        var error = function (status) {alert('Oh Snap! ' + status);}
        window.cache.clear(success, error);
    }

    var Guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
    }

    var RegEx = function (regex,value) {
        return regex.test(value);
    }

    var Spinner = function (toggle, message) {
        if(toggle==true){
            if ($(".ui-ios-overlay").length) {
                $(".ui-ios-overlay").css("display", "block");
            }
            else {
                createLoadingSpinner();
            }
            $('.ui-ios-overlay').parent().find('.title').text(newText);
        }
        else {
            $(".ui-ios-overlay").css("display", "none");
        }

    }

    return {
        ClearCache: ClearCache,
        Guid: Guid,
        RegEx: RegEx,
        Spinner: Spinner
    }
}();

/*
    String Constants Class
*/
var Constants = function () {
    var PostHTML = "<article id='post'><img class='avatar' style='float: left' src='{profileurl}'><div class='avatar-profilename'>{profilename}</div><div class='arrow_box'>{littlecomment}<span class='day pull-right'>{day}</span> </div> <img class='cover' src='{foodurl}'> <div class='big-comment'> <p>{bigcomment}</p> <select class='post-icons' style='display: none;'> <option value='1'>Share</option> <option value='2'>Sweet</option> <option value='3'>Heart</option> </select><ul class='touchMultiSelect pull-right'><li class='noneButton '>None</li><li class='icon-share'>Share</li><li class='icon-sweet'>Sweet</li><li class='icon-heart'>Heart</li></ul> </div> </article>";
    var PostPure = "<article id='post'><img class='avatar' style='float: left' src=''><div class='avatar-profilename'></div><div class='arrow_box'><span class='day pull-right'></span> </div> <img class='cover' src=''> <div class='big-comment'> <p></p> <select class='post-icons' style='display: none;'> <option value='1'>Share</option> <option value='2'>Sweet</option> <option value='3'>Heart</option> </select><ul class='touchMultiSelect pull-right'><li class='noneButton '>None</li><li class='icon-share'>Share</li><li class='icon-sweet'>Sweet</li><li class='icon-heart'>Heart</li></ul> </div> </article>";
    var RESTGet = "http://ugoforapi.azurewebsites.net/api/posts";
    var RESTPost = "http://ugoforapi.azurewebsites.net/blobs/upload";
    var EmailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    var SrcPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    var FullPages = ["#signOrLogin", "#signUp", "#login", "#main-screen", "#settings-screen", "#yum-screen"];
    return {
        PostHTML: PostHTML,
        PostPure: PostPure,
        RESTGet: RESTGet,
        RESTPost: RESTPost,
        EmailRegEx: EmailRegEx,
        SrcPixel: SrcPixel,
        FullPages: FullPages,
        PartialPages: PartialPages
    }
}();

/*
    Main Application Entry Point
*/
var Main = (function () {

    //Wait for device API libraries to load   
    $(document).ready(function () { document.addEventListener("deviceready", PGPlugins.OnPGDeviceReady, false); });

    //Fastclick load
    $(function () { FastClick.attach(document.body); });

    //Main Entry point
    Pages.Init();

})();




