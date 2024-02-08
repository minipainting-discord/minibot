declare module "friendly-node-cron" {
  export default (string: string) => string
}

declare module "dicebag" {
  type Pool = unknown
  export function parse(expression: string): Pool
  export function pool(pool: Pool): Array<number>
}
