"use strict";
var SameSurfCobrowse = /** @class */ (function () {
    function SameSurfCobrowse() {
        /** Holds Samesurf configuration options */
        this.options = window.sameSurfOptions;
        // Check if document is loaded
        if (document.readyState === 'loading') {
            // If loading add event listener
            window.document.addEventListener('DOMContentLoaded', this.pageLoaded.bind(this), false);
        }
        else {
            // If already loaded
            this.pageLoaded();
        }
    }
    /** Start cobrowse session */
    SameSurfCobrowse.prototype.coBrowseStart = function (existingRoomNumber) {
        var _this = this;
        // If fullscreen, fire loading screen
        if (this.options.fullScreen) {
            this.createLoader();
            this.createStyles();
        }
        // Check if security token generator is available, if not load it
        if (window.KJUR) {
            this.roomCreateJoin(existingRoomNumber);
        }
        else {
            // Load jsrsAsign async
            var script = document.createElement('script');
            script.src = this.options.jsrsAsignUrl;
            script.async = true;
            script.onload = function () {
                _this.roomCreateJoin(existingRoomNumber);
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
    SameSurfCobrowse.prototype.coBrowseEnd = function () {
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
    SameSurfCobrowse.prototype.roomCreateJoin = function (existingRoomNumber) {
        var _this = this;
        // Create tokens and token body
        var token_body = {
            iat: Math.floor(new Date().getTime() / 1000),
            sub: this.options.apiSecret
        };
        var token = window.KJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, this.options.apiKey);
        // Create payload body
        var data = {
            starturl: this.options.startUrl ? this.options.startUrl : window.location.origin
        };
        // If joining an existing room
        if (existingRoomNumber) {
            var url = 'https://realtime.stearnsstage.samesurf.com/' + existingRoomNumber + '/' + token;
            if (this.options.fullScreen) {
                this.createIframe(url);
            }
            else {
                window.location.replace(url);
            }
        }
        else {
            // Creating a new room
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
        }
    };
    ;
    /** Create the loading element that sits underneath the iframe */
    SameSurfCobrowse.prototype.createLoader = function () {
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
    SameSurfCobrowse.prototype.createStyles = function () {
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
    SameSurfCobrowse.prototype.createIframe = function (url) {
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
    SameSurfCobrowse.prototype.messageReceived = function (e) {
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
    /** Generate the token needed by Samesurf from the apiKey and apiSecret */
    SameSurfCobrowse.prototype.generateToken = function (apiKey, apiSecret) {
        var _this = this;
        var script = document.createElement('script');
        script.src = this.options.jsrsAsignUrl;
        script.async = true;
        script.onload = function () {
            // Create tokens and token body
            var token_body = {
                iat: Math.floor(new Date().getTime() / 1000),
                sub: apiSecret
            };
            // Create token
            var token = window.KJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, apiKey);
            document.getElementById('tokenDisplay').innerHTML = "<div style=\"max-width:400px;padding:1rem;border:1px solid #ccc;word-break: break-all;\">Your token is: <strong>" + token + "</strong></div>";
        };
        script.onerror = function () {
            alert('Error loading screenshare. JsrsAsign not found.');
            _this.coBrowseEnd();
        };
        document.head.appendChild(script);
    };
    /** After the page has been loaded and the DOM is available */
    SameSurfCobrowse.prototype.pageLoaded = function () {
        var _this = this;
        // Click on coBrowseStart button/link
        document.getElementById('coBrowseStart').addEventListener('click', function () {
            _this.coBrowseStart();
        }, false);
        // Click on join cobrowse
        document.getElementById('coBrowseJoin').addEventListener('click', function () {
            var roomNumber = document.getElementById('coBrowseRoomNumber').value;
            _this.coBrowseStart(roomNumber);
        }, false);
        // Click on token create
        document.getElementById('tokenCreate').addEventListener('click', function () {
            // Get values from form elements
            var apiKey = document.getElementById('apiKey').value;
            var apiSecret = document.getElementById('apiSecret').value;
            _this.generateToken(apiKey, apiSecret);
        }, false);
        // Click on test messaging
        document.getElementById('testMessaging').addEventListener('click', function () {
            window.parent.postMessage('Hello World', window.location.origin);
        }, false);
        // Listen for postmessage events
        window.addEventListener('message', this.messageReceived.bind(this), false);
    };
    ;
    return SameSurfCobrowse;
}());
new SameSurfCobrowse();
//# sourceMappingURL=samesurf-cobrowse.js.map