// React 19 compatible shim for `react-is` (used by recharts@2.12.x ResponsiveContainer and ReactUtils).
// React 19 tags JSX elements with `Symbol.for('react.transitional.element')` instead of `Symbol.for('react.element')`.

const hasSymbol = typeof Symbol === 'function' && Boolean(Symbol.for);

const REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
const REACT_TRANSITIONAL_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.transitional.element') : 0xeac7;
const REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
const REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
const REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
const REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
const REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
const REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace;
const REACT_CONSUMER_TYPE = hasSymbol ? Symbol.for('react.consumer') : 0xeace;
const REACT_SERVER_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.server_context') : 0xeae6;
const REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
const REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
const REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
const REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
const REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
const REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
const REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
const REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
const REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
const REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
const REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

const isReactElementSymbol = (sym: unknown): boolean =>
  sym === REACT_ELEMENT_TYPE || sym === REACT_TRANSITIONAL_ELEMENT_TYPE;

export function typeOf(object: any): any {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;

    if (isReactElementSymbol($$typeof)) {
      const type = object.type;
      switch (type) {
        case REACT_ASYNC_MODE_TYPE:
        case REACT_CONCURRENT_MODE_TYPE:
        case REACT_FRAGMENT_TYPE:
        case REACT_PROFILER_TYPE:
        case REACT_STRICT_MODE_TYPE:
        case REACT_SUSPENSE_TYPE:
          return type;
        default: {
          const $$typeofType = type && type.$$typeof;
          switch ($$typeofType) {
            case REACT_CONTEXT_TYPE:
            case REACT_CONSUMER_TYPE:
            case REACT_FORWARD_REF_TYPE:
            case REACT_LAZY_TYPE:
            case REACT_MEMO_TYPE:
            case REACT_PROVIDER_TYPE:
              return $$typeofType;
            default:
              return REACT_ELEMENT_TYPE;
          }
        }
      }
    }

    if ($$typeof === REACT_PORTAL_TYPE) {
      return $$typeof;
    }
  }
  return undefined;
}

export function isValidElementType(type: any): boolean {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_CONCURRENT_MODE_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    (typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === REACT_LAZY_TYPE ||
        type.$$typeof === REACT_MEMO_TYPE ||
        type.$$typeof === REACT_PROVIDER_TYPE ||
        type.$$typeof === REACT_CONTEXT_TYPE ||
        type.$$typeof === REACT_CONSUMER_TYPE ||
        type.$$typeof === REACT_SERVER_CONTEXT_TYPE ||
        type.$$typeof === REACT_FORWARD_REF_TYPE ||
        type.$$typeof === REACT_FUNDAMENTAL_TYPE ||
        type.$$typeof === REACT_RESPONDER_TYPE ||
        type.$$typeof === REACT_SCOPE_TYPE ||
        type.$$typeof === REACT_BLOCK_TYPE))
  );
}

export const AsyncMode = REACT_ASYNC_MODE_TYPE;
export const ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
export const ContextConsumer = REACT_CONTEXT_TYPE;
export const ContextProvider = REACT_PROVIDER_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const ForwardRef = REACT_FORWARD_REF_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Lazy = REACT_LAZY_TYPE;
export const Memo = REACT_MEMO_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const Profiler = REACT_PROFILER_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;
export const Suspense = REACT_SUSPENSE_TYPE;
export const SuspenseList = REACT_SUSPENSE_LIST_TYPE;

export function isAsyncMode(object: any): boolean {
  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
export function isConcurrentMode(object: any): boolean {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
export function isContextConsumer(object: any): boolean {
  const t = typeOf(object);
  return t === REACT_CONTEXT_TYPE || t === REACT_CONSUMER_TYPE;
}
export function isContextProvider(object: any): boolean {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
export function isElement(object: any): boolean {
  return typeof object === 'object' && object !== null && isReactElementSymbol(object.$$typeof);
}
export function isForwardRef(object: any): boolean {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
export function isFragment(object: any): boolean {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
export function isLazy(object: any): boolean {
  return typeOf(object) === REACT_LAZY_TYPE;
}
export function isMemo(object: any): boolean {
  return typeOf(object) === REACT_MEMO_TYPE;
}
export function isPortal(object: any): boolean {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
export function isProfiler(object: any): boolean {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
export function isStrictMode(object: any): boolean {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
export function isSuspense(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}
export function isSuspenseList(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
}

const ReactIs = {
  AsyncMode,
  ConcurrentMode,
  ContextConsumer,
  ContextProvider,
  Element,
  ForwardRef,
  Fragment,
  Lazy,
  Memo,
  Portal,
  Profiler,
  StrictMode,
  Suspense,
  SuspenseList,
  isAsyncMode,
  isConcurrentMode,
  isContextConsumer,
  isContextProvider,
  isElement,
  isForwardRef,
  isFragment,
  isLazy,
  isMemo,
  isPortal,
  isProfiler,
  isStrictMode,
  isSuspense,
  isSuspenseList,
  isValidElementType,
  typeOf
};

export default ReactIs;
