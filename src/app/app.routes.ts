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
    path: 'subjects',
    loadChildren: () => import('./features/subjects/subjects-feature.module')
                        .then(module => module.SubjectsFeatureModule)
  }

];
