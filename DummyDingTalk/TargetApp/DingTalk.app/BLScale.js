var scaleImageWhenReady = {};

(function (context) {
    console = new Object();
    console.log = function(log) {
    var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", "ios-log:#iOS#" + log);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    };
    console.debug = console.log;
    console.info = console.log;
    console.warn = console.log;
    console.error = console.log;
 
    var undef = undefined;
 
    var screenWidth = $screenWidth$;
    var W = window, D = W.document;
    var transformKeys = [ "webkitTransformOrigin", "webkitTransform"];
    var root = (typeof exports == 'undefined' ? window : exports);

    var isRetina, originalBodyWidth;

    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16).substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                   s4() + '-' + s4() + s4() + s4();
        };
    })();

    var cachedOffsetMap = {};

    function checkRetina() {
        if (isRetina != undefined) {
            return isRetina;
        }

        var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
                          (min--moz-device-pixel-ratio: 1.5),\
                          (-o-min-device-pixel-ratio: 3/2),\
                          (min-resolution: 1.5dppx)";

        if (root.devicePixelRatio > 1) {
            isRetina = true;

        } else if (root.matchMedia && root.matchMedia(mediaQuery).matches) {
            isRetina = true;

        } else {
            isRetina = false;
        }

        return isRetina;
    }

    Date.now = Date.now || function (o) {
        return new Date().getTime();
    };

    Function.prototype.wait = Function.prototype.wait || function (cond, scope, that) {
        var t = this, waitFn = function () {
            if (cond.call(scope || W)) {
                t.call(that || scope || W);
            } else {
                W.setTimeout(waitFn, 200);
            }
        };

        waitFn();
    };

    String.prototype.contains = String.prototype.contains || function (pattern) {
        return this.indexOf(pattern) > -1;
    }

    Array.prototype.contains = Array.prototype.contains || function (item, from) {
        return this.indexOf(item, from) != -1;
    };

    Array.prototype.indexOf = Array.prototype.indexOf || function (item, from) {
        var length = this.length >>> 0;
        for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
            if (this[i] === item) {
                return i;
            }
        }
        return -1;
    };

    function isTable(node) {
        return node.nodeName.toLowerCase() == "table";
    }

    function isImage(node) {
        return node.nodeName.toLowerCase() == "img";
    }

    function isImageComplete(image) {
        var complete = image.complete;
        return complete != undef ? complete : image.readyState == "complete";
    }

    function unbindEvent(image) {
        image.onload = image.onerror = image.sqmIsLoading = null;
    }

    function getImageWidth(image) {
        var naturalWidth = image.naturalWidth;
        return (isImage(image) && naturalWidth != undefined) ? naturalWidth : image.offsetWidth;
    }

    function getImageHeight(image) {
        var naturalHeight = image.naturalHeight;
        return (isImage(image) && naturalHeight != undefined) ? naturalHeight : image.offsetHeight;
    }

    var TIMEOUT = 1000 * 20, IMAGE_INTERVAL = 100;

    function watchInFlight(self) {
        var taskList = self.__oTaskList, size = taskList.length;

        if (!size) {
            self.clearTimer();
            return;
        }

        var callbackArray = [];
        var imageToUpdateArray = [];
        var now = Date.now();
        for (var i = size - 1; i >= 0; i--) {
            var judge = 0, task = taskList[i];

            try {
                var currentWidth, currentHeight;
                var image = task.image, callback = task.callback;

                if (task.isComplete) {
                    currentWidth = getImageWidth(image);
                    currentHeight = getImageHeight(image);
                    if (currentWidth > 1 || currentHeight > 1) {
                        judge = 1;
                    }

                } else {
                    if (image.sqmIsError) {
                        judge = 2;

                    } else {
                        currentWidth = getImageWidth(image);
                        currentHeight = getImageHeight(image);
                        if (currentWidth != task.width || currentHeight != task.height || image.sqmIsLoaded) {
                            judge = 1;
                        }
                    }
                }

            } catch (e) {
                judge = 2;
            }

            if (judge == 0) {
                if (now - task.startTime > TIMEOUT) {
                    unbindEvent(image);
                    taskList.splice(i, 1);
                }

            } else {
                if (judge == 1 && callback) {
                    imageToUpdateArray.push(image);
                    callbackArray.push(callback);
                    // tangtai.cgt: calback()延迟到后面统一执行
                    // callback && callback();
                }

                unbindEvent(image);
                taskList.splice(i, 1);
            }
        }

        // 在任何一个node被修改前cache所有需要缩放的image的offset信息
        // 因为一旦一个node被修改，访问其他node的offset信息时候页面需要reflow，这会导致多图页面的性能问题
        // 因为image的缩放互相之间不影响，所以提前cache不会对结果产生影响
        for (var i = imageToUpdateArray.length - 1; i >= 0; --i) {
            var image = imageToUpdateArray[i];
            var $image = $(image);
            $image.css({margin : 0});
            unscaleNode($image);

            var cachedOffset = {};
            cachedOffset.left = image.offsetLeft;
            cachedOffset.width = image.offsetWidth;
            cachedOffset.height = image.offsetHeight;

            image.nodeUuid = guid();
            cachedOffsetMap[image.nodeUuid] = cachedOffset;
        }

        for (var i = callbackArray.length - 1; i >= 0; --i) {
            var callback = callbackArray[i];
            callback && callback();
        }

        // clear global offset cache
        cachedOffsetMap = {};
    }

    var ImageLoader = function () {
        this.__oTaskList = [];
    };

    ImageLoader.prototype = {
        addTask : function (task) {
            var self = this;

            task.startTime = Date.now();
            self.__oTaskList.push(task);

            var timerId = self.__sTimerId;
            if (!timerId) {
                self.__sTimerId = W.setInterval(function () {
                    watchInFlight(self);
                }, IMAGE_INTERVAL);
            }
        },
        clearTimer : function () {
            var self = this, timerId = self.__sTimerId;

            if (timerId) {
                W.clearInterval(timerId);
                delete self.__sTimerId;
            }
        }
    };

    var imageLoader = new ImageLoader();

    function waitForComplete(image, callback) {
        if (image.sqmIsLoading) {
            return;
        }

        image.sqmIsLoading = 1;
        var isComplete = isImageComplete(image);
        if (!isComplete) {
            image.onload = function () {
                image.sqmIsLoaded = 1;
            };

            image.onerror = function () {
                image.sqmIsError = 1;
            };
        }

        imageLoader.addTask({
            image : image,
            callback : callback,
            isComplete : isComplete,
            width : isComplete ? null : getImageWidth(image),
            height : isComplete ? null : getImageHeight(image)
        });
    }

    function findTopTableParent(node) {
        var parents = $(node).parents("table");
        var parentSize = parents.length;

        return parentSize ? parents[parentSize - 1] : node;
    }

    function fixTopTableParentNodes(nodes) {
        var convertList = [];
        for (var i = 0, size = nodes.length; i < size; i++) {
            var node = nodes[i];
            if (isTable(node)) {
                var currentNode = findTopTableParent(node);
                convertList.contains(currentNode) || convertList.push(currentNode);

            } else {
                convertList.push(node);
            }
        }

        return convertList;
    }

    function unscaleNode($node) {
        if ($node.parent().hasClass("aym_scale_wrap")) {
            $node.unwrap();
        }

        var restoreStyles = {};
        restoreStyles[transformKeys[0]] = "";
        restoreStyles[transformKeys[1]] = "";
        $node.css(restoreStyles);
    }

    function scaleNodeWidth(node) {
        var $node = $(node);
        $node.css({margin : 0});
        unscaleNode($node);

        var offsetLeft;
        var nodeWidth;
        var nodeHeight;

        var cachedOffset;
        if (node.nodeUuid)
            cachedOffset = cachedOffsetMap[node.nodeUuid];

        if (cachedOffset) {
            offsetLeft = cachedOffset.left;
            nodeWidth = cachedOffset.width;
            nodeHeight = cachedOffset.height;
            cachedOffsetMap[node.nodeUuid] = null;
        } else {
            offsetLeft = node.offsetLeft;
            nodeWidth = node.offsetWidth;
            nodeHeight = node.offsetHeight;
        }
 
        var currentMaxWidth = Math.max(originalBodyWidth - offsetLeft - 5, 0);
        if (nodeWidth > currentMaxWidth) {
            var percent, targetWidth, style = ["overflow:hidden;"];

            if (isImage(node)) {
                style.push("position:relative;");
                if (nodeWidth <= originalBodyWidth) {
                    style.push("left:" + (currentMaxWidth - nodeWidth) + "px;");
                    percent = 1;
                    targetWidth = nodeWidth;

                } else {
                    style.push("left:" + (-offsetLeft) + "px;");
                    percent = originalBodyWidth / nodeWidth;
                    targetWidth = originalBodyWidth;
                }

            } else {
                percent = currentMaxWidth / nodeWidth;
                targetWidth = currentMaxWidth;
            }

            var targetHeight = Math.ceil(nodeHeight * percent);
            // tangtai.cgt: 不理解，因为会影响性能先注释(offsetHeight访问性能问题)
            /*$node.wrap('<div class="temp_add_div_for_off_set"></div>');
            var nodeHeight = $('.temp_add_div_for_off_set')[0].offsetHeight;
            var targetHeight = Math.ceil(nodeHeight * percent);
            if ($node.parent().hasClass("temp_add_div_for_off_set")) {
                $node.unwrap();
            }*/
            if (percent != 1) {
                var targetStyles = {};
                targetStyles[transformKeys[0]] = "left top";
                targetStyles[transformKeys[1]] = "scale(" + percent + ")";
                $node.css(targetStyles);
            }

            style.push('height: ' + targetHeight + 'px;');
            style.push('width: ' + targetWidth + 'px;');
 
            $node.wrap('<div class="aym_scale_wrap" style="' + style.join("") + '"></div>');
            console.log('dispatch chance');
        }
    }

    function scaleWidth($parent) {
        var nodes = $parent.find("table,img");
        nodes = fixTopTableParentNodes(nodes);

        for (var i = 0, size = nodes.length; i < size; i++) {
            var node = nodes[i];
            if (isImage(node)) {
                // 处理src不是cid:开头的图片
                // cid:的图片将在replace之后进行缩放
                if ($(node).attr('src').indexOf('cid:') != 0) {
                    scaleImageWhenReady(node);
                }
            } else {
                // 缩放table
                scaleNodeWidth(node);
            }
        }
    }

    function hasExactWidth(node) {
        var w = node.style.width;
        if (w && (w.contains("px") || w.contains("pt"))) {
            return true;
        }

        w = node.getAttribute("width");
        return !!(w && !w.contains("%"));
    }

    var MIN_WIDTH = 800;

    function fixTableWidth2(nodes) {
        var size = nodes.length;
        if (size) {
            var $parent = $(document.body);
            var html = ['<div class="aym_table_fix_wrap" style="height: 1px;overflow: hidden;">'];
            html.push('<div style="width: ' + Math.max(D.body.offsetWidth, MIN_WIDTH) + 'px;height: 1px;"></div></div>');
            $parent.prepend(html.join(""));
            var $wrap = $parent.children(":first");
            var $wrapInner = $wrap.children(":first");

            for (var i = 0; i < size; i++) {
                var node = nodes[i];

                var previous = node.previousSibling, parent;
                if (!previous) {
                    parent = node.parentNode;
                }

                $wrapInner.append(node);
                node.style.width = "auto";
                node.style.width = node.clientWidth + "px";

                previous ? $(previous).after(node) : $(parent).prepend(node);
            }
            $wrap.remove();
        }
    }

    var min_multiple = 1;

    function fixTableWidth(nodes) {
        // 为了防止部分table auto后长宽严重失调，阅读性降低的问题
        // 处理方法是维持宽度为高度的一个比例
        // 如果这个宽度超出屏幕，则这个table会被另外一个步骤做整体缩小
        var size = nodes.length;
        if (size) {
            for (var i = 0; i < size; i++) {
                var node = nodes[i];
                $(node).removeAttr("width");
                $(node).removeAttr("height");
                node.style.width = "auto";
                var width = node.clientWidth;
                var height = node.clientHeight;

                var multiple = height / width;
                if (multiple > min_multiple) {
                    node.style.width = width * Math.pow(multiple, 1 / 3) + "px";
                    node.style.height = node.clientHeight;
                }
            }
        }
    }

    function fixTableChildrenHeight(table) {
        var i, size, node, nodes;
        nodes = $(table).find("[style*='height']");
        for (i = 0, size = nodes.length; i < size; i++) {
            node = nodes[i];
            node.style.height = "auto";
        }

        nodes = $(table).find("[height]");
        for (i = 0, size = nodes.length; i < size; i++) {
            node = nodes[i];
            node.setAttribute("height", "auto");
        }
    }

    function detactAndFixTableWidth($parent) {
        var toFixNodes = [];
        var nodes = fixTopTableParentNodes($parent.find("table"));
        for (var i = 0, size = nodes.length; i < size; i++) {
            var node = nodes[i];
            if (!hasExactWidth(node)) {
                fixTableChildrenHeight(node);
                toFixNodes.push(node);
            }
        }

        fixTableWidth(toFixNodes);
    }

    function detactBodyWidth($parent) {
        var nodes = $parent.find("table,img");
        nodes.hide();
        originalBodyWidth = document.body.scrollWidth;
        nodes.show();
    }

    function hasWidthClass(styles) {
        if (!styles) {
            return false;
        }

        for (var i = 0, size = styles.length; i < size; i++) {
            if (styles[i] == "width") {
                return true;
            }
        }

        return false;
    }

    function fixNodeWidth(nodes) {
        for (var i = 0, size = nodes.length; i < size; i++) {
            var node = nodes[i];
            if (node) {
                var name = node.nodeName.toLowerCase();
                if (name == "td" ||name == "p" || name == "div" || name == "blockquote" || name == "ol" || name == "ul") {
                    node.style.width = "auto";
                }
            }
        }
    }

    function fixAllBlockWidth($parent) {
        var styleNodes = $parent.find("style");
        for (var i = 0, size = styleNodes.length; i < size; i++) {
            var sheet = styleNodes[i].sheet;
            if (sheet) {
                 var rules = sheet.rules || sheet.cssRules;
                if (rules) {
                    for (var j = 0, ruleSize = rules.length; j < ruleSize; j++) {
                        var rule = rules[j];
 
                        if (rule.type == 1 && rule.style.cssText) {
                            try{
                                var hasWidth = hasWidthClass(rule.style);
                                var splitIndex = rule.selectorText.indexOf(":");
                                var className = splitIndex > 0 ? rule.selectorText.substring(0, splitIndex) : rule.selectorText;
 
                                hasWidth && fixNodeWidth($parent.find(className));
                            }catch(e){
                                console.log("js修正有bug "+ rule.selectorText);
                            }
                        }
                    }
                }
            }
        }

        fixNodeWidth($parent.find("[style*='width']"));
    }

    function fixInitialScale() {
        if (originalBodyWidth > screenWidth) {
            var viewport = document.getElementById("-richtext-viewport");
            var scale = screenWidth / (originalBodyWidth + 10);
            viewport.content = "initial-scale=" + scale + ",width=device-width, user-scalable=yes, maximum-scale=2.0";
        }
        // tangtai.cgt: 需要确保这个函数只被调一次，就不写else还原的部分了
        /*else {
            document.getElementById("-richtext-viewport").content = "width=device-width,initial-scale=1, user-scalable=yes, maximum-scale=6.0";
        }*/
    }

    context.scaleImageWhenReady = function(image) {
        (function (image) {
            waitForComplete(image, function () {
                var parent = findTopTableParent(image);
                if (isTable(parent)) {
                    // todo: 图片在table里面？比较复杂，缩放table吗？
                    parent.style.width = "";
                    fixTableWidth([parent]);
                }
              
                // 待img下载完成后缩放img
                scaleNodeWidth(parent);
            });
        })(image);
    };

    context.scale = function () {
        var $parent = $(document.getElementById("mailBody"));
 
        // 2015/06/07 lingxin bugfix #6144238
        // 阿里妈妈周报约定特殊标签，不做缩放
        if ($parent.find('[name="alimail-ios-no-scale-flag"]').length) {
            return;
        }
        
        // 所有img设为auto宽度，如果尺寸超出屏幕则需要控制大小，通过wrap一个div加scale进行处理
        // 处理时机是imageLoader的callback
        $parent.find("img").css({
            width : "auto",
            height : "auto"
        });

        // 移除所有引文的缩进
        $parent.find("blockquote").css({
            marginLeft : "0px"
        });
 
        // 不知道这句的用途
        $parent.find("title,meta").remove();
 
        // 所有写死width的对象改为auto宽度，根据其实际超出屏幕的情况做缩放
        fixAllBlockWidth($parent);
 
        // 计算originalBodyWidth，这个值是所有table/img隐藏之后的内容宽度
        // 过大的table/img最终要缩放到 max(originalBodyWidth, screenWidth)
        detactBodyWidth($parent);
 
        // 对长宽比例过大的table做比例限制
        detactAndFixTableWidth($parent);
 
        // 缩放超出正文宽度的table和img
        // table直接缩放
        // img待下载后缩放
        scaleWidth($parent);
 
        // 某些正文本身就超级宽，需要对最终结果做整体缩放
        // 目前出现过的例子有
        // 1. text-ident设置超大，比如右下角落款
        fixInitialScale();
    }

    // 将scaleImageWhenReady暴露给外部
    scaleImageWhenReady = context.scaleImageWhenReady;
})(window);
