export class GpuContext {
  public canvas?: HTMLCanvasElement;
  public context?: any;
  public canvasFormat?: any;
  public device?: any;

  constructor() {
    this.setup();
  }

  public async setup() {
    if (!window.navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.canvas = document.querySelector("canvas")!!;
    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu");
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context!!.configure({
      device: this.device,
      format: this.canvasFormat, // Match the render pipeline and pass
      alphaMode: "opaque",
    });
  }

  public createStorageBuffer(label: string, byteLength: number) {
    return this.device.createBuffer({
        label: label,
        size: byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      })
  }

  public createReadBuffer(label: string, byteLength: number) {
    return this.device.createBuffer({
      label: label,
      size: byteLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST // ✅ Readable on CPU
    });
  }
}