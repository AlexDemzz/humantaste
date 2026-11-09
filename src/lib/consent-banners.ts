/** Script hosts only: the vendors' own sites live on the same domains and must stay scorable. */
const CONSENT_MANAGER_HOSTS = [
  "cdn.cookielaw.org",
  "geolocation.onetrust.com",
  "cookie-cdn.cookiepro.com",
  "consent.cookiebot.com",
  "consentcdn.cookiebot.com",
  "cdn.privacy-mgmt.com",
  "sdk.privacy-center.org",
  "api.privacy-center.org",
  "app.usercentrics.eu",
  "cmp.usercentrics.eu",
  "cmp.inmobi.com",
  "mgr.consensu.org",
  "consent.trustarc.com",
  "consent.truste.com",
  "cdn.cookie-script.com",
  "cdn-cookieyes.com",
  "cmp.osano.com",
  "cdn.iubenda.com",
  "cs.iubenda.com",
  "app.termly.io",
  "static.axept.io",
  "client.axept.io",
  "cdn.consentmanager.net",
  "cdn.cookiehub.eu",
] as const;

export const isConsentManagerHost = (hostname: string): boolean =>
  CONSENT_MANAGER_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );

/** For the managers a site serves from its own domain, which no host list can catch. */
const CONSENT_BANNER_SELECTORS = [
  "#onetrust-consent-sdk",
  "#CybotCookiebotDialog",
  "#CybotCookiebotDialogBodyUnderlay",
  "#didomi-host",
  "#usercentrics-root",
  "#usercentrics-cmp-ui",
  '[id^="sp_message_container"]',
  "#qc-cmp2-container",
  ".qc-cmp2-container",
  "#truste-consent-track",
  "#consent_blackbar",
  "#cookiescript_injected_wrapper",
  "#cookiescript_injected",
  ".cky-consent-container",
  ".cky-overlay",
  ".osano-cm-window",
  "#iubenda-cs-banner",
  "#termly-code-snippet-support",
  "#axeptio_overlay",
  "#cmpbox",
  "#cmpbox2",
  ".ch2-container",
  "#tarteaucitronRoot",
  "#cmplz-cookiebanner-container",
  ".cmplz-cookiebanner",
  "#BorlabsCookieBox",
  "#moove_gdpr_cookie_info_bar",
  '#cookie-notice[class*="cn-position-"]',
  "#cc-main .cm-wrapper",
  '.cc-window[aria-label="cookieconsent"]',
  "#shopify-pc__banner",
] as const;

/** Removed rather than hidden, so the markup also leaves the HTML the page is judged on. */
export const REMOVE_CONSENT_BANNERS = `(() => {
  for (const banner of document.querySelectorAll(${JSON.stringify(CONSENT_BANNER_SELECTORS.join(","))})) banner.remove();
})()`;
