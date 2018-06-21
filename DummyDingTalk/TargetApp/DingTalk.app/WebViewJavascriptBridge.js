;(function() {
	if (window._WebViewJavascriptBridge) { return }
	var messagingIframe
	var sendMessageQueue = []
	var receiveMessageQueue = []
	var messageHandlers = {}
	
	var CUSTOM_PROTOCOL_SCHEME = 'wvjbscheme'
	var QUEUE_HAS_MESSAGE = '__WVJB_QUEUE_MESSAGE__'
	
	var responseCallbacks = {}
	var uniqueId = 1
	
	function _createQueueReadyIframe(doc) {
		messagingIframe = doc.createElement('iframe');
		messagingIframe.style.display = 'none';
		messagingIframe.id="wvjbscheme_iframe";
		messagingIframe.src = CUSTOM_PROTOCOL_SCHEME + '://' + QUEUE_HAS_MESSAGE;
		doc.documentElement.appendChild(messagingIframe)
	}

	function init(messageHandler) {
		if (_WebViewJavascriptBridge._messageHandler) {
            console.log('_WebViewJavascriptBridge.init called twice');
            return;
        }
		_WebViewJavascriptBridge._messageHandler = messageHandler
		var receivedMessages = receiveMessageQueue
		receiveMessageQueue = null
        if (receivedMessages) {
            for (var i=0; i<receivedMessages.length; i++) {
                _dispatchMessageFromObjC(receivedMessages[i])
            }
        }
	}

	function send(data, responseCallback) {
		_doSend({ data:data }, responseCallback)
	}
	
	function registerHandler(handlerName, handler) {
		messageHandlers[handlerName] = handler
	}
	
	function callHandler(handlerName, data, responseCallback) {
		_doSend({ handlerName:handlerName, data:data }, responseCallback)
	}
	
	function _doSend(message, responseCallback) {
		if (responseCallback) {
			var callbackId = 'cb_'+(uniqueId++)+'_'+new Date().getTime()
			responseCallbacks[callbackId] = responseCallback
			message['callbackId'] = callbackId
		}
		sendMessageQueue.push(message);

		if(!document.getElementById('wvjbscheme_iframe')){
			doc.documentElement.appendChild(messagingIframe);
			
			console.log("iframe reAppend");
		}
		messagingIframe.src = CUSTOM_PROTOCOL_SCHEME + '://' + QUEUE_HAS_MESSAGE
	}

	function _fetchQueue() {
		var messageQueueString = JSON.stringify(sendMessageQueue)
		sendMessageQueue = []
		return messageQueueString
	}

	function _dispatchMessageFromObjC(messageJSON) {
		setTimeout(function _timeoutDispatchMessageFromObjC() {
			var message = JSON.parse(messageJSON)
			var messageHandler
			
			if (message.responseId) {
				var responseCallback = responseCallbacks[message.responseId]
				if (!responseCallback) { return; }
				responseCallback(message.responseData)
                if (message.responseData && message.responseData.keep && message.responseData.keep === '1') { return; }
				delete responseCallbacks[message.responseId]
			} else {
				var responseCallback
				if (message.callbackId) {
					var callbackResponseId = message.callbackId
					responseCallback = function(responseData) {
						_doSend({ responseId:callbackResponseId, responseData:responseData })
					}
				}
				
				var handler = _WebViewJavascriptBridge._messageHandler
				if (message.handlerName) {
					handler = messageHandlers[message.handlerName]
				}
				
				try {
					handler(message.data, responseCallback)
				} catch(exception) {
					if (typeof console != 'undefined') {
						console.log("_WebViewJavascriptBridge: WARNING: javascript handler threw.", message, exception)
					}
				}
			}
		})
	}
	
	function _handleMessageFromObjC(messageJSON) {
		if (receiveMessageQueue) {
			receiveMessageQueue.push(messageJSON)
		} else {
			_dispatchMessageFromObjC(messageJSON)
		}
	}

	window._WebViewJavascriptBridge = {
		init: init,
		send: send,
		registerHandler: registerHandler,
		callHandler: callHandler,
		_fetchQueue: _fetchQueue,
		_handleMessageFromObjC: _handleMessageFromObjC
	}

	var doc = document
	_createQueueReadyIframe(doc)
	var readyEvent = doc.createEvent('Events')
	readyEvent.initEvent('_WebViewJavascriptBridgeReady')
	readyEvent.bridge = _WebViewJavascriptBridge
	doc.dispatchEvent(readyEvent)
})();
