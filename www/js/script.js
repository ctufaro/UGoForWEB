/*
    Page Routing
*/
var Pages = function () {

    var Init = function () {

        //hashchange event
        $(window).on('hashchange', function () { Render(window.location.hash); });

        //Check if user is registered and a new login
        if (UserSession.IsRegistered()) {
            Feed.LoadFeed();
            Feed.Render();
        }
        else {
            SignOrLogin.Render();
        }

        Follow.LoadUsers();
        Profile.LoadProfile();
    }

    var Render = function (url) {

        Utilities.ToggleHeight(false);

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
            case '#_settings': 
                Settings.Render();
                break;
            case '#_follow':
                Follow.Render();
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
                    $(value).css('display','none');
                }
                else {
                    $(value).css('display', 'block');
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
    var pushNotification;

    var OnPGDeviceReady = function () {
        navigator.geolocation.getCurrentPosition(GPS.OnGPSSuccess, GPS.OnGPSError, { timeout: 5000 });
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
        pushNotification = window.plugins.pushNotification;
    };

    var OnPGDeviceResume = function () {
        //if coming from a notification than:
        //if its a new post, simply refresh the page
        //if its a new comment, refresh that comment

        //else check for updates, make reresh icon turn yellow?
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
            navigator.geolocation.getCurrentPosition(GPS.OnGPSSuccess, GPS.OnGPSError);
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
        var ImageUpload = function (userName) {

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
                UserSession.SetUserName(userName)
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

    var DeviceToken = function () {

        var GetDeviceId = function () {
            try {
                pushNotification.register(TokenHandler, ErrorHandler, { "badge": "true", "sound": "true", "alert": "true", "ecb": "onNotificationAPN" });
            }
            catch (e) {
            }
        }

        window.onNotificationAPN = function (e) {
            //alert('onNotificationAPN:result:1:=' + JSON.stringify(e));
            UserSession.SetPushID(e.id);
            UserSession.SetPushType(e.type);

            if (e.alert) {
                Message.Error(e.alert);
            }   

            if (e.badge) {
                pushNotification.setApplicationIconBadgeNumber(SuccessHandler, e.badge);
            }
        }

        var TokenHandler = function(result) {
            try {
                var deviceId = result;
                var userId = UserSession.GetUserID();
                $.ajax
                ({
                    type: "POST", url: Constants.RESTDevice, async: false,
                    data: {"UserId": UserSession.GetUserID(),"DeviceId": deviceId },
                    global: false,
                    error: function (xhr, error) {Message.Error(xhr + " - " + error);},
                    success: function (data) {}
                });
            }
            catch (e) {
            }
        }

        var SuccessHandler = function(result) {
        }

        var ErrorHandler = function (error) {
        }

        return {
            GetDeviceId: GetDeviceId
        }

    }();

    return { OnPGDeviceReady: OnPGDeviceReady, OnPGDeviceResume:OnPGDeviceResume, GPS: GPS, Camera: Camera, DeviceToken: DeviceToken };

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
                    PGPlugins.Camera.ImageUpload($('#signUsername').val());
                    PGPlugins.DeviceToken.GetDeviceId();
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
                        UserSession.SetUserName(userName);
                        PGPlugins.DeviceToken.GetDeviceId();
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
    var yumHTML = $('#post').html();

    var Render = function () {
        Utilities.ToggleHeight(true);
        Pages.RenderSelect("#main", Constants.FullPages);
        Pages.RenderSelect("#_feed", Constants.PartialPages)
    }

    var LoadFeed = function () {

        Utilities.Spinner(true, "Loading Feed");

        ClearFeed();

        $.ajax({
            type: "GET",
            url: Constants.RESTPosts+"/"+UserSession.GetUserID(),
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                var directive = {
                    'article': {
                        'post<-': { //for each entry in posts name the element 'post'
                            '.avatar@src': 'post.ProfilePicURL', //the dot selector, means the current node (here a LI),
                            '.avatar-profilename': 'post.Username',
                            '+.arrow_box': 'post.SmallComment',
                            '.ugslider@data-slickid': function (a) { { return a.item.PostId; } },
                            '.ugslider@class+': function (a) { if (a.item.Type == 1) { return ' ugslider-display'; } },
                            '.ugslider-slides': {
                                'pc<-post.PostComments': {
                                    '.avatar2@src': 'pc.ProfileUrl',
                                    '.responder-profilename': 'pc.Username',
                                    '.ugslider-slide@class+': function (a) { if (a.item.Username === 'ugoforadmin') { return ' ugslider-visibility'; } },
                                    '.arrow-box-responder': 'pc.Comment'
                                }
                            },
                            '.cover@src': 'post.PostedImage',
                            '.cover@class+': function (a) { if (a.item.Type == 2) { return ' ugslider-cover'; } },
                            '.day': 'post.TimePosted',                            
                            '.crave-comment@class+': function (a) { if (a.item.Type == 1) { return ' ugslider-display'; } },
                            '+.crave-count': function (a) { return Utilities.SlideArrayTally(a.item.PostComments); },
                            '.crave-icon@data-postid': function (a) { { return a.item.PostId; } },
                            '.yum-icon-img@class+': function (a) { if (a.item.Yummed === 1) { return ' yum-icon-fill-img'; } },
                            '.gross-icon-img@class+': function (a) { if (a.item.Yucked === 1) { return ' gross-icon-fill-img'; } },
                            '.share-comment@class+': function (a) { if (a.item.Type == 2) { return ' ugslider-display'; } },
                            '.share-comment-icons@data-postid': function (a) { { return a.item.PostId; } },
                            '.big-comment .comment-location': 'post.BigComment',
                            '.big-comment-yellow@data-postid': function (a) { lastLoadPost = a.item.PostId; }
                        }
                    }
                };
                $p('.posts').render(data, directive);
                $('#imagecontainer').imagesLoaded().always(function () {
                    //after all post images have loaded
                    CompleteFeed();
                });

            }
        });
    }

    var AppendYum = function (avatar, profilename, smallComment, time, mainImg, bigComment) {
        try{
            var rawHtml = yumHTML;
            rawHtml = Utilities.StripHTML(rawHtml, '<!--comments start-->', '<!--end comments-->');
            rawHtml = Utilities.StripHTML(rawHtml, '<!--crave start-->', '<!--end crave-->');
            rawHtml = '<article id="post">' + rawHtml + '</article>';
            rawHtml = rawHtml.replace('class="avatar" src=""', 'class="avatar" src="' + avatar + '"');
            rawHtml = rawHtml.replace('class="avatar-profilename">', 'class="avatar-profilename">' + profilename);
            rawHtml = rawHtml.replace('class="arrow_box">', 'class="arrow_box">' + smallComment);
            rawHtml = rawHtml.replace('class="day pull-right">', 'class="day pull-right">' + time);
            rawHtml = rawHtml.replace('<img src="img/burger.jpg" class="cover">', '<img src="' + Constants.BlobUrl + mainImg + '" class="cover">');
            rawHtml = rawHtml.replace('class="comment-location">', 'class="comment-location">' + bigComment);
            $('.posts').prepend(rawHtml);
        }
        catch(err){
            Message.Error(err.toString());
        }
    }

    var AppendCrave = function (avatar, profilename, smallComment, time, bigComment) {
        try {
            var rawHtml = yumHTML;
            rawHtml = Utilities.StripHTML(rawHtml, '<!--share-comment start-->', '<!--end share-comment-->');
            rawHtml = '<article id="post">' + rawHtml + '</article>';
            rawHtml = rawHtml.replace('class="avatar" src=""', 'class="avatar" src="' + avatar + '"');
            rawHtml = rawHtml.replace('class="avatar-profilename">', 'class="avatar-profilename">' + profilename);
            rawHtml = rawHtml.replace('class="arrow_box">', 'class="arrow_box">' + smallComment);
            rawHtml = rawHtml.replace('class="day pull-right">', 'class="day pull-right">' + time);
            rawHtml = rawHtml.replace('<img src="img/burger.jpg" class="cover">', '<img src="img/cravesmile.jpg" class="cover ugslider-cover">');
            rawHtml = rawHtml.replace('class="comment-location">', 'class="comment-location">' + bigComment);
            rawHtml = rawHtml.replace('ugslider-slides', 'slick-list draggable');
            rawHtml = rawHtml.replace('ugslider-slide', 'ugslider-slide ugslider-visibility');
            rawHtml = rawHtml.replace('cravesmile.jpg', 'craveprofile.jpg');
            $('.posts').prepend(rawHtml);
        }
        catch (err) {
            Message.Error(err.toString());
        }
    }

    var CompleteFeed = function () {
        $('.ugslider').slick({ arrows: false, dots: false, useCSS: true });
        $(".posts").css("display", "block");
        Utilities.Spinner(false, "Loading Feed");
        $('.ugslider').slick('setPosition');

        $('.ugslider').on('swipe', function (event, slick, direction) {
            var slickid = $(this).data('slickid');            
            var spanSlickCount = $("span").find("[data-slideid='" + slickid + "']");
            var spanSlickParent = $(spanSlickCount).parent();
            var total = parseInt(spanSlickParent.html().split('</span>/')[1]);
            var count = parseInt(spanSlickCount.html());
            if (direction === 'left') {
                if (count + 1 > total) {
                    count = 1;
                }
                else {
                    count = count + 1;
                }

            }
            else {
                if (count - 1 < total) {
                    count = total;
                }
                else {
                    count = count - 1;
                }
            }
            spanSlickCount.html(count);
        });

        $('.yum-icon').click(function (e) {
            var gross = $(this).closest('div').find('.gross-icon');
            var postId = $(this).closest('div').data('postid');
            $('img', gross).removeClass("gross-icon-fill-img");
            $('img', gross).addClass("gross-icon-img");

            var imgSrcVal = $('img', this).attr("class");
            if (imgSrcVal === 'yum-icon-img') {
                $('img', this).removeClass("yum-icon-fill");
                $('img', this).addClass("yum-icon-fill-img");
                ToggleYumYuck("yum", postId);

            }
            else {
                $('img', this).removeClass("yum-icon-fill-img");
                $('img', this).addClass("yum-icon-img");
                ToggleYumYuck("unyum", postId);
            }
        });

        $('.gross-icon').click(function (e) {
            var yum = $(this).closest('div').find('.yum-icon');
            var postId = $(this).closest('div').data('postid');
            $('img', yum).removeClass("yum-icon-fill-img");
            $('img', yum).addClass("yum-icon-img");

            var imgSrcVal = $('img', this).attr("class");
            if (imgSrcVal === 'gross-icon-img') {
                $('img', this).removeClass("gross-icon-fill");
                $('img', this).addClass("gross-icon-fill-img");
                ToggleYumYuck("yuck", postId);
            }
            else {
                $('img', this).removeClass("gross-icon-fill-img");
                $('img', this).addClass("gross-icon-img");
                ToggleYumYuck("unyuck", postId);
            }
        });

        //pile of shit here
        $('.crave-icon').click(function (e) {
            var postid = $(this).data("postid");
            $('.popup-modal').trigger('click');
            $('.ugopost-slick').slick('slickGoTo', 4, true);
            $('#btnCravePost').unbind().click(function (e) {

                //ajax call here
                if ($('#txtCravePost').val().length > 0) {

                    $.ajax
                    ({
                        type: "POST", url: Constants.RESTComments,
                        data: {
                            "UserId": UserSession.GetUserID(),
                            "PostID": postid, "Comment": $('#txtCravePost').val(),
                            "Location": PGPlugins.GPS.GetGPSCoordinates().length > 0 ? PGPlugins.GPS.GetGPSCoordinates() : "WEB"
                        },
                        global: false,
                        error: function (xhr, error) {
                            Message.Error(xhr + " - " + error);
                        },
                        success: function (data) { }
                    });
                }

                var slickSlider = $(".ugslider[data-slickid='" + postid + "']");

                slickSlider.on('setPosition', function (event, slick, currentSlide, nextSlide) {
                    Utilities.SmallSpinner(false, "Post", "btnCravePost");
                    $.magnificPopup.close();
                });

                var slideCount = $(slickSlider[0]).find('.slick-slide').length - 2
                slideCount++;
                var html = "<div><img class='avatar2' src='"+Profile.GetProfileImage()+"'><div class='responder-comment'><span class='responder-profilename'>"+UserSession.GetUserName()+"</span><div class='arrow-box-responder'>" + $('#txtCravePost').val() + "</div></div></div>";
                Utilities.SmallSpinner(true, "", "btnCravePost");
                slickSlider.slick('slickAdd', html);
                slickSlider.slick('slickGoTo', slideCount - 1, true);
                $('#txtCravePost').val('');
            });
        });          
    }

    var ToggleYumYuck = function (action, postId) {
        $.ajax
        ({
            type: "POST",
            url: Constants.RESTAction,
            data: {
                "UserId": UserSession.GetUserID(),
                "Action": action,
                "Value": postId
            },
            global: false,
            error: function (xhr, error) {
                Message.Error(xhr + " - " + error);
            },
            success: function (data) { }
        });
    }

    var RefreshFeed = function () {
        ClearFeed();
        LoadFeed();
    }

    var AppendFeed = function () {
        $.ajax({
            type: "GET",
            url: Constants.RESTPosts + "/" + lastLoadPost + "/0"+"/"+UserSession.GetUserID(),
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
                            '.big-comment-yellow@data-postid': function (a) { lastLoadPost = a.item.PostId; }
                        }
                    }
                };
                var compiled = $p('.post-template' + lastLoadPost).compile(directive);
                $('.posts').append(compiled(data));
                isAppended = false;
            }
        });
    }

    var ClearFeed = function () {
        $(".posts").css("display", "none");
        $(".posts").html(Constants.PostPure);
    }

    var Events = function () {
        $('.refresh-button').click(function () {
            Feed.RefreshFeed();
        });

        $('.scrollable').on('scroll', function () {
            if (!isAppended) {
                if ($(this).scrollTop() + $(this).innerHeight() >= (this.scrollHeight * .75)) {
                    //AppendFeed();
                    isAppended = true;
                }
            }
        })

    }();

    return {
        Render: Render, LoadFeed: LoadFeed, RefreshFeed: RefreshFeed, AppendYum: AppendYum, AppendCrave: AppendCrave
    }

}();

var UGoPost = function () {

    var Render = function () {

    }

    var Events = function () {
        var position;

        $('.popup-modal').magnificPopup({
            type: 'inline', preloader: false, closeOnBgClick: true, showCloseBtn: true,
            callbacks: {
                open: function () {
                    $('.ugopost-slick').slick('setPosition');
                    //document.ontouchstart = function (e) { e.preventDefault(); }                   
                },
                close: function () {
                    $('.ugopost-slick').slick('slickGoTo',1);
                    //document.ontouchstart = function (e) { return true; }
                }
            }
        });
        
        $('.ugopost-slick').slick({
            dots: false, draggable: false, arrows: false, mobileFirst: true, speed: 300, infinite: false, swipe: false, initialSlide:1
        });

        $('#btnShareYum').click(function () {
            $('#txtSmallComment').val('');
            $('#txtBigComment').val('');
            $('.ugopost-slick').slick('slickGoTo', 2);
        });

        $('#btnRaveCrave').click(function () {
            //$('.rateit').rateit('reset');
            $('#txtCrave').val('');
            $('.ugopost-slick').slick('slickGoTo', 0);
        });

        $('#btnUgoPostPrev').click(function () {
            $('.ugopost-slick').slick('slickPrev');
        });

        $('#btnUgoPostNext').click(function () {
            $('.ugopost-slick').slick('slickNext');
        });

        $('#btnUgoPostCamera').click(function () {
            PGPlugins.Camera.GetPhotoResized('#imgPhotoPost', 1, 49, false, PhotoEdit.PhotoSuccess, PhotoEdit.PhotoFail, 640, 640);
        });

        $('#btnUgoPostGallery').click(function () {
            PGPlugins.Camera.GetPhotoResized('#imgPhotoPost', 0, 49, false, PhotoEdit.PhotoSuccess, PhotoEdit.PhotoFail, 640, 640);
        });
      
        $("#btnPost").click(function () {

            var coordinates = "NULL";

            if (PGPlugins.GPS.GetGPSCoordinates().length > 0) {
                coordinates = PGPlugins.GPS.GetGPSCoordinates();
            }

            Utilities.SmallSpinner(true, "", "btnPost");

            $.ajax
            ({
                type: "POST",
                url: Constants.RESTPosts,
                async: true,
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
                    Utilities.SmallSpinner(false, "Share", "btnPost");
                    $.magnificPopup.close();
                    var photoUrl = PhotoEdit.GetGUID() + "_" + PhotoEdit.GetURI().substr(PhotoEdit.GetURI().lastIndexOf('/') + 1);
                    Feed.AppendYum(Profile.GetProfileImage(), UserSession.GetUserName(), $("#txtSmallComment").val(), '1s', photoUrl, $("#txtBigComment").val());
                    //Feed.RefreshFeed();
                    Feed.Render();
                }
            })
        });

    }();

    return { Render: Render }

}();

var RaveCrave = function () {
    var Events = function () {
       
        $('#btnCrave').click(function () {
            if ($('#txtCrave').val().length == 0) { return; }
            var craveShortText = $('#txtCrave').val();            
            var craveLongText = "NULL";
            var coordinates = "NULL";

            if (PGPlugins.GPS.GetGPSCoordinates().length > 0) {
                coordinates = PGPlugins.GPS.GetGPSCoordinates();
            }

            Utilities.SmallSpinner(true, "", "btnCrave");

            $.ajax
            ({
                type: "POST",
                url: Constants.RESTCrave,
                async: true,
                data: {
                    "UserId": UserSession.GetUserID(),
                    "CravingTextLong": craveLongText,
                    "CravingPic": "img/cravesmile.jpg",
                    "CravingTextShort": "Craving " + craveShortText,
                    "Location": coordinates,
                    "Type": "2"                    
                },
                global: false,
                error: function (xhr, error) {
                    Message.Error(xhr + " - " + error);
                },
                success: function (data) {
                    $.magnificPopup.close();
                    Utilities.SmallSpinner(false, "Crave", "btnCrave");
                    Feed.AppendCrave(Profile.GetProfileImage(), UserSession.GetUserName(), 'Craving ' + craveShortText, '1s', '&nbsp;');
                    //Feed.RefreshFeed();
                    Feed.Render();
                }
            })

        });
    }();

}();

var Profile = function () {
    var profileImageUrl = "";

    var Render = function () {
        Pages.RenderSelect("#main", Constants.FullPages);
        Pages.RenderSelect("#_profile", Constants.PartialPages);
        LoadProfileStats();
    }

    var GetProfileImage = function () {
        return profileImageUrl;
    }

    var LoadProfile = function () {
        $.ajax({
            type: "GET",
            url: Constants.RESTProfile + "/" + UserSession.GetUserID(),
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                profileImageUrl = data.ProfileUrl;
                $("#profileImagePic").attr('src', data.ProfileUrl);
                $("#profileImageData").html(data.UserName + "<span>" + data.Email + "</span>");
            }
        });        
    }

    var LoadProfileStats = function () {
        $.ajax({
            type: "GET",
            url: Constants.RESTProfile + "/stats/" + UserSession.GetUserID(),
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                var Followers;
                var Yums;
                var Yucks;
                $.each(data, function (key, value) {
                    var action = value['Action'];
                    switch (action) {
                        case "Followers":
                            $('#profileFollowerStat').html(parseInt(value['Count']));
                            break;
                        case "Yums":
                            $('#profileYumStat').html(parseInt(value['Count']));;
                            break;
                        case "Yucks":
                            $('#profileYuckStat').html(parseInt(value['Count']));
                            break;
                    }
                });
            }
        });
    }

    return {
        Render: Render, LoadProfile: LoadProfile, GetProfileImage: GetProfileImage
    }

}();

var Settings = function () {

    var Render = function () {
        Pages.RenderSelect("#_settings", Constants.PartialPages);
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

var Follow = function () {

    var Render = function () {
        Pages.RenderSelect("#_follow", Constants.PartialPages);
    }

    var LoadUsers = function () {
        $.ajax({
            type: "GET",
            url: Constants.RESTUsers+"/"+UserSession.GetUserID(),
            error: function (xhr, statusText) { Message.Error(statusText); },
            success: function (data) {
                var directive = {
                    '.follow-user': {
                        'user<-': { //for each entry in posts name the element 'post'
                            '.avatar@src': 'user.ProfileUrl',
                            '.follow-layout-profile': 'user.UserName',
                            '.follow-btn@data-profile-id': 'user.Id',
                            '.follow-btn': function (a) { var r; (a.item.Followed === 1) ? r = 'Unfollow' : r = '+Follow'; return r; }
                        }
                    }
                };
                $p('.follow-layout').render(data, directive);
                Events();
            }
        });

    }

    var ToggleFollow = function (toggle, userid) {
        var action = (toggle == true) ? "follow" : "unfollow";

        $.ajax
        ({
            type: "POST",
            url: Constants.RESTAction,
            data: {
                "UserId": UserSession.GetUserID(),
                "Action": action,
                "Value": userid
            },
            global: false,
            error: function (xhr, error) {
                Message.Error(xhr + " - " + error);
            },
            success: function (data) { }
        });
    }

    var Events = function () {
        $('.follow-btn').click(function (e) {
            var id = $(this).data('profile-id');
            var text = $(this).text();
            if (text === '+Follow') {
                ToggleFollow(true, id);
                $(this).text('Unfollow');                
            }
            else {
                ToggleFollow(false, id);
                $(this).text('+Follow');
            }
        });
    };

    return { Render: Render, LoadUsers: LoadUsers }

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
            $('.ugopost-slick').slick('slickGoTo', 2, false);
            $('.popup-modal').trigger('click');
        });

        $('#btnPhotoEditClose').click(function () {
            Feed.Render();
        });

        $('#btnPhotoProgess').click(function () {
            guid = Utilities.Guid().replace(/-/g, '');;
            PGPlugins.Camera.PostUpload(mainURI, filtername, guid);
            $('.ugopost-slick').slick('slickGoTo', 3, true);
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

    var GetURI = function () {
        return mainURI;
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

    return { Render: Render, SetURI: SetURI, PhotoSuccess: PhotoSuccess, PhotoFail: PhotoFail, GetGUID: GetGUID, GetURI: GetURI }

}();

/*
    User Session Local Storage
*/
var UserSession = function () {

    var GetUserID = function () {
        return window.localStorage.getItem("userid");
    }

    var GetUserName = function () {
        return window.localStorage.getItem("username");
    }

    var GetPushID = function () {
        return window.localStorage.getItem("pushid");
    }

    var GetPushType = function () {
        return window.localStorage.getItem("type");
    }

    var SetUserID = function (value) {
        window.localStorage.setItem("userid", value);
    }

    var SetUserName = function (value) {
        window.localStorage.setItem("username", value);
    }

    var SetPushID = function (value) {
        window.localStorage.setItem("pushid", value);
    }

    var SetPushType = function (value) {
        window.localStorage.setItem("type", value);
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

    return {
        GetUserID: GetUserID,
        SetUserID: SetUserID,
        GetUserName: GetUserName,
        SetUserName: SetUserName,
        GetPushID: GetPushID,
        SetPushID: SetPushID,
        GetPushType: GetPushType,
        SetPushType: SetPushType,
        IsRegistered: IsRegistered,
        ClearUserID: ClearUserID
    }
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

    var SmallSpinner = function (toggle, message, id) {
        var jQ = '#' + id;
        if (toggle == true) {
            $(jQ).addClass("waitSpinner");
            $(jQ).text("");
        }
        else {
            $(jQ).removeClass("waitSpinner");
            $(jQ).text(message);
        }        
    }

    var StripHTML = function (rawHtml, startText, endText) {
        var startIndex = rawHtml.indexOf(startText);
        var endIndex = rawHtml.indexOf(endText) + endText.length;
        var toBeRemoved = rawHtml.substring(startIndex, endIndex);
        return rawHtml.replace(toBeRemoved, '');
    }

    var ToggleHeight = function (toggle) {
        if (toggle == true) {
            $('.scrollable').css("height","100%");            
        }
        else {
            $('.scrollable').css("height", "");
        }
    }

    var SlideArrayTally = function (postComments) {
        var retval = "";
        if (postComments.length > 0) {
            var firstElement = postComments[0];
            if (firstElement.Id != null) {
                retval = "<span data-slideid='"+firstElement.PostId+"'>1</span>/" + postComments.length;
            }
        }
        return retval;
    }

    return {
        ClearCache: ClearCache,
        Guid: Guid,
        RegEx: RegEx,
        Spinner: Spinner,
        SmallSpinner: SmallSpinner,
        StripHTML: StripHTML,
        ToggleHeight: ToggleHeight,
        SlideArrayTally: SlideArrayTally
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
    var PostPure = $('#post').parent().html();
    var BlobUrl = "https://ugoforstore.blob.core.windows.net/ugoforphoto/";
    var RESTLogin = "http://ugoforapi.azurewebsites.net/api/login";
    var RESTPosts = "http://ugoforapi.azurewebsites.net/api/posts";
    var RESTCrave = "http://ugoforapi.azurewebsites.net/api/crave";
    var RESTComments = "http://ugoforapi.azurewebsites.net/api/comments";
    var RESTDevice = "http://ugoforapi.azurewebsites.net/api/device";
    var RESTUsers = "http://ugoforapi.azurewebsites.net/api/users";
    var RESTAction = "http://ugoforapi.azurewebsites.net/api/action";
    var RESTProfile = "http://ugoforapi.azurewebsites.net/api/profile";
    var RESTBlob = "http://ugoforapi.azurewebsites.net/blobs/upload";
    var EmailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    var SrcPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    var FullPages = ["#signOrLogin", "#signUp", "#login", "#main", "#photoedit"];
    var PartialPages = ["#_feed", "#_profile", "#_settings", "#_follow"];
    return {
        PostPure: PostPure,
        BlobUrl: BlobUrl,
        RESTLogin : RESTLogin,
        RESTPosts: RESTPosts,
        RESTComments: RESTComments,
        RESTCrave: RESTCrave,
        RESTDevice: RESTDevice,
        RESTBlob: RESTBlob,
        RESTUsers: RESTUsers,
        RESTAction: RESTAction,
        RESTProfile: RESTProfile,
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
    $(document).ready(function () {
        document.addEventListener("deviceready", PGPlugins.OnPGDeviceReady, false);
        document.addEventListener("resume", PGPlugins.OnPGDeviceResume, false);
    });

    //Zurb Stuff
    $(document).foundation({
        abide: { focus_on_invalid: false, live_validate: false, timeout: 0 },
    });

    //Fastclick load
    $(function () { FastClick.attach(document.body); });

    //Main Entry point
    Pages.Init();

})();




