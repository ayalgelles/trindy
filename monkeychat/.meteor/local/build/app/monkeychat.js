Meteor.methods({
    sendchat: function (data) {
	console.log(data);
	if (this.isSimulation) {
	    
	}
	else {
	    chat(data, this.userId);
	}
    }
});

var Messages = new Meteor.Collection('messages');

if (Meteor.isClient) {

    Meteor.startup(function(){
	Meteor.subscribe("users");
	Meteor.subscribe("messages");
    });

    Template.chat.messages = function(){
	return Messages.find({});
    };
    
    Template.chat.events({
	'keypress input' : function (e) {
	    if (!Meteor.user()) {
		alert('LOGIN!');
	    }

	    if (e.keyCode === 13) {
		var data = {msg: $(e.target).val(), from: Meteor.user().services.facebook.id, to: '100001121235309'};
		$(e.target).val('');
		console.log(data);
		Messages.insert(data);
		Meteor.call('sendchat', data);
	    }
	}
    });
}


if (Meteor.isServer) {
    var require = __meteor_bootstrap__.require,
    xmpp = require('node-xmpp');                                                                                                                                                        
    var argv = process.argv; 
    
    var channels = {};

    var myChannel = function(uid) {
	console.log('my channel', uid);

	var user = Meteor.users.findOne({_id: uid});
	if (user && user.services && user.services.facebook && user.services.facebook.id) {
	    console.log('initing user', user.services.facebook.id);
	    var cl = channels['channel_' + user.services.facebook.id];
	    if (!cl) {
		console.log('from scratch');
		channels['channel_' + user.services.facebook.id] = 
		    cl =
		    new xmpp.Client({ jid: '-' + user.services.facebook.id + '@chat.facebook.com', 
				      api_key: '110200212439498', 
				      access_token: Meteor.user().services.facebook.accessToken,
				      host: 'chat.facebook.com' }); 
		
		cl.on('stanza',
		      function(stanza) {
			  if (stanza.is('message') &&
			      // Important: never reply to errors!
			      stanza.attrs.type !== 'error') {
			      var message = stanza.getChild('body') && stanza.getChild('body').getText();
			      if (message) {
				  var from = stanza.attrs.from.match(/-(\d+)@/)[1]
				  var to = stanza.attrs.to.match(/-(\d+)@/)[1]
				  
				  console.log('message >>> ', from, to, message);
				  var data = {msg: message, from: from, to: to};
				  Fiber(function () {
				      Messages.insert(data);
				  }).run();
			      }
			  }
		      });
		
		cl.addListener('error', 
			       function(e) {
				   console.error(e);
				   process.exit(1);                                                                                                                                                       
			       });
		
		
		cl.ready = function(cb) {
		    if (cl.__ready) {
			cb();
			return;
		    }

		    cl.addListener('online', 
				   function() { 
				       console.log('ONLINE!');
				       cl.__ready = true;
				       cb();
				   });
		}
	    }
	    else {
		console.log('already inited');
	    }


	}

    };

    var chat = function(data, uid) {
	var cl = myChannel(uid);

	cl.ready(function() {
	    console.log("sending", data.msg, "to", data.to);
	    cl.send(new xmpp.Element('message', 
				     { to: '-' + data.to + '@chat.facebook.com',                                                                                                   
				       type: 'chat'}).                                                                                                                             
		    c('body'). 
		    t(data.msg));                                                                                                           

	});

    };
    

    Meteor.publish("users", function() {
	console.log('publishing', this.userId);
	return Meteor.users.find({_id : this.userId});
    });

    Meteor.publish("messages", function() {
	return Messages.find();
    });

    Meteor.startup(function () {
	console.log('startup')
	// code to run on server at startup
    });
}
