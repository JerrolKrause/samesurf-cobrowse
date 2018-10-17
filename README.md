# Samesurf Integration Module
This module is intended to be a turn-key drop in component to enable Samesurf cobrowse

## Quick Start

1. Add the following code directly above the </body> tag
```html
<!-- Configuration options for Samesurf implementation -->
  <script>
    sameSurfOptions = {
      fullScreen: true, // Have iframe sit on top of current view, otherwise will redirect user
      jsrsAsignUrl: 'vendor/jsrsasign-all-min.js', // URL location of jsrsasign-all-min.js
      startUrl: 'https://www.duckduckgo.com', // Optional
      apiKey: 'YOUR_KEY',
      apiSecret: 'YOUR_SECRET'
    }
  </script>
  <!-- Include script directly above the close body tag and below sameSurfOptions -->
  <script src="dist/samesurf.min.js" async defer></script>
```
2. Update the apiKey and apiSecret properties to those provided to you by Samesurf. 
3. Add samesurf.min.js and jsrsasign-all-min.js to your scripts folder. Update the locations in sameSurfOptions.
4. Add an ID of 'coBrowseStart' to the DOM element that you want to trigger cobrowse
```html
  <!-- Add an ID of "coBrowseStart" to an element to trigger coBrowse -->
  <button id="coBrowseStart">Create Room</button>
```

## Notes
- jsrsasign-all-min.js is required to generate the token for interaction with the Samesurf API but because it is 300k it will only be loaded on demand after a user has initiated a cobrowse session
- View Samesurf Api here https://dashboard.samesurf.com/api
