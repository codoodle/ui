/* eslint-disable @typescript-eslint/ban-types */
/**
 * 전달된 함수를 성능 최적화 하여 실행합니다.
 * @param thisArgs 함수를 호출하는데 제공될 this의 값입니다.
 * @param func 실행할 함수입니다.
 */
export function toOptimizedFunction<T extends Function>(
  thisArgs: unknown,
  func: T
): T {
  let ticking = false
  return ((...args: unknown[]) => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(() => {
        func.apply(thisArgs, args)
        ticking = false
      })
    }
  }) as unknown as T
}
