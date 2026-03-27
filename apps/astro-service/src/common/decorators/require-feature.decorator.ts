import { SetMetadata } from '@nestjs/common';
import { FEATURE_GATE_KEY } from '../guards/feature-gate.guard';

export const RequireFeature = (featureKey: string) =>
  SetMetadata(FEATURE_GATE_KEY, featureKey);
