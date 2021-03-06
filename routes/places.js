var api_key = require('./config').api_key
console.log(api_key);

var queryString = require('querystring');
var https = require('https');
var parameters_nearby = {
    "key": api_key,
    "location": "longitude/latitude info",
    "radius": 500,
    "rankby": "distance| prominence",
    "keyword": "a term to be matched against all content",
    "language": "",
    "minprice": "",
    "maxprice": "",
    "name": "",
    "opennow": "",
    "types": ["accounting", "airport", "amusement_park", "aquarium", "art_gallery", "atm", "bakery", "bank", "bar", "beauty_salon", "bicycle_store", "book_store", "bowling_alley", "bus_station", "cafe", "campground", "car_dealer", "car_rental", "car_repair", "car_wash", "casino", "cemetery", "church", "city_hall", "clothing_store", "convenience_store", "courthouse", "dentist", "department_store", "doctor", "electrician", "electronics_store", "embassy", "establishment", "finance", "fire_station", "florist", "food", "funeral_home", "furniture_store", "gas_station", "general_contractor", "grocery_or_supermarket", "gym", "hair_care", "hardware_store", "health", "hindu_temple", "home_goods_store", "hospital", "insurance_agency", "jewelry_store", "laundry", "lawyer", "library", "liquor_store", "local_government_office", "locksmith", "lodging", "meal_delivery", "meal_takeaway", "mosque", "movie_rental", "movie_theater", "moving_company", "museum", "night_club", "painter", "park", "parking", "pet_store", "pharmacy", "physiotherapist", "place_of_worship", "plumber", "police", "post_office", "real_estate_agency", "restaurant", "roofing_contractor", "rv_park", "school", "shoe_store", "shopping_mall", "spa", "stadium", "storage", "store", "subway_station", "synagogue", "taxi_stand", "train_station", "travel_agency", "university", "veterinary_care", "zoo"],
    "pagetoken": "",
    "zagatselected": "zagatselected",
}

var parameters_place_search = {
    "key": "application key",
    "placeid": "",
    "reference": "", //either placeid or reference
    "extension": "",
    "language": ""
}

var parameters_text_search = {
    "query": "the text string eg restaurant",
    "key": "application key",
    "location": "",
    "radius": "",
    "language": "",
    "minprice": "",
    "maxprice": "",
    "opennow": "",
    "types": "",
    "zagaselected": "",
}

var parameters_photo = {
    "photoreference": "text",
    "maxwidth": 400,
    "maxheight": 400
}

var sendGetRequest = function(url, successCallback, errorCallback) {
    if (url.indexOf('https') > -1) {
        https.get(url, function(res) {
            var data = "";
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                successCallback(data, res);

            });
        }).on('error', function(error) {
            errorCallback(error, res);
        });

    }
}
exports.nearby = function(request, response) {
    var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?{PARAMETERS}";
    var finalParameters = request.body;
    finalParameters.key = api_key;
    url = url.replace("{PARAMETERS}", queryString.stringify(finalParameters));
    console.log(url);
    var successCallback = function(data) {
        //res.setStatusCode(200);
        response.setHeader('content-type', 'application/json');
        response.send(data);
    };
    var errorCallback = function(error) {
        response.statusCode = 404;
        response.send(error);
    };
    sendGetRequest(url, successCallback, errorCallback);


}
exports.details = function(request, response) {
    var url = "https://maps.googleapis.com/maps/api/place/details/json?{PARAMETERS}";
    var finalParameters = request.body;
    finalParameters.key = api_key;
    url = url.replace("{PARAMETERS}", queryString.stringify(finalParameters));
    console.log(url);
    var successCallback = function(data) {
        //res.setStatusCode(200);
        response.setHeader('content-type', 'application/json');
        // response.send(data);
        console.log("details call fetched...");
        SendWithPhotosForPlace(data, response);
    };
    var errorCallback = function(error) {
        response.statusCode = 404;
        response.send(error);
    };
    sendGetRequest(url, successCallback, errorCallback);

}

exports.textSearch = function(request, response) {
    var url = "https://maps.googleapis.com/maps/api/place/textsearch/json?{PARAMETERS}";
    var finalParameters = request.body;
    finalParameters.key = api_key;
    url = url.replace("{PARAMETERS}", queryString.stringify(finalParameters));
    console.log(url);
    var successCallback = function(data) {
        response.setHeader('content-type', 'application/json');
        response.send(data);

    }
    var errorCallback = function(error) {
        response.statusCode = 404;
        response.send(error);
    }

    sendGetRequest(url, successCallback, errorCallback);


}
var SendWithPhotosForPlace = function(placeDetailsData, placeDetailsResponse) {
    console.log("sending with phots links");
    var url = "https://maps.googleapis.com/maps/api/place/photo?{PARAMETERS}";
    var sync_counter = 0;
    var placedata = JSON.parse(placeDetailsData);
    if (placedata.result && placedata.result.photos && Array.isArray(placedata.result.photos)) {
        placedata.result.photos.forEach(function(d, i) {
            var mUrl = url.replace('{PARAMETERS}', "photoreference=" + d.photo_reference + "&maxwidth=400" + "&key=" + api_key);
            console.log(mUrl);
            var successCallback = function(data, res) {
                sync_counter--;
                d.image_url = res.headers.location;
                console.log(d.image_url);
                if (sync_counter === 0) {
                    placeDetailsResponse.send(placedata);
                }

            }
            var failureCallback = function(error, res) {
                sync_counter--;
                if (sync_counter === 0) {
                    placeDetailsResponse.send(placedata);
                }
            }
            sync_counter++;
            sendGetRequest(mUrl, successCallback, failureCallback)
        })
    } else {
        placeDetailsResponse.send(placeDetailsData);
    }

}
exports.getPhoto = function(request, response) {
    console.log('inside get photo');
    var url = "https://maps.googleapis.com/maps/api/place/photo?{PARAMETERS}";
    var finalParameters = request.body;
    finalParameters.key = api_key;
    url = url.replace("{PARAMETERS}", queryString.stringify(finalParameters));
    console.log(url);
    var successCallback = function(data, res) {
        //console.log(res.headers);
        //response.setHeader('content-type', 'text/html');
        console.log("inside first sucess callback got location url")
        var scb = function(data, res) {
            console.log("inside second success callback got data");
            console.log(res.headers["content-type"]);
            response.setHeader('content-type', res.headers["content-type"]);
            console.log(data);
            response.send(data);
        }
        var fcb = function(error, res) {
            console.log(error);
        }
        var image_url = res.headers.location;
        console.log(image_url);
        //sendGetRequest(image_url, scb, fcb);
        response.send(image_url);
    }
    var errorCallback = function(error) {
        response.statusCode = 404;
        response.send(error);
    }

    sendGetRequest(url, successCallback, errorCallback);
}
