$(function () {

    $("#btn_signup").click(function () {

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