# Film metadata and streaming availability

## Provider decision

**TMDB** supplies film and TV metadata for the local, non-commercial prototype. Search uses the first page of TMDB's multi-search results and excludes people and adult results. Browse and the weekly shelf use popular titles. The UK, Ireland, US, Canada and Australia are exposed in the existing viewing-country selector. Movie browse passes the corresponding regional release filter. Title details load genres, synopsis, runtime where present and the TMDB release or first-air date. Posters are optional and start disabled pending review of the applicable artwork rights. [TMDB FAQ](https://developer.themoviedb.org/docs/faq) · [Image documentation](https://developer.themoviedb.org/docs/image-basics)

**Movie of the Night** is the preferred prototype availability source, subject to accepting its current developer terms and confirming free-plan coverage. Its documented offers explicitly separate subscriptions, paid channels, rentals, purchases and free viewing. The app displays only the selected country's offers, attributes the source, shows when the response was fetched and links to the provider when a valid HTTPS link is supplied. Coverage varies by service, country and title. Individual seasons may differ. The app shows an unverified state when coverage or the source is unavailable. [Availability schema](https://github.com/movieofthenight/streaming-availability-api/blob/main/openapi.yaml) · [Current terms](https://developers.movieofthenight.com/terms-and-conditions)

TMDB's JustWatch-powered endpoint is a lower-setup alternative with separate rental and purchase categories and required JustWatch attribution. Its published documentation does not guarantee consistent paid-channel separation or direct service links, so Stream Guide does not use it to infer subscription eligibility. Direct JustWatch partnership is a commercial option to evaluate with a quote. Watchmode offers an attributed non-commercial tier covering up to three countries. Its published commercial Startup plan was US$349/month when reviewed. [TMDB Watch Providers](https://developer.themoviedb.org/reference/movie-watch-providers) · [JustWatch partner integrations](https://apis.justwatch.com/docs/content_partner/) · [Watchmode pricing](https://api.watchmode.com/pricing)

## Enable real metadata locally

1. Sign in to TMDB and open the API section of your account settings. Request developer access for the local, non-commercial Stream Guide prototype if its terms permit your intended use. Copy the **API Read Access Token**. [TMDB API authentication guide](https://developer.themoviedb.org/docs/authentication-application)
2. In this project folder, copy `.env.example` to `.env.local` if it does not already exist. Set `CATALOGUE_USE=non-commercial` and put the token after `CATALOGUE_API_TOKEN=`. Keep the token in that file and out of chat, source control and browser code.
3. Set `CATALOGUE_POSTERS_ALLOWED=yes` only if you have confirmed permission to use the relevant poster artwork in your prototype. Otherwise the app will use neutral placeholders.
4. Stop the local server with Ctrl+C and run `npm.cmd run dev` again. Open [Stream Guide](http://127.0.0.1:5173/). The header should say **TMDB catalogue**. Search for a title you recognise and open its details.

## Enable viewing-country offers

1. Visit the Movie of the Night developer portal. Review the current terms and confirm the free plan permits your intended display, caching and regions. Create a direct developer API key if it does. The direct free plan does not require payment information according to the authentication guide. If you are asked to pay or accept an obligation you do not agree with, leave this feature disabled. [Developer portal](https://developers.movieofthenight.com/) · [Authentication](https://docs.movieofthenight.com/guide/authentication)
2. Add the key after `AVAILABILITY_API_TOKEN=` in `.env.local` and set `AVAILABILITY_TERMS_ACCEPTED=yes` when the current terms permit that use. Restart the local server.
3. Set your viewing country in Profile. Open a title and check its offer type, source and timestamp against the provider. Repeat with another country. Switch back to your own country afterwards.

## Caching, licensing and launch

- Credentials are read server-side by the local Vite dev and preview middleware. The production build contains static client files. Real data on a future host needs equivalent server routing, server secrets and deployment protections.
- The in-memory cache shares simultaneous requests for the same resource. It retains popular lists and country offers for six hours, search results for 15 minutes, and genres and title details for 24 hours. Expired availability is discarded on access. Upstream requests time out after eight seconds. Separate request budgets and a cooldown on provider rate limits protect the local prototype. These budgets reset on restart and do not replace provider quotas.
- The weekly shelf, dice and wheel are catalogue discovery tools at this phase. They do not infer which services the user subscribes to. Personalised, subscription-eligible recommendations depend on subscription preferences and later recommendation work.
- Before commercial use, obtain explicit rights for metadata, artwork and regional availability, including permitted markets, retention, attribution, linking and how provider data can be combined. TMDB requires contacting sales about commercial use. Get current Movie of the Night and JustWatch pricing and terms directly. Budget for the data, API quota, hosting and bandwidth once intended usage is known. No plan was purchased or enabled.
- The TMDB attribution mark is the unchanged approved short logo from TMDB's asset host. [TMDB logo rules](https://www.themoviedb.org/about/logos-attribution)
