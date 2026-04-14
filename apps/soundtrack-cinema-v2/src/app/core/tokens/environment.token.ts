import { InjectionToken } from '@angular/core';
import { Environment } from '../../../../spec/contracts/types';

export const ENVIRONMENT_TOKEN = new InjectionToken<Environment>('ENVIRONMENT');
