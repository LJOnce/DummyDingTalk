/**
 * 编辑器的入口初始化函数
 */


BLEditor.config.tapBodyToEnd = true;

BLEditor.domReady(function() {

    //当默认的currScale为1,0才缩放
    if(window.currScale * 10 == 10) {
        BLEditor.Viewer.viewport.on('beforeScaleTofix',function(scale){

            BLEditor.NativeNotifier.notify('setWebViewScaleFromJS', {
              scale : scale
            });
            //去掉该class保证自适应屏幕后图片布局不会因为mail_didload而影响
            document.getElementById('BLEditor').removeClass('editordidload');
        });
        //开启自动缩放  
        BLEditor.Viewer.viewport.shouldScaleToFix = true;
    }
    //开启图片loading的边框
    BLEditor.Viewer.instance.showImageLoading = true;
    BLEditor.Viewer.instance.ready();

    //清除空的apple-style-span
    BLEditor.Viewer.instance.rootElement.removeEmptyAppleStyleSpans();

     //将原始的audio标签替换为app需要展现的形式
    BLEditor.AttachmentManager.shareInstance.makeElementsToAttachments();

    //保存初始化时的文本用于比较差异
    BLEditor.Diffs.shareInstance.saveCurrentText();

    BLEditor.NativeNotifier.notify('domContentLoadedFromJs');

    //用于debug光标位置的
    // BLEditor.Debug.showCursor();
});
