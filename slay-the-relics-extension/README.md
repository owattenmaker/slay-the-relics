## Embedded card previews

Every card PNG in `assets/sts1/card-images` and `assets/sts2/card-images` gets a
small transparent WebP preview, encoded as a base64 data URL and bundled directly
into the extension's JavaScript. Once the extension has loaded, opening a deck
requires **no preview image requests**. Mounted decks decode their previews ahead
of time; visible cards replace them with the original GitHub PNG only after it
has downloaded and decoded. Failed originals leave the preview visible. Cards
added after an extension release fall back to the original URL until a rebuild.

`yarn dev`, `yarn build`, `yarn test`, and `yarn lint` regenerate the manifest
automatically.
Run `yarn generate:card-previews` to regenerate it manually (also do this before
running TypeScript directly on a fresh checkout). Add or replace the source PNGs
as usual, then rebuild. `src/generated/card-previews.json` is gitignored; the
production bundle in `dist` and `build.zip` contains the data. Use `yarn build`
instead of `vite build` directly so generation is not skipped.

Previews preserve aspect ratio and transparency, with a maximum width of 96 px,
WebP quality 35, and alpha quality 60. This trades a larger initial extension
bundle for immediate previews on deck clicks. Sharp requires Node.js 20.9+;
Vitest also requires a supported Node.js version.

`yarn test` covers caching, visibility, card/upgrade changes, and failures. For a
manual check, delay or block GitHub card PNG requests in browser devtools: decks
should still display embedded previews, then switch to originals when unblocked.
Check both games, enlarged cards, and upgrade toggles. Twitch's [image content
security policy](https://dev.twitch.tv/docs/extensions/#restrictions-on-content)
allows `data:` images.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `yarn build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
