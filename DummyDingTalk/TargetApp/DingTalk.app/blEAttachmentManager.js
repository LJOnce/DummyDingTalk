/**
 * 提供附件变化的通知和管理，删除和添加，考虑到用户的撤销
 */
BLEditor.AttachmentManager = function() {

	this.init();
}

//定义附件的类型
BLEditor.AttachmentManager.KNOWN_TYPE = -1;
BLEditor.AttachmentManager.IMAGE_TYPE = 0;
BLEditor.AttachmentManager.AUDIO_TYPE = 1;

BLEditor.AttachmentManager.getShareInstance = (function() {

	var _instance = null;

	return function(){

		if(!_instance) {
			_instance = new BLEditor.AttachmentManager();
		}

		return _instance;
	};
})();

BLEditor.AttachmentManager.__defineGetter__("shareInstance", BLEditor.AttachmentManager.getShareInstance);

BLEditor.AttachmentManager.prototype._lastChangesAttachmentsInfo = null;

BLEditor.AttachmentManager.prototype.init = function() {
	this._attachments = {};
	this.__defineGetter__("lastChangesAttachmentsInfo", this.getLastChangesAttachmentsInfo);
}

BLEditor.AttachmentManager.prototype.getLastChangesAttachmentsInfo = function() {
	return this._lastChangesAttachmentsInfo;
}

BLEditor.AttachmentManager.prototype.addAttachment = function(uiAttachment) {

	if(uiAttachment) {
		this._attachments[uiAttachment.attachId] = uiAttachment;
	}
}

BLEditor.AttachmentManager.prototype.removeAttachment = function(attachId) {

	if(attachId && this._attachments[attachId]) {
		var delAttachment = this._attachments[attachId];
		this._attachments[attachId] = null;
		delAttachment.destroy();
		delete delAttachment;
	}
}

BLEditor.AttachmentManager.prototype.getAttachmentById = function(id) {

	if(id) {
		return this._attachments[id];
	} else {
		return null;
	}
}

//查找所有需要管理的附件的elements，注意如果多平台的话需要各个平台统一选择器
BLEditor.AttachmentManager.prototype.queryAllAttachmentsElements = function() {
	var editor    = BLEditor.Viewer.instance.editor;
	var elements  = editor.rootElement.querySelectorAll('.' + BLEditor.CONST.BL_INSERT_ATTACHMENT_CLASS_NAME);
	return elements;
}

BLEditor.AttachmentManager.prototype.queryAllUnresolvedAttachmentsElements = function() {
	var editor    = BLEditor.Viewer.instance.editor;
	var elements  = editor.rootElement.querySelectorAll('.' + BLEditor.CONST.BL_INSERT_ATTACHMENT_CLASS_NAME);
	return elements;
}

//从attachment中获取attachInfo，注意如果多平台的话需要各个平台统一属性
BLEditor.AttachmentManager.prototype.getAttachmentFromElement = function(element) {

	if (element) {
		var nodeName  = element.nodeName.toUpperCase();
		var audioClassName = BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME;

		if(nodeName == 'IMG') {
			return {
//				filePath    : element.getAttribute('bl-filePath') || element.getAttribute('src'),
				fileSize    : element.getAttribute('bl-fileSize') || 0,
				fileName    : element.getAttribute('bl-fileName') || element.getAttribute('title'),
				fileType    : element.getAttribute('bl-fileType') || BLEditor.AttachmentManager.IMAGE_TYPE
			}
		} else if(element.hasClass(audioClassName)){
			return {
//				filePath    : element.getAttribute('bl-filePath') || element.getAttribute('src'),
				fileSize    : element.getAttribute('bl-fileSize') || 0,
				fileName    : element.getAttribute('bl-fileName'),
				fileType    : element.getAttribute('bl-fileType') || BLEditor.AttachmentManager.AUDIO_TYPE
			}
		} 
	}

	return {
		fileType : BLEditor.AttachmentManager.KNOWN_TYPE
	};
}

//将附加的附件信息添加到element，注意如果多平台的话需要各个平台统一属性
BLEditor.AttachmentManager.prototype.addAttachInfoToElement = function(attachInfo , element) {

	if(element) {
//		element.setAttribute("bl-filePath", attachInfo.filePath);
		element.setAttribute("bl-fileType", attachInfo.fileType);
	    element.setAttribute("bl-fileSize", attachInfo.fileSize);
	    element.setAttribute("bl-fileName", attachInfo.fileName);

	    if(attachInfo.fileType == BLEditor.AttachmentManager.IMAGE_TYPE) {
	    	element.addClass(BLEditor.CONST.BL_INSERT_IMAGE_CLASS_NAME);
	    } else if(attachInfo.fileType == BLEditor.AttachmentManager.AUDIO_TYPE){
	    	element.addClass(BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME);
	    }

	    element.addClass(BLEditor.CONST.BL_INSERT_ATTACHMENT_CLASS_NAME);
	}
}

BLEditor.AttachmentManager.prototype.getAttachments = function() {

	var editor      = BLEditor.Viewer.instance.editor;
	var elements    = this.queryAllAttachmentsElements();
	var attachInfos = [];

	for (var i = 0; i < elements.length; i++) {
		var elem = elements[i];
		if(elem && elem.getAttachId()) {
			var attachmentUi = this.getAttachmentById(elem.getAttachId());
			attachmentUi && attachInfos.push(attachmentUi.attachInfo);
		}	
	};

	return attachInfos;
}

BLEditor.AttachmentManager.prototype.makeElementsToAttachments = function() {

	var editor    = BLEditor.Viewer.instance.editor;
	var elements  = this.queryAllUnresolvedAttachmentsElements();
	var uiManager = BLEditor.UIManager.shareInstance;
	var self      = this;

	uiManager.resourcesReady(function() {
		editor.igoresChange(true);
		for (var i = 0; i < elements.length; i++) {
			try {
				var element    = elements[i];
				var attachInfo = self.getAttachmentFromElement(element);

				//防止重复执行导致重复创建id导致附件变化不正确而引起错误的通知
				if(element && element.getAttachId()) {
					self.removeAttachment(element.getAttachId());
				}

				if(self.isAudioAttachment(attachInfo.fileType)) {
					var newElement = document.createElement(BLEditor.CONST.BL_INSERTED_AUDIO_TAG_NAME);
					newElement     = element.replace(newElement);
					newElement.className = element.className;
					self.normailizeAudioElement(newElement);
					self.addAttachInfoToElement(attachInfo,newElement);
					var audioUi    = new BLEditor.UIAudioAttachment(newElement , attachInfo);
					audioUi.showEnding();
					self.addAttachment(audioUi);
				} else if(self.isImageAttachment(attachInfo.fileType)) {
					var imgAttachment = new BLEditor.UIAttachment(element,attachInfo);
					self.addAttachment(imgAttachment);
				}
			} catch(e) {
				BLEditor.Debug.err('replaceElementsToAudioAttachments error:' + e.message);
			}
		}
		editor.igoresChange(false);
	});
}

BLEditor.AttachmentManager.prototype.isImageAttachment = function(type) {
	return parseInt(type , 10) == BLEditor.AttachmentManager.IMAGE_TYPE;
} 

BLEditor.AttachmentManager.prototype.normailizeAudioElement = function(newElement) {
	newElement.removeClass(BLEditor.CONST.BL_INSERT_NATIVE_AUDIO_CLASSNAME);
	newElement.addClass(BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME);
} 

BLEditor.AttachmentManager.prototype.isAudioAttachment = function(type) {
	return parseInt(type , 10) == BLEditor.AttachmentManager.AUDIO_TYPE;
} 

BLEditor.AttachmentManager.prototype.restoreAttachmentsToElements = function() {

	var editor   = BLEditor.Viewer.instance.editor;
	var elements = this.queryAllAttachmentsElements();
	var self     = this;

	editor.igoresChange(true);

	for (var i = 0; i < elements.length; i++) {
		var element    = elements[i];
		var attachInfo = this.getAttachmentFromElement(element);
		if(self.isAudioAttachment(attachInfo.fileType)) {
			var newElement = document.createElement('audio');
			newElement     = element.replace(newElement);
			newElement.addClass(BLEditor.CONST.BL_INSERT_NATIVE_AUDIO_CLASSNAME);
			newElement.removeClass(BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME);
			this.addAttachInfoToElement(attachInfo,newElement);
		}
	}
	editor.igoresChange(false);
}

BLEditor.AttachmentManager.prototype.consitentAttachmentsInCaseChanges = function() {

	var editor   = BLEditor.Viewer.instance.editor;
	var elements = this.queryAllAttachmentsElements();
	var deletesAttachments  = [];
	var addElements         = [];
	var existElements       = {};

	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var attachId = element.getAttachId();
		existElements[attachId] = element;
		if(!this.getAttachmentById(attachId)) {
			addElements.push(element);
		}
	};

	for (var id in this._attachments) {
		if(!existElements[id] && this._attachments[id]) {
			deletesAttachments.push(this._attachments[id]);
		}
	};

	if(addElements.length >0 && deletesAttachments.length > 0) {
//        alert('has add and delete' + deletesAttachments);
		this.notifyChanges(addElements , deletesAttachments);
		this.markElementsAdd(addElements);
		this.markAttachmentsDelete(deletesAttachments);
	} else if(addElements.length > 0) {
//        alert('has add elements');
		this.notifyChanges(addElements , []);
		this.markElementsAdd(addElements);
	} else if(deletesAttachments.length > 0) {
//        alert('has delete attachments');
		this.notifyChanges([] , deletesAttachments);
		this.markAttachmentsDelete(deletesAttachments);
	} else {
//        alert('no changes');
	}

	BLEditor.Debug.log(this.getAttachments());
}

BLEditor.AttachmentManager.prototype.notifyChanges = function(addElements, delAttachments) {

	var addIds = [] , delIds = [];

	this._lastChangesAttachmentsInfo = {
		adds : [],
		dels : []
	};

	for (var i = 0; i < addElements.length; i++) {
		var attachId   = addElements[i].getAttachId();
		var attachment = this.getAttachmentById(attachId);
		addIds.push(attachId);
		this._lastChangesAttachmentsInfo.adds.push(attachment.attachInfo);
	};

	for (var i = 0; i < delAttachments.length; i++) {
		var attachment = delAttachments[i];
		var attachId   = attachment.attachId;
		delIds.push(attachId);
		this._lastChangesAttachmentsInfo.dels.push(attachment.attachInfo);
	};

	var notifyInfo = {};

	if(addIds.length > 0 ) {
		notifyInfo.addIds = addIds.join(',');
	}

	if(delIds.length > 0 ) {
		notifyInfo.delIds = delIds.join(',');
	}

	BLEditor.NativeNotifier.notify('attachmentsChangedFromJs' , notifyInfo);
}

BLEditor.AttachmentManager.prototype.markAttachmentsDelete = function(deletesAttachments) {

	for (var i = 0; i < deletesAttachments.length; i++) {
		var delAttachment = deletesAttachments[i];
		this.removeAttachment(delAttachment.attachId);
	};
} 

BLEditor.AttachmentManager.prototype.markElementsAdd = function(addElements) {

	var uiManager = BLEditor.UIManager.shareInstance;
	var self = this;

	uiManager.resourcesReady(function() {
		var editor    = BLEditor.Viewer.instance.editor;
		editor.igoresChange(true);
		for (var i = 0; i < addElements.length; i++) {
			var addElement = addElements[i];
			var attachInfo = self.getAttachmentFromElement(addElement);

			if(self.isImageAttachment(attachInfo.fileType)) {
				var imgAttachment = new BLEditor.UIAttachment(addElement,attachInfo);
				self.addAttachment(imgAttachment);
			} else if(self.isAudioAttachment(attachInfo.fileType)) {
				var audioUi    = new BLEditor.UIAudioAttachment(addElement , attachInfo);
				audioUi.showEnding();
				self.addAttachment(audioUi);
			}
		};
		editor.igoresChange(false);
	});
} 