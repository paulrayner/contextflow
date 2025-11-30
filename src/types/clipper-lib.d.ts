declare module 'clipper-lib' {
  namespace ClipperLib {
    interface IntPoint {
      X: number
      Y: number
    }

    const Clipper: any
    const ClipperOffset: new (miterLimit?: number, arcTolerance?: number) => any
    const Paths: new () => IntPoint[][]
    const Path: new () => IntPoint[]
    const JoinType: {
      jtSquare: number
      jtRound: number
      jtMiter: number
    }
    const EndType: {
      etClosedPolygon: number
      etClosedLine: number
      etOpenButt: number
      etOpenSquare: number
      etOpenRound: number
    }
    const PolyType: any
    const PolyFillType: any
    const ClipType: any
  }

  export = ClipperLib
}
