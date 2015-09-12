//http://tutorialzine.com/2015/02/single-page-app-without-a-framework/

var loaded = false;

$(function () {

    $(window).on('hashchange', function () {
        // On every hash change the render function is called with the new hash.
        // This is how the navigation of our app happens.
        render(window.location.hash);
    });

    $(window).trigger('hashchange');

    function render(url) {
        // Get the keyword from the url.
        switch (url.split('/')[0]) {
            case '':
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

    function renderSignOrLogPage() {
        //if remember me is checked renderMainScreenPage() else
        renderSelect("#signOrLogin");
    }

    function renderSignUpPage() {
        renderSelect("#signUp");
    }

    function renderLoginPage() {
        renderSelect("#login");
    }

    function renderMainScreenPage() {
        renderSelect("#main-screen");

        if(!loaded){
            //wire up wait calls
            wireUpWait();

            //pure template engine and ajax call
            ajaxit($('.posts').html());

            //getting users coordinates
            getLocation();

            //wiring up post pop-up, close button and post button
            wireUpPosting();

            //prevent loading twice
            loaded = true;
        }
    }

    function renderSelect(page) {
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

    function renderErrorPage() {
        // Shows the error page.
    }

});