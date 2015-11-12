/*
    Page Routing
*/
var Pages = function () {

    var Init = function () {

        //hashchange event
        $(window).on('hashchange', function () { Render(window.location.hash); });

        //Check if user is registered and a new login
        if (UserSession.IsRegistered() && Number(UserSession.GetUserID()) > 149) {
            Feed.LoadFeed();
            Feed.Render();
        }
        else {
            SignOrLogin.Render();
        }

        //Feed.LoadFeed();
        //Feed.Render();
        //PhotoEdit.Render();
    }

    var Render = function (url) {
        switch (url.split('/')[0]) {
            case '#signOrLogin':
                SignOrLogin.Render();
                break;
            case '#signUp':
                SignUp.Render();
                break;
            case '#login':
                Login.Render();
                break;
            case '#settings':
                Settings.Render();
                break;
            case '#_feed':
                Feed.Render();
                break;
            case '#_profile':
                Profile.Render();
                break;
            default:
                //error
        }
    }

    var RenderSelect = function (page, pageArray) {
        if ($(page).css('display') == "none") {
            jQuery.each(pageArray, function (index, value) {
                if (page != value) {
                    $(value).hide();
                }
                else {
                    $(value).show();
                }
            });
        }
    }

    return { Init: Init, RenderSelect: RenderSelect };

}();

/*
    All Phonegap Components include within this section
*/
var PGPlugins = function () {

    var pictureSource;   // picture source
    var destinationType; // sets the format of returned value

    var OnPGDeviceReady = function () {
        navigator.geolocation.getCurrentPosition(GPS.OnGPSSuccess, GPS.OnGPSError);
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
    };

    var GPS = function () {

        var Coordinates = "";

        var OnGPSSuccess = function (position) {
            Coordinates = ("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
        };

        var OnGPSError = function (error) {
            Message.Error(error);
            Coordinates = "";
        };

        var GetGPSCoordinates = function () {
            return Coordinates;
        }

        return { OnGPSSuccess: OnGPSSuccess, OnGPSError: OnGPSError, GetGPSCoordinates: GetGPSCoordinates }

    }();

    var Camera = function () {

        var retries = 0;
        var mainImageURI = "";

        var OnPhotoDataSuccess = function (imageURI) {
            mainImageURI = imageURI;
            $("#profileImage").attr('src', imageURI + "?guid=" + Utilities.Guid());
        }

        //new user register profile method
        var ImageUpload = function () {

            Utilities.Spinner(true, "Registering");

            var win = function (r) {
                //Getting/Setting the new userid from the response
                Utilities.Spinner(false, "Registering");
                navigator.camera.cleanup();
                retries = 0;
                var str = JSON.stringify(eval("(" + r.response.replace(']', '').replace('[', '') + ")"));
                var userId = $.parseJSON(str).CustomData;
                Utilities.ClearCache();
                UserSession.SetUserID(userId);
                //dont like this
                Feed.LoadFeed();
                Feed.Render();
            }

            var fail = function (error) {
                if (retries == 0) {
                    retries++
                    setTimeout(function () {
                        OnPhotoDataSuccess(imageURI)
                    }, 1000)
                } else {
                    retries = 0;
                    navigator.camera.cleanup();
                    Message.Error(error.code);
                }
            }

            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = Utilities.Guid() + "_" + mainImageURI.substr(mainImageURI.lastIndexOf('/') + 1);

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

            ft.upload(mainImageURI, Constants.RESTBlob, win, fail, options);

        }

        //new post method
        var PostUpload = function (imageURI, filtername, guid) {

            var win = function (r) {
                navigator.camera.cleanup();
            }

            var fail = function (error) {
                navigator.camera.cleanup();
                Message.Error(error.code);
            }

            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = guid + "_" + imageURI.substr(imageURI.lastIndexOf('/') + 1);
            options.mimeType = "image/jpeg";
            var params = new Object();
            params['userid-' + UserSession.GetUserID()] = 'value';
            params['filtername-' + filtername] = 'value';
            params['guid-' + guid] = 'value';
            options.params = params;
            options.chunkedMode = false;
            options.headers = {
                Connection: "close"
            };
            var ft = new FileTransfer();
            ft.upload(imageURI, Constants.RESTBlob, win, fail, options);
        };

        var GetPhoto = function (source, qual, edit, successMethod) {
            var picSource = (source == 1) ? pictureSource.CAMERA : pictureSource.PHOTOLIBRARY;
            navigator.camera.getPicture(successMethod, function(message){Message.Error(message);}, {
                quality: qual,
                allowEdit: edit,
                destinationType: destinationType.FILE_URI,
                sourceType: picSource
            });
        }        

        var GetPhotoResized = function (htmlelem, source, qual, edit, successMethod, failMethod, tw, th) {
            $(htmlelem).attr('src', Constants.SrcPixel);
            var picSource = (source == 1) ? pictureSource.CAMERA : pictureSource.PHOTOLIBRARY;
            navigator.camera.getPicture(successMethod, failMethod, {
                quality: qual,
                allowEdit: edit,
                targetWidth: tw,
                targetHeight: th,
                correctOrientation: 1,
                destinationType: destinationType.FILE_URI,
                sourceType: picSource
            });            
        }

        var ConfirmPhoto = function (buttonIndex) {
            //CAMERA
            if (buttonIndex == 1) {
                GetPhoto(0, 50, true, OnPhotoDataSuccess);
            }
            //PHOTOLIBRARY
            else if (buttonIndex == 2) {
                GetPhoto(1, 50, true, OnPhotoDataSuccess);
            }
            else { }
        }

        return {
            ConfirmPhoto: ConfirmPhoto, ImageUpload: ImageUpload, GetPhoto: GetPhoto, GetPhotoResized: GetPhotoResized, PostUpload: PostUpload
        }
    }();

    return { OnPGDeviceReady: OnPGDeviceReady, GPS: GPS, Camera: Camera };

}();

/*
    All application pages
*/
var SignOrLogin = function () {

    var Render = function () {
        Pages.RenderSelect("#signOrLogin", Constants.FullPages);
    }

    return { Render: Render }

}();

var SignUp = function () {

    var Render = function () {
        Pages.RenderSelect("#signUp", Constants.FullPages);
    }

    var Events = function () {

        $("#profileImage").click(function () {
            navigator.notification.confirm(
                'from the following:',
                PGPlugins.Camera.ConfirmPhoto,
                'Select A Profile Image',
                ['Photo Gallery', 'Take a Photo', 'Cancel']
            );
        });

        $("#signUpNewUser").click(function () {
            //hack - fix this, I had to manually check this, abide sucks
            var emailValid = Utilities.RegEx(Constants.EmailRegEx, $('#signEmail').val())
            var profilePicValid = $("#profileImage").attr("src").indexOf("profilephoto.jpg") > -1
            if (profilePicValid) { $(".picerror").css("display", "block"); } else { $(".picerror").css("display", "none"); }
            if ($('#signUsername').val().length > 0 && emailValid && $('#signPassword').val().length > 0 && !profilePicValid) {
                try {
                    PGPlugins.Camera.ImageUpload();
                }
                catch (err) {
                    Message.Error(err.message);
                }
            }
        });

    }();

    return { Render: Render }

}();

var Login = function () {

    var Render = function () {
        Pages.RenderSelect("#login", Constants.FullPages);
    }

    var Events = function () {
        $('#loginUser').click(function () {
            var userName = $('#loginUsername').val();
            var password = $('#loginPassword').val();
            $.ajax
            ({
                type: "POST", url: Constants.RESTLogin, async: false,
                data: {
                    "Username": userName,
                    "Password": password
                },
                global: false,
                error: function (xhr, error) {
                    Message.Error(xhr + " - " + error);
                },
                success: function (data) {
                    var userId = parseInt(data);
                    if (userId < 0) {
                        Message.Error("Invalid Credentials, forget much?");
                    }
                    else {
                        UserSession.SetUserID(userId);
                        Profile.SetProfile();
                        Feed.LoadFeed();
                        Feed.Render();
                    }
                }
            });
        });
    }();

    return { Render: Render }
}();

var Feed = function () {

    var lastLoadPost;
    var isAppended = false;

    var Render = function () {
        Pages.RenderSelect("#main", Constants.FullPages);
        Pages.RenderSelect("#_feed", Constants.PartialPages)
    }

    var LoadFeed = function () {

        Utilities.Spinner(true, "Loading Feed");

        ClearFeed();

        $.ajax({
            type: "GET",
            url: Constants.RESTPosts,
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                var directive = {
                    'article': {
                        'post<-': { //for each entry in posts name the element 'post'
                            '.avatar@src': 'post.ProfilePicURL', //the dot selector, means the current node (here a LI),
                            '.avatar-profilename': 'post.Username',
                            '+.arrow_box': 'post.SmallComment',
                            '.ugslider@class+': function (a) { if (a.item.SmallComment.toLowerCase().indexOf('crav') > -1) { return ' post-slider'; } },
                            '.cover@src': 'post.PostedImage',
                            '.day': 'post.TimePosted',
                            '.big-comment .comment-location': 'post.BigComment',
                            '.bubble-comment@data-postid': 'post.PostId',
                            '.post-comments@id': function (a) { lastLoadPost = a.item.PostId; return 'pc' + a.item.PostId; },
                            '.post-comment': {
                                'pc<-post.PostComments': {
                                    '.post-comments-poster': 'pc.Username',
                                    '.post-comments-msg': 'pc.Comment'
                                }
                            }
                        }
                    }
                };
                $p('.posts').render(data, directive);
                $('#imagecontainer').imagesLoaded().always(function () {
                    $(".posts").css("display", "block");
                    Utilities.Spinner(false, "Loading Feed");
                    CraveSlides();
                });

            }
        });

    }

    var RefreshFeed = function () {
        ClearFeed();
        LoadFeed();
    }

    var PrependFeed = function () { }

    var CraveSlides = function () {
        $('.ugslider.post-slider').append("<img src='img/burger.jpg' class'cover'>");
        $('.post-slider').slick({ arrows: false, dots: false, useCSS: false });
        $('.post-slider').addClass('cover');
        $('.slick-list').addClass('cover');
        $('.post-slider').slick('setPosition');
    }

    var AppendFeed = function () {
        $.ajax({
            type: "GET",
            url: Constants.RESTPosts + "/" + lastLoadPost + "/0",
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                if (data.length == 0) { isAppended = false; return; }
                var directive = {
                    'article': {
                        'post<-': { //for each entry in posts name the element 'post'
                            '.avatar@src': 'post.ProfilePicURL', //the dot selector, means the current node (here a LI),
                            '.avatar-profilename': 'post.Username',
                            '+.arrow_box': 'post.SmallComment',
                            '.cover@src': 'post.PostedImage',
                            '.day': 'post.TimePosted',
                            '.big-comment .comment-location': 'post.BigComment',
                            '.bubble-comment@data-postid': 'post.PostId',
                            '.post-comments@id': function (a) { lastLoadPost = a.item.PostId; return 'pc' + a.item.PostId; },
                            '.post-comment': {
                                'pc<-post.PostComments': {
                                    '.post-comments-poster': 'pc.Username',
                                    '.post-comments-msg': 'pc.Comment'
                                }
                            }
                        }
                    }
                };
                $('body').append("<span id='post-money'><span class='post-template"+lastLoadPost+"'>" + Constants.PostPure + "</span></span>")
                var compiled = $p('.post-template' + lastLoadPost).compile(directive);
                $('.posts').append(compiled(data));
                isAppended = false;
                $("span[id=post-money]").remove();
            }
        });
    }

    var ClearFeed = function () {
        $(".posts").css("display", "none");
        $(".posts").html(Constants.PostPure);
    }

    var Comments = function () {

        var currentPost;

        var Events = function () {

            $(document).on('click','.bubble-comment',function(){
                currentPost = $(this).data('postid');
                if (!($('.postComments').length)) { $('body').append(Constants.PostComments); };
                $('#pc' + currentPost).find('.textbox-append').append($('.postComments').hide().fadeIn(1000));
                $('#txtPostComments').focus();
                $('#txtPostComments').val("");
            });

            $(document).on('click', '#btnPostComments', function () {
                var appendThis = "<div class='post-comment'><span class='post-comments-poster avatar-profilename'>ugoforchris&nbsp;</span><span class='post-comments-msg'>{0}</span></div>";
                if ($('#txtPostComments').val().length > 0) {
                    $('.postComments').css('display', 'none');

                    $.ajax
                    ({
                        type: "POST", url: Constants.RESTComments, async: false,
                        data: {
                            "UserId": UserSession.GetUserID(),
                            "PostID": currentPost, "Comment": $('#txtPostComments').val(),
                            "Location": PGPlugins.GPS.GetGPSCoordinates()
                        },
                        global: false,
                        error: function (xhr, error) {
                            Message.Error(xhr + " - " + error);
                        },
                        success: function (data) {
                            $('#pc' + currentPost).html(Constants.PostComment);
                            var directive = {
                                '.post-comment': {
                                    'pc <- PostComments': {
                                        '.post-comments-poster': 'pc.Username',
                                        '.post-comments-msg': 'pc.Comment'
                                    }
                                }
                            }
                            $p('#pc' + currentPost).render(data, directive);
                        }
                    });
                }
            });

            $(document).on('focusout', '#txtPostComments', function () {
                $('.postComments').css('display', 'none');
            });

        }();

    }();

    var Events = function () {
        $('.scrollable').pullToRefresh({
            callback: function () {
                var def = $.Deferred();

                //setTimeout(function () {
                //    def.resolve();
                //}, 3000);
                RefreshFeed();
                def.resolve();

                return def.promise();
            }
        });

        $('.scrollable').on('scroll', function () {
            if (!isAppended) {
                if ($(this).scrollTop() + $(this).innerHeight() >= (this.scrollHeight * .75)) {
                    AppendFeed();
                    isAppended = true;
                }
            }
        })

    }();

    return {
        Render: Render, LoadFeed: LoadFeed, RefreshFeed: RefreshFeed
    }

}();

var UGoFor = function () {

    var Render = function () {

    }

    var Events = function () {
        var position;

        $('.popup-modal').magnificPopup({
            type: 'inline', preloader: false, closeOnBgClick: true, showCloseBtn: false,
            callbacks: {
                open: function () {
                    $('.ugofor-slick').slick('setPosition');
                    //document.ontouchstart = function (e) { e.preventDefault(); }                   
                },
                close: function () {
                    $('.ugofor-slick').slick('slickGoTo',1);
                    //document.ontouchstart = function (e) { return true; }
                }
            }
        });
        
        $('.ugofor-slick').slick({
            dots: false, draggable: false, arrows: false, mobileFirst: true, speed: 300, infinite: false, swipe: false, initialSlide:1
        });



        $('#btnShareYum').click(function () {
            $('.ugofor-slick').slick('slickGoTo', 2);
        });

        $('#btnRaveCrave').click(function () {
            $('.rateit').rateit('reset');
            $('#txtCrave').val('');
            $('.ugofor-slick').slick('slickGoTo', 0);
        });

        $('#btnUgoForPrev').click(function () {
            $('.ugofor-slick').slick('slickPrev');
        });

        $('#btnUgoForNext').click(function () {
            $('.ugofor-slick').slick('slickNext');
        });

        $('#btnUgoForCamera').click(function () {
            PGPlugins.Camera.GetPhotoResized('#imgPhotoPost', 1, 49, false, PhotoEdit.PhotoSuccess, PhotoEdit.PhotoFail, 640, 640);
        });

        $('#btnUgoForGallery').click(function () {
            PGPlugins.Camera.GetPhotoResized('#imgPhotoPost', 0, 49, false, PhotoEdit.PhotoSuccess, PhotoEdit.PhotoFail, 640, 640);
        });
      
        $("#btnPost").click(function () {

            var coordinates = "NULL";

            if (PGPlugins.GPS.GetGPSCoordinates().length > 0) {
                coordinates = PGPlugins.GPS.GetGPSCoordinates();
            }

            $.ajax
            ({
                type: "POST",
                url: Constants.RESTPosts,
                async: false,
                data: {
                    "UserId": UserSession.GetUserID(), "PostID": 1, "ProfilePicURL": "xxx", "SmallComment": $("#txtSmallComment").val(),
                    "TimePosted": "xxx", "PostedImage": "xxx", "BigComment": $("#txtBigComment").val(), "Guid":PhotoEdit.GetGUID(),
                    "Location": coordinates
                },
                global: false,
                error: function (xhr, error) {
                    Message.Error(xhr + " - " + error);
                },
                success: function (data) {
                    $.magnificPopup.close();
                    Feed.RefreshFeed();
                    Feed.Render();
                    //var newAppend = Constants.PostHTML;
                    //newAppend = newAppend.replace("{profileurl}", data.ProfilePicURL);
                    //newAppend = newAppend.replace("{profilename}", data.Username);
                    //newAppend = newAppend.replace("{littlecomment}", data.SmallComment);
                    //newAppend = newAppend.replace("{day}", data.TimePosted);
                    //newAppend = newAppend.replace("{foodurl}", data.PostedImage);
                    //newAppend = newAppend.replace("{bigcomment}", data.BigComment);
                    //$('.posts').prepend($(newAppend).hide().fadeIn(1000));
                    //$('#btnCancel').trigger('click');
                    //$('#txtBigComment').val('');
                    //$('#txtSmallComment').val('');
                    //append the newly saved post and clear fields
                }
            })
        });

        $('#btnCrave').click(function () {
            var rating = $('.rateit-range').attr('aria-valuenow');
            $('#txtCrave').val(rating);
        });

    }();

    return { Render: Render }

}();

var Profile = function () {

    var Render = function () {
        Pages.RenderSelect("#main", Constants.FullPages);
        Pages.RenderSelect("#_profile", Constants.PartialPages);
    }

    var SetProfile = function () {
        $('#spnLoggedInUserId').text(UserSession.GetUserID());
    }

    return {
        Render: Render, SetProfile: SetProfile
    }

}();

var Settings = function () {

    var Render = function () {
        Pages.RenderSelect("#settings", Constants.FullPages);
    }

    var Events = function () {

        $("#btnSettingRefresh").click(function () {
            Feed.RefreshFeed();
        });

        $("#btnSettingCache").click(function () {
            Utilities.ClearCache();
        });

        $("#btnSettingLogout").click(function () {
            UserSession.ClearUserID();
        });

    }();

    return { Render: Render }

}();

var PhotoEdit = function () {
    var mainURI = '';
    var guid = '';

    var Render = function () {
        Pages.RenderSelect("#photoedit", Constants.FullPages);
    }

    var Events = function () {

        var filtername;

        $('#btnPhotoEditGoBack').click(function () {
            $('.ugofor-slick').slick('slickGoTo', 2, false);
            $('.popup-modal').trigger('click');
        });

        $('#btnPhotoEditClose').click(function () {
            Feed.Render();
        });

        $('#btnPhotoProgess').click(function () {
            guid = Utilities.Guid().replace(/-/g, '');;
            PGPlugins.Camera.PostUpload(mainURI, filtername, guid);
            $('.ugofor-slick').slick('slickGoTo', 4, true);
            $('.popup-modal').trigger('click');
        });

        $('.item.btnFilter').click(function () {
            filtername = ' ' + $(this).data('filter');
            $("#imgPhotoPost").removeClass();
            $('#imgPhotoPost').addClass(filtername);
        });

        $('#imgPhotoPost').click(function () {
            filtername = '';
            $("#imgPhotoPost").removeClass();
        });

    }();

    var SetURI = function (uri) {
        mainURI = uri;
    };

    var GetGUID = function () {
        return guid;
    }

    var PhotoSuccess = function (imageURI) {
        $.magnificPopup.close();
        $("#imgPhotoPost").attr('src', imageURI + "?guid=" + Utilities.Guid()).one("load", function () {
            Utilities.Spinner(false, "");
        });        
        PhotoEdit.SetURI(imageURI);
        PhotoEdit.Render();
    }

    var PhotoFail = function (message) {
        Utilities.Spinner(false, "");
        Message.Error(message);
    }

    return { Render: Render, SetURI: SetURI, PhotoSuccess: PhotoSuccess, PhotoFail: PhotoFail, GetGUID: GetGUID }

}();

/*
    User Session Local Storage
*/
var UserSession = function () {

    var GetUserID = function () {
        return window.localStorage.getItem("userid");
    }

    var SetUserID = function (value) {
        window.localStorage.setItem("userid", value);
    }

    var IsRegistered = function () {
        if (window.localStorage.getItem("userid") === null) {
            return false;
        }
        else {
            return true;
        }
    }

    var ClearUserID = function () {
        window.localStorage.clear();
    }

    return { GetUserID: GetUserID, SetUserID: SetUserID, IsRegistered: IsRegistered, ClearUserID: ClearUserID }
}();

/*
    Utilities Class
*/
var Utilities = function () {

    var ClearCache = function () {
        var success = function (status) { }
        var error = function (status) { Message.Error(status); }
        try {
            window.cache.clear(success, error);
        }
        catch (err) { }
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

    var RegEx = function (regex, value) {
        return regex.test(value);
    }

    var Spinner = function (toggle, message) {
        if (toggle == true) {
            if ($(".ui-ios-overlay").length) {
                $(".ui-ios-overlay").css("display", "block");
            }
            else {
                createLoadingSpinner();
            }
            $('.ui-ios-overlay').parent().find('.title').text(message);
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
    Message Class
*/
var Message = function () {

    var Error = function (msg) {
        navigator.notification.alert(msg, null, 'Sugar Snaps!', 'Done');
    }

    return { Error: Error }
}();

/*
    String Constants Class
*/
var Constants = function () {

    var PostHTML = '';
    var PostPure = $('#post').parent().html();
    var PostComment = $('.post-comments').html();
    var PostComments = $('.postComments')[0].outerHTML;
    //var PostPure = "<article id='post'><img class='avatar' style='float: left' src=''><div class='avatar-profilename'></div><div class='arrow_box'><span class='day pull-right'></span> </div> <img class='cover' src=''> <div class='big-comment'><div class='big-comment-yellow'><span class='comment-location'></span><span class='bubble-comment'></span></div>" + PostCommentHTML + "</div></article>";
    //var RESTLogin = "http://192.168.1.2:26684/api/login";
    //var RESTPosts = "http://192.168.1.2:26684/api/posts";
    //var RESTComments = "http://192.168.1.2:26684/api/comments";
    //var RESTBlob = "http://192.168.1.2:26684/blobs/upload";
    var RESTLogin = "http://ugoforapi.azurewebsites.net/api/login";
    var RESTPosts = "http://ugoforapi.azurewebsites.net/api/posts";
    var RESTComments = "http://ugoforapi.azurewebsites.net/api/comments";
    var RESTBlob = "http://ugoforapi.azurewebsites.net/blobs/upload";
    var EmailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    var SrcPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    var FullPages = ["#signOrLogin", "#signUp", "#login", "#main", "#settings", "#photoedit"];
    var PartialPages = ["#_feed", "#_profile"];
    return {
        PostHTML: PostHTML,
        PostPure: PostPure,
        PostComment:PostComment,
        PostComments: PostComments,
        RESTLogin : RESTLogin,
        RESTPosts: RESTPosts,
        RESTComments:RESTComments,
        RESTBlob: RESTBlob,
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

    //Zurb Stuff
    $(document).foundation({
        abide: { focus_on_invalid: false, live_validate: false, timeout: 0 },
    });

    //Fastclick load
    $(function () { FastClick.attach(document.body); });

    //Main Entry point
    Pages.Init();

})();




