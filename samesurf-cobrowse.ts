interface Data {
  starturl?: string;
  disabledfeatures?: string[];
}

interface Options extends Data {
  fullScreen?: boolean;
  tokenUrl?: string;
}

class SameSurfCobrowse {
  /** Holds Samesurf configuration options */
  public options: Options = (<any>window).sameSurfOptions;
  /** Reference to iframe which overlays the main DOM */
  private iframe: HTMLIFrameElement;
  /** Reference to iframe which overlays the main DOM */
  private iframeWrapper: HTMLDivElement;
  /** Reference to loading screen which sits under the iframe */
  private loader: HTMLDivElement;
  /** Reference to inline style block */
  private styles: HTMLStyleElement;
  /** Samesurf token to pass to webapi */
  private token: string;
  /** Samesurf token to pass to webapi */
  private roomNumber: string;

  constructor() {
    // Check if document is loaded
    if (document.readyState === 'loading') {
      // If loading add event listener
      window.document.addEventListener('DOMContentLoaded', this.pageLoaded.bind(this), false);
    } else {
      // If already loaded
      this.pageLoaded();
    }
  }

  /** Start cobrowse session */
  public coBrowseStart() {
    // If fullscreen, fire loading screen
    if (this.options.fullScreen) {
      this.createLoader();
      this.createStyles();
    }

    if (this.token) {
      this.roomCreateJoin();
    } else {
      this.getToken();
    }

  };

  /** End cobrowse session and clean up any legacy DOM elements */
  public coBrowseEnd() {
    this.token = null;
    // Remove loader and iframe if present
    if (this.loader) {
      this.loader.remove();
    }
    if (this.iframe) {
      this.iframe.remove();
    }
    if (this.iframeWrapper) {
      this.iframeWrapper.remove();
    }
  };

  /** Get a token from the web api */
  public getToken() {
    if ((<any>window).KJUR) {
      this.generateToken();
      this.roomCreateJoin();
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', this.options.tokenUrl);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      //xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.onload = () => {
        if (xhr.status === 200) { // Success
          const data = JSON.parse(xhr.responseText);
          if (data.token) {
            this.token = data.token;
            this.roomCreateJoin();
          }
        } else { // Error
          alert('Error attempting to get token: ' + xhr.statusText);
          console.error(xhr);
          // Remove loaded and iframe on error
          this.coBrowseEnd();
        }
      };
      xhr.send();
    }

  }

  /**
   * Create a SameSurf room
   */
  public roomCreateJoin() {

    // Create payload body
    const data: Data = {
      starturl: this.options.starturl ? this.options.starturl : window.location.origin
    };

    // If disabled features have been added, attach to data
    if (this.options.disabledfeatures) {
      data.disabledfeatures = this.options.disabledfeatures;
    }

    // If joining an existing room
    if (this.roomNumber) {
      const url = 'https://realtime.stearnsstage.samesurf.com/' + this.roomNumber + '/' + this.token;
      if (this.options.fullScreen) {
        this.createIframe(url);
      } else {
        window.location.replace(url);
      }
    } else {
      // Creating a new room
      // Make http request
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.samesurf.com/api/v3/create');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
      xhr.onload = () => {
        if (xhr.status === 200) { // Success
          var data = JSON.parse(xhr.responseText);
          // If fullscreen, create fullscreen iframe. If not redirect to samesurf url
          if (this.options.fullScreen) {
            this.createIframe(data.privateinvitation);
          } else {
            window.location.replace(data.privateinvitation);
          }
        } else { // Error
          alert('Error attempting to start screenshare: ' + xhr.statusText);
          console.error(xhr);
          // Remove loaded and iframe on error
          this.coBrowseEnd();
        }
      };
      xhr.send(JSON.stringify(data));
    }

  };

  /** Create the loading element that sits underneath the iframe */
  public createLoader() {
    const loader = document.createElement('div');
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

  /** Create and inject the css styling */
  public createStyles() {
    // Only inject styles once
    if (!this.styles) {
      const styles = document.createElement('style');
      styles.type = 'text/css';
      const css = `.samesurf-loader{display:inline-block;position:relative;width:64px;height:64px}.samesurf-loader div{display:inline-block;position:absolute;left:6px;width:13px;background:#949494;animation:samesurf-loader 1.2s cubic-bezier(0,.5,.5,1) infinite}.samesurf-loader div:nth-child(1){left:6px;animation-delay:-.24s}.samesurf-loader div:nth-child(2){left:26px;animation-delay:-.12s}.samesurf-loader div:nth-child(3){left:45px;animation-delay:0}@keyframes samesurf-loader{0%{top:6px;height:51px}100%,50%{top:19px;height:26px}}`;
      const iframe = `#samesurf-iframe{position:fixed;top:30px;right:0;bottom:0;left:0;z-index:9999;width: 100%;height: 100%;}`;
      const iframeWrapper = `#samesurf-cobrowse-close{opacity:0.3;display:inline-block;width:25px;height:25px;position:relative}#samesurf-cobrowse-close:hover{opacity:1}#samesurf-cobrowse-close:after,#samesurf-cobrowse-close:before{position:absolute;left:15px;content:' ';height:25px;width:2px;background-color:#000}#samesurf-cobrowse-close:before{transform:rotate(45deg)}#samesurf-cobrowse-close:after{transform:rotate(-45deg)}#samesurf-iframe-wrapper{background-color:rgb(204, 204, 204);position:fixed;top:0;right:0;left:0;z-index:9999;text-align:right;width:100%;padding-top:0.25rem;padding-bottom:0.25rem}#samesurf-iframe-wrapper div{padding-left:0.5rem;padding-right:0.5rem;}#samesurf-iframe-wrapper span{float:left;line-height: 1.75rem;}`;
      const cssAll = css + iframe + iframeWrapper;
      if ((<any>styles).styleSheet) {
        // This is required for IE8 and below.
        (<any>styles).styleSheet.cssText = cssAll;
      } else {
        styles.appendChild(document.createTextNode(cssAll));
      }
      document.getElementsByTagName('head')[0].appendChild(styles);
      this.styles = styles;
    }
  };

  /**
   * Create an iframe with samesurfs private room url and place on top of current screen
   * @param {any} url - Url to load into iframe
   */
  public createIframe(url: string) {
    const iframe = document.createElement('iframe');
    iframe.id = 'samesurf-iframe';
    iframe.frameBorder = '0';
    iframe.setAttribute('src', url);
    document.getElementsByTagName('body')[0].appendChild(iframe);
    this.iframe = iframe;

    const iframeWrapper = document.createElement('div');
    iframeWrapper.id = 'samesurf-iframe-wrapper';
    iframeWrapper.innerHTML = '<div><span>Currently CoBrowsing</span><a href="#" id="samesurf-cobrowse-close" title="End cobrowsing"></a></div>';
    document.getElementsByTagName('body')[0].appendChild(iframeWrapper);
    // Click on token create
    document.getElementById('samesurf-cobrowse-close').addEventListener('click', () => {
      this.coBrowseEnd();
    }, false);
    this.iframeWrapper = iframeWrapper;
  };

  /**
   * After a postmessage has been received
   * @param {any} e - Window message payload
   */
  public messageReceived(e: MessageEvent) {
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
    } else {
      console.warn('Message response from unapproved source');
    }
  };

  /** Generate the token needed by Samesurf from the apiKey and apiSecret */
  public generateToken() {
    // Get values from form elements
    const apiKey = (<HTMLInputElement>document.getElementById('apiKey')).value;
    const apiSecret = (<HTMLInputElement>document.getElementById('apiSecret')).value;
    // Create tokens and token body
    var token_body = {
      iat: Math.floor(new Date().getTime() / 1000),
      sub: apiSecret
    };
    // Create token
    this.token = (<any>window).KJUR.jws.JWS.sign('HS256', { typ: 'JWT' }, token_body, apiKey);

    document.getElementById('tokenDisplay').innerHTML = `<div style="max-width:400px;padding:1rem;border:1px solid #ccc;word-break: break-all;"><strong>${this.token}</strong></div>`;
  }

  /** After the page has been loaded and the DOM is available */
  public pageLoaded() {
    // Click on coBrowseStart button/link
    document.getElementById('coBrowseStart').addEventListener('click', () => {
      this.coBrowseStart();
    }, false);
    // Click on join cobrowse
    document.getElementById('coBrowseJoin').addEventListener('click', () => {
      this.roomNumber = (<HTMLInputElement>document.getElementById('coBrowseRoomNumber')).value;
      this.coBrowseStart();
    }, false);
    


    // Click on token create
    document.getElementById('tokenCreate').addEventListener('click', () => {
      this.generateToken();
    }, false);

    // Click on test messaging
    document.getElementById('testMessaging').addEventListener('click', () => {
      window.parent.postMessage('Hello World', window.location.origin);
    }, false);
    // Listen for postmessage events
    window.addEventListener('message', this.messageReceived.bind(this), false);
  };

}
new SameSurfCobrowse();
