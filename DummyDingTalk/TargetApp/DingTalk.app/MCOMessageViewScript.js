
var imageElements = function() {
	var imageNodes = document.getElementsByTagName('img');
	return [].slice.call(imageNodes);
}

function tapInlineImage(imageNode){
    var url = imageNode.getAttribute('alt');
    jsBridge.postNotification("tapInlineImage",{"src":url});
}

var findCIDImageURL = function() {
	var images = imageElements();
	
	var imgLinks = [];
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
        if (url.indexOf('cid:') == 0 || url.indexOf('x-mailcore-image:') == 0){
			imgLinks.push(url);
            images[i].setAttribute('alt',url);
            images[i].setAttribute('src','bl_reader_icon_pic@2x.png');
            images[i].setAttribute('onclick','tapInlineImage(this)');
        }
        else{
            try {
                var url = images[i].getAttribute('alt');
                if (url.indexOf('cid:') == 0){
                    imgLinks.push(url);
                }
            }
            catch (e){
                continue;
            }
        }
	}
	return JSON.stringify(imgLinks);
}

var findWebKitFakeUrlImageURL = function() {
	var images = imageElements();
	
	var imgLinks = [];
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
		if (url.indexOf('webkit-fake-url:') == 0)
			imgLinks.push(url);
	}
	return JSON.stringify(imgLinks);
}

var findUnhanledWebKitFakeUrlImageURL = function() {
	var images = imageElements();
	
	var imgLinks = [];
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
		if (url.indexOf('webkit-fake-url:') == 0){
            if(!images[i].getAttribute('dealed')){
                imgLinks.push(url);
            }
        }
	}
	return JSON.stringify(imgLinks);
}

var hanledAllWebKitFakeUrlImageURL = function() {
	var images = imageElements();
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
		if (url.indexOf('webkit-fake-url:') == 0){
            images[i].setAttribute('dealed','true');
        }
	}
}


var markFakeImageHandled = function(info) {
	var images = imageElements();
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
		if (url.indexOf(info.LocalPathKey) == 0) {
			images[i].setAttribute('dealed', 'true');
			break;
		}
	}
}

var findAllImageURL = function() {
	var images = imageElements();
	
	var imgLinks = [];
	for (var i = 0; i < images.length; i++) {
		var url = images[i].getAttribute('src');
			imgLinks.push(url);
	}
	return JSON.stringify(imgLinks);
}

var replaceImageSrc = function(info) {
    // 外部发起img src替换时会调用这个方法，等待图片ready后进行缩放
    var $parent = $(document.getElementById("messageContentView"));
    var nodes = $parent.find("img");
    for (var i = 0, size = nodes.length; i < size; i++) {
        var node = nodes[i];
        var $node = $(node);
        
        if ($node.attr('alt') == info.URLKey) {
//        // tangtai.cgt 2015/06/10 bugfix #6028166
//        // node可以没有alt，所以调用alt.indexOf()会导致js crash，先判断alt存在
//        var nodeAlt = $node.attr('alt');
//        if (nodeAlt && nodeAlt.indexOf(info.URLKey) == 0) {
            $node.attr('src', info.LocalPathKey);
            $node.attr('alt', '');
            $node.removeAttr('onclick');
            // 如果scaleImageWhenReady方法存在，则需要顺便调用
            if (scaleImageWhenReady) {
                scaleImageWhenReady(node);
            }
            
            break;
        }
    }
}

function getContent()
{
    //var baliEditor = document.getElementById("body");
    //alert(baliEditor);
    var baliEditor = document.getElementById("mailBody");
    return baliEditor.innerHTML;
    //return document.documentElement.innerHTML;;
    
}


var findAttachImageURL = function() {
	var images = imageElements();
	
	var imgLinks = [];
	for (var i = 0; i < images.length; i++) {
        var url = images[i].getAttribute('src');
		if (url.indexOf('/') == 0||url.indexOf("file://localhost/")==0 ){
			imgLinks.push(url);
        }
	}
	return JSON.stringify(imgLinks);
}

// tangtai.cgt 2016/01/07 #7771829
function correctMissingInlineAttachments()
{
    var images = imageElements();
    for (var i = 0; i < images.length; i++) {
        var url = images[i].getAttribute('src');
        if (url.indexOf('bl_reader_icon_pic@2x.png') == 0) {
            try {
                // if 'alt' property stores origin cid value, copy it back to 'src' property
                var altValue = images[i].getAttribute('alt');
                if (altValue.indexOf('cid:') == 0) {
                    images[i].setAttribute('src', altValue);
                    images[i].setAttribute('alt', '');
                }
            } catch (e) {
                continue;
            }
        }
    }
}
