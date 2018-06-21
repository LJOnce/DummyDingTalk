/**
 *
 * 产生背景：
 * 语音输入在富文本里的展示需要能够作为一个整体进行添加和删除，为了实现这种效果之前的方案是在
 * contenteditable 为true的内容里嵌套contenteditable为false的元素去实现，但是这样做在ios有两个严重的缺陷
 * 1. 嵌套contenteditable为false的元素在首行时光标定位无法删除
 * 2. 嵌套contenteditable为false的元素在末尾无法将光标定位在该元素之后
 * 3. 也是最严重的问题，就是对连续的contenteditable为false的元素backspace删除会把连续的元素一并删除掉
 * 
 * 为了解决上述问题，产生了该文件，利用canvas动态生成展示内容的背景图片，同时考虑到ui同学的习惯，封装成了ios的风格
 *
 */

function Frame(left, top, width, height) {
    this.initialize(left, top, left + width, top + height);
}

BLEditor.Util.subclass(Frame, Rect);

////////////////////////////////////////////
BLEditor.UIManager = function() {
	this.init();
}

BLEditor.UIManager.getShareInstance = (function() {

	var _instance = null;

	return function(){

		if(!_instance) {
			_instance = new BLEditor.UIManager();
		}

		return _instance;
	};
})();

BLEditor.UIManager.__defineGetter__("shareInstance", BLEditor.UIManager.getShareInstance);

BLEditor.UIManager.prototype.DEFAULT_WIDTH  = 276;
BLEditor.UIManager.prototype.DEFAULT_HEIGHT = 48;
BLEditor.UIManager.prototype._canvas = null;
BLEditor.UIManager.prototype._imageLoadedCount = 0;
BLEditor.UIManager.prototype.baseUri = '';

BLEditor.UIManager.prototype.init = function() {

	this._imagesCache = {};
	this.__defineGetter__("canvas", this.getCanvas);
	this.__defineGetter__("context", this.getContext);
}

BLEditor.UIManager.prototype.registerImages = function(imgs) {
	if(!this._imagesUrl) {
		this._imagesUrl = [];
	}
	this._imagesUrl = this._imagesUrl.concat(imgs);
}

BLEditor.UIManager.prototype.resourcesReady = function(callback) {

	var self = this;

	if(self._resourcesLoaded) {
		callback && callback();
	} else {
		this.loadImagesWithUrl(this._imagesUrl, function() {
			self._resourcesLoaded = true;
			callback && callback();
		});
	}
}

BLEditor.UIManager.prototype.saveImage = function(url , imageObject) {
	this._imagesCache[url] = imageObject;
}

BLEditor.UIManager.prototype.imageWithUrl = function(url) {
	return this._imagesCache[url];
}

BLEditor.UIManager.prototype.loadImagesWithUrl = function(urls , callback) {

	var self = this;
	var total = urls.length;

	if(urls.length <= 0) {
		callback && callback();
	}

	for (var i = 0; i < urls.length; i++) {

		(function(i){

			var url = self.baseUri + urls[i];
			var image = new Image();

			image.onload = function() {

				self._imageLoadedCount++;
				self.saveImage(urls[i] , image);

				if(total == self._imageLoadedCount) {
					callback && callback();
				}
			}

			image.onerror = function() {
			}

			image.src = url;
		})(i);
	}
}

BLEditor.UIManager.prototype.getCanvas = function(width , height) {

	if(!this._canvas) {
		var canvas = document.createElement("canvas");
		// var canvas = document.getElementById("testCanvas");
		var context = canvas.getContext("2d");
		canvas.setAttribute("width",  this.DEFAULT_WIDTH);
		canvas.setAttribute("height", this.DEFAULT_HEIGHT);
		this._canvas = canvas;
	}

	if(width && height) {
		this._canvas.setAttribute("width",  width);
		this._canvas.setAttribute("height", height);
	}

	return this._canvas;
}

BLEditor.UIManager.prototype.getContext = function() {
	return this.canvas.getContext("2d");
}

BLEditor.UIManager.prototype.setupContextWithAttributes = function(attrs) {

	if (!attrs) {
		return;
	}

	this.context.save();

	for (var i in attrs) {
		this.context[i] = attrs[i];
	}
};

BLEditor.UIManager.prototype.saveContext = function() {
	this.context.save();
};

BLEditor.UIManager.prototype.restoreContext = function() {
	this.context.restore();
};

//see : http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
CanvasRenderingContext2D.prototype.clear = 
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }           
};

////////////////////////////////////////////
BLEditor.UIView = function () {

    this.init();
}

BLEditor.UIView.prototype._rect = null;
BLEditor.UIView.prototype._scale = 1.0;
BLEditor.UIView.prototype._drawRect = null;
BLEditor.UIView.prototype._subviews = null;
BLEditor.UIView.prototype._contextAttribute = null;
BLEditor.UIView.prototype.superView = null;
BLEditor.UIView.prototype._hidden = false;
BLEditor.UIView.prototype._overlayElement = null;   //canvas背景只能静态，为了避免重绘，使用附加的htmlElement去实现gif

BLEditor.UIView.prototype.init = function(element) {

	this.element = element;

	this.__defineGetter__("frame", this.getFrame);
	this.__defineSetter__("frame", this.setFrame);
	this.__defineGetter__("hidden", this.getHidden);
	this.__defineSetter__("hidden", this.setHidden);
	this.__defineGetter__("contextAttribute", this.getContextAtturibute);
	this.__defineSetter__("contextAttribute", this.setContextAtturibute);

	this._subviews = [];
	this.contextAttribute = {
		fillStyle: "white"
	};
	this.setFrame(0 , 0 , 0 , 0);
}

BLEditor.UIView.prototype.getContextAtturibute = function() {
	return this._contextAttribute;
}

BLEditor.UIView.prototype.setContextAtturibute = function(contextAttribute) {
	this._contextAttribute = contextAttribute;
}

BLEditor.UIView.prototype.getHidden = function() {
	return this._hidden;
}

BLEditor.UIView.prototype.setHidden = function(hidden) {
	this._hidden = hidden;
}

BLEditor.UIView.prototype.destroy = function() {

	if(this._overlayElement) {
		this._overlayElement.remove();
		this._overlayElement = null;
	}

	if(this._subviews) {
		for (var i = 0; i < this._subviews.length; i++) {
			var subView = this._subviews[i];
			if(subView && subView.destroy) {
				subView.destroy();
			}
		};
	}

	this._subviews = null;
	this._rect     = null;
	this._drawRect = null;
}

BLEditor.UIView.prototype.getFrame = function() {
	return this._rect;
}

BLEditor.UIView.prototype.setFrame = function(rect) {
	this._rect = rect;
}

BLEditor.UIView.prototype.layout = function() {
	var rect = this._getRelativeRect();
	this._drawRect = this.frame;
	this._drawRect && this._drawRect.transpose(rect.left , rect.top);
}

BLEditor.UIView.prototype.setNeedsDisplay = function() {
	this.setNeedsLayout();
	this.draw();
}

BLEditor.UIView.prototype.setNeedsLayout = function() {

	this.layout();

	this.layoutSubviews();
}

BLEditor.UIView.prototype.addSubview = function(view) {

	if(view && !this.hasSubview(view)) {
		view.superView = this;
		this._subviews.push(view);
	}
}

BLEditor.UIView.prototype.hasSubview = function(view) {

	if(!view) {
		return false;
	}

	for (var i = 0; i < this._subviews.length; i++) {
		if(this._subviews[i] === view) {
			return true;
		}
	}
	return false;
}

BLEditor.UIView.prototype.removeSubview = function(view) {

	if(!view) {
		return;
	}

	for (var i = this._subviews.length - 1; i >= 0; i--) {
		if(view === this._subviews[i]) {
			this._subviews.splice(i , 1);
			view.subView = null;
		}
	}
}

BLEditor.UIView.prototype._getRelativeRect = function() {
	var rect = new Rect(0,0,0,0);
	if(this.superView && this.superView.frame) {
		rect = this.superView.frame;
	}
	return rect;
}

BLEditor.UIView.prototype.layoutSubviews = function() {

	for (var i = 0; i < this._subviews.length; i++) {
		var subView = this._subviews[i];
		subView.layout();
	};
}

//计算当前view相对于renderElement在文档中的drawRect起始位置
BLEditor.UIView.prototype.calAbsoluteDrawRect = function() {

	var temp = this;
	var parentsStack = [];

	while(temp && !temp.element) {
		temp = temp.superView;
		if(temp) {
			parentsStack.push(temp);
		}
	}

	var rect = {
		left   : 0,
		top    : 0,
		width  : this._drawRect.width,
		height : this._drawRect.height
	}
	
	var root = parentsStack.pop();

	if(root && root.element) {
		var offset = root.element.offset();
		rect.left += offset.left + this._drawRect.left;
		rect.top  += offset.top  + this._drawRect.top;
	} else {
		rect.left += this._drawRect.left;
		rect.top  += this._drawRect.top;
	}

	while(parentsStack.length > 0) {

		var view   = parentsStack.pop();
		rect.left += view._drawRect.left;
		rect.top  += view._drawRect.top;
	}

	return rect;
}

BLEditor.UIView.prototype.drawRect = function() {

	if(this.contextAttribute && this._drawRect) {
		var uiManager = BLEditor.UIManager.shareInstance;
		uiManager.saveContext();
		uiManager.setupContextWithAttributes(this.contextAttribute);
		uiManager.context.fillRect(0, 0, this._drawRect.width, this._drawRect.height);
		uiManager.restoreContext();
	}
}

BLEditor.UIView.prototype.draw = function() {

	if(!this._hidden) {
		this.drawRect();

		for (var i = 0; i < this._subviews.length; i++) {
			var subView = this._subviews[i];
			if(subView != this && !subView.hidden) {
				subView && subView.drawRect();
			}
		}
	}
}

BLEditor.UIView.prototype.beginMakeImageData = function() {
	var ctx = BLEditor.UIManager.shareInstance.context;
	ctx.clear();
	this._adjustCanvasSize();
}

BLEditor.UIView.prototype._adjustCanvasSize = function() {
	var uiManager = BLEditor.UIManager.shareInstance;
	var canvas = uiManager.canvas;
	var ctx = uiManager.context;
	var scale = 1.0;

	var canvasWidth = Math.round(this.frame.width * scale * window.devicePixelRatio, 2);
	var canvasHeight = Math.round(this.frame.height * scale * window.devicePixelRatio, 2);
	var styleWidth = Math.round(this.frame.width / scale, 2);
	var styleHeight = Math.round(this.frame.height / scale, 2);

	var contextScale = scale * window.devicePixelRatio;
	void(0);
	canvas.setAttribute("width", canvasWidth);
	canvas.setAttribute("height", canvasHeight);
	canvas.style["width"] = styleWidth + "px";
	canvas.style["height"] = styleHeight + "px";
	ctx.scale(contextScale, contextScale);
	ctx.save();
}

BLEditor.UIView.prototype.makeImageData = function() {

	this.beginMakeImageData();

	this.setNeedsDisplay();
	var canvas = BLEditor.UIManager.shareInstance.canvas;
	var imageData = canvas.toDataURL("image/png");

	this.endMakeImageData();

	return imageData;
}

BLEditor.UIView.prototype.endMakeImageData = function() {
	var uiManager = BLEditor.UIManager.shareInstance;
	uiManager.restoreContext();
}

BLEditor.UIView.prototype.renderToElement = function(element) {

	try {
		var canvas = BLEditor.UIManager.shareInstance.canvas;
		var imageData = this.makeImageData();
		element.setAttribute("role", "button");
		element.style["width"] = canvas.style["width"];
		element.style["height"] = canvas.style["height"];
		element.style["background-color"] = "white";
		element.style["background-image"] = "url(" + imageData + ")";
		element.style["background-position"] = "0 0";
		element.style["background-repeat"] = "no-repeat";
		element.style["background-size"] = "cover";
	} catch(e) {
		BLEditor.Debug.err('renderToElement error:' + e.message);
	}
};

///////////////////////////////////////////////
BLEditor.UIImage = function() {
	this.init();
}

BLEditor.UIImage.imageNamed = function(name) {

	var image = BLEditor.UIManager.shareInstance.imageWithUrl(name);

	if(image) {
		var uiImage = new BLEditor.UIImage();
		uiImage.CTImage = image;
		return uiImage;
	} else {
		return null;
	}
}

BLEditor.UIImage.prototype._CTImage = null;

BLEditor.UIImage.prototype.init = function() {
	this.__defineGetter__("CTImage", this.getCTImage);
	this.__defineSetter__("CTImage", this.setCTImage);
}

BLEditor.UIImage.prototype.getCTImage = function(img) {
	return this._CTImage;
}

BLEditor.UIImage.prototype.setCTImage = function(img) {
	this._CTImage = img;
}

///////////////////////////////////////////////
BLEditor.UIImageView = function() {
	this.init();
}

BLEditor.Util.subclass(BLEditor.UIImageView, BLEditor.UIView);

BLEditor.UIImageView.prototype._image = null;

BLEditor.UIImageView.prototype.init = function() {

	BLEditor.UIImageView.__super__.init.apply(this , [].slice.apply(arguments));
	this.__defineGetter__("image", this.getImage);
	this.__defineSetter__("image", this.setImage);
}

BLEditor.UIImageView.prototype.getImage = function(img) {
	return this._image;
}

BLEditor.UIImageView.prototype.setImage = function(img) {
	this._image = img;
}

BLEditor.UIImageView.prototype.drawRect = function() {

	if (this._image && this._image.CTImage && this._drawRect) {

		//gif 的话需要用到overlayElement去展示
		if(this._image.CTImage.src.indexOf('.gif') > -1) {

			if(!this._overlayElement) {
				var imageElement = document.createElement('img');
				var absDrawRect  = this.calAbsoluteDrawRect();

				document.body.appendChild(imageElement);
				imageElement.src = this._image.CTImage.src;
				imageElement.style.position = 'absolute';
				imageElement.style.left = absDrawRect.left + 'px';
				imageElement.style.top = absDrawRect.top +'px';
				imageElement.style.width  = absDrawRect.width + 'px';
				imageElement.style.height = absDrawRect.height + 'px';
				this._overlayElement = imageElement;
			} 
			
			this._overlayElement.show();
		} else {

			if(this._overlayElement) {
				this._overlayElement.hide();
			}

			var ctx = BLEditor.UIManager.shareInstance.context;
			ctx.drawImage(this._image.CTImage, this._drawRect.left, this._drawRect.top, this._drawRect.width, this._drawRect.height);
		}
	}
}

///////////////////////////////////////////////////////////////////////
BLEditor.UILabel = function() {
	this.init();
}

BLEditor.Util.subclass(BLEditor.UILabel, BLEditor.UIView);

BLEditor.UILabel.prototype._text = null;
BLEditor.UILabel.prototype.fontSize = 10;
BLEditor.UILabel.prototype.ELLIPSES = '...';
BLEditor.UILabel.prototype.MIN_FILENAME_LEN = 3 * window.devicePixelRatio;

BLEditor.UILabel.prototype.init = function() {

	BLEditor.UILabel.__super__.init.apply(this , [].slice.apply(arguments));
	this.__defineGetter__("text", this.getText);
	this.__defineSetter__("text", this.setText);

	this.contextAttribute = {
		font: "bold " + this.fontSize + "px Helvetica",
		fillStyle: "#6C6C6C",
		textAlign: "center",
		textBaseline: "top"
	}
}

BLEditor.UILabel.prototype.getText = function() {
	return this._text;
}

BLEditor.UILabel.prototype.setText = function(text) {
	this._text = text;
}

BLEditor.UILabel.prototype._fitTextToWidth = function(text, width, ctx) {
	var metrics = null;
	var n = 0;
	var ellipses = this.ELLIPSES;
	var min = this.MIN_FILENAME_LEN;
	var newText = text;
	var d = ellipses.length + 1;
	var _ctx = ctx || this.context;
	while ((metrics = _ctx.measureText(newText)) && metrics.width > width) {
		void(0);
		if (newText.length <= min) {
			break;
		}
		newText = text.substring(0, Math.max(text.length - d++, min)) + ellipses;
	}
	return newText;
};

BLEditor.UILabel.prototype.drawRect = function() {

	if(this._text && this._drawRect) {

		var uiManager = BLEditor.UIManager.shareInstance;
		var ctx = uiManager.context;
		uiManager.saveContext();
		if(this.contextAttribute) {
			uiManager.setupContextWithAttributes(this.contextAttribute);
		}
		void(0);
		var newText = this._fitTextToWidth(this._text, this._drawRect.width, ctx);
		ctx.fillText(newText , this._drawRect.left, this._drawRect.top);
		uiManager.restoreContext();
	}
}