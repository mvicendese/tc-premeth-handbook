import {Routes} from '@angular/router';


export const appRoutes: Routes = [
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
];
