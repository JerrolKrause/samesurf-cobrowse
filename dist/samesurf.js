"use strict";
var SameSurf = /** @class */ (function () {
    function SameSurf() {
        /** Holds Samesurf configuration options */
        this.options = window.sameSurfOptions;
        // Check if document is loaded
        if (document.readyState === 'loading') {
            window.document.addEventListener('DOMContentLoaded', this.pageLoaded.bind(this), false);
        }
        else {
            this.pageLoaded(); // If already loaded
        }
    }
    /** Start cobrowse session */
    SameSurf.prototype.coBrowseStart = function () {
        var _this = this;
        // If fullscreen, fire loading screen
        if (this.options.fullScreen) {
            this.createLoader();
            this.createStyles();
        }
        // Check if security token generator is available, if not load it
        if (window.KJUR) {
            this.roomCreate();
        }
        else {
            // Load jsrsAsign async
            var script = document.createElement('script');
            script.src = this.options.jsrsAsignUrl;
            script.async = true;
            script.onload = function () {
                _this.roomCreate();
            };
            script.onerror = function () {
                alert('Error loading screenshare. JsrsAsign not found.');
                _this.coBrowseEnd();
            };
            document.head.appendChild(script);
        }
    };
    ;
    /** End cobrowse session and clean up any legacy DOM elements */
    SameSurf.prototype.coBrowseEnd = function () {
        // Remove loader and iframe if present
        if (this.loader) {
            this.loader.remove();
        }
        if (this.iframe) {
            this.iframe.remove();
        }
    };
    ;
    /**
     * Create a SameSurf room
     */
    SameSurf.prototype.roomCreate = function () {
        var _this = this;
        // Create tokens and token body
        var token_body = {
            iat: Math.floor(new Date().getTime() / 1000),
            sub: this.options.apiSecret
        };
        var token = window.KJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, this.options.apiKey);
        // Create payload body
        var data = {};
        // If start url is supplied, add to data
        if (this.options.startUrl) {
            data.starturl = this.options.startUrl;
        }
        // Make http request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.samesurf.com/api/v3/create');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onload = function () {
            if (xhr.status === 200) { // Success
                var data = JSON.parse(xhr.responseText);
                // If fullscreen, create fullscreen iframe. If not redirect to samesurf url
                if (_this.options.fullScreen) {
                    _this.createIframe(data.privateinvitation);
                }
                else {
                    window.location.replace(data.privateinvitation);
                }
            }
            else { // Error
                alert('Error attempting to start screenshare: ' + xhr.statusText);
                console.error(xhr);
                // Remove loaded and iframe on error
                _this.coBrowseEnd();
            }
        };
        xhr.send(JSON.stringify(data));
    };
    ;
    /** Create the loading element that sits underneath the iframe */
    SameSurf.prototype.createLoader = function () {
        var loader = document.createElement('div');
        loader.innerHTML = '<div class="samesurf-loader"><div></div><div></div><div></div></div> <div class="samesurf-loading">Loading screenshare, please stand by...</div>';
        loader.style.backgroundColor = '#fff';
        loader.style.position = 'fixed';
        loader.style.top = '0px';
        loader.style.right = '0px';
        loader.style.bottom = '0px';
        loader.style.left = '0px';
        loader.style.zIndex = '9998';
        loader.style.textAlign = 'center';
        loader.style.paddingTop = '42vh';
        loader.style.width = '100%';
        loader.style.height = '100%';
        document.getElementsByTagName('body')[0].appendChild(loader);
        this.loader = loader;
    };
    ;
    /** Create and inject the css styling */
    SameSurf.prototype.createStyles = function () {
        // Only inject styles once
        if (!this.styles) {
            var styles = document.createElement('style');
            styles.type = 'text/css';
            var css = '.samesurf-loader{display:inline-block;position:relative;width:64px;height:64px}.samesurf-loader div{display:inline-block;position:absolute;left:6px;width:13px;background:#949494;animation:samesurf-loader 1.2s cubic-bezier(0,.5,.5,1) infinite}.samesurf-loader div:nth-child(1){left:6px;animation-delay:-.24s}.samesurf-loader div:nth-child(2){left:26px;animation-delay:-.12s}.samesurf-loader div:nth-child(3){left:45px;animation-delay:0}@keyframes samesurf-loader{0%{top:6px;height:51px}100%,50%{top:19px;height:26px}}';
            if (styles.styleSheet) {
                // This is required for IE8 and below.
                styles.styleSheet.cssText = css;
            }
            else {
                styles.appendChild(document.createTextNode(css));
            }
            document.getElementsByTagName('head')[0].appendChild(styles);
            this.styles = styles;
        }
    };
    ;
    /**
     * Create an iframe with samesurfs private room url and place on top of current screen
     * @param {any} url - Url to load into iframe
     */
    SameSurf.prototype.createIframe = function (url) {
        var iframe = document.createElement('iframe');
        iframe.id = 'sameSurfIframe';
        iframe.frameBorder = '0';
        iframe.style.position = 'fixed';
        iframe.style.top = '0px';
        iframe.style.right = '0px';
        iframe.style.bottom = '0px';
        iframe.style.left = '0px';
        iframe.style.zIndex = '9999';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.setAttribute('src', url);
        document.getElementsByTagName('body')[0].appendChild(iframe);
        this.iframe = iframe;
    };
    ;
    /**
     * After a postmessage has been received
     * @param {any} e - Window message payload
     */
    SameSurf.prototype.messageReceived = function (e) {
        console.log('Message Received', e);
        // Verify message is from approved url
        if (e.origin === 'https://realtime.samesurf.com') {
            var message = e.data;
            // Perform action based on response type
            switch (message.type) {
                case 'storage_update':
                    break;
                case 'user_gone':
                    break;
                case 'user_logout':
                    this.coBrowseEnd();
                    break;
            }
        }
        else {
            console.warn('Message response from unapproved source');
        }
    };
    ;
    /** After the page has been loaded and the DOM is available */
    SameSurf.prototype.pageLoaded = function () {
        // Click on coBrowseStart button/link
        document.getElementById('coBrowseStart').addEventListener('click', this.coBrowseStart.bind(this), false);
        document.getElementById('testMessaging').addEventListener('click', function () {
            window.parent.postMessage('Hello World', window.location.origin);
        }, false);
        // Listen for postmessage events
        window.addEventListener('message', this.messageReceived.bind(this), false);
    };
    ;
    return SameSurf;
}());
new SameSurf();
//# sourceMappingURL=samesurf.js.map