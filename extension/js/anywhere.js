function parseUri(str) {
    var o = parseUri.options,
            m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i = 14;

    while (i--) {
        uri[o.key[i]] = m[i] || "";
    }

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) {
            uri[o.q.name][$1] = $2;
        }
    });

    return uri;
}

parseUri.options = {
    strictMode: true,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

var ApigeePageUtils = new ApigeePageConstuctor;
function ApigeePageConstuctor() {
    var a = this;
    this.pageReady = true;
    this.consoleLinkClass = "apigee_console";
    this.consoleLinkTitle = "Apigee Test Console - opens in new window";
    this.consoleLinkPrefix = "https://app.apigee.com/console/#apimet=";
    this.consoleLinkSuffix = encodeURIComponent("__apiidx__=null__apisecure__=true__apiprovider__=others");
    this.endpointMap = new Array();
    this.endpointMap["api.twitter.com"] = "twitter";
    this.endpointMap["graph.facebook.com"] = "facebook";
    this.addStyle = function() {
        var d = document.getElementsByTagName("head")[0];
        var c = "a." + a.consoleLinkClass + ":link, a." + a.consoleLinkClass + ":visited {background: transparent url(http://apigee.com/sonoa/images/new_win.png) no-repeat 100% 50%; padding-right: 14px;}";
        var b = document.createElement("style");
        b.type = "text/css";
        if (b.stylesheet) {
            b.styleSheet.cssText = c
        } else {
            b.appendChild(document.createTextNode(c))
        }
        d.appendChild(b)
    };
    this.addEvent = function(d, c, b) {
        if (d.addEventListener) {
            d.addEventListener(c, b, false)
        } else {
            if (d.attachEvent) {
                d.attachEvent("on" + c, function() {
                    return b.apply(d, new Array(window.event))
                })
            }
        }
    };
    this.addClass = function(b, c) {
        if (!b.className) {
            b.className = c
        } else {
            if (b.className.indexOf(c) == -1) {
                b.className += (" " + c)
            }
        }
    };
    this.getTextNodes = function() {
        a.textNodes = new Array();
        var d = new Array();
        var b = document.getElementsByTagName("body")[0].childNodes;
        for (var e = 0; e < b.length; e++) {
            d.push(b[e])
        }
        for (var e = 0; e < d.length; e++) {
            var f = d[e];
            if (f.nodeType == 3) {
                a.textNodes.push(f)
            }
            b = f.childNodes;
            for (var c = 0; c < b.length; c++) {
                d.push(f.childNodes[c])
            }
        }
    };
    a.addStyle();
    a.addEvent(window, "load", function() {
        a.pageReady = true
    });
    a.addEvent(window, "load", a.getTextNodes)
    a.getTextNodes();
}
var ApigeeEverywhere = new ApigeeEverywhereConstructor;
function ApigeeEverywhereConstructor() {
    var a = this;
    this.console = function(e) {
        if (ApigeePageUtils.pageReady) {
            var o = ApigeePageUtils.textNodes;
            var pUri;
            for (var l = 0; l < o.length; l++) {
                var h = o[l];
                try {
                    pUri = null;
                    pUri = parseUri(h.data);
                    var d = e.toLowerCase();
                    if (pUri.host !== null && pUri.host !== "") {
                        //alert(pUri.host);
                        d = pUri.host.toLowerCase();
                    }
                    
                    var k = new RegExp("https?://" + d + "/?[^ ]*", "i");
                    var n = ApigeePageUtils.consoleLinkPrefix;
                    var q = ApigeePageUtils.consoleLinkSuffix;
                    if (ApigeePageUtils.endpointMap[d]) {
                        n = n.replace("/console/", "/console/" + ApigeePageUtils.endpointMap[d] + "/");
                        q = q.replace("others", ApigeePageUtils.endpointMap[d])
                    }
                    if (k.test(h.data)) {
                        var c = h.parentNode;
                        if (c.nodeName.toLowerCase() == "a") {
                            var g = h.parentNode;
                            g.href = n + encodeURIComponent(k.exec(h.data)) + q;
                            g.title = ApigeePageUtils.consoleLinkTitle;
                            ApigeePageUtils.addClass(g, ApigeePageUtils.consoleLinkClass);
                            g.onclick = function() {
                                window.open(this.href);
                                return false
                            }
                        } else {
                            var p = h.data.split(" ");
                            var m = new Array();
                            for (var f = 0; f < p.length; f++) {
                                var b = thatText = p[f];
                                if (k.test(b)) {
                                    thatText = '<a href="' + n + encodeURIComponent(k.exec(b)) + q + '" title="' + ApigeePageUtils.consoleLinkTitle + '" class="' + ApigeePageUtils.consoleLinkClass + '" onclick="window.open(this.href); return false;">' + b + "</a>"
                                }
                                m.push(thatText)
                            }
                            h.parentNode.innerHTML = m.join(" ")
                        }
                    }
                } catch(e) {
                }
            }
        } else {
            ApigeePageUtils.addEvent(window, "load", function() {
                a.console(e)
            })
        }
    }
}
;
ApigeeEverywhere.console('www.googleapis.com');