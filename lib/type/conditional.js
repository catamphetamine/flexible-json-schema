import { lazy } from '../core.js';

export default function conditional(createType) {
  return (fromYupType) => {
    return lazy((value) => {
      return fromYupType(createType(value));
    });
  };
}
