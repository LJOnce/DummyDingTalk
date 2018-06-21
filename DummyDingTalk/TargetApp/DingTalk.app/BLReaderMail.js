BLEditor.domReady(function() {
                finishLoadScript();
                  
               var preloader = new BLEditor.ImgPreloader();
                  preloader.start();
               
               });
var currScale = $scale$, scale, outsideScreenWidth = $screenWidth$, pageWidth = outsideScreenWidth-2*20, isLandscape = $isLandscape$, trueScreenHeight = $trueScreenHeight$, isGroupMail = $isGroupMail$,documentNotLandScrollWidth=0,isFromOnloadFix=false,isAdMail = $isAd$,fontSize = $contentsize$,nodeArray = new Array(), sizeArray = new Array(),
log = function(m) {
    window.document.location = "ios-log:" + m;
},
_onloadRefreshTimer = setInterval(function() {
                                  if (/loaded|complete|interactive/.test(document.readyState)) {
                                    clearInterval(_onloadRefreshTimer);
                                    fixScale();
                                  }
                                  }, 20),
onloadGetHeight = function(){
    var scrollHeightOrg = document.body.offsetHeight + 32;
    var style = document.createElement('style');
    style.textContent = ' div { height: auto !important; }';
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    var scrollHeight = document.body.offsetHeight + 32;
    style.parentNode.removeChild(style);
    if(scrollHeightOrg>scrollHeight)
    {/*如果原来的scrollHeightOrg值比改变布局后的大，就按改变布局之前的值*/
        scrollHeight = scrollHeightOrg;
    }
    return scrollHeight;
},
hasFoldToggle = function(){
    return !!$('mail_fold_toggle');
},
imgSourceArray = new Array(),

replaceAllImageSource = function() {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        imgSourceArray[i] = imgs[i].src;
        imgs[i].src = "bl_reader_icon_pic@2x.png";
        imgs[i].style.border = "1px solid #e6e6e6";
        imgs[i].style.minWidth = "10px";
        imgs[i].style.minHeight = "10px";
        
        
    }
},

replaceAllImageSource1 = function(array) {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        imgSourceArray[i] = imgs[i].src;
        for(var j = 0; j < array.length; j ++){
            var info = array[j];
            if(imgs[i].src == info.cid){
                //找到
                imgs[i].src = info.src;
            }
        }
    }
},

replaceAllImageSource2 = function(array) {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        imgSourceArray[i] = imgs[i].src;
        for(var j = 0; j < array.length; j ++){
            var info = array[j];
            if(imgs[i].src == info.cid){
                //找到
                imgSourceArray[i] = info.src;
                if(info.download){
                    imgs[i].src = info.src;
                }
                else{
                    imgs[i].src = "bl_reader_icon_pic@2x.png";
                    imgs[i].style.minWidth = "10px";
                    imgs[i].style.minHeight = "10px";
                    
                }
            }
           
        }
    }
},

reLoadAllImageSource = function() {
    
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        imgs[i].src = imgSourceArray[i];
    }
    if (document.body.scrollWidth - pageWidth > 45) {
        fixScale();
    }
},
reLoadAllImageSourceByArray = function(array) {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        if (array[i]){
            imgs[i].src = array[i];
        }
    }
    if (document.body.scrollWidth - pageWidth > 45) {
        fixScale();
    }
},


reLoadAllImageSourceByArray1 = function(array) {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i ++) {
        var url = imgSourceArray[i];
        if (url.indexOf('cid:') == 0){
            for(var j = 0 ; j < array.length; j ++){
                var info = array[j];
                if(url == info.cid){
                    imgs[i].src = info.src;
                }
            }
        }else{
           imgs[i].src = imgSourceArray[i];
            
        }
    }
    
    if (document.body.scrollWidth - pageWidth > 45) {
        fixScale();
    }
},

reLoadAllImageSourceByArray2 = function() {
    var imgs = document.getElementsByTagName("img");
    var pageTimer = {} ;
    var imgObjects = [];
    var xx = (function(){
              var k = 0;
              for(var j = 0; j < imgObjects.length; j ++){
                var img1 = imgObjects[j];
                if(img1.bl_complete || img1.bl_error){
                    k++;
                }
              }
              if(k == imgObjects.length){
                window.location.href = 'blreader://loadInlineImageSuccess';
              }
              });
   
    for (var i = 0; i < imgs.length; i ++) {
        imgs[i].src = imgSourceArray[i];
        var img = new Image();
        imgObjects.push(img);
        
        (function(img){
         img.onload = function() {
            img.bl_complete = 1;
            setTimeout(xx,0);
            img.onload = null;
            img.onerror = null;
         }
        
         img.onerror = function() {
            setTimeout(xx,0);
            img.bl_error = 1;
            img.onload = null;
            img.onerror = null;
        }
        
        img.src = imgSourceArray[i];
         })(img);
    }
    
    if (document.body.scrollWidth - pageWidth > 45) {
        fixScale();
    }
},

isFromOrientation = false,
tableArray =  new Array(),
fixMaxScale = 2.0,
fixScale = function() {
    if (parseInt(currScale * 10) != 10) {
        _removeTableScale();
        return;
    }
    var imgStyleArray = new Array;
    var imgOrgWidthArray = new Array;
    var imgs = document.getElementsByTagName("img");
    var screenWidth = isLandscape ? trueScreenHeight : outsideScreenWidth;
    for (var i = 0; i < imgs.length; i ++) {
        if(imgs.length<200) {
            imgOrgWidthArray.push(imgs[i].scrollWidth);
            if(imgs[i].clientWidth>screenWidth) {
                var scaleImage = (screenWidth/(imgs[i].clientWidth))*2;
                if(scaleImage>fixMaxScale){
                    fixMaxScale = scaleImage;
                }
    //            alert("imgs[i].clientWidth"+imgs[i].clientWidth);
            }
        }
        imgs[i].style.maxWidth = "1px";//(screenWidth - (isGroupMail?52:28)) + 'px';
        imgs[i].style.height = "auto";
        imgs[i].style.maxHeight = "none";
    }
    var imgstable =  document.querySelectorAll("table img");
    for (var i = 0; i < imgstable.length; i ++) {
        imgstable[i].style.maxWidth = "none";
        imgstable[i].style.height = "";
        imgstable[i].style.maxHeight = "none";
    }
    if(imgs.length<200) {
        for (var i = 0; i < imgs.length; i ++) {
            if(getComputedStyle(imgs[i])["maxWidth"] != "none"){
                if(imgOrgWidthArray[i]>50) {
                    var textPadding = 0;
                    if(imgs[i].parentNode) {
                        textPadding =  parseInt(getComputedStyle(imgs[i].parentNode)["padding-left"]);
                    }
                    var textIndent =  parseInt(getComputedStyle(imgs[i])["text-indent"]);
                    imgs[i].style.marginLeft = "-" + (textIndent + textPadding) +"px";
                }
            }
        }
    }
    
    
    if(parseInt(isAdMail * 10) == 10 && imgstable.length>1) {
        _removeTableScale();
    } else {
        if(imgstable.length>3) {
            _removeTableScale();
        } else {
            if(isFromOrientation) {
                _fixTableWhenorientChange();
            } else {
                _fixTableScale();
            }
        }
    }
    // 先添加最大宽度限制，如果还需要继续压则使用js重设
    /*
     if(document.getElementById('mailcontent')){
     document.getElementById('mailcontent').className = 'mailcontent mail_didload';
     }
     */
    var documentScrollWidth = document.body.scrollWidth;
    
    if (!isFromOnloadFix) {
        if(!isLandscape && documentNotLandScrollWidth==0){
            documentNotLandScrollWidth = document.body.scrollWidth;
        }
        if(!isLandscape && documentNotLandScrollWidth!=0){
            documentScrollWidth = documentNotLandScrollWidth;
        }
    }
    
    
    var scrollWidthStr = "documentScrollWidth" + documentScrollWidth;
    var screenWidthStr = "screenWidth"+screenWidth;
    log(scrollWidthStr+screenWidthStr);
   
    if (documentScrollWidth > screenWidth) {
        var viewport = document.getElementById("viewport"),
        height;
        for (var i = 0; i < imgs.length; i ++) {
            imgs[i].style.maxWidth = "none";
            imgs[i].style.height = "";
            imgs[i].style.maxHeight = "none";
            
        }
        _removeTableScale();
        
        scale = screenWidth / (document.body.scrollWidth + 10);
        pageWidth = document.body.scrollWidth;
        
        if (scale > .0) {
            window.location.href = 'blapp:' + scale;
        }
        
        viewport.content = "initial-scale=" + scale + ", user-scalable=yes, maximum-scale=2.0";
    } else {
        for (var i = 0; i < imgs.length; i ++) {
            imgs[i].style.maxWidth ='100%';
        }
        for (var i = 0; i < imgstable.length; i ++) {
            imgstable[i].style.maxWidth = "none";
        }
        if(fixMaxScale>10.0){
            fixMaxScale  = 10.0;
        }
        document.getElementById("viewport").content = "initial-scale=1, user-scalable=yes, maximum-scale="+fixMaxScale;
//        alert("fixMaxScale"+fixMaxScale);
    }
}

var orientFixScale = function(isLand) {
    isLandscape = isLand;
    log("orientFixScale isLand"+isLandscape);
    if(isFromOnloadFix && parseInt(currScale * 10) != 10){
        
    } else {
        document.getElementById("viewport").content = "initial-scale=1, user-scalable=yes, maximum-scale=2.0";
    }
    if(!isFromOnloadFix){
        currScale = 1;
    }
    for (var i = 0, l = tableArray.length; i < l; i++){
        tableArray[i].style.cssText =  "overflow:hidden;";
    }
    isFromOrientation = true;
    fixMaxScale = 2.0;
    fixScale();
}

function _fixTableWhenorientChange() {
    var _oDomAreas = document.querySelectorAll(".blTableArea");
    for (var i = 0, l = _oDomAreas.length; i < l; i++) {
        var _oDomArea = _oDomAreas[i];
        //要过滤内area
        if (getComputedStyle(_oDomArea)["overflow"] != "visible") {
            var firstChild = _oDomArea.firstChild;
            var isFirstChildTable = (firstChild.tagName=="TABLE");
            var _aDomTables = _oDomArea.querySelectorAll("table");
            var _oDomTable = _aDomTables[0],
            _nTableWidth = _oDomTable.scrollWidth;
            var screenWidth = isLandscape ? trueScreenHeight : outsideScreenWidth;
            screenWidth = (screenWidth - (isGroupMail?52:28));
            if(_oDomArea.clientWidth>screenWidth){
                screenWidth = _oDomArea.clientWidth;
            }
            _nScale = screenWidth  / (_nTableWidth + 5);
            var offset = 0;
            if(!isFirstChildTable){
                offset =  _oDomArea.clientHeight - _oDomTable.clientHeight;
                if(offset>30){
                    offset = 30;
                }
            }
            
            var scaleTable = (1/_nScale)*2;
            if(scaleTable>fixMaxScale){
                fixMaxScale = scaleTable;
            }
//            alert("scaleTable"+scaleTable);
            var _oDomAreaWidthstr = "screenWidth=" + screenWidth;
            var _nTableWidthstr = "_nTableWidth=" + _nTableWidth;
            var _nScale2str = "_nScale2="+_nScale;
            var str = _oDomAreaWidthstr+_nTableWidthstr+_nScale2str;
            log(str);
            //少于说明需要缩少
            //                        if (_nScale < 1) {
            //计算偏移百分比(由于是中心缩放，缩放后需要平移到左上角位置
            var _nTranslate = (1 - _nScale) * 100 / (2 * _nScale);
            //设置样式
            _oDomTable.style.webkitTransform = "scale(" + _nScale + ") translate(-" + _nTranslate + "%,-" + _nTranslate + "%)";
            _oDomTable.style.marginLeft = "0";
            _oDomTable.style.marginRight = "0";
            //由于缩放后，占位不变，外面高度也需要调整
            //                            _oDomArea.style.height = (_oDomTable.scrollHeight * _nScale) + "px";
            var h = (_oDomTable.scrollHeight * _nScale + offset) + 50;
            _oDomArea.style.cssText =  "height:" + h  + "px !important;overflow:visible;";
            //                        }
        }
    }
}

function _fixTableScale() {
    var _oDomAreas = document.querySelectorAll(".blTableArea");
    for (var i = 0, l = _oDomAreas.length; i < l; i++) {
        var _oDomArea = _oDomAreas[i];
        //要过滤内area
        if (getComputedStyle(_oDomArea)["overflow"] != "visible") {
            var firstChild = _oDomArea.firstChild;
            var isFirstChildTable = (firstChild.tagName=="TABLE");
            var _aDomTables = _oDomArea.querySelectorAll("table");
            var _oDomTable = _aDomTables[0],
            _nTableWidth = _oDomTable.scrollWidth,
            //计算缩放比例
            _nScale = _oDomArea.clientWidth  / (_nTableWidth + 5);
            var offset = 0;
            if(!isFirstChildTable){
                offset =  _oDomArea.clientHeight - _oDomTable.clientHeight;
                if(offset>30){
                    offset = 30;
                }
            }
            //少于说明需要缩少
            if (_nScale < 1) {
                var scaleTable = (1/_nScale)*2;
                if(scaleTable>fixMaxScale){
                    fixMaxScale = scaleTable;
                }
//                alert("scaleTable"+scaleTable);
//                alert("fixMaxScale"+fixMaxScale);
                //计算偏移百分比(由于是中心缩放，缩放后需要平移到左上角位置
                var _nTranslate = (1 - _nScale) * 100 / (2 * _nScale);
                //设置样式
                _oDomTable.style.webkitTransform = "scale(" + _nScale + ") translate(-" + _nTranslate + "%,-" + _nTranslate + "%)";
                _oDomTable.style.marginLeft = "0";
                _oDomTable.style.marginRight = "0";
                //由于缩放后，占位不变，外面高度也需要调整
                //                            _oDomArea.style.height = (_oDomTable.scrollHeight * _nScale) + "px";
                var h = (_oDomTable.scrollHeight * _nScale) + 20;
                _oDomArea.style.cssText =  "height:" + (h+offset)  + "px !important;overflow:visible;";
                tableArray.push(_oDomArea);
            } else {
                _oDomArea.style.cssText =  "overflow:visible;";
                tableArray.push(_oDomArea);
            }
        }
    }
}

function _removeTableScale() {
    tableArray = new Array();
    var _oDomAreas2 = document.querySelectorAll(".blTableArea");
    for (var i = 0, l = _oDomAreas2.length; i < l; i++) {
        var _oDomArea = _oDomAreas2[i];
        var _aDomTables = _oDomArea.querySelectorAll("table");
        var _oDomTable = _aDomTables[0];
        _oDomArea.style.cssText =  "height:auto;";
        _oDomArea.className = "";
        _oDomTable.style.webkitTransform = "";
    }
}



var noticeImageCount = function(){
    var imgs = document.getElementsByTagName("img");
    $callImageLength$
}


var _oDomContent,
_oDomContainer,
_bIsHide = true,
_nStartPoint,
_nContentHeight,
_nStartHeight,
_nTrueHeight,
_nTimer;
var hideSpace =function(){
    $("mailFoldSpace").style.height = '0px';
}
var foldAnimation = function(height) {
    
    _oDomContent = $("mail_fold_toggle");
    _oDomContainer = $("mailFoldWrap");
    if(_nTrueHeight>0){
        _nContentHeight = _nTrueHeight;
    }else{
        _nContentHeight = $("mail_fold").offsetHeight;
    }
    if (height>0){
        _nStartPoint = height;
    }else{
        _nStartPoint = _nContentHeight;
    }
    
    
    
    if(_nContentHeight > _nStartPoint)
    {
        _nContentHeight = _nStartPoint;
    }
    if(_bIsHide){
        //$("mailFoldSpace").style.height = '0px';
        _oDomContent.innerHTML = '隐藏引用<span class="mail_fold_toggle_open">↑</span>';
        _oDomContainer.style.height = '';
        $('mail_fold').style.display = 'block';
        //_nStartHeight = 0;
    }else{
        $("mailFoldSpace").style.height = '0px';
        _oDomContent.innerHTML = '显示引用<span class="mail_fold_toggle_close">↓</span>';
        _oDomContainer.style.height = '0';
        $('mail_fold').style.display = 'none';
        window.location.href = 'blfoldtogglehidefinish:';
        //_nStartHeight = _nContentHeight;
    }
    _bIsHide = !_bIsHide;
}

window.onload = function() {
    clearInterval(_onloadRefreshTimer);
    if (document.body.scrollWidth - pageWidth > 15) {
        fixScale();
    }
//    var onloadDelateTimer = setInterval(function() {
//                                        clearInterval(onloadDelateTimer);
//            if (document.body.scrollWidth - pageWidth > 45) {
//                isFromOnloadFix = true;
//                orientFixScale(isLandscape);
//                isFromOnloadFix = false;
//            }
//                                        },10);
    
//    if($('mailFoldWrap')){
//        $('mailFoldWrap').style.display = 'block';
//        _nTrueHeight = $('mailFoldWrap').offsetHeight;
//        $('mailFoldWrap').style.display = 'none';
//    }
    
    //添加用户touch事件
    if(window.blTouchHandler) {
        window.blTouchHandler.addLongPressImageHandler();
    }
}

function $(id) { return document.getElementById(id) }
var showMailFoldWrap = function(){
    $('mailFoldWrap').style.display = 'block';
    if(!_nTrueHeight) {
        _nTrueHeight = $('mailFoldWrap').offsetHeight;
    }
}

var hasImages = function(){
    var imgs = document.getElementsByTagName("img");
    return imgs ? imgs.length : 0;
}

var formatFoldContent = function(){
    var foldContent = $("mail_fold");
    if(foldContent == null) {
        return;
    }
    var foldParent = foldContent.parentNode;
    if(foldParent == null) {
        return;
    }
    var next = foldContent.nextSibling;
    while(next!=null){
        foldParent.removeChild(next);
        foldContent.appendChild(next);
        next = foldContent.nextSibling;
    }
}

//var averageFontSize = function(){
//    var divs = document.getElementsByTagName("div");
//    var ps = document.getElementsByTagName("p");
//    var elements;
//    if(divs.length > ps.length){
//        elements = divs;
//    } else {
//        elements = ps;
//    }
//    var count = elements.length;
//    if (count>5){
//        count = 5;
//    }
//    var average = 0;
//    for (var i = 0; i < count; i ++) {
//        average += parseFloat(window.getComputedStyle(elements[i]).fontSize);
//    }
//    return average/count;
//}

var changeFontSize = function(){
//    averageFontSize = averageFontSize();
    var mailcontent = $("mailcontent");
    nodeArray = new Array();
    sizeArray = new Array();
    changeFontSizeForNote(mailcontent);
    var averageFontSize = 0;
    for (var j = 0; j < sizeArray.length; j ++) {
        averageFontSize = sizeArray[j] + averageFontSize;
    }
    averageFontSize = averageFontSize/sizeArray.length;
    for (var i = 0; i < nodeArray.length; i ++) {
        nodeArray[i].style.fontSize = sizeArray[i]/averageFontSize*fontSize + "px";
        if(nodeArray[i].style.lineHeight){
            var lineHeightStr = ""+nodeArray[i].style.lineHeight;
            if(lineHeightStr.substr(lineHeightStr.length-1)!='%'){
                var oldLineHeight = parseFloat(window.getComputedStyle(nodeArray[i]).lineHeight);
                if(oldLineHeight) {
                    nodeArray[i].style.lineHeight = oldLineHeight/averageFontSize*fontSize + "px";
                }
            }
        }
            
        if(nodeArray[i].style.height){
            var heightStr = ""+nodeArray[i].style.height;
            if(heightStr.substr(heightStr.length-1)!='%'){
                var oldHeight = parseFloat(window.getComputedStyle(nodeArray[i]).height);
                if(oldHeight) {
                    nodeArray[i].style.height = oldHeight/averageFontSize*fontSize + "px";
                }
            }
        }
    }
}

var changeFontSizeForNote = function(node){
    if(((!node.className) || node.className != "blTableArea") && node.tagName){

        var oldFontSize = parseFloat(window.getComputedStyle(node).fontSize);
//        var newFontSize = oldFontSize/averageFontSize*fontSize;
        nodeArray.push(node);
//        sizeArray.push(newFontSize+"px");
        sizeArray.push(oldFontSize);
        var childElements = node.childNodes;
        for (var i = 0; i < childElements.length; i ++) {
            changeFontSizeForNote(childElements[i]);
        }
    }
}

var finishLoadScript = function(){
    changeFontSize();
    formatFoldContent();
    var imgs = document.getElementsByTagName("img");
    var imgstable =  document.querySelectorAll("table img");
    if(imgstable.length <= imgs.length/2) {
        var firstDiv =  document.querySelectorAll("#mailcontent > div");
        for (var i = 0; i < firstDiv.length; i ++) {
            firstDiv[i].className += " selfdiv";
        }
        var firstP =  document.querySelectorAll("#mailcontent > p");
        for (var j = 0; j < firstP.length; j ++) {
            firstP[j].className += " selfdiv";
        }
    }
    $replaceAllImageSource$
//    replaceAllImageSource();
//    reLoadAllImageSource();
    
    if($('btn_display_image')){
        $('btn_display_image').addEventListener('click', function () {
                                                    _nTimer && clearTimeout(_nTimer);
                                                    window.location.href = 'blreader://showInlineImages';
                                                    $('btn_display_image').setAttribute('style', "display:none");
                                                });
    }

}

var getAllImages = function() {
    var imgElements = document.getElementsByTagName("img");
    imgElements = [].slice.apply(imgElements);
    var imgSrcs = [];
    for(var i = 0; i < imgElements.length; i++) {
        var imgElem = imgElements[i];
        if(imgElem.src) {
            imgSrcs.push(imgElem.src);
        }
    }
    return JSON.stringify(imgSrcs);
}

var showInlineAttachmentTaped = function() {
    alert("test");
}

var showInlineAttachmentButton = function(){
    var btn_display_image = document.getElementById("btn_display_image");
    btn_display_image.setAttribute('style', "display:block");
}

var showInlineAttachmentSize = function(info){
    var btn_image_text = document.getElementById("display_text_id");
    btn_image_text.innerHTML = info.fileSize;
}



