/**
 * uiwebview调用js的函数入口集合，统一管理
 */
BLEditor.evaluator = {};

//切换编辑器的可编辑态
BLEditor.evaluator.setEditableState = function(toState) {
    if(toState) {
        BLEditor.Viewer.instance.startEdit();
    } else {
        BLEditor.Viewer.instance.stopEdit();
    }
}

BLEditor.evaluator.contenteditable = function() {
    return BLEditor.Viewer.instance.editor.contenteditable();
}

//object-c 通知js端 可见区域的高度，以及初始状态headerBar的默认显示高度
BLEditor.evaluator.setWindowVisibleHeight = function(height , initialWidth , initialHeight) {
    BLEditor.Viewer.instance.editor.setDefaultVisibleHeight(height , initialWidth , initialHeight);
}

//object-c 通知js端 当前准确的contentOffset，一般来说js就能拿到，但是由于object-c端hack了原生的方法，导致某些情况下还有当前是负值的时候拿不到准确的contentOffset
BLEditor.evaluator.setCurrentOffset = function(x , y) {
    BLEditor.Viewer.instance.editor.updateCurrentOffset(x , y);
}

BLEditor.evaluator.excuteBridgeCallback = function() {
    BLEditor.NativeNotifier.excuteCallback.apply(BLEditor.NativeNotifier , [].slice.apply(arguments));
}

//处理来自粘贴的附件，将其保存到本地
BLEditor.evaluator.saveAttachmentsByPaste = function() {
    return BLEditor.Viewer.instance.editor.saveAttachmentsByPaste();
}

//成功保存后处理粘贴的图片
BLEditor.evaluator.markPasteImageSaved = function(imageIds , pasteImageAttachMents) {
    return BLEditor.Viewer.instance.editor.markPasteImageSaved(imageIds , pasteImageAttachMents);
}

//插入一个附件
BLEditor.evaluator.insertAttachment = function(attachInfo , otherOption) {
    BLEditor.Viewer.instance.editor.insertAttachment(attachInfo , otherOption);
}

BLEditor.evaluator.getBodyHeight = function() {
    return document.body.scrollHeight;
}

BLEditor.evaluator.getTextHeight = function() {
    return BLEditor.Viewer.instance.editor.getTextHeight();
}

BLEditor.evaluator.getTextWidth = function() {
    return BLEditor.Viewer.instance.editor.getTextWidth();
}

BLEditor.evaluator.setSpaceUponKeyboard = function(space) {
    return BLEditor.Viewer.instance.editor.setSpaceUponKeyboard(space);
}

//objec-c 端获得焦点
BLEditor.evaluator.becomeFirstResponder = function() {
//    alert("test1");
    BLEditor.Viewer.instance.editor._onFocus();
//    BLEditor.Viewer.instance.restoreStart();
    return true;
}

//objec-c 失去焦点
BLEditor.evaluator.resignFirstResponder = function() {
    BLEditor.evaluator.setEditableState(false);
    return true;
}

BLEditor.evaluator.becomBrowserFirstResponder = function() {

    var viewer  = BLEditor.Viewer.instance;
    var isFocus = viewer.rootElement.getAttribute("contenteditable");

    if(isFocus == 'false') {
        isFocus = false;
    }

    if(!isFocus) {
        viewer.startEdit();
        viewer.rootElement.focus();
    }
}

BLEditor.evaluator.resignBrowserFirstResponder = function() {
    
}

BLEditor.evaluator.getHtml = function() {
    return BLEditor.Viewer.instance.editor.getInnerHtml();
}

BLEditor.evaluator.setHtml = function(html) {
    BLEditor.Viewer.instance.editor.setInnerHtml(html);
}

BLEditor.evaluator.getTextContent = function() {
    return BLEditor.Viewer.instance.editor.getTextContent();
}

BLEditor.evaluator.getTextContentWithoutWhitespaceAndNewLines = function() {
    return BLEditor.Viewer.instance.editor.getTextContentWithoutWhitespaceAndNewLines();
}

//可以用来判断文本是否变化
BLEditor.evaluator.hasChanges = function() {
    return BLEditor.Viewer.instance.editor.hasChanges();
}

BLEditor.evaluator.playAudio = function(id) {
    var uiAttachment = BLEditor.AttachmentManager.shareInstance.getAttachmentById(id);
    if(uiAttachment) {
        BLEditor.Viewer.instance.editor.playAudio(uiAttachment);
        return true;
    } else {
        return false;
    }
}

BLEditor.evaluator.stopAudio = function(id) {
    var uiAttachment = null;
    if(id) {
        uiAttachment = BLEditor.AttachmentManager.shareInstance.getAttachmentById(id);
    }
    BLEditor.Viewer.instance.editor.stopAudio(uiAttachment);
}

BLEditor.evaluator.loadAudio = function(id) {
    var uiAttachment = BLEditor.AttachmentManager.shareInstance.getAttachmentById(id);
    if(uiAttachment) {
        BLEditor.Viewer.instance.editor.loadAudio(uiAttachment);
    }
}

//获取当前web的缩放尺寸
BLEditor.evaluator.getWebScale = function() {
    return BLEditor.Viewer.viewport.scale;
}

//获取附件信息
BLEditor.evaluator.getAttachments = function() {
    var result = {
        attachments : BLEditor.AttachmentManager.shareInstance.getAttachments()
    }
    return JSON.stringify(result);
}

//供objec-c端调用保存当前的选择区域
BLEditor.evaluator.storeCurrentSelection = function() {
    var editor = BLEditor.Viewer.instance.editor;
    editor.storeCurrentSelection();
}

///////////////以下方法供富文本编辑器使用/////////////////////////
BLEditor.evaluator.executeCommands = function(commands) {
    var editor = BLEditor.Viewer.instance.editor;
    editor.executeCommands(commands);
}

BLEditor.evaluator.insertOrderedList = function() {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.insertOrderedList();
}

BLEditor.evaluator.insertUnorderedList = function() {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.insertUnorderedList();
}

BLEditor.evaluator.indent = function() {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.indent();
}

BLEditor.evaluator.outdent = function() {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.outdent();
}

BLEditor.evaluator.formatBlock = function(value , preserveStyles) {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.formatBlock(value , preserveStyles);
}

BLEditor.evaluator.resetHtmlToText = function() {
    var editor = BLEditor.Viewer.instance.editor;
    editor.resetHtmlToText();
    BLEditor.AttachmentManager.shareInstance.consitentAttachmentsInCaseChanges();
}

BLEditor.evaluator.normalizeTextForElement = function() {
    var editor = BLEditor.Viewer.instance.editor;
    editor.normalizeTextForElement(editor.rootElement , {
        'background-color' : 'white'
    });
}

BLEditor.evaluator.insertCheckbox = function() {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.insertCheckbox(false);
}

BLEditor.evaluator.applyHyperlink = function(href , title) {
    var editor = BLEditor.Viewer.instance.editor;
    editor.applyHyperlink(href , title);
}

BLEditor.evaluator.queryCommandValue = function(command) {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.queryCommandValue(command);
}

BLEditor.evaluator.queryCommandEnabled = function(command) {
    var editor = BLEditor.Viewer.instance.editor;
    return editor.queryCommandEnabled(command);
}

BLEditor.evaluator.tryGetCurrentSelectionLinkInfo = function() {
    var editor = BLEditor.Viewer.instance.editor;
    editor.storeCurrentSelection();
    var link = editor.getCurrentSelectionParentElementByTagName("a");

    if(link) {
        return JSON.stringify({
            title : link.innerHTML || '',
            href  : link.getAttribute('href'),
            hasSelection : editor.hasTextSelection()
        });
    } else {
        return false;
    }
}

BLEditor.evaluator.canEdit = function(canEdit) {
    BLEditor.Viewer.instance.editor.canEdit = canEdit;
}

//获取上次产生变化的附件信息，如果信息很多的话通过url由于长度限制可能被截断，所以使用这种方案
BLEditor.evaluator.fetchLastChangesAttachmentsInfo = function() {

    var changesInfo = BLEditor.AttachmentManager.shareInstance.lastChangesAttachmentsInfo;
    var delSrcs = [];

    if(changesInfo) {
        var dels = changesInfo.dels;
        for (var i = 0; i < dels.length; i++) {
            delSrcs.push(dels[i].filePath);
        };
    } 

    return JSON.stringify(delSrcs);
}

BLEditor.evaluator.fetchLastDeleteAttachmentsInfo = function() {

    var changesInfo = BLEditor.AttachmentManager.shareInstance.lastChangesAttachmentsInfo;
    var delSrcs = [];

    if(changesInfo) {
        var dels = changesInfo.dels;
        for (var i = 0; i < dels.length; i++) {
            delSrcs.push(dels[i].filePath);
        };
    } 

    return JSON.stringify(delSrcs);
}


BLEditor.evaluator.replaceAttachesPathsToCids = function(m) {
    if (!m) {
        return
    }
    var j = document.getElementsByTagName("IMG");
    for (var l = 0; l < j.length; l++) {
        var n = j[l];
        var k = n.getAttribute("src");
        for(var index = 0 ; index < m.length; index ++)
        {

            var info = m[index];
            if(info.filepath.indexOf(k) == 0)
            {
                n.setAttribute("src", "cid:" + info.cid);
                break;
            }
        }
    }
}

BLEditor.evaluator.replaceAttachesCidsToPaths = function(m) {
    if (!m) {
        return
    }
    var n = false;
    var j = document.getElementsByTagName("IMG");
    for (var l = 0; l < j.length; l++) {
        var o = j[l];
        var p = o.getAttribute("src");
        if (p && p.substring(0, 4) == "cid:") {
            p = p.substring(4);
            
            for(var index = 0 ; index < m.length; index ++)
            {
                var info = m[index];
                if(info.cid.indexOf(p) == 0)
                {
                    if(info.filepath)
                    {
                        o.setAttribute("src", info.filepath);
                        var attachInfo = info.attachInfo;
                        var imgUi = new BLEditor.UIAttachment(o,attachInfo);
                        var editor = BLEditor.Viewer.instance.editor;
                        editor._attachImageElement(o , attachInfo);
                        BLEditor.AttachmentManager.shareInstance.addAttachment(imgUi);
                        n = true
                        break;
                    }
                }
            }
        }
    }
    if (n) {
        setTimeout(function() {
                   BLEditor.NativeNotifier.notify("adjustContentSizeToFitFromJs")
                   },
                   1000)
    }
}

BLEditor.evaluator.hideOrShowEditorPlaceholder = function(toState) {
    if(toState) {
        var placeholder = document.getElementById("tapToEdit");
        if(placeholder){
            placeholder.parentNode.removeChild(placeholder);
        }
    } else {
        
    }
}