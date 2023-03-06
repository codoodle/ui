/**
 * 사각형의 위치와 크기를 나타냅니다.
 */
export interface Rect {
  /**
   *  왼쪽 좌표입니다.
   */
  left: number
  /**
   *  위쪽 좌표입니다.
   */
  top: number
  /**
   *  너비입니다.
   */
  width: number
  /**
   *  높이입니다.
   */
  height: number
}

/**
 * 지정한 객체가 사각형의 위치와 크기를 나타내는지 확인합니다.
 * @param o 확인할 객체입니다.
 */
export function isRect(o: unknown): boolean {
  return (
    !!o &&
    (o as Rect).left !== undefined &&
    (o as Rect).top !== undefined &&
    (o as Rect).width !== undefined &&
    (o as Rect).height !== undefined
  )
}

export default Rect
