$(function () {

    $("#btn_signup").click(function () {

        $('link[rel=stylesheet][href~="css/signup.css"]').remove();
        $("#div_signup").hide();
        $("#feed").show();

        //wire up wait calls
        wireUpWait();

        //pure template engine and ajax call
        ajaxit($('.posts').html());

        //getting users coordinates
        getLocation();

        //wiring up post pop-up, close button and post button
        wireUpPosting();
    });

});