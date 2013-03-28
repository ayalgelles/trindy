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


(function(){

    $.parse.init({
	app_id :"exDoSR5xsEpIcJqn63P3hJK1sZ5NvnpYLP3cy22Q", // <-- enter your Application Id here 
	rest_key : "AL2FCyhzMFUmZPyitSmQXt6STcJJot7ttG6BmsUw" // <--enter your REST API Key here    
    });

    var mon = {};
    $.parse.get('monitor', {limit: 1000, order: '-createdAt'}, function(r) {
	$.each(r.results, function(){
	    mon[this.vid] = 1;
	});
    });



    monitor = function(vid, tag, from) {
	var newobj = {tag: tag, vid: vid, from: (from || '')}
	if (mon[vid]) {
	    process.stdout.write('|X|' + newobj.vid);
	    return;
	}
	
	mon[vid] = 1;
	$.parse.post("monitor", newobj, function(y) {
	    process.stdout.write('|M|' + newobj.vid);
	});
    };

})();



  clean = function(s, nobrack) {
    if (nobrack) {
      return s ? s.toLowerCase().replace(/\sthe\s|\sand\s| ep$/gim,' ').replace(/part/gim,'pt')
        .replace(RegExp("[^\\p{L}a-zA-Z0-9]", 'gim'),'').replace('around', 'round').trim(' ') : '';
        
    }

    return s ? s.toLowerCase().replace(/\sthe\s|\sand\s| ep$/gim,' ').replace(/\(.*?\)/gim, '').replace(/part/gim,'pt')
      .replace(RegExp("[^\\p{L}a-zA-Z0-9]", 'gim'),'').replace('around', 'round').trim(' ') : '';
  };


fetchFromPipe = function(tracks) {
    var hash = [];
    
    var vidreadiez = [];
    //     console.log('>> in the tracks', tracks.length);
    $.each(tracks, function(trki, trk) {
	try {
	    console.log(trk);      
	    var cleantrk = clean(trk.name);
	    if (cleantrk === 'length') {
		return;
	    }

	    var vidready = $.Deferred();
	    vidreadiez.push(vidready);

	    trk.artist = trk.artist.replace(' / ', ' & ').replace(/&/gim, 'and');

	    var song = cleantrk.length > 30 ? trk.name : (trk.artist.toLowerCase() + ' ' + trk.name.toLowerCase());
	    //      	  console.log('>> in the pipes', song);
	    var req = $.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + encodeURIComponent(song) + '&safeSearch=none&orderby=relevance&max-results=15&v=2&alt=json&callback=?', function(e) {
		//	  console.log('<< in the pipes', song);
		if (!e.feed.entry || e.feed.entry.length === 0) {
		    //					   console.log('empty. resolving');
		    vidready.resolve();
		    return;
		}

		var lessgood = {};

		$.each(e.feed.entry, function(i, entry){
		    if (vidready.state() === 'resolved') {
			return;
		    }

		    var cleanYTitle = clean(entry.title.$t);
		    var cleanartist = clean(trk.artist);

		    var id = entry.id.$t.split(':').reverse()[0];
		    var vidobj = {
			from: trk.from,
			order: trki,
			id: id,
			who_shared: 'takashirgb',
			fromindie: true,
			player: 'yt',
			name: trk.name,
			artist: trk.artist,
			albums: trk.album,
			viewCount: entry.yt$statistics && entry.yt$statistics.viewCount};

		    function nogood(what, score, force) {
			var rwhat = new RegExp(what);
			if ((entry.title.$t.toLowerCase().match(rwhat) ||
			     entry.media$group.media$description.$t.toLowerCase().match(rwhat)) &&
			    !trk.name.toLowerCase().match(rwhat)) {

			    var already = lessgood[cleantrk];
			    if (!already || score > already.s || force){
				lessgood[cleantrk] = {s: score || 0, o: vidobj};   
			    }

			    /* console.log('its a ' + what, 'srch:',
			       song,
			       'you said: ',
			       cleanartist,
			       cleantrk,
			       'tube said',
			       cleanYTitle);
			       return true;*/
			}
			return false;
		    };
		    

		    var superclean = clean(entry.title.$t, true).replace(cleantrk, '')
			.replace(cleanartist, '')
			.replace('new', '')
			.replace('album', '')
			.replace('lyrics','')
			.replace('hd','')
			.replace(/\d+p/gim,'')
			.replace(clean(trk.album), '');


		    if (superclean.length > 20){
			/*console.log('too many guys', 'srch:',
		          song,
		          'you said: ',
		          cleanartist,
		          cleantrk,
		          'tube said',
		          cleanYTitle);*/
			return;

		    }

		    if (cleanYTitle.indexOf(cleantrk.replace(/s$/gim, '')) === -1) {
			/* console.log('no title.', 'srch:',
		           song,
		           'you said: ',
		           cleantrk,
		           'tube said',
		           cleanYTitle);*/
			return;
		    }

		    if (cleanYTitle.indexOf(cleanartist) === -1) {
			var nothing = true;
			$.each(entry.category,function(i, tag){
			    if (clean(tag.term).indexOf(cleanartist) !== -1){
				nothing = false;
			    }
			});
			
			if (nothing && cleantrk.length < 10) {
			    /*   console.log('no artist.', 'srch:',
				 song,
				 'you said: ',
				 cleanartist,
				 cleantrk,
				 'tube said',
				 cleanYTitle);*/
			    return;
			    
			}
		    }

                    //nogood('version')
		    if (nogood('@ the', 2) || nogood('at the', 1) || nogood('from the basement', 1) ||
			nogood('acoustic', 1) || nogood('thumbs') || nogood('concert') || nogood('explains') ||
			nogood('teaser') || nogood('session', 1) || nogood('cover') || nogood('remix') ||
			nogood('live', 1) || nogood('perform', 2) || nogood('version', 3) ||
			nogood('philhar') || nogood('\\d{1,2}[\\.-/]\\d{1,2}', 0, true)) {
			return;
		    }

		    if (entry.media$group.media$content[0].duration < 40) {
			return;
		    }


		    vidready.resolve(vidobj);
		    return;

		});

		var lesskeys = Object.keys(lessgood);
		if (vidready.state() !== 'resolved' && lesskeys.length) {
		    vidready.resolve(lessgood[lesskeys[0]].o);
		}

		vidready.resolve();   

	    });

	    $.when(req).fail(function() {
		vidready.resolve();
	    });



	    setTimeout(

		function() {
		    vidready.resolve();
		}, 5000);
	}
	catch (x) {
	    console.log('track err', x);
	}
    });
    return vidreadiez;
};

ddmmyy = function (del, d) {
  del = del || '-';
  d = d || new Date();
  var curr_date = d.getDate();
  var curr_month = d.getMonth() + 1;
  var curr_year = d.getFullYear();

  return curr_date + del + curr_month + del + curr_year;
};

parseDate = function (strd) {
  try {
    var parsed = regit(/(\d{1,2})-(\d{1,2})-(\d{4})/gi, strd);
    var d = new Date(parseInt(parsed[0]['3']), parseInt(parsed[0]['2']) - 1, parseInt(parsed[0]['1']));
    return d;
  } catch (x) {
    return 0;
  }
};


sendMessage = function (m, p) {
  var thesrc = $('#player')[0].src;
  var phash = JSON.parse(decodeURIComponent(thesrc.substr(thesrc.indexOf('#') + 1)));
  phash['message'] = m;
  phash['param'] = p;
  phash['stamp'] = (new Date()).getTime();
  var newhash = '#' + encodeURIComponent(JSON.stringify(phash));
  $('#player')[0].src = thesrc.substr(0, thesrc.indexOf('#')) + newhash
}

var params = {};
var urlz = [];

process.argv.forEach(function (val, index, array) {
  if (index < 2) {
    return;
  }
  var splt = val && val.split('=');
  if (splt) {
    if (splt.length > 1) {
   		params[splt[0]] = splt[1];
    }
    else {
      urlz.push(splt[0]);
    }
  }
});

param = function (name) {
  console.log('name=', params[name]);
  return params[name];
}

hash = {};


regit = function (re, str) {
  var arr = [];
  var match = null;
  while (match = re.exec(str)) {
    var obj = {};
    for (var grp = 1; grp < match.length; grp++) {
      obj[grp] = match[grp];
    }

    arr.push(obj);
  }
  return arr;
};


getId = function (url) {
  if (!url) {
    return null;
  }

  var resp = null;
  var regex = /^.*(?:\/|v=)(.{11})/;

  if (url.indexOf('lastWatched=') !== -1) {
    try {
      var lw = url.match(/lastWatched=([^&]*)/)[1];
      if (lw.length === 11) {
        return {
          id: lw,
          player: 'youtube_player'
        };
      }
    } catch (x) {

    }
  }

  try {
    if (url.indexOf('embed') !== -1 || url.indexOf('v=') !== -1 || url.indexOf('v/') !== -1 || url.indexOf('youtu') !== -1) {
      var id = url.match(regex)[1]; // id = 'Ahg6qcgoay4'
      resp = {
        id: id,
        player: 'youtube_player'
      };
    }

  } catch (x) {
    resp = null;
  }


  if (!resp && url.indexOf('vimeo') !== -1) {
    regex = /(?:\/|=)(\d{7,8})/;
    try {
      var id = url.match(regex)[1];
      resp = {
        id: id,
        player: 'vimeo_player'
      };
    } catch (x) {
      resp = null;
    }
  }

  return resp;
};

var feedz = [];



tag = param('tag');

getvidstomon = function(){

$.each(urlz, function (i, u) {
  var def = $.Deferred();
  feedz.push(def)


      $.get('http://www.feedly.com/search.v2/feeds.v2?q=' + encodeURIComponent(u), function (res) {

        res = JSON.parse(res);
        if (res.results && res.results.length) {
          var ents = [];
          $.each(res.results, function (i, feed) {
              console.log('got feedly feed', res.hint, feed.title);
            if (i > 6) {
              return null;
            }
            ents.push(feed.feedId.replace(/^feed\//gim, ''));
          });
          def.resolve({
            u: u,
            entries: ents
          });
        } else {
          

          $.getJSON('http://ajax.googleapis.com/ajax/services/feed/find?v=1.0&q=' + encodeURIComponent(u) + '&callback=?', function (res) {
            console.log('got query feed');
            var entries = [];
            $.each(res.responseData.entries, function (j, e) {

              entries.push(e.url);

            });
            def.resolve({
              u: u,
              entries: entries
            });


          });
        }
     
  });
});

$.when.apply($, feedz).done(function () {
  ready = [];
  $.each(arguments, function (i, arg) {
    $.each(arg.entries, function (j, feed) {
      var def = $.Deferred();
      ready.push(def);
      feed = feed.replace('feed://', 'http://');
	console.log('loading feed...', feed);
      $.getJSON('http://ajax.googleapis.com/ajax/services/feed/load?num=50&v=1.0&q=' + encodeURIComponent(feed) + '&callback=?', function (res) {
        console.log('loaded feed', feed);
        var boxes = [];
        if (!res.responseData) {
          def.resolve(undefined);
          return
        };

        $.each(res.responseData.feed.entries, function (i, e) {

          if (e.mediaGroups) {
            $.each(e.mediaGroups, function (i, mg) {
              $.each(mg.contents, function (i, ct) {
                if (!ct.player) {
                  return;
                }
                var box = getId(ct.player.url);
                if (!box) {
                  return;
                }
                box.date = ddmmyy('-', new Date(Date.parse(e.publishedDate)));
                hash[box.id] = e;
                boxes.push({
                  u: arg.u,
                  feed: feed,
                  box: box
                });
              });
            });
          }

          var vlinks = regit(/(http[s]*\:\/\/([^'"]*?(youtu|vimeo)[^'"]*?(\d{7,9}|(embed\/|v.|be\/).{11})[^'"]*?))["']/gim, e.content);
//          console.log('links in ', e.title, vlinks.length);
          if (vlinks.length) {
            $.each(vlinks, function (i, link) {
              var box = getId(link['1']);
              if (!box) {
                return;
              }
              box.date = ddmmyy('-', new Date(Date.parse(e.publishedDate)));

              hash[box.id] = e;
              boxes.push({
                u: arg.u,
                feed: feed,
                box: box
              });
            });
          }
          else {
            boxes.push({feed: feed, u: arg.u, hint: e.title});
          }
        });

        def.resolve(boxes);
      });
      setTimeout(function () {
        def.resolve(undefined);
      }, 10000);
    });
  });
  
  $.when.apply($, ready).done(function () {
    var playlist = [];
    var lastWatched = undefined;
    var all = $.map(arguments, function (a) {
      return a || null;
    });
    
     var hints = $.map(all, function (a) {
      return (a && a.hint) ? a : null;
    });
    
    var rest = $.map(all, function (a) {
      return a.box ? a : null;
    });
    
    var tracks = [];
      console.log('hints', hints.length);
    $.each(hints, function (i, box) {
	  var m =/^(stream|video|listen|listen\sto|mp3|premiere|new\smusic)*:*(.*?)[-–:][\s“"]*(.*?)[\s”"]*$/gim.exec(box.hint);
	  if (m && m[2] && m[3] && m[3].length <= 50 && m[2].length <= 50) {
	      //console.warn('MATCh!', m[2],  '<<>>', m[3] , m, box);
	      tracks.push({name: m[3], artist: m[2], from: box.feed});
	  }
	  else {
              //console.warn('NO MATCh!', box.hint);
	  }
	  
    });
      
      if (params['pipe'] == 'true') {
	  console.log('from pipe', tracks.length);
	  $.when.apply($, fetchFromPipe(tracks)).done(function(){
	      console.log('after pipe', arguments.length);
	      var rez = $.map(arguments, function(a){
		  if (a) {
		      monitor(a.id, tag, a.from)
		  }
		  return null
	      })
	      
	  });
      }

      console.log('total links', rest.length);

      $.each(rest, function (i, box) {
	  try {
	      var u = box.u;
	      var feedu = box.feed;
	      box = box.box;
	      lastWatched = lastWatched || box.id;
	      playlist.push(JSON.stringify(box));
	      
	      var e = hash[box.id];
	      var lid = 'li-' + e.title.replace(/[^\w]/gi, '');
	      monitor(box.id, tag, feedu)
	  }
	  catch(x){
	      console.log('err', x);
	  }
      });
    
  });
});
}

getvidstomon();
setInterval(getvidstomon, 1000 * 60 * 60 * 2)

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});