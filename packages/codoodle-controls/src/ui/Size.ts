/**
 * 크기를 정의하는 너비와 높이를 나타냅니다.
 */
interface Size {
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
 * 지정한 객체가 크기를 정의하는 너비와 높이를 나타내는지 확인합니다.
 * @param o 확인할 객체입니다.
 */
export function isSize(o: unknown): boolean {
  return (
    !!o && (o as Size).width !== undefined && (o as Size).height !== undefined
  )
}

export default Size
