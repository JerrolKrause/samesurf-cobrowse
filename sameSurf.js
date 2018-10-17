(function (options) {
    'use strict';

    // Make sure api key and secret are available
    if (!options || !options.apiKey || !options.apiSecret) {
        var code = '<script> \n ' +
            '\t sameSurf = { \n ' +
            '\t\t fullScreen: true, \n ' +
            '\t\t jsrsAsignUrl: "jsrsasign-all-min.js", \n ' +
            '\t\t startUrl: "YOURSTARTURL", \n ' +
            '\t\t apiKey: "YOURKEY", \n ' +
            '\t\t apiSecret: "YOURSECRET" \n ' +
            '\t }; \n ' +
            '</script> \n ';
        console.error('Missing SameSurf api key or api secret. Please include the following code before this file. \n' + code);
        return false;
    }

    // Make sure RSA-Sign library is available
    if (!window.KJUR && !options.jsrsAsignUrl) {
        console.error('RSA-Sign not found, download and install "jsrsasign-all-min.js" from https://github.com/kjur/jsrsasign and supply a link in options to jsrsAsignUrl');
        return false;
    }

    // Declaring main variable
    var APP = {};


    /************************************************************
        Variables
    *************************************************************/

    var $head = document.getElementsByTagName('head')[0],
        // DOM elements
        iframe,
        loader,
        styles;


    /************************************************************
        Methods
    *************************************************************/

    /** Start cobrowse session */
    APP.coBrowseStart = function () {

        // If fullscreen, fire loading screen
        if (options.fullScreen) {
            APP.createLoader();
            APP.createStyles();
        }

        // Check if security token generator is available, if not load it
        if (window.KJUR) {
            APP.roomCreate();
        } else {
            // Load jsrsAsign async
            var script = document.createElement('script');
            script.src = options.jsrsAsignUrl;
            script.async = true;
            script.onload = function () {
                APP.roomCreate();
            };
            script.onerror = function () {
                alert('Error loading screenshare. JsrsAsign not found.');
            };
            document.head.appendChild(script);
        }
    };

    /** End cobrowse session and clean up any legacy DOM elements */
    APP.coBrowseEnd = function () {
        // Remove loader and iframe
        if (loader) {
            loader.remove();
        }
        if (iframe) {
            iframe.remove();
        }
    };

    /**
     * Create a SameSurf room
     */
    APP.roomCreate = function () {
        // Create tokens and token body
        var token_body = {
            iat: Math.floor(new Date().getTime() / 1000),
            sub: options.apiSecret
        };
        var token = window.KJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, options.apiKey);

        // Create payload body
        var data = {};

        // If start url is supplied, add to data
        if (options.startUrl) {
            data.starturl = options.startUrl;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.samesurf.com/api/v3/create');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onload = function () {
            if (xhr.status === 200) { // Success
                var data = JSON.parse(xhr.responseText);
                // If fullscreen, create fullscreen iframe. If not redirect to samesurf url
                if (options.fullScreen) {
                    APP.createIframe(data.privateinvitation);
                } else {
                    window.location.replace(data.privateinvitation);
                }
            } else { // Error
                alert('Error attempting to start screenshare: ' + xhr.statusText);
                console.error(xhr);
                // Remove loaded and iframe on error
                APP.coBrowseEnd();
            }
        };
        xhr.send(JSON.stringify(data));
    };

    /** Create the loading element that sits underneath the iframe */
    APP.createLoader = function () {
        loader = document.createElement('div');
        loader.innerHTML = '<div class="samesurf-loader"><div></div><div></div><div></div></div> <div class="samesurf-loading">Loading screenshare, please stand by...</div>';
        loader.style.backgroundColor = '#fff';
        loader.style.position = 'fixed';
        loader.style.top = '0px';
        loader.style.right = '0px';
        loader.style.bottom = '0px';
        loader.style.left = '0px';
        loader.style.zIndex = 9998;
        loader.style.textAlign = 'center';
        loader.style.paddingTop = '42vh';
        loader.width = '100%';
        loader.height = '100%';
        document.getElementsByTagName('body')[0].appendChild(loader);
    };

    /** Create and inject the css styling */
    APP.createStyles = function () {
        // Only inject styles once
        if (!styles) {
            styles = document.createElement('style');
            styles.type = 'text/css';
            var css = '.samesurf-loader{display:inline-block;position:relative;width:64px;height:64px}.samesurf-loader div{display:inline-block;position:absolute;left:6px;width:13px;background:#949494;animation:samesurf-loader 1.2s cubic-bezier(0,.5,.5,1) infinite}.samesurf-loader div:nth-child(1){left:6px;animation-delay:-.24s}.samesurf-loader div:nth-child(2){left:26px;animation-delay:-.12s}.samesurf-loader div:nth-child(3){left:45px;animation-delay:0}@keyframes samesurf-loader{0%{top:6px;height:51px}100%,50%{top:19px;height:26px}}';
            if (styles.styleSheet) {
                // This is required for IE8 and below.
                styles.styleSheet.cssText = css;
            } else {
                styles.appendChild(document.createTextNode(css));
            }
            $head.append(styles);
        }
    };

    /**
     * Create an iframe with samesurfs private room url and place on top of current screen
     * @param {any} url - Url to load into iframe
     */
    APP.createIframe = function (url) {
        iframe = document.createElement('iframe');
        iframe.id = 'sameSurfIframe';
        iframe.frameBorder = 0;
        iframe.style.position = 'fixed';
        iframe.style.top = '0px';
        iframe.style.right = '0px';
        iframe.style.bottom = '0px';
        iframe.style.left = '0px';
        iframe.style.zIndex = 9999;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.setAttribute('src', url);
        document.getElementsByTagName('body')[0].appendChild(iframe);
    };

    /**
     * After a postmessage has been received
     * @param {any} e - Window message payload
     */
    APP.messageReceived = function (e) {
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
                    APP.coBrowseEnd();
                    break;
            }
        } else {
            console.warn('Message response from unapproved source');
        }
    };

    /** After the page has been loaded and the DOM is available */
    APP.pageLoaded = function () {
        // Click on coBrowseStart button/link
        document.getElementById('coBrowseStart').addEventListener('click', APP.coBrowseStart, false);
        document.getElementById('testMessaging').addEventListener('click', function () {
            window.parent.postMessage('Hello World', window.location.origin);
        }, false);
        // Listen for postmessage events
        window.addEventListener('message', APP.messageReceived, false);
    };

    // Check if document is loaded
    if (document.readyState === 'loading') {
        window.document.addEventListener('DOMContentLoaded', APP.pageLoaded, false);
    } else {
        APP.pageLoaded(); // If already loaded
    }

})(window.sameSurfOptions || null);
