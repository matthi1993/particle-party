export class GpuContext {
  public canvas!: HTMLCanvasElement;
  public context?: any;
  public canvasFormat?: any;
  public device?: any;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public async setup() {
    if (!window.navigator.gpu) {
      alert("WebGPU is not supported");
      throw new Error("WebGPU not supported on this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      alert("No appropriate GPUAdapter found.");
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu");
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context!!.configure({
      device: this.device,
      format: this.canvasFormat,
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
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
  }
}