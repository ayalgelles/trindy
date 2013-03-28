 var $ = require('jquery');
 var jQuery = $;

(function () {
var clog = console.log;
console.log = function() {
  var args = [].splice.call(arguments,0);
  args.splice(0, 0, (new Date()).getTime() + ' >> ');
  clog.apply(console, args);
}
})();

// parse

(function($) {

    var ns, _opts, methods, uriRgx;

    //Plugin namespace you can change this if you want..
    //i.e, ns = "db" = $.db.get/post/put/delete
    ns = "parse";

    //default opts
    _opts = {
        base: "https://api.parse.com/1/"
    };

    //public methods
    methods = {};

    //uriRgx
    uriRgx = /(users|login|files|push|requestPasswordReset)/;

    function _creds() {
        var error;

        if (_opts.app_id && _opts.rest_key) {
            return true;
        }

        error = "Missing app_id, or rest_key authentication parameters.\n" +
        "Pass these credentials to $." + ns + ".init\n" +
        "app_id = Application Id\n" +
        "rest_key = REST API Key";
        alert(error);
        $.error(error);

        return false;
    }

    function _error(jqXHR, textStatus, errorThrown) {
        $.error("$." + ns + " :" + textStatus + " " + errorThrown);
    }
    
    //TODO JSON.stringify dependency?
    function _http(method, uri, data) {
        var req;

        if (!_creds()) {
            return false;
        }


        req = {
            //data
            contentType: "application/json",
            processData: false,
            dataType: 'json',

            //action
            url: _opts.base + (uriRgx.test(uri) ? uri: "classes/" + uri),
            type: method,

            //Credentials
            //NEW! Parse.com now supports CORS...https://parse.com/docs/rest
            headers: {
                "X-Parse-Application-Id": _opts.app_id,
                "X-Parse-REST-API-Key": _opts.rest_key
            }
        };


        //if no data passed just return ajax
        if (typeof data !== 'object') {
            return $.ajax(req);
        }

        //if get request process data as application/x-www-form-urlencoded
        if (method === 'GET') {
            req.processData = true;
            //if there is a where object it needs to be stringified first.
            //no need to encodeURIComponent on data.where as $.ajax does that natively
            if (data.where && typeof data.where === 'object') {
                data.where = JSON.stringify(data.where);
            }
        }
        //otherwise stringify all data.
        else {
            data = JSON.stringify(data);
        }

        //set request data
        req.data = data;

        return $.ajax(req);
    }


    function _response(req, cb, error) {
        typeof cb === "function" && req.done(cb);
        error = typeof error === 'function' ? error : _error;
        req.fail(error); 
        return $[ns];
    }
    
    function _logger(method, uri, data){
      var str = [ "$.", ns, ".", method, "(", "\"",uri,"\""];
      data && str.push(", " + (JSON ? JSON.stringify(data) : "data") ); 
      str = str.join('')+");";
      $.publish && $.publish("parse.log", [str]);
      return str;
    }
    //exports
    methods.init = function(customOpts) {
        $.extend(_opts, typeof customOpts === 'object' ? customOpts: {}, true);
        return $[ns];
    };


    /*
    Creates $.parse.get/post/put/delete methods 
    Examples....

    $.parse.post('tasks',{ body : "Build all the things!" },function(json){
      console.log(json);
    });

  */
    $.each(['GET', 'POST', 'PUT', 'DELETE'], function(i, action) {
        var m = action.toLowerCase();

        methods[m] = function() {
            var args, uri, data, cb, req;

            args = arguments;
            
            uri = args[0];
            data = args[1];
            cb = args[2];
            error = args[3]
            
            if (typeof args[1] === 'function') {
                data = false;
                cb = args[1];
                error = args[2];
            }
            
            _logger(m, uri, data);
            
            req = _http(action, uri, data);
            
            return _response(req, cb, error);
        };

    });

    //alias methods
    $.extend(methods, {

        //@param Object data  eg.. '{"username": "cooldude6", "password": "p_n7!-e8", "phone": "415-392-0202"}'
        //@param Function optional callback
        //@param Function optional error callback
        //@return $[ns] aka $.parse
        signup: function(data, cb, error) {
            return this.post('users', data, cb, error);
        },

        //@param String username
        //@param String password
        //@param Function optional callback
        //@param Function optional error callback
        //@return $[ns] aka $.parse
        login: function(username, password, cb, error) {
            return this.get('login', { username: username, password: password }, cb, error);
        },

        //@param String email address of user
        //@param Function optional callback
        //@param Function optional error callback
        //@return $[ns] aka $.parse
        requestPasswordReset: function(email, cb, error) {
            return this.post('requestPasswordReset', { email: email }, cb, error);
        }
        
    });
    
    //attach methods to jQuery object using ns var aka 'parse'	
    $[ns] = methods;

})(jQuery);

// parse end

$.parse.init({
    app_id :"exDoSR5xsEpIcJqn63P3hJK1sZ5NvnpYLP3cy22Q", // <-- enter your Application Id here 
    rest_key : "AL2FCyhzMFUmZPyitSmQXt6STcJJot7ttG6BmsUw" // <--enter your REST API Key here    
});

trace = function(v, tag, from){
  var newobj = {trendTag: tag, 
                from: from,
  up: v.yt$rating ? parseInt(v.yt$rating.numLikes) : 0, 
  down: v.yt$rating ? parseInt(v.yt$rating.numDislikes) : 0, 
  favs: parseInt(v.yt$statistics.favoriteCount),
  views: parseInt(v.yt$statistics.viewCount),
  cat: v.media$group.media$category[0].$t,
  published: Date.parse(v.published.$t),
  vid: v.media$group.yt$videoid.$t,
  title: v.title.$t,
  rating: v.gd$rating}
  
  $.parse.post("trends", newobj, function(y) {
      process.stdout.write('M' + newobj.vid + '|')
  });
}
  
trendit = function(vid, tag, from) {
    if (already[vid]){
	process.stdout.write('X|')
	return;
    }

    already[vid] = 1;
    $.get('http://gdata.youtube.com/feeds/api/videos/' + vid + '?v=2&alt=json', function(r) {
	try {
	    trace(r.entry, tag, from)
	}
	catch(x) {
	}
    }).fail(function(){
	process.stdout.write(' *YTE' + vid + '* ')
    });
}
 
deleteq = function(cls, q, hook) {
    $.parse.get(cls, {limit: 1000, where: q}, function(x) {
	console.log('deleting', x.results.length ,'objs', 'from', cls);
	$.each(x.results, function(i,o) {
	    hook && hook(o);
	    try {
		$.parse.delete(cls + '/' + o.objectId, function(e){process.stdout.write('D' + o.objectId + ',');}, function(e){console.log('error deleting', e)})
	    }
	    catch (x) {
	    }
	});
    })
};

monitor = function() {
  var start = 0;
  console.log('monitoring...', (new Date()).getTime())
  
    // delete tubes we started monitoring X days ago (if they're relevant they'll be added again later)
    deleteq('monitor', {createdAt: {"$lt": {"__type": "Date", "iso": new Date((new Date()).setDate((new Date()).getDate() - 7))}}}, function(o){
	deleteq('trends', {vid: o.vid})
    });
  
    $.parse.get('monitor', {limit: 1000, order: '-createdAt'}, function(r) {
	var monmore = function() {
	    if (start > r.results.length) {
		clearTimeout(donext);
		return;
	    }
	    
	    console.log('chunk', start, r.results.length);
	    $.each(r.results, function(i) {
		if (i < start || i > start + 10) {
		    return;
		}
		trendit(this.vid, this.tag, this.from);
	    });
	    start += 10;
	    donext = setTimeout(monmore, 10000);
	}
	monmore();
    })
}

var already = {};

monitor();
setInterval(function(){
  already = {};
  monitor();
}, 60000 * 60 * 3 )