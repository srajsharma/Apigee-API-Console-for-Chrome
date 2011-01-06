// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
var _gaq = _gaq || [];
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
    strictMode: false,
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

var APIGEE_CONSOLE = function () {
    var pagesOfInterest = [new RegExp('twitter.com$'), new RegExp('facebook.com$'), new RegExp('simplegeo.com$')],
    endpointMap = {"api.twitter.com" : "twitter", "twitter.com" : "twitter", "dev.twitter.com" : "twitter",
                       "graph.facebook.com" : "facebook", "facebook.com" : "facebook"},
    consoleLinkPrefix = "https://app.apigee.com/console/#apimet=",
    consoleLinkSuffix = encodeURIComponent("__apiidx__=null__apisecure__=true__apiprovider__=others"),
    urls = [],

    loadWADL = function (wadl, api) {
        var xhttp = new XMLHttpRequest(), exampleNodes;
        xhttp.open("GET", chrome.extension.getURL("wadl/" + wadl), false);
        xhttp.send();
        exampleNodes = xhttp.responseXML.getElementsByTagName('example');
        for (var count = 0; count < exampleNodes.length; count++) {
            urls.push(api + exampleNodes[count].attributes.url.nodeValue);
        }
    },

    fixUrl = function (url) {
        if (url.indexOf('http') !== 0) {
            url = 'http://' + url;
        }
        return url;
    },

    getApigeeConsoleEndpoint = function (url) {
        return endpointMap[url.host] !== undefined ? endpointMap[url.host] : 'others';
    },

    buildApigeeConsoleUrl = function (url) {
        url = parseUri(fixUrl(url));
        var consoleUrl = consoleLinkPrefix.replace('console/', 'console/' + getApigeeConsoleEndpoint(url)) +
                encodeURIComponent(url.source) +
                consoleLinkSuffix.replace('others', getApigeeConsoleEndpoint(url));
        return consoleUrl;
    },

    navigate = function (url) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.create({url: url});
        });
    }

    return {
        init : function () {
            loadWADL('facebook-wadl.xml', 'https://graph.facebook.com');
            loadWADL('simplegeo-wadl.xml', 'http://api.simplegeo.com/0.1');
            loadWADL('twitter-wadl.xml', 'http://api.twitter.com/1');
        },

        navigate : function (url, sameTab) {
            url = buildApigeeConsoleUrl(url);
            chrome.tabs.getSelected(null, function (tab) {
                if (sameTab) {
                    chrome.tabs.update(tab.id, {url: url});                    
                } else {
                    chrome.tabs.create({url: url});
                }
            });
        },

        isPageOfInterest : function(url) {
            for (var page in pagesOfInterest) {
                if (pagesOfInterest[page].exec(url.host) !== null) {
                    return true;
                }
            }
            return false;
        },

        suggestUrls : function(text) {
            var result = [];
            for (var i in urls) {
                if (urls[i].search(text) > 0) {
                    result.push(urls[i]);
                }
            }
            return result;
        }
    }
}();
APIGEE_CONSOLE.init();

var CHROME_EXT_UTIL = function() {
    return {
        init : function() {
            
            chrome.browserAction.onClicked.addListener(function(tab) {
                chrome.tabs.executeScript(null, {file: "js/anywhere.js"});
            });
            // This event is fired with the user accepts the input in the omnibox.
            // Listen for any changes to the URL of any tab.
            chrome.contextMenus.create({"title": "Explore with Apigee", "contexts":["link", "selection"],
                "onclick": function (info, tab) {
                    try {
                        _gaq.push(['_trackEvent', 'ContextMenu', info.linkUrl]);
                        APIGEE_CONSOLE.navigate(info.linkUrl || info.selectionText);
                    } catch (err) {
                        alert('Please enter a valid url' + err);
                    }
                }});

            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                var url = parseUri(tab.url);
                if (APIGEE_CONSOLE.isPageOfInterest(url)) {
                    // ... show the page action.
                    chrome.pageAction.show(tabId);
                    chrome.pageAction.setTitle({'tabId' : tabId , 'title':'Explore ' + url.host + " APIs at Apigee"});
                }
            });

            chrome.pageAction.onClicked.addListener(function(tab) {
                APIGEE_CONSOLE.navigate(tab.url);
            });

            // This event is fired with the user accepts the input in the omnibox.
            chrome.experimental.omnibox.onInputEntered.addListener(
                    function (text) {
                        try {
                            _gaq.push(['_trackEvent', 'Omnibox', text]);
                            APIGEE_CONSOLE.navigate(text, true);
                        } catch (err) {
                            alert('Please enter a valid url');
                        }
                    });

            chrome.experimental.omnibox.onInputChanged.addListener(
                    function (text, suggest) {
                        if (text === '') {
                            return;
                        }

                        var res = [];
                        var suggestedUrls = APIGEE_CONSOLE.suggestUrls(text);
                        for (var i in suggestedUrls) {
                            res.push({
                                    content: suggestedUrls[i],
                                    description: suggestedUrls[i],
                                    descriptionStyles: [chrome.experimental.omnibox.styleNone(1)]
                                });
                        }
                        suggest(res);
                    }
                    );
        },
        navigate : function(url) {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.create({url: url});
            });            
        },
        exploreApis : function() {
            chrome.tabs.getSelected(null, function(tab) {
                APIGEE_CONSOLE.navigate(tab.url);
            });
        }
    };
}();
CHROME_EXT_UTIL.init();
_gaq.push(['_setAccount', 'UA-18610744-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();