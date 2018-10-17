(function ($, kJUR, options) {
    'use strict';

    // Make sure jquery is available
    if (!$) {
        console.error('jQuery not found, please make sure jQuery is available and that this script loads after it');
        return false;
    }


    // Make sure RSA-Sign library is available
    if (!kJUR && !options.jsrsAsignUrl) {
        console.error('RSA-Sign not found, download and install "jsrsasign-all-min.js" from https://github.com/kjur/jsrsasign or supply a link in options with the location');
        return false;
    }
    
    // Make sure api key and secret are available
    if (!options || !options.apiKey || !options.apiSecret) {
        var code = '<script> \n ' +
            '\t sameSurf = { \n ' +
            '\t\t fullScreen: true, \n ' +
            '\t\t startUrl: "YOURSTARTURL", \n ' +
            '\t\t apiKey: "YOURKEY", \n ' +
            '\t\t apiSecret: "YOURSECRET" \n ' +
            '\t }; \n ' +
            '</script> \n ';
            console.error('Missing SameSurf api key or api secret. Please include the following code before this file. \n' + code);
        return false;
    }

    // Declaring main variable
    var APP = {};


    /************************************************************
        Variables
    *************************************************************/

    var $window = $(window),
        $document = $(document),
        $head = $('head'),
        // DOM elements
        iframe,
        loader,
        styles;
        

    /************************************************************
        Methods
    *************************************************************/

    APP.coBrowseStart = function () {

        // If fullscreen, fire loading screen
        if (options.fullScreen) {
            APP.createLoader();
            APP.createStyles();
        }

        if (kJUR) {
            APP.roomCreate();
        } else if (options.jsrsAsignUrl) {
            // Load jsrsAsign async
            var script = document.createElement('script');
            script.src = options.jsrsAsignUrl;
            script.async = true;
            script.onload = function () {
                // After successful load, update reference to KJUR and create a room
                kJUR = window.KJUR;
                APP.roomCreate();
            };
            script.onerror = function () {
                alert('Error loading screenshare. JsrsAsign not found.');
            };
            document.head.appendChild(script);
        }
    };

    /**
     * Start screensahre and create a SameSurf room
     */
    APP.roomCreate = function () {

        // Create tokens and token body
        var token_body = {
            iat: Math.floor(new Date().getTime() / 1000),
            sub: options.apiSecret
        };
        var token = kJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, options.apiKey);
        
        // Create payload body
        var data = {};

        // If start url is supplied, add to data
        if (options.startUrl) {
            data.starturl = options.startUrl;
        }

        $.ajax({
            url: 'https://api.samesurf.com/api/v3/create',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify(data),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            },
            success: function (data) {
                // If fullscreen, create fullscreen iframe. If not redirect to sameSurf url
                if (options.fullScreen) {
                    APP.createIframe(data.privateinvitation);
                } else {
                    window.location.replace(data.privateinvitation);
                }
            },
            error: function (error) {
                alert('Error loading screenshare: ' + error.statusText);
                console.error(error);
                // Remove loader and iframe on error
                $(loader).remove();
                $(iframe).remove();
            }
        });
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
     * Create an iframe in memory and attach properties
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
        // $(iframe).on('message', function (e) { console.log('Postmessage to iframe received', e); });
    };

    /** Listen to postmessage events */
    APP.listen = function () {
        $window.on('message', function (e) {
            console.warn('Post Message', e);
        });
    };

    // Window load functions
    $window.on('load', function () {
        
    });

    // Window load and resize functions
    $window.on('load resize', function () {

    });

    // Document ready functions
    $document.ready(function () {
        //APP.listen();

        $('#roomCreate').on('click', function () {
            APP.coBrowseStart();
        });

        $('#test').on('click', function () {
            window.parent.postMessage('Hello World', window.location.origin);
        });

        

        $(window).on('message', function (e) { console.log('Postmessage received', e); });

    });

})(window.jQuery || null, window.KJUR || null, window.sameSurf || null);

