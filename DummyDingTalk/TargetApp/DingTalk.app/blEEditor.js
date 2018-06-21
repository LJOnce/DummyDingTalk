/**
 * 编辑器对象定义，主要负责光标跟随屏幕、插入文档对象
 */

(function(){

BLEditor.Editor = function(options) {

    this.opts = BLEditor.Util.extend({
        rootElement : null
    },options);

    this.init();
}

//滚动调用函数的来源
BLEditor.Editor.scrollSourceEnum = {
    focus : 1 ,
    keyup : 2 , 
    keyboardChanged : 3,
    checkProc : 4,
    touchImg  : 5,
    resetHtml : 6
}

BLEditor.Editor.prototype._canEdit  = true;
BLEditor.Editor.prototype.DEFAULT_CARET_MARKER_HEIGHT  = 20;
BLEditor.Editor.prototype.defaultVisbleHeight          = 200;
BLEditor.Editor.prototype.defaultVisbleWidth           = 290;
BLEditor.Editor.prototype._spaceUponKeyboard           = 20;   
BLEditor.Editor.prototype._ignoresChangeCount          = 0;
BLEditor.Editor.prototype._selectionToEndWhenWired     = true;
BLEditor.Editor.prototype._hasChanges                  = false;
BLEditor.Editor.prototype._domChangeEvent              = false;
BLEditor.Editor.prototype._intervalCheckTimer          = null;
BLEditor.Editor.prototype._hasEditingStarted           = false;
BLEditor.Editor.prototype._scrollTimeHandler           = false;
BLEditor.Editor.prototype._currentPlayingAudioAttach   = null;

BLEditor.Editor.prototype.init = function() {

    var self = this;
    this._rootElement = this.opts.rootElement;
    this._tempPlaceDivs = {}; //用于占位的div
    this.resetVisbleRect();
    this.__defineGetter__("rootElement", this.getRootElement);
    this.__defineGetter__("isFocus", this.getIsFocus);
    this.__defineGetter__("needScale", this.getNeedScale);
    this.__defineGetter__("canEdit", this.getCanEdit);
    this.__defineGetter__("canEdit", this.getCanEdit);
    this.__defineGetter__("basePoiont", this.getBasePoiont);  //offset原点偏移量
    this.__defineGetter__("disableChanged", this.getDisableChanged);
    

    window.onbeforeunload = function() {
        self.stopIntevalCheck();
        BLEditor.Debug.log('onbeforeunload');
    }
}

BLEditor.Editor.prototype.getRootElement = function getRootElement() {
    if (!this._rootElement) {
        this._rootElement = document.getElementById(BLEditor.config.editorId);
    }
    return this._rootElement;
};

BLEditor.Editor.prototype.focus = function() {
    this.rootElement.focus();
}

BLEditor.Editor.prototype.contenteditable = function() {
    return this.rootElement.getAttribute("contentEditable");
} 

BLEditor.Editor.prototype.startEdit = function() {

    var self = this;

    if(!this.rootElement.getAttribute("contentEditable")) {
        this.rootElement.setAttribute("contentEditable", true);
    }

    //绑定事件
    if(!this._hasEditingStarted) {
      this._bindEvents();
    }

    //设置标记位
    this._hasEditingStarted = true;
    this.startIntevalChcek();

    this.trigger('startEdit');
}

BLEditor.Editor.prototype.stopEdit = function() {

    if(this.isFocus) {
        this.rootElement.blur();
    }

    this._unbindEvents();
    this._hasEditingStarted = false;
    this.trigger('stopEdit');
}

BLEditor.Editor.prototype.startIntevalChcek = function() {

    var self = this;

    this.stopIntevalCheck();

    this._intervalCheckTimer = setInterval(function(){
        self._checkProc();
    },100);
}

BLEditor.Editor.prototype._checkProc = function() {
    
    BLEditor.Debug.log('_checkProc');

    if(this._domChangeEvent) {
        this.scrollToCaret(0 , BLEditor.Editor.scrollSourceEnum.checkProc);
        this._domChangeEvent = false;

        //调整当前附件保持一致
        BLEditor.AttachmentManager.shareInstance.consitentAttachmentsInCaseChanges();
        
        BLEditor.Debug.log('_dom changed');
    }
}

BLEditor.Editor.prototype.stopIntevalCheck = function() {

    if(this._intervalCheckTimer) {
       clearInterval(this._intervalCheckTimer);
    }
}

BLEditor.Editor.prototype.setVisibleRect = function(left , top , right, bottom) {
    this._visibleRect = new Rect(left, top, right, bottom);
}

BLEditor.Editor.prototype.resetVisbleRect = function() {
    this.setVisibleRect(0, 0,  this.defaultVisbleWidth, this.defaultVisbleHeight);
}

BLEditor.Editor.prototype.updateCurrentOffset = function(x , y) {

    this._currentScrollOffset = {
        x : x,
        y : y
    }

    BLEditor.Debug.log('updateCurrentOffset:' + x + ' ' + y);
}

BLEditor.Editor.prototype.setDefaultVisibleHeight = function(height, x , y) {

    this.updateCurrentOffset(x , y);

    var shouldScroll = false;

    if(height) {

        if(this.defaultVisbleHeight != height) {
            shouldScroll = true;
        }

        this.defaultVisbleHeight = height;
        this.resetVisbleRect();
    }

    if(!this._initialOffset && y < 0) {
        this._initialOffset = {
            x : x,
            y : y,
            h : this.defaultVisbleHeight + y
        };
    }

    BLEditor.Debug.log('setDefaultVisibleHeight:' + height + ' ' + this.defaultVisbleHeight);
    if(this.isFocus) {
        this.resetCaretToLastTouchElement();
    }

    if(shouldScroll) {
        this.scrollToCaret();       
    }
}

BLEditor.Editor.prototype.setInitialOffset = function(x , y ) {

    this._initialOffset = {
        x : x,
        y : y,
        h : this.defaultVisbleHeight + y
    };
}

BLEditor.Editor.prototype._bindEvents = function() {

    this.rootElement.addEventListener('keyup', this._onKeyup , false);
    this.rootElement.addEventListener('focus',  this._onFocus , false);
    this.rootElement.addEventListener('blur',  this._onBlur , false);
    this.rootElement.addEventListener('DOMSubtreeModified',  this._onDomSubtreeModified , false);
    this.rootElement.addTapEventListener(this._onTap, false);
    document.addEventListener("paste", this._onPaste, false);
}

BLEditor.Editor.prototype._unbindEvents = function() {
    this.rootElement.removeEventListener('keyup',  this._onKeyup);
    this.rootElement.removeEventListener('focus',  this._onFocus);
    this.rootElement.removeEventListener('blur',   this._onBlur);
    this.rootElement.removeEventListener('DOMSubtreeModified',   this._onDomSubtreeModified);
    this.rootElement.removeTapEventListener(this._onTap, false);
    document.removeEventListener("paste", this._onPaste, false);
}

BLEditor.Editor.prototype.getIsFocus = function() {
    return document.activeElement === this.rootElement;
}

BLEditor.Editor.prototype._onDomSubtreeModified = function(e){

    var self = BLEditor.Viewer.instance.editor;

    BLEditor.Debug.log('_onDomSubtreeModified');
    BLEditor.Debug.log('_ignoresChangeCount:' + self._ignoresChangeCount);

    if(!self.disableChanged) {
        self._domChangeEvent = true;
        BLEditor.NativeNotifier.notify('domSubtreeModifiedFromJs');
    }
}

//当用户点击时判断是否要进行focus进入编辑态
BLEditor.Editor.prototype.shouldEnterFocusWhenTap = function(e) {

    var self = this;
    var currentTime = new Date().getTime();

    if(e.target.isCheckboxElement()) {
        //在非编辑条件下，如果target为checkbox会导致系统默认的实现触发两次checked
        if(Math.abs(currentTime - self._lastTapTime) > 1000 && self.isFocus) {
            var checkbox = e.target;
            var selected = checkbox.getAttribute("checked");
            if(selected) {
                checkbox.checked = false;
                checkbox.setAttribute("checked", '');
            } else {
                checkbox.checked = true;
                checkbox.setAttribute("checked", "checked");
            }
        }
        self._lastTapTime = new Date().getTime();
        return false;
    }

    self._lastTapTime = new Date().getTime();
    return true;
}

BLEditor.Editor.prototype._onPaste = function(e) {

    var self = BLEditor.Viewer.instance.editor;

    setTimeout(function(){
        BLEditor.NativeNotifier.notify('pasteFromJs');
    },0);
    
    self.scrollToCaret(100);
}

BLEditor.Editor.prototype.saveAttachmentsByPaste = function(e) {

    var pasteImages = [];
    var imageElements = this.rootElement.querySelectorAll('img[src^=webkit-fake-url]');

    // <img src="webkit-fake-url://7E9C44E2-0C0B-44A1-8A6F-0777CC9E5805/imagepng">
    for (var i= 0, l= imageElements.length; i< l; i++) {
        var imageElem = imageElements[i];
        var imageSrc  = imageElem.src;
        var imageFileName = imageSrc.replace(/^webkit-fake-url:\/\/([^/]+)\/.*$/, "$1");
        var imageFileType = imageSrc.substring(imageSrc.lastIndexOf('/') + 1);

        if(imageFileType && imageFileType.indexOf('image') > -1) {

            var imageFileExt = imageFileType.replace('image','');

            //设置id为它的path，供保存后进行替换
            imageElem.setAttribute('id',imageFileName);

            pasteImages.push({
                fileName : imageFileName,
                fileExt  : imageFileExt
            });
        } 
    }
    return JSON.stringify(pasteImages);
}

BLEditor.Editor.prototype.markPasteImageSaved = function(imageIds , pasteImageAttachMents) {

    for (var i = 0; i < pasteImageAttachMents.length; i++) {   
        var attachInfo = pasteImageAttachMents[i];
        var imageId = imageIds[i];
        var imageElem = document.getElementById(imageId);

        if(imageElem) {
            imageElem.setAttribute('src',attachInfo.filePath);
            imageElem.removeAttribute('id');
            var imgUi = new BLEditor.UIAttachment(imageElem,attachInfo);
            //加入公用的文件管理器
            this._attachImageElement(imageElem , attachInfo);
            BLEditor.AttachmentManager.shareInstance.addAttachment(imgUi);
        }
    };
}

BLEditor.Editor.prototype._onTap = function(e) {

    var self = BLEditor.Viewer.instance.editor;

    //如果用户点击了图片，则需要微调滚动条
    if(e.target.nodeName.toLocaleLowerCase() == 'img') {
        self._onFocus();
        self.scrollToCaret(0 , BLEditor.Editor.scrollSourceEnum.touchImg);
    } else if(e.target.hasTapElementWithClass(BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME)) {

        //用户点击了语音附件栏
        var element = e.target;
        var uiAttachment = BLEditor.AttachmentManager.shareInstance.getAttachmentById(element.getAttribute('attachId'));

        if(uiAttachment) {
            //通知object-c点击了语音，是否播放由object-c去控制，这样实现逻辑比较清晰，否则得来回交互处理异常情况的展现
            self.notifyAudioTapped(uiAttachment);
        }
    } 
    self.storeCurrentSelection();
}

BLEditor.Editor.prototype.notifyAudioTapped = function(uiAttachment) {

    var attachInfo = uiAttachment.attachInfo;

    BLEditor.Debug.log('tapAudio path:' + attachInfo.filePath);

    BLEditor.NativeNotifier.notify('tapAudioFromJs' , {
        elementId : uiAttachment.attachId,
        filePath  : attachInfo.filePath
    });
}

BLEditor.Editor.prototype.playAudio = function(audioUi) {

    //停止当前的
    this.stopAudio();

    if(audioUi) {
        this.igoresChange(true);
        audioUi.showPlaying();
        this._currentPlayingAudioAttach = audioUi;
        this.igoresChange(false);
    }
}

BLEditor.Editor.prototype.stopAudio = function(audioUi) {

    if(!audioUi) {
        audioUi = this._currentPlayingAudioAttach;
    }

    if(audioUi) {
        this.igoresChange(true);
        audioUi.showEnding();
        if(this._currentPlayingAudioAttach === audioUi) {
            this._currentPlayingAudioAttach = null;
        }
        this.igoresChange(false);
    }
}

BLEditor.Editor.prototype.loadAudio = function(audioUi) {

    if(audioUi) {
        this.igoresChange(true);
        audioUi.showLoding();
        this.igoresChange(false);
    }
}

BLEditor.Editor.prototype._onKeyup = function(e) {

    var self = BLEditor.Viewer.instance.editor;
    
    if(e.keyCode == 8)  {
        self._handleDelete();
    } 

    self.scrollToCaret(0 , BLEditor.Editor.scrollSourceEnum.keyup);
}

BLEditor.Editor.prototype._handleDelete = function() {

    var self = BLEditor.Viewer.instance.editor;
    var appleStyleSpan = self.getParentAppleStyleSpan();

    if (appleStyleSpan && appleStyleSpan.isEmptyNode()) {

        self.normalizeAppleStyleSpan(appleStyleSpan);

        var topmostAppleStyleElement = appleStyleSpan;
        while (topmostAppleStyleElement) {
            var _parent = topmostAppleStyleElement.parentElement;
            if (_parent.className == "Apple-style-span") {
                topmostAppleStyleElement = _parent;
            }
            break;
        }
        if (topmostAppleStyleElement.nodeName != "DIV" && topmostAppleStyleElement.nodeName != "P" && topmostAppleStyleElement.parentElement == this.rootElement) {
            document.execCommand("formatBlock", false, "div");
        }
    }
}

BLEditor.Editor.prototype.normalizeAppleStyleSpan = function normalizeAppleStyleSpan(element) {
    void(0);
    var currentNode = element;
    do {
        if (!currentNode.className.match(/Apple-style-span/)) {
            break;
        } else {
            if (currentNode.style.fontSize) {
                currentNode.style.fontSize = "inherit";
            }
        }
    } while (( currentNode = currentNode . parentElement ) != null);
};

BLEditor.Editor.prototype.getParentAppleStyleSpan = function getParentAppleStyleSpan() {
    void(0);
    var sel = window.getSelection();
    var baseNode = sel.baseNode;
    if (baseNode.nodeType != Node.ELEMENT_NODE) {
        baseNode = baseNode.parentElement;
    }
    var appleStyleSpan = null;
    var _parent = null;
    do {
        if (baseNode.className == "Apple-style-span") {
            appleStyleSpan = baseNode;
            break;
        }
        else {
            baseNode = baseNode.parentElement;
        }
    } while ( baseNode && baseNode != this . rootElement );
    return appleStyleSpan;
};

BLEditor.Editor.prototype.resetCaretToLastTouchElement = function() {

    var lastTouchElement = BLEditor.Viewer.instance.lastTouchElement;
    var resetTarget = null;

    if(lastTouchElement && lastTouchElement.nodeName.toUpperCase() == 'IMG') {
        BLEditor.Debug.log('_onFocus has lastTouchElement img');
        resetTarget = lastTouchElement;
    }

    if(resetTarget) {
        this.setCaretAfterElement(lastTouchElement);
        this.storeCurrentSelection();
        this.scrollToCaret(0, BLEditor.Editor.scrollSourceEnum.touchImg);
    } else {
        BLEditor.Debug.log('resetCaretToLastTouchElement');
        BLEditor.Debug.log(lastTouchElement);
    }
}

BLEditor.Editor.prototype._onFocus = function(e) {

    var self = BLEditor.Viewer.instance.editor;
    var delayTime = 100;

    //恢复上次的点击
    self.resetCaretToLastTouchElement();
    // self.restoreSelection();
    self.scrollToCaret(delayTime, BLEditor.Editor.scrollSourceEnum.focus);

    //在focus一段时间后再清空上次记录的touchElement
    setTimeout(function(){
        BLEditor.Viewer.instance.clearLastTouchElement();
    },2000);

    BLEditor.Debug.log('_onFocus');
}

BLEditor.Editor.prototype.igoresChange = function(igore) {

    if(igore) {
        this._ignoresChangeCount++;
    } else {
        this._ignoresChangeCount--;
    }
}

BLEditor.Editor.prototype.getDisableChanged = function(){
    return this._ignoresChangeCount > 0;
}

BLEditor.Editor.prototype._onBlur = function(e) {

    var self = BLEditor.Viewer.instance.editor;
    self.stopIntevalCheck();
    BLEditor.Viewer.instance.clearLastTouchElement();
    self._hasEditingStarted = false;
}

//滚动到当前光标显示区域
BLEditor.Editor.prototype.scrollToCaret = function(time , source) {
    var self = this;
    time = typeof(time) === 'number' ? parseInt(time,10) : 0;

    if(this._scrollTimeHandler) {
      clearTimeout(this._scrollTimeHandler);
    }

    BLEditor.Debug.log('scrollToCaret source:' + source);
   
    if(time == 0) {
        this.adjustContentOffset(function(){
            self._scrollToCaret(source);
            self.storeCurrentSelection();
        });
    } else {
        self._scrollTimeHandler = setTimeout(function() {
            self.adjustContentOffset(function(){
              self._scrollToCaret(source);
              self.storeCurrentSelection();
            });
        }, time);
    } 
}

BLEditor.Editor.prototype.adjustContentOffset = function(callback) {

    var self = this;

    BLEditor.NativeNotifier.notifyWithResponse('getWebViewOffsetFromJS' , {}, function(x , y) {

        self.updateCurrentOffset(x , y);
        callback && callback();
    });
}

//获取当前选择区域 
BLEditor.Editor.prototype.getSelectionRect = function getSelectionRect(absolute) {

    void(0);
    var sel = window.getSelection();
    var rect = null;
    var r = null;
    var baseNode = sel.baseNode;
    var baseOffset = sel.baseOffset;

    try {

        this.igoresChange(true);

        if (sel.baseNode) {
            void(0);
            baseOffset = sel.baseOffset;
            var charRange = null;
            var txt = baseNode.textContent;
            var txtLen = txt.length;

            if (baseNode.nodeType == Node.TEXT_NODE) {
                void(0);
                if (baseOffset > 0) {
                    BLEditor.Debug.log('TEXT_NODE baseOffset > 0');
                    void(0);
                    charRange = document.createRange();
                    charRange.setStart(baseNode, baseOffset - 1);
                    charRange.setEnd(baseNode, baseOffset);
                    rect = BLEditor.Util.getBoundingClientRect(charRange);

                    //有可能取到bottom == top的情况
                    BLEditor.Debug.log('rect:' + rect.top + ' ' + rect.bottom + ' ' + baseOffset + ' ' + txtLen);
                    if (rect.bottom <= rect.top) {

                        if(baseOffset < txtLen - 3) {
                            charRange.setEnd(baseNode, baseOffset + 2);
                            rect = BLEditor.Util.getBoundingClientRect(charRange);
                        } else if(baseOffset > 3){
                            charRange.setStart(baseNode, baseOffset - 2);
                            charRange.setEnd(baseNode, baseOffset);
                            rect = BLEditor.Util.getBoundingClientRect(charRange);
                        }
                    } 

                    if(rect) {
                        rect = new Rect(rect.right - 1, rect.top, rect.right + 1, rect.bottom);
                    }
                } else if (txtLen > 0) {
                    BLEditor.Debug.log('TEXT_NODE txtLen > 0');
                    void(0);
                    charRange = document.createRange();
                    charRange.setStart(baseNode, baseOffset);
                    charRange.setEnd(baseNode, baseOffset + 1);
                    rect = BLEditor.Util.getBoundingClientRect(charRange);
                    if (rect) {
                        rect = new Rect(rect.left - 1, rect.top, rect.left + 1, rect.bottom);
                    }
                } else {
                    void(0);
                    rect = BLEditor.Util.getBoundingClientRect(baseNode.parentElement);
                    if (rect) {
                        rect = new Rect(rect.left - 1, rect.top, rect.left + 1, rect.bottom);
                    }
                }

                var transposeY = this.getScrollY();
                if (rect && absolute && !BLEditor.Util.isIosVersion7()) {
                    if(transposeY >= 0) {
                        transposeY = this.getScrollY();
                        rect.transpose(this.getScrollX(), transposeY);
                    } else {
                        rect.transpose(this.getScrollX(), 0);
                    }
                }
                
            } else  {
                this.igoresChange(true);
                BLEditor.Debug.log('begin getSelection base node not equal root');
                void(0);
                var tempDiv = document.createElement("div");
                var baseNodeStyle = window.getComputedStyle(sel.baseNode, '');
                var tempDivHeight = parseFloat(baseNodeStyle.getPropertyValue("font-size"));
                if (!tempDivHeight) {
                    tempDivHeight = 20;
                }
                tempDiv.style.cssText = "display: inline-block; position: relative; padding: 0px; margin: 0px; float: none; width: 0px; height: " + tempDivHeight + "px;";
                sel.baseNode.insertBefore(tempDiv, sel.baseNode.childNodes[sel.baseOffset]);
                rect = tempDiv.offset();
                tempDiv.remove();
                BLEditor.Debug.log('end getSelection base node not equal root');   
                this.igoresChange(false);     
            }
        }

        BLEditor.Debug.log('select baseNode:' + baseOffset);
        BLEditor.Debug.log(baseNode);
        
    } catch (e) {
        void(0);
        void(0);
        BLEditor.Debug.log(e.message);
    } finally {
        this.igoresChange(false);
    }

    return rect;
};

BLEditor.Editor.prototype.getScrollX = function() {
    return this._currentScrollOffset.x;
}

BLEditor.Editor.prototype.getScrollY = function() {
    return this._currentScrollOffset.y;
}

BLEditor.Editor.prototype.getVisibleRect = function getVisibleRect(absolute) {
    void(0);
    var vRect = this._visibleRect;
    vRect = Rect.fromObject(vRect);

    if (absolute) {
        var offsetX = this.getScrollX();
        var offsetY = this.getScrollY();
        vRect.transpose(offsetX, offsetY);
    }

    BLEditor.Debug.log('begin getVisibleRect');
    BLEditor.Debug.log(vRect);
    BLEditor.Debug.log('end getVisibleRect');
    return vRect;
};

BLEditor.Editor.prototype.getNeedScale = function() {
    return BLEditor.Viewer.viewport.needScale;
}

BLEditor.Editor.prototype.normalizeCaretPostion = function(pos) {

    //如果当前页面没有进行缩放则不需要移动横向滚动条
    if(!this.needScale) {
       pos.x = 0;
       BLEditor.Debug.log('normalizeCaretPostionX:' + pos.x);
    }

    var maxY = this.getTextHeightCursory() - this.defaultVisbleHeight + this._spaceUponKeyboard;

    if(pos.y > maxY && pos.y > 0) {
        pos.y = maxY - this.basePoiont.y;
        BLEditor.Debug.log('normalizeCaretPostionY:' + pos.y);
    }

    return pos;
}

BLEditor.Editor.prototype.setSpaceUponKeyboard = function setSpaceUponKeyboard(space) {
    this._spaceUponKeyboard = space;
}

/**

  图解：

  1. bottom超过visible的bottom
  2. top 小于visible的top
  3. right 超过visieble的right
  4. left 小于visiblede的left
  ----------------------------------------
  |      visibleRect                     |
  |                                      |
  | --------------------------           |
  | |                        |           |
  | |  paddedRect            |           |
  | |                        |           | 
  | --------------------------           |
  ----------------------------------------
 */
BLEditor.Editor.prototype.makeRectVisible = function makeRectVisible(rect) {
    void(0);
    var vRect = this.getVisibleRect(true);
    var topOffset = 0;
    var rectPadding = new Padding(7);
    var paddedRect = Rect.fromObject(rect);
    paddedRect.addPadding(rectPadding);

    // if(this._currentScrollOffset && this._currentScrollOffset.y < 0) {
    //     vRect.top += this._currentScrollOffset.y;
    //     vRect.bottom += this._currentScrollOffset.y;
    // } 

    if (window.pageYOffset > 0) {
        vRect.transpose(0, topOffset);
    }

    BLEditor.Debug.log('begin paddedRect');
    BLEditor.Debug.log(paddedRect);
    BLEditor.Debug.log('end paddedRect');

    this.trigger('makeRectVisible',paddedRect , vRect);

    void(0);
    if (paddedRect.bottom <= vRect.bottom && paddedRect.bottom > vRect.top && (paddedRect.top >= vRect.top || paddedRect.height > vRect.height) && paddedRect.right <= vRect.right && (paddedRect.right > vRect.left && paddedRect.width > vRect.width)) {
        void(0);
        return;
    }
    var newX = this.getScrollX();
    var newY = this.getScrollY();

    //20为单行的高度
    if (paddedRect.top <= vRect.top) {
        void(0);
        newY = paddedRect.top - this.basePoiont.y;
        BLEditor.Debug.log('top out of visible rect:' + paddedRect.top + ' ' + vRect.top);
    } else if(paddedRect.bottom >= vRect.bottom - this._spaceUponKeyboard){
        void(0);
        newY = paddedRect.bottom - this.defaultVisbleHeight + this._spaceUponKeyboard - this.basePoiont.y;
        BLEditor.Debug.log('bottom out of visible rect:' + paddedRect.bottom + ' ' + vRect.bottom);
    } else if(this._currentScrollOffset){
        if(this._currentScrollOffset.y <= 0) {
            newY = this._currentScrollOffset.y;
        }
    } 

    if (paddedRect.left > vRect.right) {
        void(0);
        newX = paddedRect.left - vRect.width;
    } else if (paddedRect.left < vRect.left) {
        void(0);
        newX = Math.max(0, paddedRect.left);
    } else if (vRect.right < paddedRect.right && paddedRect.left > vRect.left + paddedRect.width) {
        void(0);
        newX += paddedRect.right - vRect.right;
    } 

    void(0);

    var bodyScrollHeight = document.body.scrollHeight;

    if(this._initialOffset && this._initialOffset.h > 0) {
       var firstMax = this._initialOffset.h;

       //当用户backspace删除时如果当前光标处于一开始的可见区域范围内才重设置contentOffset
       if(paddedRect.top <= vRect.top &&
          paddedRect.top < (firstMax - this._spaceUponKeyboard - this.DEFAULT_CARET_MARKER_HEIGHT) && 
          paddedRect.height < this.DEFAULT_CARET_MARKER_HEIGHT * 2 &&
          paddedRect.bottom < vRect.bottom) {
            // BLEditor.Debug.log('firstMax:' + firstMax + ' vrectTop:' + vRect.top + ' paddedRect:' + paddedRect.top + ' ' + paddedRect.bottom);
            newY = this._initialOffset.y;
        } else if(newY < this._initialOffset.y) {
            newY = this._initialOffset.y;
        } else if(paddedRect.bottom < firstMax - this._spaceUponKeyboard) {
            newY = this._initialOffset.y;
        }
    }

    return {
        x : newX,
        y : newY
    }
};

//滚动到当前光标处
BLEditor.Editor.prototype._scrollToCaret = function(source) {

    if(!this.isFocus) {
        return;
    }

    if(!this._lastScrollTime) {
        this._lastScrollTime = new Date().getTime();
    }

    var currentTime = new Date().getTime();

    //checkProc是为了兼容越狱的第三方键盘无法通过keyup去更新光标，所以做了定时器
    if(Math.abs(currentTime - this._lastScrollTime) < 500 && 
       source == BLEditor.Editor.scrollSourceEnum.checkProc) {
        return;
    }

    //重置可视区域
    var self = this;

    this.resetVisbleRect();

    var caretPos , wired = false , wiredNum = 99999;
    var selectionRect = this.getSelectionRect(true);

    BLEditor.Debug.log('begin selectionRect:');
    BLEditor.Debug.log(selectionRect);
    BLEditor.Debug.log('end selectionRect:');

    if(selectionRect) {
        void(0);
        if(Math.abs(selectionRect.bottom) > wiredNum) {
            wired = true;
            //此时到了特殊异常逻辑了，很无奈啊
            if(this._lastScrollY) {

                var adjustY = this._lastScrollY - this.defaultVisbleHeight * 2;

                if(this._lastOffsetHeight) {
                    var currentOffsetHeight = this._rootElement.offsetHeight;
                    if(currentOffsetHeight < this._lastOffsetHeight) {
                        adjustY = this._lastScrollY - (this._lastOffsetHeight - currentOffsetHeight);
                    }
                    this._lastOffsetHeight = undefined;
                }

                this.scrollTo({
                    x : this._lastScrollX,
                    y : adjustY
                }, true);
                return;
            }

            if(this._selectionToEndWhenWired) {
                this.setSelectionAtEnd();       
            }
        } else {
            caretPos = this.makeRectVisible(selectionRect);
        }
    } else {
        wired = true;
    }

    //否则设置到最末尾
    if(wired) {
        return;
    }
    
    if(caretPos) {
        //调整position，如果页面没缩放就不改left
        caretPos = this.normalizeCaretPostion(caretPos);

        this.scrollTo({
            x : caretPos.x,
            y : caretPos.y
        }, true);
    }
}

BLEditor.Editor.prototype.scrollTo = function(point , animated) {

    //调用原生代码进行滚动
    BLEditor.Debug.log('scrollTo x:' + point.x + ' y:' + point.y);
    
    this._lastScrollY = point.y;
    this._lastScrollX = point.x;
    this._lastOffsetHeight = this._rootElement.offsetHeight;

    BLEditor.NativeNotifier.notify('setWebViewOffsetFromJS', {
      x : point.x,
      y : point.y
    });

    this._lastScrollTime = new Date().getTime();
}

BLEditor.Editor.prototype.insertAttachment = function(attachInfo , otherOption) {

    if(attachInfo.fileType == 0) {
        this.focus();
        this.insertImage(attachInfo , otherOption);

    } else if(attachInfo.fileType == 1) {

        var uiManager = BLEditor.UIManager.shareInstance;

        uiManager.resourcesReady(function() {
            BLEditor.Viewer.instance.editor.focus();
            BLEditor.Viewer.instance.editor.insertAudio(attachInfo,otherOption);
        });
    }
}


BLEditor.Editor.prototype._createImageElement = function(attachInfo , otherOption) {
    var img = document.createElement('img');
    img.setAttribute('src', attachInfo.filePath);
    img.className = BLEditor.CONST.BL_INSERT_IMAGE_CLASS_NAME;
    img.setTitle(attachInfo.fileName);
    // BLEditor.Viewer.viewport.adjustImg(img , otherOption.width, otherOption.height);
    BLEditor.AttachmentManager.shareInstance.addAttachInfoToElement(attachInfo , img);
    return img;
}

BLEditor.Editor.prototype._attachImageElement = function(img , attachInfo , otherOption) {
    img.setAttribute('src', attachInfo.filePath);
    img.className = BLEditor.CONST.BL_INSERT_IMAGE_CLASS_NAME;
    img.setTitle(attachInfo.fileName);
    // BLEditor.Viewer.viewport.adjustImg(img , otherOption.width, otherOption.height);
    BLEditor.AttachmentManager.shareInstance.addAttachInfoToElement(attachInfo , img);
    return img;
}

BLEditor.Editor.prototype.insertImage = function(attachInfo , otherOption) {
    
    var self = this;

    this.igoresChange(true);

    var imageElementShouldAdd = this._createImageElement(attachInfo , otherOption);
    var imageElementAdded = this.insertElement(imageElementShouldAdd);

    if(imageElementAdded) {

         //防止之前没有宽度和高度导致光标无法调整正确
        if(imageElementAdded) {
            if(otherOption.width <= 0 || otherOption.height <= 0) {
                var tempImage = new Image();
                tempImage.onload = function() {
                    var width = tempImage.width;
                    var height = tempImage.height;
                    imageElementAdded.style.minWidth = '';
                    imageElementAdded.style.minHeight = '';
                    self.editor.scrollToCaret(50);
                    BLEditor.NativeNotifier.notify('adjustContentSizeToFitFromJs');
                }
                tempImage.src = otherOption.src;
            } else {
                this.scrollToCaret(0);
                BLEditor.NativeNotifier.notify('adjustContentSizeToFitFromJs');
            }

            var imgUi = new BLEditor.UIAttachment(imageElementAdded,attachInfo);
            //加入公用的文件管理器
            BLEditor.AttachmentManager.shareInstance.addAttachment(imgUi);
        } 

        //设置光标到节点之后
        this.setCaretAfterElement(imageElementAdded);
        //保存当前光标用于下次插入
        this.storeCurrentSelection();
        //添加完后调整滚动区域
        this.scrollToCaret(100);
    } 

    this.igoresChange(false);

    return imageElementAdded;
}

BLEditor.Editor.prototype._createAudioElement = function(attachInfo) {

    var blAudioDiv = document.createElement(BLEditor.CONST.BL_INSERTED_AUDIO_TAG_NAME);
    blAudioDiv.addClass(BLEditor.CONST.BL_INSERT_AUDIO_CLASSNAME);
    blAudioDiv.addClass(BLEditor.CONST.BL_INSERT_AUDIO_END_CLASSNAME);
    BLEditor.AttachmentManager.shareInstance.addAttachInfoToElement(attachInfo , blAudioDiv);
    return blAudioDiv;
}

BLEditor.Editor.prototype.insertAudio = function(attachInfo) {

    var audioElm    = this._createAudioElement(attachInfo);

    this.igoresChange(true);

    var addAudioElm = this.insertElement(audioElm);

    if(addAudioElm) {
        var audioUi = new BLEditor.UIAudioAttachment(addAudioElm , attachInfo);
        //加入公用的文件管理器
        BLEditor.AttachmentManager.shareInstance.addAttachment(audioUi);
        
        audioUi.showEnding();
        //设置光标到节点之后
        this.setCaretAfterElement(addAudioElm);
        //保存当前光标用于下次插入
        this.storeCurrentSelection();
        //添加完后调整滚动区域
        this.scrollToCaret(100);
    }

    this.igoresChange(false);

    return addAudioElm;
}

BLEditor.Editor.prototype.insertElement = function insertElement(e) {
    void(0);

    e.addClass(BLEditor.CONST.BL_INSERTED_ELEMENT_CLASSNAME);

    var sel = window.getSelection();

    //恢复选择区域
    this.igoresChange(true);
    this.restoreSelection();
    var changed = document.execCommand("insertHTML", false, e.outerHTML);

    BLEditor.Debug.log('insertHTML: ' + e.outerHTML);
    if (!changed) {
        BLEditor.Debug.log('insertHTML failure');
        return undefined;
    }
    var ins = document.querySelector("." + BLEditor.CONST.BL_INSERTED_ELEMENT_CLASSNAME);
    if (ins) {
        ins.removeClass(BLEditor.CONST.BL_INSERTED_ELEMENT_CLASSNAME);
        //设置光标到待添加的节点之后
        BLEditor.Debug.log('insertElementSuccess');
    }

    this.igoresChange(false);

    return ins;
};

BLEditor.Editor.prototype.setCaretAfterElement = function setCaretAfterElement(e) {
    var parent = e.parentElement;
    if (!parent) {
        return;
    }
    var children = Array.prototype.slice.call(parent.childNodes);
    BLEditor.Debug.log(children);
    BLEditor.Debug.log(e);
    var eIndex = children.indexOf(e);
    var sel = window.getSelection();
    sel.setBaseAndExtent(parent, eIndex + 1, parent, eIndex + 1);
    BLEditor.Debug.log('setCaretAfterElement index:' + eIndex);
};

//保存当前光标的选区
BLEditor.Editor.prototype.storeCurrentSelection = function storeCurrentSelection() {
    void(0);
    var sel = window.getSelection();
    if (sel && sel.baseNode) {
        this._currentSelection = {
            "anchorNode": sel.anchorNode,
            "anchorOffset": sel.anchorOffset,
            "baseNode": sel.baseNode,
            "baseOffset": sel.baseOffset,
            "focusNode": sel.focusNode,
            "focusOffset": sel.focusOffset,
            "extentNode": sel.extentNode,
            "extentOffset": sel.extentOffset,
            "isCollapsed": sel.isCollapsed
        };
        this._currentNode = sel.focusNode;
        this._currentOffset = sel.focusOffset;
    }
};

BLEditor.Editor.prototype.isStoredSelectionValid = function isStoredSelectionValid() {
    void(0);
    var curSel = this._currentSelection;
    if (!curSel) {
        return false;
    }
    var rootRange = document.createRange();
    rootRange.selectNode(this.rootElement);
    if (curSel.anchorNode && curSel.focusNode && rootRange.intersectsNode(curSel.anchorNode) && rootRange.intersectsNode(curSel.focusNode)) {
        return true;
    }
    return false;
};

//恢复选择区域
BLEditor.Editor.prototype.restoreSelection = function restoreSelection(invalidateEnd) {
    void(0);
    try {
        var sel = window.getSelection();
        //如果原来的选区不对则滚动到最末尾去
        if (!this.isStoredSelectionValid()) {
            void(0);
            if(invalidateEnd) {
                this.setSelectionAtEnd();
                this.storeCurrentSelection();
            }
        } else {
            var curSel = this._currentSelection;
            var baseNode = curSel.baseNode;
            var baseOffset = curSel.baseOffset;
            var extentNode = curSel.extentNode;
            var extentOffset = curSel.extentOffset;
            if (!baseNode) {
                void(0);
            } else {
                var baseChildCount = (baseNode.nodeType == Node.ELEMENT_NODE) ? baseNode.childNodes.length : baseNode.textContent.length;
                var extentChildCount = (extentNode.nodeType == Node.ELEMENT_NODE) ? extentNode.childNodes.length : extentNode.textContent.length;
                if (baseChildCount < baseOffset) {
                    void(0);
                    baseOffset = baseChildCount;
                }
                if (extentChildCount < extentOffset) {
                    void(0);
                    extentOffset = extentChildCount;
                }
                if (curSel.isCollapsed) {
                    void(0);
                    sel.setPosition(extentNode, extentOffset);
                } else {
                    void(0);
                    sel.setBaseAndExtent(baseNode, baseOffset, extentNode, extentOffset);
                }
            }
        }
    } catch (e) {
        void(0);
        void(0);
    } finally {
       
    }
};

BLEditor.Editor.prototype.resetStoredSelection = function resetStoredSelection() {
    this._currentSelection = null;
    this._currentNode = null;
    this._currentOffset = null;
};

BLEditor.Editor.prototype.setSelectionAtEnd = function setSelectionAtEnd(root) {
    void(0);
    BLEditor.Debug.log('setSelectionAtEnd');
    root = root ? root : this._rootElement;
    var childCount = root.childNodes.length;
    var sel = window.getSelection();
    sel.setBaseAndExtent(root, childCount, root, childCount);
};

BLEditor.Editor.prototype.getInnerHtml = function() {
    this.trigger('beforeGetHtml');
    var html = this._rootElement.innerHTML;
    this.trigger('afterGetHtml');
    return html;
}
 
BLEditor.Editor.prototype.getTextContent = function() {
    this.trigger('beforeGetHtml');
//    var text = this._rootElement.textContent;
    var text = this._rootElement.innerText;
    this.trigger('afterGetHtml');
    return text;
 }
 
 BLEditor.Editor.prototype.getTextContentWithoutWhitespaceAndNewLines = function() {
    this.trigger('beforeGetHtml');
    var text = this._rootElement.textContent;
    this.trigger('afterGetHtml');
    return text;
 }

BLEditor.Editor.prototype.hasChanges = function hasChanges() {
    var currentHtml = this.getInnerHtml();
    var isDiffs = BLEditor.Diffs.shareInstance.isDiffsWithText(currentHtml);
    return isDiffs;
};

BLEditor.Editor.prototype.setInnerHtml = function(html) {
    this._rootElement.innerHTML = html;
}
 
BLEditor.Editor.prototype.getTextHeightCursory = function() {
    return Math.floor(this._rootElement.scrollHeight * BLEditor.Viewer.viewport.scale);
}

BLEditor.Editor.prototype.getTextHeight = function() {

    var scrollHeight = this._rootElement.scrollHeight;
    var style = document.createElement('style');
    style.textContent = ' div { height: auto !important; }';
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    scrollHeight = this._rootElement.scrollHeight;
    style.parentNode.removeChild(style);

    if(document.body.scrollHeight > window.screen.height) {
        scrollHeight = document.body.scrollHeight;
    }
    return Math.floor(scrollHeight * BLEditor.Viewer.viewport.scale);
}

BLEditor.Editor.prototype.getTextWidth = function() {
    return Math.floor(this._rootElement.scrollWidth * BLEditor.Viewer.viewport.scale);
}

BLEditor.Editor.prototype.getCanEdit= function(canEdit) {
    return this._canEdit;
}

BLEditor.Editor.prototype.getBasePoiont= function(canEdit) {
    
    if(BLEditor.Util.isIosVersion7()) {
        return {
            x : 0,
            y : 64
        }
    } else {
        return {
            x : 0,
            y : 0
        }
    }
}

BLEditor.Editor.prototype.setCanEdit= function(canEdit) {
    this._canEdit = canEdit;

    if(!canEdit) {
        this.stopEdit();
    }
}

BLEditor.Events.mixTo(BLEditor.Editor);

})();