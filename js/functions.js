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