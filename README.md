# Samesurf Cobrowse Module
This module is intended integrate Samesurf cobrowse with a consumer facing website and allow users to initiate a cobrowse session.

Note that you will need an account with Samesurf in order to receive your api key and secret.

## Quick Start

1. Add the following code directly above the </body> tag
```html
<!-- Configuration options for Samesurf implementation -->
  <script>
    sameSurfOptions = {
      disabledfeatures: ['MODE_LOGOUT'], // Features to disable as per API docs
      // starturl: 'https://www.duckduckgo.com', // Optional, will default to current url if not set
      fullScreen: true, // Have iframe sit on top of current view, otherwise will redirect user offsite to Samesurf
      tokenUrl: '/api/token.json', // Location to get Samesurf token from
    }
  </script>
  <script src="dist/samesurf-cobrowse.min.js" async defer></script>
```
2. Update tokenUrl property to your rest endpoint that returns the token. The token will be generated from your api key and secret
3. Add `dist/samesurf.min.js` from this repo to your scripts folder
4. Add an ID of 'coBrowseStart' to the DOM element that you want to trigger cobrowse
```html
  <button id="coBrowseStart">Start Cobrowse</button>
```

## Notes
- View Samesurf Api here: https://dashboard.samesurf.com/api
