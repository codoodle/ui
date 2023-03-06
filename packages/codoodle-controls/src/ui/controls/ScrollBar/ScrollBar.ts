import "@codoodle/styles/dist/scrollBar/scrollBar.css"
import styles from "@codoodle/styles/dist/scrollBar"
import type Size from "../../Size"
import Control, { ControlEventKeyMap, Initialization } from "../Control"
import ScrollOrientation from "./ScrollOrientation"

const MINIMUM_THUMB_SIZE = 20

interface ScrollBarEventKeyMap extends ControlEventKeyMap {
  valueChanged: [ValueChangedDetail, CustomEvent<ValueChangedDetail>]
  scroll: [ScrollDetail, CustomEvent<ScrollDetail>]
}

interface ValueChangedDetail {
  newValue: number
  oldValue: number
  orientation: ScrollOrientation
}

type ScrollDetail = ValueChangedDetail

interface ScrollBar {
  addEventListener<K extends keyof ScrollBarEventKeyMap>(
    type: K,
    listener: (e: ScrollBarEventKeyMap[K][1]) => void
  ): void
  dispatchEvent<K extends keyof ScrollBarEventKeyMap>(
    type: K,
    eventInitDict?: CustomEventInit<ScrollBarEventKeyMap[K][0]>
  ): boolean
  removeEventListener<K extends keyof ScrollBarEventKeyMap>(
    type: K,
    listener: (e: ScrollBarEventKeyMap[K][1]) => void
  ): void
}

class ScrollBar extends Control {
  #orientation
  #value = 0
  #valueInitial: number | undefined = undefined
  #valueIn = 0
  #minimum = 0
  #minimumIn = 0
  #maximum = 0
  #maximumIn = 0
  #elTrack
  #elThumb
  #mouseX = 0
  #mouseY = 0

  get isHorizontal() {
    return this.#orientation === ScrollOrientation.Horizontal
  }

  get isVertical() {
    return this.#orientation === ScrollOrientation.Vertical
  }

  get orientation() {
    return this.#orientation
  }

  get value(): number {
    return this.#value
  }
  set value(value: number) {
    const valuePrev = this.#value
    this.#value = Math.max(this.#minimum, Math.min(this.#maximum, value))
    this.#valueIn = Math.max(
      this.#minimumIn,
      Math.min(
        this.#maximumIn,

        (this.#value - this.#minimum) /
          ((this.#maximum - this.#minimum) / this.#maximumIn)
      )
    )
    if (valuePrev !== this.#value) {
      this.#elThumb.style.transform = this.isHorizontal
        ? `translateX(${this.#valueIn}px)`
        : `translateY(${this.#valueIn}px)`
    }
  }

  get minimum(): number {
    return this.#minimum
  }
  set minimum(value: number) {
    this.#minimum = value
  }

  get maximum(): number {
    return this.#maximum
  }
  set maximum(value: number) {
    this.#maximum = value
  }

  constructor(
    orientation: ScrollOrientation,
    el?: HTMLElement,
    resizeObserver?: ResizeObserver
  ) {
    super(el, resizeObserver)
    this.#orientation = orientation
    this.el.classList.add(
      styles.scrollBar,
      this.isHorizontal ? styles.scrollBarHorizontal : styles.scrollBarVertical
    )
    this.el.addEventListener("mousedown", this.#handleMouseDown, false)

    this.#elTrack = document.createElement("div")
    this.#elTrack.classList.add(styles.scrollBarTrack)
    this.#elTrack.addEventListener("mousedown", this.#handleMouseDown, false)
    this.el.append(this.#elTrack)

    this.#elThumb = document.createElement("div")
    this.#elThumb.classList.add(styles.scrollBarThumb)
    this.#elThumb.addEventListener("mousedown", this.#handleMouseDown, false)
    this.#elTrack.append(this.#elThumb)
  }

  @Initialization
  override initialize(initialValue?: number): void {
    super.initialize()
    this.#valueInitial = initialValue
  }

  arrange(size: Size, previousSize?: Size): void {
    const maximum = this.#maximum - this.#minimum
    if (maximum <= 0) {
      this.el.classList.remove(styles.scrollBarScrollable)
    } else {
      this.el.classList.add(styles.scrollBarScrollable)
    }
    if (this.isHorizontal) {
      if (maximum > size.width - MINIMUM_THUMB_SIZE) {
        this.#maximumIn = Math.max(0, size.width - MINIMUM_THUMB_SIZE)
      } else {
        this.#maximumIn = maximum
      }
      this.#elThumb.style.height = `${size.height}px`
      this.#elThumb.style.width = `${size.width - this.#maximumIn}px`
    } else {
      if (maximum > size.height - MINIMUM_THUMB_SIZE) {
        this.#maximumIn = Math.max(0, size.height - MINIMUM_THUMB_SIZE)
      } else {
        this.#maximumIn = maximum
      }

      this.#elThumb.style.height = `${size.height - this.#maximumIn}px`
      this.#elThumb.style.width = `${size.width}px`
    }
    if (this.#valueInitial) {
      this.value = this.#valueInitial
      this.#valueInitial = undefined
    }

    const valuePrev = this.#value
    if (this.#valueIn > this.#maximumIn) {
      this.#valueIn = this.#maximumIn
      this.#value = this.#toValue()
    } else if (this.#valueIn < this.#minimumIn) {
      this.#valueIn = this.#minimumIn
      this.#value = this.#toValue()
    } else if (previousSize) {
      this.#value = this.#toValue()
    }
    if (valuePrev !== this.#value) {
      this.#elThumb.style.transform = this.isHorizontal
        ? `translateX(${this.#valueIn}px)`
        : `translateY(${this.#valueIn}px)`
      this.dispatchEvent("valueChanged", {
        detail: {
          newValue: this.#value,
          oldValue: valuePrev,
          orientation: this.isHorizontal
            ? ScrollOrientation.Horizontal
            : ScrollOrientation.Vertical,
        },
      })
    }
  }

  #toValue(valueIn: number = this.#valueIn): number {
    if (valueIn <= this.#minimumIn) {
      return this.#minimum
    }
    if (valueIn >= this.#maximumIn) {
      return this.#maximum
    }
    return (
      Math.floor(
        valueIn * ((this.#maximum - this.#minimum) / this.#maximumIn)
      ) + this.#minimum
    )
  }

  #handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    if (e.currentTarget === this.#elTrack) {
      const valuePrev = this.#value
      let valueInNext = valuePrev
      if (this.isHorizontal) {
        valueInNext = Math.max(
          this.#minimumIn,
          Math.min(
            this.#maximumIn,
            e.offsetX -
              Math.round((this.availableSize.width - this.#maximumIn) / 2)
          )
        )
      } else {
        valueInNext = Math.max(
          this.#minimumIn,
          Math.min(
            this.#maximumIn,
            e.offsetY -
              Math.round((this.availableSize.height - this.#maximumIn) / 2)
          )
        )
      }
      const valueNext = this.#toValue(valueInNext)
      if (valuePrev !== valueNext) {
        if (
          this.dispatchEvent("scroll", {
            cancelable: true,
            detail: {
              newValue: valueNext,
              oldValue: valuePrev,
              orientation: this.isHorizontal
                ? ScrollOrientation.Horizontal
                : ScrollOrientation.Vertical,
            },
          })
        ) {
          this.#valueIn = valueInNext
          this.#value = valueNext
          this.#elThumb.style.transform = this.isHorizontal
            ? `translateX(${this.#valueIn}px)`
            : `translateY(${this.#valueIn}px)`
          this.dispatchEvent("valueChanged", {
            detail: {
              newValue: this.#value,
              oldValue: valuePrev,
              orientation: this.isHorizontal
                ? ScrollOrientation.Horizontal
                : ScrollOrientation.Vertical,
            },
          })
        }
      }
    }
    this.#mouseX = e.screenX - this.#valueIn
    this.#mouseY = e.screenY - this.#valueIn
    window.addEventListener("mousemove", this.#handleMouseMove, false)
    window.addEventListener("mouseup", this.#handleMouseUp, false)
  }

  #handleMouseMove = (e: MouseEvent) => {
    const valuePrev = this.#value
    let valueInNext = valuePrev
    if (this.isHorizontal) {
      valueInNext = Math.max(
        this.#minimumIn,
        Math.min(this.#maximumIn, e.screenX - this.#mouseX)
      )
    } else {
      valueInNext = Math.max(
        this.#minimumIn,
        Math.min(this.#maximumIn, e.screenY - this.#mouseY)
      )
    }
    const valueNext = this.#toValue(valueInNext)
    if (valuePrev !== valueNext) {
      if (
        this.dispatchEvent("scroll", {
          cancelable: true,
          detail: {
            newValue: valueNext,
            oldValue: valuePrev,
            orientation: this.isHorizontal
              ? ScrollOrientation.Horizontal
              : ScrollOrientation.Vertical,
          },
        })
      ) {
        this.#valueIn = valueInNext
        this.#value = valueNext
        this.#elThumb.style.transform = this.isHorizontal
          ? `translateX(${this.#valueIn}px)`
          : `translateY(${this.#valueIn}px)`
        this.dispatchEvent("valueChanged", {
          detail: {
            newValue: this.#value,
            oldValue: valuePrev,
            orientation: this.isHorizontal
              ? ScrollOrientation.Horizontal
              : ScrollOrientation.Vertical,
          },
        })
      }
    }
  }

  #handleMouseUp = () => {
    window.removeEventListener("mousemove", this.#handleMouseMove, false)
    window.removeEventListener("mouseup", this.#handleMouseUp, false)
  }
}

export default ScrollBar

export class HorizontalScrollBar extends ScrollBar {
  constructor(el?: HTMLElement, resizeObserver?: ResizeObserver) {
    super(ScrollOrientation.Horizontal, el, resizeObserver)
  }

  @Initialization
  override initialize(initialValue?: number): void {
    super.initialize(initialValue)
  }
}

export class VerticalScrollBar extends ScrollBar {
  constructor(el?: HTMLElement, resizeObserver?: ResizeObserver) {
    super(ScrollOrientation.Vertical, el, resizeObserver)
  }

  @Initialization
  override initialize(initialValue?: number): void {
    super.initialize(initialValue)
  }
}
