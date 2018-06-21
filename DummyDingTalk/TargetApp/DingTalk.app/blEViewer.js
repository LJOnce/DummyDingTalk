/**
 *
 * @issue 1 : 提供对比内容差异的方案
 * @issue 2 : 光标问题wired的处理
 * @issue 3 : 调试信息面板 
 * @issue 4 : 设置font-size 后scroll值是按照缩放比例的
 * @issue 5 : 编辑状态缩放后的光标
 * @issue 6 : contenteditable嵌套在首行无法定位光标删除
 * @issue 7 : contenteditable嵌套在末行无法定位光标
 * @issue 8 : contenteditable嵌套一删除删除多个
 * @issue 9 : 编辑态滚动条过长
 * @issue 10: 在底部编辑的跳动问题
 *
 * @todo 1 : 插入图片或者语音光标自动定位到下一行
 * @todo 2 : 提供调试输出面板
 */
BLEditor.Viewer = function(options) {

    this.opts = BLEditor.Util.extend({
        rootElement : null
    },options);

    this.init();
}

BLEditor.Viewer.getInstance = function() {
    if (!this._instance) {
        this._instance = new BLEditor.Viewer({
            rootElement : document.getElementById(BLEditor.config.editorId)
        });
    }
    return this._instance;
}

BLEditor.Viewer.getViewport = function() {

    if(!this._viewport) {
        var ViewPort = BLEditor.Viewport;
        this._viewport = new ViewPort();
    }

    return this._viewport;
}


BLEditor.Viewer.__defineGetter__("instance", BLEditor.Viewer.getInstance);
BLEditor.Viewer.__defineGetter__("viewport", BLEditor.Viewer.getViewport);

BLEditor.Viewer.prototype._imagePreloader = null;
BLEditor.Viewer.prototype._rootElement = null;
BLEditor.Viewer.prototype._editor = null;
BLEditor.Viewer.prototype._isReady = null;
BLEditor.Viewer.prototype.init = function init() {

    this._rootElement = this.opts.rootElement;

    this.__defineGetter__("rootElement", this.getRootElement);
    this.__defineGetter__("editor", this.getEditor);
    this.__defineGetter__("lastTouchElement", this.getLastTouchElement);
    this.__defineGetter__("imagePreloader", this.getImagePreloader);
    this.__defineGetter__("showImageLoading", this.getShowImageLoading);
    //设置图片的预处理状态
    this.__defineSetter__("showImageLoading", this.setShowImageLoading);
};

BLEditor.Viewer.prototype.getRootElement = function getRootElement() {
    if (!this._rootElement) {
        this._rootElement = document.getElementById(BLEditor.config.editorId);
    }
    return this._rootElement;
};

BLEditor.Viewer.prototype.getEditor = function() {

    if(!this._editor) {
        this._editor = new BLEditor.Editor({
            rootElement    : this.opts.rootElement
        });

        this._editor.on('beforeGetHtml' , this._onbeforeGetHtml , this);
        this._editor.on('afterGetHtml' , this._onafterGetHtml , this);
    }

    return this._editor;
}

BLEditor.Viewer.prototype.ready = function() {

    if(this._isReady) {
        return;
    }

    this._bindEvents();
    this._isReady = true;
}

BLEditor.Viewer.prototype._bindEvents = function() {
    this.rootElement.addTapEventListener(this._onTapEnd , false);
    this.rootElement.addLongPressEventListener(this._onLongPressed, false);
    document.body.addTapEventListener(this._onTapBody, false);
}

BLEditor.Viewer.prototype._unbindEvents = function() {
    this.rootElement.removeTapEventListener(this._onTapEnd);
    tdocument.body.removeTapEventListener(this._onTapBody);
}

BLEditor.Viewer.prototype._onLongPressed = function(e) {

    if(e.target.nodeName.toLocaleLowerCase() == 'img') {
        //用户在非编辑态度长按图片
        BLEditor.NativeNotifier.notify('longPressImageFromJs' , {
            filePath : e.target.getAttribute('src')
        });
    } else {
        BLEditor.NativeNotifier.notify('longPressViewerFromJs' , {});
    }
}

BLEditor.Viewer.prototype._onTapEnd = function(e) {

    var self = BLEditor.Viewer.instance;

    if(self.editor.shouldEnterFocusWhenTap(e) && self.editor.canEdit) {
        //编辑的入口通过tapEnd去统一控制
        self.storeLastTouchElement(e);
        self.startEdit();
    }
}

BLEditor.Viewer.prototype.storeLastTouchElement = function(e) {

    this._lastTouchElement = e.target;
}

BLEditor.Viewer.prototype.getLastTouchElement = function(e) {

    return this._lastTouchElement;
}

BLEditor.Viewer.prototype.clearLastTouchElement = function() {

    this._lastTouchElement = null;
}

BLEditor.Viewer.prototype.startEdit = function() {
    this.rootElement.setAttribute("contenteditable", true);
    this.editor.startEdit();
}

BLEditor.Viewer.prototype.restoreStart = function() {
    this.startEdit();
    this.editor.focus();
    this.editor.restoreSelection();
}

BLEditor.Viewer.prototype.stopEdit = function() {
    this.rootElement.setAttribute("contenteditable", false);
    this.editor.stopEdit();
}

BLEditor.Viewer.prototype.getImagePreloader = function() {

    if(!this._imagePreloader) {
        this._imagePreloader = new BLEditor.ImgPreloader();
    }

    return this._imagePreloader;
}

//提前加载图片
BLEditor.Viewer.prototype.setShowImageLoading = function(show) {

    if(show) {
        this.imagePreloader.start(this._handlePreloadImages);
    } else {
        this.imagePreloader.restore();
    }
    this._showImageLoading = show;
}

BLEditor.Viewer.prototype._handlePreloadImages = function() {
    //加载完成后缩放页面
    setTimeout(function(){
        if(BLEditor.Viewer.viewport.shouldScaleToFix) {
            BLEditor.Viewer.viewport.scaleToFix();
        }
    },100);
}

BLEditor.Viewer.prototype.getShowImageLoading = function() {
    return this._showImageLoading;
}

BLEditor.Viewer.prototype._onTapBody = function(e){

    if(e.target == document.body) {
        BLEditor.Debug.log('_onTapBody');
        var self = BLEditor.Viewer.instance;
        self._focus();
        if(BLEditor.config.tapBodyToEnd) {
            self.editor.setSelectionAtEnd();       
        }
    }
}

BLEditor.Viewer.prototype._focus = function(){
    var self = BLEditor.Viewer.instance;
    if(!self.editor.isFocus) {
        self.clearLastTouchElement();
        self.startEdit();
        self.rootElement.focus();
    } 
}

BLEditor.Viewer.prototype._onbeforeGetHtml = function() {

    this.showImageLoading && this.imagePreloader.restore();

    BLEditor.Debug.log('_onbeforeGetHtml');
}

BLEditor.Viewer.prototype._onafterGetHtml = function() {

    this.showImageLoading && this.imagePreloader.start(this._handlePreloadImages);
    BLEditor.Debug.log('_onafterGetHtml');
}

BLEditor.Events.mixTo(BLEditor.Viewer);




