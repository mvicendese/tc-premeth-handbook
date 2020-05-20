// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  apiBaseHref: 'http://localhost:8000/api',

  initialAppState: {
    subject: '47183612-b6fb-44f9-b63e-b5c9001c6301'
  },

  base: {
    auth: {
      token: 'abcdef12345',

      app: {
        clientId: 'evYtyQ30HaHgvFbayTR1jZskZydLJ2jju86eWiiH',
        clientSecret: 'PDs7PLTHgq0c7FC12UVNYJyjihLq7qpu4VWb80R7JUlZSHuxewIibbkUzUIkJNPW3G3X3YXcw2EK9xBxc34tNEy88z3XsZuVPtAudqCLhYpmO2Z4MWiC6FvnoRZiSxFH'
      }
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
