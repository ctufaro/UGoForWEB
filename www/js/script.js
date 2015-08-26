//http://tutorialzine.com/2015/02/single-page-app-without-a-framework/

$(function () {

    $.getJSON("http://ugoforapi.azurewebsites.net/api/posts", function (data) {
        // Get data about our products from products.json.

        // Call a function that will turn that data into HTML.
        generateAllPosts(data);

        // Manually trigger a hashchange to start the app.
        $(window).trigger('hashchange');
    });

    $(window).on('hashchange', function () {
        // On every hash change the render function is called with the new hash.
        // This is how the navigation of our app happens.
        render(window.location.hash);
    });

    function render(url) {
        // Get the keyword from the url.
        var temp = url.split('/')[0];

        var map = {

            // Sign-up page
            '': function () {
                renderSignUpPage();
            },

            //// Main page
            '#main-screen': function () {
                renderMainScreenPage();
            }
        };

        // Execute the needed function depending on the url keyword (stored in temp).
        if (map[temp]) {
            map[temp]();
        }
            // If the keyword isn't listed in the above - render the error page.
        //else {
        //    renderErrorPage();
        //}
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

    function renderSignUpPage() {
        $(".signup").show();
    }

    function renderMainScreenPage() {
        $(".signup").hide();
        $('link[rel=stylesheet][href~="css/signup.css"]').remove();
        $(".main-screen").show();
    }

    function renderSingleProductPage(index, data) {
        // Shows the Single Product Page with appropriate data.
    }

    function renderFilterResults(filters, products) {
        // Crates an object with filtered products and passes it to renderProductsPage.
        renderProductsPage(results);
    }

    function renderErrorPage() {
        // Shows the error page.
    }

    function createQueryHash(filters) {
        // Get the filters object, turn it into a string and write it into the hash.
    }

});