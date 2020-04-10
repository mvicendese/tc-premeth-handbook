import {Routes} from '@angular/router';


export const appRoutes: Routes = [
  {
    path: 'classes',
    loadChildren: () => import('./features/classes/classes-feature.module')
                        .then(module => module.ClassesFeatureModule)
  },
  {
    path: 'students',
    loadChildren: () => import('./features/schools/students-feature.module')
                        .then(module => module.StudentsFeatureModule)
  },
  {
    path: 'units',
    loadChildren: () => import('./features/units/units-feature.module')
                        .then(module => module.UnitsFeatureModule)
  }

];
