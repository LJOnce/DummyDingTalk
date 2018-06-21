!(function() {var require, define;

(function() {
  var modules = {};
  var requireStack = [];
  var inProgressModules = {};

  function build(module) {
    var factory = module.factory;
    module.exports = {};
    delete module.factory;
    factory(require, module.exports, module);
    return module.exports;
  }

  require = function(id) {
    if (!modules[id]) {
      throw 'module ' + id + ' not found';
    } else if (id in inProgressModules) {
      var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
      throw 'Cycle in require graph: ' + cycle;
    }
    if (modules[id].factory) {
      try {
        inProgressModules[id] = requireStack.length;
        requireStack.push(id);
        return build(modules[id]);
      } finally {
        delete inProgressModules[id];
        requireStack.pop();
      }
    }
    return modules[id].exports;
  };

  define = function(id, factory) {
    if (modules[id]) {
      throw 'module ' + id + ' already defined';
    }

    modules[id] = {
      id: id,
      factory: factory
    };
  };

  define.remove = function(id) {
    delete modules[id];
  };
})();

define('callback', function(require, exports, module) {

});

define('exec', function(require, exports, module) {
var exec = function(plugin, action, args, win, fail, context) {
	if (!window._WebViewJavascriptBridge) {
		throw "runtime and bridge are not ready";
	}

	window._WebViewJavascriptBridge.callHandler('exec', {
		plugin : plugin,
		action : action,
		args : args
	}, function(response) {
		if (typeof response != "undefined") {
			if ('0' === response.errorCode) {
                  win && win.call(context, response);
            }
            else {
                 fail && fail.call(context, response);
            }
         }
         else {
            fail && fail.call('-1', "");
         }

	});
};

module.exports = exec;
});

define('event', function(require, exports, module) {
function NativeEvent(c, d) {
  this.defaultAction = d;
  this.cancelable = (c !== undefined) ? c : false;
  this.handlers = [];
}

function Channel(name) {
  this.name = name;
  this.fired = false;
  this.message = null;
  this.handlers = [];
}

var nativeEvents = {};

var channels = {};

var _addEventListener = document.addEventListener;
var _removeEventListener = document.removeEventListener;

nativeEvents['resume'] = new NativeEvent();
nativeEvents['pause'] = new NativeEvent();
nativeEvents['online'] = new NativeEvent();
nativeEvents['offline'] = new NativeEvent();
nativeEvents['backbutton'] = new NativeEvent(true, function() {
  require('biz.navigation').back();
});
nativeEvents['pullToRefresh'] = new NativeEvent(true, function() {
  require('biz.navigation').reload();
});
nativeEvents['navTitle'] = new NativeEvent();
nativeEvents['deviceOrientationChanged'] = new NativeEvent();

document.addEventListener = function(type, listener, useCapture) {
  if (nativeEvents.hasOwnProperty(type)) {
    nativeEvents[type].handlers.push(listener);

    if ('backbutton' === type) {
      require('nuva').runtime._interceptBackButton();
    }

    if ('navTitle' === type) {
      require('nuva').runtime._interceptNavTitle();
    }
  } else {
    _addEventListener.call(document, type, listener, useCapture);
  }
};

document.removeEventListener = function(type, listener, useCapture) {
  if (nativeEvents.hasOwnProperty(type)) {
    var listeners = nativeEvents[type].handlers;
    var swap = [];
    nativeEvents[type].handlers.forEach(function(l) {
      if (l !== listener) {
        swap.push(l);
      }
    });

    if (swap.length === 0)
    {
      /* For iOS 注销监听状态栏点击事件 */
      if ('navTitle' === type) {
        require('nuva').runtime._recoverNavTitle();
      }
    }

    nativeEvents[type].handlers = swap;
  } else {
    _removeEventListener.call(document, type, listener, useCapture);
  }
};


var event = {
  dispatch : function(eventType, data) {
    var nativeEvent = nativeEvents[eventType];
    var handlers = nativeEvent.handlers;
    if (handlers) {
      handlers.forEach(function(handler) {
        var event = document.createEvent('Events');
        event.initEvent(eventType, false, true);
        event.detail = data;

        var _preventDefault = event.preventDefault;
        event._nativeDefaultPrevented = false;
        event.preventDefault = function() {
          _preventDefault.call(this);
          this._nativeDefaultPrevented = true;
        };
        handler.call(document, event);
        if (!nativeEvent.cancelable || !event._nativeDefaultPrevented) {
          var defaultAction = nativeEvents[eventType].defaultAction;
          if (defaultAction !== undefined) {
            defaultAction.call(window, event);
          }
        }
      });
    }
  },

  _publish : function(name, message) {
    if (!channels[name]) {
      channels[name] = new Channel(name);
    }
    var channel = channels[name];
    channel.fired = true;

    var handlers = channel.handlers;
    if (handlers) {
    	for (var i = 0; i < handlers.length; i++) {
      		handlers[i](message);
    	}
	}
  },

  _subscribe : function(name, handler) {
    if (!channels[name]) {
      channels[name] = new Channel(name);
    }
    var channel = channels[name];
    if (channel.fired) {
      handler(channel.message);
    }
    else {
      channel.handlers.push(handler);
    }
  },

  _subscribeOnce : function(name, handler) {
    var event = require('event');
    event._subscribe(name, function(message) {
      event._unsubscribe(name, handler);
      handler(message);
    });
  },

  _unsubscribe : function(name, handler) {
    if (channels[name]) {
      var handlers = channels[name].handlers;
      var swap = [];
      for (var i in handlers) {
        if (handlers[i] === handler) {
          continue;
        }
        swap.push(handlers[i]);
      }
      channels[name].handlers = swap;
    }
  }
};

module.exports = event;
});

define('networks', function(require, exports, module) {
document.addEventListener('online', function(event) {
  var info = event.data;
  window.navigator.online = info.online;
  conn.networkType = info.type;
});

document.addEventListener('offline', function() {
  window.navigator.online = false;
  conn.networkType = conn.NONE;
});

require('device.network').get({
	onSuccess: function(info) {
	  navigator.online = info.online;
	}
});
});

define('nuva', function(require, exports, module) {
var callback = require('callback');
var exec = require('exec');
var event = require('event');

function rtFunc(method) {
	return function(cb) {
		exec('runtime', method, {}, cb);
	};
}

var nuva = {
	define: define,

	require: function(id) {
		//android backward compatibility
		if (!id) {
			return exec;
		} else {
			return require(id);
		}
	},

	callback: callback,

	event: event,

	//android backward compatibility
	__js_port__: function(type) {
		var args = Array.prototype.slice.call(arguments, 1);
		var TYPE_CB = 0,
      TYPE_DISPATCH = 1;
		switch (type) {
			case TYPE_CB:
				callback.dispatch.apply(window.nuva, args);
				break;
			case TYPE_DISPATCH:
				event.dispatch.apply(window.nuva, args);
				break;
			default:
				break;
		}
	},

	runtime: {
		info: rtFunc('info'),

		_interceptBackButton: rtFunc('interceptBackButton'),

    _interceptNavTitle: rtFunc('interceptNavTitle'),
    _recoverNavTitle: rtFunc('recoverNavTitle'),

		_getModules: rtFunc('getModules')
	}
};

module.exports = nuva;
});
  
function execPrompt (interfaceName, apiName, args) {
  window.nuva.require('runtime.channel')[apiName](args);
}

var event = require('event');

function _connectWebViewJavascriptBridge(callback) {
	if (window._WebViewJavascriptBridge) {
    	callback(_WebViewJavascriptBridge)
	} else {
    	document.addEventListener('_WebViewJavascriptBridgeReady', function() {
        	callback(_WebViewJavascriptBridge)
    	}, false);
	};
}

_connectWebViewJavascriptBridge(function(bridge) {
	bridge.init();

	bridge.registerHandler('event', function(data) {
		if (data.eventType) {
			var eventType = data.eventType;
			delete data.eventType;
			event.dispatch(eventType, data);
		}
	});

	//ios backwards compatibility
	var _registerHandler = bridge.registerHandler;
	var _callHandler = bridge.callHandler;
	bridge.registerHandler = function(name, handler) {
		_registerHandler.call(bridge, name, handler);
	};
	bridge.callHandler = function(name, params, callback) {
		params = params || {};
		if (typeof params !== 'object') {
			params = {__default__: params};
		}
		if (name === 'exec') {
			_callHandler.call(bridge, name, params, callback);
		}
		else {
			var moduleName, methodName;
	        var dot = name.lastIndexOf('.');
	        if (dot !== -1) {
	            moduleName = name.substring(0, dot);
	            methodName = name.substring(dot + 1);
	        }
	        else{
	        	// legacy jsapi compatibility
                moduleName = 'legacy';
                methodName = name;
            }

            params.onSuccess = callback;
            params.onFail = callback;
            params.onCancel = callback;

            var mod = require(moduleName);
            if(mod&&mod[methodName]){
            	mod[methodName](params);
            }else{
            	callback({
            		errorCode:'1',
            		errorMessage:'Api is undefined'
            	})
            }
    	}
	};

	event._publish('nativeready');
});

(function() {
  var statistics = {
    reportPageBlank: function(url, isBlank, html) {
        execPrompt('statistics', 'reportPageSuccess', {
            url: url,
            isBlank: isBlank,
            html: isBlank ? html : ''
        });
    }
  };

  var doReportBlank = function() {
    var html;
    try {
      html = document.getElementsByTagName('html')[0].innerHTML;
    }
    catch (e) {
      html = e + '';
    }
    statistics.reportPageBlank(location.href, true, html);
  };
  
  var checkBlank = function() {
    //by guizhong
    var doc = document && document.documentElement;
    if (doc) {
      //防止二次被触发
      if(!window.__dd_check_done__) {
        window.__dd_check_done__ = true;
        var t1 = {
          elementsLength:0
        };
        var t2 = {
          elementsLength:0
        };
        //加setTimeout，可以规避前端跳转误报白屏的问题
        setTimeout(function(){
          t1.elementsLength = document.body.getElementsByTagName("*").length;
          
          setTimeout(function(){
            t2.elementsLength = document.body.getElementsByTagName("*").length;

            //判断是否白屏逻辑
           if (t2.elementsLength === 0) {
              doReportBlank();
            }
            else if (location.hostname.indexOf(".dingtalk.com") > -1 &&
                t2.elementsLength <= 4 && t2.elementsLength == t1.elementsLength){
              //判断为白屏
              doReportBlank();
            }
            else {
              statistics.reportPageBlank(location.href, false);
            }
          }, 4000)
        }, 500);
      }
    }
  };

  checkBlank();
})();

(function() {
  window.nuva = require('nuva');

  var event = require('event');
  event._subscribeOnce('nativeready', function() {
    nuva.runtime._getModules(function(map) {
      //ios compatibility
      if (map.result) {
        map = map.result;
      }
      _prepareModules(map);

      //prepare networks
      document.addEventListener('online', function(event) {
        var info = event.data;
        window.navigator.online = info.online;
        conn.networkType = info.type;
      });

      document.addEventListener('offline', function() {
        window.navigator.online = false;
        conn.networkType = conn.NONE;
      });

      try {
        require('device.network').get({
          onSuccess: function(info) {
            navigator.online = info.online;
          }
        });
      }
      catch (e) {
        console.log(e);
      }

      window.WebViewJavascriptBridge = window._WebViewJavascriptBridge;

      var ready = document.createEvent('Events');
      ready.initEvent('runtimeready', false, true);
      document.dispatchEvent(ready);

      //ios backwards compatibility
      var wvjbEvent = document.createEvent('Events');
      wvjbEvent.initEvent('WebViewJavascriptBridgeReady');
      document.dispatchEvent(wvjbEvent);
    });
  });
})();

function _prepareModules (map) {
  var exec = require('exec');
  for (var name in map) {
    var methods = map[name];

    (function(_name, _methods) {
      define(_name, function(require, exports, module) {
        var p = {};
        p._name = _name;
        for (var i in _methods) {
          var action = _methods[i];
          p[action] = (function(_action) {
            return function(params) {
              if (!params) {
                params = {};
              }
              var onSuccess = params.onSuccess;
              var onFail = params.onFail;
              delete params.onSuccess;
              delete params.onFail;
              //delete params.onCancel; //no onCancel callback?
              var args = params;
              return exec(_name, _action, args, onSuccess, onFail);
            };
          })(action);
        };
        module.exports = p;
      });
    })(name, methods);
  }
};
}());