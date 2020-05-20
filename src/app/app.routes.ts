import {Routes} from '@angular/router';
import {IsAuthenticated, OauthCallback} from './features/base/auth/router-guards';
import {UserModelLoader} from './features/base/auth/user.model-loader.service';


export const appRoutes: Routes = [
  {
    path: '',
    // Entire app is off limits unless authenticated.
    canActivate: [IsAuthenticated],
    resolve: {
      user: UserModelLoader
    },
    children: [
      {
        path: 'schools',
        loadChildren: () => import('./features/schools/schools-feature.module')
          .then(module => module.SchoolsFeatureModule)
      },
      {
        path: 'subjects',
        loadChildren: () => import('./features/subjects/subjects-feature.module')
          .then(module => module.SubjectsFeatureModule)
      }
    ]
  },
  {
    path: 'oauth_callback',
    canActivate: [OauthCallback],
    children: []
  }
];
