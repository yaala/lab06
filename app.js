/* 	set up default constants that is to 
	be used in the rest of the app 
	*/
var config = {
    defaultZipcode: 57042,
    defaultCity: 'Madison',
    defaultState: 'SD'
}

/* 	This is the weather class that is 
	used to carry out all the weather related
	tasks like querying the API to get the
	weather info for any location. 
	
	Currently there are two methods getWOEID(zipcode) 
	and getWeatherInfo(zipcode).

	They are both implemented using jQuery Deferreds
	in order to simplyfy the callbacks.	
	*/ 
weatherClass = function() {

	/* 	Yahoo! uses need WOEID to get weather info. 
		This function converts ZIPCODE to WOEID using
		Yahoo Geo Places API
		*/
	this.getWOEID = function(zipcode) {
		var woeid = $.Deferred();
		var woeidRequest = $.ajax({
			url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.places%20where%20text%3D%22" + zipcode + "%22%20limit%201",
			success: function(data) {
				woeid.resolve($(data).find('woeid').text());
			}
		});
		return woeid.promise();
	}

	/* 	This method is used to get the weather related
		info using the WOEID. For the sake of demo, it
		currently reports
		*/		
	this.getWeatherInfo = function(woeid) {
		var weatherInfo = $.Deferred();
		var woeidRequest = $.ajax({
			url: "http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20weather.forecast%20where%20woeid%3D" + woeid,
			success: function(data) {
				var op = {};
				op.location = 	data.query.results.channel.location.city + ', ' +
								data.query.results.channel.location.region,
				op.temp 	=	data.query.results.channel.item.condition.temp + ' ' +
								data.query.results.channel.units.temperature;
				op.wind 	=	data.query.results.channel.wind.chill + ' ' +
								data.query.results.channel.units.speed;
				op.humidity =	data.query.results.channel.atmosphere.humidity;
				weatherInfo.resolve(op);
			}
		});
		return weatherInfo.promise();
	}
	
}


/*	This method is used to set the attrbites
	in the UI
	*/
function setWeatherDetails($wrapper, data) {
	$wrapper.find('.cityInfo').text(data.location);
	$wrapper.find('.wind').text(data.wind);
	$wrapper.find('.temp').text(data.temp);
	$wrapper.find('.humidity').text(data.humidity);	
	$wrapper.show();
}


/* 	initialize 
	*/
$(function(){

	/*	configure home page on init like
		adding city info to the home page 
		*/
	var $home = $('#home');
	$home.find('.cityInfo')
		.text(
			config.defaultCity + ', ' 
			+ config.defaultState 
		);

	/*	get the weather of the default location
		and update it on the home page
		*/
	var weather = new weatherClass();
	var woeid = weather.getWOEID(config.defaultZipcode);
	woeid.then(function(woeid){
		weatherInfo = weather.getWeatherInfo(woeid);		
		weatherInfo.done(function(data){
			setWeatherDetails($home, data);
		});				
	});
	
	/*	bind navigation elements in the bottom nav
		to display their respective page and hide
		other pages
		*/
	$('#nav a').click(function(){
		$('.page').hide();
		$($(this).attr('href')).show();
	});

	/*	bind the search function to search form
		once the result is obtained, add the 
		zipcode/location to the history page
		*/
	$('#search form').submit(function(e){
		e.preventDefault();
		
		var zipcode = $(this).find('#zipcodeSearch').val();
		
		if(
			zipcode.length == 5 &&
			zipcode.match(/[0-9]{5}/) != null
		) {
			var woeid = weather.getWOEID(zipcode);
			woeid.then(function(woeid){
				weatherInfo = weather.getWeatherInfo(woeid);		
				weatherInfo.done(function(data){
					setWeatherDetails($("#searchWeatherInfo"), data);
					
					var historyList = $('#history ul');
					var listItem = '<li data-zipcode="' + zipcode + '">' 
										+ data.location + ' ( ' +
										+ zipcode + ')' +
										'</li>'
					$(listItem).appendTo(historyList);
				});				
			});		
		} else {
			alert("ZipCode is Incorrect");
		}
	});	

	/*	bind the history list item to search page	
		*/
	var historyList = $('#history');
	historyList.on('click', 'li', function(){
		var zipcode = $(this).data('zipcode');
		
		var searchForm = $('#search form');
		searchForm.find('#zipcodeSearch').val(zipcode);
		searchForm.submit();
		$('a[href=#search]').click();
	});
	
});