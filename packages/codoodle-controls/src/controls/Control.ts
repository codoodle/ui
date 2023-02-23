export interface ISize {
  width: number
  height: number
}

export interface ControlEventKeyMap {
  initialized: [undefined, CustomEvent<undefined>]
}

export function Initialization<T extends Control>(
  target: T,
  _propertyName: "initialize" | string,
  descriptor: PropertyDescriptor
): void {
  const fn = descriptor.value
  descriptor.value = function (...args: unknown[]) {
    fn.apply(this, args)
    if (this.constructor === target.constructor) {
      ;(this as { __initialized: boolean }).__initialized = true
      ;(this as T).dispatchEvent("initialized")
    }
  }
}

abstract class Control {
  private __initialized = false

  #el: HTMLElement
  #resizeObserver: ResizeObserver
  #availableSize: ISize = { width: 0, height: 0 }

  get el(): HTMLElement {
    return this.#el
  }

  get initialized(): boolean {
    return this.__initialized
  }

  get availableSize(): ISize {
    return this.#availableSize
  }

  constructor(el?: HTMLElement, resizeObserver?: ResizeObserver) {
    this.#resizeObserver =
      resizeObserver ??
      new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.#el) {
            this.measure({
              width:
                entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width,
              height:
                entry.contentBoxSize[0]?.blockSize ?? entry.contentRect.height,
            })
          }
        }
      })

    this.#el = el ?? document.createElement("div")
  }

  initialize(): void {
    if (!this.__initialized) {
      this.#resizeObserver.observe(this.#el)
    }
  }

  dispose(): void {
    if (this.__initialized) {
      this.#resizeObserver.unobserve(this.#el)
    }
  }

  measure(availableSize: ISize): void {
    const previousSize = this.#availableSize
    this.#availableSize = availableSize
    this.arrange(availableSize, previousSize)
  }

  abstract arrange(size: ISize, previousSize?: ISize): void

  addEventListener<K extends keyof ControlEventKeyMap>(
    type: K,
    listener: (e: ControlEventKeyMap[K][1]) => void
  ): void {
    this.#el.addEventListener(type, listener as EventListener, false)
  }

  dispatchEvent<K extends keyof ControlEventKeyMap>(
    type: K,
    eventInitDict?: CustomEventInit<ControlEventKeyMap[K][0]>
  ): boolean {
    return this.#el.dispatchEvent(new CustomEvent(type, eventInitDict))
  }

  removeEventListener<K extends keyof ControlEventKeyMap>(
    type: K,
    listener: (e: ControlEventKeyMap[K][1]) => void
  ): void {
    this.#el.removeEventListener(type, listener as EventListener, false)
  }
}

export default Control
