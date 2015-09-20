//Handlebars
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

