import {compile as compilePointer} from 'json-pointer';

/**
 * Parsing context is only used for providing contextual information to error reporting.
 *
 * We assume that all parsers return synchronously, and track the position from the root
 * using an absolute RFC 6901 compatible JSON pointer.
 */
const contextStack = [];

function getPath() {
  let result = [];
  contextStack.forEach((component) => {
    if (component === result[0]) {
      // Skip consecutive duplicates
      return;
    }
    result = [component, ...result];
  });
  result.reverse();
  return compilePointer(contextStack);
}

export function enterContext(name: string) {
  contextStack.push(name);
}

export function leaveContext() {
  const head = contextStack.pop();
  if (head !== undefined) {
    while (contextStack[contextStack.length - 1] === head) {
      contextStack.pop();
    }
  }
}

export function withContext<T>(name: string, action: () => T): T {
  enterContext(name);
  try {
    return action();
  } finally {
    leaveContext();
  }
}

export function parseError(message) {
  return new Error(message + `at '${getPath()}'`);
}
