;(function() {
    if (window._DingTalkWebViewJSTool) {
        return
    }

    function htmlElementsAtPoint(x, y) {
        var tags = ',';
        var e = document.elementFromPoint(x, y);
        while (e) {
            if (e.tagName) {
                tags += e.tagName + ',';
            }

            e = e.parentNode;
        }

        return tags
    }

    function imgElementSRCAtPoint(x, y) {
        var src = '';
        var e = document.elementFromPoint(x, y);
        while (e) {
            if (e.tagName === 'IMG' && e.src) {
                src = e.src;
                break;
            }
            e = e.parentNode;
        }

        return src;
    }

    function imgElementFrameAtPoint(x, y) {
        var frame = {};
        var e = document.elementFromPoint(x, y);
        while (e) {
            if (e.tagName === 'IMG' && e.src) {
                var rect = e.getBoundingClientRect();
                if (rect) {
                    frame = {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    };
                }
                else {
                    return "";
                }
                break;
            }
            e = e.parentNode;
        }

        return JSON.stringify(frame);
    }

    function linkElementHREFAtPoint(x, y) {
        var href = '';
        var e = document.elementFromPoint(x, y);
        while (e) {
            if (e.tagName === 'A' && e.href) {
                href = e.href;
                break;
            }

            e = e.parentNode;
        }

        return href;
    }

    function imgElementSRCsInDocument() {
        var imgElements = document.getElementsByTagName('IMG');
        var imgElementSRCs = [];

        Array.prototype.forEach.call(imgElements, function(imgElement) {

            var width = imgElement.clientWidth;
            var height = imgElement.clientHeight;

            if (imgElement.src && width > 0 && height > 0) {
                imgElementSRCs.push(imgElement.src);
            }
        });

        return JSON.stringify(imgElementSRCs);
    }

    window._DingTalkWebViewJSTool = {
        htmlElementsAtPoint: htmlElementsAtPoint,
        imgElementFrameAtPoint: imgElementFrameAtPoint,
        imgElementSRCAtPoint: imgElementSRCAtPoint,
        linkElementHREFAtPoint: linkElementHREFAtPoint,
        imgElementSRCsInDocument: imgElementSRCsInDocument
    }

})();