# Samesurf Integration Module
This module is intended to be a turn-key drop in component to enable Samesurf cobrowse. Note that you will need an account with Samesurf in order to receive your api key and secret.

## Quick Start

1. Add the following code directly above the </body> tag
```html
<!-- Configuration options for Samesurf implementation -->
  <script>
    sameSurfOptions = {
      fullScreen: false, // Have iframe sit on top of current view, otherwise will redirect user
      jsrsAsignUrl: 'vendor/jsrsasign-all-min.js', // URL location of jsrsasign-all-min.js
      startUrl: 'https://www.duckduckgo.com', // Optional start url
      apiKey: 'YOUR_KEY',
      apiSecret: 'YOUR_SECRET'
    }
  </script>
  <script src="dist/samesurf.min.js" async defer></script>
```
2. Update the apiKey and apiSecret properties to those provided to you by Samesurf
3. Add `dist/samesurf.min.js` and `vendor/jsrsasign-all-min.js` from this repo to your scripts folder. Update the script locations in sameSurfOptions from step 1
4. Add an ID of 'coBrowseStart' to the DOM element that you want to trigger cobrowse
```html
  <button id="coBrowseStart">Start Cobrowse</button>
```

## Notes
- `jsrsasign-all-min.js` is required to generate the token for interaction with the Samesurf API. Because this script is 300k it will only be loaded on demand after a user has initiated a cobrowse session. If you want to remove this additional load time you can include it as a synchronous script call before the samesurf js file
- View Samesurf Api here: https://dashboard.samesurf.com/api
