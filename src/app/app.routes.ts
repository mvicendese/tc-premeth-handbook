import {Routes} from '@angular/router';


export const appRoutes: Routes = [
  {
    path: 'classes',
    loadChildren: () => import('./features/classes/classes-feature.module')
                        .then(module => module.ClassesFeatureModule)
  },
  {
    path: 'subjects',
    loadChildren: () => import('./features/subjects/subjects-feature.module')
                        .then(module => module.SubjectsFeatureModule)
  },
  {
    path: 'students',
    loadChildren: () => import('./features/students/students-feature.module')
                        .then(module => module.StudentsFeatureModule)
  },
  {
    path: 'units',
    loadChildren: () => import('./features/units/units-feature.module')
                        .then(module => module.UnitsFeatureModule)
  }

];
