// src/test-project/js/unused.ts
export function unusedFunction() {
  return "I’m not used!";
}

// src/test-project/js/index.ts
import { greet } from './used'; // No import of unusedFunction
console.log(greet());