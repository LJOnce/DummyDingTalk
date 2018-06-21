/** 
 * 编辑器的常量定义值
 */

var BLEditor = {
    versions : '0.1.0',
    config   : {
        contentId      : 'BLEditor',
        editorId       : 'BLEditor',
        caretMaker     : '&#8203;',   //占位符号
        fixImgMaxWidth : 295,
        fixImgMaxWidthLandspace : 440,
        notifyName     : 'bleditor',
        tailId         : 'editPlace',
        tapBodyToEnd   : true
    },
    CONST : {
        BL_INSERTED_AUDIO_TAG_NAME        : "object",
        BL_INSERT_ATTACHMENT_CLASS_NAME   : "bleditor-attach",
        BL_INSERT_IMAGE_CLASS_NAME        : "bleditor-image",
        BL_INSERTED_ELEMENT_CLASSNAME     : "bl-inserted",
        BL_INSERT_NATIVE_AUDIO_CLASSNAME  : 'ios-upload-audio',
        BL_INSERT_AUDIO_CLASSNAME         : 'ios-upload-blaudio',
        BL_INSERT_AUDIO_END_CLASSNAME     : 'ios-upload-end',
        BL_INSERT_AUDIO_PLAY_CLASSNAME    : 'ios-upload-playing'
    },
    domReady : function(callback) {
        document.addEventListener('DOMContentLoaded', function () {
            callback && callback();
        });
    }
}
