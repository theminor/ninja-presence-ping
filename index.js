var Presence = require('ninja-presence-base');
var wifiLocation = require('wifi_location');

module.exports = Presence;

Presence.prototype.G = 'pingpresence';
Presence.prototype.V = 0;
Presence.prototype.D = 261; //used the WIFI AP presence driver ID.... I will change this in the future
Presence.prototype.name = 'Presence - Lan Ping';

Presence.prototype.init = function() {
	//you should edit this line for devices you would like to ping.
	//this._hosts = ['192.168.96.160','192.168.96.161'];
	this._opts.hosts = this._opts.hosts || {};
	
	this._ping = require ("ping");
	
	
	
	this._opts.scanDelay = this._opts.scanDelay || 20*1000; //Default scanDelay
	this._opts.timeout = this._opts.timeout || 5*60*1000; //Default timeout
	
	this._opts.logging = this._opts.logging || true; //Logging is on by default
	
	//Print current settings.
	if (this._opts.logging) {
		this._app.log.info('Ping => Hosts: ',this._opts.hosts);
		this._app.log.info('Ping => Scan delay: '+this._opts.scanDelay);
		this._app.log.info('Ping => Timeout: '+this._opts.timeout);
	};
	
}

Presence.prototype.scan = function() {
  
  var self = this;
  if (this._opts.logging) { self._app.log.info('Ping => Start pinging hosts'); };
  for(var ip in self._opts.hosts) {
  	var host = self._opts.hosts[ip];
  	self.pingHost(host);
  	
  }
    
  //Tell the system the scan is complete
  self.scanComplete();

};

//Here we ping the host. Host is an object with a name and an ipaddress
Presence.prototype.pingHost = function(host){
	var self = this;
	if (this._opts.logging) { self._app.log.info('Ping => Ping host: ', host); };
	self._ping.sys.probe(host.ip,function(isAlive) {
  		if(isAlive) {
  			if (this._opts.logging) { self._app.log.info('Ping => ' + host.name +' is up.'); };
  			self.see({
  				name : host.name,
  				id : host.ip.replace('.','_'),
  				distance:99
  			});
  		} else {
  		
  		}
  	});
}


Presence.prototype.config = function(rpc,cb) {

  var self = this;
  
	if (!rpc) {
		var loggingToggle = (self._opts.logging)?"Turn Logging Off":"Turn Logging On"; // shows opposite of the current setting
		return cb(null,{"contents":[
			{ "type": "paragraph", "text": "Welcome to the Ping Presence driver!"},
			{ "type": "submit", "name": "General Settings", "rpc_method": "genSettings" },
			{ "type": "paragraph", "text": "Before it works you have to add some devices!"},
			{ "type": "submit", "name": "Add device to ping", "rpc_method": "addModal" },
			{ "type": "paragraph", "text": "Switch logging On/Off if you think it clutters your log file"},
			{ "type": "submit", "name": loggingToggle, "rpc_method": "toggleLogging" },
			{ "type":"close", "text":"Close"}
		]});
	}
	
	if (this._opts.logging) { self._app.log.info('Settings', rpc.method, rpc); };
	
	switch (rpc.method) {
		case 'addModal':
    		return cb(null, {
        	"contents":[
          		{ "type": "paragraph", "text":"Please enter the IP address or the hostname and a nickname of the device to be pinged"},
          		{ "type": "input_field_text", "field_name": "ip", "value": "", "label": "IP/Hostname", "placeholder": "x.x.x.x", "required": true},
          		{ "type": "input_field_text", "field_name": "name", "value": "", "label": "Name", "placeholder": "Device X", "required": true},
          		{ "type": "submit", "name": "Add", "rpc_method": "add" },
          		{ "type":"close", "text":"Cancel"}
        	]
      		});
      		
      	break;
    case 'add':
      var devOptions = {"ip": rpc.params.ip, "name": rpc.params.name}
      self._opts.hosts[rpc.params.ip] = devOptions;
      self.save();
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"Device at " + rpc.params.ip + " with options (name : " + rpc.params.name + ") will be pinged starting today."},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    case 'genSettings':
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"Set the general settings of the Ping Presence driver here according to your wishes"},
          { "type": "input_field_text", "field_name": "scanDelay", "value": (self._opts.scanDelay/1000), "label": "Scan delay in seconds", "placeholder": "20", "required": true},
          { "type": "input_field_text", "field_name": "timeout", "value": (self._opts.timeout/1000), "label": "Timeout in seconds", "placeholder": "300", "required": true},
          { "type": "submit", "name": "Save", "rpc_method": "saveSettings" },
          { "type":"close", "text":"Cancel"}
        ]
      });
      break;
  	case 'saveSettings':
      if (this._opts.logging) { self._app.log.info('New scandelay '+rpc.params.scanDelay+' and timeout '+rpc.params.timeout); };
      self._opts.scanDelay = (rpc.params.scanDelay *1000);
      self._opts.timeout = (rpc.params.timeout *1000);
      self.save();
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"New settings saved"},
          { "type":"paragraph", "text":"Scan Delay => " + rpc.params.scanDelay + " Timeout " + rpc.params.timeout},
          { "type":"paragraph", "text":"Timeout => " + rpc.params.timeout},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    case 'toggleLogging':
    	self._opts.logging = !self._opts.logging;
    	self.save();
    	var loggingToggle = (self._opts.logging)?"Ninja Presence Ping Logging is now turned On":"Ninja Presence Ping Logging is now turned Off"
    	cb(null, {
    		"contents": [
    			{ "type":"paragraph", "text":loggingToggle},
    			{ "type":"close", "text":"Close"}
    		]
    	});
    	break;
    default:
      self._app.log.error('Unknown rpc method', rpc.method, rpc);
  }
};
